import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/auth/domain/repository/auth_repository.dart';

class LogoutUsecase extends UseCase<bool, NoParams> {
  final AuthRepository _repository;
  LogoutUsecase(this._repository);

  @override
  Future<Either<Failure, bool>> call(NoParams params) => _repository.logout();
}
