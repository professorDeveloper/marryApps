import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/api/api.dart';
import 'package:mary_ai_pos/core/design_system/pos_design_system.dart';
import 'package:mary_ai_pos/core/extension/number_formatter.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/core/widgets/app_pincode_dialog.dart';
import 'package:mary_ai_pos/core/widgets/app_scaffold.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/bloc/user_bloc.dart';
import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/hall/hall_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archive_entity.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/archives/archives_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/main/main_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/shift/shift_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/main_header.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

// ─────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────

const _kS900 = Color(0xFF0F172A);
const _kS700 = Color(0xFF334155);
const _kS500 = Color(0xFF64748B);
const _kS400 = Color(0xFF94A3B8);
const _kS300 = Color(0xFFCBD5E1);
const _kS200 = Color(0xFFE2E8F0);
const _kS50 = Color(0xFFF8FAFC);

const _kBrand = Color(0xFFFB6633);
const _kBrandTint = Color(0xFFFFF3EE);
const _kRed = Color(0xFFEF4444);
const _kGreen = Color(0xFF16A34A);
const _kGreenTint = Color(0xFFDCFCE7);
const _kGrowth = Color(0xFF22C55E);

class CloseShiftScreen extends StatefulWidget {
  const CloseShiftScreen({super.key});

  @override
  State<CloseShiftScreen> createState() => _CloseShiftScreenState();
}

class _CloseShiftScreenState extends State<CloseShiftScreen> {
  Timer? _ticker;
  late final ArchivesBloc _archivesBloc;
  int _tickCount = 0;
  bool _syncing = false;

  @override
  void initState() {
    super.initState();
    _archivesBloc = inject<ArchivesBloc>()
      ..add(const ArchivesEvent.started());
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      _tickCount++;
      setState(() {});
      // Har 30 soniyada archive'larni fonda yangilab turamiz — yangi
      // to'lovlar smena hisobotida avtomatik paydo bo'ladi.
      if (_tickCount % 30 == 0) {
        _archivesBloc.add(const ArchivesEvent.getArchived());
      }
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    _archivesBloc.close();
    super.dispose();
  }

  Future<void> _sync() async {
    if (_syncing) return;
    setState(() => _syncing = true);
    context.read<ShiftBloc>().add(const ShiftEvent.checkShift());
    _archivesBloc.add(const ArchivesEvent.getArchived());
    // Spinner ko'rsatish uchun qisqa delay
    await Future<void>.delayed(const Duration(milliseconds: 600));
    if (mounted) setState(() => _syncing = false);
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _archivesBloc,
      child: AppScaffold(
        activeRoute: AppRoutes.closeShiftScreen,
        body: Column(
          children: [
            MainHeader(
              title: S.current.strShiftReport,
              trailing: _SyncButton(
                spinning: _syncing,
                onTap: _sync,
              ),
            ),
            Expanded(
              child: BlocBuilder<ShiftBloc, ShiftState>(
                builder: (context, state) {
                  return state.shift != null
                      ? _ShiftDashboard(state: state)
                      : const _OpenShiftBody();
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SyncButton extends StatefulWidget {
  final bool spinning;
  final VoidCallback onTap;

  const _SyncButton({required this.spinning, required this.onTap});

  @override
  State<_SyncButton> createState() => _SyncButtonState();
}

class _SyncButtonState extends State<_SyncButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
  }

  @override
  void didUpdateWidget(covariant _SyncButton old) {
    super.didUpdateWidget(old);
    if (widget.spinning && !_ctrl.isAnimating) {
      _ctrl.repeat();
    } else if (!widget.spinning && _ctrl.isAnimating) {
      _ctrl.stop();
      _ctrl.value = 0;
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: widget.onTap,
        child: Container(
          // POS minimum touch zone
          height: PosDimensions.touchTargetMin, // 56
          width: PosDimensions.touchTargetMin,
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: _kS200),
            borderRadius: BorderRadius.circular(PosDimensions.radiusMd),
          ),
          alignment: Alignment.center,
          child: RotationTransition(
            turns: _ctrl,
            child: const Icon(
              Icons.refresh_rounded,
              size: 22,
              color: _kS700,
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// OPEN SHIFT — empty-state, existing flow preserved
// ─────────────────────────────────────────────

class _OpenShiftBody extends StatelessWidget {
  const _OpenShiftBody();

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final timeStr =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
    final dateStr = _dateLabel(now);

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: const BoxDecoration(
                  color: _kBrandTint,
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Icon(
                    Icons.storefront_outlined,
                    color: _kBrand,
                    size: 28,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                S.current.strOpenShift,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: _kS900,
                  fontFamily: 'Inter',
                ),
              ),
              const SizedBox(height: 10),
              Text(
                S.current.strStartWorkInstruction,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  color: _kS500,
                  fontFamily: 'Inter',
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 16,
                ),
                decoration: BoxDecoration(
                  color: _kS50,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.access_time_rounded,
                      size: 18,
                      color: _kS500,
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          timeStr,
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w700,
                            color: _kS900,
                            fontFamily: 'Inter',
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          dateStr,
                          style: const TextStyle(
                            fontSize: 12,
                            color: _kS500,
                            fontFamily: 'Inter',
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              BlocBuilder<ShiftBloc, ShiftState>(
                builder: (context, state) {
                  final loading = state.status == Status.LOADING;
                  return SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: loading
                          ? null
                          : () => context
                              .read<ShiftBloc>()
                              .add(const ShiftEvent.openShift()),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _kBrand,
                        disabledBackgroundColor: _kBrand.withOpacity(0.5),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        elevation: 0,
                      ),
                      child: loading
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator.adaptive(
                                strokeWidth: 2,
                                backgroundColor: Colors.white,
                              ),
                            )
                          : Text(
                              S.current.strOpenShift,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                                fontFamily: 'Inter',
                              ),
                            ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  static String _dateLabel(DateTime d) {
    final months = [
      '',
      S.current.strJanuary,
      S.current.strFebruary,
      S.current.strMarch,
      S.current.strApril,
      S.current.strMay,
      S.current.strJune,
      S.current.strJuly,
      S.current.strAugust,
      S.current.strSeptember,
      S.current.strOctober,
      S.current.strNovember,
      S.current.strDecember,
    ];
    final days = [
      S.current.strMonday,
      S.current.strTuesday,
      S.current.strWednesday,
      S.current.strThursday,
      S.current.strFriday,
      S.current.strSaturday,
      S.current.strSunday,
    ];
    return '${days[d.weekday - 1]}, ${d.day} ${months[d.month]} ${d.year}';
  }
}

// ─────────────────────────────────────────────
// SHIFT DASHBOARD — full report view
// ─────────────────────────────────────────────

class _ShiftDashboard extends StatelessWidget {
  final ShiftState state;
  const _ShiftDashboard({required this.state});

  @override
  Widget build(BuildContext context) {
    final shift = state.shift!;
    final archives = context.select<ArchivesBloc, List<ArchiveEntity>>(
      (b) => b.state.archives?.archives ?? const [],
    );
    final cashierName = context.select<UserBloc, String>(
      (b) => b.state.userMOdel?.fullName ?? shift.cashierId,
    );
    final openedAt = shift.openedAt ?? DateTime.now();

    // Aggregate today's archives opened during current shift.
    final shiftArchives = archives
        .where((a) => a.opened != null && !a.opened!.isBefore(openedAt))
        .toList();

    final revenue =
        shiftArchives.fold<int>(0, (sum, a) => sum + a.totalPrice);
    final serviceTotal = shiftArchives.fold<int>(
      0,
      (sum, a) => sum + a.serviceAmount,
    );
    final discountTotal = shiftArchives.fold<int>(
      0,
      (sum, a) => sum + a.discountAmount,
    );
    final discountOrderCount =
        shiftArchives.where((a) => a.discountAmount > 0).length;
    final orderCount = shiftArchives.length;
    final itemsCount = shiftArchives.fold<int>(
      0,
      (sum, a) => sum + a.goodsQuantity,
    );
    final avgCheck = orderCount > 0 ? revenue ~/ orderCount : 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _PageHeader(
                  openedAt: openedAt,
                  cashierName: cashierName,
                  shiftId: shift.id,
                ),
                const SizedBox(height: 20),
                _StatsRow(
                  revenue: revenue,
                  serviceTotal: serviceTotal,
                  orderCount: orderCount,
                  itemsCount: itemsCount,
                  avgCheck: avgCheck,
                  openedAt: openedAt,
                ),
                const SizedBox(height: 20),
          LayoutBuilder(
            builder: (context, constraints) {
              final isCompact = constraints.maxWidth < 1100;
              if (isCompact) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _HourlyChartPanel(
                      archives: shiftArchives,
                      openedAt: openedAt,
                    ),
                    const SizedBox(height: 16),
                    _CashBalancePanel(
                      openingCash: shift.openingCash,
                      cashReceived: revenue,
                    ),
                  ],
                );
              }
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: _HourlyChartPanel(
                      archives: shiftArchives,
                      openedAt: openedAt,
                    ),
                  ),
                  const SizedBox(width: 20),
                  SizedBox(
                    width: 340,
                    child: _CashBalancePanel(
                      openingCash: shift.openingCash,
                      cashReceived: revenue,
                    ),
                  ),
                ],
              );
            },
          ),
                const SizedBox(height: 20),
                _BottomRow(
                  archives: shiftArchives,
                  revenue: revenue,
                  serviceTotal: serviceTotal,
                  discountTotal: discountTotal,
                  discountOrderCount: discountOrderCount,
                  orderCount: orderCount,
                ),
              ],
            ),
          ),
        ),
        // Fixed bottom: Close Shift CTA — scroll bilan ketmaydi
        const DecoratedBox(
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
          ),
          child: Padding(
            padding: EdgeInsets.fromLTRB(24, 12, 24, 16),
            child: _CloseShiftCTA(),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────
// Page header (date + status pill + cashier + actions)
// ─────────────────────────────────────────────

class _PageHeader extends StatelessWidget {
  final DateTime openedAt;
  final String cashierName;
  final String shiftId;

  const _PageHeader({
    required this.openedAt,
    required this.cashierName,
    required this.shiftId,
  });

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final dateStr = _dateLabel(now);
    final openedClock = _clock(openedAt);
    final shortId = shiftId.length > 6
        ? shiftId.substring(shiftId.length - 6).toUpperCase()
        : shiftId.toUpperCase();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: Wrap(
                spacing: 12,
                runSpacing: 8,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Text(
                    dateStr,
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w700,
                      color: _kS900,
                      fontFamily: 'Inter',
                      letterSpacing: -0.3,
                    ),
                  ),
                  _OpenShiftPill(openedClock: openedClock),
                ],
              ),
            ),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _OutlinedIconButton(
                  icon: Icons.file_download_outlined,
                  label: S.current.strExport,
                  onTap: () {},
                ),
                const SizedBox(width: 8),
                _OutlinedIconButton(
                  icon: Icons.print_outlined,
                  label: S.current.strPrint,
                  onTap: () => context
                      .read<ShiftBloc>()
                      .add(const ShiftEvent.printShiftReport()),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          shortId.isEmpty
              ? '${S.current.strCashier}: $cashierName'
              : '${S.current.strCashier}: $cashierName · ${S.current.strShiftHash} #$shortId',
          style: const TextStyle(
            fontSize: 16,
            color: _kS500,
            fontFamily: 'Inter',
          ),
        ),
      ],
    );
  }

  static String _clock(DateTime d) {
    return '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
  }

  static String _dateLabel(DateTime d) {
    final months = [
      '',
      S.current.strJanuary,
      S.current.strFebruary,
      S.current.strMarch,
      S.current.strApril,
      S.current.strMay,
      S.current.strJune,
      S.current.strJuly,
      S.current.strAugust,
      S.current.strSeptember,
      S.current.strOctober,
      S.current.strNovember,
      S.current.strDecember,
    ];
    final days = [
      S.current.strMonday,
      S.current.strTuesday,
      S.current.strWednesday,
      S.current.strThursday,
      S.current.strFriday,
      S.current.strSaturday,
      S.current.strSunday,
    ];
    return '${days[d.weekday - 1]}, ${d.day} ${months[d.month]} ${d.year}';
  }
}

class _OpenShiftPill extends StatelessWidget {
  final String openedClock;
  const _OpenShiftPill({required this.openedClock});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: _kGreenTint,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 9,
            height: 9,
            decoration: const BoxDecoration(
              color: _kGreen,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '${S.current.strShiftOpen} · $openedClock',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: _kGreen,
              fontFamily: 'Inter',
            ),
          ),
        ],
      ),
    );
  }
}

class _OutlinedIconButton extends StatefulWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _OutlinedIconButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  State<_OutlinedIconButton> createState() => _OutlinedIconButtonState();
}

class _OutlinedIconButtonState extends State<_OutlinedIconButton> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 120),
          // POS-friendly button height
          height: PosDimensions.touchTargetMin, // 56
          padding: const EdgeInsets.symmetric(horizontal: PosDimensions.l),
          decoration: BoxDecoration(
            color: _hovered ? _kS50 : Colors.white,
            border: Border.all(color: _kS200),
            borderRadius: BorderRadius.circular(PosDimensions.radiusMd),
          ),
          child: Row(
            children: [
              Icon(widget.icon, size: 20, color: _kS500),
              const SizedBox(width: PosDimensions.s),
              Text(
                widget.label,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: _kS900,
                  fontFamily: PosTypography.family,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Stats row (4 cards)
// ─────────────────────────────────────────────

class _StatsRow extends StatelessWidget {
  final int revenue;
  final int serviceTotal;
  final int orderCount;
  final int itemsCount;
  final int avgCheck;
  final DateTime openedAt;

  const _StatsRow({
    required this.revenue,
    required this.serviceTotal,
    required this.orderCount,
    required this.itemsCount,
    required this.avgCheck,
    required this.openedAt,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isNarrow = constraints.maxWidth < 1000;
        final cols = isNarrow ? 2 : 4;
        const gap = 16.0;
        final w = (constraints.maxWidth - gap * (cols - 1)) / cols;
        return Wrap(
          spacing: gap,
          runSpacing: gap,
          children: [
            SizedBox(
              width: w,
              child: _DarkStatCard(
                label: S.current.strTotalSales,
                value: revenue.formatNWithoutS,
                suffix: "so'm",
              ),
            ),
            SizedBox(
              width: w,
              child: _LightStatCard(
                icon: Icons.receipt_long_outlined,
                iconBg: _kBrandTint,
                iconColor: _kBrand,
                label: S.current.strOrders,
                value: '$orderCount ta',
                sub: orderCount > 0
                    ? S.current.strItemsCountWithAvg(
                        itemsCount.toString(),
                        avgCheck.formatN,
                      )
                    : S.current.strNotYet,
              ),
            ),
            SizedBox(
              width: w,
              child: _LightStatCard(
                icon: Icons.spa_outlined,
                iconBg: _kGreenTint,
                iconColor: _kGreen,
                label: S.current.strServiceCharge,
                value: serviceTotal.formatN,
                sub: orderCount > 0
                    ? S.current.strOrdersCountShort(orderCount.toString())
                    : '—',
              ),
            ),
            SizedBox(
              width: w,
              child: _DurationStatCard(openedAt: openedAt),
            ),
          ],
        );
      },
    );
  }
}

class _DarkStatCard extends StatelessWidget {
  final String label;
  final String value;
  final String suffix;

  const _DarkStatCard({
    required this.label,
    required this.value,
    required this.suffix,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 148,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: _kS900,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 15,
              color: Color(0xFF94A3B8),
              fontFamily: 'Inter',
            ),
          ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Flexible(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    value,
                    style: const TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                      fontFamily: 'Inter',
                      letterSpacing: -0.6,
                      height: 1.1,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                suffix,
                style: const TextStyle(
                  fontSize: 15,
                  color: Color(0xFF94A3B8),
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
          Row(
            children: [
              const Icon(
                Icons.trending_up_rounded,
                size: 16,
                color: _kGrowth,
              ),
              const SizedBox(width: 4),
              Text(
                S.current.strCurrentShift,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: _kGrowth,
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LightStatCard extends StatelessWidget {
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String label;
  final String value;
  final String sub;

  const _LightStatCard({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.label,
    required this.value,
    required this.sub,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 148,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _kS200),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 18, color: iconColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 15,
                    color: _kS500,
                    fontFamily: 'Inter',
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.w700,
                color: _kS900,
                fontFamily: 'Inter',
                letterSpacing: -0.3,
                height: 1.1,
              ),
            ),
          ),
          Text(
            sub,
            style: const TextStyle(
              fontSize: 14,
              color: _kS500,
              fontFamily: 'Inter',
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _DurationStatCard extends StatefulWidget {
  final DateTime openedAt;
  const _DurationStatCard({required this.openedAt});

  @override
  State<_DurationStatCard> createState() => _DurationStatCardState();
}

class _DurationStatCardState extends State<_DurationStatCard> {
  @override
  Widget build(BuildContext context) {
    final diff = DateTime.now().difference(widget.openedAt);
    final h = diff.inHours;
    final m = diff.inMinutes % 60;
    final value = '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}';
    final startedAt =
        '${widget.openedAt.hour.toString().padLeft(2, '0')}:${widget.openedAt.minute.toString().padLeft(2, '0')}';

    return Container(
      height: 148,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _kS200),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: _kBrandTint,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.timer_outlined,
                  size: 18,
                  color: _kBrand,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  S.current.strDurationLabel,
                  style: const TextStyle(
                    fontSize: 15,
                    color: _kS500,
                    fontFamily: 'Inter',
                  ),
                ),
              ),
            ],
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 30,
              fontWeight: FontWeight.w700,
              color: _kS900,
              fontFamily: 'Inter',
              letterSpacing: 1,
              height: 1.1,
            ),
          ),
          Text(
            '${S.current.strOpenedAt} $startedAt',
            style: const TextStyle(
              fontSize: 14,
              color: _kS500,
              fontFamily: 'Inter',
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Hourly chart panel
// ─────────────────────────────────────────────

class _HourlyChartPanel extends StatelessWidget {
  final List<ArchiveEntity> archives;
  final DateTime openedAt;

  const _HourlyChartPanel({
    required this.archives,
    required this.openedAt,
  });

  @override
  Widget build(BuildContext context) {
    // Group by hour from shift start to current hour.
    final now = DateTime.now();
    final startHour = openedAt.hour;
    final endHour = now.hour;
    final hourRange = <int>[
      for (int h = startHour; h <= endHour; h++) h,
    ];

    final hourlySums = <int, int>{for (final h in hourRange) h: 0};
    for (final a in archives) {
      final o = a.opened;
      if (o == null) continue;
      final h = o.hour;
      if (hourlySums.containsKey(h)) {
        hourlySums[h] = (hourlySums[h] ?? 0) + a.totalPrice;
      }
    }

    int maxValue = 0;
    int peakHour = startHour;
    int peakValue = 0;
    hourlySums.forEach((h, v) {
      if (v > maxValue) maxValue = v;
      if (v > peakValue) {
        peakValue = v;
        peakHour = h;
      }
    });

    return Container(
      height: 360,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _kS200),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            S.current.strHourlySalesDynamics,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: _kS900,
              fontFamily: 'Inter',
              letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            peakValue > 0
                ? '${S.current.strPeakTime}: ${peakHour.toString().padLeft(2, '0')}:00 — ${peakValue.formatN}'
                : S.current.strNoSalesData,
            style: const TextStyle(
              fontSize: 14,
              color: _kS500,
              fontFamily: 'Inter',
            ),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: _HourlyChart(
              hourRange: hourRange,
              hourlySums: hourlySums,
              maxValue: maxValue,
              currentHour: now.hour,
            ),
          ),
        ],
      ),
    );
  }
}

class _HourlyChart extends StatelessWidget {
  final List<int> hourRange;
  final Map<int, int> hourlySums;
  final int maxValue;
  final int currentHour;

  const _HourlyChart({
    required this.hourRange,
    required this.hourlySums,
    required this.maxValue,
    required this.currentHour,
  });

  @override
  Widget build(BuildContext context) {
    if (hourRange.isEmpty) {
      return Center(
        child: Text(
          S.current.strShiftJustStarted,
          style: const TextStyle(
            fontSize: 15,
            color: _kS400,
            fontFamily: 'Inter',
          ),
        ),
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        const labelHeight = 28.0;
        final chartH = constraints.maxHeight - labelHeight;
        return Column(
          children: [
            Expanded(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: hourRange.map((h) {
                  final v = hourlySums[h] ?? 0;
                  final ratio = maxValue > 0 ? v / maxValue : 0.0;
                  final isCurrent = h == currentHour;
                  final barColor = isCurrent ? _kBrand : _kS300;
                  return Expanded(
                    child: Padding(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 4),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          if (isCurrent && v > 0)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              margin: const EdgeInsets.only(bottom: 4),
                              decoration: BoxDecoration(
                                color: _kBrandTint,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                S.current.strNowShort,
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: _kBrand,
                                  fontFamily: 'Inter',
                                ),
                              ),
                            ),
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            height: (chartH - 30) * ratio + 4,
                            decoration: BoxDecoration(
                              color: barColor,
                              borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(6),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            SizedBox(
              height: labelHeight,
              child: Row(
                children: hourRange.map((h) {
                  return Expanded(
                    child: Center(
                      child: Text(
                        '${h.toString().padLeft(2, '0')}:00',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: _kS500,
                          fontFamily: 'Inter',
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        );
      },
    );
  }
}

// ─────────────────────────────────────────────
// Cash balance panel
// ─────────────────────────────────────────────

class _CashBalancePanel extends StatelessWidget {
  final int openingCash;
  final int cashReceived;

  const _CashBalancePanel({
    required this.openingCash,
    required this.cashReceived,
  });

  @override
  Widget build(BuildContext context) {
    final expected = openingCash + cashReceived;
    return Container(
      height: 360,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _kS200),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            S.current.strCashBalance,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: _kS900,
              fontFamily: 'Inter',
              letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 18),
          _BalanceRow(
            label: S.current.strOpeningBalance,
            value: openingCash,
            valueColor: _kS900,
          ),
          const SizedBox(height: 14),
          _BalanceRow(
            label: S.current.strShiftRevenue,
            value: cashReceived,
            valueColor: _kGreen,
            prefix: '+',
          ),
          const Spacer(),
          const Divider(color: _kS200, height: 1),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                S.current.strExpectedBalance,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: _kS900,
                  fontFamily: 'Inter',
                ),
              ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    expected.formatNWithoutS,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: _kBrand,
                      fontFamily: 'Inter',
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Text(
                    "so'm",
                    style: TextStyle(
                      fontSize: 13,
                      color: _kS500,
                      fontFamily: 'Inter',
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BalanceRow extends StatelessWidget {
  final String label;
  final int value;
  final Color valueColor;
  final String prefix;

  const _BalanceRow({
    required this.label,
    required this.value,
    required this.valueColor,
    this.prefix = '',
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 15,
            color: _kS700,
            fontFamily: 'Inter',
          ),
        ),
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Text(
              '$prefix${value.formatNWithoutS}',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: valueColor,
                fontFamily: 'Inter',
              ),
            ),
            const SizedBox(width: 4),
            const Text(
              "so'm",
              style: TextStyle(
                fontSize: 13,
                color: _kS500,
                fontFamily: 'Inter',
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────
// Close shift CTA (full-width red)
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Bottom row — Recent orders + Discount/Service tinted cards
// ─────────────────────────────────────────────

class _BottomRow extends StatelessWidget {
  final List<ArchiveEntity> archives;
  final int revenue;
  final int serviceTotal;
  final int discountTotal;
  final int discountOrderCount;
  final int orderCount;

  const _BottomRow({
    required this.archives,
    required this.revenue,
    required this.serviceTotal,
    required this.discountTotal,
    required this.discountOrderCount,
    required this.orderCount,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < 1100;
        if (compact) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _RecentOrdersPanel(archives: archives, revenue: revenue),
              const SizedBox(height: 16),
              _DiscountServicePanel(
                serviceTotal: serviceTotal,
                discountTotal: discountTotal,
                discountOrderCount: discountOrderCount,
                orderCount: orderCount,
              ),
            ],
          );
        }
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: _RecentOrdersPanel(archives: archives, revenue: revenue),
            ),
            const SizedBox(width: 20),
            SizedBox(
              width: 340,
              child: _DiscountServicePanel(
                serviceTotal: serviceTotal,
                discountTotal: discountTotal,
                discountOrderCount: discountOrderCount,
                orderCount: orderCount,
              ),
            ),
          ],
        );
      },
    );
  }
}

class _RecentOrdersPanel extends StatelessWidget {
  final List<ArchiveEntity> archives;
  final int revenue;

  const _RecentOrdersPanel({required this.archives, required this.revenue});

  @override
  Widget build(BuildContext context) {
    // Most recent first, top 5 (largest-paid).
    final sorted = [...archives]
      ..sort((a, b) {
        final at = a.opened;
        final bt = b.opened;
        if (at == null && bt == null) return 0;
        if (at == null) return 1;
        if (bt == null) return -1;
        return bt.compareTo(at);
      });
    final recent = sorted.take(5).toList();
    final maxTotal = recent.isEmpty
        ? 1
        : recent.map((a) => a.totalPrice).reduce((a, b) => a > b ? a : b);

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _kS200),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                S.current.strRecentOrders,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: _kS900,
                  fontFamily: 'Inter',
                  letterSpacing: -0.2,
                ),
              ),
              GestureDetector(
                onTap: () => Navigator.of(context)
                    .pushNamed(AppRoutes.archiveScreen),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      S.current.strViewAll,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: _kBrand,
                        fontFamily: 'Inter',
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(
                      Icons.arrow_forward_rounded,
                      size: 16,
                      color: _kBrand,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            recent.isEmpty
                ? S.current.strNoOrdersInShift
                : '${S.current.strOrdersCountShort(archives.length.toString())} · ${revenue.formatN}',
            style: const TextStyle(
              fontSize: 14,
              color: _kS500,
              fontFamily: 'Inter',
            ),
          ),
          const SizedBox(height: 18),
          if (recent.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 36),
              child: Center(
                child: Column(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: _kS50,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.receipt_long_outlined,
                        size: 24,
                        color: _kS400,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      S.current.strNotOrdered,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        color: _kS500,
                        fontFamily: 'Inter',
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            Column(
              children: [
                for (var i = 0; i < recent.length; i++)
                  Padding(
                    padding: EdgeInsets.only(
                      bottom: i == recent.length - 1 ? 0 : 14,
                    ),
                    child: _RecentOrderRow(
                      rank: i + 1,
                      archive: recent[i],
                      ratio: maxTotal > 0
                          ? recent[i].totalPrice / maxTotal
                          : 0.0,
                    ),
                  ),
              ],
            ),
        ],
      ),
    );
  }
}

class _RecentOrderRow extends StatelessWidget {
  final int rank;
  final ArchiveEntity archive;
  final double ratio;

  const _RecentOrderRow({
    required this.rank,
    required this.archive,
    required this.ratio,
  });

  @override
  Widget build(BuildContext context) {
    final isTakeaway = archive.tableNumber == 0;
    final label = isTakeaway
        ? 'Olib ketish · #${archive.bilNumber}'
        : '${archive.tableNumber}-stol · #${archive.bilNumber}';
    final time = archive.opened != null
        ? '${archive.opened!.hour.toString().padLeft(2, '0')}:${archive.opened!.minute.toString().padLeft(2, '0')}'
        : '—';

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: _kS50,
            borderRadius: BorderRadius.circular(8),
          ),
          alignment: Alignment.center,
          child: Text(
            '$rank',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: _kS700,
              fontFamily: 'Inter',
            ),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Flexible(
                    child: Text(
                      label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: _kS900,
                        fontFamily: 'Inter',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    archive.totalPrice.formatN,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: _kS900,
                      fontFamily: 'Inter',
                      fontFeatures: [FontFeature.tabularFigures()],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: ratio.clamp(0.04, 1.0),
                  minHeight: 5,
                  backgroundColor: _kS50,
                  valueColor: const AlwaysStoppedAnimation<Color>(_kBrand),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                S.current.strItemsCountWithTime(
                  archive.goodsQuantity.toString(),
                  time,
                ),
                style: const TextStyle(
                  fontSize: 13,
                  color: _kS500,
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _DiscountServicePanel extends StatelessWidget {
  final int serviceTotal;
  final int discountTotal;
  final int discountOrderCount;
  final int orderCount;

  const _DiscountServicePanel({
    required this.serviceTotal,
    required this.discountTotal,
    required this.discountOrderCount,
    required this.orderCount,
  });

  @override
  Widget build(BuildContext context) {
    final avgService = orderCount > 0 ? serviceTotal ~/ orderCount : 0;
    final avgDiscount =
        discountOrderCount > 0 ? discountTotal ~/ discountOrderCount : 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          S.current.strDiscountServiceTitle,
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: _kS900,
            fontFamily: 'Inter',
            letterSpacing: -0.2,
          ),
        ),
        const SizedBox(height: 14),
        _TintCard(
          label: S.current.strDiscounts,
          value: discountTotal.formatN,
          sub: discountOrderCount > 0
              ? S.current.strOrdersCountWithAvg(
                  discountOrderCount.toString(),
                  avgDiscount.formatN,
                )
              : S.current.strNoDiscountYet,
          labelColor: const Color(0xFFEA580C),
          bg: const Color(0xFFFFF7ED),
          border: const Color(0xFFFED7AA),
          icon: Icons.local_offer_outlined,
        ),
        const SizedBox(height: 12),
        _TintCard(
          label: S.current.strServiceCharge,
          value: serviceTotal.formatN,
          sub: orderCount > 0
              ? "$orderCount ta · o'rt. ${avgService.formatN}"
              : S.current.strNoServiceChargeYet,
          labelColor: _kGreen,
          bg: const Color(0xFFF0FDF4),
          border: const Color(0xFFBBF7D0),
          icon: Icons.room_service_outlined,
        ),
      ],
    );
  }
}

class _TintCard extends StatelessWidget {
  final String label;
  final String value;
  final String sub;
  final Color labelColor;
  final Color bg;
  final Color border;
  final IconData icon;

  const _TintCard({
    required this.label,
    required this.value,
    required this.sub,
    required this.labelColor,
    required this.bg,
    required this.border,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: bg,
        border: Border.all(color: border),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: labelColor),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: labelColor,
                  fontFamily: 'Inter',
                  letterSpacing: 0.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: _kS900,
              fontFamily: 'Inter',
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            sub,
            style: const TextStyle(
              fontSize: 14,
              color: _kS500,
              fontFamily: 'Inter',
            ),
          ),
        ],
      ),
    );
  }
}

class _CloseShiftCTA extends StatelessWidget {
  const _CloseShiftCTA();

  Future<void> _onTap(BuildContext context) async {
    final mainState = context.read<MainCubit>().state;
    final tables = mainState.tables ?? const <CafeTableModel>[];
    final halls = mainState.halls ?? const <HallModel>[];
    final openTables = tables
        .where((t) => t.status == TableStatus.busy)
        .toList()
      ..sort((a, b) => a.number.compareTo(b.number));

    if (openTables.isNotEmpty) {
      showDialog<void>(
        context: context,
        barrierDismissible: true,
        barrierColor: Colors.black.withOpacity(0.45),
        builder: (_) => _OpenTablesBlockDialog(
          openTables: openTables,
          halls: halls,
        ),
      );
      return;
    }

    final shiftBloc = context.read<ShiftBloc>();
    final confirmed = await AppPincodeDialog.showWithStoredPin(
      context,
      subtitle: S.current.strConfirmWithPincode,
    );
    if (confirmed == true) {
      shiftBloc.add(const ShiftEvent.closeShift());
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ShiftBloc, ShiftState>(
      builder: (context, state) {
        final loading = state.status == Status.LOADING;
        return SizedBox(
          width: double.infinity,
          height: 62,
          child: GestureDetector(
            onTap: loading ? null : () => _onTap(context),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 120),
              decoration: BoxDecoration(
                color: loading ? _kRed.withOpacity(0.6) : _kRed,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: loading
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator.adaptive(
                          strokeWidth: 2,
                          backgroundColor: Colors.white,
                        ),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 11,
                            height: 11,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.9),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            S.current.strCloseShiftShort,
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                              fontFamily: 'Inter',
                              letterSpacing: -0.2,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────
// Open tables block dialog — close shift bloklanganda chiqadi
// ─────────────────────────────────────────────

class _OpenTablesBlockDialog extends StatelessWidget {
  final List<CafeTableModel> openTables;
  final List<HallModel> halls;
  const _OpenTablesBlockDialog({
    required this.openTables,
    required this.halls,
  });

  @override
  Widget build(BuildContext context) {
    final hallNameById = {for (final h in halls) h.id: h.name};
    final grouped = <String, List<CafeTableModel>>{};
    for (final t in openTables) {
      grouped.putIfAbsent(t.hallId, () => []).add(t);
    }
    final sortedHallIds = grouped.keys.toList()
      ..sort((a, b) {
        final na = hallNameById[a] ?? '';
        final nb = hallNameById[b] ?? '';
        return na.toLowerCase().compareTo(nb.toLowerCase());
      });

    return Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      insetPadding: const EdgeInsets.all(24),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 32,
                  offset: const Offset(0, 12),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(32, 32, 32, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Container(
                        width: 72,
                        height: 72,
                        decoration: const BoxDecoration(
                          color: _kBrandTint,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.table_restaurant_outlined,
                          size: 34,
                          color: _kBrand,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        S.current.strCannotCloseShiftTitle,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: _kS900,
                          fontFamily: 'Inter',
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        S.current.strCannotCloseShiftMessage,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 15,
                          color: _kS500,
                          fontFamily: 'Inter',
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 20),
                      _OpenTablesByHall(
                        totalCount: openTables.length,
                        groups: [
                          for (final id in sortedHallIds)
                            _HallGroup(
                              hallName: hallNameById[id] ?? '—',
                              tables: grouped[id]!
                                ..sort(
                                  (a, b) => a.number.compareTo(b.number),
                                ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                  child: SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _kS900,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: Text(
                        S.current.strClose,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                          fontFamily: 'Inter',
                          letterSpacing: -0.2,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _HallGroup {
  final String hallName;
  final List<CafeTableModel> tables;
  const _HallGroup({required this.hallName, required this.tables});
}

class _OpenTablesByHall extends StatelessWidget {
  final int totalCount;
  final List<_HallGroup> groups;
  const _OpenTablesByHall({required this.totalCount, required this.groups});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _kS50,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _kS200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.error_outline_rounded,
                size: 16,
                color: _kBrand,
              ),
              const SizedBox(width: 8),
              Text(
                S.current.strOpenTablesCount(totalCount.toString()),
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: _kS700,
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          for (var i = 0; i < groups.length; i++)
            Padding(
              padding: EdgeInsets.only(
                bottom: i == groups.length - 1 ? 0 : 12,
              ),
              child: _HallSection(group: groups[i]),
            ),
        ],
      ),
    );
  }
}

class _HallSection extends StatelessWidget {
  final _HallGroup group;
  const _HallSection({required this.group});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          group.hallName,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: _kS500,
            fontFamily: 'Inter',
            letterSpacing: 0.4,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final t in group.tables)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: _kS200),
                ),
                child: Text(
                  '${t.number}-stol',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: _kS900,
                    fontFamily: 'Inter',
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }
}
