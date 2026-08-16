import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/common/custom_hover_effect_widget.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/widget_extension.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/auth/auth_cubit.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

class LogoutDialog extends StatelessWidget {
  final String routeName;
  const LogoutDialog({super.key, required this.routeName});

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
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.center,
          spacing: 24,
          children: [
            SizedBox(
              width: 252,
              child: Text(
                S.current.strLogoutConfirm,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Color(0xFF2D2D2D),
                  fontSize: 20,
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 8,
                children: [
                  Expanded(
                    child: CustomHoverEffectWidget(
                      onTap: () => Navigator.pop(context),
                      bgColor: const Color(0xFFF6F7F9),
                      borderRadius: BorderRadius.circular(16),
                      child: Text(
                        S.current.strCancel,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Color(0xFF2D2D2D),
                          fontSize: 16,
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.w500,
                        ),
                      ).paddingSymmetric(horizontal: 10, vertical: 12),
                    ),
                  ),
                  Expanded(
                    child: CustomHoverEffectWidget(
                      bgColor: const Color(0x19DB1F1F),
                      borderRadius: context.radius.card,
                      onTap: () {
                        context.read<AuthCubit>().logout(
                          onSuccess: () => Navigator.pushNamedAndRemoveUntil(
                            context,
                            AppRoutes.loginPinScreen,
                            (route) => false,
                          ),
                        );
                      },
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        spacing: 10,
                        children: [
                          Text(
                            S.current.strLogout,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Color(0xFFDB2020),
                              fontSize: 16,
                              fontFamily: 'Inter',
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ).paddingSymmetric(horizontal: 10, vertical: 12),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
