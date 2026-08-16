import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/number_formatter.dart';
import 'package:mary_ai_pos/core/theme/tokens/theme_colors.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/table_timer/table_timer_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/waiter/waiter_cubit.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

/// Vaqt bo‘yicha stol (`time_based`) — `GET /orders/{id}/table-timer` + start/pause/resume.
class TableTimerSection extends StatefulWidget {
  const TableTimerSection({super.key});

  @override
  State<TableTimerSection> createState() => _TableTimerSectionState();
}

class _TableTimerSectionState extends State<TableTimerSection> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final order = context.read<WaiterCubit>().state.selectedOrder;
      context.read<TableTimerCubit>().bindOrder(order);
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<WaiterCubit, WaiterState>(
      listenWhen: (p, c) => p.selectedOrderId != c.selectedOrderId,
      listener: (context, state) {
        context.read<TableTimerCubit>().bindOrder(state.selectedOrder);
      },
      child: BlocBuilder<TableTimerCubit, TableTimerState>(
        buildWhen: (p, c) =>
            p.shouldShow != c.shouldShow ||
            p.isLoading != c.isLoading ||
            p.isMutating != c.isMutating ||
            p.timer != c.timer ||
            p.displayActiveSec != c.displayActiveSec ||
            p.errorMessage != c.errorMessage,
        builder: (context, s) {
          if (!s.shouldShow && !s.isLoading) {
            return const SizedBox.shrink();
          }
          final colors = context.colors;
          if (s.isLoading && s.timer == null) {
            return Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Row(
                children: [
                  SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: colors.textTertiary,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Stol taymeri…',
                    style: TextStyle(fontSize: 12, color: colors.textTertiary),
                  ),
                ],
              ),
            );
          }
          final t = s.timer;
          if (t == null) return const SizedBox.shrink();

          final st = t.stateNormalized;
          final canStart = st == 'none';
          final canPause = st == 'running';
          final canResume = st == 'paused';
          final closed = st == 'closed' || t.isClosed;
          final displaySec = s.displayActiveSec ?? t.totalActiveSec;

          return Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: colors.bgSecondary,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: colors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.timer_outlined,
                          size: 18, color: colors.textBrand),
                      const SizedBox(width: 6),
                      Text(
                        'Stol (vaqt bo‘yicha)',
                        style: context.textStyles.semibold14.copyWith(
                          fontSize: 13,
                        ),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: colors.bgDefault,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          t.state,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: colors.textSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  if (t.pricePerHour != null && t.pricePerHour!.isNotEmpty)
                    Text(
                      'Soat narxi: ${t.pricePerHour}',
                      style: TextStyle(fontSize: 11, color: colors.textSecondary),
                    ),
                  const SizedBox(height: 4),
                  Text(
                    'Faol vaqt: ${_formatDuration(displaySec)}',
                    style: TextStyle(fontSize: 12, color: colors.textDefault),
                  ),
                  if (t.currentAmount != null &&
                      t.currentAmount!.isNotEmpty &&
                      !closed)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        'Hozirgi summa: ${double.tryParse(t.currentAmount!.replaceAll(RegExp(r'\s'), ''))?.formatN ?? t.currentAmount}',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: colors.textBrand,
                        ),
                      ),
                    ),
                  if (closed &&
                      t.finalAmount != null &&
                      t.finalAmount!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        'Yakuniy: ${double.tryParse(t.finalAmount!.replaceAll(RegExp(r'\s'), ''))?.formatN ?? t.finalAmount}',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: colors.systemSuccess,
                        ),
                      ),
                    ),
                  if (s.errorMessage != null && s.errorMessage!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text(
                        s.errorMessage!,
                        style: TextStyle(
                          fontSize: 11,
                          color: colors.systemError,
                        ),
                      ),
                    ),
                  if (!closed) ...[
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        if (canStart)
                          _ActBtn(
                            label: S.current.strStart,
                            colors: colors,
                            busy: s.isMutating,
                            onTap: () => context
                                .read<TableTimerCubit>()
                                .startTimer(),
                          ),
                        if (canPause)
                          _ActBtn(
                            label: S.current.strPauseAction,
                            colors: colors,
                            busy: s.isMutating,
                            onTap: () => context
                                .read<TableTimerCubit>()
                                .pauseTimer(),
                          ),
                        if (canResume)
                          _ActBtn(
                            label: S.current.strResumeAction,
                            colors: colors,
                            busy: s.isMutating,
                            onTap: () => context
                                .read<TableTimerCubit>()
                                .resumeTimer(),
                          ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  static String _formatDuration(int sec) {
    final h = sec ~/ 3600;
    final m = (sec % 3600) ~/ 60;
    final s = sec % 60;
    if (h > 0) {
      return '${h}soat ${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
    }
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }
}

class _ActBtn extends StatelessWidget {
  final String label;
  final ThemeColors colors;
  final bool busy;
  final VoidCallback onTap;

  const _ActBtn({
    required this.label,
    required this.colors,
    required this.busy,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: colors.buttonBrandSecondary,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: busy ? null : onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: busy
              ? SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: colors.textBrand,
                  ),
                )
              : Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: colors.textBrand,
                  ),
                ),
        ),
      ),
    );
  }
}
