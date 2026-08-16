// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'hour_price_response_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$HourPriceResponseModelImpl _$$HourPriceResponseModelImplFromJson(
        Map<String, dynamic> json) =>
    _$HourPriceResponseModelImpl(
      tableId: json['table_id'] as String? ?? '',
      perHour: json['price_per_hour'] == null
          ? 0.0
          : double.parse(json['price_per_hour'] as String),
      totalPrice: json['total_price'] == null
          ? 0.0
          : double.parse(json['total_price'] as String),
    );

Map<String, dynamic> _$$HourPriceResponseModelImplToJson(
        _$HourPriceResponseModelImpl instance) =>
    <String, dynamic>{
      'table_id': instance.tableId,
      'price_per_hour': instance.perHour,
      'total_price': instance.totalPrice,
    };
