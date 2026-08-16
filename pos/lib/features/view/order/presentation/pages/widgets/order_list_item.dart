import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/features/view/order/data/models/order_models.dart';
import 'package:mary_ai_pos/features/view/order/presentation/cubit/order_cubit.dart';

class OrderListItem extends StatelessWidget {
  final OrderItem item;

  const OrderListItem({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: context.colors.bgSecondary,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          // Quantity Controls
          Row(
            children: [
              _CircleButton(
                icon: Icons.remove,
                onTap: () {
                  context.read<OrderCubit>().updateQuantity(item, -1);
                },
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Text(
                  '${item.quantity}',
                  style: context.textStyles.bodyMd.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              _CircleButton(
                icon: Icons.add,
                onTap: () {
                  context.read<OrderCubit>().updateQuantity(item, 1);
                },
              ),
            ],
          ),
          const SizedBox(width: 12),
          // Item Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.product.name,
                  style: context.textStyles.bodyMd.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (item.modifiers.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      item.modifiers.join(', '),
                      style: context.textStyles.bodySm.copyWith(
                        color: Colors.grey,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          // Price
          Text(
            (item.total).toStringAsFixed(0), // Currency formatting needed later
            style: context.textStyles.bodyMd.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class _CircleButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _CircleButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.withOpacity(0.2)),
        ),
        child: Icon(icon, size: 16, color: context.colors.iconDefault),
      ),
    );
  }
}
