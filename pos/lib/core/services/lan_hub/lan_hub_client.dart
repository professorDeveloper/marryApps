import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';

import 'lan_hub_message.dart';

class LanHubClient {
  static const defaultPort = 8765;

  WebSocket? _ws;
  String? _serverIp;
  int _port = defaultPort;
  bool _disposed = false;

  final _controller = StreamController<LanHubMessage>.broadcast();
  Stream<LanHubMessage> get onMessage => _controller.stream;

  bool get isConnected => _ws != null && _ws!.readyState == WebSocket.open;

  Future<void> connect(String ip, {int port = defaultPort}) async {
    _serverIp = ip;
    _port = port;
    await _doConnect();
  }

  Future<void> _doConnect() async {
    if (_disposed || _serverIp == null) return;
    try {
      _ws = await WebSocket.connect('ws://$_serverIp:$_port').timeout(
        const Duration(seconds: 5),
      );
      if (kDebugMode) print('[LanHub] Connected to $_serverIp:$_port');

      _ws!.listen(
        (data) {
          if (data is String) {
            final msg = LanHubMessage.tryParse(data);
            if (msg != null) _controller.add(msg);
          }
        },
        onDone: _onDisconnected,
        onError: (_) => _onDisconnected(),
        cancelOnError: true,
      );
    } on SocketException catch (e) {
      if (kDebugMode) print('[LanHub] Connect failed: $e — retrying in 5s');
      _scheduleReconnect();
    } on TimeoutException {
      if (kDebugMode) print('[LanHub] Connect timeout — retrying in 5s');
      _scheduleReconnect();
    } catch (e) {
      if (kDebugMode) print('[LanHub] Unexpected error: $e');
      _scheduleReconnect();
    }
  }

  void _onDisconnected() {
    _ws = null;
    if (kDebugMode) print('[LanHub] Disconnected from hub');
    _scheduleReconnect();
  }

  void _scheduleReconnect() {
    if (_disposed) return;
    Future.delayed(const Duration(seconds: 5), _doConnect);
  }

  void send(LanHubMessage message) {
    if (!isConnected) return;
    try {
      _ws!.add(message.toJson());
    } catch (_) {}
  }

  /// Ulanishni yopadi, ammo qayta ulanishga ruxsat beradi.
  Future<void> disconnect() async {
    await _ws?.close();
    _ws = null;
  }

  /// To'liq o'chirish — qayta ulanish mumkin emas.
  Future<void> dispose() async {
    _disposed = true;
    await _ws?.close();
    _ws = null;
    if (!_controller.isClosed) await _controller.close();
  }
}
