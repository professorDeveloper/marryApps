import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'lan_hub_client.dart';
import 'lan_hub_message.dart';
import 'lan_hub_server.dart';

enum LanMode { disabled, server, client }

class LanHubService {
  static const _keyMode = 'lan_mode';
  static const _keyServerIp = 'lan_server_ip';

  final SharedPreferences _prefs;
  final _server = LanHubServer();
  final _client = LanHubClient();

  final _tableUpdateController =
      StreamController<({String tableId, String status})>.broadcast();

  Stream<({String tableId, String status})> get onRemoteTableUpdate =>
      _tableUpdateController.stream;

  LanHubService(this._prefs);

  LanMode get mode {
    final v = _prefs.getString(_keyMode) ?? 'disabled';
    return LanMode.values.firstWhere((e) => e.name == v,
        orElse: () => LanMode.disabled);
  }

  Future<void> setMode(LanMode mode) => _prefs.setString(_keyMode, mode.name);

  String get serverIp => _prefs.getString(_keyServerIp) ?? '';

  Future<void> setServerIp(String ip) => _prefs.setString(_keyServerIp, ip);

  /// App start da chaqiriladi.
  Future<void> init() async {
    switch (mode) {
      case LanMode.server:
        await _server.start();
        // Server o'zi ham broadcastni eshitadi (lekin client emas)
        break;
      case LanMode.client:
        final ip = serverIp;
        if (ip.isNotEmpty) {
          await _client.connect(ip);
          _client.onMessage.listen(_handleRemoteMessage);
        }
        break;
      case LanMode.disabled:
        break;
    }
  }

  void _handleRemoteMessage(LanHubMessage msg) {
    if (msg.type == LanHubMessageType.tableStatus &&
        msg.tableId != null &&
        msg.status != null) {
      _tableUpdateController.add((tableId: msg.tableId!, status: msg.status!));
    }
  }

  /// Stol holati o'zgarganda chaqiriladi (order create / pay).
  void tableStatusChanged(String tableId, String status) {
    final msg = LanHubMessage.tableStatus(tableId: tableId, status: status);
    if (kDebugMode) {
      print('[LanHub] tableStatusChanged: $tableId → $status (mode: ${mode.name})');
    }
    switch (mode) {
      case LanMode.server:
        _server.broadcast(msg);
        break;
      case LanMode.client:
        _client.send(msg);
        break;
      case LanMode.disabled:
        break;
    }
  }

  int get clientCount => _server.clientCount;
  bool get isClientConnected => _client.isConnected;

  /// Rejim o'zgarganda — eski server/clientni to'xtatib qayta ishga tushirish.
  Future<void> restart() async {
    await _server.stop();
    await _client.disconnect();
    await init();
  }

  Future<void> dispose() async {
    await _server.stop();
    await _client.dispose();
    if (!_tableUpdateController.isClosed) {
      await _tableUpdateController.close();
    }
  }
}
