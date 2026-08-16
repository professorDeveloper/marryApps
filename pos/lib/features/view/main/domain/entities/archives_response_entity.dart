import 'package:mary_ai_pos/features/view/main/domain/entities/archive_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/pagination_response_entity.dart';

abstract class ArchivesResponseEntity {
  final List<ArchiveEntity> archives;
  final PaginationResponseEntity pagination;

  ArchivesResponseEntity({required this.archives, required this.pagination});

  ArchivesResponseEntity updateModel(ArchivesResponseEntity newModel);
}
