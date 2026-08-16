import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/hall/hall_model.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/time_based_table_badge.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

/// Admin floor plan canvas — view + edit mode.
/// Edit modeda stollarni drag qilish mumkin.
class AdminFloorPlanCanvas extends StatefulWidget {
  final List<CafeTableModel> tables;
  final HallModel? hall;
  final bool isEditMode;
  final String? selectedTableId;

  /// View mode: stol bosilganda
  final void Function(CafeTableModel table)? onTableTap;

  /// Edit mode: stol tanlanganda
  final void Function(CafeTableModel table)? onTableSelected;

  /// Edit mode: drag tugaganda yangi pozitsiya
  final void Function(String tableId, double newPosX, double newPosY)?
  onTableMoved;

  /// Saqlangan buyurtmasi bor stol ID'lari (badge ko'rsatish uchun)
  final Set<String>? savedTableIds;

  const AdminFloorPlanCanvas({
    super.key,
    required this.tables,
    this.hall,
    this.isEditMode = false,
    this.selectedTableId,
    this.onTableTap,
    this.onTableSelected,
    this.onTableMoved,
    this.savedTableIds,
  });

  @override
  State<AdminFloorPlanCanvas> createState() => _AdminFloorPlanCanvasState();
}

class _AdminFloorPlanCanvasState extends State<AdminFloorPlanCanvas> {
  // Scroll controllers — POS touchscreen uchun visible scrollbars
  final _vController = ScrollController();
  final _hController = ScrollController();

  // User-controlled zoom (1.0 = fit-to-screen)
  double _zoomScale = 1.0;

  // Edit mode: local position overrides (before save)
  final Map<String, Offset> _localPositions = {};

  @override
  void didUpdateWidget(AdminFloorPlanCanvas old) {
    super.didUpdateWidget(old);
    // If tables changed (e.g. after save), reset local overrides
    if (old.tables != widget.tables) {
      _localPositions.clear();
    }
  }

  @override
  void dispose() {
    _vController.dispose();
    _hController.dispose();
    super.dispose();
  }

  void _zoomIn() {
    setState(() {
      _zoomScale = (_zoomScale * 1.2).clamp(0.5, 3.0);
    });
  }

  void _zoomOut() {
    setState(() {
      _zoomScale = (_zoomScale / 1.2).clamp(0.5, 3.0);
    });
  }

  void _resetView() {
    setState(() {
      _zoomScale = 1.0;
    });
    if (_vController.hasClients) _vController.jumpTo(0);
    if (_hController.hasClients) _hController.jumpTo(0);
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    if (widget.tables.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.table_restaurant_outlined,
              size: 52,
              color: colors.border,
            ),
            const SizedBox(height: 10),
            Text(
              'Stollar mavjud emas',
              style: TextStyle(
                fontSize: 14,
                color: colors.textTertiary,
                fontFamily: 'Inter',
              ),
            ),
          ],
        ),
      );
    }

    final stats = _computeStats();

    return Column(
      children: [
        _CanvasToolbar(
          hallName: widget.hall?.name ?? '',
          total: widget.tables.length,
          free: stats.free,
          busy: stats.busy,
          away: stats.away,
          isEditMode: widget.isEditMode,
          onZoomIn: _zoomIn,
          onZoomOut: _zoomOut,
          onReset: _resetView,
        ),
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [colors.bgDefault, colors.bgSecondary.withOpacity(0.5)],
              ),
            ),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final hallW = (widget.hall?.width ?? 1000.0).clamp(
                  1.0,
                  double.infinity,
                );
                final hallH = (widget.hall?.height ?? 800.0).clamp(
                  1.0,
                  double.infinity,
                );

                // Fit hall into viewport
                const padding = 24.0;
                final scaleX = (constraints.maxWidth - padding * 2) / hallW;
                final scaleY = (constraints.maxHeight - padding * 2) / hallH;
                final fitScale = math.min(scaleX, scaleY);
                final scale = fitScale * _zoomScale;

                final canvasW = hallW * scale;
                final canvasH = hallH * scale;

                // Inner content size (includes padding around hall)
                final innerW = math.max(
                  canvasW + padding * 2,
                  constraints.maxWidth,
                );
                final innerH = math.max(
                  canvasH + padding * 2,
                  constraints.maxHeight,
                );

                return Scrollbar(
                  controller: _vController,
                  thumbVisibility: true,
                  thickness: 12,
                  radius: const Radius.circular(6),
                  child: SingleChildScrollView(
                    controller: _vController,
                    // Edit modeda touch pan tablega beriladi,
                    // scroll faqat thumb orqali ishlaydi.
                    physics: widget.isEditMode
                        ? const NeverScrollableScrollPhysics()
                        : const ClampingScrollPhysics(),
                    child: Scrollbar(
                      controller: _hController,
                      thumbVisibility: true,
                      thickness: 12,
                      radius: const Radius.circular(6),
                      child: SingleChildScrollView(
                        controller: _hController,
                        scrollDirection: Axis.horizontal,
                        physics: widget.isEditMode
                            ? const NeverScrollableScrollPhysics()
                            : const ClampingScrollPhysics(),
                        child: SizedBox(
                          width: innerW,
                          height: innerH,
                          child: Center(
                            child: Container(
                              width: canvasW,
                              height: canvasH,
                              decoration: BoxDecoration(
                                color: colors.bgSecondary,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: widget.isEditMode
                                      ? const Color(0xFF3B82F6)
                                      : colors.textDefault.withOpacity(0.35),
                                  width: widget.isEditMode ? 3.0 : 2.5,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: widget.isEditMode
                                        ? const Color(
                                            0xFF3B82F6,
                                          ).withOpacity(0.15)
                                        : Colors.black.withOpacity(0.06),
                                    blurRadius: widget.isEditMode ? 16 : 8,
                                    spreadRadius: widget.isEditMode ? 2 : 0,
                                  ),
                                ],
                              ),
                              clipBehavior: Clip.none,
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Stack(
                                  clipBehavior: Clip.none,
                                  children: [
                                    Positioned.fill(
                                      child: CustomPaint(
                                        painter: _DotGridPainter(colors.border),
                                      ),
                                    ),
                                    ...widget.tables.map(
                                      (table) => _buildPositionedTable(
                                        context,
                                        table,
                                        scale,
                                        colors,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPositionedTable(
    BuildContext context,
    CafeTableModel table,
    double scale,
    dynamic colors,
  ) {
    // Local position override mavjud bo'lsa uni ishlatamiz
    final localPos = _localPositions[table.id];
    final tx = localPos?.dx ?? table.posX * scale;
    final ty = localPos?.dy ?? table.posY * scale;

    final tw = math.max(table.width * scale, 36.0);
    final th = math.max(table.height * scale, 36.0);
    final baseSize = math.min(tw, th);
    final chairPad = (baseSize * 0.20).clamp(8.0, 28.0);

    final isSelected = widget.selectedTableId == table.id;

    return Positioned(
      left: tx - chairPad,
      top: ty - chairPad,
      child: Transform.rotate(
        angle: table.rotation * math.pi / 180,
        child: GestureDetector(
          // Edit mode: drag
          onPanUpdate: widget.isEditMode
              ? (details) {
                  setState(() {
                    final cur =
                        _localPositions[table.id] ??
                        Offset(table.posX * scale, table.posY * scale);
                    final proposed = cur + details.delta;
                    _localPositions[table.id] = _resolveNoOverlap(
                      table: table,
                      current: cur,
                      proposed: proposed,
                      scale: scale,
                    );
                  });
                }
              : null,
          onPanEnd: widget.isEditMode
              ? (details) {
                  final pos = _localPositions[table.id];
                  if (pos != null) {
                    final newPosX = pos.dx / scale;
                    final newPosY = pos.dy / scale;
                    widget.onTableMoved?.call(table.id, newPosX, newPosY);
                  }
                }
              : null,
          // Edit mode: select; View mode: tap
          onTap: widget.isEditMode
              ? () => widget.onTableSelected?.call(table)
              : () => widget.onTableTap?.call(table),
          child: _AdminTableItem(
            table: table,
            tableWidth: tw,
            tableHeight: th,
            chairPad: chairPad,
            isSelected: isSelected,
            isEditMode: widget.isEditMode,
            isSaved: widget.savedTableIds?.contains(table.id) ?? false,
          ),
        ),
      ),
    );
  }

  /// Drag ostidagi stol boshqa stol ustiga tushmasligi uchun.
  /// Proposed pozitsiya kirib kelganda:
  ///   1. Canvas chegarasiga clamp qilamiz.
  ///   2. Boshqa stollar bilan to'qnashmasa — qabul qilamiz.
  ///   3. To'qnashsa, avval faqat X bo'yicha, keyin faqat Y bo'yicha slide qilishga urinamiz.
  ///   4. Bo'lmasa — current pozitsiyani saqlaymiz (stop against wall).
  Offset _resolveNoOverlap({
    required CafeTableModel table,
    required Offset current,
    required Offset proposed,
    required double scale,
  }) {
    final hallW = (widget.hall?.width ?? 1000) * scale;
    final hallH = (widget.hall?.height ?? 800) * scale;
    final tw = math.max(table.width * scale, 36.0);
    final th = math.max(table.height * scale, 36.0);

    double clampX(double x) => x.clamp(0.0, math.max(0.0, hallW - tw));
    double clampY(double y) => y.clamp(0.0, math.max(0.0, hallH - th));

    // Minimum bo'sh joy — stollar orasidagi kafolatlangan masofa.
    // 40 px hall coords = 0.4 m (odam o'tishiga yetadi).
    const minGapHallPx = 40.0;
    final gap = minGapHallPx * scale;

    bool collides(double x, double y) {
      for (final other in widget.tables) {
        if (other.id == table.id) continue;
        final local = _localPositions[other.id];
        final ox = local?.dx ?? other.posX * scale;
        final oy = local?.dy ?? other.posY * scale;
        final ow = math.max(other.width * scale, 36.0);
        final oh = math.max(other.height * scale, 36.0);
        if (x < ox + ow + gap &&
            x + tw + gap > ox &&
            y < oy + oh + gap &&
            y + th + gap > oy) {
          return true;
        }
      }
      return false;
    }

    final px = clampX(proposed.dx);
    final py = clampY(proposed.dy);
    if (!collides(px, py)) return Offset(px, py);

    final slideX = clampX(proposed.dx);
    if (!collides(slideX, current.dy)) return Offset(slideX, current.dy);

    final slideY = clampY(proposed.dy);
    if (!collides(current.dx, slideY)) return Offset(current.dx, slideY);

    return current;
  }

  _TableStats _computeStats() {
    int free = 0, busy = 0, away = 0;
    for (final t in widget.tables) {
      switch (t.status) {
        case TableStatus.busy:
          busy++;
        case TableStatus.away:
          away++;
        default:
          free++;
      }
    }
    return _TableStats(free: free, busy: busy, away: away);
  }
}

class _TableStats {
  final int free;
  final int busy;
  final int away;
  const _TableStats({
    required this.free,
    required this.busy,
    required this.away,
  });
}

// ─────────────────────────────────────────────
// Canvas toolbar — hall info + stats + zoom
// ─────────────────────────────────────────────

class _CanvasToolbar extends StatelessWidget {
  final String hallName;
  final int total;
  final int free;
  final int busy;
  final int away;
  final bool isEditMode;
  final VoidCallback onZoomIn;
  final VoidCallback onZoomOut;
  final VoidCallback onReset;

  const _CanvasToolbar({
    required this.hallName,
    required this.total,
    required this.free,
    required this.busy,
    required this.away,
    required this.isEditMode,
    required this.onZoomIn,
    required this.onZoomOut,
    required this.onReset,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 10),
      decoration: BoxDecoration(
        color: c.bgDefault,
        border: Border(bottom: BorderSide(color: c.border, width: 0.5)),
      ),
      child: Row(
        children: [
          // Hall name + table count
          if (hallName.isNotEmpty) ...[
            Icon(Icons.location_on_outlined, size: 15, color: c.textSecondary),
            const SizedBox(width: 5),
            Text(
              hallName,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: c.textDefault,
                fontFamily: 'Inter',
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                color: c.bgSecondary,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                S.current.strNPeopleTable(total),
                style: TextStyle(
                  fontSize: 11,
                  color: c.textSecondary,
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const SizedBox(width: 18),
            Container(width: 1, height: 18, color: c.border),
            const SizedBox(width: 18),
          ],
          // Status chips
          _StatChip(
            color: const Color(0xFF22C55E),
            label: S.current.strFree,
            count: free,
          ),
          const SizedBox(width: 8),
          _StatChip(
            color: const Color(0xFFFB6633),
            label: S.current.strBusy,
            count: busy,
          ),
          const SizedBox(width: 8),
          _StatChip(
            color: const Color(0xFF3B82F6),
            label: S.current.strReserved,
            count: away,
          ),
          const Spacer(),
          // Edit mode hint
          if (isEditMode) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: const Color(0xFF3B82F6).withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: const Color(0xFF3B82F6).withOpacity(0.3),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.drag_indicator,
                    size: 13,
                    color: Color(0xFF3B82F6),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    S.current.strDragHint,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF3B82F6),
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
          ],
          // Zoom controls
          _ZoomGroup(
            onZoomIn: onZoomIn,
            onZoomOut: onZoomOut,
            onReset: onReset,
          ),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final Color color;
  final String label;
  final int count;
  const _StatChip({
    required this.color,
    required this.label,
    required this.count,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: c.textSecondary,
              fontFamily: 'Inter',
            ),
          ),
          const SizedBox(width: 4),
          Text(
            '$count',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: color,
              fontFamily: 'Inter',
            ),
          ),
        ],
      ),
    );
  }
}

class _ZoomGroup extends StatelessWidget {
  final VoidCallback onZoomIn;
  final VoidCallback onZoomOut;
  final VoidCallback onReset;
  const _ZoomGroup({
    required this.onZoomIn,
    required this.onZoomOut,
    required this.onReset,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      decoration: BoxDecoration(
        color: c.bgSecondary,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: c.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _ZoomBtn(
            icon: Icons.remove,
            tooltip: S.current.strShrink,
            onTap: onZoomOut,
          ),
          Container(width: 1, height: 18, color: c.border),
          _ZoomBtn(
            icon: Icons.center_focus_strong_outlined,
            tooltip: S.current.strRecenter,
            onTap: onReset,
          ),
          Container(width: 1, height: 18, color: c.border),
          _ZoomBtn(
            icon: Icons.add,
            tooltip: S.current.strEnlarge,
            onTap: onZoomIn,
          ),
        ],
      ),
    );
  }
}

class _ZoomBtn extends StatefulWidget {
  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;
  const _ZoomBtn({
    required this.icon,
    required this.tooltip,
    required this.onTap,
  });

  @override
  State<_ZoomBtn> createState() => _ZoomBtnState();
}

class _ZoomBtnState extends State<_ZoomBtn> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Tooltip(
      message: widget.tooltip,
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        onEnter: (_) => setState(() => _hovered = true),
        onExit: (_) => setState(() => _hovered = false),
        child: GestureDetector(
          onTap: widget.onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 120),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
            color: _hovered
                ? const Color(0xFF3B82F6).withOpacity(0.08)
                : Colors.transparent,
            child: Icon(
              widget.icon,
              size: 15,
              color: _hovered ? const Color(0xFF3B82F6) : c.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Single table item — body + chairs
// ─────────────────────────────────────────────

class _AdminTableItem extends StatefulWidget {
  final CafeTableModel table;
  final double tableWidth;
  final double tableHeight;
  final double chairPad;
  final bool isSelected;
  final bool isEditMode;
  final bool isSaved;

  const _AdminTableItem({
    required this.table,
    required this.tableWidth,
    required this.tableHeight,
    required this.chairPad,
    this.isSelected = false,
    this.isEditMode = false,
    this.isSaved = false,
  });

  @override
  State<_AdminTableItem> createState() => _AdminTableItemState();
}

class _AdminTableItemState extends State<_AdminTableItem> {
  bool _hovered = false;

  bool get _isRound {
    if (widget.tableWidth == 0 || widget.tableHeight == 0) return false;
    final ratio = widget.tableWidth / widget.tableHeight;
    return ratio >= 0.75 && ratio <= 1.33;
  }

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    Color borderColor;
    Color textColor;

    switch (widget.table.status) {
      case TableStatus.busy:
        bgColor = const Color(0xFFFFF3EE);
        borderColor = const Color(0xFFFB6633);
        textColor = const Color(0xFFFB6633);
      case TableStatus.away:
        bgColor = const Color(0xFFFFF3EE);
        borderColor = const Color(0xFF3B82F6);
        textColor = const Color(0xFF3B82F6);
      default:
        bgColor = const Color(0xFFECFDF3);
        borderColor = const Color(0xFF22C55E);
        textColor = const Color(0xFF15803D);
    }

    // Selected in edit mode — ko'k highlight
    if (widget.isSelected) {
      borderColor = const Color(0xFF3B82F6);
      bgColor = const Color(0xFFFFF3EE);
      textColor = const Color(0xFF3B82F6);
    } else if (_hovered) {
      bgColor = bgColor.withOpacity(0.75);
    }

    final chairColor = borderColor.withOpacity(0.55);
    final tw = widget.tableWidth;
    final th = widget.tableHeight;
    final pad = widget.chairPad;
    final totalW = tw + pad * 2;
    final totalH = th + pad * 2;
    final fontSize = math.min(tw, th) * 0.32;

    return MouseRegion(
      cursor: widget.isEditMode
          ? SystemMouseCursors.move
          : SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: SizedBox(
        width: totalW,
        height: totalH,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            // Chairs
            ..._buildChairs(
              chairColor: chairColor,
              totalW: totalW,
              totalH: totalH,
            ),
            // Table body
            Positioned(
              left: pad,
              top: pad,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 120),
                    width: tw,
                    height: th,
                    decoration: BoxDecoration(
                      color: bgColor,
                      borderRadius: _isRound
                          ? BorderRadius.circular(tw / 2)
                          : BorderRadius.circular(math.min(tw, th) * 0.18),
                      border: Border.all(
                        color: borderColor,
                        width: widget.isSelected ? 2.5 : 1.5,
                      ),
                      boxShadow: (widget.isSelected || _hovered)
                          ? [
                              BoxShadow(
                                color: borderColor.withOpacity(0.25),
                                blurRadius: 10,
                                offset: const Offset(0, 3),
                              ),
                            ]
                          : null,
                    ),
                    alignment: Alignment.center,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '${widget.table.number}',
                          style: TextStyle(
                            fontSize: fontSize.clamp(9.0, 18.0),
                            fontWeight: FontWeight.w700,
                            color: textColor,
                            fontFamily: 'Inter',
                          ),
                        ),
                        if (widget.isEditMode && tw > 40)
                          Icon(
                            Icons.open_with,
                            size: (fontSize * 0.7).clamp(8.0, 14.0),
                            color: textColor.withOpacity(0.5),
                          ),
                      ],
                    ),
                  ),
                  // Time-based badge — top-left timer
                  if (widget.table.tableType == 'time_based')
                    Positioned(
                      top: -6,
                      left: -6,
                      child: TimeBasedTableBadge(
                        table: widget.table,
                        compact: true,
                      ),
                    ),
                  // Saved order badge — top-right orange dot
                  if (widget.isSaved)
                    Positioned(
                      top: -4,
                      right: -4,
                      child: Container(
                        width: 10,
                        height: 10,
                        decoration: const BoxDecoration(
                          color: Color(0xFFFB6633),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildChairs({
    required Color chairColor,
    required double totalW,
    required double totalH,
  }) {
    final capacity = widget.table.capacity.clamp(0, 20);
    if (capacity == 0) return const [];
    if (_isRound) {
      return _roundChairs(chairColor, capacity, totalW, totalH);
    } else {
      return _rectChairs(chairColor, capacity, totalW, totalH);
    }
  }

  List<Widget> _roundChairs(
    Color color,
    int count,
    double totalW,
    double totalH,
  ) {
    final cs = (math.min(widget.tableWidth, widget.tableHeight) * 0.10).clamp(
      5.0,
      18.0,
    );
    final cx = totalW / 2;
    final cy = totalH / 2;
    final radius =
        (math.min(widget.tableWidth, widget.tableHeight) / 2) +
        widget.chairPad * 0.55;

    return List.generate(count, (i) {
      final angle = (2 * math.pi * i / count) - math.pi / 2;
      final x = cx + radius * math.cos(angle) - cs / 2;
      final y = cy + radius * math.sin(angle) - cs / 2;
      return Positioned(
        left: x,
        top: y,
        child: Container(
          width: cs,
          height: cs,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
      );
    });
  }

  List<Widget> _rectChairs(
    Color color,
    int count,
    double totalW,
    double totalH,
  ) {
    final cs = (math.min(widget.tableWidth, widget.tableHeight) * 0.10).clamp(
      5.0,
      16.0,
    );
    final cr = cs * 0.3;
    final tw = widget.tableWidth;
    final th = widget.tableHeight;
    final pad = widget.chairPad;

    final topCount = (count / 2).ceil();
    final bottomCount = count ~/ 2;

    final chairs = <Widget>[];

    for (int i = 0; i < topCount; i++) {
      final spacing = tw / topCount;
      final x = pad + spacing * (i + 0.5) - cs / 2;
      chairs.add(
        Positioned(
          left: x,
          top: pad - cs - 3,
          child: Container(
            width: cs,
            height: cs,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(cr),
            ),
          ),
        ),
      );
    }

    for (int i = 0; i < bottomCount; i++) {
      final spacing = tw / (bottomCount == 0 ? 1 : bottomCount);
      final x = pad + spacing * (i + 0.5) - cs / 2;
      chairs.add(
        Positioned(
          left: x,
          top: pad + th + 3,
          child: Container(
            width: cs,
            height: cs,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(cr),
            ),
          ),
        ),
      );
    }

    return chairs;
  }
}

// ─────────────────────────────────────────────
// Dotted grid background painter
// ─────────────────────────────────────────────

class _DotGridPainter extends CustomPainter {
  final Color borderColor;
  const _DotGridPainter(this.borderColor);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = borderColor.withOpacity(0.45)
      ..strokeWidth = 0;

    const step = 36.0;
    const radius = 1.2;

    for (double x = step; x < size.width; x += step) {
      for (double y = step; y < size.height; y += step) {
        canvas.drawCircle(Offset(x, y), radius, paint);
      }
    }
  }

  @override
  bool shouldRepaint(_DotGridPainter old) => old.borderColor != borderColor;
}
