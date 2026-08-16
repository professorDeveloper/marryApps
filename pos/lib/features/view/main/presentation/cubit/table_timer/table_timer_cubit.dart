import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/api/dio_client.dart';
import 'package:mary_ai_pos/core/api/list_api.dart';
import 'package:mary_ai_pos/features/view/main/data/models/open_order/open_order_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/table_timer/table_timer_response_model.dart';

part 'table_timer_state.dart';

class TableTimerCubit extends Cubit<TableTimerState> {
  TableTimerCubit(this._client) : super(const TableTimerState());

  final DioClient _client;
  Timer? _serverSyncTimer;
  Timer? _uiTickTimer;
  String? _activeOrderId;

  int _baseTotalActiveSec = 0;
  DateTime? _lastSyncAt;
  DateTime? _lastBillPausesFetchAt;
  String? _lastBillPausesOrderId;

  static const Duration _serverSyncInterval = Duration(seconds: 60);
  static const Duration _billPausesThrottle = Duration(seconds: 60);

  void _cancelTimers() {
    _serverSyncTimer?.cancel();
    _serverSyncTimer = null;
    _uiTickTimer?.cancel();
    _uiTickTimer = null;
  }

  void _ensureServerSync() {
    final id = _activeOrderId;
    if (id == null) return;
    _serverSyncTimer ??= Timer.periodic(_serverSyncInterval, (_) {
      final oid = _activeOrderId;
      if (oid != null) {
        fetchTimer(orderId: oid);
      }
    });
  }

  void _startUiTickIfRunning(TableTimerResponse? t) {
    _uiTickTimer?.cancel();
    _uiTickTimer = null;
    if (t == null) return;
    if (t.stateNormalized != 'running') return;

    _uiTickTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      final syncAt = _lastSyncAt;
      if (syncAt == null) return;
      final elapsed = DateTime.now().difference(syncAt).inSeconds;
      final display = _baseTotalActiveSec + (elapsed < 0 ? 0 : elapsed);
      if (!isClosed) {
        emit(state.copyWith(displayActiveSec: display));
      }
    });
  }

  void _applyTimer(TableTimerResponse t, {bool forceBillPauses = false}) {
    _lastSyncAt = DateTime.now();
    _baseTotalActiveSec = t.totalActiveSec;
    emit(
      state.copyWith(
        isLoading: false,
        shouldShow: true,
        timer: t,
        displayActiveSec: t.totalActiveSec,
        errorMessage: null,
      ),
    );
    // Terminal yopiq holatda 60s polling shart emas — timer endi o'zgarmaydi.
    // Frozen state-ni faqat tasodifiy server tomonida tiklash uchun emas,
    // resurslarni tejash uchun ham polling to'xtatamiz.
    if (t.stateNormalized == 'closed') {
      _serverSyncTimer?.cancel();
      _serverSyncTimer = null;
    } else {
      _ensureServerSync();
    }
    _startUiTickIfRunning(t);
    // Bill API-dan pause_periods-ni yangilash
    _fetchBillPauses(force: forceBillPauses);
  }

  /// Bill API-dan pause_periods-ni olib state-ga yozadi.
  /// DetailBloc ham `/bills/{id}` chaqiradi — duplikat bo'lmasin uchun
  /// bir xil orderId uchun 60s ichida takroriy chaqiriq bloklanadi.
  Future<void> _fetchBillPauses({bool force = false}) async {
    final orderId = _activeOrderId;
    if (orderId == null || orderId.isEmpty) return;

    // Throttle: oxirgi chaqiriq shu orderId uchun 60s ichida bo'lsa — o'tkazamiz
    if (!force &&
        _lastBillPausesOrderId == orderId &&
        _lastBillPausesFetchAt != null &&
        DateTime.now().difference(_lastBillPausesFetchAt!) <
            _billPausesThrottle) {
      return;
    }
    _lastBillPausesOrderId = orderId;
    _lastBillPausesFetchAt = DateTime.now();

    try {
      final res = await _client.get('/api/v1/bills/$orderId');
      if (isClosed) return;
      // Stale: order almashgan bo'lsa — eski javobni tashlaymiz
      if (_activeOrderId != orderId) return;
      final raw = res.data['data'];
      if (raw is! Map<String, dynamic>) return;
      final rawPauses = raw['pause_periods'];
      if (rawPauses is! List) return;
      final pauses = rawPauses
          .whereType<Map<String, dynamic>>()
          .map(PauseInterval.fromJson)
          .toList();
      if (!isClosed) {
        emit(state.copyWith(billPauses: pauses));
      }
    } catch (_) {
      // Xatolik bo'lsa — jimgina o'tib ketamiz
    }
  }

  /// Buyurtma almashganda chaqiriladi. Timer faqat `dine_in` (yoki tur noma’lum) uchun so‘raladi.
  Future<void> bindOrder(OpenOrderModel? order) async {
    _cancelTimers();
    _activeOrderId = null;
    _lastSyncAt = null;
    _baseTotalActiveSec = 0;

    if (order == null || order.id.isEmpty) {
      emit(const TableTimerState());
      return;
    }

    if (order.isTerminalOrderStatus) {
      emit(const TableTimerState());
      return;
    }

    final ot = order.orderType?.trim().toLowerCase();
    if (ot != null && ot.isNotEmpty && ot != 'dine_in') {
      emit(const TableTimerState(shouldShow: false));
      return;
    }

    // `GET/POST .../table-timer` ikki holatda chaqiriladi:
    //   1) Stol time_based — live timer ko'rsatish uchun.
    //   2) Order time-based stoldan simple stolga ko'chirilgan va
    //      `table_amount` muzlatilgan — frozen UI ko'rsatish uchun.
    // Ikkalasi ham bo'lmasa, GET yubormaymiz (400 spam yo'q).
    if (!order.isTimeBasedTable && !order.hasFrozenTableAmount) {
      emit(const TableTimerState(shouldShow: false));
      return;
    }

    _activeOrderId = order.id;
    // Darhol 0:00 ko'rsat — API javobini kutmasdan
    emit(state.copyWith(shouldShow: true, displayActiveSec: 0));
    await fetchTimer(orderId: order.id, showLoading: false);
  }

  Future<void> fetchTimer({
    required String orderId,
    bool showLoading = false,
  }) async {
    _activeOrderId = orderId;
    // Pre-emit 0:00 immediately so UI shows something while waiting for API
    if (!state.shouldShow) {
      emit(state.copyWith(shouldShow: true, displayActiveSec: 0));
    }
    if (showLoading) {
      emit(state.copyWith(isLoading: true, errorMessage: null));
    }
    try {
      final res = await _client.get(ListAPI.orderTableTimer(orderId));
      if (isClosed) return;
      if (_activeOrderId != orderId) return;
      final raw = res.data['data'];
      if (raw is! Map<String, dynamic>) {
        emit(
          state.copyWith(
            isLoading: false,
            shouldShow: false,
            clearTimer: true,
            clearDisplayActiveSec: true,
          ),
        );
        return;
      }
      final t = TableTimerResponse.fromJson(raw);
      // Order time-based stoldan simple-ga ko'chirilgan bo'lsa, hozirgi
      // `table_type` `simple` keladi, lekin `state == closed` + `final_amount`
      // muzlatilgan summani saqlaydi. Bu holatda block-ni yashirmasdan
      // frozen UI ko'rsatish kerak.
      final hasFrozenAmount =
          t.isFrozenClosed && parseAmountToInt(t.finalAmount) > 0;
      if (!t.isTimeBasedTable && !hasFrozenAmount) {
        emit(
          state.copyWith(
            isLoading: false,
            shouldShow: false,
            clearTimer: true,
            clearDisplayActiveSec: true,
          ),
        );
        _cancelTimers();
        return;
      }
      _applyTimer(t);
    } on DioException catch (e) {
      if (isClosed) return;
      if (_activeOrderId != orderId) return;
      if (e.response?.statusCode == 400 || e.response?.statusCode == 404) {
        _cancelTimers();
        _activeOrderId = null;
        emit(
          state.copyWith(
            isLoading: false,
            shouldShow: false,
            clearTimer: true,
            clearDisplayActiveSec: true,
          ),
        );
        return;
      }
      emit(
        state.copyWith(
          isLoading: false,
          errorMessage: e.message ?? 'Table timer xatosi',
        ),
      );
    } catch (e) {
      if (isClosed) return;
      if (_activeOrderId != orderId) return;
      emit(
        state.copyWith(
          isLoading: false,
          shouldShow: false,
          clearTimer: true,
          clearDisplayActiveSec: true,
          errorMessage: e.toString(),
        ),
      );
    }
  }

  /// Bo'sh order yaratadi va timerni boshlaydi (time-based free stol uchun).
  /// Returns orderId on success, null on failure.
  /// Agar server 409 qaytarsa ("stol allaqachon faol buyurtmaga ega"),
  /// xato xabaridan mavjud orderId'ni ajratib olib, shu ID bilan davom etadi —
  /// shunda foydalanuvchi takroriy 409 olmaydi.
  Future<String?> createTimedOrderAndStart({
    required String tableId,
    required int guestCount,
  }) async {
    _cancelTimers();
    _activeOrderId = null;
    _lastSyncAt = null;
    _baseTotalActiveSec = 0;
    emit(
      state.copyWith(shouldShow: true, isLoading: true, displayActiveSec: 0),
    );
    try {
      final orderRes = await _client.post(
        ListAPI.orders,
        data: {
          'table_id': tableId,
          'guest_count': guestCount,
          'items': <dynamic>[],
          'status': 'open',
          'order_type': 'dine_in',
          'comment': '',
        },
      );
      final data = orderRes.data['data'];
      final orderId = (data is Map<String, dynamic>)
          ? (data['id'] as String? ?? data['order_id'] as String?)
          : null;
      if (orderId == null || orderId.isEmpty) {
        if (!isClosed)
          emit(state.copyWith(isLoading: false, shouldShow: false));
        return null;
      }
      _activeOrderId = orderId;
      emit(state.copyWith(isLoading: false));
      await startTimer();
      return orderId;
    } on DioException catch (e) {
      // 409 Conflict: stolda mavjud faol buyurtma bor.
      // Javob: {"error": "stol already has an active buyurtma: <uuid>", ...}
      if (e.response?.statusCode == 409) {
        final raw = e.response?.data;
        final msg = raw is Map
            ? (raw['error'] ?? raw['message']).toString()
            : '';
        final uuidMatch = RegExp(
          r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
        ).firstMatch(msg);
        final existingOrderId = uuidMatch?.group(0);
        if (existingOrderId != null && existingOrderId.isNotEmpty) {
          _activeOrderId = existingOrderId;
          emit(state.copyWith(isLoading: false));
          // Timer holatini sinxronlaymiz — allaqachon ishlayotgan bo'lishi mumkin
          await fetchTimer(orderId: existingOrderId);
          return existingOrderId;
        }
      }
      if (!isClosed) {
        emit(
          state.copyWith(
            isLoading: false,
            shouldShow: false,
            errorMessage: e.message ?? 'Order yaratishda xato',
          ),
        );
      }
      return null;
    } catch (e) {
      if (!isClosed) {
        emit(
          state.copyWith(
            isLoading: false,
            shouldShow: false,
            errorMessage: e.toString(),
          ),
        );
      }
      return null;
    }
  }

  Future<void> startTimer() async {
    final id = _activeOrderId;
    if (id == null) return;
    emit(state.copyWith(isMutating: true, errorMessage: null));
    try {
      final res = await _client.post(ListAPI.orderTableTimerStart(id));
      if (isClosed || _activeOrderId != id) return;
      final raw = res.data['data'];
      if (raw is Map<String, dynamic>) {
        final t = TableTimerResponse.fromJson(raw);
        emit(state.copyWith(isMutating: false));
        _applyTimer(t, forceBillPauses: true);
      } else {
        await fetchTimer(orderId: id);
        await _fetchBillPauses(force: true);
      }
    } on DioException catch (e) {
      if (isClosed || _activeOrderId != id) return;
      emit(
        state.copyWith(
          isMutating: false,
          errorMessage: e.message ?? 'Start xatosi',
        ),
      );
    } catch (e) {
      if (isClosed || _activeOrderId != id) return;
      emit(state.copyWith(isMutating: false, errorMessage: e.toString()));
    }
  }

  Future<void> pauseTimer() async {
    final id = _activeOrderId;
    if (id == null) return;
    emit(state.copyWith(isMutating: true, errorMessage: null));
    try {
      final res = await _client.post(ListAPI.orderTableTimerPause(id));
      if (isClosed || _activeOrderId != id) return;
      final raw = res.data['data'];
      if (raw is Map<String, dynamic>) {
        final t = TableTimerResponse.fromJson(raw);
        emit(state.copyWith(isMutating: false));
        _applyTimer(t, forceBillPauses: true);
      } else {
        await fetchTimer(orderId: id);
        await _fetchBillPauses(force: true);
      }
    } on DioException catch (e) {
      if (isClosed || _activeOrderId != id) return;
      emit(
        state.copyWith(
          isMutating: false,
          errorMessage: e.message ?? 'Pause xatosi',
        ),
      );
    } catch (e) {
      if (isClosed || _activeOrderId != id) return;
      emit(state.copyWith(isMutating: false, errorMessage: e.toString()));
    }
  }

  Future<void> resumeTimer() async {
    final id = _activeOrderId;
    if (id == null) return;
    // Timer hali boshlanmagan → /start chaqiramiz
    if (state.timer == null || state.timer!.stateNormalized == 'none') {
      await startTimer();
      return;
    }
    emit(state.copyWith(isMutating: true, errorMessage: null));
    try {
      final res = await _client.post(ListAPI.orderTableTimerResume(id));
      if (isClosed || _activeOrderId != id) return;
      final raw = res.data['data'];
      if (raw is Map<String, dynamic>) {
        final t = TableTimerResponse.fromJson(raw);
        emit(state.copyWith(isMutating: false));
        _applyTimer(t, forceBillPauses: true);
      } else {
        await fetchTimer(orderId: id);
        await _fetchBillPauses(force: true);
      }
    } on DioException catch (e) {
      if (isClosed || _activeOrderId != id) return;
      emit(
        state.copyWith(
          isMutating: false,
          errorMessage: e.message ?? 'Resume xatosi',
        ),
      );
    } catch (e) {
      if (isClosed || _activeOrderId != id) return;
      emit(state.copyWith(isMutating: false, errorMessage: e.toString()));
    }
  }

  @override
  Future<void> close() {
    _cancelTimers();
    return super.close();
  }
}
