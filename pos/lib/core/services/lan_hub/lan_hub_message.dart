import 'dart:convert';

enum LanHubMessageType { tableStatus, ping }

class LanHubMessage {
  final LanHubMessageType type;
  final String? tableId;
  final String? status; // 'free' | 'busy' | 'away'

  const LanHubMessage({required this.type, this.tableId, this.status});

  factory LanHubMessage.tableStatus({
    required String tableId,
    required String status,
  }) => LanHubMessage(
        type: LanHubMessageType.tableStatus,
        tableId: tableId,
        status: status,
      );

  factory LanHubMessage.ping() =>
      const LanHubMessage(type: LanHubMessageType.ping);

  String toJson() => jsonEncode({
        'type': type.name,
        'table_id': tableId,
        'status': status,
      });

  static LanHubMessage? tryParse(String raw) {
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      final type = LanHubMessageType.values.firstWhere(
        (e) => e.name == map['type'],
        orElse: () => LanHubMessageType.ping,
      );
      return LanHubMessage(
        type: type,
        tableId: map['table_id'] as String?,
        status: map['status'] as String?,
      );
    } catch (_) {
      return null;
    }
  }
}
