import 'dart:async';
import 'dart:collection';

import 'package:flutter/foundation.dart';
import 'package:mary_ai_pos/core/services/cache/cache_service.dart';
import 'package:mary_ai_pos/core/services/lan/lan_server_service.dart';
import 'package:mary_ai_pos/core/utils/parse_num.dart';
import 'package:mary_ai_pos/features/view/main/data/models/goods/goods_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/open_order/open_order_model.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/detail/detail_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Oshxona chekini chop etuvchi funksiya.
///
/// `PrinterService` to'g'ridan-to'g'ri olinmaydi: u DI'da bu navbatdan
/// **keyin** ro'yxatga olinadi va navbat uni konstruktorda talab qilsa
/// ro'yxatga olish tartibini buzardi. Callback esa chaqiruv paytida hal
/// bo'ladi.
///
/// `true` — chek printerga yetdi, `false` — yetmadi (qayta urinamiz).
typedef KitchenPrintCallback = Future<bool> Function({
  required OpenOrderModel order,
  required List<OrderItem> items,
});

/// Oshxonaga chiqishi kerak bo'lgan cheklarning yagona navbati.
///
/// Ikki manbadan to'ladi:
/// 1. **LAN** — ofitsiant planshetdan yuborgan buyurtma
///    (`LanServerService.onKitchenItems`). Usiz buyurtma lokal omborga
///    tushardi va oshxonada hech narsa chiqmasdi.
/// 2. **Kassa** — kassir POS'da o'zi bergan buyurtma ([enqueue] orqali).
///
/// Ikkalasi bitta navbatdan o'tadi, chunki printer bitta va uning oldida
/// navbat tartibi oshxonadagi pishirish tartibini belgilaydi.
///
/// Uch qoida ustiga qurilgan:
/// 1. **Chop etish chaqiruvchini bloklamaydi.** LAN javobi (yoki kassaning
///    "Buyurtma berildi" xabari) darhol qaytadi, chek fon navbatida chiqadi.
///    Printer o'chiq bo'lsa ham buyurtma qabul qilinadi — u omborda yotibdi
///    va hech qayerga yo'qolmaydi.
/// 2. **Bitta printer — bitta ish.** Ikki manba bir vaqtda yuborsa cheklar
///    bir-birining baytlari orasiga tushib ketmasligi kerak.
/// 3. **Chop etilgan qator id'lari saqlanadi.** So'rov takrorlansa yoki POS
///    qayta ishga tushsa oshxona ikkinchi chekni olmaydi.
class KitchenPrintQueue {
  static const _printedKey = 'lan_kitchen_printed_item_ids';

  /// Id'lar ro'yxati cheksiz o'smasligi kerak. Bu chegara bir necha smenani
  /// qoplaydi — undan eskisi qayta kelmaydi.
  static const _maxRememberedIds = 3000;

  /// Printer o'chiq bo'lsa cheksiz urinish navbatni qotirib qo'yardi.
  static const _maxAttempts = 3;
  static const _retryDelay = Duration(seconds: 6);

  final LanServerService _server;
  final CacheService _cache;
  final SharedPreferences _prefs;
  final KitchenPrintCallback _print;

  /// Urinishlar tugagach chaqiriladi. Kassir buni **ko'rishi shart**: taom
  /// buyurtmada bor, lekin oshxonada undan xabari yo'q. Chop etishning o'zi
  /// jimgina (`notifyOnFailure: false`) ketadi, aks holda har urinishda
  /// ekranga bittadan oyna chiqardi.
  final void Function(String tableId, int itemCount)? _onGiveUp;

  final Queue<_KitchenJob> _queue = Queue();

  /// Chop etilgani tasdiqlangan qatorlar. Ro'yxat tartibni (eskisini
  /// tashlash uchun), to'plam tez qidiruvni beradi.
  final List<String> _printedIds = [];
  final Set<String> _printedIdSet = {};

  /// Navbatda turgan yoki hozir chop etilayotgan qatorlar — bir xil qator
  /// ikki hodisada kelsa navbatga ikki marta tushmasin.
  final Set<String> _claimedIds = {};

  StreamSubscription<LanKitchenTicket>? _sub;
  Timer? _retryTimer;
  bool _draining = false;
  bool _disposed = false;

  KitchenPrintQueue({
    required LanServerService server,
    required CacheService cache,
    required SharedPreferences prefs,
    required KitchenPrintCallback print,
    void Function(String tableId, int itemCount)? onGiveUp,
  })  : _server = server,
        _cache = cache,
        _prefs = prefs,
        _print = print,
        _onGiveUp = onGiveUp;

  /// Navbatda kutayotgan cheklar soni — diagnostika uchun.
  int get pendingTickets => _queue.length;

  void start() {
    if (_disposed || _sub != null) return;
    _restorePrinted();
    _sub = _server.onKitchenItems.listen(
      (ticket) => enqueue(
        orderId: ticket.order.id,
        tableId: ticket.order.tableId,
        guestCount: ticket.order.guestCount,
        openedAt: ticket.order.clientCreatedAt,
        orderType: ticket.order.orderType,
        items: ticket.items,
      ),
    );
  }

  Future<void> dispose() async {
    _disposed = true;
    _retryTimer?.cancel();
    _retryTimer = null;
    await _sub?.cancel();
    _sub = null;
  }

  // ── Navbat ────────────────────────────────────────────────────────────────

  /// Oshxonaga chiqishi kerak bo'lgan **yangi** qatorlarni navbatga qo'yadi.
  ///
  /// [items] — aynan shu safar qo'shilganlar, buyurtmaning butun tarkibi
  /// emas. Butunini bersak har qo'shimchada allaqachon pishirilgan taomlar
  /// qayta chiqardi.
  ///
  /// Har bir qatorda barqaror `id` bo'lishi shart — takrorlanish himoyasi
  /// aynan shunga tayanadi. Id'siz qator jimgina o'tkazib yuboriladi.
  void enqueue({
    required String orderId,
    required String tableId,
    required int guestCount,
    required DateTime openedAt,
    required List<Map<String, dynamic>> items,
    String orderType = 'dine_in',
  }) {
    if (_disposed) return;

    final fresh = <Map<String, dynamic>>[];
    for (final item in items) {
      final id = item['id']?.toString();
      // Id'siz qatorni takrorlanishdan himoya qilib bo'lmaydi — chop
      // etmagan ma'qul.
      if (id == null || id.isEmpty) continue;
      if (_printedIdSet.contains(id) || _claimedIds.contains(id)) continue;
      _claimedIds.add(id);
      fresh.add(item);
    }
    if (fresh.isEmpty) return;

    _queue.add(_KitchenJob(
      orderId: orderId,
      tableId: tableId,
      guestCount: guestCount,
      openedAt: openedAt,
      orderType: orderType,
      items: fresh,
    ));
    unawaited(_drain());
  }

  /// Navbatni ketma-ket bo'shatadi. `_draining` — re-entrancy qorovuli:
  /// ikkinchi chaqiruv birinchisi tugaguncha kutadi, aks holda ikki chek
  /// bitta soketga chalkashib yozilardi.
  Future<void> _drain() async {
    if (_draining || _disposed) return;
    _draining = true;
    try {
      while (_queue.isNotEmpty && !_disposed) {
        final job = _queue.first;
        if (await _printJob(job)) {
          _queue.removeFirst();
          _claimedIds.removeAll(job.itemIds);
          await _remember(job.itemIds);
          continue;
        }

        job.attempts++;
        if (job.attempts < _maxAttempts) {
          // Ishni navbat **boshida** qoldiramiz: oshxonada cheklar kelish
          // tartibi bo'yicha pishiriladi, keyingisini oldinga o'tkazib
          // yuborish mumkin emas.
          _scheduleRetry();
          return;
        }

        // Urinishlar tugadi. Qator "chop etilgan" deb belgilanmaydi —
        // buyurtmaning o'zi omborda turibdi va kassir chekni qo'lda
        // chiqara oladi.
        _queue.removeFirst();
        _claimedIds.removeAll(job.itemIds);
        debugPrint(
          '[KitchenPrint] ${job.orderId}: $_maxAttempts urinishdan keyin '
          'chop etilmadi (${job.itemIds.length} qator)',
        );
        _onGiveUp?.call(job.tableId, job.items.length);
      }
    } finally {
      _draining = false;
    }
  }

  void _scheduleRetry() {
    if (_disposed) return;
    _retryTimer?.cancel();
    _retryTimer = Timer(_retryDelay, () => unawaited(_drain()));
  }

  Future<bool> _printJob(_KitchenJob job) async {
    try {
      return await _print(
        order: _openOrderFor(job),
        items: job.items.map(_toOrderItem).toList(),
      );
    } catch (e, st) {
      debugPrint('[KitchenPrint] ${job.orderId} chop etishda xato: $e\n$st');
      return false;
    }
  }

  // ── Chek sarlavhasi ───────────────────────────────────────────────────────

  /// Chek quruvchisi `OpenOrderModel` dan faqat stol raqami, zal nomi va
  /// mehmonlar sonini o'qiydi — qolgan maydonlar default qoladi.
  OpenOrderModel _openOrderFor(_KitchenJob job) {
    final table = _cache.getTables().firstWhere(
          (t) => t['id']?.toString() == job.tableId,
          orElse: () => const <String, dynamic>{},
        );
    final hallId = table['hall_id']?.toString();
    final hall = hallId == null
        ? const <String, dynamic>{}
        : _cache.getHalls().firstWhere(
              (h) => h['id']?.toString() == hallId,
              orElse: () => const <String, dynamic>{},
            );

    return OpenOrderModel(
      id: job.orderId,
      tableId: job.tableId,
      tableNumber: asInt(table['number']),
      hallName: hall['name']?.toString() ?? '',
      guestCount: job.guestCount,
      openedAt: job.openedAt,
      status: 'open',
      orderType: job.orderType,
    );
  }

  OrderItem _toOrderItem(Map<String, dynamic> item) {
    final comment = item['comment']?.toString() ?? '';
    return OrderItem(
      uniqueId: item['id']?.toString() ?? '',
      goods: GoodsModel(
        id: item['good_id']?.toString() ?? '',
        name: item['name']?.toString() ?? '',
        // Printer marshrutlashi shu maydonga tayanadi. Qatorni yuboruvchi
        // uni yozib beradi; bo'sh bo'lsa `good_id` bo'yicha fallback qoladi.
        categoryId: item['category_id']?.toString() ?? '',
        price: asNum(item['price']).toString(),
        costPrice: '0',
        profit: '0',
        profitMargin: '0',
        description: '',
        cookTime: 0,
      ),
      quantity: asInt(item['quantity'], 1),
      // Chek quruvchisi izohni aynan `commet` dan o'qiydi (tarixiy nomlanish),
      // `comment` esa qolgan UI uchun.
      commet: comment,
      comment: comment,
      createdAt: DateTime.tryParse(item['created_at']?.toString() ?? ''),
    );
  }

  // ── Chop etilganlar xotirasi ──────────────────────────────────────────────

  void _restorePrinted() {
    final saved = _prefs.getStringList(_printedKey) ?? const <String>[];
    _printedIds
      ..clear()
      ..addAll(saved);
    _printedIdSet
      ..clear()
      ..addAll(saved);
  }

  Future<void> _remember(List<String> ids) async {
    _printedIds.addAll(ids);
    _printedIdSet.addAll(ids);
    if (_printedIds.length > _maxRememberedIds) {
      final extra = _printedIds.length - _maxRememberedIds;
      _printedIdSet.removeAll(_printedIds.take(extra));
      _printedIds.removeRange(0, extra);
    }
    await _prefs.setStringList(_printedKey, _printedIds);
  }
}

class _KitchenJob {
  final String orderId;
  final String tableId;
  final int guestCount;
  final DateTime openedAt;
  final String orderType;
  final List<Map<String, dynamic>> items;
  int attempts = 0;

  _KitchenJob({
    required this.orderId,
    required this.tableId,
    required this.guestCount,
    required this.openedAt,
    required this.orderType,
    required this.items,
  });

  List<String> get itemIds =>
      items.map((it) => it['id'].toString()).toList(growable: false);
}
