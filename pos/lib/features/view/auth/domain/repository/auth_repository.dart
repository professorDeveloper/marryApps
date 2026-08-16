import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/auth/models/brand_id_token_pair/brand_id_token_pair.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/features/view/auth/data/models/login/request/login_request_model.dart';

abstract class AuthRepository {
  Future<Either<Failure, bool>> checkUserToAuth();
  Future<Either<Failure, bool>> logoutFromApp();
  Future<Either<Failure, bool>> logout();
  Future<Either<Failure, bool>> haveUserData();
  Future<Either<Failure, bool>> login(LoginRequestModel req);
  Future<Either<Failure, bool>> loginWithBrandId(BrandIdTokenPair req);
  Future<Either<Failure, String>> setAppLang(String lang);
  Future<Either<Failure, String>> getAppLang();
}
