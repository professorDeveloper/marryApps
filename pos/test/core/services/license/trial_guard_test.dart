import 'package:flutter_test/flutter_test.dart';
import 'package:mary_ai_pos/core/services/license/trial_guard.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Bu testlar `--dart-define=TRIAL_MINUTES=3` bilan ishlaydi:
///
/// ```
/// flutter test test/core/services/license/trial_guard_test.dart \
///   --dart-define=TRIAL_MINUTES=3
/// ```
///
/// Muddat qiymati kompilyatsiya vaqtida qadaladi, shuning uchun testni
/// yig'ish buyrug'idagi bilan bir xil sharoitda o'tkazish yagona to'g'ri yo'l.
void main() {
  const key = 'trial_first_run_at';
  const keyLastSeen = 'trial_last_seen_at';
  const keyElapsed = 'trial_elapsed_ms';

  int msAgo(Duration d) =>
      DateTime.now().subtract(d).millisecondsSinceEpoch;

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('muddat --dart-define dan olinadi', () {
    expect(
      TrialGuard.trialMinutes,
      3,
      reason: 'testni --dart-define=TRIAL_MINUTES=3 bilan ishga tushiring',
    );
  });

  test('birinchi ochilish — qulf yo\'q, muddat to\'liq', () async {
    final guard = await TrialGuard.init();
    addTearDown(guard.dispose);

    expect(guard.isLocked, isFalse);
    expect(guard.startedAt, isNotNull);
    expect(guard.trial, const Duration(minutes: 3));
    // Sekundlar ketishi mumkin, shuning uchun qat'iy tenglik emas.
    expect(guard.remaining.inSeconds, greaterThan(170));
  });

  test('muddat ichida — hali qulflanmaydi', () async {
    // Ilova bir daqiqadan beri uzluksiz ishlab turibdi: oxirgi tik hozir
    // bo'lgan, ya'ni `lastSeen` — hozir. `elapsed` ham bir daqiqa.
    SharedPreferences.setMockInitialValues({
      key: msAgo(const Duration(minutes: 1)),
      keyLastSeen: DateTime.now().millisecondsSinceEpoch,
      keyElapsed: const Duration(minutes: 1).inMilliseconds,
    });

    final guard = await TrialGuard.init();
    addTearDown(guard.dispose);

    expect(guard.isLocked, isFalse);
    expect(guard.remaining.inSeconds, inInclusiveRange(115, 125));
  });

  test('muddat o\'tgan — qulflanadi', () async {
    SharedPreferences.setMockInitialValues({
      key: msAgo(const Duration(minutes: 4)),
      keyLastSeen: msAgo(const Duration(minutes: 4)),
      keyElapsed: 0,
    });

    final guard = await TrialGuard.init();
    addTearDown(guard.dispose);

    expect(guard.isLocked, isTrue);
    expect(guard.remaining, Duration.zero);
  });

  test('ilova yopiq turgan vaqt ham sanaladi', () async {
    // Ilova 10 soniya ishlagan, keyin 4 daqiqa yopiq turgan.
    SharedPreferences.setMockInitialValues({
      key: msAgo(const Duration(minutes: 4, seconds: 10)),
      keyLastSeen: msAgo(const Duration(minutes: 4)),
      keyElapsed: const Duration(seconds: 10).inMilliseconds,
    });

    final guard = await TrialGuard.init();
    addTearDown(guard.dispose);

    expect(
      guard.isLocked,
      isTrue,
      reason: 'yopiq turgan vaqt sanalmasa demo cheksiz cho\'zilardi',
    );
  });

  test('soatni orqaga surish muddatni qaytarmaydi', () async {
    // Foydalanuvchi tizim soatini oldinga surgan: `firstRun` kelajakda
    // qolgan, ya'ni kalendar hisobi manfiy. To'plangan vaqt esa 5 daqiqa.
    SharedPreferences.setMockInitialValues({
      key: DateTime.now()
          .add(const Duration(days: 1))
          .millisecondsSinceEpoch,
      keyLastSeen: DateTime.now()
          .add(const Duration(days: 1))
          .millisecondsSinceEpoch,
      keyElapsed: const Duration(minutes: 5).inMilliseconds,
    });

    final guard = await TrialGuard.init();
    addTearDown(guard.dispose);

    expect(
      guard.isLocked,
      isTrue,
      reason: 'to\'plangan vaqt kalendar hisobidan mustaqil bo\'lishi kerak',
    );
  });

  test('holat saqlanadi — keyingi ochilish davom ettiradi', () async {
    final first = await TrialGuard.init();
    final startedAt = first.startedAt;
    await first.dispose();

    // Ikkinchi ishga tushish: prefs mock'da saqlanib qoldi.
    final second = await TrialGuard.init();
    addTearDown(second.dispose);

    expect(second.startedAt, isNotNull);
    expect(
      second.startedAt!.millisecondsSinceEpoch,
      startedAt!.millisecondsSinceEpoch,
      reason: 'boshlanish sanasi har ochilishda qaytadan yozilmasligi kerak',
    );
  });
}
