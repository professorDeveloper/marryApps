

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/hour_price_response_entity.dart';

part 'hour_price_response_model.freezed.dart';
part 'hour_price_response_model.g.dart';

@freezed
class  HourPriceResponseModel with _$HourPriceResponseModel implements HourPriceResponseEntity{

  const factory HourPriceResponseModel({
    @JsonKey(name: "table_id") @Default('') String tableId,
    //!
    @JsonKey(name: "price_per_hour",fromJson: double.parse) @Default(0.0) double perHour,
    //!
    @JsonKey(name: "total_price",fromJson: double.parse) @Default(0.0) double totalPrice,
    //!
  }) = _HourPriceResponseModel;

  const HourPriceResponseModel._();

  factory HourPriceResponseModel.fromJson(Map<String,dynamic> json) => _$HourPriceResponseModelFromJson(json);

  @override
  noSuchMethod(Invocation invocation) {
    return super.noSuchMethod(invocation);
  }
  
}