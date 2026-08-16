// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'archives_filter_request_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ArchivesFilterRequestModelImpl _$$ArchivesFilterRequestModelImplFromJson(
        Map<String, dynamic> json) =>
    _$ArchivesFilterRequestModelImpl(
      archiveNum: (json['archiveNum'] as num?)?.toInt(),
      filterType: $enumDecodeNullable(
              _$ArchivesFilterTypeEnumMap, json['filterType']) ??
          ArchivesFilterType.Today,
      startDate: json['startDate'] == null
          ? null
          : DateTime.parse(json['startDate'] as String),
      endDate: json['endDate'] == null
          ? null
          : DateTime.parse(json['endDate'] as String),
      pagination: const PaginationRequestEntityConverter()
          .fromJson(json['pagination'] as Map<String, dynamic>?),
    );

Map<String, dynamic> _$$ArchivesFilterRequestModelImplToJson(
        _$ArchivesFilterRequestModelImpl instance) =>
    <String, dynamic>{
      'archiveNum': instance.archiveNum,
      'filterType': _$ArchivesFilterTypeEnumMap[instance.filterType]!,
      'startDate': instance.startDate?.toIso8601String(),
      'endDate': instance.endDate?.toIso8601String(),
      'pagination':
          const PaginationRequestEntityConverter().toJson(instance.pagination),
    };

const _$ArchivesFilterTypeEnumMap = {
  ArchivesFilterType.All: 'All',
  ArchivesFilterType.Today: 'Today',
  ArchivesFilterType.Week: 'Week',
  ArchivesFilterType.month: 'month',
  ArchivesFilterType.date: 'date',
};
