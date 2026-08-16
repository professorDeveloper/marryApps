// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'category_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CategoryModelImpl _$$CategoryModelImplFromJson(Map<String, dynamic> json) =>
    _$CategoryModelImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      nameI18n: json['nameI18n'] as String?,
      pictureUrl: json['pictureUrl'] as String?,
      colorCode: json['colorCode'] as String?,
      departmentId: json['departmentId'] as String?,
    );

Map<String, dynamic> _$$CategoryModelImplToJson(_$CategoryModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'nameI18n': instance.nameI18n,
      'pictureUrl': instance.pictureUrl,
      'colorCode': instance.colorCode,
      'departmentId': instance.departmentId,
    };
