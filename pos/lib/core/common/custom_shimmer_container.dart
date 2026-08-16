import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/values/app_colors.dart';
import 'package:shimmer/shimmer.dart';

class CustomShimmerBox extends StatelessWidget {
  const CustomShimmerBox({
    super.key,
    required this.h,
    required this.w,
    this.borderRadius,
  });

  final double h;
  final double w;
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: context.colors.bgTritary,
      highlightColor: context.hasDark ? AppColors.ff455DA7 : AppColors.ffF8F8FA,
      enabled: true,
      child: Container(
        height: h,
        width: w,
        decoration: BoxDecoration(
          borderRadius: borderRadius ?? BorderRadius.circular(4),
          color: context.colors.border,
        ),
      ),
    );
  }
}
