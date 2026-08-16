import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/theme/tokens/theme_colors.dart';
import 'package:mary_ai_pos/features/view/main/data/models/open_order/open_order_model.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/main/main_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/waiter/widgets/order_status_badge.dart';

class BillCard extends StatefulWidget {
  final OpenOrderModel order;
  final bool isSelected;
  final VoidCallback onTap;

  const BillCard({
    super.key,
    required this.order,
    required this.isSelected,
    required this.onTap,
  });

  @override
  State<BillCard> createState() => _BillCardState();
}

class _BillCardState extends State<BillCard> {
  bool _hovered = false;

  String get _timeLabel {
    final t = widget.order.openedAt;
    if (t == null) return '';
    return DateFormat('HH:mm').format(t);
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isSelected = widget.isSelected;

    return BlocBuilder<MainCubit, MainState>(
      buildWhen: (p, c) => p.tables != c.tables || p.halls != c.halls,
      builder: (context, mainState) {
        final tableNum =
            widget.order.resolveTableNumber(mainState.tables);
        final hallName = widget.order.resolveHallName(
          mainState.halls,
          mainState.tables,
        );
        final orderLabel = tableNum > 0 ? 'P$tableNum' : 'Schyot';

        return _buildCard(
          context,
          colors,
          isSelected,
          orderLabel,
          hallName,
          tableNum,
        );
      },
    );
  }

  Widget _buildCard(
    BuildContext context,
    ThemeColors colors,
    bool isSelected,
    String orderLabel,
    String hallName,
    int tableNum,
  ) {

    Color bg;
    BoxBorder? border;
    if (isSelected) {
      bg = colors.buttonBrandSecondary;
      border = Border.all(color: colors.borderBrand, width: 2);
    } else if (_hovered) {
      bg = colors.bgSecondary;
      border = null;
    } else {
      bg = colors.bgDefault;
      border = null;
    }

    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(10),
            border: border,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      orderLabel,
                      style: TextStyle(
                        fontSize: 11,
                        color: colors.textSecondary,
                      ),
                    ),
                  ),
                  Text(
                    _timeLabel,
                    style: TextStyle(
                      fontSize: 11,
                      color: colors.textSecondary,
                    ),
                  ),
                ],
              ),
              if (widget.order.status != null &&
                  widget.order.status!.trim().isNotEmpty) ...[
                const SizedBox(height: 6),
                Align(
                  alignment: Alignment.centerLeft,
                  child: OrderStatusBadge.fromOrder(widget.order, colors),
                ),
              ],
              if (widget.order.name != null &&
                  widget.order.name!.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  widget.order.name!,
                  style: context.textStyles.semibold16.copyWith(
                    fontSize: 15,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              const SizedBox(height: 4),
              Text(
                hallName.isNotEmpty
                    ? '$hallName  •  Stol $tableNum'
                    : (tableNum > 0 ? 'Stol $tableNum' : 'Buyurtma'),
                style: TextStyle(
                  fontSize: 12,
                  color: colors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
