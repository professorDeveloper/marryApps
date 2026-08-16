// ignore_for_file: use_build_context_synchronously

import 'dart:async';

import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/common/custom_loading_widget.dart';
import 'package:mary_ai_pos/core/components/flush_bars.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/widget_extension.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/core/service/app_version/app_update_service.dart';
import 'package:mary_ai_pos/core/utils/helper/helper_widget.dart';
import 'package:mary_ai_pos/core/widgets/brand_logo.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/auth/auth_cubit.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/auth/auth_state.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/bloc/user_bloc.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      Timer(const Duration(milliseconds: 500), () {
        _initializeAll();
      });
    });
  }

  void _initializeAll() async {
    try {
      //! Auth status handling
      final haveUserData = await context.read<AuthCubit>().chechUserData();
      if (haveUserData) {
        final unAuth = await context.read<AuthCubit>().checkUserToAuth();
        if (!unAuth) {
          Navigator.pushReplacementNamed(context, AppRoutes.loginPinScreen);
        } else {
          // Navigate immediately — don't wait for getUser API call
          Navigator.pushReplacementNamed(context, AppRoutes.mainScreen);
          context.read<UserBloc>().add(const UserEvent.getUser());
        }
      } else {
        Navigator.pushReplacementNamed(context, AppRoutes.loginScreen);
      }
    } catch (error) {
      showErrorMessage(
        context,
        S.of(context).strFailureMessage_initializingFailure,
      );

      Timer(const Duration(seconds: 3), () {
        SystemNavigator.pop();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthCubit, AuthState>(
      listenWhen: (prev, curr) => prev.status != curr.status,
      listener: (context, state) {
        if (state.status == Status.ERROR) {
          showErrorMessage(context, state.failure.getLocalizedMessage(context));
        }
      },
      child: Scaffold(
        resizeToAvoidBottomInset: false,
        body: BlocBuilder<UserBloc, UserState>(
          builder: (context, state) {
            return Column(
              spacing: 12,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Spacer(flex: 3),
                FadeInUp(
                  duration: const Duration(milliseconds: 600),
                  child: Center(
                    child: const BrandLogo(
                      height: 106,
                      fit: BoxFit.contain,
                    ).paddingSymmetric(horizontal: (16)),
                  ),
                ),
                const Spacer(flex: 2),
                const LoadingWidget(),
                FadeIn(
                  delay: const Duration(milliseconds: 300),
                  child: Text(
                    textAlign: TextAlign.center,
                    "V.${AppUpdateService.appVersion}",
                    style: context.textStyles.caption,
                  ),
                ),
                SizedBox(height: customBottomPadding),
              ],
            );
          },
        ).paddingSymmetric(horizontal: 16),
      ),
    );
  }
}
