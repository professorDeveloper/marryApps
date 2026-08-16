import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:mary_ai_pos/core/services/auth/offline_auth_cache.dart';
import 'package:mary_ai_pos/core/services/cache/cache_service.dart';
import 'package:mary_ai_pos/core/services/lan/lan_discovery.dart';
import 'package:mary_ai_pos/core/services/lan/lan_rest_server.dart';
import 'package:mary_ai_pos/core/services/local/local_order_store.dart';
import 'package:mary_ai_pos/core/utils/uuid_v4.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Oshxonaga chiqishi kerak bo'lgan **yangi** qatorlar.
///
/// `LocalOrder` chekning sarlavhasi (stol, mehmonlar soni) uchun, `items` esa
/// aynan shu safar qo'shilganlar — buyurtmaning butun tarkibi emas.
typedef LanKitchenTicket = ({
  LocalOrder order,
  List<Map<String, dynamic>> items,
});

/// POS'ni ofitsiant planshetlari uchun LAN hub'iga aylantiradi.
///
/// `LanHubService` dan farqi: u POS↔POS o'rtasida stol holatini uzatuvchi
/// oddiy WS relay. Bu esa to'liq REST API + WS + discovery — ofitsiant
/// ilovasi menyuni, stollarni va buyurtmalarni **internetsiz** shu yerdan
/// oladi.
class LanServerService {
  static const _keyEnabled = 'lan_server_enabled';
  static const _keyPort = 'lan_server_port';
  static const _keyDeviceId = 'lan_server_device_id';

  final SharedPreferences _prefs;
  final CacheService _cache;
  final LocalOrderStore _orders;
  final OfflineAuthCache _authCache;

  LanRestServer? _rest;
  LanDiscoveryResponder? _discovery;
  Timer? _ipRefreshTimer;
  String? _lastError;

  final _statusController = StreamController<LanServerStatus>.broadcast();
  final _ordersController = StreamController<LocalOrder>.broadcast();
  final _kitchenController = StreamController<LanKitchenTicket>.broadcast();
  final _tableStatusController =
      StreamController<({String tableId, String status})>.broadcast();

  /// Litsenziya qulfi. Integrator uni litsenziya servisiga ulaydi:
  /// `lanServer.isLocked = () => license.isLocked;`.
  ///
  /// Maydon o'zgaruvchan — qulf holati ish paytida o'zgaradi va buning uchun
  /// serverni qayta ko'tarish (ofitsiantlarni tizimdan chiqarish) noto'g'ri
  /// bo'lardi.
  bool Function() isLocked = _neverLocked;

  static bool _neverLocked() => false;

  LanServerService({
    required SharedPreferences prefs,
    required CacheService cache,
    required LocalOrderStore orders,
    required OfflineAuthCache authCache,
  })  : _prefs = prefs,
        _cache = cache,
        _orders = orders,
        _authCache = authCache;

  Stream<LanServerStatus> get onStatusChanged => _statusController.stream;

  /// Ofitsiant LAN orqali buyurtma yaratganda yoki unga qator qo'shganda.
  /// POS UI shu orqali darhol yangilanadi — kassir internetsiz ham
  /// ofitsiantning ishini ko'rib turadi.
  Stream<LocalOrder> get onOrderChanged => _ordersController.stream;

  /// Oshxona cheki uchun — faqat yangi qatorlar. `onOrderChanged` dan alohida,
  /// chunki u butun buyurtmani beradi va uni chop etish takroriy chekka olib
  /// kelardi. `KitchenPrintQueue` shu oqimni tinglaydi.
  Stream<LanKitchenTicket> get onKitchenItems => _kitchenController.stream;

  /// LAN orqali stol bandligi o'zgargani. POS UI stol rangini shu orqali
  /// yangilaydi.
  Stream<({String tableId, String status})> get onTableStatusChanged =>
      _tableStatusController.stream;

  bool get isEnabled => _prefs.getBool(_keyEnabled) ?? false;
  int get port => _prefs.getInt(_keyPort) ?? LanRestServer.defaultPort;
  bool get isRunning => _rest?.isRunning ?? false;
  int get connectedWaiters => _rest?.clientCount ?? 0;

  String get deviceId {
    var id = _prefs.getString(_keyDeviceId);
    if (id == null || id.isEmpty) {
      id = UuidV4.generate();
      _prefs.setString(_keyDeviceId, id);
    }
    return id;
  }

  LanServerStatus get status => LanServerStatus(
        enabled: isEnabled,
        running: isRunning,
        port: port,
        connectedWaiters: connectedWaiters,
        pendingSync: _orders.pendingSync().length,
        deadLetters: _orders.deadLetters().length,
        error: _lastError,
      );

  Future<void> setEnabled(bool value) async {
    await _prefs.setBool(_keyEnabled, value);
    if (value) {
      await start();
    } else {
      await stop();
    }
  }

  Future<void> setPort(int value) async {
    await _prefs.setInt(_keyPort, value);
    if (isRunning) await restart();
  }

  /// App ishga tushganda chaqiriladi. Yoqilmagan bo'lsa hech narsa qilmaydi.
  Future<void> init() async {
    if (!isEnabled) return;
    await start();
  }

  Future<void> start() async {
    if (_rest != null) return;

    final rest = LanRestServer(
      cache: _cache,
      orders: _orders,
      authCache: _authCache,
      onOrderChanged: (order) {
        if (!_ordersController.isClosed) _ordersController.add(order);
      },
      onItemsAdded: (order, items) {
        if (!_kitchenController.isClosed) {
          _kitchenController.add((order: order, items: items));
        }
      },
      onTableChanged: (tableId, tableStatus) {
        if (!_tableStatusController.isClosed) {
          _tableStatusController.add((tableId: tableId, status: tableStatus));
        }
      },
      // Maydonga emas, callback ichidan o'qiymiz: `isLocked` server
      // ko'tarilgandan keyin ham almashtirilishi mumkin.
      isLocked: () => isLocked(),
    );
    try {
      await rest.start(port: port);
      _lastError = null;
    } catch (e) {
      // Port band bo'lishi eng ko'p uchraydigan holat (boshqa ilova yoki
      // POS'ning ikkinchi nusxasi). Buni yutib yuborish mumkin emas:
      // tugma yoqilgandek ko'rinadi, lekin ofitsiantlar ulanolmaydi va
      // sabab hech qayerda ko'rinmaydi.
      _lastError = e is SocketException
          ? '$port port band. Boshqa dastur uni egallab turibdi.'
          : e.toString();
      if (kDebugMode) debugPrint('[LanServer] start failed: $e');
      _statusController.add(status);
      return;
    }
    _rest = rest;

    final discovery = LanDiscoveryResponder(
      restPort: port,
      deviceId: deviceId,
      name: 'Mary AI POS',
    );
    await discovery.start();
    _discovery = discovery;

    // WiFi almashsa yoki kabel ulansa lokal IP o'zgaradi — discovery javobi
    // eskirib qolmasligi uchun vaqti-vaqti bilan yangilaymiz.
    _ipRefreshTimer?.cancel();
    _ipRefreshTimer = Timer.periodic(
      const Duration(minutes: 2),
      (_) => _discovery?.refreshLocalIps(),
    );

    _statusController.add(status);
    if (kDebugMode) {
      debugPrint('[LanServer] running on :$port (device $deviceId)');
    }
  }

  Future<void> stop() async {
    _ipRefreshTimer?.cancel();
    _ipRefreshTimer = null;
    await _discovery?.stop();
    _discovery = null;
    await _rest?.stop();
    _rest = null;
    _statusController.add(status);
  }

  Future<void> restart() async {
    await stop();
    await start();
  }

  /// Kassada stol holati o'zgarganda ofitsiantlarga xabar beradi.
  void notifyTableStatus(String tableId, String tableStatus) {
    _rest?.notifyTableStatus(tableId, tableStatus);
  }

  /// Kassir chekni yopgandan keyin — planshetlar ochiq buyurtmani tashlaydi.
  void notifyOrderClosed(LocalOrder order) {
    _rest?.notifyOrderClosed(order);
  }

  /// Litsenziya qulfi yoqilganda chaqiriladi: yangi so'rovlar 423 oladi,
  /// ochiq soketlar esa shu yerda uziladi.
  Future<void> notifyLockChanged() async {
    if (isLocked()) await _rest?.disconnectClients();
    _statusController.add(status);
  }

  Future<void> dispose() async {
    await stop();
    if (!_statusController.isClosed) await _statusController.close();
    if (!_ordersController.isClosed) await _ordersController.close();
    if (!_kitchenController.isClosed) await _kitchenController.close();
    if (!_tableStatusController.isClosed) {
      await _tableStatusController.close();
    }
  }
}

class LanServerStatus {
  final bool enabled;
  final bool running;
  final int port;
  final int connectedWaiters;
  final int pendingSync;
  final int deadLetters;

  /// Server ko'tarilmagan bo'lsa sababi. Sozlamalarda ko'rsatiladi.
  final String? error;

  const LanServerStatus({
    required this.enabled,
    required this.running,
    required this.port,
    required this.connectedWaiters,
    required this.pendingSync,
    required this.deadLetters,
    this.error,
  });
}
