import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:mary_ai_pos/core/services/lan/lan_api_client.dart';

/// POS dan kelgan jonli xabar.
class LanEvent {
  /// `snapshot` | `order_created` | `order_updated` | `table_status`.
  final String type;
  final Map<String, dynamic> raw;

  const LanEvent(this.type, this.raw);

  Map<String, dynamic>? get order {
    final value = raw['order'];
    return value is Map ? value.cast<String, dynamic>() : null;
  }

  /// `snapshot` dagi ochiq buyurtmalar.
  List<Map<String, dynamic>> get orders {
    final value = raw['orders'];
    if (value is! List) return const [];
    return value
        .whereType<Map>()
        .map((e) => e.cast<String, dynamic>())
        .toList();
  }

  String? get tableId =>
      raw['table_id'] as String? ?? order?['table_id'] as String?;

  String? get status => raw['status'] as String?;
}

/// POS'ning `/ws` kanaliga ulanadi.
///
/// **Bu kanal haqiqat manbai emas.** Ekranlar ma'lumotni baribir REST'dan
/// o'qiydi; WebSocket faqat "endi o'qi" degan turtki va stol holatini
/// darhol yangilash uchun. Polling xavfsizlik to'ri sifatida qoladi —
/// soket uzilib qolgan payt ham ofitsiant eskirgan ekranga qaramaydi.
///
/// Nima uchun kerak: usiz ofitsiant dunyoni faqat 15 soniyalik polling
/// orqali bilardi, buyurtma ekrani esa umuman yangilanmasdi. Kassir stolni
/// yopgan bir zumda ofitsiant o'sha yopiq buyurtmaga taom qo'shib yuborardi.
class LanWsClient {
  /// Qayta ulanish kutish vaqti shu chegaradan oshmaydi — POS yoqilganda
  /// ofitsiant uzoq kutib qolmasligi kerak.
  static const _maxBackoff = Duration(seconds: 20);
  static const _handshakeTimeout = Duration(seconds: 6);

  final LanApiClient _api;
  final _events = StreamController<LanEvent>.broadcast();
  final Random _rnd = Random();

  WebSocket? _socket;
  StreamSubscription<dynamic>? _sub;
  Timer? _retryTimer;
  int _attempt = 0;
  bool _opening = false;
  bool _disposed = false;

  LanWsClient(this._api);

  /// Dekodlangan hodisalar. Ekran bularni ko'rib o'zini yangilaydi.
  Stream<LanEvent> get events => _events.stream;

  bool get isConnected => _socket != null;

  /// Ulanishni boshlaydi. Bir necha marta chaqirish bezarar — login'dan
  /// keyin ham, ekran ochilganda ham chaqirsa bo'ladi.
  void connect() {
    if (_disposed || _socket != null || _opening) return;
    _attempt = 0;
    unawaited(_open());
  }

  Future<void> disconnect() async {
    _retryTimer?.cancel();
    _retryTimer = null;
    await _sub?.cancel();
    _sub = null;
    final socket = _socket;
    _socket = null;
    await socket?.close();
  }

  Future<void> dispose() async {
    _disposed = true;
    await disconnect();
    if (!_events.isClosed) await _events.close();
  }

  // ── Ichki ────────────────────────────────────────────────────────────────

  Future<void> _open() async {
    if (_disposed || _opening || _socket != null) return;
    final url = _wsUrl();
    if (url == null) {
      _scheduleRetry();
      return;
    }

    _opening = true;
    try {
      final socket = await WebSocket.connect(url).timeout(_handshakeTimeout);
      if (_disposed) {
        await socket.close();
        return;
      }
      _socket = socket;
      _attempt = 0;
      _sub = socket.listen(
        _onMessage,
        onDone: _onClosed,
        onError: (Object _) => _onClosed(),
        cancelOnError: true,
      );
      if (kDebugMode) debugPrint('[LanWs] ulandi: $url');
    } catch (e) {
      if (kDebugMode) debugPrint('[LanWs] ulanmadi: $e');
      // Qo'l siqish o'tmadi. Sabab ikki xil bo'lishi mumkin: POS o'chgan yoki
      // token o'lgan (POS restartida sessiyalar xotira bilan ketadi).
      // `ping()` ikkalasini ajratadi va tegishlisini belgilaydi — uzilgan
      // soket ham `ping()` kabi "POS yetib bo'lmaydi" degani bo'lishi kerak.
      await _api.ping();
      _scheduleRetry();
    } finally {
      _opening = false;
    }
  }

  void _onClosed() {
    if (kDebugMode) debugPrint('[LanWs] uzildi');
    _sub?.cancel();
    _sub = null;
    _socket = null;
    if (_disposed) return;
    _scheduleRetry();
  }

  void _scheduleRetry() {
    if (_disposed) return;
    _retryTimer?.cancel();
    final base = Duration(seconds: 1 << min(_attempt, 5));
    final delay = base > _maxBackoff ? _maxBackoff : base;
    _attempt++;
    // Bir nechta tablet bir vaqtda urilib POS'ni bo'g'masligi uchun.
    final jitter = Duration(milliseconds: _rnd.nextInt(400));
    _retryTimer = Timer(delay + jitter, () => unawaited(_open()));
  }

  Future<void> _onMessage(dynamic raw) async {
    if (raw is! String) return;
    Map<String, dynamic> decoded;
    try {
      final value = jsonDecode(raw);
      if (value is! Map) return;
      decoded = value.cast<String, dynamic>();
    } catch (_) {
      return;
    }

    final type = decoded['type'] as String? ?? '';
    if (type.isEmpty) return;
    final event = LanEvent(type, decoded);

    // Keshni oldindan yangilaymiz — ekran REST javobini kutmasdan to'g'ri
    // holatni ko'rsatadi. REST kelganda baribir u yozib ketadi.
    switch (type) {
      case 'snapshot':
        for (final order in event.orders) {
          await _api.applyLiveOrder(order);
        }
        break;
      case 'order_created':
      case 'order_updated':
        final order = event.order;
        if (order != null) await _api.applyLiveOrder(order);
        break;
      case 'table_status':
        final tableId = event.tableId;
        final status = event.status;
        if (tableId != null && status != null) {
          await _api.applyLiveTableStatus(tableId, status);
        }
        break;
    }

    if (!_events.isClosed) _events.add(event);
  }

  /// `http://host:port` → `ws://host:port/ws?token=…`.
  /// Token query parametrida: WebSocket qo'l siqishiga header qo'yib
  /// bo'lmaydi, POS ham uni aynan shu yerdan o'qiydi.
  String? _wsUrl() {
    final base = _api.baseUrl;
    final token = _api.token;
    if (base == null || base.isEmpty) return null;
    if (token == null || token.isEmpty) return null;
    final uri = Uri.tryParse(base);
    if (uri == null) return null;
    final scheme = uri.scheme == 'https' ? 'wss' : 'ws';
    return uri
        .replace(scheme: scheme, path: '/ws', queryParameters: {'token': token})
        .toString();
  }
}
