import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:keyboard_dismisser/keyboard_dismisser.dart';
import 'package:mary_ai_pos/core/api/api.dart';
import 'package:mary_ai_pos/core/auth/models/brand_id_token_pair/brand_id_token_pair.dart';
import 'package:mary_ai_pos/core/common/custom_button.dart';
import 'package:mary_ai_pos/core/design_system/pos_design_system.dart';
import 'package:mary_ai_pos/core/components/flush_bars.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/widget_extension.dart';
import 'package:mary_ai_pos/core/mixins/form_validation_mixin.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/core/utils/validator.dart';
import 'package:mary_ai_pos/core/values/app_assets.dart';
import 'package:mary_ai_pos/core/widgets/brand_logo.dart';
import 'package:mary_ai_pos/core/values/app_colors.dart';
import 'package:mary_ai_pos/core/values/app_strings.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/auth/auth_cubit.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/auth/auth_state.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/settings/settings_cubit.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/pages/login/widgets/liquid_text_field.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/pages/login/widgets/obsecure_icon_button_widget.dart';
import 'package:mary_ai_pos/generated/l10n.dart';
import 'package:virtual_keyboard_multi_language/virtual_keyboard_multi_language.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _OnlineOfflineStudentScreenState();
}

class _OnlineOfflineStudentScreenState extends State<LoginScreen>
    with FormValidationMixin {
  static const List<String> _languages = ['uz', 'en', 'ru'];
  final TextEditingController _brandIdController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final FocusNode _brandIdFocusNode = FocusNode();
  final FocusNode _passwordFocusNode = FocusNode();
  TextEditingController? _activeController;
  bool _shiftEnabled = false;
  bool _keyboardVisible = false;

  @override
  void initState() {
    super.initState();

    _brandIdFocusNode.addListener(() {
      if (_brandIdFocusNode.hasFocus) {
        _activeController = _brandIdController;
        _keyboardVisible = true;
      }
      setState(() {});
    });
    _brandIdFocusNode.requestFocus();
    _passwordFocusNode.addListener(() {
      if (_passwordFocusNode.hasFocus) {
        _activeController = _passwordController;
        _keyboardVisible = true;
      }
      setState(() {});
    });
  }

  void _dismissKeyboard() {
    _brandIdFocusNode.unfocus();
    _passwordFocusNode.unfocus();
    setState(() => _keyboardVisible = false);
  }

  void _onKeyPress(VirtualKeyboardKey key) {
    if (_activeController == null) return;

    final TextEditingController controller = _activeController!;

    final String currentText = controller.text;
    final TextSelection selection = controller.selection.isValid
        ? controller.selection
        : TextSelection.collapsed(offset: currentText.length);

    if (key.keyType == VirtualKeyboardKeyType.String) {
      final String char = (_shiftEnabled ? key.capsText : key.text) ?? '';
      final String newText = currentText.replaceRange(
        selection.start,
        selection.end,
        char,
      );
      controller.value = TextEditingValue(
        text: newText,
        selection: TextSelection.collapsed(
          offset: selection.start + char.length,
        ),
      );
    } else if (key.keyType == VirtualKeyboardKeyType.Action) {
      switch (key.action) {
        case VirtualKeyboardKeyAction.Backspace:
          if (selection.start == selection.end && selection.start > 0) {
            final String newText = currentText.replaceRange(
              selection.start - 1,
              selection.start,
              '',
            );
            controller.value = TextEditingValue(
              text: newText,
              selection: TextSelection.collapsed(offset: selection.start - 1),
            );
          } else if (selection.start != selection.end) {
            final String newText = currentText.replaceRange(
              selection.start,
              selection.end,
              '',
            );
            controller.value = TextEditingValue(
              text: newText,
              selection: TextSelection.collapsed(offset: selection.start),
            );
          }
          break;
        case VirtualKeyboardKeyAction.Return:
          break;
        case VirtualKeyboardKeyAction.Space:
          final String char = (key.text ?? ' ');
          final String newText = currentText.replaceRange(
            selection.start,
            selection.end,
            char,
          );
          controller.value = TextEditingValue(
            text: newText,
            selection: TextSelection.collapsed(
              offset: selection.start + char.length,
            ),
          );
          break;
        case VirtualKeyboardKeyAction.Shift:
          setState(() {
            _shiftEnabled = !_shiftEnabled;
          });
          break;
        default:
      }
    }
    updateFormValidity();
  }

  @override
  void dispose() {
    _brandIdController.dispose();
    _passwordController.dispose();
    _brandIdFocusNode.dispose();
    _passwordFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<AuthCubit>();

    return KeyboardDismisser(
      child: Scaffold(
        resizeToAvoidBottomInset: false,
        body: Form(
          key: formKey,
          child: BlocConsumer<AuthCubit, AuthState>(
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
              return GestureDetector(
                behavior: HitTestBehavior.translucent,
                // Ekranning istalgan joyiga bosilganda — klaviatura yopiladi
                onTap: _dismissKeyboard,
                child: Stack(
                children: [
                  Container(
                    height: context.h,
                    width: context.w,
                    alignment: Alignment.center,
                    decoration: const BoxDecoration(
                      image: DecorationImage(
                        image: AssetImage(AppImages.imgLoginBg),
                        fit: BoxFit.cover,
                      ),
                    ),
                    child: SizedBox(
                      // POS desktop'da kengroq forma — katta ekranda kichik
                      // qolib ketmasin
                      width: PosBreakpoints.pick<double>(
                        context,
                        compact: 400,
                        comfortable: 460,
                      ),
                      child: SafeArea(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Center(
                              child: BrandLogo(
                                height: 72,
                                fit: BoxFit.contain,
                              ),
                            ),
                            24.verticalSpace,
                            Text(
                              AppStrings.strBrandId,
                              style: context.textStyles.bodyMd.copyWith(
                                color: AppColors.white,
                              ),
                            ),
                            8.verticalSpace,
                            LiquidTextField(
                              hintText: S.current.strEnterBrandID,
                              textInputType: TextInputType.text,
                              onChange: (value) => updateFormValidity(),
                              validator: (value) =>
                                  Validator.nameChecker(value ?? ''),
                              textEditingController: _brandIdController,
                              focusNode: _brandIdFocusNode,
                            ),
                            16.verticalSpace,
                            Text(
                              '${S.current.strPassword}*',
                              style: context.textStyles.bodyMd.copyWith(
                                color: AppColors.white,
                              ),
                            ),
                            8.verticalSpace,
                            LiquidTextField(
                              hintText: S.current.strEnterCode,
                              textInputType: TextInputType.text,
                              obscure: state.obsecure,
                              onChange: (value) => updateFormValidity(),
                              textEditingController: _passwordController,
                              validator: (value) =>
                                  Validator.passwordCheck(value ?? ''),
                              focusNode: _passwordFocusNode,
                              suffix: ObsecureIconButtonWidget(
                                obsecure: state.obsecure,
                                onToggle: () => cubit.toggle(),
                              ),
                            ),
                            36.verticalSpace,
                            ValueListenableBuilder(
                              valueListenable: formValidNotifier,
                              builder: (_, isValid, _) {
                                return CustomButton(
                                  text: S.current.strLogin,
                                  paddingV: 8,
                                  isLoading: state.status == Status.LOADING,
                                  onTap: () {
                                    if (isValid) {
                                      cubit.loginWithBrandId(
                                        req: BrandIdTokenPair(
                                          brandId: _brandIdController.text,
                                          password: _passwordController.text,
                                        ),
                                        onSuccess: () {
                                          Navigator.pushNamed(
                                            context,
                                            AppRoutes.loginPinScreen,
                                          );
                                        },
                                      );
                                    }
                                  },
                                  borderColor: AppColors.white,
                                  bgColor: AppColors.black.withOpacity(.3),
                                  radius: context.radius.segmentedControl,
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 220),
                      transitionBuilder: (child, anim) => SlideTransition(
                        position: Tween<Offset>(
                          begin: const Offset(0, 1),
                          end: Offset.zero,
                        ).animate(CurvedAnimation(
                          parent: anim,
                          curve: Curves.easeOutCubic,
                        )),
                        child: FadeTransition(opacity: anim, child: child),
                      ),
                      child: _keyboardVisible
                          ? DecoratedBox(
                              key: const ValueKey('kb-visible'),
                              decoration: BoxDecoration(
                                color: context.colors.bgSecondary,
                              ),
                              child: SafeArea(
                                child: VirtualKeyboard(
                                  height: context.h * .3,
                                  customLayoutKeys:
                                      VirtualKeyboardDefaultLayoutKeys([
                                    VirtualKeyboardDefaultLayouts.English,
                                  ]),
                                  textColor: Colors.black,
                                  fontSize: 24,
                                  type: VirtualKeyboardType.Alphanumeric,
                                  postKeyPress: _onKeyPress,
                                ),
                              ),
                            )
                          : const SizedBox.shrink(
                              key: ValueKey('kb-hidden'),
                            ),
                    ),
                  ),
                  Positioned(
                    top: 16,
                    right: 16,
                    child: SafeArea(
                      child: BlocBuilder<SettingsCubit, SettingsState>(
                        builder: (context, settingsState) {
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(.35),
                              borderRadius: context.radius.buttonLg,
                              border: Border.all(
                                color: AppColors.white.withOpacity(.4),
                                width: 1,
                              ),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: settingsState.language,
                                dropdownColor: AppColors.black,
                                borderRadius: context.radius.buttonLg,
                                iconEnabledColor: AppColors.white,
                                style: context.textStyles.bold16.copyWith(
                                  color: AppColors.white,
                                  fontWeight: FontWeight.w500,
                                ),
                                items: _languages
                                    .map(
                                      (code) => DropdownMenuItem<String>(
                                        value: code,
                                        child: Text(code.toUpperCase()),
                                      ),
                                    )
                                    .toList(),
                                onChanged: (value) {
                                  if (value == null ||
                                      value == settingsState.language) {
                                    return;
                                  }
                                  context.read<SettingsCubit>().saveAppLang(
                                    context,
                                    languageCode: value,
                                  );
                                },
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
