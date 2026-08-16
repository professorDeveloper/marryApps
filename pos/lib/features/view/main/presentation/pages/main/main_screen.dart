import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/common/custom_loading_widget.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/extension/list_extension.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/core/widgets/app_scaffold.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/bloc/user_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/main/main_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/orders/orders_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/shift/shift_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/hall_widget.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/main_header.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/tab_filter.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/waiter_floor_plan_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  @override
  void initState() {
    super.initState();
    context.read<MainCubit>().getHalls();
    context.read<SavedOrdersBloc>().add(const SavedOrdersEvent.clear());
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<UserBloc, UserState>(
      listenWhen: (prev, curr) =>
          prev.userMOdel == null && curr.userMOdel != null,
      listener: (context, state) {
        final role = state.userMOdel?.role;
        // admin smena ochmaydi hozircha
        if (role == UserRole.manager ||
            role == UserRole.cashier ||
            role == UserRole.waiter) {
          context.read<ShiftBloc>().add(const ShiftEvent.checkShift());
        }
      },
      child: BlocBuilder<UserBloc, UserState>(
        builder: (context, userState) {
          final role = userState.userMOdel?.role;

          if (role == null) {
            return const Scaffold(
              body: Center(child: LoadingWidget()),
            );
          }
          switch (role) {
            case UserRole.admin:
            case UserRole.manager:
            case UserRole.cashier:
            case UserRole.waiter:
              return const WaiterFloorPlanScreen();
            case UserRole.kitchen:
            default:
              return _waiterScreen();
          }
        },
      ),
    );
  }

  Widget _waiterScreen() {
    return AppScaffold(
      activeRoute: AppRoutes.mainScreen,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const MainHeader(title: 'Stollar'),
          Expanded(
            child: BlocBuilder<MainCubit, MainState>(
              builder: (context, state) {
                if (state.isLoading) {
                  return const Center(child: LoadingWidget());
                }

                return Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    spacing: 16,
                    children: [
                      TabFilter(
                        halls: state.halls ?? [],
                        selectedHallId: state.selectedHallId,
                        isLoading: state.status == Status.OTHER_LOADING,
                      ),
                      HallWidget(
                        isLoading: state.status == Status.LOADING,
                        tables: state.tables ?? [],
                        hall: state.halls?.firstWhereOrNull(
                          (item) => item.id == state.selectedHallId,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
