import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';

class CustomHoverEffectWidget extends StatelessWidget {
  final Widget child;
  final Color? bgColor;
  final VoidCallback onTap;
  final Color? borderColor;
  final double borderWidth;
  final Color? highlightColor;
  final BorderRadius borderRadius;
  final Color? hoverOverlayColor;
  final double hoverOverlayOpacity;

  const CustomHoverEffectWidget({
    super.key,
    this.bgColor,
    this.borderColor,
    required this.child,
    required this.onTap,
    this.highlightColor,
    this.borderWidth = 1.0,
    required this.borderRadius,
    this.hoverOverlayColor,
    this.hoverOverlayOpacity = 0.12,
  });

  @override
  Widget build(BuildContext context) {
    final baseBgColor = bgColor ?? context.colors.bgSecondary;
    final effectiveHighlight =
        highlightColor ?? context.colors.bgBrand.withOpacity(0.1);

    final hoverNotifier = ValueNotifier<bool>(false);

    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => hoverNotifier.value = true,
      onExit: (_) => hoverNotifier.value = false,
      child: ValueListenableBuilder<bool>(
        valueListenable: hoverNotifier,
        builder: (context, isHovered, staticChild) {
          return Material(
            color: Colors.transparent,
            borderRadius: borderRadius,
            child: InkWell(
              onTap: onTap,
              borderRadius: borderRadius,
              splashColor: Colors.transparent,
              highlightColor: effectiveHighlight,
              hoverColor: Colors.transparent,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 160),
                curve: Curves.easeOut,
                decoration: BoxDecoration(
                  color: baseBgColor,
                  borderRadius: borderRadius,
                  border: Border.all(
                    color: borderColor ?? Colors.transparent,
                    width: borderWidth,
                  ),
                ),
                foregroundDecoration: isHovered
                    ? BoxDecoration(
                        color: (hoverOverlayColor ?? Colors.black).withOpacity(
                          hoverOverlayOpacity,
                        ),
                        borderRadius: borderRadius,
                      )
                    : null,
                child: staticChild!,
              ),
            ),
          );
        },
        child: child,
      ),
    );
  }
}
