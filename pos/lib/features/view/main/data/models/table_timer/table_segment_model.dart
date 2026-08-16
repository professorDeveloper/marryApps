import 'package:mary_ai_pos/features/view/main/data/models/table_timer/table_timer_response_model.dart';

/// Bitta stol uchun timer segmenti (transferdan transfergacha).
/// `table_history` arrayidan parse qilinadi. Multi-switch (time → simple →
/// time → ...) holatlarida har bir bosqich alohida segment.
class TableSegment {
  final String? segmentId;
  final String? tableId;
  final DateTime? enteredAt;
  final DateTime? leftAt;
  final int activeSeconds;
  final int pausedSeconds;
  final String? movedFromTableId;
  final String? movedToTableId;
  final String? moveInReason;
  final String? moveOutReason;
  final List<PauseInterval> pauses;

  const TableSegment({
    this.segmentId,
    this.tableId,
    this.enteredAt,
    this.leftAt,
    this.activeSeconds = 0,
    this.pausedSeconds = 0,
    this.movedFromTableId,
    this.movedToTableId,
    this.moveInReason,
    this.moveOutReason,
    this.pauses = const [],
  });

  static DateTime? _parseDt(Object? v) {
    if (v is String && v.isNotEmpty) return DateTime.tryParse(v);
    return null;
  }

  static List<PauseInterval> _parsePauses(Object? v) {
    if (v is! List) return const [];
    return v
        .whereType<Map<String, dynamic>>()
        .map(PauseInterval.fromJson)
        .toList();
  }

  factory TableSegment.fromJson(Map<String, dynamic> json) {
    return TableSegment(
      segmentId: json['segment_id'] as String?,
      tableId: json['table_id'] as String?,
      enteredAt: _parseDt(json['entered_at']),
      leftAt: _parseDt(json['left_at']),
      activeSeconds: (json['active_seconds'] as num?)?.toInt() ?? 0,
      pausedSeconds: (json['paused_seconds'] as num?)?.toInt() ?? 0,
      movedFromTableId: json['moved_from_table_id'] as String?,
      movedToTableId: json['moved_to_table_id'] as String?,
      moveInReason: json['move_in_reason'] as String?,
      moveOutReason: json['move_out_reason'] as String?,
      pauses: _parsePauses(json['pause_intervals']),
    );
  }

  /// Stol shu segment davomida o'rtacha qancha vaqt ishlatilgan (sek).
  /// `active_seconds` server tomonda hisoblangan — pauselar chiqarib tashlangan.
  int get effectiveActiveSec => activeSeconds;

  /// Segment tugagan (boshqa stolga ko'chirilgan) bo'lsa true.
  bool get isClosed => leftAt != null;
}
