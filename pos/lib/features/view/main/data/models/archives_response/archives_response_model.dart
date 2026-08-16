import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/features/view/main/data/models/archive/archive_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/pagination_response/pagination_response_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archive_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archives_response_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/pagination_response_entity.dart';

part 'archives_response_model.freezed.dart';
part 'archives_response_model.g.dart';

@freezed
class ArchivesResponseModel
    with _$ArchivesResponseModel
    implements ArchivesResponseEntity {
  const ArchivesResponseModel._();

  const factory ArchivesResponseModel({
    @JsonKey(name: "items")
    @ArchiveEntityListConverter()
    @Default([])
    List<ArchiveEntity> archives,
    @PaginationResponseEntityConverter()
    @Default(PaginationResponseModel())
    PaginationResponseEntity pagination,
  }) = _ArchivesResponseModel;

  factory ArchivesResponseModel.fromJson(Map<String, dynamic> json) =>
      _$ArchivesResponseModelFromJson(json);

  @override
  ArchivesResponseEntity updateModel(ArchivesResponseEntity newModel) {
    final Map<String, ArchiveEntity> uniqueMap = {};
    for (final item in newModel.archives) {
      uniqueMap[item.id] = item;
    }

    return copyWith(
      archives: uniqueMap.values.toList(),
      pagination: newModel.pagination,
    );
  }
}
