import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/api/dio_client.dart';
import 'package:mary_ai_pos/core/services/cache/cache_service.dart';
import 'package:mary_ai_pos/core/services/connectivity/connectivity_cubit.dart';
import 'package:mary_ai_pos/core/services/local/local_order_sync_service.dart';
import 'package:mary_ai_pos/core/widgets/app_sidebar.dart';
import 'package:mary_ai_pos/core/widgets/global_virtual_keyboard.dart';
import 'package:mary_ai_pos/core/widgets/offline_banner.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/main/main_cubit.dart';

class AppScaffold extends StatefulWidget {
  final String activeRoute;
  final Widget body;
  final Color? backgroundColor;

  const AppScaffold({
    super.key,
    required this.activeRoute,
    required this.body,
    this.backgroundColor,
  });

  @override
  State<AppScaffold> createState() => _AppScaffoldState();
}

class _AppScaffoldState extends State<AppScaffold> {
  StreamSubscription<bool>? _connectivitySub;

  /// Navbat surilgach stollarni yangilaymiz — ilgari buni drain'ning o'zi
  /// qilardi, endi drain widget'dan tashqarida ishlaydi va faqat xabar beradi.
  StreamSubscription<void>? _syncSub;

  // Ilova ichida prefetch faqat bir marta triggerlanadi (CacheService'da ham
  // o'z throttle bor, lekin bu erda ham qo'shimcha darvoza qo'yamiz —
  // har yangi scaffold yaratilganda qayta urinishi to'xtatiladi).
  static bool _prefetchAttempted = false;

  @override
  void initState() {
    super.initState();
    // DIQQAT: offline navbatni surish bu yerdan ataylab olib tashlangan.
    // U `LocalOrderSyncService` ga (DI singleton, o'z timeri va qayta
    // kirish qorovuli bilan) ko'chirildi. Sabablari:
    //   1. `ConnectivityCubit` `super(true)` bilan boshlanadi va `initDi()`
    //      paytida emit qiladi; stream replay qilmaydi — ya'ni interneti
    //      bor holda sovuq start qilingan POS'da bu tinglovchi hech qachon
    //      ishga tushmasdi va navbat surilmasdi.
    //   2. `AppScaffold` ni 11 ta ekran quradi va push qilingan route'lar
    //      State'ini tirik saqlaydi — bitta "internet keldi" chekkasi N ta
    //      parallel drain'ga bo'linardi.
    _connectivitySub = inject<ConnectivityCubit>().stream.listen((isOnline) {
      if (isOnline) {
        // Offline-ga tushib chiqqanda goods kesh eski bo'lishi mumkin —
        // CacheService throttle tekshiradi, kerak bo'lsa yangilaydi.
        _prefetchGoods();
      }
    });
    _syncSub = inject<LocalOrderSyncService>().onChanged.listen((_) {
      if (mounted) context.read<MainCubit>().refreshTables();
    });
    // Birinchi ochilishda bir marta prefetch (keyingi scaffoldlar triggerlamaydi)
    if (!_prefetchAttempted && inject<ConnectivityCubit>().isOnline) {
      _prefetchAttempted = true;
      _prefetchGoods();
    }
  }

  void _prefetchGoods() {
    inject<CacheService>().prefetchAllGoods(inject<DioClient>());
  }

  @override
  void dispose() {
    _connectivitySub?.cancel();
    _syncSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: false,
      backgroundColor:
          widget.backgroundColor ?? Theme.of(context).scaffoldBackgroundColor,
      body: GlobalVirtualKeyboard(
        child: Column(
          children: [
            const OfflineBanner(),
            Expanded(
              child: Row(
                children: [
                  AppSidebar(activeRoute: widget.activeRoute),
                  Expanded(child: widget.body),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
