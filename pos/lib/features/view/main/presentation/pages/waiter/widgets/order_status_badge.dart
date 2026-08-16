import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/theme/tokens/theme_colors.dart';
import 'package:mary_ai_pos/features/view/main/data/models/open_order/open_order_model.dart';

/// Buyurtma `status` badge (ro‘yxat va detal sarlavha).
class OrderStatusBadge extends StatelessWidget {
  final String label;
  final String normalized;
  final ThemeColors colors;

  const OrderStatusBadge({
    super.key,
    required this.label,
    required this.normalized,
    required this.colors,
  });

  factory OrderStatusBadge.fromOrder(OpenOrderModel order, ThemeColors colors) {
    return OrderStatusBadge(
      label: order.statusDisplayLabel,
      normalized: order.statusKeyNormalized,
      colors: colors,
    );
  }

  Color get _fg {
    switch (normalized) {
      case 'open':
        return colors.systemInfo;
      case 'cooking':
      case 'preparing':
      case 'rescheduled':
        return colors.extraOrange;
      case 'ready':
      case 'paid':
        return colors.systemSuccess;
      case 'served':
        return colors.textBrand;
      case 'cancelled':
        return colors.systemError;
      case 'reserved':
        return colors.extraPurple;
      default:
        return colors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final fg = _fg;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: fg.withOpacity(0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: fg.withOpacity(0.35)),
      ),
      child: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: fg,
          fontFamily: 'Inter',
        ),
      ),
    );
  }
}
