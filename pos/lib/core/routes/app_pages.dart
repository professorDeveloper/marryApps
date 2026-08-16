import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/pages/login/login_screen.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/pages/login_pin/login_pin_screen.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/pages/splash/splash_screen.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/archive/archive_screen.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/close_shift/close_shift_screen.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/detail/detail_screen.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/main_screen.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/menu/menu_manage_screen.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/menu/menu_meals_list_screen.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/notification/notification_screen.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/payment/payment_screen.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/settings/settings_screen.dart';

class RouteGenerate {
  Route generate(RouteSettings settings) {
    final args = settings.arguments;
    switch (settings.name) {
      case AppRoutes.splashScreen:
        return simpleRoute(const SplashScreen(), name: settings.name);

      case AppRoutes.loginScreen:
        return simpleRoute(const LoginScreen(), name: settings.name);

      case AppRoutes.loginPinScreen:
        return simpleRoute(const LoginPinScreen(), name: settings.name);

      case AppRoutes.mainScreen:
        return simpleRoute(const MainScreen(), name: settings.name);

      case AppRoutes.detailScreen:
        return simpleRoute(
          const DetailScreen(),
          args: args,
          name: settings.name,
        );

      case AppRoutes.paymentScreen:
        return simpleRoute(
          const PaymentScreen(),
          args: args,
          name: settings.name,
        );

      case AppRoutes.archiveScreen:
        return simpleRoute(const ArchiveScreen(), name: settings.name);

      case AppRoutes.closeShiftScreen:
        return simpleRoute(const CloseShiftScreen(), name: settings.name);

      case AppRoutes.notificationsScreen:
        return simpleRoute(const NotificationScreen(), name: settings.name);

      case AppRoutes.menuMealsScreen:
        return simpleRoute(const MenuMealsListScreen(), name: settings.name);

      case AppRoutes.menuManageScreen:
        return simpleRoute(
          const MenuManageScreen(),
          args: args,
          name: settings.name,
        );

      case AppRoutes.settingsScreen:
        return simpleRoute(const SettingsScreen(), name: settings.name);
    }
    return throw UnimplementedError();
  }

  Route<dynamic> simpleRoute(Widget route, {Object? args, String? name}) =>
      PageRouteBuilder(
        settings: RouteSettings(name: name, arguments: args),
        pageBuilder: (context, animation, secondaryAnimation) => route,
        transitionDuration: const Duration(milliseconds: 200),
        reverseTransitionDuration: const Duration(milliseconds: 150),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
      );
}
