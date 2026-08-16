import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/save_order_entity.dart';

part 'orders_event.dart';
part 'orders_state.dart';
part 'orders_bloc.freezed.dart';

class SavedOrdersBloc extends Bloc<SavedOrdersEvent, SavedOrdersState> {
  SavedOrdersBloc() : super(const SavedOrdersState()) {
    on<_Started>(_onStarted);
    on<_AddNewOrder>(_onAddNewOrder);
    on<_RemoveOrder>(_onRemoveOrder);
    on<_Clear>(_clear);
  }

  void _clear(_Clear event, emit) => emit(state.copyWith(order: []));

  void _onStarted(_Started event, Emitter<SavedOrdersState> emit) {
    emit(state.copyWith(order: []));
  }

  void _onAddNewOrder(_AddNewOrder event, Emitter<SavedOrdersState> emit) {
    final List<SaveOrderEntity> currentOrders = List.from(state.order);

    final String newTableId = event.order.createOrderRequest.tableId;
    final int existingOrderIndex = currentOrders.indexWhere(
      (order) => order.createOrderRequest.tableId == newTableId,
    );

    if (existingOrderIndex != -1) {
      currentOrders[existingOrderIndex] = event.order;
    } else {
      currentOrders.add(event.order);
    }

    emit(state.copyWith(order: currentOrders));
  }

  void _onRemoveOrder(_RemoveOrder event, Emitter<SavedOrdersState> emit) {
    final List<SaveOrderEntity> currentOrders = List.from(state.order);
    currentOrders.removeWhere(
      (order) => order.createOrderRequest.tableId == event.tableId,
    );
    emit(state.copyWith(order: currentOrders));
  }
}
