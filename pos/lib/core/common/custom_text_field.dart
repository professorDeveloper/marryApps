import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/svg.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/widget_extension.dart';

class CustomTextField extends StatelessWidget {
  const CustomTextField({
    super.key,
    this.onChange,
    this.onEditingComplete,
    required this.hintText,
    this.maxLines,
    this.minLines,
    this.prefixIcon,
    this.suffixIcon,
    this.validator,
    this.obscure,
    this.textInputAction,
    this.fillColor,
    this.initialValue,
    this.preIconColor,
    this.textEditingController,
    this.readOnly = false,
    this.onTap,
    this.formatter,
    required this.textInputType,
    this.maxLength,
    this.focusNode,
    this.contentPadding,
    this.hintStyle,
    this.borderRadius,
    this.borderColor,
    this.style,
    this.textAlign = TextAlign.start,
    this.suffix,
  });

  final TextEditingController? textEditingController;
  final Function(String value)? onChange;
  final Function()? onEditingComplete;
  final String hintText;
  final String? prefixIcon;
  final Widget? suffixIcon;
  final bool? obscure;
  final bool readOnly;
  final TextInputAction? textInputAction;
  final Color? fillColor;
  final Color? preIconColor;
  final String? initialValue;
  final FormFieldValidator<String>? validator;
  final int? maxLines;
  final TextInputType textInputType;
  final int? minLines;
  final int? maxLength;
  final FocusNode? focusNode;
  final EdgeInsetsGeometry? contentPadding;
  final Function()? onTap;
  final List<TextInputFormatter>? formatter;
  final TextStyle? hintStyle;
  final double? borderRadius;
  final Color? borderColor;
  final TextStyle? style;
  final TextAlign textAlign;
  final Widget? suffix;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      maxLines: maxLines ?? 1,
      minLines: minLines ?? 1,
      validator: validator,
      readOnly: readOnly,
      focusNode: focusNode,
      inputFormatters: formatter,
      onTap: onTap,
      textAlign: textAlign,
      initialValue: initialValue,
      style:
          style ??
          Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w400),
      obscureText: obscure ?? false,
      textInputAction: textInputAction,
      keyboardType: textInputType,
      onChanged: onChange,
      onEditingComplete: onEditingComplete,
      onTapOutside: (event) => onEditingComplete,
      controller: textEditingController,
      cursorColor: context.colors.borderBrand,
      maxLength: maxLength,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      decoration: InputDecoration(
        // contentPadding:
        //     EdgeInsets.symmetric(horizontal: (16), vertical: (12)),
        counterText: '',
        contentPadding:
            contentPadding ??
            const EdgeInsets.symmetric(horizontal: (16), vertical: (12)),
        suffixIconConstraints: const BoxConstraints(
          minHeight: (25),
          minWidth: (25),
        ),
        prefixIcon: prefixIcon == null
            ? null
            : SvgPicture.asset(
                prefixIcon ?? "",
                colorFilter: ColorFilter.mode(
                  preIconColor ?? context.colors.border,
                  BlendMode.srcIn,
                ),
              ).paddingOnly(right: (6), left: (12), bottom: (10), top: (10)),
        suffix: suffix,
        suffixIcon: SizedBox(
          height: 23,
          width: 23,
          child: suffixIcon,
        ).paddingOnly(right: (16)),
        hintStyle: hintStyle ?? context.textStyles.bodyMd,
        hintText: hintText,
        filled: true,
        fillColor: fillColor ?? context.colors.bgSecondary,
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: context.radius.buttonLg,
          borderSide: BorderSide(
            color: context.colors.systemError,
            width: (1.5),
          ),
        ),
        enabledBorder: readOnly
            ? OutlineInputBorder(
                borderRadius: context.radius.buttonLg,
                borderSide: const BorderSide(color: Colors.transparent),
              )
            : OutlineInputBorder(
                borderRadius: context.radius.buttonLg,
                borderSide: borderColor == null
                    ? BorderSide.none
                    : BorderSide(color: borderColor!, width: (1.5)),
              ),
        focusedBorder: readOnly
            ? OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Colors.transparent),
              )
            : OutlineInputBorder(
                borderRadius: context.radius.buttonLg,
                borderSide: BorderSide(
                  color: context.colors.borderBrand,
                  width: (1.5),
                ),
              ),
        disabledBorder: OutlineInputBorder(
          borderRadius: context.radius.buttonLg,
          borderSide: BorderSide(color: context.colors.border, width: (1.5)),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: context.radius.buttonLg,
          borderSide: BorderSide(
            color: context.colors.systemError,
            width: (1.5),
          ),
        ),
      ),
    );
  }
}
