import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/design_system/pos_design_system.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/list_extension.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/core/widgets/app_scaffold.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/settings/settings_cubit.dart';
import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/main/main_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/orders/orders_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/admin_floor_plan_canvas.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/main_header.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/show_table_guest_count.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/tab_filter.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

class AdminFloorPlanScreen extends StatefulWidget {
  const AdminFloorPlanScreen({super.key});

  @override
  State<AdminFloorPlanScreen> createState() => _AdminFloorPlanScreenState();
}

class _AdminFloorPlanScreenState extends State<AdminFloorPlanScreen> {
  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return AppScaffold(
      activeRoute: AppRoutes.mainScreen,
      body: BlocBuilder<MainCubit, MainState>(
        builder: (context, state) {
          final hall = state.halls?.firstWhereOrNull(
            (h) => h.id == state.selectedHallId,
          );

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MainHeader(
                title: S.current.strFloorMap,
                trailing: _TakeawayButton(),
              ),
              if ((state.halls ?? []).isNotEmpty)
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
                  child: TabFilter(
                    halls: state.halls ?? [],
                    selectedHallId: state.selectedHallId,
                    isLoading: state.status == Status.OTHER_LOADING,
                  ),
                ),
              Expanded(
                child: state.status == Status.LOADING
                    ? Center(
                        child: CircularProgressIndicator.adaptive(
                          valueColor: AlwaysStoppedAnimation(colors.textBrand),
                        ),
                      )
                    : AdminFloorPlanCanvas(
                        tables: state.tables ?? [],
                        hall: hall,
                        isEditMode: false,
                        onTableTap: (table) => _handleTableTap(context, table),
                      ),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _handleTableTap(
      BuildContext context, CafeTableModel table) async {
    if (table.status == TableStatus.free) {
      final navigator = Navigator.of(context);
      final savedOrdersBloc = context.read<SavedOrdersBloc>();

      final guestCount = await showDialog<int>(
        context: context,
        barrierDismissible: false,
        builder: (_) => ShowTableGuestCount(tableNumber: table.number),
      );
      if (guestCount == null) return;

      final index = savedOrdersBloc.state.order
          .indexWhere((v) => v.createOrderRequest.tableId == table.id);

      Future.delayed(
        const Duration(milliseconds: 300),
        () => navigator.pushNamed(
          AppRoutes.detailScreen,
          arguments: {
            'table': table,
            'guest_count': guestCount,
            'table_status': table.status,
            'saved_orders': index != -1 ? savedOrdersBloc.state.order[index] : null,
          },
        ),
      );
    } else {
      final savedOrdersBloc = context.read<SavedOrdersBloc>();
      final index = savedOrdersBloc.state.order
          .indexWhere((v) => v.createOrderRequest.tableId == table.id);

      Navigator.pushNamed(
        context,
        AppRoutes.detailScreen,
        arguments: {
          'table': table,
          'table_status': TableStatus.busy,
          'saved_orders': index != -1 ? savedOrdersBloc.state.order[index] : null,
        },
      );
    }
  }
}

class _TakeawayButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    context.select((SettingsCubit c) => c.state.language);
    return GestureDetector(
      onTap: () => Navigator.pushNamed(
        context,
        AppRoutes.detailScreen,
        arguments: {
          'table': null,
          'table_status': TableStatus.none,
          'guest_count': 1,
        },
      ),
      child: Container(
        height: 48,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF3EE),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFFECDBA)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          spacing: 8,
          children: [
            const Icon(
              Icons.shopping_bag_outlined,
              size: 18,
              color: Color(0xFFFB6633),
            ),
            Text(
              S.current.strTakeaway,
              style: const TextStyle(
                fontSize: PosTypography.bodyMd, // 15
                fontWeight: FontWeight.w600,
                color: Color(0xFFFB6633),
                fontFamily: PosTypography.family,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

