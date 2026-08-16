import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/int_extension.dart';

class WShiftTimeCard extends StatelessWidget {
  final String title;
  final String value;
  const WShiftTimeCard({super.key,required this.title,required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: SizedBox(
        height: 92,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: context.colors.bgSecondary,
            borderRadius: context.radius.card,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                title,
                style: context.textStyles.bodyMd.copyWith(
                  color: context.colors.textSecondary,
                ),
              ),
              6.hBox,
              Text(
                value,
                style: context.textStyles.bold24.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
