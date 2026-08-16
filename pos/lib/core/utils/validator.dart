// ignore_for_file: unnecessary_brace_in_string_interps

/*========================Email Validator==============================================*/
import 'package:mary_ai_pos/generated/l10n.dart';

class Validator {
  static String? nameChecker(String value) {
    final trimmed = value.trim();

    if (trimmed.isEmpty) {
      return S.current.strFieldCannotBeEmpty;
    }

    if (trimmed.length < 2) {
      return S.current.strNameTooShort;
    }

    return null;
  }

  static String? phoneChecker(String value) {
    if (value.toString().trim().isEmpty) {
      return S.current.strFieldCannotBeEmpty;
    } else if (value.length != 12) {
      return S.current.strInvalidNumber;
    }
    return null;
  }

  static String? birthDateChecker(String value) {
    final trimmed = value.trim();

    if (trimmed.isEmpty) {
      return S.current.strFieldCannotBeEmpty;
    }

    final parts = trimmed.split('-');
    if (parts.length != 3) return S.current.strInvalidDate;

    final day = int.tryParse(parts[0]);
    final month = int.tryParse(parts[1]);
    final year = int.tryParse(parts[2]);

    if (day == null || month == null || year == null) {
      return S.current.strInvalidDate;
    }

    DateTime? birthDate;
    try {
      birthDate = DateTime(year, month, day);
      if (birthDate.day != day ||
          birthDate.month != month ||
          birthDate.year != year) {
        return S.current.strInvalidDate;
      }
    } catch (_) {
      return S.current.strInvalidDate;
    }

    final today = DateTime.now();

    if (birthDate.isAfter(today) ||
        birthDate.isBefore(today.copyWith(year: today.year - 100))) {
      return S.current.strUnacceptableDate;
    }

    return null;
  }

  static String? fullNameChecker(String value) {
    if (value.toString().trim().isEmpty) {
      return S.current.strFieldCannotBeEmpty;
    } else if (value.length < 3) {
      return "Invalid name";
    }
    return null;
  }

  static String? passwordCheck(String value) {
    if (value.toString().trim().isEmpty) {
      return S.current.strFieldCannotBeEmpty;
    } else if (value.length < 8) {
      return S.current.strPasswordContainAtLeastChars;
    }
    return null;
  }

  static String? passwordConfirmCheck({
    required String password,
    required String passwordConfirm,
  }) {
    if (password != passwordConfirm) {
      return S.current.strPasswordsNotSame;
    }
    return null;
  }
}
