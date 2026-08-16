// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'order_food_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$OrderFoodModelImpl _$$OrderFoodModelImplFromJson(Map<String, dynamic> json) =>
    _$OrderFoodModelImpl(
      id: json['id'] as String? ?? '',
      name: json['good_name'] as String? ?? '',
      quantity: (json['quantity'] as num?)?.toInt() ?? 0,
      price: json['price'] == null ? 0 : parseInt(json['price']),
      comment: json['comment'] as String? ?? '',
      status: json['status'] as String? ?? 'pending',
      createdAt: _parseLocalDate(json['created_at']),
    );

Map<String, dynamic> _$$OrderFoodModelImplToJson(
        _$OrderFoodModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'good_name': instance.name,
      'quantity': instance.quantity,
      'price': instance.price,
      'comment': instance.comment,
      'status': instance.status,
      'created_at': instance.createdAt?.toIso8601String(),
    };
