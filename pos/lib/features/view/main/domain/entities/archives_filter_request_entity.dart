import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/pagination_request_entity.dart';

abstract class ArchivesFilterRequestEntity {
  final int? archiveNum;
  final ArchivesFilterType filterType;
  final DateTime? startDate;
  final DateTime? endDate;
  final PaginationRequestEntity? pagination;

  ArchivesFilterRequestEntity({
    this.archiveNum,
    required this.filterType,
    this.startDate,
    this.endDate,
    this.pagination,
  });

  Map<String, dynamic> request();
}
