import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/design_system/pos_design_system.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/core/widgets/app_sidebar.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/bloc/user_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/detail/detail_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/main/main_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/table_timer/table_timer_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/waiter/waiter_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/waiter/widgets/bill_detail_panel.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/waiter/widgets/bills_panel.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/waiter/widgets/menu_panel.dart';

class WaiterScreen extends StatefulWidget {
  const WaiterScreen({super.key});

  @override
  State<WaiterScreen> createState() => _WaiterScreenState();
}

class _WaiterScreenState extends State<WaiterScreen> {
  @override
  void initState() {
    super.initState();
    context.read<MainCubit>().getHalls();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => inject<WaiterCubit>()),
        BlocProvider(create: (_) => inject<TableTimerCubit>()),
        BlocProvider(
          create: (_) => inject<DetailBloc>()
            ..add(const DetailEvent.started())
            ..add(const DetailEvent.getCategories()),
        ),
      ],
      child: const _WaiterOrdersBootstrap(),
    );
  }
}

/// Loads halls + orders for the logged-in waiter once [WaiterCubit] / [UserBloc] are available.
class _WaiterOrdersBootstrap extends StatefulWidget {
  const _WaiterOrdersBootstrap();

  @override
  State<_WaiterOrdersBootstrap> createState() => _WaiterOrdersBootstrapState();
}

class _WaiterOrdersBootstrapState extends State<_WaiterOrdersBootstrap> {
  @override
  void initState() {
    super.initState();
    final role =
        context.read<UserBloc>().state.userMOdel?.role ?? UserRole.none;
    context.read<WaiterCubit>().setOrdersListModeForRole(role);
    WidgetsBinding.instance
        .addPostFrameCallback((_) => _loadOrdersForCurrentWaiter());
  }

  void _loadOrdersForCurrentWaiter() {
    context.read<WaiterCubit>().loadOpenOrders();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<UserBloc, UserState>(
      listenWhen: (p, c) => p.userMOdel?.id != c.userMOdel?.id,
      listener: (context, state) {
        final u = state.userMOdel;
        if (u != null && u.id.isNotEmpty) {
          context.read<WaiterCubit>().setOrdersListModeForRole(u.role);
          context.read<WaiterCubit>().loadOpenOrders();
        }
      },
      child: const Scaffold(
        backgroundColor: Color(0xFFF8FAFC),
        body: _WaiterLayout(),
      ),
    );
  }
}

class _WaiterLayout extends StatelessWidget {
  const _WaiterLayout();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // Compact (1024–1366) — kichikroq panellar, comfortable (1366+) — kengroq
        final billsW = PosBreakpoints.pick<double>(
          context,
          compact: 240,
          comfortable: 300,
        );
        final detailW = PosBreakpoints.pick<double>(
          context,
          compact: 280,
          comfortable: 340,
        );
        final menuVPad = PosBreakpoints.pick<double>(
          context,
          compact: PosDimensions.s, // 8
          comfortable: PosDimensions.l, // 16
        );
        return Row(
          children: [
            const AppSidebar(activeRoute: AppRoutes.mainScreen),
            SizedBox(width: billsW, child: const BillsPanel()),
            Expanded(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: menuVPad),
                child: const MenuPanel(),
              ),
            ),
            SizedBox(width: detailW, child: const BillDetailPanel()),
          ],
        );
      },
    );
  }
}
