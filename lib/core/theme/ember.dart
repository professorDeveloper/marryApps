import 'package:flutter/material.dart';

/// "Ember" — NELLIGA brend-identiteti asosidagi dizayn sistemasi.
///
/// Slate Dawn'dan farqi tamoyilda: bu yerda kontrast baland, yuza deyarli
/// qora, bitta o'tkir to'q-qizil accent va ko'p bo'sh joy. Chuqurlik soya
/// bilan emas, **1px chiziqlar** bilan beriladi.
///
/// Slate Dawn hali ham POS sozlamalar ekranida ishlatiladi — Ember uni
/// almashtirmaydi, yonida yashaydi.
class Ember {
  Ember._();

  // ── Palitra: dark (ofitsiant ilovasining asosiy rejimi) ───────────────────
  static const darkCanvas = Color(0xFF08080A);
  static const darkSurface = Color(0xFF101014);
  static const darkRaised = Color(0xFF17171C);
  static const darkOverlay = Color(0xFF1F1F26);
  static const darkHairline = Color(0xFF24242B);
  static const darkHairlineHi = Color(0xFF33333D);
  static const darkInk = Color(0xFFF2F0EC);
  static const darkInkDim = Color(0xFF9A9AA2);
  static const darkInkFaint = Color(0xFF63636B);
  static const darkAccent = Color(0xFFFF4A1C);
  static const darkAccentHot = Color(0xFFFF6A2C);
  static const darkOnAccent = Color(0xFF0A0A0C);
  static const darkOk = Color(0xFF35C27A);
  static const darkWarn = Color(0xFFE8A33D);
  static const darkBad = Color(0xFFE5484D);

  // ── Palitra: light ────────────────────────────────────────────────────────
  static const lightCanvas = Color(0xFFE8E6E1);
  static const lightSurface = Color(0xFFF2F0EC);
  static const lightRaised = Color(0xFFFFFFFF);
  static const lightOverlay = Color(0xFFFFFFFF);
  static const lightHairline = Color(0xFFD8D5CE);
  static const lightHairlineHi = Color(0xFFC2BEB4);
  static const lightInk = Color(0xFF101014);
  static const lightInkDim = Color(0xFF5A5A62);
  static const lightInkFaint = Color(0xFF8A8A92);

  /// Yorug' fonda kontrast yetarli bo'lishi uchun dark accent'dan to'qroq.
  static const lightAccent = Color(0xFFE13A0C);
  static const lightAccentHot = Color(0xFFC22F06);
  static const lightOnAccent = Color(0xFFFFFFFF);
  static const lightOk = Color(0xFF1E9E5A);
  static const lightWarn = Color(0xFFB7791F);
  static const lightBad = Color(0xFFC0343A);

  // ── Bo'shliq shkalasi ─────────────────────────────────────────────────────
  static const double s4 = 4;
  static const double s8 = 8;
  static const double s12 = 12;
  static const double s16 = 16;
  static const double s24 = 24;
  static const double s32 = 32;
  static const double s48 = 48;
  static const double s64 = 64;

  // ── Radiuslar ─────────────────────────────────────────────────────────────
  static const double rSm = 4; // chip, nuqta, kichik tugma
  static const double rMd = 10; // karta, input, tugma
  static const double rLg = 16; // sheet, dialog

  // ── O'lchamlar ────────────────────────────────────────────────────────────
  /// Planshet yurgan ofitsiant qo'lida — barmoq uchun 52 dp.
  static const double control = 52;

  /// Karta ichidagi kichik amallar (stepper) uchun minimal teginish maydoni.
  static const double hit = 44;

  /// Sarlavha qatori.
  static const double header = 64;

  /// Yuqoridagi mono metama'lumot lentasi.
  static const double metaStrip = 28;

  static const double row = 64;
  static const double hairlineWidth = 1;

  // ── Animatsiya ────────────────────────────────────────────────────────────
  static const Duration fast = Duration(milliseconds: 120);
  static const Duration normal = Duration(milliseconds: 220);
  static const Duration slow = Duration(milliseconds: 400);

  /// "Jonli" nuqtaning bir tsikli.
  static const Duration pulse = Duration(milliseconds: 1400);

  // ── Shriftlar (pubspec.yaml da e'lon qilingan aynan shu nomlar) ───────────
  static const String fontFamily = 'Manrope';
  static const String monoFamily = 'JetBrainsMono';

  /// Pul: mingliklar probel bilan ajratiladi (12 500 000).
  /// Butun songacha yaxlitlanadi — ofitsiantga tiyin kerak emas.
  static String money(num? value) {
    if (value == null) return '0';
    final s = value.round().abs().toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(' ');
      buf.write(s[i]);
    }
    return value < 0 ? '-$buf' : buf.toString();
  }

  static ThemeData dark() => _build(EmberColors.dark);

  static ThemeData light() => _build(EmberColors.light);

  static ThemeData _build(EmberColors c) {
    final type = EmberType(c);
    final textTheme = TextTheme(
      displayMedium: type.display1,
      displaySmall: type.display2,
      headlineSmall: type.display3,
      titleMedium: type.title,
      bodyLarge: type.bodyLg,
      bodyMedium: type.body,
      bodySmall: type.bodySm,
      labelSmall: type.label,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: c.brightness,
      fontFamily: fontFamily,
      extensions: <ThemeExtension<dynamic>>[c],
      scaffoldBackgroundColor: c.surface,
      canvasColor: c.surface,
      splashFactory: InkRipple.splashFactory,
      colorScheme: ColorScheme(
        brightness: c.brightness,
        primary: c.accent,
        onPrimary: c.onAccent,
        secondary: c.accentHot,
        onSecondary: c.onAccent,
        surface: c.raised,
        onSurface: c.ink,
        surfaceContainerHighest: c.overlay,
        onSurfaceVariant: c.inkDim,
        error: c.bad,
        onError: c.onAccent,
        outline: c.hairline,
        outlineVariant: c.hairlineHi,
        shadow: Colors.black,
      ),
      textTheme: textTheme,
      iconTheme: IconThemeData(color: c.inkDim, size: 20),
      dividerTheme: DividerThemeData(
        color: c.hairline,
        thickness: hairlineWidth,
        space: hairlineWidth,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: c.canvas,
        foregroundColor: c.ink,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        toolbarHeight: header,
        centerTitle: false,
        titleTextStyle: type.display3,
        iconTheme: IconThemeData(color: c.ink, size: 22),
        actionsIconTheme: IconThemeData(color: c.inkDim, size: 22),
      ),
      cardTheme: CardThemeData(
        color: c.raised,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(rMd),
          side: BorderSide(color: c.hairline),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: c.accent,
          foregroundColor: c.onAccent,
          disabledBackgroundColor: c.hairline,
          disabledForegroundColor: c.inkFaint,
          elevation: 0,
          minimumSize: const Size(0, control),
          padding: const EdgeInsets.symmetric(horizontal: s24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(rMd),
          ),
          textStyle: const TextStyle(
            fontFamily: fontFamily,
            fontSize: 16,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.16,
          ),
        ).copyWith(
          overlayColor: WidgetStateProperty.resolveWith(
            (s) => s.contains(WidgetState.pressed)
                ? c.onAccent.withValues(alpha: 0.14)
                : null,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: c.ink,
          disabledForegroundColor: c.inkFaint,
          minimumSize: const Size(0, control),
          padding: const EdgeInsets.symmetric(horizontal: s24),
          side: BorderSide(color: c.hairlineHi),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(rMd),
          ),
          textStyle: const TextStyle(
            fontFamily: fontFamily,
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.16,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: c.accent,
          disabledForegroundColor: c.inkFaint,
          minimumSize: const Size(0, hit),
          padding: const EdgeInsets.symmetric(horizontal: s12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(rSm),
          ),
          textStyle: const TextStyle(
            fontFamily: fontFamily,
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.raised,
        constraints: const BoxConstraints(minHeight: control),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: s16,
          vertical: s16,
        ),
        border: _inputBorder(c.hairline),
        enabledBorder: _inputBorder(c.hairline),
        focusedBorder: _inputBorder(c.accent, width: 2),
        errorBorder: _inputBorder(c.bad),
        focusedErrorBorder: _inputBorder(c.bad, width: 2),
        disabledBorder: _inputBorder(c.hairline),
        hintStyle: type.body.copyWith(color: c.inkFaint),
        errorStyle: type.bodySm.copyWith(color: c.bad),
        labelStyle: type.body.copyWith(color: c.inkDim),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: c.overlay,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        titleTextStyle: type.display3,
        contentTextStyle: type.body,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(rLg),
          side: BorderSide(color: c.hairlineHi),
        ),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: c.overlay,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        modalElevation: 0,
        showDragHandle: true,
        dragHandleColor: c.hairlineHi,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(rLg)),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: c.overlay,
        contentTextStyle: type.body,
        actionTextColor: c.accent,
        elevation: 0,
        behavior: SnackBarBehavior.floating,
        insetPadding: const EdgeInsets.all(s16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(rMd),
          side: BorderSide(color: c.hairlineHi),
        ),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: c.accent,
        linearTrackColor: c.hairline,
        circularTrackColor: Colors.transparent,
      ),
      popupMenuTheme: PopupMenuThemeData(
        color: c.overlay,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        textStyle: type.body,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(rMd),
          side: BorderSide(color: c.hairlineHi),
        ),
      ),
      listTileTheme: ListTileThemeData(
        iconColor: c.inkDim,
        textColor: c.ink,
        titleTextStyle: type.body,
        subtitleTextStyle: type.bodySm,
        minVerticalPadding: s12,
      ),
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: c.overlay,
          borderRadius: BorderRadius.circular(rSm),
          border: Border.all(color: c.hairlineHi),
        ),
        textStyle: type.bodySm.copyWith(color: c.ink),
      ),
      splashColor: c.accent.withValues(alpha: 0.08),
      highlightColor: c.accent.withValues(alpha: 0.06),
    );
  }

  static OutlineInputBorder _inputBorder(Color color, {double width = 1}) =>
      OutlineInputBorder(
        borderRadius: BorderRadius.circular(rMd),
        borderSide: BorderSide(color: color, width: width),
      );
}

/// Ember tokenlari. `ThemeData.extensions` orqali beriladi, shuning uchun
/// alohida subtree o'z palitrasini o'rnata oladi (Slate Dawn'da bu mumkin
/// emas edi — u brightness bo'yicha static const o'qirdi).
@immutable
class EmberColors extends ThemeExtension<EmberColors> {
  final Brightness brightness;

  final Color canvas;
  final Color surface;
  final Color raised;
  final Color overlay;
  final Color hairline;
  final Color hairlineHi;
  final Color ink;
  final Color inkDim;
  final Color inkFaint;
  final Color accent;
  final Color accentHot;
  final Color onAccent;
  final Color ok;
  final Color warn;
  final Color bad;

  const EmberColors({
    required this.brightness,
    required this.canvas,
    required this.surface,
    required this.raised,
    required this.overlay,
    required this.hairline,
    required this.hairlineHi,
    required this.ink,
    required this.inkDim,
    required this.inkFaint,
    required this.accent,
    required this.accentHot,
    required this.onAccent,
    required this.ok,
    required this.warn,
    required this.bad,
  });

  static const dark = EmberColors(
    brightness: Brightness.dark,
    canvas: Ember.darkCanvas,
    surface: Ember.darkSurface,
    raised: Ember.darkRaised,
    overlay: Ember.darkOverlay,
    hairline: Ember.darkHairline,
    hairlineHi: Ember.darkHairlineHi,
    ink: Ember.darkInk,
    inkDim: Ember.darkInkDim,
    inkFaint: Ember.darkInkFaint,
    accent: Ember.darkAccent,
    accentHot: Ember.darkAccentHot,
    onAccent: Ember.darkOnAccent,
    ok: Ember.darkOk,
    warn: Ember.darkWarn,
    bad: Ember.darkBad,
  );

  static const light = EmberColors(
    brightness: Brightness.light,
    canvas: Ember.lightCanvas,
    surface: Ember.lightSurface,
    raised: Ember.lightRaised,
    overlay: Ember.lightOverlay,
    hairline: Ember.lightHairline,
    hairlineHi: Ember.lightHairlineHi,
    ink: Ember.lightInk,
    inkDim: Ember.lightInkDim,
    inkFaint: Ember.lightInkFaint,
    accent: Ember.lightAccent,
    accentHot: Ember.lightAccentHot,
    onAccent: Ember.lightOnAccent,
    ok: Ember.lightOk,
    warn: Ember.lightWarn,
    bad: Ember.lightBad,
  );

  @override
  EmberColors copyWith({
    Brightness? brightness,
    Color? canvas,
    Color? surface,
    Color? raised,
    Color? overlay,
    Color? hairline,
    Color? hairlineHi,
    Color? ink,
    Color? inkDim,
    Color? inkFaint,
    Color? accent,
    Color? accentHot,
    Color? onAccent,
    Color? ok,
    Color? warn,
    Color? bad,
  }) {
    return EmberColors(
      brightness: brightness ?? this.brightness,
      canvas: canvas ?? this.canvas,
      surface: surface ?? this.surface,
      raised: raised ?? this.raised,
      overlay: overlay ?? this.overlay,
      hairline: hairline ?? this.hairline,
      hairlineHi: hairlineHi ?? this.hairlineHi,
      ink: ink ?? this.ink,
      inkDim: inkDim ?? this.inkDim,
      inkFaint: inkFaint ?? this.inkFaint,
      accent: accent ?? this.accent,
      accentHot: accentHot ?? this.accentHot,
      onAccent: onAccent ?? this.onAccent,
      ok: ok ?? this.ok,
      warn: warn ?? this.warn,
      bad: bad ?? this.bad,
    );
  }

  @override
  EmberColors lerp(covariant EmberColors? other, double t) {
    if (other == null) return this;
    Color c(Color a, Color b) => Color.lerp(a, b, t) ?? a;
    return EmberColors(
      brightness: t < 0.5 ? brightness : other.brightness,
      canvas: c(canvas, other.canvas),
      surface: c(surface, other.surface),
      raised: c(raised, other.raised),
      overlay: c(overlay, other.overlay),
      hairline: c(hairline, other.hairline),
      hairlineHi: c(hairlineHi, other.hairlineHi),
      ink: c(ink, other.ink),
      inkDim: c(inkDim, other.inkDim),
      inkFaint: c(inkFaint, other.inkFaint),
      accent: c(accent, other.accent),
      accentHot: c(accentHot, other.accentHot),
      onAccent: c(onAccent, other.onAccent),
      ok: c(ok, other.ok),
      warn: c(warn, other.warn),
      bad: c(bad, other.bad),
    );
  }
}

/// Tipografika ladder'i. Ekranlar hech qachon `TextStyle` ni qo'lda
/// yozmasligi kerak — hammasi shu yerdan.
@immutable
class EmberType {
  final EmberColors c;

  const EmberType(this.c);

  static EmberType of(BuildContext context) => EmberType(context.em);

  // ── Display — Manrope 700, -0.02em ───────────────────────────────────────
  TextStyle get display1 => _display(34);
  TextStyle get display2 => _display(28);
  TextStyle get display3 => _display(22);

  TextStyle _display(double size) => TextStyle(
        fontFamily: Ember.fontFamily,
        fontSize: size,
        fontWeight: FontWeight.w700,
        letterSpacing: size * -0.02,
        height: 1.12,
        color: c.ink,
      );

  /// Bo'lim sarlavhasi.
  TextStyle get title => TextStyle(
        fontFamily: Ember.fontFamily,
        fontSize: 17,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.34,
        height: 1.2,
        color: c.ink,
      );

  // ── Body ─────────────────────────────────────────────────────────────────
  TextStyle get bodyLg => TextStyle(
        fontFamily: Ember.fontFamily,
        fontSize: 16,
        fontWeight: FontWeight.w500,
        height: 1.35,
        color: c.ink,
      );

  TextStyle get body => TextStyle(
        fontFamily: Ember.fontFamily,
        fontSize: 14.5,
        fontWeight: FontWeight.w500,
        height: 1.4,
        color: c.ink,
      );

  TextStyle get bodySm => TextStyle(
        fontFamily: Ember.fontFamily,
        fontSize: 14.5,
        fontWeight: FontWeight.w400,
        height: 1.4,
        color: c.inkDim,
      );

  TextStyle get bodyFaint => bodySm.copyWith(color: c.inkFaint);

  // ── Label — burchakdagi mono mikro-yozuvlar ──────────────────────────────
  /// Matnni UPPERCASE ga aylantirish chaqiruvchi zimmasida (`.toUpperCase()`).
  TextStyle get label => TextStyle(
        fontFamily: Ember.monoFamily,
        fontSize: 11,
        fontWeight: FontWeight.w600,
        letterSpacing: 1.4,
        height: 1.2,
        color: c.inkDim,
      );

  TextStyle get labelFaint => label.copyWith(color: c.inkFaint);
  TextStyle get labelInk => label.copyWith(color: c.ink);
  TextStyle get labelAccent => label.copyWith(color: c.accent);

  // ── Numeric — har bir narx, stol raqami, miqdor ──────────────────────────
  TextStyle numeric({
    double size = 16,
    Color? color,
    FontWeight weight = FontWeight.w600,
    double? letterSpacing,
  }) =>
      TextStyle(
        fontFamily: Ember.monoFamily,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: letterSpacing ?? size * -0.01,
        height: 1.1,
        color: color ?? c.ink,
      );

  /// Katta raqam (stol raqami, jami summa).
  TextStyle get numericLg => numeric(size: 28);
  TextStyle get numericMd => numeric(size: 20);
  TextStyle get numericSm => numeric(size: 13, color: c.inkDim);
}

extension EmberContext on BuildContext {
  /// Ember ranglari. Theme extension'dan o'qiladi, topilmasa brightness
  /// bo'yicha zaxira palitra.
  EmberColors get em {
    final theme = Theme.of(this);
    return theme.extension<EmberColors>() ??
        (theme.brightness == Brightness.dark
            ? EmberColors.dark
            : EmberColors.light);
  }

  /// Tipografika: `context.emText.body`, `context.emText.numeric(size: 24)`.
  EmberType get emText => EmberType(em);
}
