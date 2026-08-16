import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/common/custom_hover_effect_widget.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/widget_extension.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

class LeaveFromDetailScreenDialog extends StatelessWidget {
  const LeaveFromDetailScreenDialog({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 464,
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
            Text(
              S.current.strBackToScreen,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xFF2D2D2D),
                fontSize: 20,
                fontFamily: 'Inter',
                fontWeight: FontWeight.w500,
              ),
            ),
            Text(
              S.current.strYouWantLeaveOrderScreen,
              style: context.textStyles.bodyMd.copyWith(
                color: const Color(0xFF7B7B7B),
              ),
              textAlign: TextAlign.center,
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
                      bgColor: context.colors.bgBrand,
                      borderRadius: context.radius.card,
                      onTap: () => Navigator.pop(context, true),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        spacing: 10,
                        children: [
                          Text(
                            S.current.strSave,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: context.colors.textOnBrand,
                              fontSize: 16,
                              fontFamily: 'Inter',
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ).paddingSymmetric(horizontal: 10, vertical: 12),
                    ),
                  ),
                  Expanded(
                    child: CustomHoverEffectWidget(
                      bgColor: const Color(0x19DB1F1F),
                      borderRadius: context.radius.card,
                      onTap: () => Navigator.pop(context, false),
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
