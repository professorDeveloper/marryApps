import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archives_filter_request_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archives_response_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/repository/main_repository.dart';

class GetArchivesUsecase
    extends UseCase<ArchivesResponseEntity, ArchivesFilterRequestEntity> {
  final MainRepository _repository;
  GetArchivesUsecase(this._repository);

  @override
  Future<Either<Failure, ArchivesResponseEntity>> call(
    ArchivesFilterRequestEntity params,
  ) async => await _repository.getArchives(params);
}
