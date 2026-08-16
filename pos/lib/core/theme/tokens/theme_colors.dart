import 'package:flutter/material.dart';

@immutable
class ThemeColors extends ThemeExtension<ThemeColors> {
  final Color textBrand;
  final Color textDefault;
  final Color textButtonSecondary;
  final Color textSecondary;
  final Color textTertiary;
  final Color textOnBrand;
  final Color textOnBrandDark;
  final Color iconBrand;
  final Color iconDefault;
  final Color iconSecondary;
  final Color iconButtonSecondary;
  final Color iconTertiary;
  final Color iconOnBrand;
  final Color iconOnBrandDark;
  final Color bgBrand;
  final Color bgDefault;
  final Color bgSecondary;
  final Color bgTritary;
  final Color bgDefaultTritary;
  final Color bgSecondaryTritary;
  final Color bgBottomSheet;
  final Color borderBrand;
  final Color border;
  final Color buttonBrand;
  final Color buttonBrandSecondary;
  final Color buttonSecondary;
  final Color buttonDisabledBg;
  final Color systemAccent;
  final Color systemSuccess;
  final Color systemError;
  final Color extraPurple;
  final Color extraCyan;
  final Color extraOrange;
  final Color emptyValueColor;
  final Color informationColor;
  final Color responseTextColor;

  // Sidebar tokens
  final Color sidebarBg;
  final Color sidebarActive;
  final Color sidebarIcon;
  final Color systemInfo;

  const ThemeColors({
    required this.textBrand,
    required this.textDefault,
    required this.textButtonSecondary,
    required this.textSecondary,
    required this.textTertiary,
    required this.textOnBrand,
    required this.textOnBrandDark,
    required this.iconBrand,
    required this.iconDefault,
    required this.iconSecondary,
    required this.iconButtonSecondary,
    required this.iconTertiary,
    required this.iconOnBrand,
    required this.iconOnBrandDark,
    required this.bgBrand,
    required this.bgDefault,
    required this.bgSecondary,
    required this.bgTritary,
    required this.bgDefaultTritary,
    required this.bgSecondaryTritary,
    required this.bgBottomSheet,
    required this.borderBrand,
    required this.border,
    required this.buttonBrand,
    required this.buttonBrandSecondary,
    required this.buttonSecondary,
    required this.buttonDisabledBg,
    required this.systemAccent,
    required this.systemSuccess,
    required this.systemError,
    required this.extraPurple,
    required this.extraCyan,
    required this.extraOrange,
    required this.emptyValueColor,
    required this.informationColor,
    required this.responseTextColor,
    required this.sidebarBg,
    required this.sidebarActive,
    required this.sidebarIcon,
    required this.systemInfo,
  });

  @override
  ThemeColors copyWith({
    Color? textBrand,
    Color? textDefault,
    Color? textButtonSecondary,
    Color? textSecondary,
    Color? textTertiary,
    Color? textOnBrand,
    Color? textOnBrandDark,
    Color? iconBrand,
    Color? iconDefault,
    Color? iconSecondary,
    Color? iconButtonSecondary,
    Color? iconTertiary,
    Color? iconOnBrand,
    Color? iconOnBrandDark,
    Color? bgBrand,
    Color? bgDefault,
    Color? bgSecondary,
    Color? bgTritary,
    Color? bgDefaultTritary,
    Color? bgSecondaryTritary,
    Color? bgBottomSheet,
    Color? borderBrand,
    Color? border,
    Color? buttonBrand,
    Color? buttonBrandSecondary,
    Color? buttonSecondary,
    Color? buttonDisabledBg,
    Color? systemAccent,
    Color? systemSuccess,
    Color? systemError,
    Color? extraPurple,
    Color? extraCyan,
    Color? extraOrange,
    Color? emptyValueColor,
    Color? sidebarBg,
    Color? sidebarActive,
    Color? sidebarIcon,
    Color? systemInfo,
  }) {
    return ThemeColors(
      textBrand: textBrand ?? this.textBrand,
      textDefault: textDefault ?? this.textDefault,
      textButtonSecondary: textButtonSecondary ?? this.textButtonSecondary,
      textSecondary: textSecondary ?? this.textSecondary,
      textTertiary: textTertiary ?? this.textTertiary,
      textOnBrand: textOnBrand ?? this.textOnBrand,
      textOnBrandDark: textOnBrandDark ?? this.textOnBrandDark,
      iconBrand: iconBrand ?? this.iconBrand,
      iconDefault: iconDefault ?? this.iconDefault,
      iconSecondary: iconSecondary ?? this.iconSecondary,
      iconButtonSecondary: iconButtonSecondary ?? this.iconButtonSecondary,
      iconTertiary: iconTertiary ?? this.iconTertiary,
      iconOnBrand: iconOnBrand ?? this.iconOnBrand,
      iconOnBrandDark: iconOnBrandDark ?? this.iconOnBrandDark,
      bgBrand: bgBrand ?? this.bgBrand,
      bgDefault: bgDefault ?? this.bgDefault,
      bgSecondary: bgSecondary ?? this.bgSecondary,
      bgTritary: bgTritary ?? this.bgTritary,
      bgDefaultTritary: bgDefaultTritary ?? this.bgDefaultTritary,
      bgSecondaryTritary: bgSecondaryTritary ?? this.bgSecondaryTritary,
      bgBottomSheet: bgBottomSheet ?? this.bgBottomSheet,
      borderBrand: borderBrand ?? this.borderBrand,
      border: border ?? this.border,
      buttonBrand: buttonBrand ?? this.buttonBrand,
      buttonBrandSecondary: buttonBrandSecondary ?? this.buttonBrandSecondary,
      buttonSecondary: buttonSecondary ?? this.buttonSecondary,
      buttonDisabledBg: buttonDisabledBg ?? this.buttonDisabledBg,
      systemAccent: systemAccent ?? this.systemAccent,
      systemSuccess: systemSuccess ?? this.systemSuccess,
      systemError: systemError ?? this.systemError,
      extraPurple: extraPurple ?? this.extraPurple,
      extraCyan: extraCyan ?? this.extraCyan,
      extraOrange: extraOrange ?? this.extraOrange,
      emptyValueColor: emptyValueColor ?? this.emptyValueColor,
      informationColor: informationColor,
      responseTextColor: responseTextColor,
      sidebarBg: sidebarBg ?? this.sidebarBg,
      sidebarActive: sidebarActive ?? this.sidebarActive,
      sidebarIcon: sidebarIcon ?? this.sidebarIcon,
      systemInfo: systemInfo ?? this.systemInfo,
    );
  }

  @override
  ThemeExtension<ThemeColors> lerp(
    ThemeExtension<ThemeColors>? other,
    double t,
  ) {
    if (other is! ThemeColors) return this;
    return ThemeColors(
      textBrand: Color.lerp(textBrand, other.textBrand, t)!,
      textDefault: Color.lerp(textDefault, other.textDefault, t)!,
      textButtonSecondary: Color.lerp(
        textButtonSecondary,
        other.textButtonSecondary,
        t,
      )!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      textTertiary: Color.lerp(textTertiary, other.textTertiary, t)!,
      textOnBrand: Color.lerp(textOnBrand, other.textOnBrand, t)!,
      textOnBrandDark: Color.lerp(textOnBrandDark, other.textOnBrandDark, t)!,
      iconBrand: Color.lerp(iconBrand, other.iconBrand, t)!,
      iconDefault: Color.lerp(iconDefault, other.iconDefault, t)!,
      iconSecondary: Color.lerp(iconSecondary, other.iconSecondary, t)!,
      iconButtonSecondary: Color.lerp(
        iconButtonSecondary,
        other.iconButtonSecondary,
        t,
      )!,
      iconTertiary: Color.lerp(iconTertiary, other.iconTertiary, t)!,
      iconOnBrand: Color.lerp(iconOnBrand, other.iconOnBrand, t)!,
      iconOnBrandDark: Color.lerp(iconOnBrandDark, other.iconOnBrandDark, t)!,
      bgBrand: Color.lerp(bgBrand, other.bgBrand, t)!,
      bgDefault: Color.lerp(bgDefault, other.bgDefault, t)!,
      bgSecondary: Color.lerp(bgSecondary, other.bgSecondary, t)!,
      bgTritary: Color.lerp(bgTritary, other.bgTritary, t)!,
      bgDefaultTritary: Color.lerp(
        bgDefaultTritary,
        other.bgDefaultTritary,
        t,
      )!,
      bgSecondaryTritary: Color.lerp(
        bgSecondaryTritary,
        other.bgSecondaryTritary,
        t,
      )!,
      bgBottomSheet: Color.lerp(bgBottomSheet, other.bgBottomSheet, t)!,
      borderBrand: Color.lerp(borderBrand, other.borderBrand, t)!,
      border: Color.lerp(border, other.border, t)!,
      buttonBrand: Color.lerp(buttonBrand, other.buttonBrand, t)!,
      buttonBrandSecondary: Color.lerp(
        buttonBrandSecondary,
        other.buttonBrandSecondary,
        t,
      )!,
      buttonSecondary: Color.lerp(buttonSecondary, other.buttonSecondary, t)!,
      buttonDisabledBg: Color.lerp(
        buttonDisabledBg,
        other.buttonDisabledBg,
        t,
      )!,
      systemAccent: Color.lerp(systemAccent, other.systemAccent, t)!,
      systemSuccess: Color.lerp(systemSuccess, other.systemSuccess, t)!,
      systemError: Color.lerp(systemError, other.systemError, t)!,
      extraPurple: Color.lerp(extraPurple, other.extraPurple, t)!,
      extraCyan: Color.lerp(extraCyan, other.extraCyan, t)!,
      extraOrange: Color.lerp(extraOrange, other.extraOrange, t)!,
      emptyValueColor: emptyValueColor,
      informationColor: informationColor,
      responseTextColor: responseTextColor,
      sidebarBg: Color.lerp(sidebarBg, other.sidebarBg, t)!,
      sidebarActive: Color.lerp(sidebarActive, other.sidebarActive, t)!,
      sidebarIcon: Color.lerp(sidebarIcon, other.sidebarIcon, t)!,
      systemInfo: Color.lerp(systemInfo, other.systemInfo, t)!,
    );
  }
}
