// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'cafe_tables_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CafeTableModelImpl _$$CafeTableModelImplFromJson(Map<String, dynamic> json) =>
    _$CafeTableModelImpl(
      id: json['id'] as String,
      hallId: json['hall_id'] as String,
      number: (json['number'] as num).toInt(),
      posX: (json['pos_x'] as num).toDouble(),
      posY: (json['pos_y'] as num).toDouble(),
      width: (json['width'] as num).toDouble(),
      height: (json['height'] as num).toDouble(),
      rotation: (json['rotation'] as num).toDouble(),
      capacity: (json['capacity'] as num).toInt(),
      status: $enumDecodeNullable(_$TableStatusEnumMap, json['status']) ??
          TableStatus.free,
      shape: $enumDecodeNullable(_$TableShapeEnumMap, json['shape'],
              unknownValue: TableShape.rectangle) ??
          TableShape.rectangle,
      tableType: json['table_type'] as String?,
    );

Map<String, dynamic> _$$CafeTableModelImplToJson(
        _$CafeTableModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'hall_id': instance.hallId,
      'number': instance.number,
      'pos_x': instance.posX,
      'pos_y': instance.posY,
      'width': instance.width,
      'height': instance.height,
      'rotation': instance.rotation,
      'capacity': instance.capacity,
      'status': _$TableStatusEnumMap[instance.status]!,
      'shape': _$TableShapeEnumMap[instance.shape]!,
      'table_type': instance.tableType,
    };

const _$TableStatusEnumMap = {
  TableStatus.free: 'free',
  TableStatus.busy: 'busy',
  TableStatus.away: 'away',
  TableStatus.none: 'none',
};

const _$TableShapeEnumMap = {
  TableShape.rectangle: 'rectangle',
  TableShape.circle: 'circle',
  TableShape.square: 'square',
};
