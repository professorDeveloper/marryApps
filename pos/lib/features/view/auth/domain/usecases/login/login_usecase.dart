import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/auth/data/models/login/request/login_request_model.dart';
import 'package:mary_ai_pos/features/view/auth/domain/repository/auth_repository.dart';

class LoginUsecase extends UseCase<bool, LoginRequestModel> {
  final AuthRepository _repository;
  LoginUsecase(this._repository);

  @override
  Future<Either<Failure, bool>> call(LoginRequestModel params) =>
      _repository.login(params);
}
