import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';

class AppFormatter {
  const AppFormatter._();

  /// Narx maydoni (faqat butun son + bo‘shliq): `1000000` / `10000.7` → `1 000 000` / `10 001`.
  static String formatPriceIntegerSpaces(String? raw) {
    if (raw == null || raw.isEmpty) return '';
    final n = double.tryParse(raw.toString().replaceAll(' ', '').replaceAll(',', '.'));
    if (n == null) return '';
    return NumberFormat.currency(
      symbol: '',
      locale: 'uz',
      decimalDigits: 0,
    ).format(n.round()).trim();
  }

  /// Ko‘rinish: `1000000` → `1 000 000`, `10000.5` → `10 000,5` (locale `uz`).
  static String formatAmountWithSpaces(String? raw) {
    if (raw == null || raw.isEmpty) return '';
    final clean = raw.replaceAll(' ', '').replaceAll(',', '.');
    final n = double.tryParse(clean);
    if (n == null) return '';
    final whole = n == n.roundToDouble();
    return NumberFormat.currency(
      symbol: '',
      locale: 'uz',
      decimalDigits: whole ? 0 : 2,
    ).format(n).trim();
  }

  static String formatDate(DateTime date) {
    int year = date.year;
    String month = date.month.toString().padLeft(2, '0');
    String day = date.day.toString().padLeft(2, '0');
    String formatted = '$day.$month.$year';

    return formatted;
  }

  static String formatTimeFromMills(num mills, {bool hasSecond = false}) {
    DateTime date = DateTime.fromMillisecondsSinceEpoch(mills.toInt());
    String hour = date.hour.toString().padLeft(2, '0');
    String minute = date.minute.toString().padLeft(2, '0');
    String second = date.second.toString().padLeft(2, '0');

    String formatted = '$hour:$minute';
    String withSecond = '$hour:$minute:$second';
    return hasSecond ? withSecond : formatted;
  }

  static final dateFormatterDDMMYYY = MaskTextInputFormatter(
    mask: '##-##-####',
    filter: {"#": RegExp(r'[0-9]')},
  );

  static TextInputFormatter get formatYYYYMMDD =>
      TextInputFormatter.withFunction((oldValue, newValue) {
        String text = newValue.text.replaceAll(RegExp(r'\D'), '');

        if (text.length > 8) {
          text = text.substring(0, 8);
        }

        String formatted = '';
        for (int i = 0; i < text.length; i++) {
          if (i == 4 || i == 6) {
            formatted += ' ';
          }
          formatted += text[i];
        }

        return TextEditingValue(
          text: formatted,
          selection: TextSelection.collapsed(offset: formatted.length),
        );
      });

  static final uzPhoneFormatter = MaskTextInputFormatter(
    mask: '+998 (##) ### ## ##',
    filter: {"#": RegExp(r'[0-9]')},
  );

  static final plusPhoneFormatter = MaskTextInputFormatter(
    mask: '+### ## ### ## ##',
    filter: {"#": RegExp(r'\d')},
  );

  static final numberOnlyFormatter = FilteringTextInputFormatter.digitsOnly;
}

/// Summa kiritish: `10000` → `10 000` (locale `uz`, boshqa joydagi `formatN` bilan bir xil).
class SumThousandsInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final raw =
        newValue.text.replaceAll(RegExp(r'\s'), '').replaceAll(RegExp(r'\D'), '');
    if (raw.isEmpty) {
      return const TextEditingValue(text: '');
    }
    final n = int.tryParse(raw) ?? 0;
    final formatted = NumberFormat.currency(
      symbol: '',
      locale: 'uz',
      decimalDigits: 0,
    ).format(n).trim();

    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

class AtSignUsernameFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    String text = newValue.text;

    if (!text.startsWith('@')) {
      text = '@${text.replaceAll('@', '')}';
    }

    return newValue.copyWith(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }
}

class PriceFormatter extends TextInputFormatter {
  final String additional;
  final int? limit;

  PriceFormatter({this.additional = '', this.limit});

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    String text = newValue.text.replaceAll(RegExp(r'\D'), '');

    if (text.isEmpty) {
      return newValue.copyWith(text: '');
    }

    int number = int.parse(text);

    if (additional == '%' && number > 100) {
      number = 100;
    }

    if (limit != null && number > limit!) {
      number = limit!;
    }

    final formatted = number.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]} ',
    );

    return TextEditingValue(
      text: "$formatted $additional",
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}
