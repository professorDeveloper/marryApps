import 'dart:io';
import 'dart:ui';

import 'package:alice/alice.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:window_manager/window_manager.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:mary_ai_pos/core/routes/app_pages.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/core/service/app_version/app_update_service.dart';
import 'package:mary_ai_pos/core/services/connectivity/connectivity_cubit.dart';
import 'package:mary_ai_pos/core/services/license/trial_gate.dart';
import 'package:mary_ai_pos/core/services/license/trial_guard.dart';
import 'package:mary_ai_pos/core/services/offline_queue/pending_operation.dart';
import 'package:mary_ai_pos/core/theme/app_theme.dart';
import 'package:mary_ai_pos/core/utils/helper/helper_widget.dart';
import 'package:mary_ai_pos/core/utils/scroll_physics_modified.dart';
import 'package:mary_ai_pos/core/utils/size_config.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/auth/auth_cubit.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/bloc/user_bloc.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/settings/settings_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/main/main_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/orders/orders_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/service_charge/service_charge_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/shift/shift_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/ui_prefs/ui_prefs_cubit.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

// Single-instance lock port — loopback TCP server.
// Birinchi instance bu portga bind qiladi va tinglaydi.
// Keyingi instance bind qila olmaydi → mavjud windowni focus qilib chiqadi.
const _kSingleInstancePort = 45671;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // ── Single-instance tekshiruv (faqat desktop) ──────────────────────────
  if (Platform.isWindows || Platform.isMacOS || Platform.isLinux) {
    ServerSocket? lockServer;
    try {
      lockServer = await ServerSocket.bind(
        InternetAddress.loopbackIPv4,
        _kSingleInstancePort,
        shared: false,
      );
      // Bu birinchi instance — ulanishlarni tinglaydi (focus signali).
      lockServer.listen((_) async {
        final wm = WindowManager.instance;
        if (await wm.isMinimized()) await wm.restore();
        await wm.show();
        await wm.focus();
      });
    } on SocketException {
      // Port band — eski instance haqiqatan ishlayaptimi tekshiramiz.
      bool alreadyRunning = false;
      try {
        final sock = await Socket.connect(
          InternetAddress.loopbackIPv4,
          _kSingleInstancePort,
          timeout: const Duration(seconds: 1),
        );
        await sock.close();
        alreadyRunning = true;
      } catch (_) {
        // Ulanib bo'lmadi — port stale, davom etamiz.
      }
      if (alreadyRunning) exit(0);
      // Stale port bo'lsa — SO_REUSEADDR bilan qayta bind qilish mumkin emas,
      // lekin shared: true bilan urinib ko'ramiz.
    }
  }
  // ───────────────────────────────────────────────────────────────────────

  await Hive.initFlutter();
  Hive.registerAdapter(PendingOperationTypeAdapter());
  Hive.registerAdapter(PendingOperationAdapter());

  AppUpdateService.getCloudVersion();
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);
  if (Platform.isWindows || Platform.isMacOS || Platform.isLinux) {
    await WindowManager.instance.ensureInitialized();
    await windowManager.waitUntilReadyToShow();
    await windowManager.setTitleBarStyle(TitleBarStyle.normal);
    await windowManager.setMinimumSize(const Size(1000, 600));
    await windowManager.show();
    await windowManager.setPreventClose(true);
    await windowManager.setSkipTaskbar(false);
    await windowManager.maximize();
    await windowManager.focus();
  }

  await initDi();
  inject<Alice>().setNavigatorKey(navigatorKey);
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    SizeConfig().init(context);

    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: inject<ConnectivityCubit>()),
        BlocProvider(create: (_) => inject<AuthCubit>()),
        BlocProvider(create: (_) => inject<SettingsCubit>()..loadAppLang()),
        BlocProvider(create: (_) => inject<UiPrefsCubit>()),
        BlocProvider(create: (_) => inject<MainCubit>()),
        BlocProvider(
          create: (_) =>
              inject<SavedOrdersBloc>()..add(const SavedOrdersEvent.started()),
          lazy: false,
        ),
        BlocProvider(
          create: (_) => inject<UserBloc>()..add(const UserEvent.started()),
        ),
        BlocProvider(
          create: (_) => inject<ShiftBloc>()..add(const ShiftEvent.started()),
        ),
        BlocProvider(create: (_) => inject<ServiceChargeCubit>()),
      ],
      child: BlocBuilder<SettingsCubit, SettingsState>(
        buildWhen: (p, c) => p.language != c.language,
        builder: (context, settingsState) {
          final language = settingsState.language;
          // Mavzu vaqtincha faqat yorug' rejimda.
          // final themeMode =
          //     context.select((UiPrefsCubit c) => c.state.themeMode);
          return MaterialApp(
            title: 'Mary AI POS',
            navigatorKey: navigatorKey,
            debugShowCheckedModeBanner: false,
            onGenerateRoute: RouteGenerate().generate,
            localizationsDelegates: const [
              GlobalWidgetsLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
              S.delegate,
            ],
            locale: Locale(language),
            supportedLocales: const [Locale('en'), Locale('uz'), Locale('ru')],
            themeMode: ThemeMode.light,
            theme: AppTheme.lightTheme,
            // darkTheme: AppTheme.darkTheme,
            builder: (context, child) {
              // `TrialGate` eng tashqarida: u `MaterialApp.builder` ichida
              // har bir route ustidan tushadi, ya'ni qulfni navigatsiya bilan
              // chetlab o'tib bo'lmaydi.
              return TrialGate(
                guard: inject<TrialGuard>(),
                child: GestureDetector(
                  behavior: HitTestBehavior.translucent,
                  onLongPress: () => inject<Alice>().showInspector(),
                  child: ScrollConfiguration(
                    behavior: const ScrollBehaviorModified(),
                    child: child!,
                  ),
                ),
              );
            },
            initialRoute: AppRoutes.splashScreen,
          );
        },
      ),
    );
  }
}

class ScrollBehaviorModified extends MaterialScrollBehavior {
  const ScrollBehaviorModified();

  @override
  Set<PointerDeviceKind> get dragDevices => PointerDeviceKind.values.toSet();

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) {
    return const ClampingScrollPhysicsModified();
  }
}
