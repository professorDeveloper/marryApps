import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/common/custom_loading_widget.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/generated/l10n.dart';
import 'package:scale_button/scale_button.dart';

class DialogActionButtons extends StatelessWidget {
  const DialogActionButtons({
    super.key,
    required this.onCancel,
    required this.onConfirm,
    this.cancelText,
    this.confirmText,
    this.isLoading = false,
    this.confirmColor,
    this.cancelColor,
    this.confirmTextColor,
    this.cancelTextColor,
    this.spacing = 8,
    this.verticalPadding = 18.5,
    this.horizontalPadding = 10,
  });

  final VoidCallback onCancel;
  final VoidCallback? onConfirm;
  final String? cancelText;
  final String? confirmText;
  final bool isLoading;
  final Color? confirmColor;
  final Color? cancelColor;
  final Color? confirmTextColor;
  final Color? cancelTextColor;
  final double spacing;
  final double verticalPadding;
  final double horizontalPadding;

  bool get _isConfirmEnabled => onConfirm != null && !isLoading;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final radius = context.radius.buttonLg;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: _ActionButton(
            text: cancelText ?? S.of(context).strCancel,
            onTap: isLoading ? null : onCancel,
            backgroundColor: cancelColor ?? colors.bgSecondary,
            textColor: cancelTextColor ?? colors.textDefault,
            radius: radius,
            verticalPadding: verticalPadding,
            horizontalPadding: horizontalPadding,
          ),
        ),
        SizedBox(width: spacing),
        Expanded(
          child: _ActionButton(
            text: confirmText ?? S.of(context).strSave,
            onTap: _isConfirmEnabled ? onConfirm : null,
            backgroundColor: (confirmColor ?? colors.buttonBrand).withOpacity(
              _isConfirmEnabled ? 1.0 : 0.4,
            ),
            textColor: confirmTextColor ?? colors.textOnBrand,
            radius: radius,
            verticalPadding: verticalPadding,
            horizontalPadding: horizontalPadding,
            isLoading: isLoading,
            loadingColor: confirmTextColor ?? colors.textOnBrand,
          ),
        ),
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.text,
    required this.onTap,
    required this.backgroundColor,
    required this.textColor,
    required this.radius,
    required this.verticalPadding,
    required this.horizontalPadding,
    this.isLoading = false,
    this.loadingColor,
  });

  final String text;
  final VoidCallback? onTap;
  final Color backgroundColor;
  final Color textColor;
  final BorderRadius radius;
  final double verticalPadding;
  final double horizontalPadding;
  final bool isLoading;
  final Color? loadingColor;

  @override
  Widget build(BuildContext context) {
    return ScaleButton(
      bound: 0.030,
      onTap: onTap,
      child: Material(
        color: Colors.transparent,
        borderRadius: radius,
        child: InkWell(
          borderRadius: radius,
          onTap: onTap,
          child: Ink(
            padding: EdgeInsets.symmetric(
              vertical: verticalPadding,
              horizontal: horizontalPadding,
            ),
            decoration: BoxDecoration(
              color: backgroundColor,
              borderRadius: radius,
            ),
            child: Center(
              child: isLoading
                  ? SizedBox(
                      height: 22,
                      width: 22,
                      child: LoadingWidget(color: loadingColor ?? textColor),
                    )
                  : Text(
                      text,
                      textAlign: TextAlign.center,
                      overflow: TextOverflow.ellipsis,
                      style: context.textStyles.bodyMd.copyWith(
                        color: textColor,
                        fontWeight: FontWeight.w500,
                        fontSize: 16,
                      ),
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
