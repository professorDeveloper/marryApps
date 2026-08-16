part of 'create_order_bloc.dart';

@freezed
class CreateOrderEvent with _$CreateOrderEvent {
  const factory CreateOrderEvent.started({
    required int guestCount,
    String? tableId,
    required TableStatus tableStatus,
  }) = _Started;
  const factory CreateOrderEvent.createOrder({
    required List<OrderItem> orders,
  }) = _CreateOrder;
}
