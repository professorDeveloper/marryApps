import 'dart:convert';

import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/core/api/api.dart';
import 'package:mary_ai_pos/core/auth/storage/token_storage_impl.dart';
import 'package:mary_ai_pos/core/components/flush_bars.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/core/utils/helper/helper_widget.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/auth/auth_cubit.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/bloc/user_bloc.dart';
import 'package:mary_ai_pos/features/view/main/data/models/close_shift/close_shift_request_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/open_shift/open_shift_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/shift/shift_response_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/usecase/check_shift_usecase.dart';
import 'package:mary_ai_pos/features/view/main/domain/usecase/close_shift_usecase.dart';
import 'package:mary_ai_pos/core/service/printer/printer_service.dart';
import 'package:mary_ai_pos/features/view/main/domain/usecase/open_shift_usecase.dart';
import 'package:shared_preferences/shared_preferences.dart';

part 'shift_event.dart';
part 'shift_state.dart';
part 'shift_bloc.freezed.dart';

class ShiftBloc extends Bloc<ShiftEvent, ShiftState> {
  late final CheckShiftUsecase _checkShiftUsecase;
  late final OpenShiftUsecase _openShiftUsecase;
  late final CloseShiftUsecase _closeShiftUsecase;
  final SharedPreferences _prefs;
  final AppTokenStorage _tokenStorage;
  final PrinterService _printerService;
  //
  ShiftBloc({
    required CheckShiftUsecase checkShiftUsecase,
    required OpenShiftUsecase openShiftUsecase,
    required CloseShiftUsecase closeShiftUsecase,
    required SharedPreferences prefs,
    required AppTokenStorage tokenStorage,
    required PrinterService printerService,
  }) : _checkShiftUsecase = checkShiftUsecase,
       _openShiftUsecase = openShiftUsecase,
       _closeShiftUsecase = closeShiftUsecase,
       _prefs = prefs,
       _tokenStorage = tokenStorage,
       _printerService = printerService,
       super(const ShiftState()) {
    on<_Started>(_started);
    on<_CheckShift>(_checkShift);
    on<_UpdateCashSum>(_updateCashSum);
    on<_UpdateCardSum>(_updateCardSum);
    on<_UpdateSumType>(_updateSumType);
    on<_OpenShift>(_openShift);
    on<_CloseShift>(_closeShift);
    on<_PrintShiftReport>(_printShiftReport);
  }

  static const String _kLocalShiftKey = 'pos_local_active_shift';

  ShiftResponseModel? _readLocalShift() {
    try {
      final raw = _prefs.getString(_kLocalShiftKey);
      if (raw == null || raw.isEmpty) return null;
      final json = jsonDecode(raw);
      if (json is! Map<String, dynamic>) return null;
      return ShiftResponseModel.fromJson(json);
    } catch (_) {
      return null;
    }
  }

  Future<void> _writeLocalShift(ShiftResponseModel shift) async {
    try {
      await _prefs.setString(_kLocalShiftKey, jsonEncode(shift.toJson()));
    } catch (_) {}
  }

  Future<void> _clearLocalShift() async {
    try {
      await _prefs.remove(_kLocalShiftKey);
    } catch (_) {}
  }

  static String? _jwtClaim(String jwt, String key) {
    try {
      final parts = jwt.split('.');
      if (parts.length < 2) return null;
      final payload = parts[1];
      final normalized = base64Url.normalize(payload);
      final decoded = utf8.decode(base64Url.decode(normalized));
      final obj = jsonDecode(decoded);
      if (obj is! Map) return null;
      final v = obj[key];
      if (v == null) return null;
      return v.toString();
    } catch (_) {
      return null;
    }
  }

  Future<String> _resolveCashRegisterId() async {
    final token = await _tokenStorage.readAccessToken();
    if (token == null || token.isEmpty) return '';
    return _jwtClaim(token, 'cash_register_id') ?? '';
  }

  String _resolveCashierId() {
    final ctx = navigatorKey.currentContext;
    final id = ctx?.read<UserBloc>().state.userMOdel?.id ?? '';
    return id;
  }

  Future<void> _printShiftCloseFromState(ShiftState s) async {
    final shift = s.shift;
    if (shift == null) return;
    final ctx = navigatorKey.currentContext;
    final name = ctx?.read<UserBloc>().state.userMOdel?.fullName ?? '';
    await _printerService.printShiftCloseReceipt(
      shiftId: shift.id,
      openedAt: shift.openedAt,
      closingCard: 0,
      cashierLabel: name.isEmpty ? shift.cashierId : name,
    );
  }

  Future<void> _printShiftReport(
    _PrintShiftReport event,
    Emitter<ShiftState> emit,
  ) async {
    await _printShiftCloseFromState(state);
  }

  Future<void> _closeShift(_CloseShift event, Emitter<ShiftState> emit) async {
    final shift = state.shift;
    if (shift == null) return;

    /// Offline rejimda ochilgan smena — `local_...` ID serverda yo'q, UUID emas.
    /// Yopishda API chaqirsak 500 (invalid UUID) beradi.
    if (shift.id.startsWith('local_')) {
      emit(state.copyWith(status: Status.LOADING));
      await _printShiftCloseFromState(state);
      await _clearLocalShift();
      if (emit.isDone) return;
      showSuccessMessage(
        navigatorKey.currentContext!,
        'Smena yopildi (offline ochilgan, serverga yuborilmaydi).',
      );
      emit(
        state.copyWith(
          status: Status.SUCCESS,
          shift: null,
          cardSum: '0',
          cashSum: '0',
        ),
      );
      return;
    }

    emit(state.copyWith(status: Status.LOADING));
    final response = await _closeShiftUsecase.call(
      CloseShiftRequestModel(
        shiftId: shift.id,
        closingCard: 0,
        closingCash: 0,
      ),
    );
    if (emit.isDone) return;

    // Success path
    if (response.isRight()) {
      await _printShiftCloseFromState(state);
      navigatorKey.currentContext!.read<AuthCubit>().logout(
        onSuccess: () => Navigator.pushNamedAndRemoveUntil(
          navigatorKey.currentContext!,
          AppRoutes.loginPinScreen,
          (route) => false,
        ),
      );
      showSuccessMessage(
        navigatorKey.currentContext!,
        "Smena muvafaqqiyatli yopildi",
      );
      emit(
        state.copyWith(
          status: Status.SUCCESS,
          shift: null,
          cardSum: '0',
          cashSum: '0',
        ),
      );
      await _clearLocalShift();
      return;
    }

    // Failure path (offline-friendly fallback)
    final local = _readLocalShift();
    if (local != null && (state.shift?.id == local.id)) {
      await _clearLocalShift();
      if (emit.isDone) return;
      showSuccessMessage(
        navigatorKey.currentContext!,
        "Smena yopildi (offline).",
      );
      emit(
        state.copyWith(
          status: Status.SUCCESS,
          shift: null,
          cardSum: '0',
          cashSum: '0',
        ),
      );
      return;
    }

    response.fold(
      (l) {
        showErrorMessage(
          navigatorKey.currentContext!,
          l.getLocalizedMessage(navigatorKey.currentContext!),
        );
        emit(state.copyWith(status: Status.ERROR, failure: l));
      },
      (_) => emit(state.copyWith(status: Status.ERROR)),
    );
  }

  Future<void> _openShift(_OpenShift evente, Emitter<ShiftState> emit) async {
    emit(state.copyWith(status: Status.LOADING));
    final cashRegisterId = await _resolveCashRegisterId();
    final cashierId = _resolveCashierId();
    final openCash = int.tryParse(state.cashSum) ?? 0;
    final openCard = int.tryParse(state.cardSum) ?? 0;

    final response = await _openShiftUsecase.call(
      OpenShiftModel(
        cashRegisterId: cashRegisterId,
        cashierId: cashierId,
        openCardSum: openCard,
        openCashSum: openCash,
      ),
    );
    if (emit.isDone) return;

    // Success path
    if (response.isRight()) {
      final r = response.getOrElse(
        () => const ShiftResponseModel(),
      );
      await _writeLocalShift(r);
      Navigator.pushNamedAndRemoveUntil(
        navigatorKey.currentContext!,
        AppRoutes.mainScreen,
        (router) => true,
      );
      showSuccessMessage(
        navigatorKey.currentContext!,
        "Smena muvafaqqiyatli ochildi",
      );
      emit(
        state.copyWith(
          status: Status.SUCCESS,
          shift: r,
          cardSum: '0',
          cashSum: '0',
        ),
      );
      return;
    }

    // Failure path → offline-friendly local shift
    final now = DateTime.now();
    final local = ShiftResponseModel(
      id: 'local_${now.millisecondsSinceEpoch}',
      cashRegisterId: cashRegisterId,
      cashierId: cashierId,
      openedAt: now,
      openingCash: openCash,
      openinCard: openCard,
      createdAt: now,
      updatedAt: now,
    );
    await _writeLocalShift(local);
    if (emit.isDone) return;
    Navigator.pushNamedAndRemoveUntil(
      navigatorKey.currentContext!,
      AppRoutes.mainScreen,
      (router) => true,
    );
    showSuccessMessage(
      navigatorKey.currentContext!,
      "Smena ochildi (offline).",
    );
    emit(
      state.copyWith(
        status: Status.SUCCESS,
        shift: local,
        cardSum: '0',
        cashSum: '0',
      ),
    );
  }

  void _updateCardSum(_UpdateCardSum event, emit) {
    if (int.tryParse(event.value) != null) {
      String value = state.cardSum == '0'
          ? event.value
          : state.cardSum + event.value;
      emit(state.copyWith(cardSum: value));
    } else if (event.value == "delete") {
      String value = state.cardSum.length == 1
          ? '0'
          : state.cardSum.substring(0, state.cardSum.length - 1);
      emit(state.copyWith(cardSum: value));
    }
  }

  void _updateCashSum(_UpdateCashSum event, emit) {
    if (int.tryParse(event.value) != null) {
      String value = state.cashSum == '0'
          ? event.value
          : state.cashSum + event.value;
      emit(state.copyWith(cashSum: value));
    } else if (event.value == "delete") {
      String value = state.cashSum.length == 1
          ? '0'
          : state.cashSum.substring(0, state.cashSum.length - 1);
      emit(state.copyWith(cashSum: value));
    }
  }

  void _updateSumType(_UpdateSumType event, emit) {
    if (state.sum != event.type) {
      emit(state.copyWith(sum: event.type));
    }
  }

  Future<void> _checkShift(_CheckShift event, Emitter<ShiftState> emit) async {
    emit(state.copyWith(status: Status.LOADING));
    final cashRegisterId = await _resolveCashRegisterId();
    if (emit.isDone) return;
    if (cashRegisterId.isEmpty) {
      final local = _readLocalShift();
      emit(state.copyWith(status: Status.SUCCESS, shift: local));
      return;
    }

    final response = await _checkShiftUsecase.call(cashRegisterId);
    if (emit.isDone) return;

    // On a real failure (parse/network/server) we must NOT assume "no shift" —
    // the server may already have an open shift. Keep the last-known local shift
    // if present, and surface the failure without redirecting to the open-shift flow.
    if (response.isLeft()) {
      final failure = response.swap().getOrElse(() => const UnknownFailure());
      final local = _readLocalShift();
      final fallback = local ?? state.shift;
      emit(
        state.copyWith(
          status: fallback != null ? Status.SUCCESS : Status.ERROR,
          shift: fallback,
          failure: failure,
        ),
      );
      return;
    }

    ShiftResponseModel? resolved;
    response.fold((_) {}, (r) => resolved = r);

    // Genuine "no active shift" from server (Right(null)) → open-shift flow.
    resolved ??= _readLocalShift();
    if (resolved == null) {
      final ctx = navigatorKey.currentContext;
      if (ctx != null && ctx.mounted) {
        Navigator.pushNamed(ctx, AppRoutes.closeShiftScreen);
      }
      await _clearLocalShift();
    } else {
      await _writeLocalShift(resolved!);
    }

    if (emit.isDone) return;
    emit(state.copyWith(status: Status.SUCCESS, shift: resolved));
  }

  void _started(_Started event, Emitter<ShiftState> emit) {
    final local = _readLocalShift();
    emit(ShiftState(shift: local));
  }
}
