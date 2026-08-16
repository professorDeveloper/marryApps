import 'dart:io';

import 'package:flutter/foundation.dart';

import 'lan_hub_message.dart';

class LanHubServer {
  static const defaultPort = 8765;

  HttpServer? _server;
  final Set<WebSocket> _clients = {};

  bool get isRunning => _server != null;
  int get clientCount => _clients.length;

  Future<void> start({int port = defaultPort}) async {
    if (_server != null) return;
    try {
      _server = await HttpServer.bind(InternetAddress.anyIPv4, port);
      _server!.listen(_handleRequest);
      if (kDebugMode) print('[LanHub] Server started on port $port');
    } catch (e) {
      if (kDebugMode) print('[LanHub] Failed to start server: $e');
    }
  }

  void _handleRequest(HttpRequest request) async {
    if (!WebSocketTransformer.isUpgradeRequest(request)) {
      request.response
        ..statusCode = HttpStatus.badRequest
        ..close();
      return;
    }
    final ws = await WebSocketTransformer.upgrade(request);
    _clients.add(ws);
    if (kDebugMode) print('[LanHub] Client connected (total: ${_clients.length})');

    ws.listen(
      (data) {
        // Hub clientdan kelgan xabarni barcha boshqa clientlarga yuboradi
        if (data is String) _broadcastExcept(data, ws);
      },
      onDone: () {
        _clients.remove(ws);
        if (kDebugMode) print('[LanHub] Client disconnected');
      },
      onError: (_) => _clients.remove(ws),
      cancelOnError: true,
    );
  }

  void broadcast(LanHubMessage message) {
    final json = message.toJson();
    for (final ws in List.of(_clients)) {
      try {
        ws.add(json);
      } catch (_) {
        _clients.remove(ws);
      }
    }
  }

  void _broadcastExcept(String json, WebSocket sender) {
    for (final ws in List.of(_clients)) {
      if (ws == sender) continue;
      try {
        ws.add(json);
      } catch (_) {
        _clients.remove(ws);
      }
    }
  }

  Future<void> stop() async {
    for (final ws in _clients) {
      await ws.close();
    }
    _clients.clear();
    await _server?.close(force: true);
    _server = null;
  }
}
