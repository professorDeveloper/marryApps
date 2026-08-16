import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/common/custom_network_image.dart';
import 'package:mary_ai_pos/core/design_system/pos_design_system.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/utils/app_formatter.dart';
import 'package:mary_ai_pos/features/view/main/data/models/goods/goods_model.dart';

/// Premium product card (image + category badge + name + price).
///
/// Shared between the menu management screen (admin) and the order-taking
/// product grid (waiter/cashier). The optional [topRightBadge] is overlaid on
/// the image area — used by the order screen to display the cart quantity.
class ProductGridCard extends StatefulWidget {
  final GoodsModel good;
  final String categoryName;
  final VoidCallback onTap;
  final Widget? topRightBadge;

  const ProductGridCard({
    super.key,
    required this.good,
    required this.onTap,
    this.categoryName = '',
    this.topRightBadge,
  });

  @override
  State<ProductGridCard> createState() => _ProductGridCardState();
}

class _ProductGridCardState extends State<ProductGridCard> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final pic = widget.good.pictureUrl;
    final hasImage = pic != null && pic.isNotEmpty;
    final initial = widget.good.name.isNotEmpty
        ? widget.good.name[0].toUpperCase()
        : '•';

    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOut,
          transform: Matrix4.translationValues(0, _hovered ? -2 : 0, 0),
          decoration: BoxDecoration(
            color: c.bgDefault,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: _hovered ? c.textBrand.withOpacity(0.4) : c.border,
              width: _hovered ? 1.2 : 1,
            ),
            boxShadow: _hovered
                ? [
                    BoxShadow(
                      color: c.textBrand.withOpacity(0.10),
                      blurRadius: 14,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                flex: 4,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    ClipRRect(
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(11),
                      ),
                      child: hasImage
                          ? CustomCachedNetworkImage(
                              minioObjectName: pic,
                              fit: BoxFit.cover,
                              width: double.infinity,
                              height: double.infinity,
                              errorWidget: _InitialPlaceholder(
                                initial: initial,
                              ),
                            )
                          : _InitialPlaceholder(initial: initial),
                    ),
                    if (widget.categoryName.isNotEmpty)
                      Positioned(
                        left: 8,
                        bottom: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 7,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.94),
                            borderRadius: BorderRadius.circular(5),
                          ),
                          child: Text(
                            widget.categoryName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w600,
                              color: c.textSecondary,
                              fontFamily: 'Inter',
                              letterSpacing: 0.2,
                            ),
                          ),
                        ),
                      ),
                    if (widget.topRightBadge != null)
                      Positioned(
                        top: 6,
                        right: 6,
                        child: widget.topRightBadge!,
                      ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  PosDimensions.m,
                  PosDimensions.s + 2,
                  PosDimensions.m,
                  PosDimensions.m,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.good.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: c.textDefault,
                        fontFamily: PosTypography.family,
                        height: 1.2,
                        letterSpacing: -0.1,
                      ),
                    ),
                    const SizedBox(height: PosDimensions.xs + 2),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          AppFormatter.formatAmountWithSpaces(
                            widget.good.price,
                          ),
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: c.textBrand,
                            fontFamily: PosTypography.family,
                            letterSpacing: -0.2,
                            fontFeatures: PosTypography.tabularFigures,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          "so'm",
                          style: TextStyle(
                            fontSize: 12,
                            color: c.textSecondary,
                            fontFamily: PosTypography.family,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InitialPlaceholder extends StatelessWidget {
  final String initial;

  const _InitialPlaceholder({required this.initial});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            c.textBrand.withOpacity(0.05),
            c.textBrand.withOpacity(0.12),
          ],
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: TextStyle(
          fontSize: 42,
          fontWeight: FontWeight.w700,
          color: c.textBrand.withOpacity(0.55),
          fontFamily: 'Inter',
          letterSpacing: -1,
        ),
      ),
    );
  }
}

/// Small circular badge — typically used in [ProductGridCard.topRightBadge]
/// to display the cart quantity for a product on the order screen.
class ProductCartQtyBadge extends StatelessWidget {
  final int qty;
  const ProductCartQtyBadge({super.key, required this.qty});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      constraints: const BoxConstraints(minWidth: 26, minHeight: 26),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: c.textBrand,
        borderRadius: BorderRadius.circular(13),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.12),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      alignment: Alignment.center,
      child: Text(
        '$qty',
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: Colors.white,
          fontFamily: 'Inter',
          height: 1,
        ),
      ),
    );
  }
}
