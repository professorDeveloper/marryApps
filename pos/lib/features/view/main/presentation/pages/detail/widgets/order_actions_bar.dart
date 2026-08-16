import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/components/flush_bars.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/design_system/pos_design_system.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/number_formatter.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/core/utils/helper/helper_widget.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/table_timer/table_timer_response_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/pricing/table_pricing_strategy.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/create_order/create_order_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/detail/detail_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/main/main_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/orders/orders_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/table_timer/table_timer_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/detail/detail_screen_mixin.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/detail/widgets/clear_dialog.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/detail/widgets/transfer_table_dialog.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

const _kS900 = Color(0xFF0F172A);
const _kS500 = Color(0xFF64748B);
const _kS200 = Color(0xFFE2E8F0);
const _kS50 = Color(0xFFF8FAFC);

/// Buyurtma boshqaruv qatori — TopBar ostida joylashadi.
/// Total, taymer, service toggle va action tugmalari (Save/Add/Payment) shu yerda.
/// Sidebar tozalanib, faqat itemlar listini ko'rsatadi.
class OrderActionsBar extends StatefulWidget {
  final String? tableId;
  final int guestCount;
  final TableStatus tableStatus;
  final CafeTableModel? cafeTable;
  final ValueChanged<TableStatus> onTableStatusChanged;

  const OrderActionsBar({
    super.key,
    required this.tableId,
    required this.guestCount,
    required this.tableStatus,
    required this.cafeTable,
    required this.onTableStatusChanged,
  });

  @override
  State<OrderActionsBar> createState() => _OrderActionsBarState();
}

class _OrderActionsBarState extends State<OrderActionsBar>
    with DetailScreenMixin {
  String? get tableId => widget.tableId;
  int get guestCount => widget.guestCount;
  TableStatus get tableStatus => widget.tableStatus;
  CafeTableModel? get cafeTable => widget.cafeTable;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return BlocBuilder<DetailBloc, DetailState>(
      builder: (context, state) {
        final orderId = state.activeOrderId;
        final hasSelected = state.selectedGoods.isNotEmpty;
        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(bottom: BorderSide(color: colors.border)),
          ),
          padding: EdgeInsets.symmetric(
            horizontal: PosBreakpoints.pick<double>(
              context,
              compact: PosDimensions.l, // 16
              comfortable: PosDimensions.xl, // 20
            ),
            vertical: PosDimensions.s, // 8
          ),
          child: BlocBuilder<TableTimerCubit, TableTimerState>(
            buildWhen: (p, c) =>
                p.shouldShow != c.shouldShow ||
                p.isMutating != c.isMutating ||
                p.timer?.currentAmount != c.timer?.currentAmount ||
                p.timer?.finalAmount != c.timer?.finalAmount ||
                p.timer?.stateNormalized != c.timer?.stateNormalized ||
                p.displayActiveSec != c.displayActiveSec ||
                p.billPauses.length != c.billPauses.length,
            builder: (ctx, timerState) {
              final existingTotal = calculateTotalPrice(
                state.existingGoods
                    .where((g) => g.commet != 'cancelled')
                    .toList(),
              );
              final foodTotal =
                  (existingTotal + calculateTotalPrice(state.selectedGoods))
                      .round();
              // Stol pricing strategiyasi — time-based (live), frozen, yoki simple.
              final pricing = TablePricingResolver.resolve(
                order: null,
                timer: timerState.timer,
                displayActiveSec:
                    timerState.displayActiveSec ??
                    timerState.timer?.totalActiveSec ??
                    0,
              );
              final timerAmt = pricing.extraCharge;
              final detail = context.read<DetailBloc>().lastDetail;
              final servicePercent = detail?.servicePercent ?? 0;
              final serviceAmt = servicePercent > 0
                  ? (foodTotal * servicePercent / 100).round()
                  : 0;
              final total = foodTotal + timerAmt + serviceAmt;

              return Row(
                children: [
                  // ── Total info ─────────────────────────────────────
                  _TotalBlock(subtotal: foodTotal + timerAmt, total: total),
                  const SizedBox(width: 14),

                  // ── Timer (compact) ────────────────────────────────
                  if (timerState.shouldShow)
                    BlocListener<TableTimerCubit, TableTimerState>(
                      listenWhen: (p, c) => p.isMutating && !c.isMutating,
                      listener: (ctx, _) {
                        if (cafeTable != null) {
                          ctx.read<DetailBloc>().add(
                            DetailEvent.fetchBillOrders(
                              billId: cafeTable!.id,
                              force: true,
                            ),
                          );
                        }
                      },
                      child: const RepaintBoundary(child: _TimerCompact()),
                    ),

                  const Spacer(),

                  // ── Swap (table transfer) ──────────────────────────
                  if (tableId != null &&
                      orderId != null &&
                      tableStatus == TableStatus.busy)
                    _IconBtn(
                      icon: Icons.swap_horiz_rounded,
                      tooltip: S.current.strChangeTable,
                      hoverColor: const Color(0xFFFFEDD5),
                      hoverBorder: const Color(0xFFFB6633),
                      hoverIcon: const Color(0xFFFB6633),
                      onTap: () async {
                        final res = await showTransferTableDialog(
                          context,
                          orderId: orderId,
                          sourceTableId: tableId!,
                          sourceTableType: widget.cafeTable?.tableType,
                        );
                        if (res == true && context.mounted) {
                          Navigator.of(context).pop();
                        }
                      },
                    ),
                  if (tableId != null &&
                      orderId != null &&
                      tableStatus == TableStatus.busy)
                    const SizedBox(width: 6),

                  // ── Trash (clear selection) ────────────────────────
                  if (hasSelected)
                    _IconBtn(
                      icon: Icons.delete_outline_rounded,
                      tooltip: S.current.strClearSelection,
                      hoverColor: const Color(0xFFFEE2E2),
                      hoverBorder: const Color(0xFFFBCDD8),
                      hoverIcon: const Color(0xFFDC2626),
                      onTap: () async {
                        await showDialog(
                          context: context,
                          barrierDismissible: false,
                          builder: (_) => ClearDialog(
                            onSuccess: () => context.read<DetailBloc>().add(
                              const DetailEvent.clearGoods(),
                            ),
                          ),
                        );
                      },
                    ),
                  if (hasSelected) const SizedBox(width: 8),

                  // ── Action buttons ─────────────────────────────────
                  _ActionButtons(
                    tableId: tableId,
                    guestCount: guestCount,
                    tableStatus: tableStatus,
                    cafeTable: cafeTable,
                    selectedGoods: state.selectedGoods,
                    total: total,
                    timerState: timerState,
                    onTableStatusChanged: widget.onTableStatusChanged,
                  ),
                ],
              );
            },
          ),
        );
      },
    );
  }
}

// ─── Total & payment block (compact) ──────────────────────────────────────────
class _TotalBlock extends StatelessWidget {
  final int subtotal;
  final int total;

  const _TotalBlock({required this.subtotal, required this.total});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              S.current.strTotalLabel,
              style: const TextStyle(
                fontSize: 13,
                color: _kS500,
                fontFamily: 'Inter',
              ),
            ),
            const SizedBox(width: 4),
            Text(
              subtotal.formatN,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: _kS900,
                fontFamily: 'Inter',
                fontFeatures: [FontFeature.tabularFigures()],
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              S.current.strPaymentLabel,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: _kS500,
                fontFamily: PosTypography.family,
              ),
            ),
            const SizedBox(width: PosDimensions.s),
            Text(
              total.formatN,
              style: const TextStyle(
                // POS uchun katta — kassir ham mijoz ham masofadan ko'rsin
                fontSize: PosTypography.priceLg, // 24
                fontWeight: FontWeight.w800,
                color: Color(0xFFFB6633),
                fontFamily: PosTypography.family,
                letterSpacing: -0.4,
                fontFeatures: PosTypography.tabularFigures,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ─── Timer (compact) ─────────────────────────────────────────────────────────
class _TimerCompact extends StatelessWidget {
  const _TimerCompact();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<TableTimerCubit, TableTimerState>(
      builder: (context, timerState) {
        final t = timerState.timer;
        final displaySec =
            timerState.displayActiveSec ?? t?.totalActiveSec ?? 0;
        final isFrozen = timerState.isFrozen;
        final isRunning = !isFrozen && t?.stateNormalized == 'running';
        final isPaused = !isFrozen && t?.stateNormalized == 'paused';
        final isNone = !isFrozen && (t == null || t.stateNormalized == 'none');
        const primary = Color(0xFFFB6633);
        final rawAmt = timerState.effectiveCurrentAmount ?? '';
        final amount = rawAmt.isNotEmpty ? _fmtAmount(rawAmt) : '';
        final pauses = timerState.billPauses.isNotEmpty
            ? timerState.billPauses
            : (t?.pauses ?? const <PauseInterval>[]);

        return MouseRegion(
          cursor: SystemMouseCursors.click,
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => showDialog<void>(
              context: context,
              builder: (_) =>
                  _PauseHistoryDialog(pauses: pauses, startedAt: t?.startedAt),
            ),
            child: Container(
              height: 56,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                color: primary.withOpacity(0.12),
                border: Border.all(color: primary, width: 1.2),
                borderRadius: BorderRadius.circular(PosDimensions.radiusMd),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        _fmtTime(displaySec),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: primary,
                          fontFamily: 'Inter',
                          letterSpacing: 0.4,
                          height: 1.0,
                          fontFeatures: [FontFeature.tabularFigures()],
                        ),
                      ),
                      if (amount.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Text(
                            '$amount so\'m',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: primary.withOpacity(0.75),
                              fontFamily: 'Inter',
                            ),
                          ),
                        ),
                    ],
                  ),
                  if (pauses.isNotEmpty) ...[
                    const SizedBox(width: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF59E0B).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.pause_circle_outline_rounded,
                            size: 12,
                            color: Color(0xFFF59E0B),
                          ),
                          const SizedBox(width: 3),
                          Text(
                            '${pauses.length}',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFFF59E0B),
                              fontFamily: 'Inter',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  if (isRunning || isPaused || isNone) ...[
                    const SizedBox(width: 10),
                    GestureDetector(
                      onTap: timerState.isMutating
                          ? null
                          : () => isRunning
                                ? context.read<TableTimerCubit>().pauseTimer()
                                : context.read<TableTimerCubit>().resumeTimer(),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: isRunning
                              ? primary.withOpacity(0.20)
                              : const Color(0xFF22C55E).withOpacity(0.20),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: timerState.isMutating
                              ? SizedBox(
                                  width: 14,
                                  height: 14,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: isRunning
                                        ? primary
                                        : const Color(0xFF22C55E),
                                  ),
                                )
                              : Icon(
                                  isRunning
                                      ? Icons.pause_rounded
                                      : Icons.play_arrow_rounded,
                                  size: 22,
                                  color: isRunning
                                      ? primary
                                      : const Color(0xFF22C55E),
                                ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  static String _fmtTime(int sec) {
    final h = sec ~/ 3600;
    final m = (sec % 3600) ~/ 60;
    final s = sec % 60;
    final mm = m.toString().padLeft(2, '0');
    final ss = s.toString().padLeft(2, '0');
    if (h > 0) return '${h.toString().padLeft(2, '0')}:$mm:$ss';
    return '$mm:$ss';
  }

  static String _fmtAmount(String raw) {
    final d = double.tryParse(raw.replaceAll(RegExp(r'[^0-9.]'), ''));
    if (d == null) return raw;
    return d.round().toString().replaceAllMapped(
      RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]} ',
    );
  }
}

// ─── Pause history dialog ────────────────────────────────────────────────────
String _fmtClockUtil(DateTime dt) {
  final l = dt.toLocal();
  return '${l.hour.toString().padLeft(2, '0')}:${l.minute.toString().padLeft(2, '0')}';
}

String _fmtDurationUtil(int sec) {
  if (sec < 60) return '${sec}s';
  final m = sec ~/ 60;
  final s = sec % 60;
  if (s == 0) return '${m}min';
  return '${m}m ${s}s';
}

class _PauseHistoryDialog extends StatefulWidget {
  final List<PauseInterval> pauses;
  final DateTime? startedAt;

  const _PauseHistoryDialog({required this.pauses, this.startedAt});

  @override
  State<_PauseHistoryDialog> createState() => _PauseHistoryDialogState();
}

class _PauseHistoryDialogState extends State<_PauseHistoryDialog> {
  final ScrollController _ctrl = ScrollController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pauses = widget.pauses;
    final startedAt = widget.startedAt;
    final totalPauseSec = pauses.fold<int>(0, (s, p) => s + p.durationSec);
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 460),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 12, 12),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          S.current.strPauseHistory,
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF0F172A),
                            fontFamily: 'Inter',
                            letterSpacing: -0.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    color: const Color(0xFF64748B),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),
            // Meta row
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
              child: Row(
                children: [
                  if (startedAt != null) ...[
                    const Icon(
                      Icons.schedule_rounded,
                      size: 14,
                      color: Color(0xFF64748B),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      '${S.current.strOpenedAtLabel} ${_fmtClockUtil(startedAt)}',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF64748B),
                        fontFamily: 'Inter',
                      ),
                    ),
                  ],
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '${S.current.strTotalPause} ${_fmtDurationUtil(totalPauseSec)}',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFFF59E0B),
                        fontFamily: 'Inter',
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),
            // List
            if (pauses.isEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
                child: Center(
                  child: Text(
                    S.current.strNoPauses,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF94A3B8),
                      fontFamily: 'Inter',
                    ),
                  ),
                ),
              )
            else
              Flexible(
                child: Scrollbar(
                  controller: _ctrl,
                  thumbVisibility: true,
                  thickness: 4,
                  radius: const Radius.circular(8),
                  child: ListView.separated(
                    controller: _ctrl,
                    shrinkWrap: true,
                    padding: const EdgeInsets.fromLTRB(0, 4, 4, 4),
                    itemCount: pauses.length,
                    separatorBuilder: (_, _) =>
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                    itemBuilder: (_, i) {
                      final p = pauses[i];
                      final dur = p.durationSec > 0
                          ? p.durationSec
                          : (p.endedAt != null
                                ? p.endedAt!
                                      .difference(p.startedAt)
                                      .inSeconds
                                      .abs()
                                : 0);
                      return Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 28,
                              height: 28,
                              decoration: BoxDecoration(
                                color: const Color(
                                  0xFFF59E0B,
                                ).withOpacity(0.12),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Center(
                                child: Text(
                                  '${i + 1}',
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFFF59E0B),
                                    fontFamily: 'Inter',
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            _PauseChip(
                              icon: Icons.pause_rounded,
                              label: _fmtClockUtil(p.startedAt),
                              color: const Color(0xFFF59E0B),
                            ),
                            const SizedBox(width: 8),
                            const Icon(
                              Icons.arrow_forward_rounded,
                              size: 14,
                              color: Color(0xFFCBD5E1),
                            ),
                            const SizedBox(width: 8),
                            _PauseChip(
                              icon: Icons.play_arrow_rounded,
                              label: p.endedAt != null
                                  ? _fmtClockUtil(p.endedAt!)
                                  : '—',
                              color: const Color(0xFF22C55E),
                            ),
                            const Spacer(),
                            Text(
                              dur > 0 ? _fmtDurationUtil(dur) : '—',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF94A3B8),
                                fontFamily: 'Inter',
                                fontFeatures: [FontFeature.tabularFigures()],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _PauseChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _PauseChip({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: color),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: color,
            fontFamily: 'Inter',
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
      ],
    );
  }
}

// ─── Generic icon button ─────────────────────────────────────────────────────
class _IconBtn extends StatefulWidget {
  final IconData icon;
  final String tooltip;
  final Color hoverColor;
  final Color hoverBorder;
  final Color hoverIcon;
  final VoidCallback onTap;

  const _IconBtn({
    required this.icon,
    required this.tooltip,
    required this.hoverColor,
    required this.hoverBorder,
    required this.hoverIcon,
    required this.onTap,
  });

  @override
  State<_IconBtn> createState() => _IconBtnState();
}

class _IconBtnState extends State<_IconBtn> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: Tooltip(
        message: widget.tooltip,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: widget.onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 120),
            // POS minimum touch target — barmoq uchun qulay
            width: PosDimensions.touchTargetMin, // 56
            height: PosDimensions.touchTargetMin,
            decoration: BoxDecoration(
              color: _hovered ? widget.hoverColor : _kS50,
              border: Border.all(color: _hovered ? widget.hoverBorder : _kS200),
              borderRadius: BorderRadius.circular(PosDimensions.radiusMd),
            ),
            child: Icon(
              widget.icon,
              size: 20,
              color: _hovered ? widget.hoverIcon : _kS500,
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Action buttons (Save / Add / Payment) ───────────────────────────────────
class _ActionButtons extends StatelessWidget {
  final String? tableId;
  final int guestCount;
  final TableStatus tableStatus;
  final CafeTableModel? cafeTable;
  final List<OrderItem> selectedGoods;
  final int total;
  final TableTimerState timerState;
  final ValueChanged<TableStatus> onTableStatusChanged;

  const _ActionButtons({
    required this.tableId,
    required this.guestCount,
    required this.tableStatus,
    required this.cafeTable,
    required this.selectedGoods,
    required this.total,
    required this.timerState,
    required this.onTableStatusChanged,
  });

  @override
  Widget build(BuildContext context) {
    // Takeaway
    if (tableId == null) {
      return BlocProvider(
        create: (_) => inject<CreateOrderBloc>()
          ..add(
            const CreateOrderEvent.started(
              tableId: null,
              guestCount: 1,
              tableStatus: TableStatus.free,
            ),
          ),
        child: BlocBuilder<CreateOrderBloc, CreateOrderState>(
          builder: (context, createState) {
            return _PillButton(
              label: S.current.strPayment,
              bgColor: const Color(0xFFFB6633),
              isLoading: createState.status == Status.LOADING,
              trailingAmount: total.formatN,
              onTap: selectedGoods.isNotEmpty
                  ? () => context.read<CreateOrderBloc>().add(
                      CreateOrderEvent.createOrder(orders: selectedGoods),
                    )
                  : null,
            );
          },
        ),
      );
    }

    // Free table — Save
    if (tableStatus == TableStatus.free) {
      return BlocProvider(
        create: (_) => inject<CreateOrderBloc>()
          ..add(
            CreateOrderEvent.started(
              tableId: tableId,
              guestCount: guestCount,
              tableStatus: tableStatus,
            ),
          ),
        child: BlocConsumer<CreateOrderBloc, CreateOrderState>(
          listener: (context, createState) {
            if (createState.status != Status.LOADING && createState.success) {
              if (createState.tableId.isNotEmpty) {
                context.read<SavedOrdersBloc>().add(
                  SavedOrdersEvent.removeOrder(tableId: createState.tableId),
                );
              }
              context.read<MainCubit>().updateTableStatus(
                createState.tableId,
                TableStatus.busy,
              );
              if (cafeTable != null) {
                context.read<DetailBloc>().add(
                  DetailEvent.fetchBillOrders(
                    billId: cafeTable!.id,
                    force: true,
                  ),
                );
              }
              context.read<DetailBloc>().add(const DetailEvent.clearGoods());
              showSuccessMessage(
                navigatorKey.currentContext!,
                S.current.strOrderSuccessCreated,
              );
              onTableStatusChanged(TableStatus.busy);
            }
          },
          builder: (context, createState) {
            return _PillButton(
              label: S.current.strSave,
              bgColor: const Color(0xFFFB6633),
              isLoading: createState.status == Status.LOADING,
              onTap: selectedGoods.isNotEmpty
                  ? () {
                      final bloc = context.read<CreateOrderBloc>();
                      final activeId = context
                          .read<DetailBloc>()
                          .state
                          .activeOrderId;
                      if (activeId != null) bloc.bindActiveOrder(activeId);
                      bloc.add(
                        CreateOrderEvent.createOrder(orders: selectedGoods),
                      );
                    }
                  : null,
            );
          },
        ),
      );
    }

    // Busy table — Add items + Payment
    return BlocProvider(
      create: (ctx) {
        final bloc = inject<CreateOrderBloc>()
          ..add(
            CreateOrderEvent.started(
              tableId: tableId,
              guestCount: guestCount,
              tableStatus: tableStatus,
            ),
          );
        final activeId = ctx.read<DetailBloc>().state.activeOrderId;
        if (activeId != null) bloc.bindActiveOrder(activeId);
        return bloc;
      },
      child: MultiBlocListener(
        listeners: [
          BlocListener<DetailBloc, DetailState>(
            listenWhen: (p, c) =>
                p.activeOrderId != c.activeOrderId && c.activeOrderId != null,
            listener: (ctx, s) {
              ctx.read<CreateOrderBloc>().bindActiveOrder(s.activeOrderId!);
            },
          ),
        ],
        child: BlocConsumer<CreateOrderBloc, CreateOrderState>(
          listener: (context, createState) {
            if (createState.status != Status.LOADING && createState.success) {
              showSuccessMessage(context, S.current.strOrderSuccessCreated);
              context.read<DetailBloc>().add(
                DetailEvent.fetchBillOrders(billId: cafeTable!.id, force: true),
              );
              context.read<DetailBloc>().add(const DetailEvent.clearGoods());
            }
          },
          builder: (context, createState) {
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (selectedGoods.isNotEmpty) ...[
                  _PillButton(
                    label: S.current.strAddItems,
                    bgColor: const Color(0xFF16A34A),
                    isLoading: createState.status == Status.LOADING,
                    onTap: () {
                      final bloc = context.read<CreateOrderBloc>();
                      final activeId = context
                          .read<DetailBloc>()
                          .state
                          .activeOrderId;
                      if (activeId != null) bloc.bindActiveOrder(activeId);
                      bloc.add(
                        CreateOrderEvent.createOrder(orders: selectedGoods),
                      );
                    },
                  ),
                  const SizedBox(width: 8),
                ],
                _PillButton(
                  label: S.current.strPayment,
                  bgColor: const Color(0xFFFB6633),
                  isLoading: false,
                  trailingAmount: total.formatN,
                  onTap: () async {
                    final timerCubit = context.read<TableTimerCubit>();
                    if (cafeTable?.tableType?.toLowerCase() == 'time_based' &&
                        timerCubit.state.timer?.isRunning == true) {
                      await timerCubit.pauseTimer();
                    }
                    final ts = timerCubit.state;
                    final timerData = ts.timer;
                    final hourAmt = ts.effectiveCurrentAmount;
                    if (!context.mounted) return;
                    Navigator.pushNamed(
                      context,
                      AppRoutes.paymentScreen,
                      arguments: {
                        'table_id': tableId,
                        'table_type': cafeTable?.tableType ?? 'simple',
                        'hour_amount': hourAmt,
                        'timer_started_at': timerData?.startedAt,
                        'timer_pauses': ts.billPauses.isNotEmpty
                            ? ts.billPauses
                            : (timerData?.pauses ?? const <PauseInterval>[]),
                        'timer_total_sec':
                            ts.displayActiveSec ??
                            timerData?.totalActiveSec ??
                            0,
                        'timer_price_per_hour': timerData?.pricePerHour,
                        // bills endpoint open order uchun service_percent
                        // qaytarmasligi mumkin — shu yerdan fallback uzatamiz
                        'service_percent':
                            context
                                .read<DetailBloc>()
                                .lastDetail
                                ?.servicePercent ??
                            0,
                      },
                    );
                  },
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _PillButton extends StatelessWidget {
  final String label;
  final Color bgColor;
  final bool isLoading;
  final VoidCallback? onTap;
  final String? trailingAmount;

  const _PillButton({
    required this.label,
    required this.bgColor,
    required this.isLoading,
    this.onTap,
    this.trailingAmount,
  });

  @override
  Widget build(BuildContext context) {
    final hasTrailing = trailingAmount != null && trailingAmount!.isNotEmpty;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        // POS primary action — touch target 56dp
        height: PosDimensions.touchTargetMin, // 56
        padding: const EdgeInsets.symmetric(horizontal: PosDimensions.l),
        decoration: BoxDecoration(
          color: onTap != null ? bgColor : bgColor.withOpacity(0.5),
          borderRadius: BorderRadius.circular(PosDimensions.radiusMd),
        ),
        child: isLoading
            ? const Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator.adaptive(
                    strokeWidth: 2,
                    backgroundColor: Colors.white,
                  ),
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: PosTypography.buttonMd, // 16
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                      fontFamily: PosTypography.family,
                      letterSpacing: -0.1,
                    ),
                  ),
                  if (hasTrailing) ...[
                    const SizedBox(width: PosDimensions.s),
                    Text(
                      trailingAmount!,
                      style: const TextStyle(
                        fontSize: PosTypography.buttonLg, // 18
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        fontFamily: PosTypography.family,
                        fontFeatures: PosTypography.tabularFigures,
                      ),
                    ),
                  ],
                ],
              ),
      ),
    );
  }
}
