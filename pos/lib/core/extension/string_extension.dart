import 'package:mary_ai_pos/core/constants/constants.dart';

extension StringExtension on String {
  String get getDigits => replaceAll(RegExp(r'[^\d]'), '');

  bool get hasResplaceSign => contains(REPLACE_SIGN);

  int get getReplaceSignIndex {
    final match = RegExp(r'\d+').firstMatch(this);
    if (match == null) {
      throw FormatException("No number found in sign: $this");
    }

    return int.parse(match.group(0)!) - 1;
  }
}
