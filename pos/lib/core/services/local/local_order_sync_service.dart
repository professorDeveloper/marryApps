import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:mary_ai_pos/core/api/dio_client.dart';
import 'package:mary_ai_pos/core/api/list_api.dart';
import 'package:mary_ai_pos/core/services/connectivity/connectivity_cubit.dart';
import 'package:mary_ai_pos/core/services/local/local_order_store.dart';
import 'package:mary_ai_pos/core/services/offline_queue/offline_queue_service.dart';

/// Lokal buyurtmalarni cloudga surib boradigan jarayon (outbox drainer).
///
/// Eski `OfflineQueueService` dan uchta muhim farqi bor — uchalasi ham
/// haqiqiy pul yo'qolishining oldini oladi:
///
/// 1. **Buyurtma `id` klientda generatsiya qilinadi va o'zgarmaydi.** Backend
///    `CreateOrderRequest.ID` ni qabul qiladi va o'sha id bilan buyurtma bor
///    bo'lsa uni qaytaradi (`order.go:187-206`). Ya'ni javob yo'qolib qayta
///    yuborilsa ham dublikat tushmaydi.
///
/// 2. **Offline paytda urinish sanalmaydi.** Internet yo'qligi buyurtmaning
///    aybi emas — aks holda bir kecha offline turgan terminal ertalab hamma
///    narsani "dead letter" deb belgilab qo'yardi.
///
/// 3. **Hech narsa jimgina o'chirilmaydi.** Cloud rad etsa yozuv `deadLetter`
///    bo'ladi va kassir ekranida ko'rinadi. Eski xatti-harakat — `_box.delete()`
///    — sotuvni izsiz yo'qotardi.
class LocalOrderSyncService {
  /// Shundan keyin ham o'tmasa — qo'lda aralashuv kerak.
  static const _maxAttempts = 8;

  final DioClient _client;
  final LocalOrderStore _store;
  final ConnectivityCubit _connectivity;

  /// Eski navbat (to'lovlar va band stolga qo'shilgan qatorlar). Uni ham
  /// shu jarayon suradi.
  ///
  /// Ilgari uning yagona chaqiruvchisi `AppScaffold.initState` ichidagi
  /// connectivity tinglovchisi edi — ya'ni navbatning taqdiri widget
  /// daraxtiga bog'liq edi. `ConnectivityCubit` `super(true)` bilan
  /// boshlanadi va `initDi()` paytida, hech qanday widget obuna
  /// bo'lishidan oldin emit qiladi; stream esa replay qilmaydi. Natijada
  /// interneti bor holda sovuq start qilingan POS'da navbat **umuman**
  /// surilmasdi va offline olingan naqd to'lov Hive'da cheksiz yotardi.
  final OfflineQueueService? _legacyQueue;

  Timer? _timer;
  bool _draining = false;
  StreamSubscription<bool>? _connSub;

  final _changeController = StreamController<void>.broadcast();

  LocalOrderSyncService({
    required DioClient client,
    required LocalOrderStore store,
    required ConnectivityCubit connectivity,
    OfflineQueueService? legacyQueue,
  })  : _client = client,
        _store = store,
        _connectivity = connectivity,
        _legacyQueue = legacyQueue;

  /// Sinxronizatsiya holati o'zgarganda UI yangilanishi uchun.
  Stream<void> get onChanged => _changeController.stream;

  void start({Duration interval = const Duration(seconds: 30)}) {
    _timer?.cancel();
    _timer = Timer.periodic(interval, (_) => drain());
    // Internet qaytishi bilan darhol urinamiz — 30 soniya kutmaymiz.
    //
    // Diqqat: `connectivity_plus` faqat interfeys borligini ko'radi, WAN
    // haqiqatan ishlayotganini emas. Restoranda WiFi bor, internet yo'q
    // holatda `isOnline == true` bo'ladi va yuborish tarmoq xatosi bilan
    // tugaydi — bu `_isNetworkError` orqali urinish sanalmasdan qayta
    // navbatga qo'yiladi, ya'ni to'g'ri ishlaydi.
    _connSub = _connectivity.stream.listen((online) {
      if (online) drain();
    });
    drain();
  }

  Future<void> dispose() async {
    _timer?.cancel();
    await _connSub?.cancel();
    if (!_changeController.isClosed) await _changeController.close();
  }

  /// Kutayotgan buyurtmalarni birma-bir cloudga yuboradi.
  Future<void> drain() async {
    if (_draining) return;
    if (!_connectivity.isOnline) return;

    _draining = true;
    try {
      final pending = _store.pendingSync();
      for (final order in pending) {
        // Yuborish o'rtasida internet uzilsa — qolganini keyingi safar.
        if (!_connectivity.isOnline) break;
        await _push(order);
      }

      // Eski navbat buyurtmalardan KEYIN suriladi: undagi to'lov o'z
      // buyurtmasi cloudda paydo bo'lgandan keyingina o'tadi.
      final legacy = _legacyQueue;
      final hadLegacy = legacy != null && legacy.hasItems;
      if (hadLegacy && _connectivity.isOnline) {
        await legacy.syncAll(_client);
      }

      if (pending.isNotEmpty || hadLegacy) _changeController.add(null);
    } finally {
      _draining = false;
    }
  }

  /// Ikki bosqich: avval buyurtmaning o'zi (qatorsiz), keyin qatorlar deltasi.
  ///
  /// Nega ajratilgan: backend `CreateOrder` (`order.go:189-206`) mavjud `id`
  /// ni ko'rsa buyurtmani qaytaradi va **so'rovdagi qatorlarga qaramaydi**.
  /// Ilgari qatorlar yaratish so'roviga qo'shib yuborilardi, ofitsiant
  /// keyin taom qo'shganda esa yozuv qaytadan `pending` bo'lib o'sha
  /// yaratish so'rovi takrorlanardi — cloud mavjud buyurtmani qaytarardi,
  /// yangi qatorlar esa hech qayerga tushmasdi. Lokalda hisob to'g'ri,
  /// cloudda tushum va sklad kam bo'lardi.
  Future<void> _push(LocalOrder order) async {
    try {
      if (!order.cloudCreated) {
        await _client.post(ListAPI.orders, data: order.toCreateRequest());
        await _store.markCloudCreated(order.id);
        if (kDebugMode) debugPrint('[OrderSync] ${order.id} created on cloud');
      }

      // Qayta o'qiymiz — yuqoridagi yozuv `cloudCreated` ni o'zgartirdi.
      final current = _store.getById(order.id) ?? order;
      final delta = current.unsyncedItems;
      if (delta.isEmpty) {
        await _store.markSynced(order.id);
        return;
      }

      await _client.post(
        ListAPI.orderItems(order.id),
        data: LocalOrder.itemsRequest(delta),
      );
      await _store.markItemsSynced(
        order.id,
        delta.map((it) => it['id']?.toString() ?? '').toList(),
      );
      if (kDebugMode) {
        debugPrint('[OrderSync] ${order.id} +${delta.length} qator yuborildi');
      }
    } on DioException catch (e) {
      await _handleFailure(order, e);
    } catch (e) {
      // Kutilmagan xato — vaqtinchalik deb hisoblaymiz, yozuv saqlanadi.
      await _store.markAttemptFailed(order.id, e.toString());
    }
  }

  Future<void> _handleFailure(LocalOrder order, DioException e) async {
    final code = e.response?.statusCode;

    // Tarmoq xatosi — bu buyurtmaning aybi emas. Urinish sanalmaydi,
    // aks holda uzoq offline sessiya hamma yozuvni dead letter qilardi.
    if (_isNetworkError(e)) {
      if (kDebugMode) debugPrint('[OrderSync] ${order.id} network, will retry');
      return;
    }

    final message = _errorMessage(e);

    // Autentifikatsiya va vaqtinchalik xatolar buyurtmaning aybi emas.
    // 401/403 — token eskirgan yoki kassir chiqib ketgan; qayta kirgach
    // o'tadi. Bularni dead-letter qilish productionda halokatli: token
    // muddati tugagan zahoti butun navbat "yo'qolgan" deb belgilanardi.
    // 408/429 — kutish kerak, xolos.
    if (code == 401 || code == 403 || code == 408 || code == 429) {
      await _store.markAttemptFailed(order.id, 'HTTP $code: $message');
      if (kDebugMode) {
        debugPrint('[OrderSync] ${order.id} auth/throttle ($code), will retry');
      }
      return;
    }

    // Qolgan 4xx — cloud bu yozuvni qabul qilmaydi va qayta urinish yordam
    // bermaydi. Yozuv SAQLANADI va kassirga ko'rsatiladi.
    if (code != null && code >= 400 && code < 500) {
      await _store.markDeadLetter(order.id, 'HTTP $code: $message');
      if (kDebugMode) {
        debugPrint('[OrderSync] ${order.id} DEAD LETTER — $code $message');
      }
      return;
    }

    // 5xx yoki noma'lum — vaqtinchalik deb hisoblaymiz va qayta urinamiz.
    await _store.markAttemptFailed(order.id, message);

    final updated = _store.getById(order.id);
    if (updated != null && updated.attemptCount >= _maxAttempts) {
      await _store.markDeadLetter(
        order.id,
        '$_maxAttempts urinishdan keyin ham o\'tmadi: $message',
      );
    }
  }

  bool _isNetworkError(DioException e) =>
      e.type == DioExceptionType.connectionError ||
      e.type == DioExceptionType.connectionTimeout ||
      e.type == DioExceptionType.sendTimeout ||
      e.type == DioExceptionType.receiveTimeout ||
      e.response == null;

  String _errorMessage(DioException e) {
    final data = e.response?.data;
    if (data is Map) {
      final m = data['message'] ?? data['error'];
      if (m != null) return m.toString();
    }
    return e.message ?? 'unknown';
  }
}
