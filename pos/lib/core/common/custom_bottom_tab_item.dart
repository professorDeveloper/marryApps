import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class BottomTabItem extends StatelessWidget {
  const BottomTabItem({
    super.key,
    required int currentIndex,
    required this.onTap,
    required this.label,
    required this.icon,
    required this.index,
  }) : _currentIndex = currentIndex;

  final int index;
  final String icon;
  final String label;
  final int _currentIndex;
  final Function(int index) onTap;

  @override
  Widget build(BuildContext context) {
    final isActive = index == _currentIndex;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => onTap(index),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final maxH = constraints.maxHeight;

          final iconSize = maxH * 0.38;
          final textSize = maxH * 0.18;

          return Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SvgPicture.asset(
                icon,
                height: iconSize.clamp(20, 26),
                colorFilter: ColorFilter.mode(
                  isActive
                      ? context.colors.iconBrand
                      : context.colors.iconTertiary,
                  BlendMode.srcIn,
                ),
              ),
              SizedBox(height: maxH * 0.06),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: context.textStyles.caption.copyWith(
                  fontSize: textSize.clamp(10, 13),
                  color: isActive
                      ? context.colors.textDefault
                      : context.colors.textTertiary,
                  fontWeight: FontWeight.w400,
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
