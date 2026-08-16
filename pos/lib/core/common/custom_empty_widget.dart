import 'package:animate_do/animate_do.dart';
import 'package:mary_ai_pos/core/common/custom_button.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/widget_extension.dart';
import 'package:mary_ai_pos/core/values/app_assets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class CustomEmptyWidget extends StatelessWidget {
  final String title;
  final TextStyle? titleStyle;
  final String? subTitle;
  final TextStyle? subTitleStyle;
  final String? buttonText;
  final String? icon;
  final String? image;

  final double? width;
  final double? iconH;
  final Function()? onTap;

  const CustomEmptyWidget({
    super.key,
    required this.title,
    this.subTitle,
    this.buttonText,
    this.onTap,
    this.icon,
    this.width,
    this.iconH,
    this.image,
    this.titleStyle,
    this.subTitleStyle,
  });

  @override
  Widget build(BuildContext context) {
    return FadeIn(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: width ?? context.w / 1.4,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (image != null)
                  Image.asset(image!, height: (iconH ?? 160))
                else
                  SvgPicture.asset(
                    icon ?? AppIcons.icInfoCircle,
                    height: (iconH ?? 40),
                  ),
                const SizedBox(height: (14)),
                Text(
                  title,
                  style:
                      titleStyle ??
                      context.textStyles.bodyMd.copyWith(
                        color: context.colors.textDefault,
                        fontWeight: FontWeight.w500,
                      ),
                  textAlign: TextAlign.center,
                ),
                buttonText == null
                    ? const SizedBox(height: (4))
                    : const SizedBox(height: (18)),
                if (subTitle != null)
                  Text(
                    subTitle!,
                    textAlign: TextAlign.center,
                    style: subTitleStyle ?? context.textStyles.bodySm,
                  ),
                const SizedBox(height: (18)),
                buttonText == null
                    ? const SizedBox.shrink()
                    : CustomButton(
                        text: buttonText ?? "",
                        onTap: onTap ?? () {},
                      ),
              ],
            ),
          ).paddingOnly(top: (12)),
        ],
      ),
    );
  }
}
