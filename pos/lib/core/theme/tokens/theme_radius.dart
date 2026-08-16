import 'package:flutter/material.dart';

class ThemeRadius extends ThemeExtension<ThemeRadius> {
  final BorderRadius buttonSm;
  final BorderRadius buttonMd;
  final BorderRadius buttonLg;
  final BorderRadius buttonXl;

  final BorderRadius cardInner;
  final BorderRadius card;
  final BorderRadius card20;
  final BorderRadius card24;

  final BorderRadius bottomSheet;
  final BorderRadius topBar;
  final BorderRadius segmentedControl;

  //other radius
  final BorderRadius infoRadius;

  const ThemeRadius({
    required this.buttonSm,
    required this.buttonMd,
    required this.buttonLg,
    required this.buttonXl,
    required this.cardInner,
    required this.card,
    required this.card20,
    required this.card24,
    required this.bottomSheet,
    required this.topBar,
    required this.segmentedControl,
    required this.infoRadius,
  });

  @override
  ThemeRadius copyWith({
    BorderRadius? buttonSm,
    BorderRadius? buttonMd,
    BorderRadius? buttonLg,
    BorderRadius? buttonXl,
    BorderRadius? cardInner,
    BorderRadius? card,
    BorderRadius? card20,
    BorderRadius? card24,
    BorderRadius? bottomSheet,
    BorderRadius? topBar,
    BorderRadius? segmentedControl,
  }) {
    return ThemeRadius(
      buttonSm: buttonSm ?? this.buttonSm,
      buttonMd: buttonMd ?? this.buttonMd,
      buttonLg: buttonLg ?? this.buttonLg,
      buttonXl: buttonXl ?? this.buttonXl,
      cardInner: cardInner ?? this.cardInner,
      card: card ?? this.card,
      card20: card20 ?? this.card20,
      card24: card24 ?? this.card24,
      bottomSheet: bottomSheet ?? this.bottomSheet,
      topBar: topBar ?? this.topBar,
      segmentedControl: segmentedControl ?? this.segmentedControl,
      infoRadius: infoRadius,
    );
  }

  @override
  ThemeRadius lerp(ThemeExtension<ThemeRadius>? other, double t) {
    if (other is! ThemeRadius) return this;
    return ThemeRadius(
      buttonSm: BorderRadius.lerp(buttonSm, other.buttonSm, t)!,
      buttonMd: BorderRadius.lerp(buttonMd, other.buttonMd, t)!,
      buttonLg: BorderRadius.lerp(buttonLg, other.buttonLg, t)!,
      buttonXl: BorderRadius.lerp(buttonXl, other.buttonXl, t)!,
      cardInner: BorderRadius.lerp(cardInner, other.cardInner, t)!,
      card: BorderRadius.lerp(card, other.card, t)!,
      card20: BorderRadius.lerp(card20, other.card20, t)!,
      card24: BorderRadius.lerp(card24, other.card24, t)!,
      bottomSheet: BorderRadius.lerp(bottomSheet, other.bottomSheet, t)!,
      topBar: BorderRadius.lerp(topBar, other.topBar, t)!,
      segmentedControl: BorderRadius.lerp(
        segmentedControl,
        other.segmentedControl,
        t,
      )!,
      infoRadius: infoRadius,
    );
  }
}
