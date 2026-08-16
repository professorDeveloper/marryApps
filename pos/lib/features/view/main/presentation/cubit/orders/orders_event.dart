part of 'orders_bloc.dart';

@freezed
class SavedOrdersEvent with _$SavedOrdersEvent {
  const factory SavedOrdersEvent.started() = _Started;
  const factory SavedOrdersEvent.addNewOrder({required SaveOrderEntity order}) =
      _AddNewOrder;
  const factory SavedOrdersEvent.removeOrder({required String tableId}) =
      _RemoveOrder;

  const factory SavedOrdersEvent.clear() = _Clear;
  
}
