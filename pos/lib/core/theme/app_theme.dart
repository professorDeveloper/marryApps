import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/theme/tokens/theme_colors.dart';
import 'package:mary_ai_pos/core/theme/tokens/theme_radius.dart';
import 'package:mary_ai_pos/core/theme/tokens/theme_text_style.dart';

class AppTheme {
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,

    fontFamily: 'Inter',

    // 🔹 Main colors
    primaryColor: _lightColors.textBrand,
    scaffoldBackgroundColor: _lightColors.bgSecondary,

    // 🔹 Material ColorScheme
    colorScheme: ColorScheme(
      brightness: Brightness.light,
      primary: _lightColors.textBrand,
      onPrimary: _lightColors.textOnBrand,
      secondary: _lightColors.bgSecondary,
      onSecondary: _lightColors.textDefault,
      error: _lightColors.systemError,
      onError: _lightColors.textOnBrand,
      background: _lightColors.bgDefault,
      onBackground: _lightColors.textDefault,
      surface: _lightColors.bgSecondary,
      onSurface: _lightColors.textDefault,
    ),

    // 🔹 AppBar
    appBarTheme: AppBarTheme(
      backgroundColor: _lightColors.bgDefault,
      foregroundColor: _lightColors.textDefault,
      elevation: 0,
      centerTitle: true,
      iconTheme: IconThemeData(color: _lightColors.iconDefault),
      titleTextStyle: _lightTextStyles.headingMd,
    ),

    // 🔹 BottomNavigationBar
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: _lightColors.bgSecondary,
      selectedItemColor: _lightColors.textBrand,
      unselectedItemColor: _lightColors.iconSecondary,
      showUnselectedLabels: true,
    ),

    // 🔹 Buttons
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: _lightColors.textBrand,
        foregroundColor: _lightColors.textOnBrand,
        textStyle: _lightTextStyles.buttonText,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: _lightColors.textBrand,
        textStyle: _lightTextStyles.linkText,
      ),
    ),

    // 🔹 Input (TextField)
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: _lightColors.bgSecondary,
      hintStyle: _lightTextStyles.bodySm.copyWith(
        color: _lightColors.textTertiary,
      ),
      enabledBorder: OutlineInputBorder(
        borderSide: BorderSide(color: _lightColors.border),
        borderRadius: BorderRadius.circular(12),
      ),
      focusedBorder: OutlineInputBorder(
        borderSide: BorderSide(color: _lightColors.textBrand),
        borderRadius: BorderRadius.circular(12),
      ),
      errorBorder: OutlineInputBorder(
        borderSide: BorderSide(color: _lightColors.systemError),
        borderRadius: BorderRadius.circular(12),
      ),
    ),

    // 🔹 Divider
    dividerTheme: DividerThemeData(color: _lightColors.border, thickness: 1),

    // 🔹 Chip
    chipTheme: ChipThemeData(
      backgroundColor: _lightColors.buttonSecondary,
      selectedColor: _lightColors.textSecondary,
      disabledColor: _lightColors.buttonDisabledBg,
      labelStyle: _lightTextStyles.bodySm,
      secondaryLabelStyle: _lightTextStyles.bodySm,
    ),

    // 🔹 Scrollbar — kiosk: always visible, thick thumb
    scrollbarTheme: ScrollbarThemeData(
      thumbVisibility: WidgetStateProperty.all(true),
      trackVisibility: WidgetStateProperty.all(true),
      thickness: WidgetStateProperty.all(6),
      radius: const Radius.circular(4),
      thumbColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.dragged)) {
          return const Color(0xFFFB6633);
        }
        if (states.contains(WidgetState.hovered)) {
          return const Color(0xFFCBD5E1);
        }
        return const Color(0xFFCBD5E1);
      }),
      trackColor: WidgetStateProperty.all(const Color(0xFFF1F5F9)),
      trackBorderColor: WidgetStateProperty.all(Colors.transparent),
      crossAxisMargin: 2,
      mainAxisMargin: 4,
    ),

    // 🔹 Extensions (custom)
    extensions: <ThemeExtension<dynamic>>[
      _lightColors,
      _lightTextStyles,
      _radius,
    ],
  );

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    fontFamily: 'Inter',
    primaryColor: _darkColors.textBrand,
    scaffoldBackgroundColor: _darkColors.bgSecondary,
    colorScheme: ColorScheme(
      brightness: Brightness.dark,
      primary: _darkColors.textBrand,
      onPrimary: _darkColors.textOnBrand,
      secondary: _darkColors.bgSecondary,
      onSecondary: _darkColors.textDefault,
      error: _darkColors.systemError,
      onError: _darkColors.textOnBrand,
      background: _darkColors.bgDefault,
      onBackground: _darkColors.textDefault,
      surface: _darkColors.bgSecondary,
      onSurface: _darkColors.textDefault,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: _darkColors.bgDefault,
      foregroundColor: _darkColors.textDefault,
      elevation: 0,
      centerTitle: true,
      iconTheme: IconThemeData(color: _darkColors.iconDefault),
      titleTextStyle: _darkTextStyles.headingMd,
    ),
    dividerTheme: DividerThemeData(color: _darkColors.border, thickness: 1),
    scrollbarTheme: ScrollbarThemeData(
      thumbVisibility: WidgetStateProperty.all(true),
      trackVisibility: WidgetStateProperty.all(true),
      thickness: WidgetStateProperty.all(6),
      radius: const Radius.circular(4),
      thumbColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.dragged)) {
          return const Color(0xFFFB6633);
        }
        return const Color(0xFF3F4046);
      }),
      trackColor: WidgetStateProperty.all(const Color(0xFF25272B)),
      trackBorderColor: WidgetStateProperty.all(Colors.transparent),
      crossAxisMargin: 2,
      mainAxisMargin: 4,
    ),
    extensions: <ThemeExtension<dynamic>>[
      _darkColors,
      _darkTextStyles,
      _radius,
    ],
  );

  /// Radiuses
  static const _radius = ThemeRadius(
    buttonSm: BorderRadius.all(Radius.circular(9)),
    buttonMd: BorderRadius.all(Radius.circular(12)),
    buttonLg: BorderRadius.all(Radius.circular(16)),
    buttonXl: BorderRadius.all(Radius.circular(18)),
    cardInner: BorderRadius.all(Radius.circular(14)),
    card: BorderRadius.all(Radius.circular(16)),
    card24: BorderRadius.all(Radius.circular(24)),
    card20: BorderRadius.all(Radius.circular(20)),
    bottomSheet: BorderRadius.vertical(top: Radius.circular(20)),
    topBar: BorderRadius.vertical(bottom: Radius.circular(24)),
    segmentedControl: BorderRadius.all(Radius.circular(100)),
    infoRadius: BorderRadius.all(Radius.circular(59)),
  );

  /// Light colors — slate/orange palette (Mary AI POS redesign)
  static const _lightColors = ThemeColors(
    textBrand: Color(0xFFFB6633),          // orange-500
    textDefault: Color(0xFF0F172A),         // slate-900
    textButtonSecondary: Color(0xFF0F172A),
    textSecondary: Color(0xFF64748B),       // slate-500
    textTertiary: Color(0xFF94A3B8),        // slate-400
    textOnBrand: Color(0xFFFFFFFF),
    textOnBrandDark: Color(0xFF0F172A),
    emptyValueColor: Color(0xFFCBD5E1),     // slate-300

    iconBrand: Color(0xFFFB6633),
    iconDefault: Color(0xFF0F172A),
    iconSecondary: Color(0xFF64748B),
    iconButtonSecondary: Color(0xFF0F172A),
    iconTertiary: Color(0xFF94A3B8),
    iconOnBrand: Color(0xFFFFFFFF),
    iconOnBrandDark: Color(0xFF0F172A),

    bgBrand: Color(0xFFFB6633),
    bgDefault: Color(0xFFFFFFFF),
    bgSecondary: Color(0xFFF8FAFC),         // slate-50
    bgTritary: Color(0xFFF1F5F9),           // slate-100
    bgDefaultTritary: Color(0xFFF8FAFC),
    bgSecondaryTritary: Color(0xFFFFFFFF),
    bgBottomSheet: Color(0x800F172A),

    borderBrand: Color(0xFFFB6633),
    border: Color(0xFFE2E8F0),              // slate-200

    buttonBrand: Color(0xFFFB6633),         // orange primary button
    buttonBrandSecondary: Color(0xFFFFF3EE), // orange-50
    buttonSecondary: Color(0xFFF8FAFC),
    buttonDisabledBg: Color(0xFFF1F5F9),

    systemAccent: Color(0xFFF59E0B),        // amber-500
    systemSuccess: Color(0xFF16A34A),       // green-600
    systemError: Color(0xFFDC2626),         // red-600

    extraPurple: Color(0xFFFB6633),         // orange (reused as accent)
    extraCyan: Color(0xFF0EA5E9),           // sky-500
    extraOrange: Color(0xFFF97316),         // orange-500

    informationColor: Color(0xFFF59E0B),
    responseTextColor: Color(0xFF16A34A),
    sidebarBg: Color(0xFF0F172A),           // slate-900
    sidebarActive: Color(0x1AFB6633),       // orange 10%
    sidebarIcon: Color(0xFF64748B),         // slate-500
    systemInfo: Color(0xFF2563EB),          // blue-600
  );

  /// Light text styles
  static final _lightTextStyles = ThemeTextStyle(
    fontFamily: "Inter",
    displayXl: TextStyle(
      fontSize: 32,
      fontWeight: FontWeight.bold,
      height: 40 / 32,
      color: _lightColors.textDefault,
    ),
    displayLg: TextStyle(
      fontSize: 28,
      fontWeight: FontWeight.bold,
      height: 36 / 28,
      color: _lightColors.textDefault,
    ),
    headingMd: TextStyle(
      fontSize: 24,
      fontWeight: FontWeight.w600,
      height: 32 / 24,
      color: _lightColors.textDefault,
    ),
    headingSm: TextStyle(
      fontSize: 20,
      fontWeight: FontWeight.w600,
      height: 28 / 20,
      color: _lightColors.textDefault,
    ),
    bodyLg: TextStyle(
      fontSize: 18,
      fontWeight: FontWeight.normal,
      height: 26 / 18,
      color: _lightColors.textSecondary,
    ),
    bodyMd: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.normal,
      height: 24 / 16,
      color: _lightColors.textTertiary,
    ),
    bodySm: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.normal,
      height: 20 / 14,
      color: _lightColors.textSecondary,
    ),
    caption: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.normal,
      height: 16 / 12,
      color: _lightColors.textTertiary,
    ),
    badgeText: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.normal,
      height: 16 / 12,
      color: _lightColors.textOnBrand,
    ),
    buttonText: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w600,
      height: 20 / 16,
      color: _lightColors.textOnBrand,
    ),
    linkText: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w600,
      height: 20 / 14,
      color: _lightColors.textBrand,
    ),
    bold14: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.bold,
      color: _lightColors.textDefault,
    ),
    bold16: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.bold,
      color: _lightColors.textDefault,
    ),
    bold18: TextStyle(
      fontSize: 18,
      fontWeight: FontWeight.bold,
      color: _lightColors.textDefault,
    ),
    bold20: TextStyle(
      fontSize: 20,
      fontWeight: FontWeight.bold,
      color: _lightColors.textDefault,
    ),
    bold24: TextStyle(
      fontSize: 24,
      fontWeight: FontWeight.bold,
      color: _lightColors.textDefault,
    ),
    semibold14: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w600,
      color: _lightColors.textDefault,
    ),
    semibold16: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w600,
      color: _lightColors.textDefault,
    ),
    semibold18: TextStyle(
      fontSize: 18,
      fontWeight: FontWeight.w600,
      color: _lightColors.textDefault,
    ),
    semibold20: TextStyle(
      fontSize: 20,
      fontWeight: FontWeight.w600,
      color: _lightColors.textDefault,
    ),
    semibold24: TextStyle(
      fontSize: 24,
      fontWeight: FontWeight.w600,
      color: _lightColors.textDefault,
    ),
    title14: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.normal,
      color: _lightColors.textDefault,
    ),
  );

  /// Dark colors — light palette'dan aynan o'xshash struktura, teskari ranglarda.
  static const _darkColors = ThemeColors(
    textBrand: Color(0xFFFB6633),
    textDefault: Color(0xFFF5F5F5),
    textButtonSecondary: Color(0xFFF5F5F5),
    textSecondary: Color(0xFFB5B5B5),
    textTertiary: Color(0xFF9A9A9A),
    textOnBrand: Color(0xFFFFFFFF),
    textOnBrandDark: Color(0xFF09131A),
    emptyValueColor: Color(0xFF4A4A4A),

    iconBrand: Color(0xFFFB6633),
    iconDefault: Color(0xFFF5F5F5),
    iconSecondary: Color(0xFFB5B5B5),
    iconButtonSecondary: Color(0xFFF5F5F5),
    iconTertiary: Color(0xFF9A9A9A),
    iconOnBrand: Color(0xFFFFFFFF),
    iconOnBrandDark: Color(0xFF09131A),

    bgBrand: Color(0xFFFB6633),
    bgDefault: Color(0xFF16181C),
    bgSecondary: Color(0xFF1E2024),
    bgTritary: Color(0xFF25272B),
    bgDefaultTritary: Color(0xFF1A1C20),
    bgSecondaryTritary: Color(0xFF16181C),
    bgBottomSheet: Color(0x99000000),

    borderBrand: Color(0xFFFB6633),
    border: Color(0xFF2B2F36),

    buttonBrand: Color(0xFFFB6633),
    buttonBrandSecondary: Color(0xFF2B2F36),
    buttonSecondary: Color(0xFF25272B),
    buttonDisabledBg: Color(0xFF2B2F36),

    systemAccent: Color(0xFFF5A524),
    systemSuccess: Color(0xFF16A34A),
    systemError: Color(0xFFDC2626),

    extraPurple: Color(0xFF9470DC),
    extraCyan: Color(0xFF32AACF),
    extraOrange: Color(0xFFCF8506),

    informationColor: Color(0xFFDF8A1B),
    responseTextColor: Color(0xFF16A34A),
    sidebarBg: Color(0xFF0F1014),
    sidebarActive: Color(0xFF25272B),
    sidebarIcon: Color(0xFF8A8A8A),
    systemInfo: Color(0xFF3B82F6),
  );

  static final _darkTextStyles = ThemeTextStyle(
    fontFamily: "Inter",
    displayXl: TextStyle(
      fontSize: 32,
      fontWeight: FontWeight.bold,
      height: 40 / 32,
      color: _darkColors.textDefault,
    ),
    displayLg: TextStyle(
      fontSize: 28,
      fontWeight: FontWeight.bold,
      height: 36 / 28,
      color: _darkColors.textDefault,
    ),
    headingMd: TextStyle(
      fontSize: 24,
      fontWeight: FontWeight.w600,
      height: 32 / 24,
      color: _darkColors.textDefault,
    ),
    headingSm: TextStyle(
      fontSize: 20,
      fontWeight: FontWeight.w600,
      height: 28 / 20,
      color: _darkColors.textDefault,
    ),
    bodyLg: TextStyle(
      fontSize: 18,
      fontWeight: FontWeight.normal,
      height: 26 / 18,
      color: _darkColors.textSecondary,
    ),
    bodyMd: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.normal,
      height: 24 / 16,
      color: _darkColors.textTertiary,
    ),
    bodySm: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.normal,
      height: 20 / 14,
      color: _darkColors.textSecondary,
    ),
    caption: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.normal,
      height: 16 / 12,
      color: _darkColors.textTertiary,
    ),
    badgeText: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.normal,
      height: 16 / 12,
      color: _darkColors.textOnBrand,
    ),
    buttonText: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w600,
      height: 20 / 16,
      color: _darkColors.textOnBrand,
    ),
    linkText: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w600,
      height: 20 / 14,
      color: _darkColors.textBrand,
    ),
    bold14: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.bold,
      color: _darkColors.textDefault,
    ),
    bold16: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.bold,
      color: _darkColors.textDefault,
    ),
    bold18: TextStyle(
      fontSize: 18,
      fontWeight: FontWeight.bold,
      color: _darkColors.textDefault,
    ),
    bold20: TextStyle(
      fontSize: 20,
      fontWeight: FontWeight.bold,
      color: _darkColors.textDefault,
    ),
    bold24: TextStyle(
      fontSize: 24,
      fontWeight: FontWeight.bold,
      color: _darkColors.textDefault,
    ),
    semibold14: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w600,
      color: _darkColors.textDefault,
    ),
    semibold16: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w600,
      color: _darkColors.textDefault,
    ),
    semibold18: TextStyle(
      fontSize: 18,
      fontWeight: FontWeight.w600,
      color: _darkColors.textDefault,
    ),
    semibold20: TextStyle(
      fontSize: 20,
      fontWeight: FontWeight.w600,
      color: _darkColors.textDefault,
    ),
    semibold24: TextStyle(
      fontSize: 24,
      fontWeight: FontWeight.w600,
      color: _darkColors.textDefault,
    ),
    title14: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.normal,
      color: _darkColors.textDefault,
    ),
  );
}
