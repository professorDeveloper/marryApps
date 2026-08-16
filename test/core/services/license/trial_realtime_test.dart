import 'package:flutter_test/flutter_test.dart';
import 'package:mary_ai_pos/core/services/license/trial_guard.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Haqiqiy vaqtdagi test: ishlab turgan ilova o'z-o'zidan qulflanadimi.
///
/// Qolgan testlar holatni oldindan qo'yib natijani tekshiradi. Bu esa
/// `Timer.periodic` ni **haqiqatan** kutadi — ya'ni "ilova ochiq turganda
/// muddat tugasa qulf yopiladimi" degan savolga javob beradi. Shuning uchun
/// u sekin (bir daqiqagacha) va ataylab shunday.
///
/// ```
/// flutter test test/core/services/license/trial_realtime_test.dart \
///   --dart-define=TRIAL_MINUTES=3
/// ```
void main() {
  test(
    'ishlab turgan ilova muddat tugagach o\'zi qulflanadi',
    () async {
      expect(
        TrialGuard.trialMinutes,
        3,
        reason: 'testni --dart-define=TRIAL_MINUTES=3 bilan ishga tushiring',
      );

      // Muddat tugashiga 10 soniya qolgan holat.
      final started = DateTime.now()
          .subtract(const Duration(minutes: 2, seconds: 50))
          .millisecondsSinceEpoch;
      SharedPreferences.setMockInitialValues({
        'trial_first_run_at': started,
        'trial_last_seen_at': DateTime.now().millisecondsSinceEpoch,
        'trial_elapsed_ms': const Duration(minutes: 2, seconds: 50)
            .inMilliseconds,
      });

      final guard = await TrialGuard.init();

      expect(guard.isLocked, isFalse, reason: 'hali 10 soniya bor');
      expect(guard.remaining.inSeconds, inInclusiveRange(5, 12));

      // Qorovul har daqiqada tekshiradi, ya'ni qulf 10 soniyadan keyin emas,
      // keyingi tik'da yopiladi — eng ko'pi bilan bir daqiqada.
      final locked = await guard.onLockChanged.first.timeout(
        const Duration(seconds: 90),
      );

      expect(locked, isTrue);
      expect(guard.isLocked, isTrue);
      expect(guard.remaining, Duration.zero);

      await guard.dispose();
    },
    timeout: const Timeout(Duration(minutes: 3)),
  );
}
