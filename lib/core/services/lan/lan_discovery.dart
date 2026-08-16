import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';

/// LAN discovery — ofitsiant planshetiga POS'ni qo'lda IP kiritmasdan topish.
///
/// Nega mDNS emas, UDP broadcast: ko'p consumer routerlar IGMP snooping bilan
/// multicast paketlarni (mDNS = 224.0.0.251) qurilmalar orasida bloklaydi.
/// Broadcast (255.255.255.255) esa deyarli har doim o'tadi — DHCP shu ustida
/// ishlaydi.
///
/// Protokol:
///   1. Ofitsiant `MARYPOS-DISCOVER` ni `255.255.255.255:8022` ga yuboradi
///   2. POS unicast javob qaytaradi: `{baseUrl, deviceId, branchId, name}`
///
/// Port tanlovi: Biznex 8021/28080 ni ishlatadi (u yerdan bu yechim
/// ko'chirilgan). Bir kompyuterda ikkalasi turishi mumkin — masalan ishlab
/// chiqish paytida — shuning uchun MaryApps qo'shni raqamlarni oladi.
/// Aks holda `bind` yiqiladi yoki, bundan ham yomoni, ofitsiant ilovasi
/// noto'g'ri serverdan javob oladi.
const int kDiscoveryPort = 8022;
const String kDiscoveryMagic = 'MARYPOS-DISCOVER';

/// Topilgan POS haqida ma'lumot.
class DiscoveredPos {
  final String baseUrl;
  final String deviceId;
  final String? branchId;
  final String name;

  const DiscoveredPos({
    required this.baseUrl,
    required this.deviceId,
    this.branchId,
    this.name = 'POS',
  });

  Map<String, dynamic> toJson() => {
        'baseUrl': baseUrl,
        'deviceId': deviceId,
        'branchId': branchId,
        'name': name,
      };

  static DiscoveredPos? tryParse(String raw) {
    try {
      final m = jsonDecode(raw) as Map<String, dynamic>;
      final baseUrl = m['baseUrl'] as String?;
      if (baseUrl == null || baseUrl.isEmpty) return null;
      return DiscoveredPos(
        baseUrl: baseUrl,
        deviceId: m['deviceId'] as String? ?? '',
        branchId: m['branchId'] as String?,
        name: m['name'] as String? ?? 'POS',
      );
    } catch (_) {
      return null;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POS tomoni — so'rovlarga javob beradi
// ─────────────────────────────────────────────────────────────────────────────

class LanDiscoveryResponder {
  final int restPort;
  final String deviceId;
  final String? branchId;
  final String name;

  RawDatagramSocket? _socket;
  StreamSubscription<RawSocketEvent>? _sub;
  List<String> _localIps = const [];

  LanDiscoveryResponder({
    required this.restPort,
    required this.deviceId,
    this.branchId,
    this.name = 'POS',
  });

  bool get isActive => _socket != null;

  Future<void> start() async {
    if (_socket != null) return;
    await refreshLocalIps();
    try {
      final sock = await RawDatagramSocket.bind(
        InternetAddress.anyIPv4,
        kDiscoveryPort,
        reuseAddress: true,
      );
      sock.broadcastEnabled = true;
      _socket = sock;
      _sub = sock.listen((e) => _onEvent(sock, e));
      if (kDebugMode) {
        debugPrint('[Discovery] listening :$kDiscoveryPort, ips=$_localIps');
      }
    } on SocketException catch (e) {
      if (kDebugMode) debugPrint('[Discovery] bind failed: $e');
    }
  }

  Future<void> refreshLocalIps() async {
    try {
      final ifaces = await NetworkInterface.list(
        type: InternetAddressType.IPv4,
        includeLinkLocal: false,
        includeLoopback: false,
      );
      _localIps = [
        for (final i in ifaces)
          for (final a in i.addresses) a.address,
      ];
    } catch (e) {
      if (kDebugMode) debugPrint('[Discovery] NetworkInterface.list: $e');
    }
  }

  void _onEvent(RawDatagramSocket sock, RawSocketEvent event) {
    if (event != RawSocketEvent.read) return;
    final dg = sock.receive();
    if (dg == null) return;

    String payload;
    try {
      payload = utf8.decode(dg.data).trim();
    } catch (_) {
      return;
    }
    if (payload != kDiscoveryMagic) return;

    final ip = pickReachableAddress(_localIps, dg.address.address);
    final response = jsonEncode({
      'baseUrl': 'http://$ip:$restPort',
      'deviceId': deviceId,
      if (branchId != null) 'branchId': branchId,
      'name': name,
    });
    try {
      sock.send(utf8.encode(response), dg.address, dg.port);
    } catch (e) {
      if (kDebugMode) debugPrint('[Discovery] send failed: $e');
    }
  }

  Future<void> stop() async {
    await _sub?.cancel();
    _sub = null;
    _socket?.close();
    _socket = null;
  }

  /// Klient qaysi subnetdan so'ragan bo'lsa, o'sha subnetdagi IP qaytariladi.
  ///
  /// Bu oddiy `_localIps.first` emas: multi-NIC Windows hostda (Ethernet +
  /// WiFi + Hyper-V/WSL/VPN) birinchi manzil ko'pincha virtual adapterniki
  /// bo'lib chiqadi va planshet yetib bo'lmaydigan `baseUrl` oladi — discovery
  /// "ishlamaydi", qo'lda IP kiritilsa esa ulanadi. Nomzodlarni ball bo'yicha
  /// tanlaymiz: so'rovchi subneti > toza LAN > virtual adapterlar.
  static String pickReachableAddress(List<String> localIps, String requesterIp) {
    if (localIps.isEmpty) return requesterIp;
    final reqOctets = requesterIp.split('.');
    String? best;
    var bestScore = -1;
    for (final ip in localIps) {
      final score = _addressScore(ip, reqOctets);
      if (score > bestScore) {
        bestScore = score;
        best = ip;
      }
    }
    return best ?? localIps.first;
  }

  static int _addressScore(String ip, List<String> reqOctets) {
    final o = ip.split('.');
    if (o.length != 4) return 0;
    final sameReq = reqOctets.length == 4;
    // So'rovchi bilan bir /24 — yetib borishi kafolatlangan.
    if (sameReq &&
        o[0] == reqOctets[0] &&
        o[1] == reqOctets[1] &&
        o[2] == reqOctets[2]) {
      return 100;
    }
    if (sameReq && o[0] == reqOctets[0] && o[1] == reqOctets[1]) return 80;
    // Virtual/VPN adapterlar — oxirgi chora.
    if (_isVirtualRange(o)) return 10;
    if (o[0] == '192' && o[1] == '168') return 60;
    if (o[0] == '10') return 55;
    return 30;
  }

  static bool _isVirtualRange(List<String> o) {
    // VirtualBox host-only.
    if (o[0] == '192' && o[1] == '168' && o[2] == '56') return true;
    // Docker / Hyper-V / WSL default NAT (172.16.0.0/12).
    final second = int.tryParse(o[1]) ?? -1;
    if (o[0] == '172' && second >= 16 && second <= 31) return true;
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Ofitsiant tomoni — POS'ni qidiradi
// ─────────────────────────────────────────────────────────────────────────────

class LanDiscoveryProbe {
  /// Broadcast yuborib javob kutadi. Bir nechta POS javob bersa hammasi
  /// qaytariladi (odatda bitta bo'ladi).
  static Future<List<DiscoveredPos>> discover({
    Duration timeout = const Duration(seconds: 3),
  }) async {
    RawDatagramSocket? sock;
    // deviceId bo'yicha to'playmiz, baseUrl bo'yicha emas. Bitta POS ko'p
    // tarmoq kartali bo'lsa (Ethernet + WiFi + Docker/VM adapterlari) har
    // bir subnet uchun alohida javob qaytaradi va ro'yxatda bitta kassa
    // uch marta ko'rinadi — ulardan ikkitasi planshetdan yetib bo'lmaydi.
    final byDevice = <String, List<DiscoveredPos>>{};
    try {
      sock = await RawDatagramSocket.bind(InternetAddress.anyIPv4, 0);
      sock.broadcastEnabled = true;

      final completer = Completer<void>();
      sock.listen((event) {
        if (event != RawSocketEvent.read) return;
        final dg = sock!.receive();
        if (dg == null) return;
        try {
          final pos = DiscoveredPos.tryParse(utf8.decode(dg.data));
          if (pos == null) return;
          final key = pos.deviceId.isEmpty ? pos.baseUrl : pos.deviceId;
          final list = byDevice.putIfAbsent(key, () => []);
          if (!list.any((p) => p.baseUrl == pos.baseUrl)) list.add(pos);
        } catch (_) {
          // Yaroqsiz javob — e'tiborsiz.
        }
      });

      final data = utf8.encode(kDiscoveryMagic);
      // Global broadcast + har bir interfeysning subnet broadcast manzili.
      // Ba'zi Android qurilmalari 255.255.255.255 ni yubormaydi, shuning
      // uchun ikkalasini ham urinib ko'ramiz.
      for (final addr in await _broadcastTargets()) {
        try {
          sock.send(data, addr, kDiscoveryPort);
        } catch (_) {
          // Bu interfeys ishlamadi — qolganlari bilan davom etamiz.
        }
      }

      Timer(timeout, () {
        if (!completer.isCompleted) completer.complete();
      });
      await completer.future;
    } on SocketException catch (e) {
      if (kDebugMode) debugPrint('[Discovery] probe failed: $e');
    } finally {
      sock?.close();
    }

    // Har bir kassadan bittadan manzil — o'zimizning tarmog'imizga eng
    // yaqinini tanlaymiz.
    final myIps = await _localIps();
    return [
      for (final candidates in byDevice.values)
        _pickBest(candidates, myIps),
    ];
  }

  /// Bir xil kassaning bir nechta manzilidan planshetga yetib boradiganini
  /// tanlaydi: o'z IP'imiz bilan bir /24 da bo'lgani eng yaxshisi, virtual
  /// adapter diapazonlari esa eng oxirgi chora.
  static DiscoveredPos _pickBest(
    List<DiscoveredPos> candidates,
    List<String> myIps,
  ) {
    if (candidates.length == 1) return candidates.first;
    DiscoveredPos best = candidates.first;
    var bestScore = -1;
    for (final c in candidates) {
      final host = Uri.tryParse(c.baseUrl)?.host ?? '';
      var score = -1;
      for (final mine in myIps) {
        score = score > _matchScore(host, mine) ? score : _matchScore(host, mine);
      }
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    return best;
  }

  static int _matchScore(String candidate, String mine) {
    final a = candidate.split('.');
    final b = mine.split('.');
    if (a.length != 4 || b.length != 4) return 0;
    if (LanDiscoveryResponder._isVirtualRange(a)) return 5;
    if (a[0] == b[0] && a[1] == b[1] && a[2] == b[2]) return 100;
    if (a[0] == b[0] && a[1] == b[1]) return 80;
    return 30;
  }

  static Future<List<String>> _localIps() async {
    try {
      final ifaces = await NetworkInterface.list(
        type: InternetAddressType.IPv4,
        includeLinkLocal: false,
        includeLoopback: false,
      );
      return [
        for (final i in ifaces)
          for (final a in i.addresses) a.address,
      ];
    } catch (_) {
      return const [];
    }
  }

  static Future<List<InternetAddress>> _broadcastTargets() async {
    final targets = <InternetAddress>[InternetAddress('255.255.255.255')];
    try {
      final ifaces = await NetworkInterface.list(
        type: InternetAddressType.IPv4,
        includeLinkLocal: false,
        includeLoopback: false,
      );
      for (final i in ifaces) {
        for (final a in i.addresses) {
          final o = a.address.split('.');
          if (o.length != 4) continue;
          // /24 taxmini — uy va ofis tarmoqlarining deyarli hammasi shunday.
          targets.add(InternetAddress('${o[0]}.${o[1]}.${o[2]}.255'));
        }
      }
    } catch (_) {
      // Interfeyslarni o'qib bo'lmadi — global broadcast bilan cheklanamiz.
    }
    return targets;
  }
}
