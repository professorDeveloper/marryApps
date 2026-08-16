import 'package:flutter_test/flutter_test.dart';
import 'package:mary_ai_pos/core/services/license/trial_guard.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Mutlaq muddat (`TRIAL_DEADLINE`) binarga qadaladi, ya'ni uni test ichida
/// o'zgartirib bo'lmaydi. Shuning uchun ikki alohida ishga tushirish kerak:
///
/// ```
/// # o'tib ketgan sana — qulf darhol
/// flutter test test/core/services/license/trial_deadline_test.dart \
///   --dart-define=TRIAL_MINUTES=3 --dart-define=TRIAL_DEADLINE=2020-01-01T00:00:00Z
///
/// # kelajakdagi sana — qulf yo'q
/// flutter test test/core/services/license/trial_deadline_test.dart \
///   --dart-define=TRIAL_MINUTES=3 --dart-define=TRIAL_DEADLINE=2099-01-01T00:00:00Z
/// ```
void main() {
  // Define berilmagan bo'lsa bu fayl tekshiradigan narsa yo'q. Yiqilish
  // o'rniga o'tkazib yuboriladi — shunda butun papkani birdan ishga
  // tushirish ham toza qoladi.
  final skip = TrialGuard.deadlineRaw.isEmpty
      ? 'TRIAL_DEADLINE berilmagan — --dart-define bilan ishga tushiring'
      : null;

  setUp(() {
    // Ataylab **toza** holat: qurilmada hech qanday iz yo'q, ya'ni bu aynan
    // "ilovani o'chirib qayta o'rnatdi" holati.
    SharedPreferences.setMockInitialValues({});
  });

  test('sana o\'qiladi', () {
    if (TrialGuard.deadlineInvalid) return; // buni pastdagi test tekshiradi
    expect(TrialGuard.deadline, isNotNull, reason: 'ISO-8601 bo\'lishi kerak');
  }, skip: skip);

  test('o\'qib bo\'lmaydigan sana — build xatosi, ilova qulflanadi', () async {
    if (!TrialGuard.deadlineInvalid) {
      // Bu holatni ko'rish uchun:
      //   --dart-define=TRIAL_DEADLINE=18-08-2026
      return;
    }
    final guard = await TrialGuard.init();
    addTearDown(guard.dispose);

    expect(
      guard.isLocked,
      isTrue,
      reason: 'noto\'g\'ri format jimgina himoyani o\'chirmasligi kerak — '
          'himoyasiz build mijozga ketib qolardi',
    );
  }, skip: skip);

  test('qayta o\'rnatilgan ilova mutlaq muddatga bo\'ysunadi', () async {
    if (TrialGuard.deadlineInvalid) return; // yuqoridagi test tekshiradi

    final guard = await TrialGuard.init();
    addTearDown(guard.dispose);

    final expired = !DateTime.now().isBefore(TrialGuard.deadline!);

    expect(
      guard.isLocked,
      expired,
      reason: expired
          ? 'sana o\'tgan — toza o\'rnatishda ham qulflanishi shart'
          : 'sana kelmagan — toza o\'rnatishda ishlashi kerak',
    );

    if (expired) {
      expect(guard.remaining, Duration.zero);
    } else {
      // Kelajakdagi sana bo'lsa qolgan vaqt per-install muddatdan
      // (3 daqiqa) oshib ketmasligi kerak — ikkalasining yaqinrog'i olinadi.
      expect(guard.remaining, lessThanOrEqualTo(const Duration(minutes: 3)));
    }
  }, skip: skip);
}
