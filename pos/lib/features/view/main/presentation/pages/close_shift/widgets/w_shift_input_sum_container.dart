import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/int_extension.dart';

class WShiftInputSumContainer extends StatelessWidget {
  final String title;
  final String value;
  final bool selected;
  final VoidCallback? onTap;
  /// Naqd kabi maxfiy summalar — raqamlar o‘rniga nuqta.
  final bool obscureValue;
  const WShiftInputSumContainer({
    super.key,
    required this.title,
    required this.value,
    required this.selected,
    this.onTap,
    this.obscureValue = false,
  });

  String get _display {
    if (!obscureValue) return value;
    if (value == '0' || value.isEmpty) return '0';
    return String.fromCharCodes(List.filled(value.length, 0x2022));
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: context.textStyles.bodyLg.copyWith(
            color: context.colors.textSecondary,
          ),
        ),
        8.hBox,
        GestureDetector(
          onTap: onTap,
          child: SizedBox(
            height: 58,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: context.colors.bgSecondary,
                borderRadius: context.radius.card,
                border: selected
                    ? Border.all(color: context.colors.bgBrand, width: 2)
                    : null,
              ),
              child: Center(
                child: Text(
                  _display,
                  style: context.textStyles.bold24.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
