import 'package:mary_ai_pos/features/view/main/data/models/table_timer/table_segment_model.dart';

export 'package:mary_ai_pos/features/view/main/data/models/table_timer/table_segment_model.dart';

/// Bitta pause sessiyasi — boshlanish, tugash vaqti va davomiyligi.
class PauseInterval {
  final DateTime startedAt;
  final DateTime? endedAt;
  final int durationSec;

  const PauseInterval({
    required this.startedAt,
    this.endedAt,
    required this.durationSec,
  });

  factory PauseInterval.fromJson(Map<String, dynamic> json) {
    // timer API: started_at/ended_at | bill API: paused_at/resumed_at
    final startRaw = (json['started_at'] ?? json['paused_at']) as String?;
    final endRaw = (json['ended_at'] ?? json['resumed_at']) as String?;
    final durationMinutes = (json['duration_minutes'] as num?)?.toInt();
    return PauseInterval(
      startedAt:
          (startRaw != null ? DateTime.tryParse(startRaw) : null) ??
          DateTime.now(),
      endedAt: endRaw != null ? DateTime.tryParse(endRaw) : null,
      durationSec:
          (json['duration_sec'] as num?)?.toInt() ??
          (json['pause_sec'] as num?)?.toInt() ??
          (json['seconds'] as num?)?.toInt() ??
          (durationMinutes != null ? durationMinutes * 60 : null) ??
          0,
    );
  }
}

/// `GET/POST /api/v1/orders/{id}/table-timer*` javobi (`data` obyekti).
class TableTimerResponse {
  final String orderId;
  final String tableId;

  /// Order joriy turgan stol id'si — transferdan keyin yangilanadi.
  /// Server `current_table_id` field'i orqali qaytaradi.
  final String? currentTableId;

  /// Joriy faol session id (transferda yangilanadi).
  final String? sessionId;
  final String tableType;

  /// none | running | paused | closed
  final String state;
  final DateTime? startedAt;
  final DateTime? activeStartedAt;
  final DateTime? endedAt;
  final DateTime? pausedAt;
  final String? pricePerHour;
  final int accumulatedActiveSec;
  final int currentActiveSec;
  final int totalActiveSec;
  final String? currentAmount;
  final String? finalAmount;
  final bool isRunning;
  final bool isPaused;
  final bool isClosed;
  final List<PauseInterval> pauses;

  /// Stol o'tish tarixi: har bir segment (transferdan transfergacha) ma'lumotlari.
  /// Multi-switch (time → simple → time) holatida har bosqich alohida segment.
  final List<TableSegment> tableHistory;

  const TableTimerResponse({
    required this.orderId,
    required this.tableId,
    this.currentTableId,
    this.sessionId,
    required this.tableType,
    required this.state,
    this.startedAt,
    this.activeStartedAt,
    this.endedAt,
    this.pausedAt,
    this.pricePerHour,
    this.accumulatedActiveSec = 0,
    this.currentActiveSec = 0,
    this.totalActiveSec = 0,
    this.currentAmount,
    this.finalAmount,
    this.isRunning = false,
    this.isPaused = false,
    this.isClosed = false,
    this.pauses = const [],
    this.tableHistory = const [],
  });

  static DateTime? _parseDt(Object? v) {
    if (v == null) return null;
    if (v is String) return DateTime.tryParse(v);
    return null;
  }

  static List<PauseInterval> _parsePauses(Object? v) {
    if (v == null) return const [];
    if (v is! List) return const [];
    return v
        .whereType<Map<String, dynamic>>()
        .map(PauseInterval.fromJson)
        .toList();
  }

  static List<TableSegment> _parseHistory(Object? v) {
    if (v is! List) return const [];
    return v
        .whereType<Map<String, dynamic>>()
        .map(TableSegment.fromJson)
        .toList();
  }

  factory TableTimerResponse.fromJson(Map<String, dynamic> json) {
    final topLevelPauses = _parsePauses(
      json['pauses'] ?? json['pause_intervals'] ?? json['pause_sessions'],
    );
    final history = _parseHistory(json['table_history']);
    final historyPauses = topLevelPauses.isEmpty
        ? history.expand((s) => s.pauses).toList()
        : const <PauseInterval>[];
    return TableTimerResponse(
      orderId: json['order_id'] as String? ?? '',
      tableId: json['table_id'] as String? ?? '',
      currentTableId: json['current_table_id'] as String?,
      sessionId: json['session_id'] as String?,
      tableType: json['table_type'] as String? ?? '',
      state: json['state'] as String? ?? 'none',
      startedAt: _parseDt(json['started_at']),
      activeStartedAt: _parseDt(json['active_started_at']),
      endedAt: _parseDt(json['ended_at']),
      pausedAt: _parseDt(json['paused_at'] ?? json['last_paused_at']),
      pricePerHour: json['price_per_hour']?.toString(),
      accumulatedActiveSec:
          (json['accumulated_active_sec'] as num?)?.toInt() ?? 0,
      currentActiveSec: (json['current_active_sec'] as num?)?.toInt() ?? 0,
      totalActiveSec: (json['total_active_sec'] as num?)?.toInt() ?? 0,
      currentAmount: json['current_amount']?.toString(),
      finalAmount: json['final_amount']?.toString(),
      isRunning: json['is_running'] as bool? ?? false,
      isPaused: json['is_paused'] as bool? ?? false,
      isClosed: json['is_closed'] as bool? ?? false,
      pauses: topLevelPauses.isNotEmpty ? topLevelPauses : historyPauses,
      tableHistory: history,
    );
  }

  bool get isTimeBasedTable => tableType.toLowerCase() == 'time_based';

  String get stateNormalized => state.toLowerCase();

  /// Timer terminal yopiq holatda (transfer time→simple yoki yakuniy yopilgan).
  /// Bu holatda yangi vaqt hisoblanmaydi; `finalAmount` muzlatilgan summa sifatida ko'rsatiladi.
  bool get isFrozenClosed => stateNormalized == 'closed' || isClosed;

  int get totalPauseSec => pauses.fold(0, (s, p) => s + p.durationSec);
}

/// Parse "12500.00" or "12 500" amount strings → integer som.
int parseAmountToInt(String? raw) {
  if (raw == null || raw.isEmpty) return 0;
  final cleaned = raw.replaceAll(RegExp(r'[^0-9.]'), '');
  return (double.tryParse(cleaned) ?? 0).round();
}
