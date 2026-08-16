// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'archives_response_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ArchivesResponseModelImpl _$$ArchivesResponseModelImplFromJson(
        Map<String, dynamic> json) =>
    _$ArchivesResponseModelImpl(
      archives: json['items'] == null
          ? const []
          : const ArchiveEntityListConverter().fromJson(json['items'] as List),
      pagination: json['pagination'] == null
          ? const PaginationResponseModel()
          : const PaginationResponseEntityConverter()
              .fromJson(json['pagination'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$$ArchivesResponseModelImplToJson(
        _$ArchivesResponseModelImpl instance) =>
    <String, dynamic>{
      'items': const ArchiveEntityListConverter().toJson(instance.archives),
      'pagination':
          const PaginationResponseEntityConverter().toJson(instance.pagination),
    };
