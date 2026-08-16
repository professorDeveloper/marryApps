import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';

class LoadingWidget extends StatelessWidget {
  const LoadingWidget({super.key, this.color});
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: CircularProgressIndicator(
        strokeWidth: 2.5,
        color: color ?? context.colors.bgBrand,
        backgroundColor: context.colors.bgBrand.withOpacity(.1),
      ),
    );
  }
}
