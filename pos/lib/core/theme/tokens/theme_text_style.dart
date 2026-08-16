import 'package:flutter/material.dart';

@immutable
class ThemeTextStyle extends ThemeExtension<ThemeTextStyle> {
  final String fontFamily;

  // Display
  final TextStyle displayXl;
  final TextStyle displayLg;

  // Heading
  final TextStyle headingMd;
  final TextStyle headingSm;

  // Body
  final TextStyle bodyLg;
  final TextStyle bodyMd;
  final TextStyle bodySm;

  // Utility
  final TextStyle caption;
  final TextStyle badgeText;

  // Interaction
  final TextStyle buttonText;
  final TextStyle linkText;

  // Extra Bold Variants
  final TextStyle bold14;
  final TextStyle bold16;
  final TextStyle bold18;
  final TextStyle bold20;
  final TextStyle bold24;

  // Extra Semibold Variants
  final TextStyle semibold14;
  final TextStyle semibold16;
  final TextStyle semibold18;
  final TextStyle semibold20;
  final TextStyle semibold24;

  // Title
  final TextStyle title14;

  const ThemeTextStyle({
    required this.fontFamily,
    required this.displayXl,
    required this.displayLg,
    required this.headingMd,
    required this.headingSm,
    required this.bodyLg,
    required this.bodyMd,
    required this.bodySm,
    required this.caption,
    required this.badgeText,
    required this.buttonText,
    required this.linkText,
    required this.bold14,
    required this.bold16,
    required this.bold18,
    required this.bold20,
    required this.bold24,
    required this.semibold14,
    required this.semibold16,
    required this.semibold18,
    required this.semibold20,
    required this.semibold24,
    required this.title14,
  });

  @override
  ThemeTextStyle copyWith({
    String? fontFamily,
    TextStyle? displayXl,
    TextStyle? displayLg,
    TextStyle? headingMd,
    TextStyle? headingSm,
    TextStyle? bodyLg,
    TextStyle? bodyMd,
    TextStyle? bodySm,
    TextStyle? caption,
    TextStyle? badgeText,
    TextStyle? buttonText,
    TextStyle? linkText,
    TextStyle? bold14,
    TextStyle? bold16,
    TextStyle? bold18,
    TextStyle? bold20,
    TextStyle? bold24,
    TextStyle? semibold14,
    TextStyle? semibold16,
    TextStyle? semibold18,
    TextStyle? semibold20,
    TextStyle? semibold24,
  }) {
    return ThemeTextStyle(
      fontFamily: fontFamily ?? this.fontFamily,
      displayXl: displayXl ?? this.displayXl,
      displayLg: displayLg ?? this.displayLg,
      headingMd: headingMd ?? this.headingMd,
      headingSm: headingSm ?? this.headingSm,
      bodyLg: bodyLg ?? this.bodyLg,
      bodyMd: bodyMd ?? this.bodyMd,
      bodySm: bodySm ?? this.bodySm,
      caption: caption ?? this.caption,
      badgeText: badgeText ?? this.badgeText,
      buttonText: buttonText ?? this.buttonText,
      linkText: linkText ?? this.linkText,
      bold14: bold14 ?? this.bold14,
      bold16: bold16 ?? this.bold16,
      bold18: bold18 ?? this.bold18,
      bold20: bold20 ?? this.bold20,
      bold24: bold24 ?? this.bold24,
      semibold14: semibold14 ?? this.semibold14,
      semibold16: semibold16 ?? this.semibold16,
      semibold18: semibold18 ?? this.semibold18,
      semibold20: semibold20 ?? this.semibold20,
      semibold24: semibold24 ?? this.semibold24,
      title14: title14,
    );
  }

  @override
  ThemeTextStyle lerp(ThemeExtension<ThemeTextStyle>? other, double t) {
    if (other is! ThemeTextStyle) return this;
    return ThemeTextStyle(
      fontFamily: fontFamily,
      displayXl: TextStyle.lerp(displayXl, other.displayXl, t)!,
      displayLg: TextStyle.lerp(displayLg, other.displayLg, t)!,
      headingMd: TextStyle.lerp(headingMd, other.headingMd, t)!,
      headingSm: TextStyle.lerp(headingSm, other.headingSm, t)!,
      bodyLg: TextStyle.lerp(bodyLg, other.bodyLg, t)!,
      bodyMd: TextStyle.lerp(bodyMd, other.bodyMd, t)!,
      bodySm: TextStyle.lerp(bodySm, other.bodySm, t)!,
      caption: TextStyle.lerp(caption, other.caption, t)!,
      badgeText: TextStyle.lerp(badgeText, other.badgeText, t)!,
      buttonText: TextStyle.lerp(buttonText, other.buttonText, t)!,
      linkText: TextStyle.lerp(linkText, other.linkText, t)!,
      bold14: TextStyle.lerp(bold14, other.bold14, t)!,
      bold16: TextStyle.lerp(bold16, other.bold16, t)!,
      bold18: TextStyle.lerp(bold18, other.bold18, t)!,
      bold20: TextStyle.lerp(bold20, other.bold20, t)!,
      bold24: TextStyle.lerp(bold24, other.bold24, t)!,
      semibold14: TextStyle.lerp(semibold14, other.semibold14, t)!,
      semibold16: TextStyle.lerp(semibold16, other.semibold16, t)!,
      semibold18: TextStyle.lerp(semibold18, other.semibold18, t)!,
      semibold20: TextStyle.lerp(semibold20, other.semibold20, t)!,
      semibold24: TextStyle.lerp(semibold24, other.semibold24, t)!,
      title14: title14,
    );
  }
}
