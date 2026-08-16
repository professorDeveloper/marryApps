import 'dart:convert';

/// `GET /api/v1/settings/printer-settings` — `data[]` elementi.
class PrinterSettingEntry {
  const PrinterSettingEntry({
    required this.id,
    required this.ip,
    required this.port,
    required this.type,
    required this.connectedEntityIds,
    this.connectionType = 'cable',
  });

  final String id;
  final String ip;
  final int port;
  /// `category` yoki `close_check`
  final String type;
  final List<String> connectedEntityIds;

  /// API: **`cable`** (LAN), **`wlan`** (Wi‑Fi); default `cable`. Kelajakda boshqa turlar bo‘lishi mumkin.
  final String connectionType;

  bool get isCloseCheck => type == 'close_check';
  bool get isCategory => type == 'category';

  /// `cable` / `wlan` — tarmoq TCP; `wifi` / `lan` / `ethernet` sinonim.
  bool get isNetworkTcp {
    switch (connectionType.toLowerCase()) {
      case 'cable':
      case 'wlan':
      case 'wifi':
      case 'lan':
      case 'ethernet':
        return true;
      default:
        return false;
    }
  }

  factory PrinterSettingEntry.fromJson(Map<String, dynamic> json) {
    final rawIds = json['connected_entity_ids'] ?? json['connectedEntityIds'];
    final ids = <String>[];
    if (rawIds is List) {
      for (final e in rawIds) {
        final s = e.toString().trim();
        if (s.isNotEmpty) ids.add(s);
      }
    }
    var port = 9100;
    final p = json['port'];
    if (p is int) {
      port = p;
    } else if (p != null) {
      port = int.tryParse(p.toString()) ?? 9100;
    }
    if (port <= 0 || port > 65535) port = 9100;

    var connectionType =
        (json['connection_type'] ?? json['connectionType'] ?? 'cable')
            .toString()
            .trim();
    if (connectionType.isEmpty) connectionType = 'cable';

    return PrinterSettingEntry(
      id: json['id']?.toString() ?? '',
      ip: json['ip']?.toString().trim() ?? '',
      port: port,
      type: (json['type']?.toString() ?? '').trim(),
      connectedEntityIds: ids,
      connectionType: connectionType,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'ip': ip,
        'port': port,
        'type': type,
        'connection_type': connectionType,
        'connected_entity_ids': connectedEntityIds,
      };

  static List<PrinterSettingEntry> listFromJsonList(List<dynamic> raw) => raw
      .map(
        (e) => PrinterSettingEntry.fromJson(
          Map<String, dynamic>.from(e as Map),
        ),
      )
      .toList();

  static String encodeList(List<PrinterSettingEntry> list) =>
      jsonEncode(list.map((e) => e.toJson()).toList());
}

