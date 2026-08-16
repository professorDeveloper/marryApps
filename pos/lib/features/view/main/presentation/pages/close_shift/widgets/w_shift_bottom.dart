import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/svg.dart';
import 'package:mary_ai_pos/core/common/custom_hover_effect_widget.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/int_extension.dart';
import 'package:mary_ai_pos/core/extension/widget_extension.dart';
import 'package:mary_ai_pos/core/values/app_assets.dart';
import 'package:mary_ai_pos/core/values/app_colors.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/shift/shift_bloc.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

class WShiftBottom extends StatelessWidget {
  const WShiftBottom({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ShiftBloc, ShiftState>(
      builder: (context, state) {
        return Row(
          children: [
            SizedBox(
              height: 56,
              child: CustomHoverEffectWidget(
                onTap: () {
                  if (state.shift != null) {
                    context.read<ShiftBloc>().add(
                      const ShiftEvent.printShiftReport(),
                    );
                  }
                },
                bgColor: context.colors.bgDefault,
                borderRadius: context.radius.card,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SvgPicture.asset(
                      AppIcons.icPrinter,
                      colorFilter: ColorFilter.mode(
                        context.colors.iconDefault,
                        BlendMode.srcIn,
                      ),
                    ),
                    10.wBox,
                    Text(
                      S.current.strPrint,
                      style: context.textStyles.title14.copyWith(fontSize: 16),
                    ),
                  ],
                ).paddingSymmetric(horizontal: 16),
              ),
            ),
            12.wBox,
            Expanded(
              child: SizedBox(
                height: 56,
                child: CustomHoverEffectWidget(
                  onTap: () {
                    if (state.shift == null) {
                      context.read<ShiftBloc>().add(
                        const ShiftEvent.openShift(),
                      );
                    } else {
                      context.read<ShiftBloc>().add(
                        const ShiftEvent.closeShift(),
                      );
                    }
                  },
                  bgColor: state.shift == null
                      ? const Color(0xFFFB6633)
                      : const Color(0xFFDC2626),
                  borderRadius: context.radius.card,
                  child: Center(
                    child: state.status == Status.LOADING
                        ? const CircularProgressIndicator.adaptive()
                        : Text(
                            state.shift == null
                                ? S.current.strOpenShift
                                : S.current.strCloseShift,
                            style: context.textStyles.bold16.copyWith(
                              color: AppColors.white,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    ).paddingAll(16);
  }
}
