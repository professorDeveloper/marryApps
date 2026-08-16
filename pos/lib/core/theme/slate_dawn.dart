import 'package:flutter/material.dart';

/// "Slate Dawn" — Mary Ai dizayn sistemasi, `frontend/style.md` v1.0 dan
/// Flutter'ga ko'chirilgan.
///
/// Palitra, chuqurlik zinapoyasi (Z −1…3), radiuslar va tipografika ladder'i
/// aynan admin paneldagidek. **Bitta ataylab qilingan farq bor:** style.md
/// tugma/inputlar uchun 36 px beradi — bu sichqoncha uchun mo'ljallangan
/// o'lcham. Ofitsiant ilovasi planshetda barmoq bilan ishlaydi, shuning uchun
/// interaktiv elementlar 48 dp gacha kattalashtirilgan (Material minimal
/// teginish maydoni). Ranglar, radiuslar va shrift o'lchamlari o'zgarmagan —
/// ilova admin panel bilan bir xil ko'rinadi.
class SlateDawn {
  SlateDawn._();

  // ── Chuqurlik zinapoyasi: dark ────────────────────────────────────────────
  static const darkSidebarBg = Color(0xFF15181F); // Z −1
  static const darkBg = Color(0xFF1A1D24); // Z  0
  static const darkSurface = Color(0xFF1F222B); // Z  1
  static const darkSurface2 = Color(0xFF262A33); // Z  2
  static const darkHover = Color(0xFF232631);
  static const darkBorder = Color(0xFF262A33);
  static const darkBorderStrong = Color(0xFF323540);

  static const darkText = Color(0xFFECE9E2);
  static const darkText2 = Color(0xFFA6A399);
  static const darkText3 = Color(0xFF6E6B62);
  static const darkText4 = Color(0xFF45433C);

  static const darkAccent = Color(0xFFFF8956); // Z 3
  static const darkAccentFg = Color(0xFF1A1D24);

  static const darkSuccess = Color(0xFF4ADE80);
  static const darkWarning = Color(0xFFFBBF24);
  static const darkDanger = Color(0xFFF87171);

  // ── Chuqurlik zinapoyasi: light ───────────────────────────────────────────
  static const lightSidebarBg = Color(0xFFEDE9DF); // Z −1
  static const lightBg = Color(0xFFF6F4EE); // Z  0
  static const lightSurface = Color(0xFFFBFAF6); // Z  1
  static const lightSurface2 = Color(0xFFEDE9DF); // Z  2
  static const lightHover = Color(0xFFEFECE4);
  static const lightBorder = Color(0xFFE4E0D4);
  static const lightBorderStrong = Color(0xFFD2CDB9);

  static const lightText = Color(0xFF20232B);
  static const lightText2 = Color(0xFF5E5F68);
  static const lightText3 = Color(0xFF8A8A93);
  static const lightText4 = Color(0xFFBCBCC3);

  static const lightAccent = Color(0xFFC9521B); // Z 3
  static const lightAccentFg = Color(0xFFFBFAF6);

  static const lightSuccess = Color(0xFF2F9E44);
  static const lightWarning = Color(0xFFB6781B);
  static const lightDanger = Color(0xFFC83333);

  // ── Bo'shliq shkalasi — hammasi 4 ga karrali ──────────────────────────────
  static const double spaceXs = 4;
  static const double spaceSm = 8;
  static const double spaceMd = 16;
  static const double spaceLg = 28;
  static const double spaceXl = 40;
  static const double space2xl = 64;

  // ── Radius — uchtadan boshqasi yo'q ───────────────────────────────────────
  static const double radiusSm = 4; // chiplar, nuqtalar
  static const double radius = 6; // tugmalar, inputlar
  static const double radiusLg = 8; // kartalar, modallar

  // ── Balandliklar (planshet uchun moslashtirilgan) ─────────────────────────
  /// style.md: 36 px. Planshetda barmoq uchun 48 dp.
  static const double controlHeight = 48;

  /// style.md: 28 px (jadval ichidagi kichik amallar).
  static const double controlHeightSm = 40;

  /// style.md: 64 px.
  static const double topbarHeight = 64;

  /// Ro'yxat qatori — style.md "comfortable" 52 px dan planshet uchun 64 dp.
  static const double rowHeight = 64;

  // ── Shriftlar ─────────────────────────────────────────────────────────────
  static const String fontFamily = 'Manrope';
  static const String monoFamily = 'JetBrainsMono';

  static ThemeData dark() => _build(
        brightness: Brightness.dark,
        bg: darkBg,
        surface: darkSurface,
        surface2: darkSurface2,
        border: darkBorder,
        text: darkText,
        text2: darkText2,
        text3: darkText3,
        accent: darkAccent,
        accentFg: darkAccentFg,
        danger: darkDanger,
      );

  static ThemeData light() => _build(
        brightness: Brightness.light,
        bg: lightBg,
        surface: lightSurface,
        surface2: lightSurface2,
        border: lightBorder,
        text: lightText,
        text2: lightText2,
        text3: lightText3,
        accent: lightAccent,
        accentFg: lightAccentFg,
        danger: lightDanger,
      );

  static ThemeData _build({
    required Brightness brightness,
    required Color bg,
    required Color surface,
    required Color surface2,
    required Color border,
    required Color text,
    required Color text2,
    required Color text3,
    required Color accent,
    required Color accentFg,
    required Color danger,
  }) {
    // Tipografika ladder — style.md §10. O'lchamlar o'zgarmagan.
    final textTheme = TextTheme(
      // H1 — sahifa sarlavhasi, sahifada bitta.
      headlineSmall: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.5, // -0.025em
        color: text,
      ),
      // H2 — bo'lim.
      titleMedium: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.32, // -0.02em
        color: text,
      ),
      // Body — standart.
      bodyMedium: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        letterSpacing: -0.07, // -0.005em
        color: text,
      ),
      // Small — yordamchi matn.
      bodySmall: TextStyle(
        fontSize: 12.5,
        fontWeight: FontWeight.w500,
        color: text2,
      ),
      // Label — UPPERCASE eyebrow.
      labelSmall: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.88, // +0.08em
        color: text3,
      ),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      fontFamily: fontFamily,
      extensions: <ThemeExtension<dynamic>>[
        brightness == Brightness.dark
            ? SlateDawnColors.dark
            : SlateDawnColors.light,
      ],
      scaffoldBackgroundColor: bg,
      canvasColor: bg,
      colorScheme: ColorScheme.fromSeed(
        seedColor: accent,
        brightness: brightness,
      ).copyWith(
        surface: surface,
        primary: accent,
        onPrimary: accentFg,
        error: danger,
      ),
      textTheme: textTheme,
      dividerTheme: DividerThemeData(color: border, thickness: 1, space: 1),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusLg),
          side: BorderSide(color: border),
        ),
        margin: EdgeInsets.zero,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: bg,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        toolbarHeight: topbarHeight,
        titleTextStyle: textTheme.headlineSmall,
        iconTheme: IconThemeData(color: text2),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accent,
          foregroundColor: accentFg,
          elevation: 0,
          minimumSize: const Size(0, controlHeight),
          padding: const EdgeInsets.symmetric(horizontal: 20),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            fontFamily: fontFamily,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          backgroundColor: surface2,
          foregroundColor: text,
          minimumSize: const Size(0, controlHeight),
          padding: const EdgeInsets.symmetric(horizontal: 20),
          side: BorderSide(color: border),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w500,
            fontFamily: fontFamily,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: text2,
          minimumSize: const Size(0, controlHeight),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: spaceMd,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: BorderSide(color: border),
        ),
        // Fokusda accent + 3px yumshoq halqa (style.md §5).
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: BorderSide(color: accent),
        ),
        hintStyle: TextStyle(color: text3, fontSize: 14),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: surface2,
        side: BorderSide(color: border),
        labelStyle: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: text,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: surface2,
        contentTextStyle: TextStyle(color: text, fontSize: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
        ),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

/// Mavzuga bog'liq ranglarni bitta joydan olish uchun.
/// `ThemeData` da o'rni bo'lmagan tokenlar (Z −1, text-3, status ranglari)
/// shu extension orqali beriladi.
@immutable
class SlateDawnColors extends ThemeExtension<SlateDawnColors> {
  final Color sidebarBg;
  final Color surface2;
  final Color hover;
  final Color border;
  final Color borderStrong;
  final Color text2;
  final Color text3;
  final Color text4;
  final Color accent;
  final Color accentFg;
  final Color success;
  final Color warning;
  final Color danger;

  const SlateDawnColors({
    required this.sidebarBg,
    required this.surface2,
    required this.hover,
    required this.border,
    required this.borderStrong,
    required this.text2,
    required this.text3,
    required this.text4,
    required this.accent,
    required this.accentFg,
    required this.success,
    required this.warning,
    required this.danger,
  });

  static const dark = SlateDawnColors(
    sidebarBg: SlateDawn.darkSidebarBg,
    surface2: SlateDawn.darkSurface2,
    hover: SlateDawn.darkHover,
    border: SlateDawn.darkBorder,
    borderStrong: SlateDawn.darkBorderStrong,
    text2: SlateDawn.darkText2,
    text3: SlateDawn.darkText3,
    text4: SlateDawn.darkText4,
    accent: SlateDawn.darkAccent,
    accentFg: SlateDawn.darkAccentFg,
    success: SlateDawn.darkSuccess,
    warning: SlateDawn.darkWarning,
    danger: SlateDawn.darkDanger,
  );

  static const light = SlateDawnColors(
    sidebarBg: SlateDawn.lightSidebarBg,
    surface2: SlateDawn.lightSurface2,
    hover: SlateDawn.lightHover,
    border: SlateDawn.lightBorder,
    borderStrong: SlateDawn.lightBorderStrong,
    text2: SlateDawn.lightText2,
    text3: SlateDawn.lightText3,
    text4: SlateDawn.lightText4,
    accent: SlateDawn.lightAccent,
    accentFg: SlateDawn.lightAccentFg,
    success: SlateDawn.lightSuccess,
    warning: SlateDawn.lightWarning,
    danger: SlateDawn.lightDanger,
  );

  @override
  ThemeExtension<SlateDawnColors> copyWith() => this;

  @override
  ThemeExtension<SlateDawnColors> lerp(
    ThemeExtension<SlateDawnColors>? other,
    double t,
  ) =>
      this;
}

extension SlateDawnContext on BuildContext {
  SlateDawnColors get sd => Theme.of(this).brightness == Brightness.dark
      ? SlateDawnColors.dark
      : SlateDawnColors.light;
}
