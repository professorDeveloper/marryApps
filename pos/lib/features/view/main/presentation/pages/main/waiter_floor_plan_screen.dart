import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/core/services/connectivity/connectivity_cubit.dart';
import 'package:mary_ai_pos/core/widgets/app_scaffold.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/bloc/user_bloc.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/settings/settings_cubit.dart';
import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/hall/hall_model.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/main/main_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/orders/orders_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/shift/shift_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/main_header.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/tab_filter.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

// ─────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────

const _kS900 = Color(0xFF0F172A);
const _kS500 = Color(0xFF64748B);
const _kS400 = Color(0xFF94A3B8);
const _kS300 = Color(0xFFCBD5E1);
const _kS200 = Color(0xFFE2E8F0);
const _kS50 = Color(0xFFF8FAFC);
const _kBrand = Color(0xFFFB6633);
const _kBrandTint = Color(0xFFFFF3EE);
const _kRed = Color(0xFFDC2626);
const _kRedTint = Color(0xFFFEE2E2);
const _kGreen = Color(0xFF16A34A);
const _kFreeBg = Color(0xFFF0FDF4);
const _kBlue = Color(0xFF2563EB);
const _kBlueTint = Color(0xFFDBEAFE);

// ─────────────────────────────────────────────
// Session timestamp: tableId → first-seen saved DateTime
// ─────────────────────────────────────────────

final Map<String, DateTime> _openedAtByTable = {};

// ─────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────

class WaiterFloorPlanScreen extends StatefulWidget {
  const WaiterFloorPlanScreen({super.key});

  @override
  State<WaiterFloorPlanScreen> createState() => _WaiterFloorPlanScreenState();
}

class _WaiterFloorPlanScreenState extends State<WaiterFloorPlanScreen> {
  Timer? _bgRefreshTimer;

  static const _bgRefreshInterval = Duration(minutes: 2);

  @override
  void initState() {
    super.initState();
    _bgRefreshTimer = Timer.periodic(_bgRefreshInterval, (_) {
      if (inject<ConnectivityCubit>().isOnline && mounted) {
        context.read<MainCubit>().refreshTables();
      }
    });
  }

  @override
  void dispose() {
    _bgRefreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    // Foydalanuvchi bosgan refresh — throttle ni chetlab o'tamiz
    await context.read<MainCubit>().refreshTables(force: true);
  }

  Future<void> _confirmRefresh() async {
    final ok = await showDialog<bool>(
      context: context,
      barrierDismissible: true,
      barrierColor: Colors.black.withOpacity(0.45),
      builder: (_) => const _RefreshConfirmDialog(),
    );
    if (ok == true && mounted) {
      await _refresh();
    }
  }

  void _syncOpenedAt(Set<String> savedIds) {
    final now = DateTime.now();
    for (final id in savedIds) {
      _openedAtByTable.putIfAbsent(id, () => now);
    }
    _openedAtByTable.removeWhere((k, _) => !savedIds.contains(k));
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return AppScaffold(
      activeRoute: AppRoutes.mainScreen,
      body: BlocBuilder<MainCubit, MainState>(
        builder: (context, state) {
          final halls = state.halls ?? [];
          final tables = state.tables ?? [];

          // Status counts — only MainCubit data, SavedOrders handled below
          final freeCount =
              tables.where((t) => t.status == TableStatus.free).length;
          final busyCount =
              tables.where((t) => t.status == TableStatus.busy).length;
          final reservedCount =
              tables.where((t) => t.status == TableStatus.away).length;

          final isLoading =
              state.status == Status.LOADING && tables.isEmpty;

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MainHeader(
                title: S.current.strFloorMap,
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _HeaderStatChips(
                      freeCount: freeCount,
                      busyCount: busyCount,
                      reservedCount: reservedCount,
                    ),
                    const SizedBox(width: 10),
                    _RefreshButton(
                      loading: state.status == Status.LOADING,
                      onTap: _confirmRefresh,
                    ),
                    const SizedBox(width: 10),
                    const _TakeawayHeaderButton(),
                  ],
                ),
              ),
              if (halls.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
                  child: TabFilter(
                    halls: halls,
                    selectedHallId: state.selectedHallId,
                    tables: tables,
                    isLoading: state.status == Status.OTHER_LOADING,
                  ),
                ),
              Expanded(
                child: isLoading
                    ? Center(
                        child: CircularProgressIndicator.adaptive(
                          valueColor: AlwaysStoppedAnimation(colors.textBrand),
                        ),
                      )
                    : BlocBuilder<SavedOrdersBloc, SavedOrdersState>(
                        builder: (context, savedState) {
                          final savedOrders = savedState.order;
                          final savedIds = savedOrders
                              .map((o) => o.createOrderRequest.tableId)
                              .toSet();
                          final savedTotalsByTable = <String, int>{
                            for (final o in savedOrders)
                              o.createOrderRequest.tableId:
                                  o.createOrderRequest.foods.fold<int>(
                                0,
                                (sum, f) =>
                                    sum +
                                    (int.tryParse(f.goods.price) ?? 0) *
                                        f.quantity,
                              ),
                          };
                          _syncOpenedAt(savedIds);
                          return _GridView(
                            halls: halls,
                            tables: tables,
                            savedIds: savedIds,
                            totalsByTable: savedTotalsByTable,
                            openedAtByTable: _openedAtByTable,
                            selectedHallId: state.selectedHallId,
                            onTap: (table) => _handleTableTap(context, table),
                          );
                        },
                      ),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _handleTableTap(
    BuildContext context,
    CafeTableModel table,
  ) async {
    // Band stolga qaytib kirish — smena kerak emas (mavjud buyurtmaga)
    final isNewOrder = table.status == TableStatus.free;
    if (isNewOrder && !_requireOpenShift(context)) return;

    final savedOrdersBloc = context.read<SavedOrdersBloc>();
    final index = savedOrdersBloc.state.order.indexWhere(
      (v) => v.createOrderRequest.tableId == table.id,
    );
    final saved = index != -1 ? savedOrdersBloc.state.order[index] : null;

    // Guest count defaults to the table's capacity. The waiter/cashier
    // can adjust it later from the order panel if needed. We don't
    // prompt for it on table tap per the new design.
    final defaultGuestCount = table.capacity > 0 ? table.capacity : 1;

    Navigator.pushNamed(
      context,
      AppRoutes.detailScreen,
      arguments: {
        'table': table,
        'guest_count': defaultGuestCount,
        'table_status': isNewOrder ? TableStatus.free : TableStatus.busy,
        'saved_orders': saved,
      },
    );
  }
}

/// Smena ochiqligini tekshiradi. Admin/superadmin ga smena shart emas.
/// Agar smena ochilmagan bo'lsa — xato xabari chiqadi va smena sahifasiga o'tiladi.
bool _requireOpenShift(BuildContext context) {
  final role = context.read<UserBloc>().state.userMOdel?.role;
  // Admin va superadmin smenasiz ham buyurtma qila oladi
  if (role == UserRole.admin || role == UserRole.superadmin) return true;

  final shift = context.read<ShiftBloc>().state.shift;
  if (shift != null) return true;

  Navigator.pushNamed(context, AppRoutes.closeShiftScreen);
  return false;
}

// ─────────────────────────────────────────────
// Header chips (Free / Busy / Reserved)
// ─────────────────────────────────────────────

class _HeaderStatChips extends StatelessWidget {
  final int freeCount;
  final int busyCount;
  final int reservedCount;

  const _HeaderStatChips({
    required this.freeCount,
    required this.busyCount,
    required this.reservedCount,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _StatChip(
          label: S.current.strFree,
          count: freeCount,
          dotColor: _kGreen,
        ),
        const SizedBox(width: 14),
        _StatChip(
          label: S.current.strBusy,
          count: busyCount,
          dotColor: _kBrand,
        ),
        const SizedBox(width: 14),
        _StatChip(
          label: S.current.strReserved,
          count: reservedCount,
          dotColor: _kBlue,
        ),
      ],
    );
  }
}

class _StatChip extends StatelessWidget {
  final String label;
  final int count;
  final Color dotColor;

  const _StatChip({
    required this.label,
    required this.count,
    required this.dotColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w500,
            color: _kS500,
            fontFamily: 'Inter',
          ),
        ),
        const SizedBox(width: 6),
        Text(
          '$count',
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: _kS900,
            fontFamily: 'Inter',
          ),
        ),
      ],
    );
  }
}

class _RefreshButton extends StatefulWidget {
  final bool loading;
  final VoidCallback onTap;
  const _RefreshButton({required this.loading, required this.onTap});

  @override
  State<_RefreshButton> createState() => _RefreshButtonState();
}

class _RefreshButtonState extends State<_RefreshButton> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final hovered = _hovered && !widget.loading;
    return MouseRegion(
      cursor: widget.loading
          ? SystemMouseCursors.basic
          : SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: widget.loading ? null : widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 140),
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: hovered ? _kBrandTint : _kS50,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: hovered ? _kBrand.withOpacity(0.45) : _kS200,
            ),
            boxShadow: hovered
                ? [
                    BoxShadow(
                      color: _kBrand.withOpacity(0.12),
                      blurRadius: 10,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Center(
            child: widget.loading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator.adaptive(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation(_kBrand),
                    ),
                  )
                : Icon(
                    Icons.refresh_rounded,
                    size: 22,
                    color: hovered ? _kBrand : _kS500,
                  ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Grid view — grouped by hall when "all zones"
// ─────────────────────────────────────────────

class _GridView extends StatelessWidget {
  final List<HallModel> halls;
  final List<CafeTableModel> tables;
  final Set<String> savedIds;
  final Map<String, int> totalsByTable;
  final Map<String, DateTime> openedAtByTable;
  final String? selectedHallId;
  final void Function(CafeTableModel) onTap;

  const _GridView({
    required this.halls,
    required this.tables,
    required this.savedIds,
    required this.totalsByTable,
    required this.openedAtByTable,
    required this.selectedHallId,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    if (tables.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.table_restaurant_outlined,
              size: 48,
              color: _kS300,
            ),
            const SizedBox(height: 8),
            Text(
              S.current.strNoTables,
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

    // Group tables by hall id for section rendering.
    final hallsById = {for (final h in halls) h.id: h};
    final groups = <String, List<CafeTableModel>>{};
    for (final t in tables) {
      groups.putIfAbsent(t.hallId, () => []).add(t);
    }

    // Preserve order from `halls`.
    final orderedGroups = <MapEntry<HallModel, List<CafeTableModel>>>[];
    for (final h in halls) {
      final list = groups[h.id];
      if (list != null && list.isNotEmpty) {
        orderedGroups.add(MapEntry(h, list));
      }
    }
    // Add any tables whose hall isn't in `halls` under a synthetic section.
    final unknown = <CafeTableModel>[];
    for (final entry in groups.entries) {
      if (!hallsById.containsKey(entry.key)) {
        unknown.addAll(entry.value);
      }
    }

    final showSectionHeaders = selectedHallId == null;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (int g = 0; g < orderedGroups.length; g++) ...[
            if (showSectionHeaders)
              Padding(
                padding: EdgeInsets.only(top: g == 0 ? 6 : 20, bottom: 12),
                child: _SectionHeader(
                  label: orderedGroups[g].key.name,
                  count: orderedGroups[g].value.length,
                ),
              ),
            _GridOfTables(
              tables: orderedGroups[g].value,
              savedIds: savedIds,
              totalsByTable: totalsByTable,
              openedAtByTable: openedAtByTable,
              onTap: onTap,
            ),
          ],
          if (unknown.isNotEmpty) ...[
            if (showSectionHeaders)
              Padding(
                padding: EdgeInsets.only(
                  top: orderedGroups.isEmpty ? 6 : 20,
                  bottom: 12,
                ),
                child: _SectionHeader(
                  label: S.current.strOther,
                  count: unknown.length,
                ),
              ),
            _GridOfTables(
              tables: unknown,
              savedIds: savedIds,
              totalsByTable: totalsByTable,
              openedAtByTable: openedAtByTable,
              onTap: onTap,
            ),
          ],
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String label;
  final int count;
  const _SectionHeader({required this.label, required this.count});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.baseline,
      textBaseline: TextBaseline.alphabetic,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: _kS900,
            fontFamily: 'Inter',
            letterSpacing: -0.2,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          '$count',
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w500,
            color: _kS400,
            fontFamily: 'Inter',
          ),
        ),
      ],
    );
  }
}

class _GridOfTables extends StatelessWidget {
  final List<CafeTableModel> tables;
  final Set<String> savedIds;
  final Map<String, int> totalsByTable;
  final Map<String, DateTime> openedAtByTable;
  final void Function(CafeTableModel) onTap;

  const _GridOfTables({
    required this.tables,
    required this.savedIds,
    required this.totalsByTable,
    required this.openedAtByTable,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        const cols = 6;
        const gap = 12.0;
        final cardW = (constraints.maxWidth - gap * (cols - 1)) / cols;
        return Wrap(
          spacing: gap,
          runSpacing: gap,
          children: tables
              .map(
                (t) => SizedBox(
                  width: cardW,
                  child: _TableCard(
                    table: t,
                    isSaved: savedIds.contains(t.id),
                    savedTotal: totalsByTable[t.id],
                    openedAt: openedAtByTable[t.id],
                    onTap: () => onTap(t),
                  ),
                ),
              )
              .toList(),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────
// Table card
// ─────────────────────────────────────────────

class _TableCard extends StatefulWidget {
  final CafeTableModel table;
  final bool isSaved;
  final int? savedTotal;
  final DateTime? openedAt;
  final VoidCallback onTap;

  const _TableCard({
    required this.table,
    required this.isSaved,
    required this.savedTotal,
    required this.openedAt,
    required this.onTap,
  });

  @override
  State<_TableCard> createState() => _TableCardState();
}

class _TableCardState extends State<_TableCard> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final status = widget.table.status;
    final bgColor = _bgFor(status);
    final borderColor = _borderFor(status);

    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 130),
          height: 156,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: _hovered ? _kBrand.withOpacity(0.5) : borderColor,
            ),
            boxShadow: _hovered
                ? [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: _buildContent(status),
        ),
      ),
    );
  }

  Color _bgFor(TableStatus status) {
    switch (status) {
      case TableStatus.free:
        return _kFreeBg;
      case TableStatus.busy:
        return Colors.white;
      case TableStatus.away:
        return Colors.white;
      case TableStatus.none:
        return Colors.white;
    }
  }

  Color _borderFor(TableStatus status) {
    switch (status) {
      case TableStatus.free:
        return const Color(0xFFBBF7D0);
      case TableStatus.busy:
        return _kS200;
      case TableStatus.away:
        return _kS200;
      case TableStatus.none:
        return _kS200;
    }
  }

  Widget _buildContent(TableStatus status) {
    switch (status) {
      case TableStatus.free:
        return _FreeCardContent(table: widget.table);
      case TableStatus.busy:
        return _BusyCardContent(
          table: widget.table,
          isSaved: widget.isSaved,
          savedTotal: widget.savedTotal,
          openedAt: widget.openedAt,
        );
      case TableStatus.away:
        return _ReservedCardContent(table: widget.table);
      case TableStatus.none:
        return _FreeCardContent(table: widget.table);
    }
  }
}

// ── Card header (title + capacity badge) ──────────────────────────────

class _CardHeader extends StatelessWidget {
  final int tableNumber;
  final int capacity;
  final Color titleColor;
  final String? statusBadgeLabel;
  final Color? statusBadgeFg;
  final Color? statusBadgeBg;

  const _CardHeader({
    required this.tableNumber,
    required this.capacity,
    required this.titleColor,
    this.statusBadgeLabel,
    this.statusBadgeFg,
    this.statusBadgeBg,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Text(
            'Stol $tableNumber',
            style: TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.w700,
              color: titleColor,
              fontFamily: 'Inter',
              letterSpacing: -0.2,
              height: 1.1,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        if (statusBadgeLabel != null) ...[
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: statusBadgeBg,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              statusBadgeLabel!,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: statusBadgeFg,
                fontFamily: 'Inter',
              ),
            ),
          ),
          const SizedBox(width: 6),
        ],
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.people_outline_rounded,
              size: 16,
              color: _kS500,
            ),
            const SizedBox(width: 4),
            Text(
              '$capacity',
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
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

// ── Free card ────────────────────────────────────────────────────────

class _FreeCardContent extends StatelessWidget {
  final CafeTableModel table;
  const _FreeCardContent({required this.table});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _CardHeader(
          tableNumber: table.number,
          capacity: table.capacity,
          titleColor: _kS900,
        ),
        const Spacer(),
        Center(
          child: Text(
            S.current.strFree,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w600,
              color: _kGreen,
              fontFamily: 'Inter',
            ),
          ),
        ),
        const Spacer(),
      ],
    );
  }
}

// ── Busy card ────────────────────────────────────────────────────────

class _BusyCardContent extends StatelessWidget {
  final CafeTableModel table;
  final bool isSaved;
  final int? savedTotal;
  final DateTime? openedAt;
  const _BusyCardContent({
    required this.table,
    required this.isSaved,
    required this.savedTotal,
    required this.openedAt,
  });

  @override
  Widget build(BuildContext context) {
    final hasPrice = (savedTotal ?? 0) > 0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _CardHeader(
          tableNumber: table.number,
          capacity: table.capacity,
          titleColor: _kS900,
          statusBadgeLabel: isSaved ? S.current.strSavedBadge : S.current.strBusy,
          statusBadgeFg: isSaved ? _kBrand : _kRed,
          statusBadgeBg: isSaved ? _kBrandTint : _kRedTint,
        ),
        const Spacer(),
        if (hasPrice)
          Text(
            '${_fmtSom(savedTotal!)} so\'m',
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: _kS900,
              fontFamily: 'Inter',
              letterSpacing: -0.3,
              height: 1.2,
            ),
          )
        else
          Text(
            S.current.strWaitingForOrderStatus,
            style: const TextStyle(
              fontSize: 15,
              color: _kS500,
              fontFamily: 'Inter',
            ),
          ),
        const Spacer(),
        _ElapsedLabel(openedAt: openedAt),
      ],
    );
  }
}

String _fmtSom(int v) {
  final s = v.toString();
  final buf = StringBuffer();
  for (int i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) buf.write(' ');
    buf.write(s[i]);
  }
  return buf.toString();
}

// ── Elapsed label (self-refreshing every 30s) ────────────────────────────

class _ElapsedLabel extends StatefulWidget {
  final DateTime? openedAt;
  const _ElapsedLabel({required this.openedAt});

  @override
  State<_ElapsedLabel> createState() => _ElapsedLabelState();
}

class _ElapsedLabelState extends State<_ElapsedLabel> {
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    if (widget.openedAt != null) {
      _ticker = Timer.periodic(const Duration(seconds: 30), (_) {
        if (mounted) setState(() {});
      });
    }
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final label = _calcLabel(widget.openedAt);
    if (label == null) return const SizedBox.shrink();
    return Row(
      children: [
        const Icon(Icons.access_time_rounded, size: 15, color: _kS500),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: _kS500,
            fontFamily: 'Inter',
          ),
        ),
      ],
    );
  }

  static String? _calcLabel(DateTime? openedAt) {
    if (openedAt == null) return null;
    final diff = DateTime.now().difference(openedAt);
    if (diff.isNegative) return null;
    final h = diff.inHours;
    final m = diff.inMinutes % 60;
    if (h <= 0 && diff.inMinutes < 1) return '< 1 daqiqa';
    if (h <= 0) return '${diff.inMinutes} daqiqa';
    return '$h soat ${m.toString().padLeft(2, '0')} daqiqa';
  }
}

// ── Reserved card ────────────────────────────────────────────────────

class _ReservedCardContent extends StatelessWidget {
  final CafeTableModel table;
  const _ReservedCardContent({required this.table});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _CardHeader(
          tableNumber: table.number,
          capacity: table.capacity,
          titleColor: _kS900,
          statusBadgeLabel: S.current.strReserved,
          statusBadgeFg: _kBlue,
          statusBadgeBg: _kBlueTint,
        ),
        const Spacer(),
        Center(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.access_time_rounded, size: 17, color: _kBlue),
              const SizedBox(width: 6),
              Text(
                S.current.strBusy,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: _kBlue,
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
        ),
        const Spacer(),
      ],
    );
  }
}

class _TakeawayHeaderButton extends StatelessWidget {
  const _TakeawayHeaderButton();

  @override
  Widget build(BuildContext context) {
    context.select((SettingsCubit c) => c.state.language);
    return GestureDetector(
      onTap: () {
        if (!_requireOpenShift(context)) return;
        Navigator.pushNamed(
          context,
          AppRoutes.detailScreen,
          arguments: {
            'table': null,
            'table_status': TableStatus.none,
            'guest_count': 1,
          },
        );
      },
      child: Container(
        height: 48,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF3EE),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFFECDBA)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          spacing: 8,
          children: [
            const Icon(
              Icons.shopping_bag_outlined,
              size: 18,
              color: Color(0xFFFB6633),
            ),
            Text(
              S.current.strTakeaway,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Color(0xFFFB6633),
                fontFamily: 'Inter',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════
// Refresh confirmation dialog
// ═══════════════════════════════════════════════════════

class _RefreshConfirmDialog extends StatefulWidget {
  const _RefreshConfirmDialog();

  @override
  State<_RefreshConfirmDialog> createState() => _RefreshConfirmDialogState();
}

class _RefreshConfirmDialogState extends State<_RefreshConfirmDialog> {
  bool _hoverCancel = false;
  bool _hoverConfirm = false;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480),
        child: Container(
          decoration: BoxDecoration(
            color: colors.bgDefault,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.25),
                blurRadius: 40,
                offset: const Offset(0, 16),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // ── Hero banner ──
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(28, 28, 28, 24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      _kBrandTint,
                      _kBrandTint.withOpacity(0.55),
                    ],
                  ),
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(24),
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: _kBrand.withOpacity(0.18),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.refresh_rounded,
                        color: _kBrand,
                        size: 30,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            S.current.strRefresh,
                            style: const TextStyle(
                              fontSize: 19,
                              fontWeight: FontWeight.w700,
                              color: _kS900,
                              fontFamily: 'Inter',
                              letterSpacing: -0.3,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            S.current.strRefreshing,
                            style: TextStyle(
                              fontSize: 13,
                              color: colors.textSecondary,
                              fontFamily: 'Inter',
                              height: 1.3,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              // ── Body ──
              Padding(
                padding: const EdgeInsets.fromLTRB(28, 22, 28, 8),
                child: Text(
                  "Stollar ma'lumotini serverdan qayta yuklashni xohlaysizmi?",
                  style: TextStyle(
                    fontSize: 14.5,
                    color: colors.textDefault,
                    fontFamily: 'Inter',
                    height: 1.45,
                  ),
                ),
              ),
              // ── Actions ──
              Padding(
                padding: const EdgeInsets.fromLTRB(28, 18, 28, 24),
                child: Row(
                  children: [
                    Expanded(
                      child: _RefreshDialogBtn(
                        label: S.current.strCancel,
                        onTap: () => Navigator.pop(context, false),
                        bg: colors.bgSecondary,
                        fg: colors.textDefault,
                        borderColor: colors.border,
                        hovered: _hoverCancel,
                        onHover: (v) => setState(() => _hoverCancel = v),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: _RefreshDialogBtn(
                        label: S.current.strRefresh,
                        icon: Icons.refresh_rounded,
                        onTap: () => Navigator.pop(context, true),
                        bg: _hoverConfirm
                            ? const Color(0xFFE85522)
                            : _kBrand,
                        fg: Colors.white,
                        hovered: _hoverConfirm,
                        onHover: (v) => setState(() => _hoverConfirm = v),
                        elevated: true,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RefreshDialogBtn extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback onTap;
  final Color bg;
  final Color fg;
  final Color? borderColor;
  final bool hovered;
  final ValueChanged<bool> onHover;
  final bool elevated;

  const _RefreshDialogBtn({
    required this.label,
    required this.onTap,
    required this.bg,
    required this.fg,
    required this.hovered,
    required this.onHover,
    this.icon,
    this.borderColor,
    this.elevated = false,
  });

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => onHover(true),
      onExit: (_) => onHover(false),
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 140),
          height: 48,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(12),
            border: borderColor != null
                ? Border.all(color: borderColor!)
                : null,
            boxShadow: elevated
                ? [
                    BoxShadow(
                      color: _kBrand.withOpacity(hovered ? 0.35 : 0.22),
                      blurRadius: hovered ? 16 : 10,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[
                Icon(icon, color: fg, size: 18),
                const SizedBox(width: 8),
              ],
              Text(
                label,
                style: TextStyle(
                  color: fg,
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  letterSpacing: -0.1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
