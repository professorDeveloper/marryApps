part of 'create_order_bloc.dart';

@freezed
class CreateOrderState with _$CreateOrderState {
  const factory CreateOrderState({
    @Default(Status.UNKNOWN) Status status,
    @Default('') String tableId,
    @Default(TableStatus.none) TableStatus tableStatus,
    @Default(0) int guestCount,
    @Default(false) bool success,
    Failure? failure,
  }) = _CreateOrderState;
}
