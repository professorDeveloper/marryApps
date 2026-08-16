import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/main/data/models/hall/hall_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/repository/main_repository.dart';

class GetHallsUsecase extends UseCase<List<HallModel>, NoParams> {
  final MainRepository _repository;
  GetHallsUsecase(this._repository);

  @override
  Future<Either<Failure, List<HallModel>>> call(NoParams params) async =>
      await _repository.getHalls();
}
