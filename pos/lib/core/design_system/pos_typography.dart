import 'dart:ui';

/// POS terminal shrift ierarxiyasi.
///
/// POS uchun **min 13sp** — kichikroq shriftlar yo'q (kassir 30–50 sm masofada).
/// Compact ekranlarda (~1024px) [scaledFor] orqali 8% kichikroq render.
class PosTypography {
  PosTypography._();

  // ── Body (asosiy o'qiladigan matnlar) ─────────────────────────────────────
  static const double bodySm = 13.0; // 2-darajali matnlar (timestamp, hint)
  static const double bodyMd = 15.0; // default body (mahsulot nomi, izoh)
  static const double bodyLg = 17.0; // muhim body (savatchadagi item nomi)

  // ── Tugma matnlari ────────────────────────────────────────────────────────
  static const double buttonSm = 14.0;
  static const double buttonMd = 16.0;
  static const double buttonLg = 18.0; // primary tugma
  static const double buttonXl = 20.0; // checkout, "Pay" tugmasi

  // ── Sarlavhalar ───────────────────────────────────────────────────────────
  static const double headlineSm = 20.0;
  static const double headlineMd = 24.0;
  static const double headlineLg = 28.0;

  // ── Narxlar / summa ───────────────────────────────────────────────────────
  static const double priceSm = 14.0; // mahsulot kartasi (kichik)
  static const double priceMd = 18.0; // mahsulot kartasi (default)
  static const double priceLg = 24.0; // savatchadagi narx
  static const double totalAmount = 32.0; // checkout total
  static const double totalAmountXl = 40.0; // payment screen jumbo

  // ── Caption / mikro ──────────────────────────────────────────────────────
  static const double captionMd = 13.0;
  static const double captionSm = 12.0; // faqat badge/label uchun

  // ── Letter spacing ────────────────────────────────────────────────────────
  static const double tightLetterSpacing = -0.3;
  static const double normalLetterSpacing = 0.0;
  static const double loosLetterSpacing = 0.2;

  // ── Line height ───────────────────────────────────────────────────────────
  static const double tightLineHeight = 1.1;
  static const double normalLineHeight = 1.3;
  static const double comfortableLineHeight = 1.5;

  // ── Font family ───────────────────────────────────────────────────────────
  static const String family = 'Inter';

  // ── Font features ─────────────────────────────────────────────────────────
  /// Tabular figures — barcha raqamlar bir xil kenglikda (jumping yo'q).
  static const List<FontFeature> tabularFigures = [
    FontFeature.tabularFigures(),
  ];

  /// Compact ekran (1024×768) uchun shrift hajmini moslab beradi.
  ///
  /// 1280px dan kichik ekranlarda 8% kichikroq qiymat qaytaradi.
  static double scaledFor(double base, double width) {
    if (width < 1280) return base * 0.92;
    return base;
  }
}
