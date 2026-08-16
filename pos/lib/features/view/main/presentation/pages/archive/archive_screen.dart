import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/api/api.dart';
import 'package:mary_ai_pos/core/components/flush_bars.dart';
import 'package:mary_ai_pos/core/design_system/pos_design_system.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/number_formatter.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/core/theme/tokens/theme_colors.dart';
import 'package:mary_ai_pos/core/utils/app_formatter.dart';
import 'package:mary_ai_pos/core/utils/order_localizations.dart';
import 'package:mary_ai_pos/core/utils/user_role_permissions.dart';
import 'package:mary_ai_pos/core/widgets/app_scaffold.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/bloc/user_bloc.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archive_entity.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/archives/archives_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/archive/widgets/archive_right_sider_bar.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/main_header.dart';
import 'package:mary_ai_pos/generated/l10n.dart';
import 'package:number_paginator/number_paginator.dart';

class ArchiveScreen extends StatelessWidget {
  const ArchiveScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final role = context.select((UserBloc b) => b.state.userMOdel?.role);
    return AppScaffold(
      activeRoute: AppRoutes.archiveScreen,
      body: role.canViewAllOrders
          ? const _AdminOrdersArchiveBody()
          : BlocProvider(
              create: (context) =>
                  inject<ArchivesBloc>()..add(const ArchivesEvent.started()),
              child: const _ArchiveBody(),
            ),
    );
  }
}

class _ArchiveBody extends StatelessWidget {
  const _ArchiveBody();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        MainHeader(title: S.current.strArchive),
        Expanded(
          child: BlocBuilder<ArchivesBloc, ArchivesState>(
            builder: (context, state) {
              final archives = state.archives?.archives ?? [];

              final openCount = archives
                  .where(
                    (a) =>
                        a.status == OrderStatus.open ||
                        a.status == OrderStatus.opened,
                  )
                  .length;
              final revenue = archives.fold<int>(
                0,
                (sum, a) => sum + a.totalPrice,
              );
              final avgCheck = archives.isNotEmpty
                  ? revenue ~/ archives.length
                  : 0;

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header row: filter bar + Export CSV
                  _ArchiveFilterBar(state: state),

                  // Inline metrics (no card containers — Rule 4: anti-card overuse)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 14),
                    child: _InlineStatsRow(
                      count: archives.length,
                      revenue: revenue,
                      openCount: openCount,
                      avgCheck: avgCheck,
                    ),
                  ),

                  // Thin structural divider between controls and table
                  const Divider(height: 1, color: Color(0xFFE2E8F0)),

                  // Table + optional detail sidebar
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        spacing: 16,
                        children: [
                          Expanded(
                            child: _ArchiveTable(
                              archives: archives,
                              selectedId: state.selectArchive?.id,
                              isLoading: state.status == Status.LOADING,
                              onSelect: (id) => context
                                  .read<ArchivesBloc>()
                                  .add(ArchivesEvent.selectArchive(id: id)),
                            ),
                          ),
                          if (state.selectArchive != null)
                            const SizedBox(
                              width: 300,
                              child: ArchiveRightSiderBar(),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ],
    );
  }
}

// ─── Inline 4-metric row (borderless, divider-separated) ────────────────────

class _InlineStatsRow extends StatelessWidget {
  final int count;
  final int revenue;
  final int openCount;
  final int avgCheck;

  const _InlineStatsRow({
    required this.count,
    required this.revenue,
    required this.openCount,
    required this.avgCheck,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _Metric(
          label: S.current.strOrders,
          value: '$count',
          unit: 'ta',
          valueColor: const Color(0xFF0F172A),
        ),
        const _MetricDivider(),
        _Metric(
          label: S.current.strUmumiySumma,
          value: revenue.formatNWithoutS,
          unit: "so'm",
          valueColor: const Color(0xFF16A34A),
        ),
        const _MetricDivider(),
        _Metric(
          label: S.current.strOpenBills,
          value: '$openCount',
          unit: 'aktiv',
          valueColor: const Color(0xFFFB6633),
        ),
        const _MetricDivider(),
        _Metric(
          label: S.current.strAverageCheck,
          value: avgCheck.formatNWithoutS,
          unit: "so'm",
          valueColor: const Color(0xFF2563EB),
        ),
      ],
    );
  }
}

class _Metric extends StatelessWidget {
  final String label;
  final String value;
  final String unit;
  final Color valueColor;

  const _Metric({
    required this.label,
    required this.value,
    required this.unit,
    required this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Color(0xFF64748B),
              fontFamily: 'Inter',
            ),
          ),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Flexible(
                child: Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w700,
                    color: valueColor,
                    fontFamily: 'Inter',
                    letterSpacing: -0.5,
                    height: 1,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                unit,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF94A3B8),
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

class _MetricDivider extends StatelessWidget {
  const _MetricDivider();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 36,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      color: const Color(0xFFE2E8F0),
    );
  }
}

// ─── Cashier archive table ──────────────────────────────────────────────────

class _ArchiveTable extends StatelessWidget {
  final List<ArchiveEntity> archives;
  final String? selectedId;
  final bool isLoading;
  final ValueChanged<String> onSelect;

  const _ArchiveTable({
    required this.archives,
    required this.selectedId,
    required this.isLoading,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          // Header
          Container(
            height: 44,
            padding: const EdgeInsets.symmetric(horizontal: 4),
            decoration: const BoxDecoration(
              border: Border(
                bottom: BorderSide(color: Color(0xFFE2E8F0)),
              ),
            ),
            child: Row(
              children: [
                const _ThCell(label: '#', flex: 2),
                _ThCell(label: S.current.strTimeColumnHeader, flex: 2),
                _ThCell(label: S.current.strTypeColumnHeader, flex: 2),
                const _ThCell(label: 'Stol', flex: 1),
                _ThCell(label: S.current.strAmountColumnHeader, flex: 3),
                _ThCell(label: S.current.strStatusColumnHeader, flex: 2),
              ],
            ),
          ),
          Expanded(
            child: isLoading && archives.isEmpty
                ? const Center(
                    child: CircularProgressIndicator.adaptive(),
                  )
                : archives.isEmpty
                ? _EmptyState()
                : ListView.separated(
                    itemCount: archives.length,
                    separatorBuilder: (_, _) => const Divider(
                      height: 1,
                      thickness: 1,
                      color: Color(0xFFF1F5F9),
                    ),
                    itemBuilder: (context, i) => _ArchiveRow(
                      archive: archives[i],
                      isSelected: selectedId == archives[i].id,
                      onTap: () => onSelect(archives[i].id),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.receipt_long_outlined,
              size: 26,
              color: Color(0xFF94A3B8),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            S.current.strArchiveEmpty,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: Color(0xFF64748B),
              fontFamily: 'Inter',
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Tanlangan davrda buyurtmalar topilmadi',
            style: TextStyle(
              fontSize: 12,
              color: Color(0xFF94A3B8),
              fontFamily: 'Inter',
            ),
          ),
        ],
      ),
    );
  }
}

class _ArchiveFilterBar extends StatelessWidget {
  final ArchivesState state;
  const _ArchiveFilterBar({required this.state});

  static const _filterLabels = ['Hammasi', 'Bugun', 'Hafta', 'Oy'];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        spacing: 8,
        children: [
          // Search
          SizedBox(
            width: 200,
            height: 36,
            child: TextField(
              controller: state.textController,
              decoration: InputDecoration(
                hintText: S.current.strSearchTableOrCheck,
                hintStyle: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF94A3B8),
                  fontFamily: 'Inter',
                ),
                prefixIcon: const Icon(
                  Icons.search_rounded,
                  size: 18,
                  color: Color(0xFF94A3B8),
                ),
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                contentPadding: EdgeInsets.zero,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFFFB6633)),
                ),
              ),
              style: const TextStyle(
                fontSize: 13,
                fontFamily: 'Inter',
                color: Color(0xFF0F172A),
              ),
              onChanged: (v) => context.read<ArchivesBloc>().add(
                ArchivesEvent.searchByArchiveNum(v),
              ),
            ),
          ),

          // Filter tabs
          Container(
            height: 36,
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
            ),
            padding: const EdgeInsets.all(4),
            child: Row(
              spacing: 0,
              children: List.generate(state.filters.length, (i) {
                final isActive = state.filterType == state.filters[i];
                return GestureDetector(
                  onTap: () => context.read<ArchivesBloc>().add(
                    ArchivesEvent.updateFilterType(type: state.filters[i]),
                  ),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: isActive ? Colors.white : Colors.transparent,
                      borderRadius: BorderRadius.circular(7),
                      boxShadow: isActive
                          ? [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.08),
                                blurRadius: 4,
                                offset: const Offset(0, 1),
                              ),
                            ]
                          : null,
                    ),
                    child: Text(
                      _filterLabels[i],
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: isActive
                            ? const Color(0xFF0F172A)
                            : const Color(0xFF64748B),
                        fontFamily: 'Inter',
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),

          const Spacer(),

          // Date range picker
          _DateRangeButton(state: state),

          // Export CSV
          _ExportCsvButton(archives: state.archives?.archives ?? const []),
        ],
      ),
    );
  }
}

// ─── Date range picker button ────────────────────────────────────────────────

class _DateRangeButton extends StatelessWidget {
  final ArchivesState state;
  const _DateRangeButton({required this.state});

  bool get _isActive => state.filterType == ArchivesFilterType.date;

  String get _label {
    if (!_isActive || state.startFilterDate == null) return 'Sana';
    final s = state.startFilterDate!;
    final e = state.endFilterDate;
    final start =
        '${s.day.toString().padLeft(2, '0')}.${s.month.toString().padLeft(2, '0')}';
    if (e == null || (e.day == s.day && e.month == s.month && e.year == s.year)) {
      return start;
    }
    final end =
        '${e.day.toString().padLeft(2, '0')}.${e.month.toString().padLeft(2, '0')}';
    return '$start — $end';
  }

  Future<void> _pick(BuildContext context) async {
    final bloc = context.read<ArchivesBloc>();
    final picked = await showDateRangePicker(
      context: context,
      initialDateRange: DateTimeRange(
        start: state.startFilterDate ?? DateTime.now(),
        end: state.endFilterDate ?? DateTime.now(),
      ),
      firstDate: DateTime(2000),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      initialEntryMode: DatePickerEntryMode.calendarOnly,
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: Theme.of(context).colorScheme.copyWith(
            primary: const Color(0xFFFB6633),
            onPrimary: Colors.white,
            surface: Colors.white,
          ),
          textButtonTheme: TextButtonThemeData(
            style: TextButton.styleFrom(
              foregroundColor: const Color(0xFFFB6633),
            ),
          ),
        ),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420, maxHeight: 580),
            child: child,
          ),
        ),
      ),
    );
    if (picked != null) {
      bloc.add(
        ArchivesEvent.updateFilterDateRange(
          startDate: picked.start,
          endDate: picked.end,
        ),
      );
    }
  }

  void _clear(BuildContext context) {
    context.read<ArchivesBloc>().add(
      const ArchivesEvent.updateFilterType(type: ArchivesFilterType.All),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      height: 36,
      decoration: BoxDecoration(
        color: _isActive ? const Color(0xFFFFF3EE) : Colors.white,
        border: Border.all(
          color: _isActive ? const Color(0xFFFB6633) : const Color(0xFFE2E8F0),
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          GestureDetector(
            onTap: () => _pick(context),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                spacing: 6,
                children: [
                  Icon(
                    Icons.calendar_today_rounded,
                    size: 13,
                    color: _isActive
                        ? const Color(0xFFFB6633)
                        : const Color(0xFF64748B),
                  ),
                  Text(
                    _label,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: _isActive
                          ? FontWeight.w600
                          : FontWeight.w400,
                      color: _isActive
                          ? const Color(0xFFFB6633)
                          : const Color(0xFF64748B),
                      fontFamily: 'Inter',
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_isActive) ...[
            Container(
              width: 1,
              height: 18,
              color: const Color(0xFFFB6633).withValues(alpha: 0.3),
            ),
            GestureDetector(
              onTap: () => _clear(context),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 8),
                child: Icon(
                  Icons.close_rounded,
                  size: 14,
                  color: Color(0xFFFB6633),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ─── Export CSV (copies to clipboard) ───────────────────────────────────────

class _ExportCsvButton extends StatelessWidget {
  final List<ArchiveEntity> archives;
  const _ExportCsvButton({required this.archives});

  void _export(BuildContext context) {
    final buffer = StringBuffer()
      ..writeln('#,Stol,Holat,Taomlar,Summa,Vaqt');
    for (final a in archives) {
      final time = a.opened != null
          ? '${a.opened!.year}-${a.opened!.month.toString().padLeft(2, '0')}-${a.opened!.day.toString().padLeft(2, '0')} '
                '${a.opened!.hour.toString().padLeft(2, '0')}:${a.opened!.minute.toString().padLeft(2, '0')}'
          : '';
      buffer.writeln(
        '${a.bilNumber},${a.tableNumber},${a.status.name},${a.goodsQuantity},${a.totalPrice},$time',
      );
    }
    Clipboard.setData(ClipboardData(text: buffer.toString()));
    showInfoMessage(
      context,
      'CSV clipboard\'ga nusxalandi · ${archives.length} ta',
      duration: 2,
    );
  }

  @override
  Widget build(BuildContext context) {
    final enabled = archives.isNotEmpty;
    return GestureDetector(
      onTap: enabled ? () => _export(context) : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        height: 36,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: enabled ? Colors.white : const Color(0xFFF8FAFC),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.file_download_outlined,
              size: 15,
              color: enabled
                  ? const Color(0xFF0F172A)
                  : const Color(0xFF94A3B8),
            ),
            const SizedBox(width: 8),
            Text(
              'Eksport CSV',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: enabled
                    ? const Color(0xFF0F172A)
                    : const Color(0xFF94A3B8),
                fontFamily: 'Inter',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ThCell extends StatelessWidget {
  final String label;
  final int flex;
  const _ThCell({required this.label, required this.flex});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      flex: flex,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        child: Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: Color(0xFF64748B),
            fontFamily: 'Inter',
            letterSpacing: 0.2,
          ),
        ),
      ),
    );
  }
}

class _ArchiveRow extends StatefulWidget {
  final ArchiveEntity archive;
  final bool isSelected;
  final VoidCallback onTap;

  const _ArchiveRow({
    required this.archive,
    required this.isSelected,
    required this.onTap,
  });

  @override
  State<_ArchiveRow> createState() => _ArchiveRowState();
}

class _ArchiveRowState extends State<_ArchiveRow> {
  bool _hover = false;

  @override
  Widget build(BuildContext context) {
    final archive = widget.archive;
    final time = archive.opened != null
        ? '${archive.opened!.hour.toString().padLeft(2, '0')}:${archive.opened!.minute.toString().padLeft(2, '0')}'
        : '-';
    final isTakeaway = archive.tableNumber == 0;

    final bg = widget.isSelected
        ? const Color(0xFFFFF3EE)
        : _hover
        ? const Color(0xFFF8FAFC)
        : Colors.transparent;

    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hover = true),
      onExit: (_) => setState(() => _hover = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 120),
          curve: Curves.easeOut,
          height: 56,
          padding: const EdgeInsets.symmetric(horizontal: 4),
          color: bg,
          child: Row(
            children: [
              // #
              Expanded(
                flex: 2,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Text(
                    '#${archive.bilNumber}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: widget.isSelected
                          ? const Color(0xFFFB6633)
                          : const Color(0xFF0F172A),
                      fontFamily: 'Inter',
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                ),
              ),
              // Vaqt
              Expanded(
                flex: 2,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Text(
                    time,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF64748B),
                      fontFamily: 'Inter',
                      fontFeatures: [FontFeature.tabularFigures()],
                    ),
                  ),
                ),
              ),
              // Tur
              Expanded(
                flex: 2,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: _TypeChip(isTakeaway: isTakeaway),
                  ),
                ),
              ),
              // Stol
              Expanded(
                flex: 1,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  child: isTakeaway
                      ? const Text(
                          '—',
                          maxLines: 1,
                          style: TextStyle(
                            fontSize: 13,
                            color: Color(0xFF94A3B8),
                            fontFamily: 'Inter',
                          ),
                        )
                      : Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(7),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            '${archive.tableNumber}',
                            maxLines: 1,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF0F172A),
                              fontFamily: 'Inter',
                            ),
                          ),
                        ),
                ),
              ),
              // Summa
              Expanded(
                flex: 3,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Text(
                    archive.totalPrice.formatN,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F172A),
                      fontFamily: 'Inter',
                      fontFeatures: [FontFeature.tabularFigures()],
                    ),
                  ),
                ),
              ),
              // Holat
              Expanded(
                flex: 2,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: _StatusBadge(status: archive.status),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Order type chip (dine-in vs takeaway)
class _TypeChip extends StatelessWidget {
  final bool isTakeaway;
  const _TypeChip({required this.isTakeaway});

  @override
  Widget build(BuildContext context) {
    if (isTakeaway) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF3EE),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFFB6633).withOpacity(0.3)),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.shopping_bag_outlined,
              size: 13,
              color: Color(0xFFFB6633),
            ),
            SizedBox(width: 6),
            Text(
              'Olib ketish',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: Color(0xFFFB6633),
                fontFamily: 'Inter',
              ),
            ),
          ],
        ),
      );
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.restaurant_outlined,
            size: 13,
            color: Color(0xFF475569),
          ),
          SizedBox(width: 6),
          Text(
            'Zalda',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Color(0xFF475569),
              fontFamily: 'Inter',
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final OrderStatus status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String key;

    switch (status) {
      case OrderStatus.open:
      case OrderStatus.opened:
      case OrderStatus.pending:
        bg = const Color(0xFFFFF3EE);
        fg = const Color(0xFFFB6633);
        key = 'open';
      case OrderStatus.closed:
      case OrderStatus.paid:
        bg = const Color(0xFFDCFCE7);
        fg = const Color(0xFF16A34A);
        key = status == OrderStatus.paid ? 'paid' : 'closed';
      case OrderStatus.deleted:
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFFDC2626);
        key = 'cancelled';
      default:
        bg = const Color(0xFFF8FAFC);
        fg = const Color(0xFF64748B);
        key = '';
    }
    final label = '● ${key.isEmpty ? '—' : localizedOrderStatus(context, key)}';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: fg,
          fontFamily: 'Inter',
        ),
      ),
    );
  }
}

class _AdminOrdersArchiveBody extends StatefulWidget {
  const _AdminOrdersArchiveBody();

  @override
  State<_AdminOrdersArchiveBody> createState() =>
      _AdminOrdersArchiveBodyState();
}

class _AdminOrdersArchiveBodyState extends State<_AdminOrdersArchiveBody> {
  static const List<int> _pageSizeOptions = [20, 50, 100];
  int _pageSize = 20;
  final NumberPaginatorController _paginatorController =
      NumberPaginatorController();
  final DioClient _client = inject<DioClient>();
  final ScrollController _scrollCtrl = ScrollController();

  List<_AdminOrderItem> _orders = const [];
  bool _loading = true;
  String? _error;
  int _page = 1;
  int? _totalCount;
  String? _statusFilter;
  String? _orderTypeFilter;

  // id → displayName (waiter va kassir uchun)
  Map<String, String> _userNames = {};
  // tableId → {number, hallName}
  Map<String, _TableMeta> _tableMeta = {};

  int get _totalPages {
    final total = _totalCount;
    if (total == null || total <= 0) return 1;
    final pages = (total + _pageSize - 1) ~/ _pageSize;
    return pages > 0 ? pages : 1;
  }

  @override
  void initState() {
    super.initState();
    _loadMeta();
    _load(page: 1);
  }

  @override
  void dispose() {
    _paginatorController.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadMeta() async {
    try {
      final results = await Future.wait([
        _client.get(ListAPI.users, queryParameters: {'limit': 1000}),
        _client.get(ListAPI.halls),
        _client.get(ListAPI.cafeTables, queryParameters: {'limit': 1000}),
      ]);

      // Users: id → displayName
      final usersRaw = results[0].data;
      final usersList = usersRaw is Map && usersRaw['data'] is List
          ? usersRaw['data'] as List
          : usersRaw is List
          ? usersRaw
          : const [];
      final userNames = <String, String>{};
      for (final u in usersList) {
        if (u is! Map<String, dynamic>) continue;
        final id = (u['id'] ?? '').toString();
        if (id.isEmpty) continue;
        final name = (u['full_name'] ?? u['username'] ?? '').toString().trim();
        if (name.isNotEmpty) userNames[id] = name;
      }

      // Halls: id → name
      final hallsRaw = results[1].data;
      final hallsList = hallsRaw is Map && hallsRaw['data'] is List
          ? hallsRaw['data'] as List
          : hallsRaw is List
          ? hallsRaw
          : const [];
      final hallNames = <String, String>{};
      for (final h in hallsList) {
        if (h is! Map) continue;
        final id = (h['id'] ?? '').toString();
        final name = (h['name'] ?? '').toString();
        if (id.isNotEmpty && name.isNotEmpty) hallNames[id] = name;
      }

      // Tables: tableId → _TableMeta
      final tablesRaw = results[2].data;
      final tablesList = tablesRaw is Map && tablesRaw['data'] is List
          ? tablesRaw['data'] as List
          : tablesRaw is List
          ? tablesRaw
          : const [];
      final tableMeta = <String, _TableMeta>{};
      for (final t in tablesList) {
        if (t is! Map) continue;
        final id = (t['id'] ?? '').toString();
        if (id.isEmpty) continue;
        final number = (t['number'] as num?)?.toInt() ?? 0;
        final hallId = (t['hall_id'] ?? '').toString();
        tableMeta[id] = _TableMeta(
          number: number,
          hallName: hallNames[hallId] ?? '',
        );
      }

      if (!mounted) return;
      setState(() {
        _userNames = userNames;
        _tableMeta = tableMeta;
      });
    } catch (_) {
      // meta yuklanmasa ham ro'yxat ko'rinadi
    }
  }

  Future<void> _load({int page = 1}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final query = <String, dynamic>{
        'lang': 'uz',
        'sort_by': 'created_at',
        'sort_order': 'desc',
        'limit': _pageSize,
        'offset': (page - 1) * _pageSize,
        if (_statusFilter != null) 'status': _statusFilter,
        if (_orderTypeFilter != null) 'type': _orderTypeFilter,
      };
      final res = await _client.get(ListAPI.orders, queryParameters: query);
      final data = res.data is Map<String, dynamic>
          ? res.data as Map<String, dynamic>
          : <String, dynamic>{};
      final list = data['data'] is List ? data['data'] as List : const [];
      final parsed = list
          .whereType<Map<String, dynamic>>()
          .map(_AdminOrderItem.fromJson)
          .toList();
      final total = _extractTotalCount(data);

      if (!mounted) return;
      setState(() {
        _orders = parsed;
        _page = page;
        _totalCount = total;
        _loading = false;
      });
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.response?.data is Map
            ? (e.response!.data['message']?.toString() ?? 'Yuklashda xatolik')
            : 'Yuklashda xatolik';
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Buyurtmalarni yuklab bo\'lmadi';
      });
    }
  }

  int? _extractTotalCount(Map<String, dynamic> raw) {
    final candidates = [
      raw['total'],
      raw['count'],
      raw['meta'] is Map ? (raw['meta'] as Map)['total'] : null,
      raw['meta'] is Map ? (raw['meta'] as Map)['count'] : null,
      raw['pagination'] is Map ? (raw['pagination'] as Map)['total'] : null,
    ];
    for (final c in candidates) {
      if (c is num) return c.toInt();
      if (c is String) {
        final parsed = int.tryParse(c);
        if (parsed != null) return parsed;
      }
    }
    return null;
  }

  void _applyFilters({String? status, String? type}) {
    setState(() {
      _statusFilter = status;
      _orderTypeFilter = type;
    });
    _load(page: 1);
  }

  void _exportCsvAdmin(BuildContext context) {
    final buffer = StringBuffer()
      ..writeln('#,Stol,Zal,Ofitsiant,Vaqt,Taomlar,Summa,Holat,Tur');
    for (final o in _orders) {
      final meta = _tableMeta[o.tableId];
      final tableNum = meta?.number ?? 0;
      final hallName = meta?.hallName ?? '';
      final staff = _userNames[o.waiterId] ?? _userNames[o.cashierId] ?? '';
      final statusLabel = localizedOrderStatus(context, o.status);
      final typeLabel = localizedOrderType(context, o.orderType);
      final tableLabel = tableNum > 0 ? 'Stol $tableNum' : '—';
      final sumLabel = o.totalAmount == '0' || o.totalAmount.isEmpty ? '—' : o.totalAmount;
      buffer.writeln(
        '${o.bilNumber > 0 ? o.bilNumber : o.id},$tableLabel,$hallName,$staff,${o.createdAtLabel},${o.goodsCount > 0 ? o.goodsCount : '—'},$sumLabel,$statusLabel,$typeLabel',
      );
    }
    Clipboard.setData(ClipboardData(text: buffer.toString()));
    showInfoMessage(
      context,
      'CSV clipboard\'ga nusxalandi · ${_orders.length} ta',
      duration: 2,
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    // Compute stats from loaded orders
    int totalSum = 0;
    int cashSum = 0;
    int cardSum = 0;
    for (final o in _orders) {
      final amt = int.tryParse(
            o.totalAmount.replaceAll(RegExp(r'[^0-9]'), ''),
          ) ??
          0;
      totalSum += amt;
      final pm = o.paymentMethod;
      if (pm == 'cash' || pm == 'naqd') {
        cashSum += amt;
      } else if (pm == 'card' || pm == 'karta') {
        cardSum += amt;
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Page header ──────────────────────────────────────────────────
        Container(
          height: PosDimensions.appBarHeight, // 64
          padding: EdgeInsets.symmetric(
            horizontal: PosBreakpoints.pick<double>(
              context,
              compact: PosDimensions.l, // 16
              comfortable: PosDimensions.xxl, // 24
            ),
          ),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
          ),
          child: Row(
            children: [
              const Text(
                'Barcha buyurtmalar',
                style: TextStyle(
                  fontSize: PosTypography.bodyLg, // 17
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A),
                  fontFamily: PosTypography.family,
                  letterSpacing: -0.3,
                ),
              ),
              const Spacer(),
              GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: _orders.isNotEmpty ? () => _exportCsvAdmin(context) : null,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 120),
                  // POS minimum touch zone
                  height: 48,
                  padding: const EdgeInsets.symmetric(horizontal: PosDimensions.l),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    borderRadius: BorderRadius.circular(PosDimensions.radiusMd),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    spacing: PosDimensions.s,
                    children: [
                      Icon(
                        Icons.file_download_outlined,
                        size: 18,
                        color: _orders.isNotEmpty
                            ? const Color(0xFF0F172A)
                            : const Color(0xFF94A3B8),
                      ),
                      Text(
                        'Eksport CSV',
                        style: TextStyle(
                          fontSize: PosTypography.bodyMd, // 15
                          fontWeight: FontWeight.w600,
                          color: _orders.isNotEmpty
                              ? const Color(0xFF0F172A)
                              : const Color(0xFF94A3B8),
                          fontFamily: PosTypography.family,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        // ── Filter bar ────────────────────────────────────────────────────
        Container(
          padding: EdgeInsets.symmetric(
            horizontal: PosBreakpoints.pick<double>(
              context,
              compact: PosDimensions.l,
              comfortable: PosDimensions.xxl,
            ),
            vertical: PosDimensions.s, // 8
          ),
          color: Colors.white,
          child: Row(
            children: [
              // Search
              SizedBox(
                width: PosBreakpoints.pick<double>(
                  context,
                  compact: 200,
                  comfortable: 240,
                ),
                // POS-friendly height
                height: 48,
                child: TextField(
                  decoration: InputDecoration(
                    hintText: S.current.strSearch,
                    hintStyle: const TextStyle(
                      fontSize: PosTypography.bodyMd, // 15
                      color: Color(0xFF94A3B8),
                      fontFamily: PosTypography.family,
                    ),
                    prefixIcon: const Icon(
                      Icons.search_rounded,
                      size: 18,
                      color: Color(0xFF94A3B8),
                    ),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    contentPadding: EdgeInsets.zero,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(PosDimensions.radiusMd),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(PosDimensions.radiusMd),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(PosDimensions.radiusMd),
                      borderSide: const BorderSide(color: Color(0xFFFB6633)),
                    ),
                  ),
                  style: const TextStyle(
                    fontSize: PosTypography.bodyMd,
                    fontFamily: PosTypography.family,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ),

              // Pills (scroll horizontally on narrow windows)
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    spacing: 6,
                    children: [
                      const SizedBox(width: 6),
                      const _VerticalDivider(),
                      for (final entry in const [
                        (null, 'Hammasi'),
                        ('open', 'Ochiq'),
                        ('paid', "To'langan"),
                        ('cancelled', 'Bekor'),
                      ])
                        _AdminFilterPill(
                          label: entry.$2,
                          isActive: _statusFilter == entry.$1,
                          activeColor: switch (entry.$1) {
                            'open' => const Color(0xFFFB6633),
                            'paid' => const Color(0xFF16A34A),
                            'cancelled' => const Color(0xFFDC2626),
                            _ => const Color(0xFF0F172A),
                          },
                          onTap: () => _applyFilters(
                            status: entry.$1,
                            type: _orderTypeFilter,
                          ),
                        ),
                      const _VerticalDivider(),
                      for (final entry in const [
                        (null, 'Barchasi'),
                        ('dine_in', 'Zalda'),
                        ('takeaway', 'Olib ketish'),
                      ])
                        _AdminFilterPill(
                          label: entry.$2,
                          isActive: _orderTypeFilter == entry.$1,
                          activeColor: const Color(0xFF0F172A),
                          onTap: () => _applyFilters(
                            status: _statusFilter,
                            type: entry.$1,
                          ),
                        ),
                    ],
                  ),
                ),
              ),

              const SizedBox(width: 8),

              // Jami count
              Text(
                'Jami: ${_totalCount ?? _orders.length}',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF94A3B8),
                  fontFamily: 'Inter',
                ),
              ),

              const SizedBox(width: 6),

              // Refresh
              GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: _loading ? null : () => _load(page: 1),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 120),
                  // POS minimum touch zone
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    borderRadius: BorderRadius.circular(PosDimensions.radiusMd),
                  ),
                  child: Center(
                    child: Icon(
                      Icons.refresh_rounded,
                      size: 20,
                      color: _loading
                          ? const Color(0xFFCBD5E1)
                          : const Color(0xFF64748B),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),

        const Divider(height: 1, color: Color(0xFFE2E8F0)),

        // ── Stats row ─────────────────────────────────────────────────────
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
          color: Colors.white,
          child: Row(
            children: [
              _AdminStatBlock(
                label: S.current.strOrders,
                value: '${_totalCount ?? _orders.length}',
                unit: 'ta',
                color: const Color(0xFF0F172A),
              ),
              const _AdminStatDivider(),
              _AdminStatBlock(
                label: S.current.strTotalSum,
                value: AppFormatter.formatAmountWithSpaces(totalSum.toString()),
                unit: "so'm",
                color: const Color(0xFF16A34A),
              ),
              const _AdminStatDivider(),
              _AdminStatBlock(
                label: S.current.strCash,
                value: AppFormatter.formatAmountWithSpaces(cashSum.toString()),
                unit: "so'm",
                color: const Color(0xFF0F172A),
              ),
              const _AdminStatDivider(),
              _AdminStatBlock(
                label: S.current.strCard,
                value: AppFormatter.formatAmountWithSpaces(cardSum.toString()),
                unit: "so'm",
                color: const Color(0xFF2563EB),
              ),
            ],
          ),
        ),

        const Divider(height: 1, color: Color(0xFFE2E8F0)),

        // ── Table ─────────────────────────────────────────────────────────
        Expanded(
          child: Container(
            color: Colors.white,
            child: Column(
              children: [
                // Table header
                Container(
                  height: 48,
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  decoration: const BoxDecoration(
                    color: Color(0xFFF8FAFC),
                    border: Border(
                      bottom: BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                  ),
                  child: Row(
                    children: [
                      _AdminThCell(label: S.current.strOrderNumber, flex: 2),
                      _AdminThCell(label: S.current.strTimeColumnHeader, flex: 2),
                      _AdminThCell(label: S.current.strTypeColumnHeader, flex: 1),
                      _AdminThCell(label: S.current.strTableHall, flex: 3),
                      _AdminThCell(label: S.current.strDishesColumn, flex: 2),
                      _AdminThCell(label: S.current.strAmountColumnHeader, flex: 3),
                      _AdminThCell(label: S.current.strPayment, flex: 1),
                      _AdminThCell(label: S.current.strStatusColumnHeader, flex: 2),
                      const _AdminThCell(label: '', flex: 1),
                    ],
                  ),
                ),

                // Table body
                Expanded(
                  child: _loading && _orders.isEmpty
                      ? const Center(
                          child: CircularProgressIndicator.adaptive(),
                        )
                      : _error != null
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                _error!,
                                style: TextStyle(color: colors.systemError),
                              ),
                              const SizedBox(height: 10),
                              FilledButton(
                                onPressed: () => _load(page: _page),
                                child: Text(S.current.strRetry),
                              ),
                            ],
                          ),
                        )
                      : _orders.isEmpty
                      ? Center(
                          child: Text(
                            'Buyurtmalar topilmadi',
                            style: TextStyle(color: colors.textSecondary),
                          ),
                        )
                      : ListView.separated(
                          controller: _scrollCtrl,
                          itemCount: _orders.length,
                          separatorBuilder: (_, _) => const Divider(
                            height: 1,
                            color: Color(0xFFF1F5F9),
                          ),
                          itemBuilder: (context, i) {
                            final o = _orders[i];
                            final meta = _tableMeta[o.tableId];
                            final tableNum = meta?.number ?? 0;
                            final hallName = meta?.hallName ?? '';
                            final waiterName = _userNames[o.waiterId] ?? '';
                            final cashierName = _userNames[o.cashierId] ?? '';
                            return _AdminOrderRow(
                              order: o,
                              tableNum: tableNum,
                              hallName: hallName,
                              staffName: waiterName.isNotEmpty
                                  ? waiterName
                                  : cashierName,
                              statusBadge: _orderStatusBadge(
                                status: o.status,
                                secondaryTextColor: colors.textSecondary,
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
          ),
        ),

        _buildPaginationBar(colors),
      ],
    );
  }

  Widget _buildPaginationBar(ThemeColors colors) {
    final totalPages = _totalPages;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Theme(
            data: Theme.of(context).copyWith(
              colorScheme: Theme.of(context).colorScheme.copyWith(
                secondary: colors.buttonBrand,
                onSecondary: colors.textOnBrand,
              ),
            ),
            child: SizedBox(
              width: 372,
              height: 48,
              child: NumberPaginator(
                controller: _paginatorController,
                numberPages: totalPages,
                initialPage: (_page - 1).clamp(0, totalPages - 1),
                onPageChange: (pageIndex) {
                  if (_loading) return;
                  _load(page: pageIndex + 1);
                },
                child: const SizedBox(
                  height: 48,
                  child: Row(
                    children: [
                      PrevButton(),
                      Expanded(child: NumberContent()),
                      NextButton(),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Container(
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: colors.bgSecondary,
              borderRadius: BorderRadius.circular(PosDimensions.radiusMd),
              border: Border.all(color: colors.border),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<int>(
                value: _pageSize,
                isDense: true,
                icon: Icon(
                  Icons.expand_more_rounded,
                  color: colors.textSecondary,
                ),
                style: TextStyle(
                  fontSize: 13,
                  color: colors.textDefault,
                  fontWeight: FontWeight.w500,
                  fontFamily: 'Inter',
                ),
                items: _pageSizeOptions
                    .map(
                      (size) => DropdownMenuItem<int>(
                        value: size,
                        child: Text('$size / sahifa'),
                      ),
                    )
                    .toList(),
                onChanged: (value) {
                  if (value == null || value == _pageSize || _loading) return;
                  setState(() {
                    _pageSize = value;
                    final newTotal = _totalCount == null
                        ? 1
                        : ((_totalCount! + value - 1) ~/ value).clamp(
                            1,
                            999999,
                          );
                    if (_page > newTotal) _page = newTotal;
                  });
                  _load(page: _page);
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _orderStatusBadge({
    required String status,
    required Color secondaryTextColor,
  }) {
    final s = status.toLowerCase();
    final isOpen =
        s == 'open' || s == 'cooking' || s == 'ready' || s == 'served';
    final isPaid = s == 'paid';
    final bg = isOpen
        ? const Color(0xFFFFF3EE)
        : isPaid
        ? const Color(0xFFDCFCE7)
        : const Color(0xFFF2F3F5);
    final fg = isOpen
        ? const Color(0xFFFB6633)
        : isPaid
        ? const Color(0xFF16A34A)
        : secondaryTextColor;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        localizedOrderStatus(context, status),
        textAlign: TextAlign.center,
        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: fg),
      ),
    );
  }
}

class _TableMeta {
  final int number;
  final String hallName;
  const _TableMeta({required this.number, required this.hallName});
}

class _AdminOrderItem {
  final String id;
  final String tableId;
  final String waiterId;
  final String cashierId;
  final String status;
  final String orderType;
  final String totalAmount;
  final DateTime? createdAt;
  final int bilNumber;
  final int goodsCount;
  final String paymentMethod;

  const _AdminOrderItem({
    required this.id,
    required this.tableId,
    required this.waiterId,
    required this.cashierId,
    required this.status,
    required this.orderType,
    required this.totalAmount,
    required this.createdAt,
    required this.bilNumber,
    required this.goodsCount,
    required this.paymentMethod,
  });

  factory _AdminOrderItem.fromJson(Map<String, dynamic> json) {
    return _AdminOrderItem(
      id: (json['id'] ?? '').toString(),
      tableId: (json['table_id'] ?? '').toString(),
      waiterId: (json['waiter_id'] ?? '').toString(),
      cashierId: (json['cashier_id'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      orderType: (json['order_type'] ?? '').toString(),
      totalAmount: (json['total_amount'] ??
              json['grand_total'] ??
              json['total'] ??
              json['amount'] ??
              '0')
          .toString(),
      createdAt: DateTime.tryParse(
        (json['created_at'] ?? '').toString(),
      )?.toLocal(),
      bilNumber: (json['number'] as num?)?.toInt() ??
          (json['bill_number'] as num?)?.toInt() ?? 0,
      goodsCount: (json['goods_quantity'] as num?)?.toInt() ??
          (json['items_count'] as num?)?.toInt() ??
          (json['goods_count'] as num?)?.toInt() ??
          (json['items'] is List ? (json['items'] as List).length : null) ??
          0,
      paymentMethod:
          (json['payment_method'] ?? json['payment_type'] ?? '').toString().toLowerCase(),
    );
  }

  String get createdAtLabel {
    if (createdAt == null) return '-';
    final d = createdAt!;
    final day = d.day.toString().padLeft(2, '0');
    final month = d.month.toString().padLeft(2, '0');
    final hour = d.hour.toString().padLeft(2, '0');
    final minute = d.minute.toString().padLeft(2, '0');
    return '$day.$month $hour:$minute';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin archive helper widgets
// ─────────────────────────────────────────────────────────────────────────────

class _VerticalDivider extends StatelessWidget {
  const _VerticalDivider();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 20,
      margin: const EdgeInsets.symmetric(horizontal: 4),
      color: const Color(0xFFE2E8F0),
    );
  }
}

class _AdminFilterPill extends StatelessWidget {
  const _AdminFilterPill({
    required this.label,
    required this.isActive,
    required this.activeColor,
    required this.onTap,
  });

  final String label;
  final bool isActive;
  final Color activeColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 140),
        // POS-friendly tap zone (~44dp height including padding)
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isActive ? activeColor.withOpacity(0.10) : Colors.transparent,
          border: Border.all(
            color: isActive ? activeColor.withOpacity(0.4) : Colors.transparent,
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: PosTypography.bodyMd, // 15
            fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
            color: isActive ? activeColor : const Color(0xFF64748B),
            fontFamily: PosTypography.family,
          ),
        ),
      ),
    );
  }
}

class _AdminStatBlock extends StatelessWidget {
  const _AdminStatBlock({
    required this.label,
    required this.value,
    required this.unit,
    required this.color,
  });

  final String label;
  final String value;
  final String unit;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w400,
              color: Color(0xFF94A3B8),
              fontFamily: 'Inter',
            ),
          ),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: color,
                  fontFamily: 'Inter',
                  letterSpacing: -0.5,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
              const SizedBox(width: 4),
              Text(
                unit,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w400,
                  color: Color(0xFF94A3B8),
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

class _AdminStatDivider extends StatelessWidget {
  const _AdminStatDivider();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 44,
      margin: const EdgeInsets.symmetric(horizontal: 20),
      color: const Color(0xFFE2E8F0),
    );
  }
}

class _AdminThCell extends StatelessWidget {
  const _AdminThCell({required this.label, required this.flex});

  final String label;
  final int flex;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      flex: flex,
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: Color(0xFF94A3B8),
          letterSpacing: 0.4,
          fontFamily: 'Inter',
        ),
      ),
    );
  }
}

class _AdminOrderRow extends StatelessWidget {
  const _AdminOrderRow({
    required this.order,
    required this.tableNum,
    required this.hallName,
    required this.staffName,
    required this.statusBadge,
  });

  final _AdminOrderItem order;
  final int tableNum;
  final String hallName;
  final String staffName;
  final Widget statusBadge;

  @override
  Widget build(BuildContext context) {
    final pmIcon = switch (order.paymentMethod) {
      'cash' || 'naqd' => Icons.payments_outlined,
      'card' || 'karta' => Icons.credit_card_outlined,
      _ => Icons.help_outline_rounded,
    };
    final pmColor = switch (order.paymentMethod) {
      'cash' || 'naqd' => const Color(0xFF16A34A),
      'card' || 'karta' => const Color(0xFF2563EB),
      _ => const Color(0xFF94A3B8),
    };
    final orderTypeLabel = switch (order.orderType.toLowerCase()) {
      'dine_in' => 'Zalda',
      'takeaway' => 'Olib ketish',
      _ => order.orderType,
    };

    return Container(
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Row(
        children: [
          // № Zakaz
          Expanded(
            flex: 2,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  order.bilNumber > 0 ? '#${order.bilNumber}' : '—',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF0F172A),
                    fontFamily: 'Inter',
                    fontFeatures: [FontFeature.tabularFigures()],
                  ),
                ),
                if (staffName.isNotEmpty)
                  Text(
                    staffName,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF94A3B8),
                      fontFamily: 'Inter',
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),
          // Vaqt
          Expanded(
            flex: 2,
            child: Text(
              order.createdAtLabel,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF64748B),
                fontFamily: 'Inter',
                fontFeatures: [FontFeature.tabularFigures()],
              ),
            ),
          ),
          // Tur
          Expanded(
            flex: 1,
            child: Text(
              orderTypeLabel,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF64748B),
                fontFamily: 'Inter',
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          // Stol / Zal
          Expanded(
            flex: 3,
            child: tableNum > 0
                ? RichText(
                    text: TextSpan(
                      children: [
                        TextSpan(
                          text: 'Stol $tableNum',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF0F172A),
                            fontFamily: 'Inter',
                          ),
                        ),
                        if (hallName.isNotEmpty)
                          TextSpan(
                            text: ' · $hallName',
                            style: const TextStyle(
                              fontSize: 14,
                              color: Color(0xFF94A3B8),
                              fontFamily: 'Inter',
                            ),
                          ),
                      ],
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  )
                : const Text(
                    '—',
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFF94A3B8),
                      fontFamily: 'Inter',
                    ),
                  ),
          ),
          // Taomlar
          Expanded(
            flex: 2,
            child: Text(
              order.goodsCount > 0 ? '${order.goodsCount} ta' : '—',
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF64748B),
                fontFamily: 'Inter',
              ),
            ),
          ),
          // Summa
          Expanded(
            flex: 3,
            child: Builder(builder: (context) {
              final amt = int.tryParse(
                    order.totalAmount.replaceAll(RegExp(r'[^0-9]'), ''),
                  ) ??
                  0;
              return Text(
                amt > 0
                    ? '${AppFormatter.formatAmountWithSpaces(order.totalAmount)} so\'m'
                    : '—',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: amt > 0 ? FontWeight.w600 : FontWeight.w400,
                  color: amt > 0
                      ? const Color(0xFF0F172A)
                      : const Color(0xFF94A3B8),
                  fontFamily: 'Inter',
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              );
            }),
          ),
          // To'lov
          Expanded(
            flex: 1,
            child: Icon(pmIcon, size: 20, color: pmColor),
          ),
          // Holat
          Expanded(flex: 2, child: statusBadge),
          // Actions
          const Expanded(
            flex: 1,
            child: Icon(
              Icons.chevron_right_rounded,
              size: 20,
              color: Color(0xFFCBD5E1),
            ),
          ),
        ],
      ),
    );
  }
}
