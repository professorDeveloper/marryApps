
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:mary_ai_pos/core/common/custom_hover_effect_widget.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/int_extension.dart';
import 'package:mary_ai_pos/core/extension/widget_extension.dart';
import 'package:mary_ai_pos/core/values/app_assets.dart';

class WShiftHeader extends StatelessWidget {
  const WShiftHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: context.colors.bgDefault,
        borderRadius: context.radius.card24,
      ),
      child: Row(
        children: [
          SizedBox(
            height: 52,
            width: 52,
            child: CustomHoverEffectWidget(
              bgColor: context.colors.bgSecondary,
              onTap: () => Navigator.pop(context),
              borderRadius: context.radius.buttonLg,
              child: SvgPicture.asset(
                AppIcons.icArrowLeft,
                colorFilter: ColorFilter.mode(
                  context.colors.iconDefault,
                  BlendMode.srcIn,
                ),
              ).paddingAll(14),
            ),
          ),
          12.wBox,
        ],
      ).paddingAll(16),
    );
  }
}