import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/values/app_assets.dart';
import 'package:mary_ai_pos/core/values/app_colors.dart';
import 'package:scale_button/scale_button.dart';

class ObsecureIconButtonWidget extends StatelessWidget {
  final bool obsecure;
  final Function() onToggle;
  const ObsecureIconButtonWidget({
    super.key,
    required this.obsecure,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return ScaleButton(
      bound: 0.04,
      onTap: onToggle,
      child: AnimatedCrossFade(
        firstChild: SvgPicture.asset(
          AppIcons.icPassowrdOn,
          colorFilter: const ColorFilter.mode(AppColors.white, BlendMode.srcIn),
        ),
        secondChild: SvgPicture.asset(
          AppIcons.icPassowrdOff,
          colorFilter: const ColorFilter.mode(AppColors.white, BlendMode.srcIn),
        ),
        crossFadeState: obsecure
            ? CrossFadeState.showSecond
            : CrossFadeState.showFirst,
        duration: kDefaultDuration300,
      ),
    );
  }
}
