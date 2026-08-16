import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/utils/app_formatter.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/number_formatter.dart';
import 'package:mary_ai_pos/core/theme/tokens/theme_colors.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/bloc/user_bloc.dart';
import 'package:mary_ai_pos/features/view/main/data/models/open_order/open_order_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/order_line_item/order_line_item_model.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/detail/detail_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/main/main_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/waiter/waiter_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/waiter/widgets/create_bill_form.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/waiter/widgets/order_status_badge.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/waiter/widgets/table_timer_section.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

enum _OrderStatusTab { pending, cooking, ready, cancelled }

class BillDetailPanel extends StatefulWidget {
  const BillDetailPanel({super.key});

  @override
  State<BillDetailPanel> createState() => _BillDetailPanelState();
}

class _BillDetailPanelState extends State<BillDetailPanel> {
  _OrderStatusTab _activeTab = _OrderStatusTab.pending;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      decoration: BoxDecoration(
        color: colors.bgDefault,
        border: Border(left: BorderSide(color: colors.border)),
      ),
      child: BlocBuilder<WaiterCubit, WaiterState>(
        builder: (context, state) {
          return switch (state.panelMode) {
            WaiterPanelMode.none => const _EmptyPanel(),
            WaiterPanelMode.createForm => const CreateBillForm(),
            WaiterPanelMode.closeForm => const _CloseOrderGate(),
            WaiterPanelMode.billDetail => _BillDetailView(
                activeTab: _activeTab,
                onTabChanged: (t) => setState(() => _activeTab = t),
              ),
          };
        },
      ),
    );
  }
}

// ─── Empty ────────────────────────────────────────────────────────────────────

class _EmptyPanel extends StatelessWidget {
  const _EmptyPanel();

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.receipt_long_outlined,
              size: 48, color: colors.emptyValueColor),
          const SizedBox(height: 12),
          Text(
            'Выберите счёт или\nоткройте новый',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              color: colors.textSecondary,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Bill detail ──────────────────────────────────────────────────────────────

class _BillDetailView extends StatelessWidget {
  final _OrderStatusTab activeTab;
  final ValueChanged<_OrderStatusTab> onTabChanged;

  const _BillDetailView({
    required this.activeTab,
    required this.onTabChanged,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return BlocBuilder<WaiterCubit, WaiterState>(
      builder: (context, waiterState) {
        final order = waiterState.selectedOrder;
        if (order == null) return const _EmptyPanel();

        final readOnly = order.isTerminalOrderStatus;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _DetailHeader(order: order),
            _InfoGrid(order: order),
            const TableTimerSection(),
            Divider(height: 1, color: colors.border),
            _ActionRow(
              order: order,
              editMode: waiterState.orderItemsEditMode,
              readOnly: readOnly,
              onToggleEdit:
                  context.read<WaiterCubit>().toggleOrderItemsEditMode,
            ),
            Divider(height: 1, color: colors.border),
            if (!readOnly) ...[
              _StatusTabs(
                activeTab: activeTab,
                onTabChanged: onTabChanged,
              ),
              Divider(height: 1, color: colors.border),
            ],
            BlocBuilder<WaiterCubit, WaiterState>(
              buildWhen: (p, c) =>
                  p.selectedOrderId != c.selectedOrderId ||
                  p.orderLineItems != c.orderLineItems ||
                  p.isLoadingOrderItems != c.isLoadingOrderItems ||
                  p.orderItemsEditMode != c.orderItemsEditMode ||
                  p.cancellingOrderItemId != c.cancellingOrderItemId,
              builder: (context, waiterState) {
                return BlocBuilder<DetailBloc, DetailState>(
                  buildWhen: (p, c) => p.selectedGoods != c.selectedGoods,
                  builder: (context, detailState) {
                    final server = waiterState.orderLineItems;
                    final filteredServer =
                        _filterItemsByTab(server, activeTab);
                    final loading = waiterState.isLoadingOrderItems;
                    final editMode =
                        readOnly ? false : waiterState.orderItemsEditMode;
                    final cart = readOnly
                        ? <OrderItem>[]
                        : detailState.selectedGoods;
                    final showEmpty =
                        !loading && filteredServer.isEmpty && cart.isEmpty;

                    if (showEmpty && readOnly) {
                      return Expanded(
                        child: _TerminalOrderEmptyBody(order: order),
                      );
                    }
                    if (showEmpty) {
                      return const Expanded(child: _EmptyCart());
                    }

                    return Expanded(
                      child: ListView(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 8),
                        children: [
                          if (loading && filteredServer.isEmpty)
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 24),
                              child: Center(
                                child: CircularProgressIndicator.adaptive(),
                              ),
                            ),
                          if (editMode) ...[
                            Text(
                              'Menudan tanlang — yangilari «К отправке» ostida',
                              style: TextStyle(
                                fontSize: 11,
                                color: colors.textTertiary,
                                height: 1.35,
                              ),
                            ),
                            const SizedBox(height: 10),
                          ],
                          ...filteredServer.asMap().entries.map((e) {
                            final i = e.key;
                            final line = e.value;
                            return Column(
                              key: ValueKey('srv_${line.id}_$i'),
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                if (i > 0)
                                  Divider(height: 1, color: colors.border),
                                _ServerLineItemRow(
                                  item: line,
                                  editMode: editMode,
                                  isCancelling: waiterState
                                          .cancellingOrderItemId ==
                                      line.id,
                                  onCancel: editMode && line.canBeCancelled
                                      ? () => context
                                          .read<WaiterCubit>()
                                          .cancelOrderItem(
                                            orderItemId: line.id,
                                            orderId: order.id,
                                          )
                                      : null,
                                ),
                              ],
                            );
                          }),
                          if (cart.isNotEmpty) ...[
                            if (server.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              Text(
                                'К отправке',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: colors.textTertiary,
                                ),
                              ),
                              const SizedBox(height: 6),
                            ],
                            ...cart.asMap().entries.map((e) {
                              final i = e.key;
                              final it = e.value;
                              return Column(
                                key: ValueKey('cart_${it.uniqueId}_$i'),
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  if (i > 0 || server.isNotEmpty)
                                    Divider(height: 1, color: colors.border),
                                  _CartItemRow(item: it),
                                ],
                              );
                            }),
                          ],
                        ],
                      ),
                    );
                  },
                );
              },
            ),
            BlocBuilder<DetailBloc, DetailState>(
              buildWhen: (p, c) => p.selectedGoods != c.selectedGoods,
              builder: (context, detailState) {
                if (detailState.selectedGoods.isEmpty) return const SizedBox();
                return _SendFooter(
                  orderId: order.id,
                  items: detailState.selectedGoods,
                );
              },
            ),
          ],
        );
      },
    );
  }
}

List<OrderLineItemModel> _filterItemsByTab(
  List<OrderLineItemModel> items,
  _OrderStatusTab tab,
) {
  bool match(OrderLineItemModel it) {
    final s = (it.status ?? '').trim().toLowerCase();
    switch (tab) {
      case _OrderStatusTab.pending:
        return s == 'pending';
      case _OrderStatusTab.cooking:
        return s == 'cooking';
      case _OrderStatusTab.ready:
        return s == 'ready';
      case _OrderStatusTab.cancelled:
        return s == 'cancelled';
    }
  }

  final out = items.where(match).toList();
  // Agar statuslar hali backenddan kelmasa, UX uchun hammasini pending’da ko‘rsatamiz.
  if (out.isEmpty && tab == _OrderStatusTab.pending) return items;
  return out;
}

class _DetailHeader extends StatelessWidget {
  final OpenOrderModel order;
  const _DetailHeader({required this.order});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return BlocBuilder<MainCubit, MainState>(
      buildWhen: (p, c) => p.tables != c.tables || p.halls != c.halls,
      builder: (context, mainState) {
        final t = order.resolveTableNumber(mainState.tables);
        final title = t > 0 ? 'Счет P$t' : 'Счет';
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 12, 10),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: context.textStyles.semibold16.copyWith(fontSize: 15),
                ),
              ),
              OrderStatusBadge.fromOrder(order, colors),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: () => context.read<WaiterCubit>().closePanel(),
                child: Icon(
                  Icons.keyboard_arrow_up_rounded,
                  size: 22,
                  color: colors.textTertiary,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

String _formatServicePercent(OpenOrderModel order) {
  final p = order.servicePercent;
  if (p == null || p <= 0) return '0%';
  if (p == p.roundToDouble()) return '${p.round()}%';
  return '$p%';
}

class _InfoGrid extends StatelessWidget {
  final OpenOrderModel order;
  const _InfoGrid({required this.order});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<MainCubit, MainState>(
      buildWhen: (p, c) => p.tables != c.tables || p.halls != c.halls,
      builder: (context, mainState) {
        final hall = order.resolveHallName(mainState.halls, mainState.tables);
        final table = order.resolveTableNumber(mainState.tables);
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const _InfoRow('Официант', '—'),
                    const _InfoRow('Клиент', '—'),
                    _InfoRow('Гости', '${order.guestCount}'),
                    const _InfoRow('Скидка', '0 сум'),
                    _InfoRow(
                      S.current.strAmountColumnHeader,
                      order.totalAmountValue > 0
                          ? order.totalAmountValue.formatN
                          : '—',
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _InfoRow('Зал', hall.isEmpty ? '—' : hall),
                    _InfoRow('Стол', table > 0 ? '$table' : '—'),
                    const _InfoRow('Позиция', '—'),
                    _InfoRow('Обслуживание', _formatServicePercent(order)),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Padding(
      padding: const EdgeInsets.only(bottom: 3),
      child: Row(
        children: [
          Text(
            '$label  ',
            style: TextStyle(fontSize: 11, color: colors.textSecondary),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: colors.textDefault,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionRow extends StatelessWidget {
  final OpenOrderModel order;
  final bool editMode;
  /// To‘langan / bekor — faqat yangilash, «Закрыть» va tahrir yo‘q.
  final bool readOnly;
  final VoidCallback onToggleEdit;

  const _ActionRow({
    required this.order,
    required this.editMode,
    this.readOnly = false,
    required this.onToggleEdit,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: Row(
        children: [
          _IconAction(
            icon: Icons.refresh_rounded,
            onTap: () {
              final c = context.read<WaiterCubit>();
              c.loadOpenOrders();
              c.loadOrderItems(order.id);
            },
          ),
          if (!readOnly) ...[
            const SizedBox(width: 6),
            _IconAction(
              icon: editMode ? Icons.check_rounded : Icons.edit_outlined,
              highlighted: editMode,
              onTap: onToggleEdit,
            ),
          ],
          const Spacer(),
          BlocBuilder<UserBloc, UserState>(
            buildWhen: (p, c) => p.userMOdel?.role != c.userMOdel?.role,
            builder: (context, us) {
              if (readOnly || us.userMOdel?.role != UserRole.cashier) {
                return const SizedBox.shrink();
              }
              return GestureDetector(
                onTap: () => context.read<WaiterCubit>().showCloseForm(),
                child: Container(
                  height: 36,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(
                    color: colors.systemSuccess,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text(
                      'Закрыть',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: colors.textOnBrand,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _IconAction extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool highlighted;

  const _IconAction({
    required this.icon,
    required this.onTap,
    this.highlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: highlighted ? colors.buttonBrandSecondary : colors.bgSecondary,
          border: highlighted
              ? Border.all(color: colors.borderBrand)
              : null,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          icon,
          size: 18,
          color: highlighted ? colors.textBrand : colors.iconDefault,
        ),
      ),
    );
  }
}

class _StatusTabs extends StatelessWidget {
  final _OrderStatusTab activeTab;
  final ValueChanged<_OrderStatusTab> onTabChanged;

  const _StatusTabs({
    required this.activeTab,
    required this.onTabChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: SizedBox(
        height: 40,
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _TabBtn(
                label: S.current.strWaiting,
                isActive: activeTab == _OrderStatusTab.pending,
                onTap: () => onTabChanged(_OrderStatusTab.pending),
              ),
              const SizedBox(width: 6),
              _TabBtn(
                label: S.current.strCooking,
                isActive: activeTab == _OrderStatusTab.cooking,
                onTap: () => onTabChanged(_OrderStatusTab.cooking),
              ),
              const SizedBox(width: 6),
              _TabBtn(
                label: S.current.strReceived,
                isActive: activeTab == _OrderStatusTab.ready,
                onTap: () => onTabChanged(_OrderStatusTab.ready),
              ),
              const SizedBox(width: 6),
              _TabBtn(
                label: S.current.strCancelled,
                isActive: activeTab == _OrderStatusTab.cancelled,
                onTap: () => onTabChanged(_OrderStatusTab.cancelled),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TabBtn extends StatelessWidget {
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _TabBtn({
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isActive ? colors.buttonBrand : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isActive ? colors.buttonBrand : colors.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: isActive ? colors.textOnBrand : colors.textTertiary,
          ),
        ),
      ),
    );
  }
}

class _ServerLineItemRow extends StatelessWidget {
  final OrderLineItemModel item;
  final bool editMode;
  final bool isCancelling;
  final VoidCallback? onCancel;

  const _ServerLineItemRow({
    required this.item,
    required this.editMode,
    required this.isCancelling,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final unit = double.tryParse(item.price) ?? 0;
    final sum = unit * item.quantity;
    final cancelled = item.isCancelled;

    return Opacity(
      opacity: cancelled ? 0.55 : 1,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              item.statusLabel,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: cancelled ? colors.textTertiary : colors.textSecondary,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    item.displayName,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: colors.textDefault,
                      decoration:
                          cancelled ? TextDecoration.lineThrough : null,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (editMode && onCancel != null) ...[
                  const SizedBox(width: 6),
                  SizedBox(
                    width: 32,
                    height: 32,
                    child: isCancelling
                        ? const Center(
                            child: SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator.adaptive(
                                strokeWidth: 2,
                              ),
                            ),
                          )
                        : Material(
                            color: colors.bgSecondary,
                            borderRadius: BorderRadius.circular(8),
                            child: InkWell(
                              onTap: onCancel,
                              borderRadius: BorderRadius.circular(8),
                              child: Icon(
                                Icons.close_rounded,
                                size: 18,
                                color: colors.iconDefault,
                              ),
                            ),
                          ),
                  ),
                ],
                const SizedBox(width: 8),
                Text(
                  '×${item.quantity}',
                  style: context.textStyles.semibold14,
                ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              sum.formatN,
              style: TextStyle(fontSize: 12, color: colors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyCart extends StatelessWidget {
  const _EmptyCart();

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.shopping_cart_outlined,
              size: 40, color: colors.emptyValueColor),
          const SizedBox(height: 8),
          Text(
            'Mendan taom qo\'shing',
            style: TextStyle(fontSize: 13, color: colors.textSecondary),
          ),
        ],
      ),
    );
  }
}

/// To‘langan / bekor buyurtma: pozitsiyalar bo‘lmasa ham jami va status.
class _TerminalOrderEmptyBody extends StatelessWidget {
  final OpenOrderModel order;
  const _TerminalOrderEmptyBody({required this.order});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isPaid = order.statusKeyNormalized == 'paid';
    final isCancelled = order.statusKeyNormalized == 'cancelled';

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Icon(
            isPaid
                ? Icons.check_circle_outline
                : isCancelled
                    ? Icons.cancel_outlined
                    : Icons.receipt_long_outlined,
            size: 48,
            color: isPaid
                ? colors.systemSuccess
                : isCancelled
                    ? colors.systemError
                    : colors.textTertiary,
          ),
          const SizedBox(height: 12),
          Text(
            order.statusDisplayLabel,
            textAlign: TextAlign.center,
            style: context.textStyles.semibold16.copyWith(fontSize: 16),
          ),
          const SizedBox(height: 8),
          if (order.totalAmountValue > 0)
            Text(
              'Jami: ${order.totalAmountValue.formatN}',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: colors.textDefault,
              ),
            ),
          const SizedBox(height: 12),
          Text(
            'Pozitsiyalar ro\'yxati bo\'sh yoki to\'lovdan keyin serverdan chiqmayapti.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              color: colors.textSecondary,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

class _CartItemRow extends StatelessWidget {
  final OrderItem item;
  const _CartItemRow({required this.item});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final price = double.tryParse(item.goods.price) ?? 0;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Обычный  •  ${DateFormat('HH:mm').format(DateTime.now())}',
            style: TextStyle(fontSize: 11, color: colors.textSecondary),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Expanded(
                child: Text(
                  item.goods.name,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: colors.textDefault,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Row(
                children: [
                  _QtyBtn(
                    icon: Icons.remove,
                    onTap: () => context.read<DetailBloc>().add(
                          DetailEvent.decrementQuantity(
                              goodsId: item.goods.id),
                        ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: Text(
                      '${item.quantity}',
                      style: context.textStyles.semibold14,
                    ),
                  ),
                  _QtyBtn(
                    icon: Icons.add,
                    onTap: () => context.read<DetailBloc>().add(
                          DetailEvent.incrementQuantity(
                              goodsId: item.goods.id),
                        ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            price.formatN,
            style: TextStyle(fontSize: 12, color: colors.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _QtyBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _QtyBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 26,
        height: 26,
        decoration: BoxDecoration(
          color: colors.bgSecondary,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Icon(icon, size: 14, color: colors.iconDefault),
      ),
    );
  }
}

// ─── Send footer ──────────────────────────────────────────────────────────────

class _SendFooter extends StatelessWidget {
  final String orderId;
  final List<OrderItem> items;

  const _SendFooter({required this.orderId, required this.items});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      height: 52,
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: colors.border)),
      ),
      child: BlocBuilder<WaiterCubit, WaiterState>(
        buildWhen: (p, c) => p.isSendingItems != c.isSendingItems,
        builder: (context, ws) {
          void sendAll() {
            context.read<WaiterCubit>().sendItems(
                  orderId: orderId,
                  items: items,
                );
            context.read<DetailBloc>().add(const DetailEvent.clearGoods());
          }

          return Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: ws.isSendingItems ? null : sendAll,
                  child: Container(
                    color: colors.systemInfo,
                    child: Center(
                      child: ws.isSendingItems
                          ? SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator.adaptive(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation(
                                    colors.textOnBrand),
                              ),
                            )
                          : Text(
                              'Отправить',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: colors.textOnBrand,
                              ),
                            ),
                    ),
                  ),
                ),
              ),
              Container(width: 1, color: colors.textOnBrand.withOpacity(0.24)),
              GestureDetector(
                onTap: ws.isSendingItems ? null : sendAll,
                child: Container(
                  width: 72,
                  color: colors.systemInfo,
                  child: Center(
                    child: Text(
                      'Все',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: colors.textOnBrand,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

// ─── Close order view (cashier only) ────────────────────────────────────────────

class _PaymentTypeChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final ThemeColors colors;
  final VoidCallback onTap;

  const _PaymentTypeChip({
    required this.label,
    required this.icon,
    required this.selected,
    required this.colors,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        decoration: BoxDecoration(
          color: selected ? colors.buttonBrandSecondary : colors.bgSecondary,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: selected ? colors.borderBrand : colors.border,
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 20,
              color: selected ? colors.textBrand : colors.iconDefault,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: selected ? colors.textBrand : colors.textTertiary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CloseOrderGate extends StatefulWidget {
  const _CloseOrderGate();

  @override
  State<_CloseOrderGate> createState() => _CloseOrderGateState();
}

class _CloseOrderGateState extends State<_CloseOrderGate> {
  bool _didRedirect = false;

  @override
  Widget build(BuildContext context) {
    final u = context.watch<UserBloc>().state.userMOdel;
    if (u != null && u.role != UserRole.cashier && !_didRedirect) {
      _didRedirect = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.read<WaiterCubit>().backToBillDetail();
      });
      return const SizedBox.shrink();
    }
    if (u == null) {
      return const Center(child: CircularProgressIndicator.adaptive());
    }
    if (u.role != UserRole.cashier) {
      return const SizedBox.shrink();
    }
    return const _CloseOrderView();
  }
}

double _sumActiveLines(List<OrderLineItemModel> lines) {
  return lines
      .where((l) => !l.isCancelled)
      .fold<double>(
        0,
        (s, l) => s + (double.tryParse(l.price) ?? 0) * l.quantity,
      );
}

/// [total_amount] odatda xizmat bilan; qatorlar esa faqat mahsulot narxini beradi.
double _servicePartForOrder(
  OpenOrderModel order,
  double sumSubtotal,
  double totalFromOrder,
) {
  if (kOpenOrderServiceFeeZeroPercent) return 0;
  if (order.serviceAmountValue > 0.01) return order.serviceAmountValue;
  if (totalFromOrder > sumSubtotal + 0.01) {
    return totalFromOrder - sumSubtotal;
  }
  return 0;
}

/// Yopish oynasidagi «Jami» va chegirma bazasi.
///
/// [kOpenOrderServiceFeeZeroPercent] yoqilganda odatda faqat qatorlar yig‘indisi
/// ishlatiladi (xizmatni ikki marta qo‘shmaslik). Vaqt bo‘yicha stolda esa
/// vaqt summasi qatorlarda yo‘q — API [OpenOrderModel.totalAmountValue] kerak.
double _grandTotalForCloseOrder(
  OpenOrderModel order,
  double sumLines,
  double totalFromOrder,
) {
  if (kOpenOrderServiceFeeZeroPercent) {
    if (order.isTimeBasedTable && totalFromOrder > 0) {
      return totalFromOrder;
    }
    return sumLines;
  }
  return totalFromOrder > 0 ? totalFromOrder : sumLines;
}

class _CloseOrderView extends StatefulWidget {
  const _CloseOrderView();

  @override
  State<_CloseOrderView> createState() => _CloseOrderViewState();
}

enum _DiscountType { percent, amount }

class _CloseOrderViewState extends State<_CloseOrderView> {
  PaymentType _paymentType = PaymentType.cash;
  _DiscountType _discountType = _DiscountType.percent;
  final _discountCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _discountCtrl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _discountCtrl.dispose();
    super.dispose();
  }

  /// Bo'shliq / NBSP — formatlangan summa / foiz uchun.
  String get _discountRawDigits =>
      _discountCtrl.text.replaceAll(RegExp(r'\s'), '');

  double _discountedTotal(double grandTotal) {
    final val = double.tryParse(_discountRawDigits) ?? 0;
    if (val <= 0) return grandTotal;
    if (_discountType == _DiscountType.percent) {
      return grandTotal * (1 - val.clamp(0, 100) / 100);
    } else {
      return (grandTotal - val).clamp(0, double.infinity);
    }
  }

  double _discountVal() =>
      double.tryParse(_discountRawDigits) ?? 0;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return BlocBuilder<WaiterCubit, WaiterState>(
      builder: (context, waiterState) {
        final order = waiterState.selectedOrder;
        if (order == null) return const _EmptyPanel();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Закрыть счет',
                      style: context.textStyles.semibold16.copyWith(
                        fontSize: 15,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () =>
                        context.read<WaiterCubit>().backToBillDetail(),
                    child: Icon(Icons.close,
                        size: 20, color: colors.textTertiary),
                  ),
                ],
              ),
            ),
            Divider(height: 1, color: colors.border),
            Expanded(
              child: BlocBuilder<WaiterCubit, WaiterState>(
                buildWhen: (p, c) =>
                    p.orderLineItems != c.orderLineItems ||
                    p.isLoadingOrderItems != c.isLoadingOrderItems,
                builder: (context, ws) {
                  if (ws.isLoadingOrderItems && ws.orderLineItems.isEmpty) {
                    return const Center(
                      child: CircularProgressIndicator.adaptive(),
                    );
                  }
                  return BlocBuilder<MainCubit, MainState>(
                    buildWhen: (p, c) =>
                        p.tables != c.tables || p.halls != c.halls,
                    builder: (context, mainState) {
                      final hall =
                          order.resolveHallName(mainState.halls, mainState.tables);
                      final table =
                          order.resolveTableNumber(mainState.tables);
                      final lines = ws.orderLineItems;
                      final sumLines = _sumActiveLines(lines);
                      final totalFromOrder = order.totalAmountValue;
                      final grandTotal = _grandTotalForCloseOrder(
                        order,
                        sumLines,
                        totalFromOrder,
                      );
                      final servicePart = _servicePartForOrder(
                        order,
                        sumLines,
                        totalFromOrder,
                      );
                      final showServiceBreakdown = servicePart > 0.01;
                      String serviceTitle = 'Xizmat';
                      if (order.servicePercent != null &&
                          order.servicePercent! > 0) {
                        final p = order.servicePercent!;
                        final pStr =
                            p == p.roundToDouble() ? '${p.round()}' : '$p';
                        serviceTitle = 'Xizmat ($pStr%)';
                      } else if (showServiceBreakdown &&
                          sumLines > 0 &&
                          servicePart > 0) {
                        final approxPct =
                            (servicePart / sumLines * 100).round();
                        serviceTitle = 'Xizmat (~$approxPct%)';
                      }

                      return ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: colors.bgSecondary,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: colors.border),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  hall.isNotEmpty
                                      ? '$hall • Стол ${table > 0 ? table : '—'}'
                                      : (table > 0 ? 'Стол $table' : 'Buyurtma'),
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: colors.textDefault,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Mehmonlar: ${order.guestCount}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: colors.textSecondary,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                if (showServiceBreakdown) ...[
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'Mahsulotlar:',
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w500,
                                          color: colors.textSecondary,
                                        ),
                                      ),
                                      Text(
                                        sumLines.formatN,
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          color: colors.textDefault,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        serviceTitle,
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w500,
                                          color: colors.textSecondary,
                                        ),
                                      ),
                                      Text(
                                        servicePart.formatN,
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          color: colors.textDefault,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Divider(height: 1, color: colors.border),
                                  const SizedBox(height: 6),
                                ],
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'Jami:',
                                      style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                        color: colors.textDefault,
                                      ),
                                    ),
                                    Text(
                                      grandTotal.formatN,
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w700,
                                        color: colors.textBrand,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Pozitsiyalar',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: colors.textTertiary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          if (lines.isEmpty)
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 24),
                              child: Center(
                                child: Text(
                                  'Pozitsiyalar ro\'yxati bo\'sh',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: colors.textSecondary,
                                  ),
                                ),
                              ),
                            )
                          else
                            ...lines.map((line) {
                              final lineSum =
                                  (double.tryParse(line.price) ?? 0) *
                                      line.quantity;
                              final cancelled = line.isCancelled;
                              return Padding(
                                padding:
                                    const EdgeInsets.only(bottom: 12),
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Divider(
                                        height: 1, color: colors.border),
                                    const SizedBox(height: 10),
                                    Text(
                                      line.statusLabel,
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: colors.textTertiary,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            line.displayName,
                                            style: TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w500,
                                              color: colors.textDefault,
                                              decoration: cancelled
                                                  ? TextDecoration
                                                      .lineThrough
                                                  : null,
                                            ),
                                          ),
                                        ),
                                        Text(
                                          lineSum.formatN,
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            color: colors.textDefault,
                                          ),
                                        ),
                                      ],
                                    ),
                                    Text(
                                      '×${line.quantity}',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: colors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }),
                        ],
                      );
                    },
                  );
                },
              ),
            ),
            // ── Chegirma bo'limi ──────────────────────────────────────────────
            Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: colors.border)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        'Скидка',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: colors.textTertiary,
                        ),
                      ),
                      const Spacer(),
                      _DiscountTypeToggle(
                        selected: _discountType,
                        colors: colors,
                        onChanged: (t) => setState(() {
                          _discountType = t;
                          _discountCtrl.clear();
                        }),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 40,
                    child: TextField(
                      controller: _discountCtrl,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      inputFormatters: _discountType == _DiscountType.amount
                          ? [SumThousandsInputFormatter()]
                          : null,
                      style:
                          TextStyle(fontSize: 14, color: colors.textDefault),
                      decoration: InputDecoration(
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        hintText: _discountType == _DiscountType.percent
                            ? '0 – 100'
                            : '0',
                        hintStyle: TextStyle(
                          fontSize: 13,
                          color: colors.textSecondary,
                        ),
                        suffixText: _discountType == _DiscountType.percent
                            ? '%'
                            : 'сум',
                        suffixStyle: TextStyle(
                          fontSize: 13,
                          color: colors.textSecondary,
                        ),
                        filled: true,
                        fillColor: colors.bgSecondary,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: colors.border),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: colors.border),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: colors.borderBrand),
                        ),
                      ),
                    ),
                  ),
                  if (_discountVal() > 0) ...[
                    const SizedBox(height: 8),
                    Builder(
                      builder: (_) {
                        final sumLines =
                            _sumActiveLines(waiterState.orderLineItems);
                        final apiTotal = order.totalAmountValue;
                        final grandTotal = _grandTotalForCloseOrder(
                          order,
                          sumLines,
                          apiTotal,
                        );
                        final finalAmt = _discountedTotal(grandTotal);
                        final saved = grandTotal - finalAmt;
                        return Column(
                          mainAxisAlignment: MainAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '– ${saved.formatN} скидка',
                              style: TextStyle(
                                fontSize: 12,
                                color: colors.systemError,
                              ),
                              softWrap: true,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'К оплате: ${finalAmt.formatN}',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: colors.textBrand,
                              ),
                              softWrap: true,
                            ),
                          ],
                        );
                      },
                    ),
                  ],
                ],
              ),
            ),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: colors.border)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Способ оплаты',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: colors.textTertiary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: _PaymentTypeChip(
                          label: S.current.strCash,
                          icon: Icons.payments_outlined,
                          selected: _paymentType == PaymentType.cash,
                          colors: colors,
                          onTap: () => setState(
                            () => _paymentType = PaymentType.cash,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _PaymentTypeChip(
                          label: S.current.strCard,
                          icon: Icons.credit_card_outlined,
                          selected: _paymentType == PaymentType.card,
                          colors: colors,
                          onTap: () => setState(
                            () => _paymentType = PaymentType.card,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: colors.border)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () =>
                          context.read<WaiterCubit>().backToBillDetail(),
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: colors.bgSecondary,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Center(
                          child: Text(
                            'Назад',
                            style: context.textStyles.semibold14,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: BlocBuilder<WaiterCubit, WaiterState>(
                      buildWhen: (p, c) =>
                          p.isClosingOrder != c.isClosingOrder,
                      builder: (context, ws) {
                        return GestureDetector(
                          onTap: ws.isClosingOrder
                              ? null
                              : () => context
                                  .read<WaiterCubit>()
                                  .closeOrder(
                                    _paymentType,
                                    discountPercent:
                                        _discountType == _DiscountType.percent
                                            ? _discountVal()
                                            : 0,
                                    discountAmount:
                                        _discountType == _DiscountType.amount
                                            ? _discountVal()
                                            : 0,
                                  ),
                          child: Container(
                            height: 44,
                            decoration: BoxDecoration(
                              color: colors.systemSuccess,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Center(
                              child: ws.isClosingOrder
                                  ? SizedBox(
                                      width: 20,
                                      height: 20,
                                      child:
                                          CircularProgressIndicator.adaptive(
                                        strokeWidth: 2,
                                        valueColor:
                                            AlwaysStoppedAnimation(
                                                colors.textOnBrand),
                                      ),
                                    )
                                  : Text(
                                      'Оплатить ✓',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: colors.textOnBrand,
                                      ),
                                    ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

// ─── Chegirma turi toggle (% | Sum) ──────────────────────────────────────────

class _DiscountTypeToggle extends StatelessWidget {
  final _DiscountType selected;
  final ThemeColors colors;
  final ValueChanged<_DiscountType> onChanged;

  const _DiscountTypeToggle({
    required this.selected,
    required this.colors,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 32,
      decoration: BoxDecoration(
        color: colors.bgSecondary,
        border: Border.all(color: colors.border),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _DiscountTab(
            label: '%',
            active: selected == _DiscountType.percent,
            colors: colors,
            onTap: () => onChanged(_DiscountType.percent),
          ),
          _DiscountTab(
            label: S.current.strAmountColumnHeader,
            active: selected == _DiscountType.amount,
            colors: colors,
            onTap: () => onChanged(_DiscountType.amount),
          ),
        ],
      ),
    );
  }
}

class _DiscountTab extends StatelessWidget {
  final String label;
  final bool active;
  final ThemeColors colors;
  final VoidCallback onTap;

  const _DiscountTab({
    required this.label,
    required this.active,
    required this.colors,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: active ? colors.buttonBrand : Colors.transparent,
          borderRadius: BorderRadius.circular(7),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: active ? colors.textOnBrand : colors.textDefault,
            ),
          ),
        ),
      ),
    );
  }
}
