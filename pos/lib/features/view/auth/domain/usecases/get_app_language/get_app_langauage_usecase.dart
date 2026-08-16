import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/auth/domain/repository/auth_repository.dart';

class GetAppLangauageUsecase extends UseCase<String, NoParams> {
  final AuthRepository _repo;

  GetAppLangauageUsecase(this._repo);

  @override
  Future<Either<Failure, String>> call(NoParams params) => _repo.getAppLang();
}
