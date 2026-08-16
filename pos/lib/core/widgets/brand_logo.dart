import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:mary_ai_pos/core/app_assets/app_assets.dart';
import 'package:mary_ai_pos/gen/assets.gen.dart';

/// PNG brand mark; agar asset yo‘q bo‘lsa (masalan, noto‘g‘ri build) — `ic_logo.svg`.
class BrandLogo extends StatelessWidget {
  const BrandLogo({
    super.key,
    this.height,
    this.width,
    this.fit = BoxFit.contain,
    this.alignment = Alignment.center,
  });

  final double? height;
  final double? width;
  final BoxFit fit;
  final AlignmentGeometry alignment;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      AppAssets.brandLogo,
      height: height,
      width: width,
      fit: fit,
      alignment: alignment,
      filterQuality: FilterQuality.high,
      errorBuilder: (context, error, stackTrace) {
        return SvgPicture.asset(
          Assets.icons.icLogo.path,
          height: height,
          width: width,
          fit: fit,
          alignment: alignment,
        );
      },
    );
  }
}
