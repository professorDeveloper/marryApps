import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:mary_ai_pos/core/common/custom_button.dart';
import 'package:mary_ai_pos/core/common/custom_loading_widget.dart';
import 'package:mary_ai_pos/core/components/flush_bars.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/widget_extension.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/core/values/app_assets.dart';
import 'package:mary_ai_pos/core/values/app_colors.dart';
import 'package:mary_ai_pos/generated/l10n.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/login_pin/login_pin_cubit.dart';

class LoginPinScreen extends StatelessWidget {
  const LoginPinScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocProvider(
        create: (context) => inject<LoginPinCubit>(),
        child: BlocConsumer<LoginPinCubit, LoginPinState>(
          listenWhen: (prev, curr) => prev.status != curr.status,
          listener: (context, state) {
            if (state.status == Status.ERROR) {
              showErrorMessage(
                context,
                state.failure.getLocalizedMessage(context),
              );
            }
          },
          builder: (context, state) {
            final cubit = context.read<LoginPinCubit>();

            final int pinLength = state.pinLength;
            final int currentLength = state.pin?.length ?? 0;
            final bool isLoading = state.status == Status.LOADING;
            final String toggleLabel = pinLength == 4
                ? S.current.strSwitchTo6Digit
                : S.current.strSwitchTo4Digit;

            return Container(
              decoration: const BoxDecoration(
                image: DecorationImage(
                  image: AssetImage(AppImages.imgLoginBg),
                  fit: BoxFit.cover,
                ),
              ),
              child: SafeArea(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Align(
                      alignment: Alignment.centerRight,
                      child: IntrinsicWidth(
                        child: CustomButton(
                          text: S.current.strLogout,
                          onTap: () => cubit.logoutFromApp(() {
                            Navigator.pushNamedAndRemoveUntil(
                              context,
                              AppRoutes.loginScreen,
                              (route) => false,
                            );
                          }),
                          paddingH: 16,
                          bgColor: AppColors.ffF8F8FA,
                          radius: context.radius.buttonSm,
                          rightW: SvgPicture.asset(AppIcons.icLogout),
                          textColor: context.colors.systemError,
                        ),
                      ),
                    ),
                    24.verticalSpace,
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        pinLength,
                        (i) => Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          child: _PinDot(filled: i < currentLength),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      height: 28,
                      child: Center(
                        child: isLoading
                            ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: LoadingWidget(color: AppColors.white),
                              )
                            : Text(
                                S.current.strEnterPinCode,
                                style: context.textStyles.bodyMd.copyWith(
                                  color: AppColors.white,
                                  fontSize: 20,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    ConstrainedBox(
                      constraints: BoxConstraints(
                        maxHeight: context.h * 0.6,
                        maxWidth: context.w * 0.9,
                      ),
                      child: AspectRatio(
                        aspectRatio: 3 / 4,
                        child: GridView.count(
                          crossAxisCount: 3,
                          crossAxisSpacing: 12,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          children: [
                            for (final label in const [
                              '1',
                              '2',
                              '3',
                              '4',
                              '5',
                              '6',
                              '7',
                              '8',
                              '9',
                              '⌫',
                              '0',
                              '✓',
                            ])
                              _KeyButton(
                                label: label,
                                onPressed: cubit.setPin,
                              ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    _PinLengthToggleButton(
                      label: toggleLabel,
                      onTap: cubit.togglePinLength,
                    ),
                  ],
                ).paddingSymmetric(horizontal: 16),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _PinDot extends StatelessWidget {
  final bool filled;

  const _PinDot({required this.filled});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: context.w * 0.05,
      height: context.w * 0.05,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.black.withOpacity(0.20),
        border: Border.all(color: Colors.white70, width: 1),
      ),
      alignment: Alignment.center,
      child: Container(
        width: context.w * 0.0225,
        height: context.w * 0.0225,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: filled ? Colors.white : Colors.transparent,
          border: Border.all(color: Colors.white),
        ),
      ),
    );
  }
}

class _KeyButton extends StatelessWidget {
  final String label;
  final ValueChanged<String> onPressed;

  const _KeyButton({required this.label, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: GestureDetector(
        onTap: () => onPressed(label),
        child: Container(
          height: context.h * 0.1,
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(.3),
            borderRadius: context.radius.segmentedControl,
            border: Border.all(color: Colors.white, width: 0.5),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: context.textStyles.displayLg.copyWith(
              color: AppColors.white,
            ),
          ),
        ),
      ),
    );
  }
}

class _PinLengthToggleButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _PinLengthToggleButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Text(
          label,
          textAlign: TextAlign.center,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: context.textStyles.bodyMd.copyWith(
            color: AppColors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
            decoration: TextDecoration.underline,
            decorationColor: AppColors.white,
          ),
        ),
      ),
    );
  }
}
