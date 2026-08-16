import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:mary_ai_pos/core/services/lan/lan_api_client.dart';
import 'package:mary_ai_pos/core/services/license/trial_guard.dart';
import 'package:mary_ai_pos/core/theme/ember.dart';
import 'package:mary_ai_pos/waiter/waiter_app.dart';

/// Ofitsiant ilovasining kirish nuqtasi.
///
/// POS bilan bitta repo va bitta `pubspec.yaml` da yashaydi — modellar,
/// dizayn sistemasi va LAN protokoli ikkalasida bir xil bo'lishi uchun.
/// Android'da alohida ilova sifatida yig'iladi:
///
///   flutter build apk --target=lib/main_waiter.dart --flavor waiter
///
/// **Bu ilova cloudga hech qachon chiqmaydi.** Hamma so'rov LAN orqali
/// POS'ga boradi. Internet bor-yo'qligi ofitsiant uchun ahamiyatsiz —
/// muhimi POS bilan bitta WiFi'da bo'lish.
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Hive.initFlutter();
  final api = await LanApiClient.init();

  // Sinov muddati planshetda mustaqil sanaladi — POS'ga ulanish shart emas,
  // internet ham. Birinchi ochilishdan boshlab hisob ketadi.
  final trial = await TrialGuard.init();

  // Ilova dark Ember'ga qadab qo'yilgan — tizim paneli ham o'sha eng to'q
  // yuzada bo'lishi kerak, aks holda tepada begona oq chiziq qoladi.
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Ember.darkCanvas,
    statusBarIconBrightness: Brightness.light,
    statusBarBrightness: Brightness.dark,
    systemNavigationBarColor: Ember.darkCanvas,
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  // Planshet — portret ham, landshaft ham qulay bo'lishi kerak, shuning
  // uchun POS'dagi kabi majburiy landshaft qo'yilmaydi.
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  runApp(WaiterApp(api: api, trial: trial));
}
