import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mary_ai_pos/core/services/license/trial_gate.dart';
import 'package:mary_ai_pos/core/services/license/trial_guard.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// ```
/// flutter test test/core/services/license/trial_gate_test.dart \
///   --dart-define=TRIAL_MINUTES=3
/// ```
// `TrialGuard` davriy timer ochadi. `addTearDown` esa `testWidgets` ning
// "timer qolib ketdimi" tekshiruvidan **keyin** ishlaydi, shuning uchun
// qorovul har bir testning oxirida qo'lda yopiladi.
void main() {
  const key = 'trial_first_run_at';
  const keyLastSeen = 'trial_last_seen_at';

  const marker = Text('ilova ichi', textDirection: TextDirection.ltr);

  Widget wrap(TrialGuard guard, {Stream<String>? external}) => MaterialApp(
        home: TrialGate(
          guard: guard,
          externalLock: external,
          child: const Scaffold(body: marker),
        ),
      );

  testWidgets('muddat ichida — ilova ko\'rinadi', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final guard = await TrialGuard.init();

    await tester.pumpWidget(wrap(guard));

    expect(find.text('ilova ichi'), findsOneWidget);
    expect(find.text('Contact to developer'), findsNothing);

    await guard.dispose();
  });

  testWidgets('muddat o\'tgan — qulf ekrani, ilova ko\'rinmaydi',
      (tester) async {
    final past = DateTime.now()
        .subtract(const Duration(minutes: 10))
        .millisecondsSinceEpoch;
    SharedPreferences.setMockInitialValues({
      key: past,
      keyLastSeen: past,
    });
    final guard = await TrialGuard.init();

    expect(guard.isLocked, isTrue);

    await tester.pumpWidget(wrap(guard));

    expect(find.text('Contact to developer'), findsOneWidget);
    expect(
      find.text('ilova ichi'),
      findsNothing,
      reason: 'qulflangan daraxt ostida qolmasligi kerak — fokus va '
          'gesture\'lar unga yetib borardi',
    );

    await guard.dispose();
  });

  testWidgets('POS 423 qaytarsa planshet ham qulflanadi', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final guard = await TrialGuard.init();

    final locked = StreamController<String>.broadcast();
    addTearDown(locked.close);

    await tester.pumpWidget(wrap(guard, external: locked.stream));
    expect(find.text('ilova ichi'), findsOneWidget);

    // POS qulflandi.
    locked.add('POS litsenziyasi faol emas. Kassirga murojaat qiling.');
    await tester.pump();

    expect(find.text('Contact to developer'), findsOneWidget);
    expect(
      find.text('POS litsenziyasi faol emas. Kassirga murojaat qiling.'),
      findsOneWidget,
      reason: 'POS bergan sabab ko\'rsatilishi kerak',
    );
    expect(find.text('ilova ichi'), findsNothing);

    await guard.dispose();
  });
}
