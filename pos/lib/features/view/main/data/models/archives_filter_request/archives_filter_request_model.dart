import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archives_filter_request_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/pagination_request_entity.dart';
import 'package:mary_ai_pos/features/view/main/data/models/pagination_request/pagination_request_model.dart';

part 'archives_filter_request_model.freezed.dart';
part 'archives_filter_request_model.g.dart';

@freezed
class ArchivesFilterRequestModel
    with _$ArchivesFilterRequestModel
    implements ArchivesFilterRequestEntity {
  const ArchivesFilterRequestModel._();

  const factory ArchivesFilterRequestModel({
    int? archiveNum,
    @Default(ArchivesFilterType.Today) ArchivesFilterType filterType,
    DateTime? startDate,
    DateTime? endDate,
    @PaginationRequestEntityConverter() PaginationRequestEntity? pagination,
  }) = _ArchivesFilterRequestModel;

  factory ArchivesFilterRequestModel.fromJson(Map<String, dynamic> json) =>
      _$ArchivesFilterRequestModelFromJson(json);

  @override
  Map<String, dynamic> request() {
    Map<String, dynamic> req = {};
    if (archiveNum != null) {
      req.addAll({"bill_no": archiveNum});
    }
    if (pagination != null) {
      req.addAll(pagination!.request());
    }

    switch (filterType) {
      case ArchivesFilterType.All:
        break;

      case ArchivesFilterType.Today:
        req.addAll({
          "start": DateTime.now()
              .subtract(const Duration(hours: 24))
              .toUtc()
              .toIso8601String(),
          "end": DateTime.now().toUtc().toIso8601String(),
        });
        break;

      case ArchivesFilterType.Week:
        req.addAll({
          "start": DateTime.now()
              .subtract(const Duration(days: 7))
              .toUtc()
              .toIso8601String(),
          "end": DateTime.now().toUtc().toIso8601String(),
        });
        break;

      case ArchivesFilterType.month:
        req.addAll({
          "start": DateTime.now()
              .subtract(const Duration(days: 30))
              .toUtc()
              .toIso8601String(),
          "end": DateTime.now().toUtc().toIso8601String(),
        });
        break;

      case ArchivesFilterType.date:
        if (startDate != null && endDate != null) {
          req.addAll({
            "start": startDate!.toUtc().toIso8601String(),
            "end": endDate!.toUtc().toIso8601String(),
          });
        }
        break;
    }
    return req;
  }
}
