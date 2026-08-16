import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/api/list_api.dart';
import 'package:mary_ai_pos/core/api/dio_client.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';

const _indigo = Color(0xFFFB6633);

/// time_based stol uchun timer badge.
/// compact: true  — canvas da kichik ko'rinish.
/// showControls: true — pause/resume tugmalarini ko'rsatish (sidebar uchun).
class TimeBasedTableBadge extends StatefulWidget {
  final CafeTableModel table;
  final bool compact;
  final bool showControls;

  const TimeBasedTableBadge({
    super.key,
    required this.table,
    this.compact = false,
    this.showControls = false,
  });

  @override
  State<TimeBasedTableBadge> createState() => _TimeBasedTableBadgeState();
}

class _TimeBasedTableBadgeState extends State<TimeBasedTableBadge> {
  int _elapsedSec = 0;
  String _amount = '';
  String _timerState = 'none';
  bool _loaded = false;
  bool _actionLoading = false;
  String _orderId = '';

  Timer? _tickTimer;
  Timer? _syncTimer;

  bool get _isBusy => widget.table.status == TableStatus.busy;

  @override
  void initState() {
    super.initState();
    if (_isBusy) _startPolling();
  }

  @override
  void didUpdateWidget(TimeBasedTableBadge old) {
    super.didUpdateWidget(old);
    final wasBusy = old.table.status == TableStatus.busy;
    if (!wasBusy && _isBusy) {
      _startPolling();
    } else if (wasBusy && !_isBusy) {
      _stopPolling();
      if (mounted) {
        setState(() {
          _loaded = false;
          _elapsedSec = 0;
          _amount = '';
          _timerState = 'none';
          _orderId = '';
        });
      }
    }
  }

  void _startPolling() {
    _sync();
    _syncTimer = Timer.periodic(const Duration(seconds: 60), (_) => _sync());
  }

  void _stopPolling() {
    _tickTimer?.cancel();
    _syncTimer?.cancel();
    _tickTimer = null;
    _syncTimer = null;
  }

  Future<void> _sync() async {
    try {
      final dio = inject<DioClient>().dio;

      final orderRes = await dio.get(ListAPI.orderWithTableId(widget.table.id));
      final data = orderRes.data['data'] as List?;
      if (data == null || data.isEmpty) return;
      final orderId = (data[0]['id'] as String?) ?? '';
      if (orderId.isEmpty) return;

      final timerRes = await dio.get(ListAPI.orderTableTimer(orderId));
      final t = timerRes.data['data'] as Map<String, dynamic>?;
      if (t == null) return;

      final totalSec = (t['total_active_sec'] as int?) ?? 0;
      final state = (t['state'] as String?) ?? 'none';
      final amount =
          (t['current_amount'] as String?) ?? (t['final_amount'] as String?) ?? '';

      if (!mounted) return;
      setState(() {
        _orderId = orderId;
        _elapsedSec = totalSec;
        _timerState = state;
        _amount = amount;
        _loaded = true;
      });

      _tickTimer?.cancel();
      _tickTimer = null;
      if (state == 'running') {
        _tickTimer = Timer.periodic(
          const Duration(seconds: 1),
          (_) {
            if (mounted) setState(() => _elapsedSec++);
          },
        );
      }
    } catch (_) {}
  }

  Future<void> _togglePause() async {
    if (_orderId.isEmpty || _actionLoading) return;
    setState(() => _actionLoading = true);
    try {
      final dio = inject<DioClient>().dio;
      if (_timerState == 'running') {
        await dio.post(ListAPI.orderTableTimerPause(_orderId));
      } else if (_timerState == 'paused') {
        await dio.post(ListAPI.orderTableTimerResume(_orderId));
      }
      await _sync();
    } catch (_) {
    } finally {
      if (mounted) setState(() => _actionLoading = false);
    }
  }

  @override
  void dispose() {
    _stopPolling();
    super.dispose();
  }

  static String fmtTime(int sec) {
    final h = sec ~/ 3600;
    final m = (sec % 3600) ~/ 60;
    final s = sec % 60;
    final mm = m.toString().padLeft(2, '0');
    final ss = s.toString().padLeft(2, '0');
    if (h > 0) return '${h.toString().padLeft(2, '0')}:$mm:$ss';
    return '$mm:$ss';
  }

  static String fmtAmount(String raw) {
    // Backend "4436.39" decimal qaytaradi — nuqtani saqlaymiz va yaxlitlaymiz.
    final d = double.tryParse(raw.replaceAll(RegExp(r'[^0-9.]'), ''));
    if (d == null) return raw;
    final n = d.round();
    return n
        .toString()
        .replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ');
  }

  @override
  Widget build(BuildContext context) {
    // ── Canvas compact view ────────────────────────────────────────────
    if (widget.compact) {
      if (_isBusy && _loaded && _timerState != 'none') {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
          decoration: BoxDecoration(
            color: _indigo.withOpacity(0.88),
            borderRadius: BorderRadius.circular(7),
          ),
          child: Text(
            fmtTime(_elapsedSec),
            style: const TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w700,
              color: Colors.white,
              fontFamily: 'Inter',
            ),
          ),
        );
      }
      return Container(
        width: 20,
        height: 20,
        decoration: BoxDecoration(
          color: _indigo,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: _indigo.withOpacity(0.4),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: const Center(
          child: Icon(Icons.timer_outlined, size: 11, color: Colors.white),
        ),
      );
    }

    // ── Not busy or loading ────────────────────────────────────────────
    if (!_isBusy || !_loaded) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
        decoration: BoxDecoration(
          color: _indigo.withOpacity(0.10),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: _indigo.withOpacity(0.22)),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.timer_outlined, size: 10, color: _indigo),
            SizedBox(width: 4),
            Text(
              'Soatbay',
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w600,
                color: _indigo,
                fontFamily: 'Inter',
              ),
            ),
          ],
        ),
      );
    }

    // ── Busy + loaded ──────────────────────────────────────────────────
    final isRunning = _timerState == 'running';
    final isPaused = _timerState == 'paused';
    final icon = isRunning
        ? Icons.play_arrow_rounded
        : isPaused
            ? Icons.pause_rounded
            : Icons.timer_outlined;
    final amountStr = _amount.isNotEmpty ? '${fmtAmount(_amount)} so\'m' : '';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            _indigo.withOpacity(0.15),
            _indigo.withOpacity(0.08),
          ],
        ),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: _indigo.withOpacity(0.30)),
      ),
      child: Row(
        children: [
          // Timer icon + time
          Icon(icon, size: 13, color: _indigo),
          const SizedBox(width: 5),
          Text(
            fmtTime(_elapsedSec),
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: _indigo,
              fontFamily: 'Inter',
              letterSpacing: 0.5,
            ),
          ),
          if (amountStr.isNotEmpty) ...[
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                amountStr,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: _indigo.withOpacity(0.80),
                  fontFamily: 'Inter',
                ),
              ),
            ),
          ] else
            const Spacer(),
          // Pause / Resume button (only in sidebar)
          if (widget.showControls && (isRunning || isPaused)) ...[
            const SizedBox(width: 6),
            GestureDetector(
              onTap: _togglePause,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: isRunning
                      ? const Color(0xFFFB6633).withOpacity(0.12)
                      : const Color(0xFF16A34A).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: _actionLoading
                      ? SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: isRunning
                                ? const Color(0xFFFB6633)
                                : const Color(0xFF16A34A),
                          ),
                        )
                      : Icon(
                          isRunning ? Icons.pause_rounded : Icons.play_arrow_rounded,
                          size: 18,
                          color: isRunning
                              ? const Color(0xFFFB6633)
                              : const Color(0xFF16A34A),
                        ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
