/// POS terminal o'lchamlari — 1024×768 dan 1920×1080+ gacha bir xil ishlash uchun.
///
/// Ishlatish:
/// ```dart
/// import 'package:mary_ai_pos/core/design_system/pos_design_system.dart';
///
/// SizedBox(height: PosDimensions.buttonHeightLg)
/// Padding(padding: EdgeInsets.all(PosDimensions.l))
/// ```
class PosDimensions {
  PosDimensions._();

  // ── Touch targets ─────────────────────────────────────────────────────────
  // POS sensorli ekran uchun standartdan kattaroq (a11y min 48dp emas, 56dp).
  static const double touchTargetMin = 56.0;
  static const double touchTargetComfortable = 64.0;
  static const double touchTargetLarge = 80.0;

  // ── Tugma balandliklari ───────────────────────────────────────────────────
  static const double buttonHeightSm = 40.0;
  static const double buttonHeightMd = 56.0;
  static const double buttonHeightLg = 64.0;
  static const double buttonHeightXl = 80.0;

  // ── Panel kengliklari ─────────────────────────────────────────────────────
  // Compact: 1024–1366 oralig'i; Comfortable: 1366+
  static const double sidebarWidthCompact = 180.0;
  static const double sidebarWidthComfortable = 240.0;
  static const double cartPanelCompact = 320.0;
  static const double cartPanelComfortable = 400.0;

  // ── Grid item o'lchamlari ─────────────────────────────────────────────────
  static const double gridItemMinWidth = 160.0;
  static const double gridItemMinWidthLg = 200.0;
  static const double gridItemHeight = 140.0;

  // ── App chrome ────────────────────────────────────────────────────────────
  static const double appBarHeight = 64.0;
  static const double subBarHeight = 56.0;
  static const double bottomBarHeight = 88.0;

  // ── Radii ─────────────────────────────────────────────────────────────────
  static const double radiusSm = 8.0;
  static const double radiusMd = 12.0;
  static const double radiusLg = 16.0;
  static const double radiusXl = 24.0;

  // ── Spacing scale (4px grid) ──────────────────────────────────────────────
  static const double xs = 4.0;
  static const double s = 8.0;
  static const double m = 12.0;
  static const double l = 16.0;
  static const double xl = 20.0;
  static const double xxl = 24.0;
  static const double xxxl = 32.0;

  // ── Sahifa paddings ───────────────────────────────────────────────────────
  static const double pagePaddingCompact = 16.0;
  static const double pagePaddingComfortable = 24.0;

  // ── Border kalinliklari ───────────────────────────────────────────────────
  static const double borderThin = 1.0;
  static const double borderThick = 1.5;
  static const double borderActive = 2.0;
}
