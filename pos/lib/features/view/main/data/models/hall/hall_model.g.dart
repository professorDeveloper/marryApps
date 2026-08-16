// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'hall_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$HallModelImpl _$$HallModelImplFromJson(Map<String, dynamic> json) =>
    _$HallModelImpl(
      id: json['id'] as String,
      branchId: json['branch_id'] as String,
      name: json['name'] as String,
      nameI18n: json['name_i18n'] as Map<String, dynamic>?,
      width: (json['width'] as num).toDouble(),
      height: (json['height'] as num).toDouble(),
    );

Map<String, dynamic> _$$HallModelImplToJson(_$HallModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'branch_id': instance.branchId,
      'name': instance.name,
      'name_i18n': instance.nameI18n,
      'width': instance.width,
      'height': instance.height,
    };
