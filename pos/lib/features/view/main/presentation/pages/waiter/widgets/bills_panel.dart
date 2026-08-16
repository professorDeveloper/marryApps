import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/detail/detail_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/waiter/waiter_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/waiter/widgets/bill_card.dart';

class BillsPanel extends StatelessWidget {
  const BillsPanel({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      decoration: BoxDecoration(
        color: colors.bgDefault,
        border: Border(right: BorderSide(color: colors.border)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _Header(),
          Divider(height: 1, color: colors.border),
          const Expanded(child: _BillList()),
        ],
      ),
    );
  }
}

class _Header extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Mening Schyotlarim',
            style: context.textStyles.bold14,
          ),
          const SizedBox(height: 10),
          GestureDetector(
            onTap: () => context.read<WaiterCubit>().showCreateForm(),
            child: Container(
              height: 40,
              decoration: BoxDecoration(
                color: colors.textBrand,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.add, size: 18, color: colors.textOnBrand),
                  const SizedBox(width: 6),
                  Text(
                    'Yangi Schyot',
                    style: context.textStyles.semibold14.copyWith(
                      color: colors.textOnBrand,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BillList extends StatelessWidget {
  const _BillList();

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return BlocBuilder<WaiterCubit, WaiterState>(
      builder: (context, state) {
        if (state.isLoadingOrders) {
          return const Center(child: CircularProgressIndicator.adaptive());
        }

        if (state.openOrders.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.receipt_long_outlined,
                  size: 40,
                  color: colors.emptyValueColor,
                ),
                const SizedBox(height: 8),
                Text(
                  'Schyotlar yo\'q',
                  style: TextStyle(
                    fontSize: 13,
                    color: colors.textSecondary,
                  ),
                ),
              ],
            ),
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.all(8),
          itemCount: state.openOrders.length,
          separatorBuilder: (_, _) => const SizedBox(height: 4),
          itemBuilder: (context, index) {
            final order = state.openOrders[index];
            return BillCard(
              order: order,
              isSelected: order.id == state.selectedOrderId,
              onTap: () {
                context
                    .read<DetailBloc>()
                    .add(const DetailEvent.clearGoods());
                context.read<WaiterCubit>().selectOrder(order.id);
              },
            );
          },
        );
      },
    );
  }
}
