import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/design_system/pos_design_system.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/number_formatter.dart';
import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/food_additional/food_additional_model.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/detail/detail_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/detail/detail_screen_mixin.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/detail/widgets/show_food_additional.dart';
import 'package:mary_ai_pos/features/view/main/data/models/table_timer/table_timer_response_model.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/table_timer/table_timer_cubit.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

const _indigo = Color(0xFF6366F1);

class OrderSidebar extends StatefulWidget {
  final String? tableId;
  final CafeTableModel? cafeTable;

  const OrderSidebar({super.key, this.tableId, this.cafeTable});

  @override
  State<OrderSidebar> createState() => _OrderSidebarState();
}

class _OrderSidebarState extends State<OrderSidebar> with DetailScreenMixin {
  final ScrollController _itemsCtrl = ScrollController();

  @override
  void dispose() {
    _itemsCtrl.dispose();
    super.dispose();
  }

  String? get tableId => widget.tableId;
  CafeTableModel? get cafeTable => widget.cafeTable;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return BlocListener<DetailBloc, DetailState>(
      listenWhen: (p, c) =>
          p.activeOrderId != c.activeOrderId && c.activeOrderId != null,
      listener: (ctx, s) {
        // time_based stoldan simple stolga transfer qilingan order
        // muzlatilgan `final_amount`'ni ko'rsatishi uchun barcha dine_in
        // orderlar uchun fetch chaqiramiz. Cubit 400/non-frozen javoblarda
        // jimgina o'tib ketadi.
        final timerCubit = ctx.read<TableTimerCubit>();
        timerCubit.fetchTimer(orderId: s.activeOrderId!);
      },
      child: BlocBuilder<DetailBloc, DetailState>(
        buildWhen: (p, c) =>
            p.selectedGoods != c.selectedGoods ||
            p.existingGoods != c.existingGoods ||
            p.existingSyncingNames != c.existingSyncingNames,
        builder: (context, state) {
          return Container(
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(left: BorderSide(color: colors.border)),
            ),
            child: Column(
              children: [
                // Items list (sidebar = faqat itemlar)
                Expanded(
                  child:
                      (state.existingGoods.isEmpty &&
                          state.selectedGoods.isEmpty)
                      ? _SidebarEmptyState(colors: colors)
                      : Scrollbar(
                          controller: _itemsCtrl,
                          thumbVisibility: true,
                          thickness: 4,
                          radius: const Radius.circular(8),
                          child: ListView(
                            controller: _itemsCtrl,
                            padding: const EdgeInsets.fromLTRB(12, 12, 16, 12),
                            children: [
                              if (state.existingGoods.isNotEmpty) ...[
                                _SectionLabel(
                                  label: S.current.strExistingOrders,
                                  color: colors.textSecondary,
                                ),
                                const SizedBox(height: 6),
                                ...state.existingGoods.map(
                                  (item) => Padding(
                                    padding: const EdgeInsets.only(bottom: 8),
                                    child: _ReadonlyOrderItem(
                                      item: item,
                                      tableId: cafeTable?.id,
                                      isSyncing: state.existingSyncingNames
                                          .contains(item.goods.name),
                                    ),
                                  ),
                                ),
                                if (state.selectedGoods.isNotEmpty)
                                  const SizedBox(height: 4),
                              ],
                              if (state.selectedGoods.isNotEmpty) ...[
                                if (state.existingGoods.isNotEmpty)
                                  _SectionLabel(
                                    label: S.current.strExtras,
                                    color: const Color(0xFFFB6633),
                                  ),
                                if (state.existingGoods.isNotEmpty)
                                  const SizedBox(height: 6),
                                ...state.selectedGoods.asMap().entries.map(
                                  (e) => Padding(
                                    padding: EdgeInsets.only(
                                      bottom:
                                          e.key < state.selectedGoods.length - 1
                                          ? 8
                                          : 0,
                                    ),
                                    child: _OrderItem(item: e.value),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Order Item Card
// ─────────────────────────────────────────────
class _OrderItem extends StatelessWidget with DetailScreenMixin {
  final OrderItem item;
  _OrderItem({required this.item});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return GestureDetector(
      onTap: () async {
        List<FoodAdditionalModel> selectedAdditional = List.from(additionals);
        for (int i = 0; i < additionals.length; i++) {
          if (item.goods.additionals.any(
            (v) =>
                v.price == additionals[i].price &&
                v.title == additionals[i].title,
          )) {
            selectedAdditional[i].selected = true;
          }
        }
        final bloc = context.read<DetailBloc>();
        final result = await showDialog<Map<String, dynamic>>(
          context: context,
          barrierDismissible: false,
          builder: (_) => ShowFoodAdditional(
            additionals: selectedAdditional,
            goods: item.goods,
            comment: item.comment,
          ),
        );
        if (result != null) {
          bloc.add(
            DetailEvent.addFoodAdditional(
              additionals: result['additional'],
              orderId: item.uniqueId,
              comment: result['comment'],
            ),
          );
        }
      },
      child: Container(
        padding: const EdgeInsets.fromLTRB(
          PosDimensions.s, // 8
          PosDimensions.s,
          PosDimensions.s,
          PosDimensions.s,
        ),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(PosDimensions.radiusMd),
        ),
        child: Row(
          children: [
            // Initial badge — qty button bilan bir o'lchamda
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(PosDimensions.radiusSm),
                border: Border.all(color: colors.border),
              ),
              child: Center(
                child: Text(
                  item.goods.name.isNotEmpty
                      ? item.goods.name[0].toUpperCase()
                      : '?',
                  style: const TextStyle(
                    fontSize: PosTypography.bodyMd, // 15
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                    fontFamily: PosTypography.family,
                  ),
                ),
              ),
            ),
            const SizedBox(width: PosDimensions.s + 2),
            // Nom + jami narx
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    item.goods.name,
                    style: const TextStyle(
                      fontSize: PosTypography.bodyMd, // 15
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF0F172A),
                      fontFamily: PosTypography.family,
                      height: 1.2,
                      letterSpacing: -0.1,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    ((item.goods.additionals.isNotEmpty
                                ? item.goods.additionals
                                          .map((v) => v.price)
                                          .reduce((a, b) => a + b) +
                                      double.parse(item.goods.price)
                                : double.parse(item.goods.price)) *
                            item.quantity)
                        .formatN,
                    style: const TextStyle(
                      fontSize: PosTypography.bodyMd, // 15
                      fontWeight: FontWeight.w700,
                      color: Color(0xFFFB6633),
                      fontFamily: PosTypography.family,
                      letterSpacing: -0.1,
                      fontFeatures: PosTypography.tabularFigures,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: PosDimensions.s),
            _QtyControl(
              quantity: item.quantity,
              onDecrement: () => context.read<DetailBloc>().add(
                DetailEvent.decrementQuantity(goodsId: item.goods.id),
              ),
              onIncrement: () => context.read<DetailBloc>().add(
                DetailEvent.incrementQuantity(goodsId: item.goods.id),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QtyControl extends StatelessWidget {
  final int quantity;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;

  const _QtyControl({
    required this.quantity,
    required this.onIncrement,
    required this.onDecrement,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      spacing: PosDimensions.xs, // 4
      children: [
        _QtyBtn(icon: Icons.remove, onTap: onDecrement),
        SizedBox(
          width: 32,
          height: 44,
          child: Center(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                '$quantity',
                textAlign: TextAlign.center,
                maxLines: 1,
                style: const TextStyle(
                  fontSize: PosTypography.bodyMd, // 15
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A),
                  fontFamily: PosTypography.family,
                  fontFeatures: PosTypography.tabularFigures,
                ),
              ),
            ),
          ),
        ),
        _QtyBtn(icon: Icons.add, onTap: onIncrement),
      ],
    );
  }
}

class _QtyBtn extends StatefulWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _QtyBtn({required this.icon, required this.onTap});

  @override
  State<_QtyBtn> createState() => _QtyBtnState();
}

class _QtyBtnState extends State<_QtyBtn> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 100),
        // POS qty +/- — 44dp (kompakt POS sidebar uchun, lekin 28 dan 1.5x katta)
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: _pressed ? const Color(0xFFFB6633) : Colors.white,
          border: Border.all(
            color: _pressed ? const Color(0xFFFB6633) : const Color(0xFFE2E8F0),
          ),
          borderRadius: BorderRadius.circular(PosDimensions.radiusSm),
        ),
        child: Icon(
          widget.icon,
          size: 20,
          color: _pressed ? Colors.white : const Color(0xFF0F172A),
        ),
      ),
    );
  }
}

// ─── Sidebar empty state (premium) ──────────────────────────────────────────
class _SidebarEmptyState extends StatelessWidget {
  final dynamic colors;
  const _SidebarEmptyState({required this.colors});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Decorative ring with icon
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFFFB6633).withOpacity(0.06),
                border: Border.all(
                  color: const Color(0xFFFB6633).withOpacity(0.15),
                ),
              ),
              child: Center(
                child: Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFB6633).withOpacity(0.10),
                        blurRadius: 18,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.restaurant_menu_rounded,
                    size: 26,
                    color: Color(0xFFFB6633),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Text(
              S.current.strSidebarEmptyTitle,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Color(0xFF0F172A),
                fontFamily: 'Inter',
                letterSpacing: -0.2,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              S.current.strSelectFoodsNotFound,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                height: 1.4,
                color: Color(0xFF94A3B8),
                fontFamily: 'Inter',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  final Color color;
  const _SectionLabel({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w700,
        color: color,
        fontFamily: 'Inter',
        letterSpacing: 0.2,
      ),
    );
  }
}

class _ReadonlyOrderItem extends StatelessWidget {
  final OrderItem item;
  final String? tableId;
  final bool isSyncing;
  const _ReadonlyOrderItem({
    required this.item,
    this.tableId,
    this.isSyncing = false,
  });

  Future<void> _openEditDialog(BuildContext context) async {
    final bloc = context.read<DetailBloc>();
    final newQty = await showDialog<int>(
      context: context,
      barrierDismissible: true,
      barrierColor: PosTheme.colors.textPrimary.withOpacity(0.45),
      builder: (_) => _EditExistingOrderItemDialog(item: item),
    );
    if (newQty == null || newQty == item.quantity || tableId == null) return;
    if (newQty <= 0) {
      bloc.add(
        DetailEvent.deleteExistingItem(
          itemKey: item.uniqueId,
          tableId: tableId!,
        ),
      );
    } else {
      bloc.add(
        DetailEvent.setExistingItemQuantity(
          itemKey: item.uniqueId,
          tableId: tableId!,
          quantity: newQty,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    const colors = PosTheme.colors;
    final isCancelled = item.commet == 'cancelled';
    final isOfflinePending = item.commet == 'pending_offline';
    final hasComment = item.comment.trim().isNotEmpty;
    final canEdit = tableId != null && !isCancelled && !isOfflinePending;
    final tappable = canEdit && !isSyncing;
    final textColor = isCancelled ? colors.textDisabled : colors.textPrimary;

    final perUnit = double.tryParse(item.goods.price) ?? 0;
    final total = perUnit * item.quantity;

    Color bgColor = colors.surface;
    if (isCancelled) bgColor = colors.errorSoft;
    if (isOfflinePending) bgColor = const Color(0xFFF5F3FF);

    return Opacity(
      opacity: isCancelled ? 0.6 : 1.0,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: tappable ? () => _openEditDialog(context) : null,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(PosDimensions.radiusMd),
          child: Container(
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(PosDimensions.radiusMd),
              border: Border.all(
                color: isOfflinePending
                    ? colors.brand.withOpacity(0.4)
                    : colors.border,
              ),
            ),
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Left brand accent — full card height
                  Container(
                    width: 4,
                    color: isCancelled ? colors.borderStrong : colors.brand,
                  ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(
                        PosDimensions.s,
                        PosDimensions.s,
                        PosDimensions.s,
                        PosDimensions.s,
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          // Avatar — Qo'shimchalar item bilan bir o'lchamda (36)
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: colors.brandSoft,
                              borderRadius: BorderRadius.circular(
                                PosDimensions.radiusSm,
                              ),
                            ),
                            child: Center(
                              child: Text(
                                item.goods.name.isNotEmpty
                                    ? item.goods.name[0].toUpperCase()
                                    : '?',
                                style: TextStyle(
                                  fontSize: PosTypography.bodyMd,
                                  fontWeight: FontWeight.w700,
                                  color: isCancelled
                                      ? colors.textDisabled
                                      : colors.brand,
                                  fontFamily: PosTypography.family,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: PosDimensions.s + 2),
                          // Left side: name on top, time below
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  item.goods.name,
                                  style: TextStyle(
                                    fontSize: PosTypography.bodyMd,
                                    fontWeight: FontWeight.w600,
                                    color: textColor,
                                    fontFamily: PosTypography.family,
                                    height: 1.2,
                                    letterSpacing: -0.1,
                                    decoration: isCancelled
                                        ? TextDecoration.lineThrough
                                        : null,
                                    decorationColor: colors.textDisabled,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 2),
                                if (isCancelled)
                                  Text(
                                    S.current.strCancelled,
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: colors.error,
                                      fontFamily: PosTypography.family,
                                    ),
                                  )
                                else if (isOfflinePending)
                                  Text(
                                    '⏳ ${S.current.strSavedBadge}…',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: colors.brand,
                                      fontFamily: PosTypography.family,
                                    ),
                                  )
                                else if (item.createdAt != null)
                                  Text(
                                    _fmtHm(item.createdAt!),
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w500,
                                      color: colors.textTertiary,
                                      fontFamily: PosTypography.family,
                                      fontFeatures: const [
                                        FontFeature.tabularFigures(),
                                      ],
                                    ),
                                  ),
                                if (hasComment && !isCancelled) ...[
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.chat_bubble_outline_rounded,
                                        size: 11,
                                        color: colors.brand,
                                      ),
                                      const SizedBox(width: 3),
                                      Flexible(
                                        child: Text(
                                          item.comment.trim(),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontStyle: FontStyle.italic,
                                            color: colors.brand,
                                            fontFamily: PosTypography.family,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),
                          const SizedBox(width: PosDimensions.s),
                          // Right side: "perUnit × qty" on top, total below
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            mainAxisAlignment: MainAxisAlignment.center,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                '${perUnit.formatN} × ${item.quantity}',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  color: isCancelled
                                      ? colors.textDisabled
                                      : colors.textSecondary,
                                  fontFamily: PosTypography.family,
                                  fontFeatures: PosTypography.tabularFigures,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                total.formatN,
                                style: TextStyle(
                                  fontSize: PosTypography.bodyMd,
                                  fontWeight: FontWeight.w700,
                                  color: isCancelled
                                      ? colors.textDisabled
                                      : colors.brand,
                                  fontFamily: PosTypography.family,
                                  letterSpacing: -0.1,
                                  fontFeatures: PosTypography.tabularFigures,
                                  decoration: isCancelled
                                      ? TextDecoration.lineThrough
                                      : null,
                                  decorationColor: colors.textDisabled,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Edit dialog: tap mavjud item → name, narx, soni, jami, save/cancel ─────
//
// Lokal state: dialog ichida +/- bosilganda backendga so'rov ketmaydi —
// faqat "Saqlash" tugmasi yangi miqdor bilan bloc'ga
// `setExistingItemQuantity` event yuboradi.
class _EditExistingOrderItemDialog extends StatefulWidget {
  final OrderItem item;
  const _EditExistingOrderItemDialog({required this.item});

  @override
  State<_EditExistingOrderItemDialog> createState() =>
      _EditExistingOrderItemDialogState();
}

class _EditExistingOrderItemDialogState
    extends State<_EditExistingOrderItemDialog> {
  late int _qty;

  @override
  void initState() {
    super.initState();
    _qty = widget.item.quantity;
  }

  @override
  Widget build(BuildContext context) {
    const colors = PosTheme.colors;
    final perUnit = double.tryParse(widget.item.goods.price) ?? 0;
    final total = perUnit * _qty;
    final dirty = _qty != widget.item.quantity;

    return Dialog(
      backgroundColor: colors.surface,
      insetPadding: const EdgeInsets.symmetric(horizontal: 56, vertical: 32),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(PosDimensions.radiusLg),
      ),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 600),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            PosDimensions.xxl,
            PosDimensions.xl,
            PosDimensions.xxl,
            PosDimensions.xxl,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── Header: faqat name (close X kerak emas, "Bekor qilish" bor)
              Text(
                widget.item.goods.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: PosTypography.headlineLg,
                  fontWeight: FontWeight.w700,
                  color: colors.textPrimary,
                  fontFamily: PosTypography.family,
                  letterSpacing: -0.3,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: PosDimensions.m),
              Divider(height: 1, thickness: 1, color: colors.border),
              const SizedBox(height: PosDimensions.xl),

              // ── Price row ───────────────────────────────────────────
              _RowKV(
                label: S.current.strPrice,
                value: perUnit.formatN,
                valueColor: colors.textPrimary,
                valueWeight: FontWeight.w600,
              ),
              const SizedBox(height: PosDimensions.l),

              // ── Quantity row (label + qty stepper) ──────────────────
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Text(
                      S.current.strQuantity,
                      style: TextStyle(
                        fontSize: PosTypography.bodyLg,
                        fontWeight: FontWeight.w500,
                        color: colors.textSecondary,
                        fontFamily: PosTypography.family,
                      ),
                    ),
                  ),
                  _DialogQtyStepper(
                    quantity: _qty,
                    onDecrement: _qty > 0
                        ? () => setState(() => _qty -= 1)
                        : null,
                    onIncrement: () => setState(() => _qty += 1),
                  ),
                ],
              ),
              const SizedBox(height: PosDimensions.l),

              // ── Total row ───────────────────────────────────────────
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: PosDimensions.l,
                  vertical: PosDimensions.l,
                ),
                decoration: BoxDecoration(
                  color: colors.surfaceTinted,
                  borderRadius: BorderRadius.circular(PosDimensions.radiusMd),
                  border: Border.all(color: colors.border),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        S.current.strTotal,
                        style: TextStyle(
                          fontSize: PosTypography.bodyLg,
                          fontWeight: FontWeight.w600,
                          color: colors.textSecondary,
                          fontFamily: PosTypography.family,
                        ),
                      ),
                    ),
                    Text(
                      total.formatN,
                      style: TextStyle(
                        fontSize: PosTypography.headlineMd,
                        fontWeight: FontWeight.w700,
                        color: colors.brand,
                        fontFamily: PosTypography.family,
                        letterSpacing: -0.3,
                        fontFeatures: PosTypography.tabularFigures,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: PosDimensions.xxl),

              // ── Actions: Cancel + Save ──────────────────────────────
              Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: PosDimensions.buttonHeightLg,
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(context).pop(),
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(color: colors.border),
                          foregroundColor: colors.textPrimary,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(
                              PosDimensions.radiusMd,
                            ),
                          ),
                        ),
                        child: Text(
                          S.current.strCancel,
                          style: TextStyle(
                            fontSize: PosTypography.buttonLg,
                            fontWeight: FontWeight.w600,
                            color: colors.textPrimary,
                            fontFamily: PosTypography.family,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: PosDimensions.m),
                  Expanded(
                    child: SizedBox(
                      height: PosDimensions.buttonHeightLg,
                      child: FilledButton(
                        onPressed: dirty
                            ? () => Navigator.of(context).pop(_qty)
                            : null,
                        style: FilledButton.styleFrom(
                          backgroundColor: colors.brand,
                          disabledBackgroundColor: colors.brand.withOpacity(
                            0.4,
                          ),
                          foregroundColor: colors.textOnBrand,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(
                              PosDimensions.radiusMd,
                            ),
                          ),
                        ),
                        child: Text(
                          S.current.strSave,
                          style: TextStyle(
                            fontSize: PosTypography.buttonLg,
                            fontWeight: FontWeight.w700,
                            color: colors.textOnBrand,
                            fontFamily: PosTypography.family,
                          ),
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
  }
}

class _RowKV extends StatelessWidget {
  final String label;
  final String value;
  final Color valueColor;
  final FontWeight valueWeight;
  const _RowKV({
    required this.label,
    required this.value,
    required this.valueColor,
    this.valueWeight = FontWeight.w600,
  });

  @override
  Widget build(BuildContext context) {
    const colors = PosTheme.colors;
    return Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              fontSize: PosTypography.bodyLg,
              fontWeight: FontWeight.w500,
              color: colors.textSecondary,
              fontFamily: PosTypography.family,
            ),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: PosTypography.bodyLg,
            fontWeight: valueWeight,
            color: valueColor,
            fontFamily: PosTypography.family,
            fontFeatures: PosTypography.tabularFigures,
          ),
        ),
      ],
    );
  }
}

class _DialogQtyStepper extends StatelessWidget {
  final int quantity;
  final VoidCallback? onIncrement;
  final VoidCallback? onDecrement;

  const _DialogQtyStepper({
    required this.quantity,
    required this.onIncrement,
    required this.onDecrement,
  });

  @override
  Widget build(BuildContext context) {
    const colors = PosTheme.colors;
    return Container(
      decoration: BoxDecoration(
        color: colors.surfaceTinted,
        borderRadius: BorderRadius.circular(PosDimensions.radiusMd),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _DialogStepperBtn(icon: Icons.remove, onTap: onDecrement),
          Container(
            width: 72,
            height: 64,
            alignment: Alignment.center,
            child: Text(
              '$quantity',
              style: TextStyle(
                fontSize: PosTypography.headlineMd,
                fontWeight: FontWeight.w700,
                color: colors.textPrimary,
                fontFamily: PosTypography.family,
                fontFeatures: PosTypography.tabularFigures,
              ),
            ),
          ),
          _DialogStepperBtn(icon: Icons.add, onTap: onIncrement),
        ],
      ),
    );
  }
}

class _DialogStepperBtn extends StatefulWidget {
  final IconData icon;
  final VoidCallback? onTap;
  const _DialogStepperBtn({required this.icon, required this.onTap});

  @override
  State<_DialogStepperBtn> createState() => _DialogStepperBtnState();
}

class _DialogStepperBtnState extends State<_DialogStepperBtn> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    const colors = PosTheme.colors;
    final disabled = widget.onTap == null;
    return GestureDetector(
      onTap: widget.onTap,
      onTapDown: disabled ? null : (_) => setState(() => _pressed = true),
      onTapUp: disabled ? null : (_) => setState(() => _pressed = false),
      onTapCancel: disabled ? null : () => setState(() => _pressed = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 100),
        width: 64,
        height: 64,
        decoration: BoxDecoration(
          color: _pressed ? colors.brand : Colors.transparent,
          borderRadius: BorderRadius.circular(PosDimensions.radiusSm),
        ),
        child: Icon(
          widget.icon,
          size: 26,
          color: disabled
              ? colors.textDisabled
              : _pressed
              ? colors.textOnBrand
              : colors.textPrimary,
        ),
      ),
    );
  }
}

class _TimerBadgeRow extends StatefulWidget {
  final TableTimerState timerState;
  const _TimerBadgeRow({required this.timerState});

  @override
  State<_TimerBadgeRow> createState() => _TimerBadgeRowState();
}

class _TimerBadgeRowState extends State<_TimerBadgeRow> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final t = widget.timerState.timer;
    final displaySec =
        widget.timerState.displayActiveSec ?? t?.totalActiveSec ?? 0;
    final isRunning = t?.stateNormalized == 'running';
    final isPaused = t?.stateNormalized == 'paused';
    final isNone = t == null || t.stateNormalized == 'none';
    // effectiveCurrentAmount: timer API currentAmount yoki hisoblangan summa
    final rawAmt = widget.timerState.effectiveCurrentAmount ?? '';
    final amountStr = rawAmt.isNotEmpty ? '${_fmtAmount(rawAmt)} so\'m' : '';
    final startedAtStr = t?.startedAt != null ? _fmtClock(t!.startedAt!) : null;
    // billPauses — bill API dan (pause_periods), bo'lmasa timer API dan
    final pauses = widget.timerState.billPauses.isNotEmpty
        ? widget.timerState.billPauses
        : (t?.pauses ?? const []);

    final accentColor = isPaused
        ? const Color(0xFFF59E0B)
        : isRunning
        ? _indigo
        : _indigo.withOpacity(0.5);

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: accentColor.withOpacity(0.25)),
      ),
      child: Column(
        children: [
          // ── Main row ──────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 10, 12),
            child: Row(
              children: [
                // State dot
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: isRunning
                        ? const Color(0xFF22C55E)
                        : isPaused
                        ? const Color(0xFFF59E0B)
                        : const Color(0xFFCBD5E1),
                    shape: BoxShape.circle,
                    boxShadow: isRunning
                        ? [
                            BoxShadow(
                              color: const Color(0xFF22C55E).withOpacity(0.5),
                              blurRadius: 6,
                              spreadRadius: 1,
                            ),
                          ]
                        : null,
                  ),
                ),
                const SizedBox(width: 10),

                // Elapsed time + amount stacked
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _fmtTime(displaySec),
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          color: accentColor,
                          fontFamily: 'Inter',
                          letterSpacing: 0.4,
                          height: 1.05,
                          fontFeatures: const [FontFeature.tabularFigures()],
                        ),
                      ),
                      if (amountStr.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Text(
                            amountStr,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: accentColor.withOpacity(0.75),
                              fontFamily: 'Inter',
                              fontFeatures: const [
                                FontFeature.tabularFigures(),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),

                // Pause/Resume button
                if (isRunning || isPaused || isNone)
                  GestureDetector(
                    onTap: widget.timerState.isMutating
                        ? null
                        : () => isRunning
                              ? context.read<TableTimerCubit>().pauseTimer()
                              : context.read<TableTimerCubit>().resumeTimer(),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: isRunning
                            ? _indigo.withOpacity(0.10)
                            : const Color(0xFF22C55E).withOpacity(0.10),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isRunning
                              ? _indigo.withOpacity(0.20)
                              : const Color(0xFF22C55E).withOpacity(0.20),
                        ),
                      ),
                      child: Center(
                        child: widget.timerState.isMutating
                            ? SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: isRunning
                                      ? _indigo
                                      : const Color(0xFF22C55E),
                                ),
                              )
                            : Icon(
                                isRunning
                                    ? Icons.pause_rounded
                                    : Icons.play_arrow_rounded,
                                size: 20,
                                color: isRunning
                                    ? _indigo
                                    : const Color(0xFF22C55E),
                              ),
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // ── Meta row: opened + pause history toggle ───────────
          GestureDetector(
            onTap: pauses.isNotEmpty
                ? () => setState(() => _expanded = !_expanded)
                : null,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
              decoration: BoxDecoration(
                color: accentColor.withOpacity(0.05),
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(14),
                  bottomRight: Radius.circular(14),
                ),
                border: Border(
                  top: BorderSide(color: accentColor.withOpacity(0.15)),
                ),
              ),
              child: Row(
                children: [
                  if (startedAtStr != null) ...[
                    Icon(
                      Icons.schedule_rounded,
                      size: 14,
                      color: accentColor.withOpacity(0.6),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      'Ochildi: $startedAtStr',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: accentColor.withOpacity(0.7),
                        fontFamily: 'Inter',
                      ),
                    ),
                  ],
                  if (pauses.isNotEmpty) ...[
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF59E0B).withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        spacing: 5,
                        children: [
                          const Icon(
                            Icons.pause_circle_outline_rounded,
                            size: 15,
                            color: Color(0xFFF59E0B),
                          ),
                          Text(
                            '${pauses.length}x pause',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFFF59E0B),
                              fontFamily: 'Inter',
                            ),
                          ),
                          AnimatedRotation(
                            turns: _expanded ? 0.5 : 0,
                            duration: const Duration(milliseconds: 200),
                            child: const Icon(
                              Icons.keyboard_arrow_down_rounded,
                              size: 17,
                              color: Color(0xFFF59E0B),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ] else if (startedAtStr == null)
                    const Spacer(),
                ],
              ),
            ),
          ),

          // ── Expandable pause history ──────────────────────────
          AnimatedCrossFade(
            firstChild: const SizedBox.shrink(),
            secondChild: _PauseHistoryPanel(pauses: pauses),
            crossFadeState: _expanded && pauses.isNotEmpty
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 220),
            sizeCurve: Curves.easeOutCubic,
          ),
        ],
      ),
    );
  }

  static String _fmtTime(int sec) {
    final h = sec ~/ 3600;
    final m = (sec % 3600) ~/ 60;
    final s = sec % 60;
    final mm = m.toString().padLeft(2, '0');
    final ss = s.toString().padLeft(2, '0');
    if (h > 0) return '${h.toString().padLeft(2, '0')}:$mm:$ss';
    return '$mm:$ss';
  }

  static String _fmtClock(DateTime dt) {
    final local = dt.toLocal();
    final h = local.hour.toString().padLeft(2, '0');
    final m = local.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  static String _fmtAmount(String raw) {
    // Backend "4436.39" formatida decimal qaytaradi. Nuqtani saqlab olib,
    // double ga parse qilib, yaxlitlaymiz.
    final d = double.tryParse(raw.replaceAll(RegExp(r'[^0-9.]'), ''));
    if (d == null) return raw;
    final n = d.round();
    return n.toString().replaceAllMapped(
      RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]} ',
    );
  }
}

// ─── Pause history dropdown panel ────────────────────────────────────────────

class _PauseHistoryPanel extends StatelessWidget {
  final List<PauseInterval> pauses;
  const _PauseHistoryPanel({required this.pauses});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(10, 0, 10, 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: List.generate(pauses.length, (i) {
          final p = pauses[i];
          final isLast = i == pauses.length - 1;
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
            decoration: BoxDecoration(
              border: isLast
                  ? null
                  : const Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
            ),
            child: Row(
              children: [
                // Index badge
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text(
                      '${i + 1}',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFFF59E0B),
                        fontFamily: 'Inter',
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),

                // Paused at
                _PauseChip(
                  icon: Icons.pause_rounded,
                  label: _fmtClock(p.startedAt),
                  color: const Color(0xFFF59E0B),
                ),
                const SizedBox(width: 8),

                // Arrow
                const Icon(
                  Icons.arrow_forward_rounded,
                  size: 14,
                  color: Color(0xFFCBD5E1),
                ),
                const SizedBox(width: 8),

                // Resumed at
                _PauseChip(
                  icon: Icons.play_arrow_rounded,
                  label: p.endedAt != null ? _fmtClock(p.endedAt!) : '—',
                  color: const Color(0xFF22C55E),
                ),
                const Spacer(),

                // Duration
                Text(
                  p.durationSec > 0
                      ? _fmtDuration(p.durationSec)
                      : p.endedAt != null
                      ? _fmtDuration(
                          p.endedAt!.difference(p.startedAt).inSeconds.abs(),
                        )
                      : '—',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF94A3B8),
                    fontFamily: 'Inter',
                    fontFeatures: [FontFeature.tabularFigures()],
                  ),
                ),
              ],
            ),
          );
        }),
      ),
    );
  }

  static String _fmtClock(DateTime dt) {
    final l = dt.toLocal();
    return '${l.hour.toString().padLeft(2, '0')}:${l.minute.toString().padLeft(2, '0')}';
  }

  static String _fmtDuration(int sec) {
    if (sec < 60) return '${sec}s';
    final m = sec ~/ 60;
    final s = sec % 60;
    if (s == 0) return '${m}min';
    return '${m}m ${s}s';
  }
}

class _PauseChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _PauseChip({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      spacing: 4,
      children: [
        Icon(icon, size: 13, color: color),
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: color,
            fontFamily: 'Inter',
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
      ],
    );
  }
}

/// HH:mm formatida sanadan vaqt chiqaradi (lokal zona).
String _fmtHm(DateTime dt) {
  final l = dt.toLocal();
  final h = l.hour.toString().padLeft(2, '0');
  final m = l.minute.toString().padLeft(2, '0');
  return '$h:$m';
}
