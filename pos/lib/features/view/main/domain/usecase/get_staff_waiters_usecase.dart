import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/auth/data/models/user/user_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/repository/main_repository.dart';

/// Loads branch users and keeps only active waiters (for order assignment).
class GetStaffWaitersUsecase extends UseCase<List<UserModel>, NoParams> {
  final MainRepository _repository;

  GetStaffWaitersUsecase(this._repository);

  @override
  Future<Either<Failure, List<UserModel>>> call(NoParams params) async {
    final result = await _repository.getUsers();
    return result.map(
      (users) => users.where((u) => u.role == UserRole.waiter).toList(),
    );
  }
}
