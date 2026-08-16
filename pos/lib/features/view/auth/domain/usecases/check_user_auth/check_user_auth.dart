import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/features/view/auth/domain/repository/auth_repository.dart';

class CheckUserAuthUseCase extends UseCase<bool, NoParams> {
  final AuthRepository _repository;
  CheckUserAuthUseCase(this._repository);

  @override
  Future<Either<Failure, bool>> call(NoParams params) async =>
      await _repository.checkUserToAuth();
}
