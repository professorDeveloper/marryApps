import 'package:flutter/material.dart';

extension ColorExtensions on Color {
  Color toDarkerColor({double lightnessFactor = 0.6}) {
    final hsl = HSLColor.fromColor(this);
    final darker = hsl.withLightness(
      (hsl.lightness * lightnessFactor).clamp(0.0, 1.0),
    );
    return darker.toColor();
  }

  Color newWithOpacity(double amount) {
    assert(
      amount >= 0.0 && amount <= 1.0,
      "Opacity must be between 0.0 and 1.0",
    );
    final int alpha = (amount * 255).round();
    return withAlpha(alpha);
  }

  Color darken([double amount = .1]) {
    final hsl = HSLColor.fromColor(this);
    return hsl
        .withLightness((hsl.lightness - amount).clamp(0.0, 1.0))
        .toColor();
  }

  Color lighten([double amount = .1]) {
    final hsl = HSLColor.fromColor(this);
    return hsl
        .withLightness((hsl.lightness + amount).clamp(0.0, 1.0))
        .toColor();
  }
}
