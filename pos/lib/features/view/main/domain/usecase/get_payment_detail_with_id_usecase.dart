import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archive_detail_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/repository/main_repository.dart';

class GetPaymentDetailWithIdUsecase
    extends UseCase<ArchiveDetailEntity, String> {
  late final MainRepository repository;

  GetPaymentDetailWithIdUsecase({required this.repository});

  @override
  Future<Either<Failure, ArchiveDetailEntity>> call(String params) async =>
      await repository.getPaymentDetailWithId(params);
}
