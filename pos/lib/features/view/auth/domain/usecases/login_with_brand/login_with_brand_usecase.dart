import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/auth/models/brand_id_token_pair/brand_id_token_pair.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/auth/domain/repository/auth_repository.dart';

class LoginWithBrandUsecase extends UseCase<bool, BrandIdTokenPair> {
  final AuthRepository _repository;
  LoginWithBrandUsecase(this._repository);

  @override
  Future<Either<Failure, bool>> call(BrandIdTokenPair params) =>
      _repository.loginWithBrandId(params);
}
