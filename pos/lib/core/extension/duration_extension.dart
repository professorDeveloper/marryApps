extension DurationExtension on Duration {
  /// Formats this [Duration] as a readable string.
  ///
  /// Examples: '01:30', '1:05:45'
  String get formatToHHmmSS {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final hours = twoDigits(inHours);
    final minutes = twoDigits(inMinutes.remainder(60));
    final seconds = twoDigits(inSeconds.remainder(60));

    if (inHours > 0) {
      return '$hours:$minutes:$seconds';
    }
    return '$minutes:$seconds';
  }
}
