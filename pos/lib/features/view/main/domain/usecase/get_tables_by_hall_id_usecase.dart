import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/repository/main_repository.dart';

class GetTablesByHallIdUsecase extends UseCase<List<CafeTableModel>, String> {
  final MainRepository _repository;
  GetTablesByHallIdUsecase(this._repository);

  @override
  Future<Either<Failure, List<CafeTableModel>>> call(String hallId) async =>
      await _repository.getTablesByHallId(hallId);
}
