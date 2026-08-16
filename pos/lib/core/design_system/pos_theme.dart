import 'package:flutter/material.dart';

import 'pos_dimensions.dart';
import 'pos_typography.dart';

/// POS terminal uchun yuqori kontrastli rang sxemasi.
///
/// Mavjud `AppTheme.lightTheme` saqlanib qoladi (legacy compat).
/// Yangi kod uchun [PosTheme.colors] ishlatiladi.
class PosTheme {
  PosTheme._();

  /// Statik rang palitrasi.
  static const PosColors colors = PosColors._();

  /// Material 3 light theme — POS uchun moslangan.
  ///
  /// Brand: orange #FB6633 (saturation < 80%, Lila ban'ga rioya).
  static ThemeData light() {
    final scheme = ColorScheme.fromSeed(
      seedColor: colors.brand,
      brightness: Brightness.light,
    ).copyWith(
      surface: colors.surface,
      surfaceContainerHighest: colors.surfaceTinted,
      onSurface: colors.textPrimary,
      onSurfaceVariant: colors.textSecondary,
      error: colors.error,
      outline: colors.borderStrong,
      outlineVariant: colors.border,
    );

    final base = ThemeData.from(colorScheme: scheme, useMaterial3: true);

    return base.copyWith(
      scaffoldBackgroundColor: colors.background,
      textTheme: base.textTheme.apply(fontFamily: PosTypography.family),
      primaryTextTheme:
          base.primaryTextTheme.apply(fontFamily: PosTypography.family),

      // ── Button defaults — POS uchun kattaroq ──
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(0, PosDimensions.buttonHeightLg),
          shape: RoundedRectangleBorder(
            borderRadius:
                BorderRadius.circular(PosDimensions.radiusMd),
          ),
          textStyle: const TextStyle(
            fontSize: PosTypography.buttonLg,
            fontWeight: FontWeight.w600,
            fontFamily: PosTypography.family,
            letterSpacing: -0.1,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(0, PosDimensions.buttonHeightMd),
          shape: RoundedRectangleBorder(
            borderRadius:
                BorderRadius.circular(PosDimensions.radiusMd),
          ),
          textStyle: const TextStyle(
            fontSize: PosTypography.buttonMd,
            fontWeight: FontWeight.w600,
            fontFamily: PosTypography.family,
          ),
        ),
      ),

      // ── Input defaults ──
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(PosDimensions.radiusSm),
          borderSide: BorderSide(color: colors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(PosDimensions.radiusSm),
          borderSide: BorderSide(color: colors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(PosDimensions.radiusSm),
          borderSide:
              BorderSide(color: colors.brand, width: PosDimensions.borderActive),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: PosDimensions.l,
          vertical: PosDimensions.m,
        ),
        hintStyle: TextStyle(
          color: colors.textTertiary,
          fontSize: PosTypography.bodyMd,
          fontFamily: PosTypography.family,
        ),
      ),

      dividerColor: colors.border,
    );
  }
}

/// POS terminal uchun moslangan rang palitrasi.
///
/// Tamoyillar:
/// - Kafe yorug'ida ham aniq farqlanadigan kontrast
/// - Bitta accent (orange brand), saturation < 80%
/// - Status ranglari aniq (success/error/warning)
/// - Disabled holatlar opacity 0.5 + grayscale
class PosColors {
  const PosColors._();

  // ── Brand accent ──
  static const Color _brand = Color(0xFFFB6633);
  Color get brand => _brand;
  Color get brandSoft => const Color(0xFFFFEDD5);
  Color get brandStrong => const Color(0xFFEA580C);

  // ── Backgrounds / surfaces ──
  Color get background => const Color(0xFFF8FAFC);
  Color get surface => const Color(0xFFFFFFFF);
  Color get surfaceTinted => const Color(0xFFF1F5F9);

  // ── Text hierarchy ──
  Color get textPrimary => const Color(0xFF0F172A);
  Color get textSecondary => const Color(0xFF64748B);
  Color get textTertiary => const Color(0xFF94A3B8);
  Color get textDisabled => const Color(0xFFCBD5E1);
  Color get textOnBrand => const Color(0xFFFFFFFF);

  // ── Borders ──
  Color get border => const Color(0xFFE2E8F0);
  Color get borderStrong => const Color(0xFFCBD5E1);

  // ── Status ──
  Color get success => const Color(0xFF16A34A);
  Color get successSoft => const Color(0xFFDCFCE7);
  Color get error => const Color(0xFFDC2626);
  Color get errorSoft => const Color(0xFFFEE2E2);
  Color get warning => const Color(0xFFF59E0B);
  Color get warningSoft => const Color(0xFFFEF3C7);
  Color get info => const Color(0xFF6366F1);
  Color get infoSoft => const Color(0xFFEEF2FF);

  // ── Disabled ──
  Color get disabled => const Color(0xFFF1F5F9);
}
