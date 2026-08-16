// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'goods_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$GoodsModelImpl _$$GoodsModelImplFromJson(Map<String, dynamic> json) =>
    _$GoodsModelImpl(
      categoryId: json['category_id'] as String,
      colorCode: json['color_code'] as String?,
      cookTime: (json['cook_time'] as num).toInt(),
      costPrice: json['cost_price'] as String,
      departmentId: json['department_id'] as String? ?? '',
      description: json['description'] as String,
      descriptionI18n: json['description_i18n'] as String?,
      id: json['id'] as String,
      name: json['name'] as String,
      nameI18n: json['name_i18n'] as String?,
      pictureUrl: json['picture_url'] as String?,
      price: json['price'] as String,
      profit: json['profit'] as String,
      profitMargin: json['profit_margin'] as String,
    );

Map<String, dynamic> _$$GoodsModelImplToJson(_$GoodsModelImpl instance) =>
    <String, dynamic>{
      'category_id': instance.categoryId,
      'color_code': instance.colorCode,
      'cook_time': instance.cookTime,
      'cost_price': instance.costPrice,
      'department_id': instance.departmentId,
      'description': instance.description,
      'description_i18n': instance.descriptionI18n,
      'id': instance.id,
      'name': instance.name,
      'name_i18n': instance.nameI18n,
      'picture_url': instance.pictureUrl,
      'price': instance.price,
      'profit': instance.profit,
      'profit_margin': instance.profitMargin,
    };
