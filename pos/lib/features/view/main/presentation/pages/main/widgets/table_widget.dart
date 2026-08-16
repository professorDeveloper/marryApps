import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/orders/orders_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/time_based_table_badge.dart';

class TableWidget extends StatefulWidget {
  final CafeTableModel table;
  final VoidCallback? onTap;

  const TableWidget({super.key, required this.table, this.onTap});

  @override
  State<TableWidget> createState() => _TableWidgetState();
}

class _TableWidgetState extends State<TableWidget> {
  bool _hovered = false;

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
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              width: 160,
              height: 110,
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
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${widget.table.number}-stol',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: colors.textDefault,
                          fontFamily: 'Inter',
                        ),
                      ),
                      if (hasSaved)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: colors.textBrand.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
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
                  const Spacer(),
                  if (widget.table.tableType == 'time_based')
                    TimeBasedTableBadge(table: widget.table)
                  else
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
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
                              '${widget.table.capacity}',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: colors.textTertiary,
                                fontFamily: 'Inter',
                              ),
                            ),
                          ],
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
