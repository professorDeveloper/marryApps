import 'package:intl/intl.dart';

extension NumberFormatExt on num {
  String get formatN => NumberFormat.currency(
    symbol: "so'm",
    locale: 'uz',
    decimalDigits: 0,
  ).format(this);

  String get formatNWithoutS => NumberFormat.currency(
    symbol: '',
    locale: 'uz',
    decimalDigits: 0,
  ).format(this);

  String get toKMB {
    return NumberFormat.compact(
      // locale: inject<SettingsCubit>().state.language,
    ).format(this);
  }

  String get toHHMMSS {
    final duration = Duration(seconds: toInt());
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    final seconds = duration.inSeconds.remainder(60);

    if (hours > 0) {
      return '$hours:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    }
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }
}
