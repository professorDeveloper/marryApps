import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/orders/orders_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/time_based_table_badge.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

class EnhancedTableCard extends StatefulWidget {
  final CafeTableModel table;
  final VoidCallback? onTap;
  final int? waitingTimeMinutes;
  final bool showAlert;
  final VoidCallback? onKitchenNotify;
  final VoidCallback? onAddNotes;
  final VoidCallback? onSplitBill;

  const EnhancedTableCard({
    super.key,
    required this.table,
    this.onTap,
    this.waitingTimeMinutes,
    this.showAlert = false,
    this.onKitchenNotify,
    this.onAddNotes,
    this.onSplitBill,
  });

  @override
  State<EnhancedTableCard> createState() => _EnhancedTableCardState();
}

class _EnhancedTableCardState extends State<EnhancedTableCard> {
  bool _hovered = false;
  late RelativeRect _tapPosition;

  void _showContextMenu(Offset offset) {
    _tapPosition = RelativeRect.fromLTRB(
      offset.dx,
      offset.dy,
      offset.dx + 100,
      offset.dy + 100,
    );

    showMenu(
      context: context,
      position: _tapPosition,
      items: [
        PopupMenuItem(
          child: Row(
            spacing: 8,
            children: [
              const Icon(Icons.edit, size: 16),
              Text(S.current.strAddOrder),
            ],
          ),
        ),
        PopupMenuItem(
          child: Row(
            spacing: 8,
            children: [
              const Icon(Icons.notifications, size: 16),
              Text(S.current.strNotifyKitchen),
            ],
          ),
        ),
        PopupMenuItem(
          child: Row(
            spacing: 8,
            children: [
              const Icon(Icons.warning, size: 16),
              Text(S.current.strNeedAttention),
            ],
          ),
        ),
        PopupMenuItem(
          child: Row(
            spacing: 8,
            children: [
              const Icon(Icons.receipt, size: 16),
              Text(S.current.strGoToPayment),
            ],
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final status = widget.table.status;

    Color borderColor;
    Color bgColor;
    Color statusTextColor;
    String statusLabel;

    switch (status) {
      case TableStatus.busy:
        borderColor = colors.textBrand;
        bgColor = const Color(0xFFFFF3EE);
        statusTextColor = colors.textBrand;
        statusLabel = "Band";
        break;
      case TableStatus.free:
        borderColor = colors.border;
        bgColor = colors.bgDefault;
        statusTextColor = colors.systemSuccess;
        statusLabel = "Bo'sh";
        break;
      default:
        borderColor = colors.systemInfo;
        bgColor = const Color(0xFFFFF3EE);
        statusTextColor = colors.systemInfo;
        statusLabel = "Bron";
    }

    return BlocBuilder<SavedOrdersBloc, SavedOrdersState>(
      builder: (context, savedState) {
        final hasSaved = savedState.order.any(
          (v) => v.cafeTable.id == widget.table.id,
        );

        return MouseRegion(
          onEnter: (_) => setState(() => _hovered = true),
          onExit: (_) => setState(() => _hovered = false),
          cursor: SystemMouseCursors.click,
          child: GestureDetector(
            onTap: widget.onTap,
            onSecondaryTapDown: (details) =>
                _showContextMenu(details.globalPosition),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              width: 200,
              height: 150,
              decoration: BoxDecoration(
                color: _hovered ? bgColor.withOpacity(0.85) : bgColor,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: _hovered ? borderColor.withOpacity(0.7) : borderColor,
                  width: 2,
                ),
                boxShadow: _hovered
                    ? [
                        BoxShadow(
                          color: borderColor.withOpacity(0.15),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : null,
              ),
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header: Table number + Alert badge
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          '${widget.table.number}-stol',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: colors.textDefault,
                            fontFamily: 'Inter',
                          ),
                        ),
                      ),
                      if (widget.showAlert)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDC2626).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            '🚨',
                            style: TextStyle(fontSize: 10),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Status and Saved badge
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: statusTextColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          statusLabel,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: statusTextColor,
                            fontFamily: 'Inter',
                          ),
                        ),
                      ),
                      if (hasSaved)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: colors.textBrand.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'Saqlan.',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w600,
                              color: colors.textBrand,
                              fontFamily: 'Inter',
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Timer (time_based) yoki capacity
                  if (widget.table.tableType == 'time_based')
                    TimeBasedTableBadge(table: widget.table)
                  else
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      spacing: 3,
                      children: [
                        Icon(
                          Icons.people_outline,
                          size: 13,
                          color: colors.textTertiary,
                        ),
                        Text(
                          '${widget.table.capacity} kishi',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: colors.textTertiary,
                            fontFamily: 'Inter',
                          ),
                        ),
                      ],
                    ),
                  const Spacer(),

                  // Action buttons row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    spacing: 6,
                    children: [
                      // Kitchen notify button
                      Expanded(
                        child: GestureDetector(
                          onTap: widget.onKitchenNotify,
                          child: Container(
                            height: 32,
                            decoration: BoxDecoration(
                              color: const Color(0xFFFB6633).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Center(
                              child: Text('🔔', style: TextStyle(fontSize: 12)),
                            ),
                          ),
                        ),
                      ),
                      // Notes button
                      Expanded(
                        child: GestureDetector(
                          onTap: widget.onAddNotes,
                          child: Container(
                            height: 32,
                            decoration: BoxDecoration(
                              color: const Color(0xFF3B82F6).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Center(
                              child: Text('📝', style: TextStyle(fontSize: 12)),
                            ),
                          ),
                        ),
                      ),
                      // Split bill button
                      Expanded(
                        child: GestureDetector(
                          onTap: widget.onSplitBill,
                          child: Container(
                            height: 32,
                            decoration: BoxDecoration(
                              color: const Color(0xFF16A34A).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Center(
                              child: Text('💳', style: TextStyle(fontSize: 12)),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
