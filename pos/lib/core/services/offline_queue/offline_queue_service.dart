import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:mary_ai_pos/core/api/dio_client.dart';
import 'package:mary_ai_pos/core/api/list_api.dart';
import 'pending_operation.dart';

class OfflineQueueService {
  static const _boxName = 'offline_queue';

  /// Server rad etgan operatsiyalar shu yerga ko'chiriladi.
  ///
  /// Ilgari ular `_box.delete(op.id)` bilan **jimgina o'chirilardi** — ya'ni
  /// offline olingan buyurtma serverga o'tmasa izsiz yo'qolardi va kassir
  /// bundan xabar topmasdi. Endi yozuv saqlanadi va sanog'i ko'rinadi.
  /// Alohida box — `PendingOperation` adapterini (typeId 11) o'zgartirmaslik
  /// uchun, oddiy JSON sifatida yoziladi.
  static const _failedBoxName = 'offline_queue_failed_v1';

  final Box<PendingOperation> _box;
  final Box _failedBox;

  OfflineQueueService(this._box, this._failedBox);

  static Future<OfflineQueueService> init() async {
    final box = await Hive.openBox<PendingOperation>(_boxName);
    final failedBox = await Hive.openBox(_failedBoxName);
    return OfflineQueueService(box, failedBox);
  }

  List<PendingOperation> get pending => _box.values.toList()
    ..sort((a, b) => a.createdAt.compareTo(b.createdAt));

  bool get hasItems => _box.isNotEmpty;

  /// Server qabul qilmagan operatsiyalar soni — kassirga ko'rsatiladi.
  int get failedCount => _failedBox.length;

  List<Map<String, dynamic>> get failedOperations {
    final out = <Map<String, dynamic>>[];
    for (final raw in _failedBox.values) {
      try {
        out.add(jsonDecode(raw as String) as Map<String, dynamic>);
      } catch (_) {
        // Buzuq yozuv — o'tkazib yuboramiz, lekin o'chirmaymiz.
      }
    }
    return out;
  }

  Future<void> enqueue(PendingOperation op) => _box.put(op.id, op);

  /// Terminal xato: operatsiyani faol navbatdan olib, arxivga yozadi.
  /// Yozuv hech qachon yo'q qilinmaydi.
  Future<void> _archiveFailed(PendingOperation op, Object error) async {
    await _failedBox.put(
      op.id,
      jsonEncode({
        'id': op.id,
        'type': op.type.name,
        'payload': op.payload,
        'table_id': op.tableId,
        'created_at': op.createdAt.toIso8601String(),
        'failed_at': DateTime.now().toIso8601String(),
        'error': error.toString(),
      }),
    );
    await _box.delete(op.id);
    if (kDebugMode) {
      debugPrint('[OfflineQueue] ${op.type.name} ARCHIVED as failed: $error');
    }
  }

  /// Bir vaqtda faqat bitta drain. Ilgari qorovul yo'q edi va `syncAll`
  /// widget lifecycle'idan chaqirilardi: har bir mount qilingan `AppScaffold`
  /// o'z obunasini yozar, bitta "internet keldi" chekkasi esa N ta parallel
  /// aylanishga bo'linardi. Ular bir xil, hali o'chirilmagan operatsiyalar
  /// ustidan yurgani uchun ayni `/items` va `/pay` payloadlari serverga N
  /// marta ketardi.
  bool _draining = false;

  Future<void> syncAll(DioClient dio) async {
    if (_draining) return;
    _draining = true;
    try {
      await _syncAll(dio);
    } finally {
      _draining = false;
    }
  }

  Future<void> _syncAll(DioClient dio) async {
    final ops = pending;
    if (ops.isEmpty) return;

    // 1. create_order ops
    for (final op in ops.where((o) => o.type == PendingOperationType.createOrder)) {
      try {
        final payload = jsonDecode(op.payload) as Map<String, dynamic>;
        // UTC + 'Z' suffix — backend RFC3339 formatini talab qiladi
        payload['client_created_at'] = op.createdAt.toUtc().toIso8601String();
        await dio.post(ListAPI.orders, data: payload);
        await _box.delete(op.id);
      } catch (e) {
        if (kDebugMode) print('[OfflineQueue] createOrder sync error: $e');
        // Terminal xato (server rad etdi) → arxivga, kassir ko'radi
        if (_isTerminalError(e)) await _archiveFailed(op, e);
      }
    }

    // 2. add_items ops — faqat ochiq (open) orderga qo'shiladi
    for (final op in ops.where((o) => o.type == PendingOperationType.addItems)) {
      try {
        final lookup = await _getOpenOrderIdByTable(dio, op.tableId);
        if (lookup.lookupFailed) {
          // Serverdan javob ololmadik (timeout, 5xx, ota buyurtma hali
          // cloudga chiqmagan). Bu "ochiq buyurtma yo'q" degani EMAS —
          // navbatda qoldiramiz va keyingi aylanishda qayta urinamiz.
          continue;
        }
        if (lookup.orderId == null) {
          // Stolda ochiq buyurtma yo'q — offline qo'shilgan taomlar hech
          // qayerga tushmaydi. Bu ham yo'qotish, shuning uchun o'chirmaymiz:
          // arxivga yozamiz va kassir qo'lda hal qiladi.
          await _archiveFailed(
            op,
            'Stol ${op.tableId} da ochiq buyurtma topilmadi '
            '(buyurtma yopilgan yoki to\'langan)',
          );
          continue;
        }
        final orderId = lookup.orderId!;
        final payload = jsonDecode(op.payload) as Map<String, dynamic>;
        await dio.post(
          ListAPI.orderItems(orderId),
          queryParameters: {'lang': 'uz'},
          data: payload,
        );
        await _box.delete(op.id);
      } catch (e) {
        if (kDebugMode) print('[OfflineQueue] addItems sync error: $e');
        if (_isTerminalError(e)) await _archiveFailed(op, e);
      }
    }

    // 3. pay_order ops — order_id payload da saqlangan
    for (final op in ops.where((o) => o.type == PendingOperationType.payOrder)) {
      try {
        final payload = jsonDecode(op.payload) as Map<String, dynamic>;
        final orderId = payload['order_id'] as String? ?? '';
        if (orderId.isEmpty) {
          await _box.delete(op.id);
          continue;
        }
        await dio.post(ListAPI.payToOrder(orderId), data: payload);
        await _box.delete(op.id);
      } catch (e) {
        if (kDebugMode) print('[OfflineQueue] payOrder sync error: $e');
        if (_isTerminalError(e)) await _archiveFailed(op, e);
      }
    }
  }

  /// Stolning ochiq (status: open) buyurtmasini qidiradi.
  ///
  /// Uch holatli, va bu ataylab: ilgari metod har qanday xatoni `''` ga
  /// aylantirardi, chaqiruvchi esa `''` ni "ochiq buyurtma yo'q" deb o'qib
  /// operatsiyani arxivga tashlab, faol navbatdan o'chirardi. Ya'ni bitta
  /// timeout yoki 5xx — yoki ota buyurtma hali cloudga chiqmagani —
  /// berilgan taomni hisobdan butunlay chiqarib yuborardi, arxivni esa
  /// qaytadan yuboradigan yo'l yo'q.
  ///
  /// - `orderId != null` — topildi;
  /// - `orderId == null, lookupFailed == false` — ishonchli "ochiq buyurtma yo'q";
  /// - `lookupFailed == true` — javob olinmadi, qayta urinish kerak.
  Future<({String? orderId, bool lookupFailed})> _getOpenOrderIdByTable(
    DioClient dio,
    String tableId,
  ) async {
    try {
      final res = await dio.dio.get(ListAPI.orderWithTableId(tableId));
      final data = res.data['data'];
      if (data is! List) return (orderId: null, lookupFailed: true);
      if (data.isEmpty) return (orderId: null, lookupFailed: false);
      final order = data[0] as Map<String, dynamic>;
      final status = order['status']?.toString() ?? '';
      // Faqat ochiq orderga item qo'shish mumkin
      if (status != 'open') return (orderId: null, lookupFailed: false);
      final id = order['id'] as String? ?? '';
      if (id.isEmpty) return (orderId: null, lookupFailed: true);
      return (orderId: id, lookupFailed: false);
    } catch (_) {
      return (orderId: null, lookupFailed: true);
    }
  }

  /// Server tomonidan rad etilgan xatolar (qayta urinish kerak emas).
  bool _isTerminalError(Object e) {
    if (e is DioException) {
      final code = e.response?.statusCode;
      if (code == null) return false;
      // 401/403 — token eskirgan yoki kassir chiqib ketgan. Bu operatsiyaning
      // aybi emas: qayta kirgandan keyin o'tadi. Terminal deb belgilash
      // token muddati tugagan zahoti butun navbatni yo'qotardi.
      // 408/429 — shunchaki kutish kerak.
      if (code == 401 || code == 403 || code == 408 || code == 429) {
        return false;
      }
      // 404 — ota buyurtma hali cloudga yetmagan bo'lishi mumkin (LAN'dan
      // kelgan buyurtma alohida jarayonda suriladi). Buni terminal deb
      // belgilash to'lovni arxivga tashlardi, holbuki bir necha soniyadan
      // keyin o'sha so'rov muvaffaqiyatli bo'lardi.
      if (code == 404) return false;
      // Qolgan 4xx — client xato (eskirgan ma'lumot, noto'g'ri so'rov)
      if (code >= 400 && code < 500) return true;
    }
    return false;
  }

  static String newId() =>
      '${DateTime.now().microsecondsSinceEpoch}_${Object().hashCode.abs()}';
}
