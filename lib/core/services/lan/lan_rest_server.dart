import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:mary_ai_pos/core/services/auth/offline_auth_cache.dart';
import 'package:mary_ai_pos/core/services/cache/cache_service.dart';
import 'package:mary_ai_pos/core/services/local/local_order_store.dart';
import 'package:mary_ai_pos/core/utils/parse_num.dart';
import 'package:mary_ai_pos/core/utils/uuid_v4.dart';

/// POS ichida ishlaydigan LAN REST + WebSocket serveri.
///
/// **Muhim qoida:** bu server faqat lokal ombordan (`CacheService`,
/// `LocalOrderStore`) o'qiydi va faqat unga yozadi. Cloudga hech qachon
/// so'rov yubormaydi. Aks holda internet o'chganda LAN API ham o'lardi —
/// butun mashqning ma'nosi yo'qolardi. Cloud bilan sinxronizatsiya
/// alohida jarayon (outbox drainer).
class LanRestServer {
  /// Biznex'ning server ilovasi 28080 da turadi — to'qnashmaslik uchun
  /// MaryApps 28085 ni oladi. Sozlamalardan o'zgartirsa bo'ladi.
  static const int defaultPort = 28085;

  /// `HttpStatus` da 423 yo'q — WebDAV kodi, lekin "resurs bor, lekin
  /// qulflangan" ma'nosini aynan u beradi.
  static const int lockedStatus = 423;

  /// O'lik soket faqat TCP timeout'dan keyin ko'rinardi — u paytgacha
  /// `clientCount` yolg'on gapiradi va broadcast bo'shliqqa ketadi.
  static const Duration _wsPingInterval = Duration(seconds: 20);

  final CacheService cache;
  final LocalOrderStore orders;
  final OfflineAuthCache authCache;

  /// Stol holati o'zgarganda POS UI xabardor bo'lishi uchun.
  final void Function(String tableId, String status)? onTableChanged;

  /// Ofitsiant yangi buyurtma yaratganda / qator qo'shganda.
  final void Function(LocalOrder order)? onOrderChanged;

  /// Buyurtmaga tushgan **yangi** qatorlar — oshxona cheki uchun.
  ///
  /// `onOrderChanged` butun buyurtmani beradi; uni chop etsak har qo'shimchada
  /// allaqachon pishirilgan taomlar qayta chiqardi. Bu callback esa faqat
  /// replay filtridan o'tgan qatorlarni beradi, shuning uchun ofitsiant
  /// so'rovni takrorlasa oshxona ikkinchi chekni olmaydi.
  final void Function(LocalOrder order, List<Map<String, dynamic>> items)?
      onItemsAdded;

  /// Litsenziya qulfi. `true` qaytarsa server barcha endpointlarga 423 beradi.
  ///
  /// Callback sifatida olinadi (bool emas), chunki qulf holati ishlash
  /// paytida o'zgaradi va serverni qayta ko'tarish kerak bo'lmasligi kerak.
  final bool Function() isLocked;

  HttpServer? _server;
  final Set<WebSocket> _wsClients = {};
  final _SessionStore _sessions = _SessionStore();
  final _PinRateLimiter _pinLimiter = _PinRateLimiter();

  LanRestServer({
    required this.cache,
    required this.orders,
    required this.authCache,
    this.onTableChanged,
    this.onOrderChanged,
    this.onItemsAdded,
    this.isLocked = _neverLocked,
  });

  static bool _neverLocked() => false;

  bool get isRunning => _server != null;
  int get clientCount => _wsClients.length;
  int get port => _server?.port ?? defaultPort;

  Future<void> start({int port = defaultPort}) async {
    if (_server != null) return;
    try {
      _server = await HttpServer.bind(InternetAddress.anyIPv4, port);
      _server!.listen(_handle, onError: (Object e) {
        if (kDebugMode) debugPrint('[LanRest] server error: $e');
      });
      if (kDebugMode) debugPrint('[LanRest] listening on :$port');
    } on SocketException catch (e) {
      if (kDebugMode) debugPrint('[LanRest] bind failed on :$port — $e');
      rethrow;
    }
  }

  Future<void> stop() async {
    for (final ws in List.of(_wsClients)) {
      await ws.close();
    }
    _wsClients.clear();
    await _server?.close(force: true);
    _server = null;
  }

  // ── Routing ───────────────────────────────────────────────────────────────

  Future<void> _handle(HttpRequest req) async {
    final res = req.response;
    res.headers
      ..add('Access-Control-Allow-Origin', '*')
      ..add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      ..add('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method == 'OPTIONS') {
      res.statusCode = HttpStatus.ok;
      await res.close();
      return;
    }

    final path = req.uri.path;

    try {
      // Qulf darvozasi — auth'dan ham, `/health` dan ham oldin. Ataylab:
      // qulflangan POS "yo'q" emas, "yopiq" bo'lib ko'rinishi kerak. Serverni
      // butunlay to'xtatsak planshetda oddiy "tarmoq yo'q" xatosi chiqardi va
      // ofitsiant WiFi'ni qidirib yurardi.
      if (isLocked()) {
        return _json(
          res,
          {
            'locked': true,
            'message': 'POS litsenziyasi faol emas. Kassirga murojaat qiling.',
          },
          status: lockedStatus,
        );
      }

      // WebSocket — auth token query parametrida (header qo'yib bo'lmaydi).
      if (path == '/ws') {
        await _handleWebSocket(req);
        return;
      }

      // Ochiq endpointlar.
      if (path == '/health') return _json(res, _health());
      if (path == '/auth/pin' && req.method == 'POST') {
        return await _handlePinLogin(req, res);
      }

      // Qolgani token talab qiladi.
      final session = _sessionFor(req);
      if (session == null) {
        return _json(res, {'error': 'unauthorized'},
            status: HttpStatus.unauthorized);
      }

      switch (path) {
        case '/halls':
          return _json(res, {'data': cache.getHalls()});

        case '/tables':
          final hallId = req.uri.queryParameters['hall_id'];
          var tables = cache.getTables();
          if (hallId != null && hallId.isNotEmpty) {
            tables = tables.where((t) => t['hall_id'] == hallId).toList();
          }
          return _json(res, {'data': _withOccupancy(tables)});

        case '/categories':
          return _json(res, {'data': cache.getCategories()});

        case '/goods':
          return _json(res, {'data': _goods(req.uri.queryParameters)});

        case '/orders':
          if (req.method == 'POST') {
            return await _handleCreateOrder(req, res, session);
          }
          return _json(res, {
            'data': orders.openOrders().map((o) => o.toJson()).toList(),
          });
      }

      // /orders/table/{tableId}
      final tableMatch =
          RegExp(r'^/orders/table/([^/]+)$').firstMatch(path);
      if (tableMatch != null && req.method == 'GET') {
        final tableId = tableMatch.group(1)!;
        final local = orders.openOrderForTable(tableId);
        if (local != null) return _json(res, {'data': local.toJson()});
        // Lokalda yo'q — demak chekni kassir online ochgan. Kesh dagi cloud
        // chekini **lokal shaklga o'girib** qaytaramiz. Ilgari u o'z shaklida
        // ketardi (`bill_status`, `good_name`) va ofitsiant ilovasi uni
        // "ochiq buyurtma" deb tanimay o'sha stolga ikkinchi buyurtma
        // ochardi. Bitta endpoint — bitta sxema.
        final adopted = _cloudOrderForTable(tableId);
        return _json(res, {'data': adopted?.toJson()});
      }

      // /orders/{id}/items
      final itemsMatch =
          RegExp(r'^/orders/([^/]+)/items$').firstMatch(path);
      if (itemsMatch != null && req.method == 'POST') {
        return await _handleAppendItems(req, res, itemsMatch.group(1)!);
      }

      _json(res, {'error': 'not_found', 'path': path},
          status: HttpStatus.notFound);
    } catch (e, st) {
      if (kDebugMode) debugPrint('[LanRest] $path → $e\n$st');
      _json(res, {'error': 'internal_error'},
          status: HttpStatus.internalServerError);
    }
  }

  // ── Handlerlar ────────────────────────────────────────────────────────────

  Map<String, dynamic> _health() => {
        'ok': true,
        'service': 'mary_ai_pos_lan',
        'ws_clients': _wsClients.length,
        'open_orders': orders.openOrders().length,
        'pending_sync': orders.pendingSync().length,
        'dead_letters': orders.deadLetters().length,
        'server_time': DateTime.now().toIso8601String(),
      };

  Future<void> _handlePinLogin(HttpRequest req, HttpResponse res) async {
    final body = await _readJson(req);
    final brandId = body['brand_id'] as String? ?? '';
    final pincode = body['pincode'] as String? ?? '';

    // PIN 4 xonali — brute-force'ni cheklamasak LAN'dagi har kim kira oladi.
    final clientKey = req.connectionInfo?.remoteAddress.address ?? 'unknown';
    if (!_pinLimiter.allow(clientKey)) {
      return _json(res, {'error': 'too_many_attempts'},
          status: HttpStatus.tooManyRequests);
    }

    if (brandId.isEmpty || pincode.isEmpty) {
      return _json(res, {'error': 'brand_id and pincode required'},
          status: HttpStatus.badRequest);
    }

    final cached = authCache.getForPin(brandId, pincode);
    if (cached == null) {
      _pinLimiter.recordFailure(clientKey);
      return _json(res, {'error': 'invalid_credentials'},
          status: HttpStatus.unauthorized);
    }

    _pinLimiter.reset(clientKey);
    final token = _sessions.create(
      userId: cached.userModelJson['id'] as String? ?? '',
      brandId: brandId,
    );
    _json(res, {
      'token': token,
      'user': cached.userModelJson,
    });
  }

  Future<void> _handleCreateOrder(
    HttpRequest req,
    HttpResponse res,
    _Session session,
  ) async {
    final body = await _readJson(req);
    final tableId = body['table_id'] as String? ?? '';
    if (tableId.isEmpty) {
      return _json(res, {'error': 'table_id required'},
          status: HttpStatus.badRequest);
    }

    // Klient o'z id'sini bergan bo'lsa — o'shani ishlatamiz. Bu ofitsiant
    // ilovasi javobni olmay qayta yuborgan holatni bezarar qiladi: xuddi shu
    // id bilan buyurtma bor bo'lsa uni qaytaramiz, yangisini yaratmaymiz.
    final clientId = body['id'] as String?;
    if (clientId != null && clientId.isNotEmpty) {
      final existing = orders.getById(clientId);
      if (existing != null) {
        return _json(res, {'data': existing.toJson(), 'replayed': true});
      }
    }

    final categoryByGoodId = _categoryByGoodId();
    final items = ((body['items'] as List?) ?? const [])
        .map((e) => (e as Map).cast<String, dynamic>())
        .map((e) => _normalizeItem(e, categoryByGoodId))
        .toList();

    // Stolda allaqachon ochiq buyurtma bo'lsa (ikkinchi ofitsiant, yoki
    // kassir online ochgan chek) — qatorlarni **o'shanga qo'shamiz**.
    //
    // Ilgari bu yerda mavjud buyurtma 200 bilan qaytarilardi, so'rovdagi
    // qatorlar esa hech qayerga yozilmasdi: ofitsiantga "Kassaga yuborildi"
    // deyilardi, taom pishirilardi va hech bir chekda ko'rinmasdi.
    final open = orders.openOrderForTable(tableId) ?? _adoptCloudOrder(tableId);
    if (open != null) {
      final seen = open.items.map((it) => it['id']).toSet();
      final fresh = items.where((it) => !seen.contains(it['id'])).toList();
      if (fresh.isEmpty) {
        return _json(res, {'data': open.toJson(), 'replayed': true});
      }
      final merged = await orders.appendItems(open.id, fresh);
      if (merged != null) {
        onOrderChanged?.call(merged);
        // Faqat `fresh` — `merged.items` da adopt qilingan cloud chekining
        // allaqachon pishirilgan qatorlari ham bor.
        onItemsAdded?.call(merged, fresh);
        _broadcast({'type': 'order_updated', 'order': merged.toJson()});
        return _json(res, {'data': merged.toJson(), 'merged': true});
      }
    }

    final order = LocalOrder(
      id: clientId?.isNotEmpty == true ? clientId! : UuidV4.generate(),
      tableId: tableId,
      waiterId: body['waiter_id'] as String? ?? session.userId,
      guestCount: (body['guest_count'] as num?)?.toInt() ?? 1,
      comment: body['comment'] as String?,
      orderType: body['order_type'] as String? ?? 'dine_in',
      items: items,
      clientCreatedAt: DateTime.now(),
    );

    await orders.upsert(order);
    onOrderChanged?.call(order);
    if (order.items.isNotEmpty) onItemsAdded?.call(order, order.items);
    onTableChanged?.call(tableId, 'busy');
    _broadcast({
      'type': 'order_created',
      'order': order.toJson(),
    });
    _broadcast({
      'type': 'table_status',
      'table_id': tableId,
      'status': 'busy',
    });

    _json(res, {'data': order.toJson()}, status: HttpStatus.created);
  }

  Future<void> _handleAppendItems(
    HttpRequest req,
    HttpResponse res,
    String orderId,
  ) async {
    final body = await _readJson(req);
    final rawItems = (body['items'] as List?) ?? const [];
    if (rawItems.isEmpty) {
      return _json(res, {'error': 'items required'},
          status: HttpStatus.badRequest);
    }

    final categoryByGoodId = _categoryByGoodId();
    final items = rawItems
        .map((e) => (e as Map).cast<String, dynamic>())
        .map((e) => _normalizeItem(e, categoryByGoodId))
        .toList();

    // Takroriy yuborishni bloklash: har bir qatorning o'z client id'si bor,
    // allaqachon mavjudlarini tashlab yuboramiz.
    //
    // Lokalda topilmasa — kassir online ochgan chek bo'lishi mumkin. Uni
    // keshdan lokal omborga qabul qilamiz, aks holda ofitsiant kassaning
    // chekiga umuman taom qo'sha olmasdi (doim 404).
    final existing = orders.getById(orderId) ?? _adoptCloudOrderById(orderId);
    if (existing == null) {
      return _json(res, {'error': 'order_not_found'},
          status: HttpStatus.notFound);
    }

    // Kassir chekni yopgan bo'lishi mumkin — ofitsiantning ekrani esa eski
    // holatni ushlab turgan bo'ladi. Bunga qatorlarni qo'shsak ular hech bir
    // hisobga tushmaydi, shuning uchun ochiq aytamiz.
    if (existing.status != 'open') {
      return _json(res, {'error': 'order_closed', 'order_id': existing.id},
          status: HttpStatus.conflict);
    }

    final seen = existing.items.map((it) => it['id']).toSet();
    final fresh = items.where((it) => !seen.contains(it['id'])).toList();

    if (fresh.isEmpty) {
      return _json(res, {'data': existing.toJson(), 'replayed': true});
    }

    final LocalOrder? updated;
    try {
      updated = await orders.appendItems(orderId, fresh);
    } on StateError {
      return _json(res, {'error': 'order_closed', 'order_id': existing.id},
          status: HttpStatus.conflict);
    }
    if (updated == null) {
      return _json(res, {'error': 'order_not_found'},
          status: HttpStatus.notFound);
    }

    onOrderChanged?.call(updated);
    onItemsAdded?.call(updated, fresh);
    _broadcast({'type': 'order_updated', 'order': updated.toJson()});
    _json(res, {'data': updated.toJson()});
  }

  // ── Cloud chekini lokal omborga qabul qilish ──────────────────────────────

  /// Stol bo'yicha kesh dagi cloud chekini lokal shaklda qaytaradi
  /// (**yozmasdan** — o'qish so'rovi omborni o'zgartirmasligi kerak).
  LocalOrder? _cloudOrderForTable(String tableId) {
    final cached = cache.getOrderDetail(tableId);
    if (cached == null) return null;
    final order = LocalOrder.fromCloudDetail(cached);
    if (order == null || order.status != 'open') return null;
    return order;
  }

  /// Yozuv so'rovi kelganda cloud chekini haqiqatan omborga ko'chiradi —
  /// shundan keyin unga qator qo'shish va delta sinxronizatsiya ishlaydi.
  LocalOrder? _adoptCloudOrder(String tableId) {
    final order = _cloudOrderForTable(tableId);
    if (order == null) return null;
    unawaited(orders.upsert(order));
    return order;
  }

  LocalOrder? _adoptCloudOrderById(String orderId) {
    for (final table in cache.getTables()) {
      final tableId = table['id']?.toString();
      if (tableId == null) continue;
      final order = _cloudOrderForTable(tableId);
      if (order != null && order.id == orderId) {
        unawaited(orders.upsert(order));
        return order;
      }
    }
    return null;
  }

  /// Qatorga barqaror client id beradi — replay himoyasi shunga tayanadi.
  ///
  /// `category_id` ni **shu yerda** to'ldiramiz: oshxona printeri aynan
  /// kategoriya bo'yicha tanlanadi, ofitsiant ilovasi esa buyurtmada faqat
  /// `good_id` yuboradi. Qatorga yozib qo'ysak POS qayta ishga tushgandan
  /// keyin ham, kesh yangilangandan keyin ham chek to'g'ri printerga boradi.
  Map<String, dynamic> _normalizeItem(
    Map<String, dynamic> raw,
    Map<String, String> categoryByGoodId,
  ) {
    final id = raw['id'] as String?;
    final goodId = raw['good_id']?.toString();
    final categoryId =
        raw['category_id']?.toString() ?? categoryByGoodId[goodId];
    return {
      'id': (id != null && id.isNotEmpty) ? id : UuidV4.generate(),
      'good_id': raw['good_id'],
      'name': raw['name'],
      'quantity': asInt(raw['quantity'], 1),
      'price': asNum(raw['price']),
      if (categoryId != null && categoryId.isNotEmpty)
        'category_id': categoryId,
      if (raw['comment'] != null) 'comment': raw['comment'],
      if (raw['modifiers'] != null) 'modifiers': raw['modifiers'],
      'created_at':
          raw['created_at'] ?? DateTime.now().toUtc().toIso8601String(),
    };
  }

  /// `good_id → category_id` indeksi. Har so'rovda bir marta quriladi —
  /// keshlansa menyu yangilangach eskirib qolardi, qator boshiga chiziqli
  /// qidiruv esa katta menyuda bekorga sarflangan ish.
  Map<String, String> _categoryByGoodId() {
    final index = <String, String>{};
    for (final g in cache.getGoods()) {
      final id = g['id']?.toString();
      final categoryId = g['category_id']?.toString();
      if (id == null || categoryId == null || categoryId.isEmpty) continue;
      index[id] = categoryId;
    }
    return index;
  }

  List<Map<String, dynamic>> _goods(Map<String, String> q) {
    var goods = cache.getGoods();
    final categoryId = q['category_id'];
    if (categoryId != null && categoryId.isNotEmpty) {
      goods = goods.where((g) => g['category_id'] == categoryId).toList();
    }
    final search = q['q']?.trim().toLowerCase();
    if (search != null && search.isNotEmpty) {
      goods = goods
          .where((g) =>
              (g['name'] as String? ?? '').toLowerCase().contains(search))
          .toList();
    }
    // Cloud narxni satr sifatida beradi (`"price": "45000"`) va kesh o'sha
    // shaklni saqlaydi. Klientlar raqam kutadi — shu yerda bir marta
    // normallashtiramiz, aks holda har bir klient o'zi o'girishi kerak
    // bo'lardi (va o'girmagani menyuni chiza olmasdi).
    return [
      for (final g in goods) {...g, 'price': asNum(g['price'])},
    ];
  }

  /// Stollarga lokal ochiq buyurtma holatini qo'shadi — ofitsiant qaysi stol
  /// bandligini internetsiz ham ko'radi.
  List<Map<String, dynamic>> _withOccupancy(List<Map<String, dynamic>> tables) {
    final busy = {for (final o in orders.openOrders()) o.tableId: o};
    return tables.map((t) {
      final id = t['id'] as String?;
      final order = id == null ? null : busy[id];
      return {
        ...t,
        if (order != null) 'status': 'busy',
        if (order != null) 'open_order_id': order.id,
        if (order != null) 'open_order_total': order.total,
      };
    }).toList();
  }

  // ── WebSocket ─────────────────────────────────────────────────────────────

  Future<void> _handleWebSocket(HttpRequest req) async {
    final token = req.uri.queryParameters['token'];
    if (token == null || _sessions.validate(token) == null) {
      req.response.statusCode = HttpStatus.unauthorized;
      await req.response.close();
      return;
    }
    if (!WebSocketTransformer.isUpgradeRequest(req)) {
      req.response.statusCode = HttpStatus.badRequest;
      await req.response.close();
      return;
    }

    final ws = await WebSocketTransformer.upgrade(req);
    // Planshet WiFi'dan chiqib ketsa TCP darhol uzilmaydi. Ping'siz bunday
    // soket `clientCount` da "ulangan ofitsiant" bo'lib turaverardi va
    // broadcast bo'shliqqa ketardi.
    ws.pingInterval = _wsPingInterval;
    _wsClients.add(ws);
    if (kDebugMode) {
      debugPrint('[LanRest] ws client + (total ${_wsClients.length})');
    }

    // Ulanish bilanoq joriy holatni yuboramiz — klient qayta ulanganda
    // o'tkazib yuborgan o'zgarishlarni tiklashi uchun.
    ws.add(jsonEncode({
      'type': 'snapshot',
      'orders': orders.openOrders().map((o) => o.toJson()).toList(),
    }));

    ws.listen(
      (_) {
        // Klient hozircha xabar yubormaydi (faqat tinglaydi).
      },
      onDone: () => _wsClients.remove(ws),
      onError: (_) => _wsClients.remove(ws),
      cancelOnError: true,
    );
  }

  void _broadcast(Map<String, dynamic> event) {
    final payload = jsonEncode(event);
    for (final ws in List.of(_wsClients)) {
      try {
        ws.add(payload);
      } catch (_) {
        _wsClients.remove(ws);
      }
    }
  }

  /// POS tomonidan chaqiriladi — kassada bo'lgan o'zgarish ofitsiantlarga.
  void notifyTableStatus(String tableId, String status) {
    _broadcast({
      'type': 'table_status',
      'table_id': tableId,
      'status': status,
    });
  }

  /// Kassir chekni yopgandan keyin. Planshet buyurtmaning yangi holatini va
  /// stolning bo'shaganini bir vaqtda oladi — aks holda ofitsiant yopilgan
  /// chekka taom qo'shib yuborar va 409 xatosiga urilardi.
  void notifyOrderClosed(LocalOrder order) {
    _broadcast({'type': 'order_updated', 'order': order.toJson()});
    notifyTableStatus(order.tableId, 'free');
  }

  /// Qulf yoqilganda ochiq soketlarni uzadi — qulf tekshiruvi faqat so'rov
  /// kelganda ishlaydi, allaqachon ulangan planshet esa broadcast'ni olishda
  /// davom etardi.
  Future<void> disconnectClients() async {
    for (final ws in List.of(_wsClients)) {
      try {
        await ws.close(WebSocketStatus.policyViolation, 'locked');
      } catch (_) {
        // Soket allaqachon o'lgan bo'lishi mumkin — tozalash muhim, sabab emas.
      }
    }
    _wsClients.clear();
  }

  // ── Yordamchilar ──────────────────────────────────────────────────────────

  _Session? _sessionFor(HttpRequest req) {
    final header = req.headers.value('Authorization') ?? '';
    if (!header.startsWith('Bearer ')) return null;
    return _sessions.validate(header.substring(7));
  }

  Future<Map<String, dynamic>> _readJson(HttpRequest req) async {
    try {
      final raw = await utf8.decoder.bind(req).join();
      if (raw.isEmpty) return {};
      final decoded = jsonDecode(raw);
      return decoded is Map ? decoded.cast<String, dynamic>() : {};
    } catch (_) {
      return {};
    }
  }

  void _json(HttpResponse res, Object? body, {int status = HttpStatus.ok}) {
    res
      ..statusCode = status
      ..headers.contentType = ContentType.json
      ..write(jsonEncode(body));
    res.close();
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _Session {
  final String userId;
  final String brandId;
  final DateTime createdAt;

  _Session({
    required this.userId,
    required this.brandId,
    required this.createdAt,
  });
}

/// Sessiyalar xotirada saqlanadi — POS qayta ishga tushsa ofitsiantlar
/// qaytadan PIN kiritadi. Bu ataylab: smena davomida POS o'chib qolgani
/// ofitsiant uchun ko'rinadigan hodisa bo'lishi kerak.
class _SessionStore {
  static const _ttl = Duration(hours: 16);
  final Map<String, _Session> _sessions = {};
  final Random _rnd = Random.secure();

  String create({required String userId, required String brandId}) {
    _sweep();
    final token = List.generate(
      32,
      (_) => _rnd.nextInt(256).toRadixString(16).padLeft(2, '0'),
    ).join();
    _sessions[token] = _Session(
      userId: userId,
      brandId: brandId,
      createdAt: DateTime.now(),
    );
    return token;
  }

  _Session? validate(String token) {
    final s = _sessions[token];
    if (s == null) return null;
    if (DateTime.now().difference(s.createdAt) > _ttl) {
      _sessions.remove(token);
      return null;
    }
    return s;
  }

  void _sweep() {
    final now = DateTime.now();
    _sessions.removeWhere((_, s) => now.difference(s.createdAt) > _ttl);
  }
}

/// PIN 4 xonali bo'lgani uchun cheklovsiz urinish = 10 000 ta so'rovda kirish.
/// IP bo'yicha 5 ta xato urinishdan keyin 5 daqiqa blok.
class _PinRateLimiter {
  static const _maxFailures = 5;
  static const _lockout = Duration(minutes: 5);

  final Map<String, ({int failures, DateTime? blockedUntil})> _state = {};

  bool allow(String key) {
    final s = _state[key];
    if (s?.blockedUntil == null) return true;
    if (DateTime.now().isAfter(s!.blockedUntil!)) {
      _state.remove(key);
      return true;
    }
    return false;
  }

  void recordFailure(String key) {
    final s = _state[key];
    final failures = (s?.failures ?? 0) + 1;
    _state[key] = (
      failures: failures,
      blockedUntil:
          failures >= _maxFailures ? DateTime.now().add(_lockout) : null,
    );
  }

  void reset(String key) => _state.remove(key);
}
