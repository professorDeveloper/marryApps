import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/auth/data/models/user/user_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/repository/main_repository.dart';

class GetUserUsecase extends UseCase<UserModel, NoParams> {
  final MainRepository repository;

  GetUserUsecase(this.repository);

  @override
  Future<Either<Failure, UserModel>> call(NoParams params) async =>
      await repository.getUser();
}
