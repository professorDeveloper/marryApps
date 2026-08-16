import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/services/lan/lan_api_client.dart';
import 'package:mary_ai_pos/core/services/license/trial_gate.dart';
import 'package:mary_ai_pos/core/services/license/trial_guard.dart';
import 'package:mary_ai_pos/core/theme/ember.dart';
import 'package:mary_ai_pos/waiter/screens/connect_screen.dart';
import 'package:mary_ai_pos/waiter/screens/queue_screen.dart';
import 'package:mary_ai_pos/waiter/screens/tables_screen.dart';

class WaiterApp extends StatefulWidget {
  final LanApiClient api;

  /// Planshetning **o'z** sinov muddati. POS'nikidan mustaqil: ofitsiant
  /// ilovasi boshqa POS'ga ulanib muddatni chetlab o'tolmasligi kerak.
  final TrialGuard trial;

  const WaiterApp({super.key, required this.api, required this.trial});

  @override
  State<WaiterApp> createState() => _WaiterAppState();
}

class _WaiterAppState extends State<WaiterApp> with WidgetsBindingObserver {
  Timer? _healthTimer;
  StreamSubscription<void>? _authInvalidSub;

  final _navigatorKey = GlobalKey<NavigatorState>();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    // POS bilan aloqani doimiy kuzatib boramiz: tiklanganda navbatdagi
    // buyurtmalar avtomatik yuboriladi.
    //
    // Shart ataylab "chekka" emas. Ilgari `reachable && !wasReachable` edi:
    // `loginPin` muvaffaqiyatli tugaganda `_setReachable(true)` qiladi, ya'ni
    // qayta kirgandan keyin `wasReachable` allaqachon `true` bo'lardi va bu
    // chekka smena oxirigacha boshqa hech qachon ishlamasdi — navbat yashil
    // "Ulangan" chipi ortida yotib qolardi. `flushQueue` ning o'z `_flushing`
    // qorovuli bor, shuning uchun har aylanishda chaqirish xavfsiz.
    _healthTimer = Timer.periodic(const Duration(seconds: 10), (_) async {
      final reachable = await widget.api.ping();
      if (reachable && widget.api.queuedCount > 0) {
        await widget.api.flushQueue();
      }
    });

    // POS qayta ishga tushsa sessiyalar yo'qoladi (ular POS xotirasida
    // saqlanadi) va har bir yozuv 401 qaytaradi. Bunda ofitsiantga "aloqa
    // yo'q" ko'rsatilardi va u WiFi ni qidirardi — aslida besh soniyalik
    // qayta kirish yetarli. Endi PIN ekrani o'zi ochiladi.
    _authInvalidSub = widget.api.onAuthInvalid.listen((_) {
      final nav = _navigatorKey.currentState;
      if (nav == null) return;
      nav.pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => ConnectScreen(api: widget.api)),
        (route) => false,
      );
    });

    unawaited(_flushOnStart());
  }

  /// Android planshet uxlab qolganda `Timer.periodic` to'xtatiladi —
  /// uyg'onganda navbat keyingi tik'ni kutmasligi kerak.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed) return;
    unawaited(_flushOnStart());
  }

  /// Ishga tushishda bir marta yuborib ko'ramiz.
  ///
  /// Faqat offline→online chekkasiga tayanib bo'lmaydi: ilova aloqa bor
  /// paytda ochilsa `wasReachable` allaqachon `true` bo'lib qoladi va
  /// kechagi navbat birinchi uzilishgacha o'tirib qolardi.
  Future<void> _flushOnStart() async {
    if (widget.api.queuedCount == 0) return;
    if (await widget.api.ping()) await widget.api.flushQueue();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _authInvalidSub?.cancel();
    _healthTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: _navigatorKey,
      title: 'Mary AI — Ofitsiant',
      debugShowCheckedModeBanner: false,
      theme: Ember.light(),
      darkTheme: Ember.dark(),
      themeMode: ThemeMode.dark,
      routes: {
        '/queue': (_) => QueueScreen(api: widget.api),
      },
      // `builder` ichida: qulf har bir route ustidan tushadi va uni
      // navigatsiya bilan chetlab o'tib bo'lmaydi.
      //
      // Ikki manba: planshetning o'z muddati va POS'ning 423 javobi.
      builder: (context, child) => TrialGate(
        guard: widget.trial,
        externalLock: widget.api.onServerLocked,
        child: child!,
      ),
      home: widget.api.isLoggedIn
          ? TablesScreen(api: widget.api)
          : ConnectScreen(api: widget.api),
    );
  }
}
