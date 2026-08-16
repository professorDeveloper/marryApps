part of 'hour_price_bloc.dart';

@freezed
class HourPriceState with _$HourPriceState {
  const factory HourPriceState({
    @Default(Status.UNKNOWN) Status status,
    String? orderId,
    HourPriceResponseEntity? price,
    Failure? failure,
  }) = _HourPriceState;
}
