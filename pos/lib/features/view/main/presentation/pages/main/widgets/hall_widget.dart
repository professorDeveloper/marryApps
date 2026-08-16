import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/common/custom_loading_widget.dart';
import 'package:mary_ai_pos/core/components/flush_bars.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/hall/hall_model.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/orders/orders_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/show_table_guest_count.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/enhanced_table_card.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/item_notes_modal.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/split_bill_modal.dart';

class HallWidget extends StatelessWidget {
  final HallModel? hall;
  final List<CafeTableModel> tables;
  final bool isLoading;

  const HallWidget({
    super.key,
    required this.tables,
    this.hall,
    required this.isLoading,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Expanded(child: Center(child: LoadingWidget()));
    }

    if (tables.isEmpty) {
      return Expanded(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            spacing: 8,
            children: [
              Icon(Icons.table_restaurant_outlined, size: 48, color: Colors.grey.shade300),
              Text(
                'Stollar mavjud emas',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade400,
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Expanded(
      child: SingleChildScrollView(
        child: Wrap(
          spacing: 12,
          runSpacing: 12,
          children: tables
              .map(
                (table) => EnhancedTableCard(
                  table: table,
                  onTap: () => _handleTableTap(context, table),
                  waitingTimeMinutes: table.status == TableStatus.busy ? 12 : null,
                  showAlert: table.status == TableStatus.busy,
                  onKitchenNotify: () {
                    showSuccessMessage(
                      context,
                      'Oshxonaga xabar yuborildi',
                    );
                  },
                  onAddNotes: () {
                    showDialog(
                      context: context,
                      builder: (_) => ItemNotesModal(
                        tableNumber: table.number.toString(),
                        onSave: () {
                          showSuccessMessage(
                            context,
                            'Izoh saqlandi',
                          );
                        },
                      ),
                    );
                  },
                  onSplitBill: () {
                    showDialog(
                      context: context,
                      builder: (_) => SplitBillModal(
                        tableNumber: table.number.toString(),
                        totalAmount: 125000,
                        guestCount: table.capacity,
                        onConfirm: () {
                          showSuccessMessage(
                            context,
                            'To\'lov bo\'lindi',
                          );
                        },
                      ),
                    );
                  },
                ),
              )
              .toList(),
        ),
      ),
    );
  }

  Future<void> _handleTableTap(BuildContext context, CafeTableModel table) async {
    if (table.status == TableStatus.free) {
      final savedOrdersBloc = context.read<SavedOrdersBloc>();
      final navigator = Navigator.of(context);
      final value = await showDialog<int>(
        context: context,
        barrierDismissible: false,
        builder: (_) => ShowTableGuestCount(tableNumber: table.number),
      );
      if (value != null) {
        final index = savedOrdersBloc.state.order
            .indexWhere((v) => v.createOrderRequest.tableId == table.id);
        Future.delayed(
          const Duration(milliseconds: 300),
          () => navigator.pushNamed(
            AppRoutes.detailScreen,
            arguments: {
              "table": table,
              "guest_count": value,
              "table_status": table.status,
              "saved_orders": index != -1
                  ? savedOrdersBloc.state.order[index]
                  : null,
            },
          ),
        );
      }
    } else {
      final savedOrdersBloc = context.read<SavedOrdersBloc>();
      final index = savedOrdersBloc.state.order
          .indexWhere((v) => v.createOrderRequest.tableId == table.id);
      Navigator.pushNamed(
        context,
        AppRoutes.detailScreen,
        arguments: {
          "table": table,
          "table_status": TableStatus.busy,
          "saved_orders": index != -1
              ? savedOrdersBloc.state.order[index]
              : null,
        },
      );
    }
  }
}
