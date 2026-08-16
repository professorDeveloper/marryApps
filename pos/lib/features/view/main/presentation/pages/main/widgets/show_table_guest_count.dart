import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:mary_ai_pos/core/common/custom_hover_effect_widget.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/int_extension.dart';
import 'package:mary_ai_pos/core/extension/widget_extension.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/counter/counter_cubit.dart';
import 'package:mary_ai_pos/gen/assets.gen.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

class ShowTableGuestCount extends StatelessWidget {
  final int tableNumber;
  const ShowTableGuestCount({super.key, required this.tableNumber});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 364,
        padding: const EdgeInsets.all(20),
        clipBehavior: Clip.antiAlias,
        decoration: ShapeDecoration(
          color: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
        ),
        child: BlocProvider(
          create: (context) => inject<CounterCubit>()..started(1),
          child: BlocBuilder<CounterCubit, CounterState>(
            builder: (context, state) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  DecoratedBox(
                    decoration: BoxDecoration(
                      color: context.colors.bgTritary,
                      borderRadius: context.radius.infoRadius,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SvgPicture.asset(Assets.icons.icIosLeft.path),
                        16.wBox,
                        Text(
                          "$tableNumber ${S.current.strTable}",
                          style: context.textStyles.headingSm.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ).paddingSymmetric(horizontal: 20, vertical: 16),
                  ),
                  32.hBox,
                  Center(
                    child: Text(
                      S.current.strSelectGuestsCount,
                      style: context.textStyles.title14.copyWith(
                        fontSize: 16,
                        color: const Color(0xFF7B7B7B),
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  36.hBox,
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () => context.read<CounterCubit>().decremet(),
                          borderRadius: context.radius.segmentedControl,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: context.colors.bgTritary,
                              shape: BoxShape.circle,
                            ),
                            child: SvgPicture.asset(
                              Assets.icons.icMinus.path,
                            ).paddingAll(12),
                          ),
                        ),
                      ),
                      Text(
                        state.count.toString(),
                        style: context.textStyles.title14.copyWith(
                          fontSize: 36,
                        ),
                      ).paddingSymmetric(horizontal: 36),
                      Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () => context.read<CounterCubit>().increment(),
                          borderRadius: context.radius.segmentedControl,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: context.colors.bgTritary,
                              shape: BoxShape.circle,
                            ),
                            child: SvgPicture.asset(
                              Assets.icons.icPlus.path,
                            ).paddingAll(12),
                          ),
                        ),
                      ),
                    ],
                  ),
                  42.hBox,
                  SizedBox(
                    width: context.w,
                    height: 56,
                    child: Row(
                      children: [
                        Expanded(
                          child: CustomHoverEffectWidget(
                            onTap: () => Navigator.pop(context),
                            borderRadius: context.radius.buttonLg,
                            child: Center(child: Text(S.current.strCancel)),
                          ),
                        ),
                        8.wBox,
                        Expanded(
                          child: CustomHoverEffectWidget(
                            onTap: () => Navigator.pop(context, state.count),
                            borderRadius: context.radius.buttonLg,
                            bgColor: context.colors.buttonBrand,
                            child: Center(
                              child: Text(
                                S.current.strAdd,
                                style: context.textStyles.bold16.copyWith(
                                  fontWeight: FontWeight.w500,
                                  color: context.colors.textOnBrand,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}
