import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:mary_ai_pos/core/services/lan/lan_discovery.dart';
import 'package:mary_ai_pos/core/services/lan/lan_rest_server.dart';
import 'package:mary_ai_pos/core/utils/uuid_v4.dart';

/// Ofitsiant ilovasining POS bilan aloqasi.
///
/// Ikki qatlamli offline himoya:
///   1. **O'qishlar keshlanadi** — POS bir zumga yo'qolsa (WiFi uzildi, POS
///      qayta ishga tushdi) menyu va stollar ekranda qoladi.
///   2. **Yozishlar navbatga tushadi** — POS yetib bo'lmasa buyurtma lokal
///      saqlanadi va aloqa tiklanganda yuboriladi. Har bir buyurtmaning
///      klientda generatsiya qilingan `id` si bor, shuning uchun qayta
///      yuborish dublikat yaratmaydi (POS `_handleCreateOrder` da o'sha id
///      bo'yicha replay-return qiladi).
class LanApiClient {
  static const _boxName = 'waiter_lan_v1';
  static const _keyBaseUrl = 'base_url';
  static const _keyToken = 'token';
  static const _keyBrandId = 'brand_id';
  static const _keyUser = 'user';
  static const _cachePrefix = 'cache:';
  static const _outboxPrefix = 'outbox:';

  final Box _box;
  final HttpClient _http = HttpClient()
    ..connectionTimeout = const Duration(seconds: 5);

  final _connectionController = StreamController<bool>.broadcast();
  final _authInvalidController = StreamController<void>.broadcast();
  final _serverLockedController = StreamController<String>.broadcast();
  bool _lastReachable = false;

  /// Saqlangan token POS tomonidan hali qabul qilinayaptimi.
  ///
  /// POS sessiyalari xotirada: POS qayta ishga tushsa hamma ofitsiant tokeni
  /// o'ladi. Buni alohida kuzatmasak `/health` (auth talab qilmaydi) javob
  /// berib turgani uchun chip "Ulangan" deb yozar, ayni paytda har bir
  /// yozuv 401 bilan qaytarilardi.
  bool _authValid = true;

  /// Navbatni bo'shatish qayta kirmasligi uchun.
  bool _flushing = false;

  LanApiClient(this._box);

  static Future<LanApiClient> init() async {
    final box = await Hive.openBox(_boxName);
    return LanApiClient(box);
  }

  /// POS yetib borarli yoki yo'qligi o'zgarganda.
  Stream<bool> get onConnectionChanged => _connectionController.stream;

  /// POS saqlangan tokenni tanimay qolganda (odatda POS qayta ishga tushgan).
  /// Ilova buni eshitib ofitsiantni PIN ekraniga qaytarishi kerak — aks holda
  /// u "Ulangan" yozuvini ko'rib turib hech nima kassaga yetmaydi.
  Stream<void> get onAuthInvalid => _authInvalidController.stream;

  /// POS qulflangan (litsenziya/sinov muddati) — `423 Locked`.
  ///
  /// Bu 401 dan tubdan boshqacha: qayta PIN kiritish yordam bermaydi, ya'ni
  /// ofitsiantni PIN ekraniga qaytarish uni cheksiz aylanishga tashlardi.
  /// Ilova buni eshitib qulf ekranini ko'rsatadi. Oqim POS bergan matnni
  /// uzatadi.
  Stream<String> get onServerLocked => _serverLockedController.stream;

  bool get sessionValid => _authValid;

  bool get isReachable => _lastReachable;
  String? get baseUrl => _box.get(_keyBaseUrl) as String?;
  String? get token => _box.get(_keyToken) as String?;
  String? get brandId => _box.get(_keyBrandId) as String?;
  bool get isConfigured => (baseUrl ?? '').isNotEmpty;
  bool get isLoggedIn => (token ?? '').isNotEmpty;

  Map<String, dynamic>? get user {
    final raw = _box.get(_keyUser) as String?;
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<void> setBaseUrl(String url) => _box.put(_keyBaseUrl, url);

  Future<void> logout() async {
    await _box.delete(_keyToken);
    await _box.delete(_keyUser);
  }

  // ── Ulanish ───────────────────────────────────────────────────────────────

  /// LAN'dagi POS'larni qidiradi.
  Future<List<DiscoveredPos>> discover() => LanDiscoveryProbe.discover();

  /// POS yozuvlarimizni qabul qila oladimi.
  ///
  /// Ataylab **token talab qiladigan** endpointga uriladi. `/health` auth
  /// so'ramaydi, ya'ni POS qayta ishga tushib hamma sessiyani yo'qotgandan
  /// keyin ham u 200 qaytaraveradi: chip yashil turar, ofitsiant esa har bir
  /// buyurtmasi 401 bilan rad etilayotganini bilmasdi.
  Future<bool> ping() async {
    final url = baseUrl;
    if (url == null || url.isEmpty) return _setReachable(false);
    try {
      if (isLoggedIn) {
        // `/halls` — eng arzon autentifikatsiyalangan javob.
        await _request('GET', '/halls');
        return _setReachable(true);
      }
      final res = await _request('GET', '/health', auth: false);
      return _setReachable(res != null);
    } on _HttpFailure catch (_) {
      // POS javob berdi. 401 bo'lsa `_request` allaqachon sessiyani
      // yaroqsiz deb belgilagan va aloqani "yo'q" ga tushirgan.
      return _authValid ? _setReachable(true) : false;
    } catch (_) {
      return _setReachable(false);
    }
  }

  Future<({bool ok, String? error})> loginPin({
    required String brandId,
    required String pincode,
  }) async {
    try {
      final res = await _request(
        'POST',
        '/auth/pin',
        body: {'brand_id': brandId, 'pincode': pincode},
        auth: false,
      );
      if (res == null) return (ok: false, error: 'POS bilan aloqa yo\'q');

      final token = res['token'] as String?;
      if (token == null || token.isEmpty) {
        return (ok: false, error: res['error']?.toString() ?? 'Noma\'lum xato');
      }
      await _box.put(_keyToken, token);
      await _box.put(_keyBrandId, brandId);
      await _box.put(_keyUser, jsonEncode(res['user'] ?? {}));
      // Yangi sessiya — eski 401 lardan qolgan "yaroqsiz" bayrog'ini
      // tushiramiz, aks holda navbat qayta ulangandan keyin ham turib qolardi.
      _authValid = true;
      _setReachable(true);
      return (ok: true, error: null);
    } on _HttpFailure catch (e) {
      return (ok: false, error: _loginErrorMessage(e));
    } catch (e) {
      return (ok: false, error: e.toString());
    }
  }

  String _loginErrorMessage(_HttpFailure e) {
    switch (e.statusCode) {
      case 401:
        return 'PIN kod noto\'g\'ri';
      case 429:
        return 'Juda ko\'p urinish. 5 daqiqadan keyin qayta urining';
      default:
        return e.body ?? 'Xato ${e.statusCode}';
    }
  }

  // ── O'qish (kesh bilan) ───────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> getHalls() =>
      _cachedList('/halls', 'halls');

  Future<List<Map<String, dynamic>>> getTables({String? hallId}) => _cachedList(
        hallId == null || hallId.isEmpty ? '/tables' : '/tables?hall_id=$hallId',
        'tables:${hallId ?? 'all'}',
      );

  Future<List<Map<String, dynamic>>> getCategories() =>
      _cachedList('/categories', 'categories');

  Future<List<Map<String, dynamic>>> getGoods({String? categoryId}) =>
      _cachedList(
        categoryId == null || categoryId.isEmpty
            ? '/goods'
            : '/goods?category_id=$categoryId',
        'goods:${categoryId ?? 'all'}',
      );

  Future<Map<String, dynamic>?> getOrderForTable(String tableId) async {
    try {
      final res = await _request('GET', '/orders/table/$tableId');
      final data = res?['data'];
      if (data is Map) {
        final map = data.cast<String, dynamic>();
        await _cacheOrder(tableId, map);
        return map;
      }
      // Navbatda shu stolga tegishli yuborilmagan ish bor — POS uni hali
      // ko'rmagan. O'z ishimizni o'zimizdan yashirmaymiz.
      final queued = _queuedOrderFor(tableId);
      if (queued != null) return queued;
      // POS "ochiq buyurtma yo'q" dedi — keshni tozalaymiz. Aks holda
      // keyingi uzilishda bir soat oldin to'langan buyurtma qaytarilar va
      // ofitsiant unga taom qo'shib yuborardi.
      await _forgetCachedOrder(tableId);
      return null;
    } catch (_) {
      return _queuedOrderFor(tableId) ?? _readCachedOrder(tableId);
    }
  }

  /// Serverdan o'qiydi; muvaffaqiyatli bo'lsa keshni yangilaydi, aks holda
  /// oxirgi keshni qaytaradi. Ofitsiant hech qachon bo'sh ekran ko'rmaydi.
  Future<List<Map<String, dynamic>>> _cachedList(
    String path,
    String cacheKey,
  ) async {
    try {
      final res = await _request('GET', path);
      final data = res?['data'];
      if (data is List) {
        final list = data.map((e) => (e as Map).cast<String, dynamic>()).toList();
        await _box.put('$_cachePrefix$cacheKey', jsonEncode(list));
        return list;
      }
    } catch (e) {
      if (kDebugMode) debugPrint('[LanApi] $path failed, using cache: $e');
    }
    return _readCachedList(cacheKey);
  }

  List<Map<String, dynamic>> _readCachedList(String cacheKey) {
    final raw = _box.get('$_cachePrefix$cacheKey') as String?;
    if (raw == null) return [];
    try {
      return (jsonDecode(raw) as List)
          .map((e) => (e as Map).cast<String, dynamic>())
          .toList();
    } catch (_) {
      return [];
    }
  }

  // ── Yozish (navbat bilan) ─────────────────────────────────────────────────

  /// Buyurtma yaratadi. POS yetib bo'lmasa navbatga qo'yadi va `queued: true`
  /// qaytaradi — ofitsiant ishini davom ettiraveradi.
  Future<({bool ok, bool queued, Map<String, dynamic>? order, String? error})>
      createOrder({
    required String tableId,
    required List<Map<String, dynamic>> items,
    int guestCount = 1,
    String? comment,
  }) async {
    // id shu yerda generatsiya qilinadi va navbatda ham o'zgarmaydi —
    // qayta yuborishning bezarar bo'lishi shunga tayanadi. Qatorlarga ham
    // shu yerda barqaror id qo'yiladi: so'rov keyinchalik "qator qo'shish" ga
    // aylanib ketsa (stolda ochiq buyurtma chiqib qolsa) POS ularni o'sha id
    // bo'yicha dublikatdan ajratadi.
    final withIds = _withItemIds(items);
    final payload = {
      'id': UuidV4.generate(),
      'table_id': tableId,
      'guest_count': guestCount,
      if (comment != null && comment.isNotEmpty) 'comment': comment,
      'items': withIds,
    };

    try {
      final res = await _request('POST', '/orders', body: payload);
      final data = res?['data'];
      if (data is Map) {
        final order = data.cast<String, dynamic>();
        final missing = _missingItems(withIds, order);
        if (missing.isEmpty) {
          await _cacheOrder(tableId, order);
          return (ok: true, queued: false, order: order, error: null);
        }
        // POS 200 qaytardi, lekin javobdagi buyurtmada bizning qatorlar yo'q
        // (stolda boshqa ochiq buyurtma bor edi). Buni "yuborildi" deb
        // hisoblasak taom pishirilib hech qaysi chekka tushmasdi — mavjud
        // buyurtmaga qo'shamiz.
        final existingId = order['id'] as String? ?? '';
        if (existingId.isEmpty) {
          return (
            ok: false,
            queued: false,
            order: null,
            error: 'Noto\'g\'ri javob'
          );
        }
        final appended = await appendItems(
          orderId: existingId,
          items: missing,
          tableId: tableId,
          allowCreateFallback: false,
        );
        return (
          ok: appended.ok,
          queued: appended.queued,
          order: order,
          error: appended.error,
        );
      }
      return (ok: false, queued: false, order: null, error: 'Noto\'g\'ri javob');
    } on _HttpFailure catch (e) {
      final conflictId = _conflictOrderId(e);
      if (conflictId != null) {
        // POS 409 bilan "bu stolda mana bu buyurtma ochiq" dedi — qatorlarni
        // o'shanga yo'naltiramiz, ikkinchi buyurtma ochmaymiz.
        final appended = await appendItems(
          orderId: conflictId,
          items: withIds,
          tableId: tableId,
          allowCreateFallback: false,
        );
        return (
          ok: appended.ok,
          queued: appended.queued,
          order: null,
          error: appended.error,
        );
      }
      if (_isRetryable(e)) {
        // Sessiya o'lgan (POS restart) yoki POS band — buyurtmaning aybi
        // emas. Navbatga qo'yamiz: bitta restart butun smenani yo'q qila
        // olmasligi kerak.
        await _enqueueCreate(payload);
        return (ok: true, queued: true, order: payload, error: null);
      }
      return (
        ok: false,
        queued: false,
        order: null,
        error: e.body ?? 'Xato ${e.statusCode}'
      );
    } catch (_) {
      // Aloqa yo'q — navbatga.
      await _enqueueCreate(payload);
      return (ok: true, queued: true, order: payload, error: null);
    }
  }

  /// Mavjud buyurtmaga qator qo'shadi.
  ///
  /// Buyurtma yopilib qolgan bo'lsa (kassir to'lovni olib ulgurdi) qatorlar
  /// o'sha stolga yangi buyurtma sifatida ochiladi — taom yo'qolmaydi.
  /// [tableId] berilmasa kesh orqali topiladi.
  Future<({bool ok, bool queued, String? error})> appendItems({
    required String orderId,
    required List<Map<String, dynamic>> items,
    String? tableId,
    bool allowCreateFallback = true,
  }) async {
    // Har bir qatorga barqaror id — takroriy yuborishda POS ularni
    // filtrlab tashlaydi.
    final withIds = _withItemIds(items);
    // Chaqiruvchi stolni bermagan bo'lsa keshdan topamiz: usiz buyurtma
    // yopilib qolgan holatda qatorlarni ko'chiradigan joy bo'lmasdi.
    final table = (tableId != null && tableId.isNotEmpty)
        ? tableId
        : _tableIdForOrder(orderId);
    final payload = {
      'order_id': orderId,
      if (table != null && table.isNotEmpty) 'table_id': table,
      'items': withIds,
    };

    try {
      final res = await _request(
        'POST',
        '/orders/$orderId/items',
        body: {'items': withIds},
      );
      final data = res?['data'];
      if (data is Map) {
        final order = data.cast<String, dynamic>();
        await _cacheOrder(table ?? order['table_id'] as String? ?? '', order);
      }
      return (ok: true, queued: false, error: null);
    } on _HttpFailure catch (e) {
      if (_isClosedOrMissing(e)) {
        // Kassir bu buyurtmani yopib ulgurgan (yoki POS uni bilmaydi). Eski
        // id ga yozishda davom etsak taom yopiq chekka tushib ko'rinmay
        // qolardi — stolga yangi buyurtma ochamiz.
        if (table != null && table.isNotEmpty) {
          await _forgetCachedOrder(table);
          if (allowCreateFallback) {
            final created = await createOrder(tableId: table, items: withIds);
            return (
              ok: created.ok,
              queued: created.queued,
              error: created.error
            );
          }
        }
        return (
          ok: false,
          queued: false,
          error: 'Stol yopilgan — kassirga ayting'
        );
      }
      if (_isRetryable(e)) {
        await _enqueue('append_items', payload);
        await _shadowAppend(orderId, table, withIds);
        return (ok: true, queued: true, error: null);
      }
      return (ok: false, queued: false, error: e.body ?? 'Xato ${e.statusCode}');
    } catch (_) {
      await _enqueue('append_items', payload);
      await _shadowAppend(orderId, table, withIds);
      return (ok: true, queued: true, error: null);
    }
  }

  /// 401/403 — sessiya o'lgan; 408/429/5xx — POS band; 423 — POS qulflangan.
  /// Hech biri buyurtmaning aybi emas, shuning uchun rad etish emas,
  /// kechikish. Qulflangan POS uchun bu ayniqsa muhim: navbatdagi buyurtma
  /// "yo'qolgan" deb belgilanmasligi kerak, qulf ochilgach u yuboriladi.
  bool _isRetryable(_HttpFailure e) =>
      e.statusCode == 401 ||
      e.statusCode == 403 ||
      e.statusCode == 408 ||
      e.statusCode == 429 ||
      e.statusCode == LanRestServer.lockedStatus ||
      e.statusCode >= 500;

  /// Buyurtma yo'q yoki yopilgan.
  bool _isClosedOrMissing(_HttpFailure e) {
    if (e.statusCode == HttpStatus.notFound) return true;
    if (e.statusCode != HttpStatus.conflict) return false;
    final code = (e.body ?? '').toLowerCase();
    return code.contains('closed') ||
        code.contains('not_open') ||
        code.contains('paid');
  }

  /// 409 javobidan mavjud buyurtma id'sini oladi.
  String? _conflictOrderId(_HttpFailure e) {
    if (e.statusCode != HttpStatus.conflict) return null;
    final data = e.data;
    if (data == null) return null;
    final direct = data['order_id'] ?? data['existing_order_id'];
    if (direct is String && direct.isNotEmpty) return direct;
    final nested = data['data'];
    if (nested is Map) {
      final id = nested['id'];
      if (id is String && id.isNotEmpty) return id;
    }
    return null;
  }

  List<Map<String, dynamic>> _withItemIds(List<Map<String, dynamic>> items) =>
      items
          .map((it) => {...it, 'id': it['id'] ?? UuidV4.generate()})
          .toList();

  /// Yuborilgan qatorlardan javobdagi buyurtmada yo'qlari.
  List<Map<String, dynamic>> _missingItems(
    List<Map<String, dynamic>> sent,
    Map<String, dynamic> order,
  ) {
    final have = ((order['items'] as List?) ?? const [])
        .whereType<Map>()
        .map((e) => e['id']?.toString())
        .whereType<String>()
        .toSet();
    return sent
        .where((it) => !have.contains(it['id']?.toString()))
        .toList();
  }

  // ── Stol keshi (navbatdagi ish ham shu yerda ko'rinadi) ───────────────────

  String _orderKey(String tableId) => '${_cachePrefix}order:$tableId';

  Map<String, dynamic>? _readCachedOrder(String tableId) {
    final raw = _box.get(_orderKey(tableId)) as String?;
    if (raw == null) return null;
    try {
      final decoded = jsonDecode(raw);
      return decoded is Map ? decoded.cast<String, dynamic>() : null;
    } catch (_) {
      return null;
    }
  }

  Future<void> _cacheOrder(String tableId, Map<String, dynamic> order) async {
    if (tableId.isEmpty) return;
    await _box.put(_orderKey(tableId), jsonEncode(order));
    await _markTable(tableId, order);
  }

  Future<void> _forgetCachedOrder(String tableId) async {
    if (tableId.isEmpty) return;
    await _box.delete(_orderKey(tableId));
    await _markTable(tableId, null);
  }

  /// Keshdagi stollar ro'yxatiga bandlikni yozadi.
  ///
  /// Navbatdagi buyurtma stollar setkasida ko'rinmasa, ofitsiant o'zi
  /// buyurtma bergan stolni "bo'sh" deb ko'rar va ikkinchi marta ochardi.
  Future<void> _markTable(String tableId, Map<String, dynamic>? order) async {
    for (final key in _box.keys.whereType<String>().toList()) {
      if (!key.startsWith('${_cachePrefix}tables:')) continue;
      final raw = _box.get(key) as String?;
      if (raw == null) continue;
      List list;
      try {
        list = jsonDecode(raw) as List;
      } catch (_) {
        continue;
      }
      var changed = false;
      final updated = list.map((e) {
        final row = (e as Map).cast<String, dynamic>();
        if (row['id'] != tableId) return row;
        changed = true;
        if (order == null) {
          return {...row, 'status': 'free'}
            ..remove('open_order_id')
            ..remove('open_order_total');
        }
        return {
          ...row,
          'status': 'busy',
          'open_order_id': order['id'],
          'open_order_total': order['total_amount'] ?? _itemsTotal(order),
        };
      }).toList();
      if (changed) await _box.put(key, jsonEncode(updated));
    }
  }

  num _itemsTotal(Map<String, dynamic> order) {
    final items = (order['items'] as List?) ?? const [];
    return items.whereType<Map>().fold<num>(0, (sum, it) {
      final price = num.tryParse('${it['price']}') ?? 0;
      final qty = num.tryParse('${it['quantity']}') ?? 0;
      return sum + price * qty;
    });
  }

  /// Navbatga qo'yilgan buyurtmani o'z o'qish yo'limizga ham yozamiz.
  ///
  /// Aks holda ofitsiant o'sha stolga qaytganda kesh bo'sh bo'lar, ekran
  /// "ochiq buyurtma yo'q" der va ikkinchi buyurtma yaratilardi — birinchi
  /// navbatdagi taomlar esa POS'da "stolda allaqachon buyurtma bor" javobiga
  /// urilib yo'qolardi.
  Future<void> _enqueueCreate(Map<String, dynamic> payload) async {
    await _enqueue('create_order', payload);
    final tableId = payload['table_id'] as String? ?? '';
    if (tableId.isEmpty) return;
    final items = ((payload['items'] as List?) ?? const [])
        .whereType<Map>()
        .map((e) => e.cast<String, dynamic>())
        .toList();
    final shadow = <String, dynamic>{
      'id': payload['id'],
      'table_id': tableId,
      'guest_count': payload['guest_count'] ?? 1,
      'comment': payload['comment'],
      'status': 'open',
      'items': items,
      'sync_state': 'pending',
      // Ekran buni ko'rsatishi mumkin: bu buyurtma hali kassaga yetmagan.
      'queued': true,
    };
    shadow['total_amount'] = _itemsTotal(shadow);
    await _cacheOrder(tableId, shadow);
  }

  /// Navbatga qo'yilgan qatorlarni keshdagi buyurtmaga ham qo'shadi.
  Future<void> _shadowAppend(
    String orderId,
    String? tableId,
    List<Map<String, dynamic>> items,
  ) async {
    final key = tableId != null && tableId.isNotEmpty
        ? tableId
        : _tableIdForOrder(orderId);
    if (key == null) return;
    final cached = _readCachedOrder(key);
    if (cached == null || cached['id'] != orderId) return;
    final existing = ((cached['items'] as List?) ?? const [])
        .whereType<Map>()
        .map((e) => e.cast<String, dynamic>())
        .toList();
    final seen = existing.map((it) => it['id']?.toString()).toSet();
    final merged = [
      ...existing,
      ...items.where((it) => !seen.contains(it['id']?.toString())),
    ];
    final updated = {...cached, 'items': merged, 'queued': true};
    updated['total_amount'] = _itemsTotal(updated);
    await _cacheOrder(key, updated);
  }

  String? _tableIdForOrder(String orderId) {
    for (final key in _box.keys.whereType<String>()) {
      if (!key.startsWith('${_cachePrefix}order:')) continue;
      final raw = _box.get(key) as String?;
      if (raw == null) continue;
      try {
        final decoded = jsonDecode(raw);
        if (decoded is Map && decoded['id'] == orderId) {
          return decoded['table_id'] as String?;
        }
      } catch (_) {
        continue;
      }
    }
    return null;
  }

  /// Shu stolda hali yuborilmagan navbat yozuvi bormi.
  Map<String, dynamic>? _queuedOrderFor(String tableId) {
    final has = _outbox().any((op) {
      if (op['failed'] == true) return false;
      final payload = (op['payload'] as Map?)?.cast<String, dynamic>();
      return payload?['table_id'] == tableId;
    });
    return has ? _readCachedOrder(tableId) : null;
  }

  // ── Navbat ────────────────────────────────────────────────────────────────

  Future<void> _enqueue(String type, Map<String, dynamic> payload) async {
    final id = UuidV4.generate();
    await _box.put(
      '$_outboxPrefix$id',
      jsonEncode({
        'id': id,
        'type': type,
        'payload': payload,
        'created_at': DateTime.now().toIso8601String(),
      }),
    );
  }

  /// Navbat — **yaratilgan vaqti bo'yicha** tartiblangan.
  ///
  /// Kalit bo'yicha tartiblash mumkin emas: kalit UUID, ya'ni tartib
  /// tasodifiy. Bunda stolga qator qo'shish so'rovi buyurtmani yaratish
  /// so'rovidan oldin ketib, POS'dan `order_not_found` olardi va o'sha
  /// taomlar butunlay yo'qolardi.
  List<Map<String, dynamic>> _outbox() {
    final out = <Map<String, dynamic>>[];
    for (final key in _box.keys.whereType<String>()) {
      if (!key.startsWith(_outboxPrefix)) continue;
      final raw = _box.get(key) as String?;
      if (raw == null) continue;
      try {
        out.add({...jsonDecode(raw) as Map<String, dynamic>, '_key': key});
      } catch (_) {
        // Buzuq yozuv — o'tkazib yuboramiz, lekin o'chirmaymiz.
      }
    }
    out.sort((a, b) {
      final at = DateTime.tryParse(a['created_at']?.toString() ?? '');
      final bt = DateTime.tryParse(b['created_at']?.toString() ?? '');
      if (at == null || bt == null) return 0;
      return at.compareTo(bt);
    });
    return out;
  }

  /// Yuborilishi kutilayotgan buyurtmalar (rad etilganlar bunga kirmaydi).
  int get queuedCount =>
      _outbox().where((op) => op['failed'] != true).length;

  /// POS rad etgan va qayta urinish yordam bermaydigan yozuvlar.
  ///
  /// Alohida sanaladi: ularni `queuedCount` ichida qoldirish "yuborilmoqda"
  /// belgisini abadiy yoqib qo'yardi va ofitsiant hech qachon nima
  /// bo'lganini bilmasdi. Yozuv o'chirilmaydi — kassir qo'lda hal qiladi.
  int get failedCount => _outbox().where((op) => op['failed'] == true).length;

  List<Map<String, dynamic>> get failedOperations =>
      _outbox().where((op) => op['failed'] == true).toList();

  /// Hali yuborilmagan yozuvlar — navbat ekrani ularni ochib ko'rsatadi.
  /// Faqat o'qish uchun: nusxa qaytadi, uni o'zgartirish navbatga ta'sir
  /// qilmaydi.
  List<Map<String, dynamic>> get pendingOperations =>
      _outbox().where((op) => op['failed'] != true).toList();

  /// Navbatdagilarni POS'ga yuboradi.
  ///
  /// Har bir aylanishda chaqirsa bo'ladi: qayta kirishdan o'zi himoyalangan.
  /// Faqat "aloqa yo'q → bor" o'tishida chaqirish yetarli emas edi — bitta
  /// timeout bilan navbatga tushgan buyurtma o'sha o'tishni ko'rmay smena
  /// oxirigacha yotib qolardi.
  Future<void> flushQueue() async {
    if (_flushing) return;
    _flushing = true;
    try {
      for (final op in _outbox()) {
        // Rad etilganini qayta urmaymiz — javob o'zgarmaydi, faqat har
        // aylanishda bir xil xato takrorlanadi.
        if (op['failed'] == true) continue;
        final key = op['_key'] as String;

        final payload = (op['payload'] as Map).cast<String, dynamic>();
        try {
          switch (op['type']) {
            case 'create_order':
              final res = await _request('POST', '/orders', body: payload);
              await _settleQueuedCreate(payload, res?['data']);
              break;
            case 'append_items':
              await _request(
                'POST',
                '/orders/${payload['order_id']}/items',
                body: {'items': payload['items']},
              );
              break;
          }
          await _box.delete(key);
        } on _HttpFailure catch (e) {
          if (_isRetryable(e)) {
            // Sessiya o'lgan yoki POS band. Bu yozuvning aybi emas —
            // `failed` deb belgilash bitta POS restartini butun navbatning
            // abadiy yo'qolishiga aylantirardi. Navbatda qoldiramiz.
            if (kDebugMode) {
              debugPrint('[LanApi] queue op deferred: ${e.statusCode}');
            }
            break;
          }
          if (op['type'] == 'append_items' && _isClosedOrMissing(e)) {
            // Buyurtma yopilgan — qatorlarni yangi buyurtmaga o'tkazamiz,
            // tashlab yubormaymiz.
            final moved = await _requeueAsCreate(key, op, payload);
            if (moved) continue;
          }
          // POS rad etdi — qayta urinish yordam bermaydi. Yozuvni saqlab
          // qo'yamiz va belgilaymiz, jimgina o'chirmaymiz.
          await _box.put(
            key,
            jsonEncode({
              ...op..remove('_key'), // ichki maydon, diskka yozilmaydi
              'failed': true,
              'error': e.body ?? '${e.statusCode}',
              'failed_at': DateTime.now().toIso8601String(),
            }),
          );
          if (kDebugMode) {
            debugPrint('[LanApi] queue op rejected: ${e.statusCode}');
          }
        } catch (_) {
          // Aloqa yana yo'qoldi — keyingi safar.
          break;
        }
      }
    } finally {
      _flushing = false;
    }
  }

  /// Navbatdagi "buyurtma yaratish" javobini tekshiradi.
  ///
  /// POS stolda boshqa ochiq buyurtma borligini aytib o'z buyurtmasini
  /// qaytarishi mumkin. O'shanda yozuvni shunchaki o'chirsak, navbatdagi
  /// taomlar hech qaerda qolmasdi — mavjud buyurtmaga qo'shib yuboramiz.
  Future<void> _settleQueuedCreate(
    Map<String, dynamic> payload,
    Object? data,
  ) async {
    if (data is! Map) return;
    final order = data.cast<String, dynamic>();
    final tableId = payload['table_id'] as String? ?? '';
    final sent = ((payload['items'] as List?) ?? const [])
        .whereType<Map>()
        .map((e) => e.cast<String, dynamic>())
        .toList();
    final missing = _missingItems(sent, order);
    if (missing.isEmpty) {
      await _cacheOrder(tableId, order);
      return;
    }
    final existingId = order['id'] as String? ?? '';
    if (existingId.isEmpty) return;
    // Xato bo'lsa tashqi `catch` ushlaydi va yozuv navbatda qoladi.
    await _request(
      'POST',
      '/orders/$existingId/items',
      body: {'items': missing},
    );
    await _cacheOrder(tableId, order);
  }

  /// Yopilgan buyurtmaga tegishli navbat yozuvini yangi buyurtmaga aylantiradi.
  Future<bool> _requeueAsCreate(
    String key,
    Map<String, dynamic> op,
    Map<String, dynamic> payload,
  ) async {
    final tableId = payload['table_id'] as String? ?? '';
    if (tableId.isEmpty) return false;
    await _box.put(
      key,
      jsonEncode({
        ...op..remove('_key'),
        'type': 'create_order',
        'payload': {
          'id': UuidV4.generate(),
          'table_id': tableId,
          'guest_count': 1,
          'items': payload['items'],
        },
      }),
    );
    return true;
  }

  // ── HTTP ──────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>?> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
  }) async {
    final base = baseUrl;
    if (base == null || base.isEmpty) {
      throw const SocketException('POS manzili sozlanmagan');
    }

    final uri = Uri.parse('$base$path');
    final HttpClientResponse res;
    final String text;
    try {
      final req = await _http.openUrl(method, uri);
      req.headers.contentType = ContentType.json;
      if (auth) {
        final t = token;
        if (t != null && t.isNotEmpty) {
          req.headers.set('Authorization', 'Bearer $t');
        }
      }
      if (body != null) req.write(jsonEncode(body));

      res = await req.close().timeout(const Duration(seconds: 8));
      text = await utf8.decoder.bind(res).join();
    } catch (_) {
      // Transport xatosi — POS yetib bo'lmadi. Buni belgilamasak chip
      // "Ulangan" deb yolg'on gapirar va navbat bo'shatilmasdi: flush
      // "yo'q → bor" o'tishiga qarab ishlaydi, o'tish esa hech qachon
      // sodir bo'lmasdi.
      _setReachable(false);
      rethrow;
    }

    if (res.statusCode >= 400) {
      Map<String, dynamic>? data;
      String? message;
      try {
        final decoded = jsonDecode(text);
        if (decoded is Map) {
          data = decoded.cast<String, dynamic>();
          message = (data['error'] ?? data['message'])?.toString();
        }
      } catch (_) {
        message = text.isEmpty ? null : text;
      }
      // 423 — POS qulflangan. Sessiya yaroqsiz deb belgilamaymiz: muammo
      // tokenda emas va qayta kirish yordam bermaydi.
      if (res.statusCode == LanRestServer.lockedStatus) {
        _setReachable(true);
        if (!_serverLockedController.isClosed) {
          _serverLockedController.add(message ?? '');
        }
        throw _HttpFailure(res.statusCode, message, data);
      }
      // 401/403 — POS sessiyani tanimadi (odatda qayta ishga tushgan).
      // Bu buyurtmaning rad etilishi emas, ulanishning o'lishi.
      if (auth && (res.statusCode == HttpStatus.unauthorized ||
          res.statusCode == HttpStatus.forbidden)) {
        _flagAuthInvalid();
      } else {
        _setReachable(true);
      }
      throw _HttpFailure(res.statusCode, message, data);
    }

    _setReachable(true);
    if (auth) _authValid = true;

    if (text.isEmpty) return null;
    final decoded = jsonDecode(text);
    return decoded is Map ? decoded.cast<String, dynamic>() : null;
  }

  bool _setReachable(bool value) {
    if (_lastReachable != value) {
      _lastReachable = value;
      if (!_connectionController.isClosed) _connectionController.add(value);
    }
    return value;
  }

  /// Sessiya o'ldi. Aloqa "yo'q" ga tushadi: POS soketga javob bersa ham
  /// bizning yozuvlarimizni qabul qilmayapti, ya'ni ofitsiant uchun u
  /// yetib bo'lmas holatda.
  void _flagAuthInvalid() {
    _setReachable(false);
    if (!_authValid) return;
    _authValid = false;
    if (!_authInvalidController.isClosed) _authInvalidController.add(null);
  }

  /// Jonli kanaldan kelgan buyurtmani keshga yozadi.
  ///
  /// Bu **manba emas** — ekranlar baribir REST'dan o'qiydi. Bu shunchaki
  /// keshni pollingni kutmasdan yangilash, ya'ni to'langan stol tabletda
  /// 15 soniya "band" bo'lib turmasligi uchun.
  Future<void> applyLiveOrder(Map<String, dynamic> order) async {
    final tableId = order['table_id'] as String? ?? '';
    if (tableId.isEmpty) return;
    if (order['status'] != 'open') {
      await _forgetCachedOrder(tableId);
      return;
    }
    await _cacheOrder(tableId, order);
  }

  /// Jonli kanaldan kelgan stol holati.
  Future<void> applyLiveTableStatus(String tableId, String status) async {
    if (tableId.isEmpty) return;
    if (status == 'busy') {
      final cached = _readCachedOrder(tableId);
      if (cached != null) await _markTable(tableId, cached);
      return;
    }
    // Stol bo'shadi — navbatdagi ishimiz bo'lsa keshni tozalamaymiz, aks
    // holda hali yuborilmagan buyurtma ko'zdan yo'qolardi.
    if (_queuedOrderFor(tableId) != null) return;
    await _forgetCachedOrder(tableId);
  }

  Future<void> dispose() async {
    _http.close(force: true);
    if (!_connectionController.isClosed) await _connectionController.close();
    if (!_authInvalidController.isClosed) {
      await _authInvalidController.close();
    }
  }
}

class _HttpFailure implements Exception {
  final int statusCode;
  final String? body;

  /// To'liq javob — 409 dagi mavjud buyurtma id'si shu yerdan olinadi.
  final Map<String, dynamic>? data;

  const _HttpFailure(this.statusCode, this.body, [this.data]);

  @override
  String toString() => 'HTTP $statusCode: ${body ?? ''}';
}
