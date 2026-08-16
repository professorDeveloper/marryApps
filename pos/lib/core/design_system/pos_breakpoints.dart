import 'package:flutter/widgets.dart';

/// POS terminal viewport sinflari.
///
/// - **compact**:    1024–1366 (entry-level POS, 15.6" 1366×768)
/// - **comfortable**: 1366–1600 (standart POS, 17–19")
/// - **large**:      1600+    (zamonaviy 21–24" yoki dev mashinasi)
///
/// Ishlatish:
/// ```dart
/// final w = PosBreakpoints.pick(context,
///   compact: PosDimensions.sidebarWidthCompact,
///   comfortable: PosDimensions.sidebarWidthComfortable,
/// );
/// ```
class PosBreakpoints {
  PosBreakpoints._();

  static const double compactMin = 1024.0;
  static const double compactMax = 1366.0;
  static const double comfortableMin = 1366.0;
  static const double largeMin = 1600.0;

  /// 1024–1366 oralig'i — entry-level POS terminal.
  static bool isCompactPos(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    return w >= compactMin && w < comfortableMin;
  }

  /// 1366+ — standart POS monoblok.
  static bool isComfortablePos(BuildContext context) =>
      MediaQuery.sizeOf(context).width >= comfortableMin;

  /// 1600+ — yirik ekran yoki dev mashinasi.
  static bool isLargePos(BuildContext context) =>
      MediaQuery.sizeOf(context).width >= largeMin;

  /// 1024 dan kichik — POS bo'lmagan (telefon/planshet portrait).
  static bool isBelowPos(BuildContext context) =>
      MediaQuery.sizeOf(context).width < compactMin;

  /// Compact yoki comfortable orasida tanlash.
  static T pick<T>(
    BuildContext context, {
    required T compact,
    required T comfortable,
  }) =>
      isCompactPos(context) ? compact : comfortable;

  /// Uch darajali tanlov: compact / comfortable / large.
  /// Agar [large] berilmasa, comfortable qiymat ishlatiladi.
  static T pickThree<T>(
    BuildContext context, {
    required T compact,
    required T comfortable,
    T? large,
  }) {
    if (isLargePos(context)) return large ?? comfortable;
    if (isComfortablePos(context)) return comfortable;
    return compact;
  }

  /// Joriy viewport class nomi (debug/log uchun).
  static String classOf(BuildContext context) {
    if (isLargePos(context)) return 'large';
    if (isComfortablePos(context)) return 'comfortable';
    if (isCompactPos(context)) return 'compact';
    return 'below-pos';
  }
}
