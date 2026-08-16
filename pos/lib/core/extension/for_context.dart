import 'package:mary_ai_pos/core/theme/tokens/theme_colors.dart';
import 'package:mary_ai_pos/core/theme/tokens/theme_radius.dart';
import 'package:mary_ai_pos/core/theme/tokens/theme_text_style.dart';
import 'package:mary_ai_pos/core/utils/helper/helper_widget.dart';
import 'package:flutter/material.dart';

extension ForContext on BuildContext {
  MediaQueryData get mq => MediaQuery.of(this);
  double get w => mq.size.width;
  double get h => mq.size.height;

  bool get hasDark => Theme.of(this).brightness == Brightness.dark;

  ThemeTextStyle get textStyles => Theme.of(this).extension<ThemeTextStyle>()!;

  ThemeColors get colors => Theme.of(this).extension<ThemeColors>()!;

  ThemeRadius get radius => Theme.of(this).extension<ThemeRadius>()!;

  SizedBox get keyboardHeightSpace => SizedBox(
    height: MediaQuery.of(this).viewInsets.bottom + customBottomPadding,
  );

  void unfocusKeyboard() => FocusManager.instance.primaryFocus?.unfocus();
}
