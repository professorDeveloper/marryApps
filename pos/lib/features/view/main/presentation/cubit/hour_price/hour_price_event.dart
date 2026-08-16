part of 'hour_price_bloc.dart';

@freezed
class HourPriceEvent with _$HourPriceEvent {
  const factory HourPriceEvent.started({String? orderId}) = _Started;
  const factory HourPriceEvent.getPrice() = _GetPrice;

}