import 'dart:convert';

import 'package:hive_flutter/hive_flutter.dart';
import 'package:mary_ai_pos/core/utils/parse_num.dart';

/// Buyurtmaning lokal sinxronizatsiya holati.
enum LocalOrderSyncState {
  /// Hali cloudga yuborilmagan (offline yaratilgan yoki navbatda).
  pending,

  /// Cloudga muvaffaqiyatli yozilgan.
  synced,

  /// Cloud rad etdi va qayta urinish yordam bermaydi — **kassir ko'rishi shart**.
  /// Bu holatdagi buyurtma hech qachon jimgina o'chirilmaydi.
  deadLetter,
}

/// Lokal buyurtma — LAN orqali ofitsiantdan kelgan yoki POS'da offline
/// yaratilgan buyurtmalarning yagona saqlash joyi.
///
/// `id` klientda generatsiya qilinadi (UuidV4) va **hech qachon o'zgarmaydi** —
/// cloudda ham xuddi shu id bilan yoziladi. Shu sababli qayta yuborish xavfsiz.
class LocalOrder {
  final String id;
  final String tableId;
  final String? waiterId;
  final String? cashierId;
  final int guestCount;
  final String? comment;
  final String orderType;
  final String status;
  final List<Map<String, dynamic>> items;
  final DateTime clientCreatedAt;
  final LocalOrderSyncState syncState;
  final int attemptCount;
  final String? lastError;

  /// Cloudda shu `id` bilan buyurtma yaratilgani tasdiqlangan.
  ///
  /// Yaratish so'rovi **qatorsiz** yuboriladi, qatorlar esa alohida delta
  /// sifatida ketadi (`syncedItemIds`). Sababi: backend `CreateOrder`
  /// (`order.go:189-206`) mavjud `id` ni ko'rsa buyurtmani qaytaradi va
  /// so'rovdagi qatorlarga **umuman qaramaydi**. Qatorlarni yaratish
  /// so'roviga qo'shib yuborish — javob yo'qolib qayta yuborilgan holatda —
  /// ularni jimgina yo'qotardi.
  final bool cloudCreated;

  /// Cloudga yetkazilgani tasdiqlangan qator id'lari.
  final List<String> syncedItemIds;

  const LocalOrder({
    required this.id,
    required this.tableId,
    required this.items,
    required this.clientCreatedAt,
    this.waiterId,
    this.cashierId,
    this.guestCount = 1,
    this.comment,
    this.orderType = 'dine_in',
    this.status = 'open',
    this.syncState = LocalOrderSyncState.pending,
    this.attemptCount = 0,
    this.lastError,
    this.cloudCreated = false,
    this.syncedItemIds = const [],
  });

  /// Hali cloudga yetmagan qatorlar — keyingi delta shular.
  List<Map<String, dynamic>> get unsyncedItems {
    if (syncedItemIds.isEmpty) return items;
    final sent = syncedItemIds.toSet();
    return items.where((it) => !sent.contains(it['id'])).toList();
  }

  // Narx satr bo'lib kelishi mumkin (cloud shunday beradi) — `as num?`
  // bunday holatda jimgina 0 qaytarib chekni nolga tushirardi.
  num get total => items.fold<num>(
        0,
        (sum, it) => sum + (asNum(it['price']) * asNum(it['quantity'])),
      );

  LocalOrder copyWith({
    List<Map<String, dynamic>>? items,
    String? status,
    String? cashierId,
    LocalOrderSyncState? syncState,
    int? attemptCount,
    String? lastError,
    bool? cloudCreated,
    List<String>? syncedItemIds,
  }) =>
      LocalOrder(
        id: id,
        tableId: tableId,
        waiterId: waiterId,
        cashierId: cashierId ?? this.cashierId,
        guestCount: guestCount,
        comment: comment,
        orderType: orderType,
        status: status ?? this.status,
        items: items ?? this.items,
        clientCreatedAt: clientCreatedAt,
        syncState: syncState ?? this.syncState,
        attemptCount: attemptCount ?? this.attemptCount,
        lastError: lastError ?? this.lastError,
        cloudCreated: cloudCreated ?? this.cloudCreated,
        syncedItemIds: syncedItemIds ?? this.syncedItemIds,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'table_id': tableId,
        'waiter_id': waiterId,
        'cashier_id': cashierId,
        'guest_count': guestCount,
        'comment': comment,
        'order_type': orderType,
        'status': status,
        'items': items,
        'client_created_at': clientCreatedAt.toUtc().toIso8601String(),
        'sync_state': syncState.name,
        'attempt_count': attemptCount,
        'last_error': lastError,
        'cloud_created': cloudCreated,
        'synced_item_ids': syncedItemIds,
        'total_amount': total,
      };

  factory LocalOrder.fromJson(Map<String, dynamic> json) {
    final items = ((json['items'] as List?) ?? const [])
        .map((e) => (e as Map).cast<String, dynamic>())
        .toList();

    // Eski yozuvlarda bu maydonlar yo'q. Ularni "hali yuborilmagan" deb
    // o'qish xavfli: `synced` deb belgilangan buyurtmaning hamma qatori
    // delta sifatida qaytadan yuborilib, cloudda ikkilanardi. Shuning
    // uchun eski `synced` — "yaratilgan va hamma qatori yetkazilgan".
    final legacySynced = !json.containsKey('cloud_created') &&
        json['sync_state'] == 'synced';

    return LocalOrder(
      id: json['id'] as String,
      tableId: json['table_id'] as String? ?? '',
      waiterId: json['waiter_id'] as String?,
      cashierId: json['cashier_id'] as String?,
      guestCount: (json['guest_count'] as num?)?.toInt() ?? 1,
      comment: json['comment'] as String?,
      orderType: json['order_type'] as String? ?? 'dine_in',
      status: json['status'] as String? ?? 'open',
      items: items,
      clientCreatedAt:
          DateTime.tryParse(json['client_created_at'] as String? ?? '')
                  ?.toLocal() ??
              DateTime.now(),
      syncState: LocalOrderSyncState.values.firstWhere(
        (e) => e.name == json['sync_state'],
        orElse: () => LocalOrderSyncState.pending,
      ),
      attemptCount: (json['attempt_count'] as num?)?.toInt() ?? 0,
      lastError: json['last_error'] as String?,
      cloudCreated: json['cloud_created'] as bool? ?? legacySynced,
      syncedItemIds: json['synced_item_ids'] != null
          ? (json['synced_item_ids'] as List).map((e) => e.toString()).toList()
          : (legacySynced
              ? items.map((it) => it['id']?.toString() ?? '').toList()
              : const []),
    );
  }

  /// Kassaning cloudda ochgan chekini lokal yozuvga o'giradi.
  ///
  /// Nega kerak: kassir online ishlaganda buyurtma faqat cloudga yoziladi va
  /// `LocalOrderStore` dan xabarsiz qoladi. Ofitsiant o'sha stolni ochganda
  /// LAN server hech narsa topmay, kesh dagi **boshqa shakldagi** cheknni
  /// qaytarardi; ofitsiant ilovasi uni o'qiy olmay o'sha stolga **ikkinchi**
  /// buyurtma ochardi va kassir faqat yarmini undirardi.
  ///
  /// Qatorlar `syncedItemIds` ga yoziladi — ular allaqachon cloudda, ya'ni
  /// delta sinxronizatsiya faqat yangi qo'shilganlarini yuboradi.
  static LocalOrder? fromCloudDetail(Map<String, dynamic> detail) {
    final id = detail['id']?.toString() ?? '';
    if (id.isEmpty) return null;

    final items = <Map<String, dynamic>>[];
    for (final raw in (detail['items'] as List?) ?? const []) {
      if (raw is! Map) continue;
      final it = raw.cast<String, dynamic>();
      if ((it['status']?.toString() ?? '') == 'cancelled') continue;
      final lineId = it['id']?.toString() ?? '';
      if (lineId.isEmpty) continue;
      items.add({
        'id': lineId,
        // Chekda `good_id` yo'q — faqat qator id'si bor. Bu qatorlar
        // allaqachon cloudda, ya'ni ular hech qachon qayta yuborilmaydi,
        // shuning uchun bu maydon ishlatilmaydi.
        'good_id': it['good_id']?.toString() ?? lineId,
        'name': it['good_name'] ?? it['name'],
        'price': it['price'],
        'quantity': it['quantity'],
        if (it['comment'] != null) 'comment': it['comment'],
        if (it['created_at'] != null) 'created_at': it['created_at'],
      });
    }

    final billStatus =
        (detail['bill_status'] ?? detail['status'])?.toString().toLowerCase();

    return LocalOrder(
      id: id,
      tableId: detail['table_id']?.toString() ?? '',
      guestCount: asNum(detail['guest_count'], 1).toInt(),
      comment: detail['comment']?.toString(),
      status: billStatus == 'open' ? 'open' : (billStatus ?? 'open'),
      items: items,
      clientCreatedAt:
          DateTime.tryParse(detail['opened_at']?.toString() ?? '')?.toLocal() ??
              DateTime.now(),
      syncState: LocalOrderSyncState.synced,
      cloudCreated: true,
      syncedItemIds: items.map((it) => it['id'].toString()).toList(),
    );
  }

  /// Cloudga `POST /api/v1/orders` uchun payload — **qatorsiz**.
  ///
  /// `id` yuborilgani uchun backend replay-return qiladi, ya'ni takroriy
  /// yuborish dublikat buyurtma yaratmaydi. Qatorlar ataylab bu yerda emas:
  /// replay-return so'rovdagi qatorlarga qaramaydi, shuning uchun ularni
  /// shu yo'l bilan yuborish javob yo'qolgan holatda ularni yo'qotardi.
  /// Qatorlar `itemsRequest` orqali delta sifatida ketadi.
  Map<String, dynamic> toCreateRequest() => {
        'id': id,
        'table_id': tableId,
        if (waiterId != null) 'waiter_id': waiterId,
        if (cashierId != null) 'cashier_id': cashierId,
        'guest_count': guestCount,
        if (comment != null && comment!.isNotEmpty) 'comment': comment,
        'order_type': orderType,
        'status': status,
        'client_created_at': clientCreatedAt.toUtc().toIso8601String(),
      };

  /// `POST /api/v1/orders/{id}/items` uchun payload.
  static Map<String, dynamic> itemsRequest(List<Map<String, dynamic>> lines) => {
        'items': lines
            .map((it) => {
                  'good_id': it['good_id'],
                  'quantity': it['quantity'],
                  if (it['comment'] != null) 'comment': it['comment'],
                  if (it['modifiers'] != null) 'modifiers': it['modifiers'],
                })
            .toList(),
      };
}

/// Lokal buyurtmalar ombori.
///
/// LAN server ham, POS UI ham shu ombordan o'qiydi — internet bor-yo'qligidan
/// qat'i nazar. Cloudga yuborish alohida jarayon (outbox drainer) va u
/// muvaffaqiyatli bo'lganda faqat `syncState` o'zgaradi, yozuv o'chmaydi.
class LocalOrderStore {
  static const _boxName = 'local_orders_v1';

  final Box _box;

  LocalOrderStore(this._box);

  static Future<LocalOrderStore> init() async {
    final box = await Hive.openBox(_boxName);
    return LocalOrderStore(box);
  }

  Future<void> upsert(LocalOrder order) =>
      _box.put(order.id, jsonEncode(order.toJson()));

  LocalOrder? getById(String id) {
    final raw = _box.get(id);
    if (raw == null) return null;
    try {
      return LocalOrder.fromJson(
        jsonDecode(raw as String) as Map<String, dynamic>,
      );
    } catch (_) {
      return null;
    }
  }

  List<LocalOrder> all() {
    final out = <LocalOrder>[];
    for (final raw in _box.values) {
      try {
        out.add(
          LocalOrder.fromJson(jsonDecode(raw as String) as Map<String, dynamic>),
        );
      } catch (_) {
        // Buzuq yozuv — o'tkazib yuboramiz, lekin o'chirmaymiz.
      }
    }
    out.sort((a, b) => a.clientCreatedAt.compareTo(b.clientCreatedAt));
    return out;
  }

  /// Stolning ochiq buyurtmasi. Bir stolda bir vaqtda bitta ochiq buyurtma.
  LocalOrder? openOrderForTable(String tableId) {
    for (final o in all()) {
      if (o.tableId == tableId && o.status == 'open') return o;
    }
    return null;
  }

  List<LocalOrder> openOrders() =>
      all().where((o) => o.status == 'open').toList();

  /// Cloudga yuborilishi kutilayotganlar.
  List<LocalOrder> pendingSync() =>
      all().where((o) => o.syncState == LocalOrderSyncState.pending).toList();

  /// Kassirga ko'rsatiladigan yo'qotilgan yozuvlar. Bo'sh bo'lmasa —
  /// ekranda ogohlantirish chiqishi kerak.
  List<LocalOrder> deadLetters() =>
      all().where((o) => o.syncState == LocalOrderSyncState.deadLetter).toList();

  /// Yopilgan buyurtmaga qator qo'shishga urinilganda tashlanadi.
  ///
  /// Ilgari `getById` statusga qaramasdi: kassir chekni yopgan zahoti
  /// ofitsiantning "Yuborish" tugmasi qatorlarni **yopilgan** buyurtmaga
  /// qo'shar, `openOrderForTable` esa uni ko'rmagani uchun o'sha taomlar
  /// ikkala ekranda ham yo'qolardi — pishirilgan, lekin hech qayerda
  /// hisoblanmagan.
  Future<LocalOrder?> appendItems(
    String orderId,
    List<Map<String, dynamic>> newItems,
  ) async {
    final existing = getById(orderId);
    if (existing == null) return null;
    if (existing.status != 'open') {
      throw StateError('order_closed');
    }
    final merged = [...existing.items, ...newItems];
    // Qatorlar o'zgardi — yozuv yana yuborilishi kerak.
    final updated = existing.copyWith(
      items: merged,
      syncState: LocalOrderSyncState.pending,
    );
    await upsert(updated);
    return updated;
  }

  Future<void> markSynced(String orderId) async {
    final o = getById(orderId);
    if (o == null) return;
    await upsert(o.copyWith(syncState: LocalOrderSyncState.synced));
  }

  /// Cloudda buyurtma (qatorsiz) yaratilgani tasdiqlandi.
  Future<void> markCloudCreated(String orderId) async {
    final o = getById(orderId);
    if (o == null) return;
    await upsert(o.copyWith(cloudCreated: true));
  }

  /// Sanab o'tilgan qatorlar cloudga yetkazilgani tasdiqlandi.
  ///
  /// Hamma qator yetkazilgan bo'lsa yozuv `synced` bo'ladi. Aks holda
  /// `pending` qoladi va keyingi aylanishda qolgan delta yuboriladi.
  Future<void> markItemsSynced(String orderId, List<String> itemIds) async {
    final o = getById(orderId);
    if (o == null) return;
    final merged = {...o.syncedItemIds, ...itemIds}.toList();
    final allDelivered =
        o.items.every((it) => merged.contains(it['id']?.toString()));
    await upsert(
      o.copyWith(
        syncedItemIds: merged,
        syncState:
            allDelivered ? LocalOrderSyncState.synced : LocalOrderSyncState.pending,
      ),
    );
  }

  Future<void> markAttemptFailed(String orderId, String error) async {
    final o = getById(orderId);
    if (o == null) return;
    await upsert(
      o.copyWith(attemptCount: o.attemptCount + 1, lastError: error),
    );
  }

  /// Terminal xato — cloud bu yozuvni hech qachon qabul qilmaydi.
  /// Yozuv **saqlanadi**, faqat belgilanadi. Kassir ko'radi va qo'lda hal qiladi.
  Future<void> markDeadLetter(String orderId, String error) async {
    final o = getById(orderId);
    if (o == null) return;
    await upsert(
      o.copyWith(
        syncState: LocalOrderSyncState.deadLetter,
        lastError: error,
        attemptCount: o.attemptCount + 1,
      ),
    );
  }

  Future<void> setStatus(String orderId, String status) async {
    final o = getById(orderId);
    if (o == null) return;
    await upsert(o.copyWith(status: status));
  }

  /// Cloudda yopilgan/to'langan va lokalda ham sinxronlangan eski
  /// buyurtmalarni tozalaydi. `pending` va `deadLetter` hech qachon o'chmaydi.
  Future<int> pruneSynced({Duration olderThan = const Duration(days: 3)}) async {
    final cutoff = DateTime.now().subtract(olderThan);
    var removed = 0;
    for (final o in all()) {
      if (o.syncState == LocalOrderSyncState.synced &&
          o.status != 'open' &&
          o.clientCreatedAt.isBefore(cutoff)) {
        await _box.delete(o.id);
        removed++;
      }
    }
    return removed;
  }
}
