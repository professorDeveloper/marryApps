import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/widget_extension.dart';
import 'package:mary_ai_pos/core/values/app_colors.dart';

class LiquidTextField extends StatelessWidget {
  const LiquidTextField({
    super.key,
    this.onChange,
    required this.hintText,
    this.validator,
    this.obscure,
    this.textInputAction,
    this.textEditingController,
    this.onTap,
    this.formatter,
    required this.textInputType,
    this.suffix,
    this.focusNode,
  });

  final Function(String value)? onChange;
  final String hintText;
  final TextEditingController? textEditingController;
  final FormFieldValidator<String>? validator;
  final bool? obscure;
  final TextInputAction? textInputAction;
  final Function()? onTap;
  final List<TextInputFormatter>? formatter;
  final TextInputType textInputType;
  final Widget? suffix;
  final FocusNode? focusNode;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      minLines: 1,
      validator: validator,
      inputFormatters: formatter,
      onTap: onTap,
      style: context.textStyles.bodyMd.copyWith(color: AppColors.white),
      obscureText: obscure ?? false,
      textInputAction: textInputAction,
      keyboardType: textInputType,
      onChanged: onChange,
      controller: textEditingController,
      focusNode: focusNode,
      cursorColor: context.colors.borderBrand,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      decoration: InputDecoration(
        counterText: '',
        contentPadding: const EdgeInsets.symmetric(
          horizontal: (16),
          vertical: (16),
        ),
        suffixIcon: suffix?.paddingOnly(right: (16)),
        suffixIconConstraints: const BoxConstraints(
          maxHeight: (50),
          maxWidth: (50),
        ),
        hintStyle: context.textStyles.bodyMd.copyWith(
          color: AppColors.ffC9C9C9,
        ),
        hintText: hintText,
        filled: true,
        fillColor: AppColors.black.withOpacity(.3),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: context.radius.segmentedControl,
          borderSide: BorderSide(
            color: context.colors.systemError,
            width: (1.5),
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: context.radius.segmentedControl,
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: context.radius.segmentedControl,
          borderSide: const BorderSide(color: AppColors.white, width: (0.5)),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: context.radius.segmentedControl,
          borderSide: const BorderSide(color: AppColors.white, width: (0.5)),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: context.radius.segmentedControl,
          borderSide: BorderSide(
            color: context.colors.systemError,
            width: (0.5),
          ),
        ),
      ),
    );
  }
}
