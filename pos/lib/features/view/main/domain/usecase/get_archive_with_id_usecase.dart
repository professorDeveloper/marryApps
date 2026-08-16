import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archive_detail_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/repository/main_repository.dart';

class GetArchiveWithIdUsecase implements UseCase<ArchiveDetailEntity, String> {
  final MainRepository _repository;

  GetArchiveWithIdUsecase(this._repository);

  @override
  Future<Either<Failure, ArchiveDetailEntity>> call(String id) {
    return _repository.getArchiveWithId(id);
  }
}
