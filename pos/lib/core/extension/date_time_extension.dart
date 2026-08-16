/// Extension methods on [DateTime] for formatting and simple arithmetic.
extension DateTimeExtension on DateTime {
  /// Formats this [DateTime] using the provided pattern.
  ///
  /// Defaults to 'dd MMM yyyy' (e.g. '01 Jan 2020').
  // String format([String pattern = 'dd MMM yyyy']) =>
  //     DateFormat(pattern, inject<SettingsCubit>().state.language).format(this);

  /// Returns a short "time ago" string relative to now.
  ///
  /// Examples: '10s ago', '5m ago', '3h ago', '2d ago'.
  String get timeAgo {
    final diff = DateTime.now().difference(this);
    if (diff.inSeconds < 60) return "${diff.inSeconds}s ago";
    if (diff.inMinutes < 60) return "${diff.inMinutes}m ago";
    if (diff.inHours < 24) return "${diff.inHours}h ago";
    return "${diff.inDays}d ago";
  }

  /// Returns a new [DateTime] by adding [days] to this date.
  DateTime addDays(int days) => add(Duration(days: days));

  /// Returns a new [DateTime] by subtracting [days] from this date.
  DateTime subtractDays(int days) => subtract(Duration(days: days));

  int get getWeekOfMonth {
    final firstDayOfMonth = DateTime(year, month, 1);

    final firstWeekday = firstDayOfMonth.weekday;
    final dayOfMonth = day;

    return ((dayOfMonth + firstWeekday - 1) / 7).ceil();
  }

  /// Returns date as `yyyy-MM-dd`.
  String get toDateOnly {
    final monthStr = month.toString().padLeft(2, '0');
    final dayStr = day.toString().padLeft(2, '0');
    return '$year-$monthStr-$dayStr';
  }
}

/// Extension methods on nullable [DateTime] for safe formatting.
extension NullableDateTimeExtension on DateTime? {
  /// Returns date as `yyyy.MM.dd`.
  ///
  /// If this is `null`, [DateTime.now] is used.
  String get toYyyyMmDd {
    final date = this ?? DateTime.now();
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '${date.year}.$month.$day';
  }

  /// Returns time as `HH:mm`.
  ///
  /// If this is `null`, [DateTime.now] is used.
  String get toHourMinute {
    final date = this ?? DateTime.now();
    final hour = date.hour.toString().padLeft(2, '0');
    final minute = date.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}
