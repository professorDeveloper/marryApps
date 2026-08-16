import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:mary_ai_pos/core/utils/parse_num.dart';

/// Yuborilmagan savatning diskdagi nusxasi.
///
/// Nega alohida do'kon: savat shu paytgacha faqat `OrderScreen` state'ida
/// yashardi. Planshet o'chsa yoki ofitsiant tasodifan orqaga bossa o'nlab
/// qator yo'qolar va hammasi qaytadan terilardi. Bu yerdagi yozuv **manba
/// emas** — u faqat yuborilmagan ishning zaxirasi, buyurtma POS'ga (yoki
/// navbatga) ketishi bilan o'chiriladi.
///
/// `LanApiClient` ning `waiter_lan_v1` box'iga aralashtirilmadi: qoralama
/// tashlab yuborilishi mumkin bo'lgan ma'lumot, kesh va outbox esa emas —
/// ularni bir joyda tutish bittasini tozalashni ikkinchisi uchun xavfli
/// qilardi.
class CartDraftStore {
  static const _boxName = 'waiter_cart_drafts_v1';

  /// Kechagi smenadan qolgan qoralama bugun o'z-o'zidan paydo bo'lmasligi
  /// kerak: ofitsiant uni o'zi terganini eslamaydi va sezmasdan yuboradi.
  static const Duration ttl = Duration(hours: 12);

  static final CartDraftStore instance = CartDraftStore._();

  CartDraftStore._();

  Box? _box;
  Future<void>? _opening;

  /// Box ochilgan bo'lsagina sinxron o'qishlar ishonchli.
  bool get isReady => _box != null;

  /// Box'ni ochadi va eskirgan qoralamalarni tashlaydi.
  ///
  /// `main_waiter.dart` ga tegilmaydi — do'kon birinchi murojaatda o'zi
  /// ochiladi. `Hive.initFlutter()` ilova boshida allaqachon chaqirilgan.
  Future<void> ensureReady() {
    if (_box != null) return Future.value();
    return _opening ??= _open();
  }

  Future<void> _open() async {
    try {
      _box = Hive.isBoxOpen(_boxName)
          ? Hive.box(_boxName)
          : await Hive.openBox(_boxName);
      await _pruneStale();
    } catch (e) {
      // Qoralama yo'qolishi ilovani to'xtatmasligi kerak — ekranlar
      // do'konsiz ham ishlaydi. Keyingi urinish uchun bayroqni tushiramiz.
      _opening = null;
      if (kDebugMode) debugPrint('[CartDraft] box ochilmadi: $e');
    }
  }

  /// Kalit brand bilan bog'lanadi: planshetga boshqa filial ofitsianti
  /// kirsa, birovning savati uning ekranida ochilmasligi kerak.
  String _key(String? brandId, String tableId) => '${brandId ?? ''}|$tableId';

  CartDraft? read({String? brandId, required String tableId}) {
    final box = _box;
    if (box == null || tableId.isEmpty) return null;
    final draft = CartDraft.decode(box.get(_key(brandId, tableId)));
    if (draft == null) return null;
    // Eskirganini o'qish paytida ham tekshiramiz: ilova sutkalab ochiq
    // tursa `ensureReady` dagi tozalash bir marta ishlagan bo'ladi.
    if (draft.isStale()) {
      unawaited(clear(brandId: brandId, tableId: tableId));
      return null;
    }
    return draft;
  }

  Future<void> save({String? brandId, required CartDraft draft}) async {
    final box = _box;
    if (box == null || draft.tableId.isEmpty) return;
    if (draft.lines.isEmpty) {
      await clear(brandId: brandId, tableId: draft.tableId);
      return;
    }
    try {
      await box.put(
        _key(brandId, draft.tableId),
        jsonEncode(draft.toJson()),
      );
    } catch (e) {
      if (kDebugMode) debugPrint('[CartDraft] saqlanmadi: $e');
    }
  }

  Future<void> clear({String? brandId, required String tableId}) async {
    final box = _box;
    if (box == null || tableId.isEmpty) return;
    await box.delete(_key(brandId, tableId));
  }

  /// Qoralamasi bor stollar — stollar setkasidagi belgi shundan chiziladi.
  /// Sinxron: `build` ichida chaqiriladi.
  Set<String> tableIds({String? brandId}) {
    final box = _box;
    if (box == null) return const {};
    final prefix = '${brandId ?? ''}|';
    final ids = <String>{};
    for (final key in box.keys.whereType<String>()) {
      if (!key.startsWith(prefix)) continue;
      final draft = CartDraft.decode(box.get(key));
      if (draft == null || draft.isStale()) continue;
      ids.add(draft.tableId);
    }
    return ids;
  }

  /// Diskdagi eskirgan yozuvlarni o'chiradi. Buzuq yozuv ham shu yerda
  /// ketadi — uni saqlab qo'yishning ma'nosi yo'q, qayta tiklab bo'lmaydi.
  Future<void> _pruneStale() async {
    final box = _box;
    if (box == null) return;
    final doomed = <String>[];
    for (final key in box.keys.whereType<String>()) {
      final draft = CartDraft.decode(box.get(key));
      if (draft == null || draft.isStale()) doomed.add(key);
    }
    if (doomed.isEmpty) return;
    await box.deleteAll(doomed);
  }
}

/// Bitta stolning qoralamasi.
@immutable
class CartDraft {
  final String tableId;
  final int guestCount;
  final List<CartDraftLine> lines;
  final DateTime updatedAt;

  const CartDraft({
    required this.tableId,
    required this.guestCount,
    required this.lines,
    required this.updatedAt,
  });

  bool isStale({DateTime? now}) =>
      (now ?? DateTime.now()).difference(updatedAt) > CartDraftStore.ttl;

  Map<String, dynamic> toJson() => {
        'table_id': tableId,
        'guest_count': guestCount,
        'items': lines.map((l) => l.toJson()).toList(),
        'updated_at': updatedAt.toIso8601String(),
      };

  /// Diskdagi satrni (yoki tayyor Map'ni) qoralamaga aylantiradi.
  /// Buzuq yozuv `null` beradi — ekran uni yo'qdek qabul qiladi.
  static CartDraft? decode(Object? raw) {
    Object? decoded = raw;
    if (raw is String) {
      if (raw.isEmpty) return null;
      try {
        decoded = jsonDecode(raw);
      } catch (_) {
        return null;
      }
    }
    if (decoded is! Map) return null;
    final map = decoded.cast<String, dynamic>();
    final tableId = map['table_id']?.toString() ?? '';
    if (tableId.isEmpty) return null;
    final lines = ((map['items'] as List?) ?? const [])
        .whereType<Map>()
        .map((e) => CartDraftLine.decode(e.cast<String, dynamic>()))
        .whereType<CartDraftLine>()
        .toList();
    if (lines.isEmpty) return null;
    return CartDraft(
      tableId: tableId,
      guestCount: asInt(map['guest_count'], 1).clamp(1, 99),
      lines: lines,
      // Vaqti yo'q yozuv eski deb hisoblanadi: uni "hozirgi" deb olsak
      // buzuq yozuv abadiy yashab qolardi.
      updatedAt: DateTime.tryParse(map['updated_at']?.toString() ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0),
    );
  }
}

/// Qoralamadagi bitta qator.
@immutable
class CartDraftLine {
  final String goodId;
  final String name;
  final num price;
  final int quantity;
  final String? comment;

  const CartDraftLine({
    required this.goodId,
    required this.name,
    required this.price,
    required this.quantity,
    this.comment,
  });

  CartDraftLine copyWith({String? name, num? price}) => CartDraftLine(
        goodId: goodId,
        name: name ?? this.name,
        price: price ?? this.price,
        quantity: quantity,
        comment: comment,
      );

  Map<String, dynamic> toJson() => {
        'good_id': goodId,
        'name': name,
        'price': price,
        'quantity': quantity,
        if (comment != null) 'comment': comment,
      };

  static CartDraftLine? decode(Map<String, dynamic> map) {
    final goodId = map['good_id']?.toString() ?? '';
    final quantity = asInt(map['quantity'], 0);
    if (goodId.isEmpty || quantity <= 0) return null;
    final comment = map['comment']?.toString().trim();
    return CartDraftLine(
      goodId: goodId,
      name: map['name']?.toString() ?? '',
      price: asNum(map['price']),
      quantity: quantity,
      comment: (comment == null || comment.isEmpty) ? null : comment,
    );
  }
}

/// Qoralamani joriy menyu bilan solishtirish natijasi.
@immutable
class CartDraftRestore {
  final List<CartDraftLine> lines;

  /// Menyudan yo'qolgani uchun tashlangan qatorlar soni.
  final int dropped;

  const CartDraftRestore({required this.lines, required this.dropped});
}

/// Qoralamani menyu bo'yicha tekshiradi.
///
/// Ikki qoida:
///   1. **Narx va nom menyudan olinadi** — diskdagi narx kechagi bo'lishi
///      mumkin, eski narxda yuborilgan buyurtma kassada nomutanosiblik
///      beradi.
///   2. Menyuda yo'q taom tashlanadi va sanaladi — ofitsiantga aytish
///      uchun. Uni "bor" deb qoldirish POS rad etadigan buyurtma degani.
///
/// Widget'siz sinash uchun ataylab toza funksiya.
CartDraftRestore restoreDraftLines(
  CartDraft draft,
  List<Map<String, dynamic>> goods,
) {
  final byId = <String, Map<String, dynamic>>{};
  for (final g in goods) {
    final id = g['id']?.toString();
    if (id != null && id.isNotEmpty) byId[id] = g;
  }

  final kept = <CartDraftLine>[];
  var dropped = 0;
  for (final line in draft.lines) {
    final good = byId[line.goodId];
    if (good == null) {
      dropped++;
      continue;
    }
    kept.add(
      line.copyWith(
        name: good['name']?.toString() ?? line.name,
        price: asNum(good['price']),
      ),
    );
  }
  return CartDraftRestore(lines: kept, dropped: dropped);
}
