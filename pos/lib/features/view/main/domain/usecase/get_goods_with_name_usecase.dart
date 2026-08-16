import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/main/data/models/goods/goods_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/repository/main_repository.dart';

class GetGoodsWithNameUseCase implements UseCase<List<GoodsModel>, String> {
  final MainRepository _repository;

  GetGoodsWithNameUseCase(this._repository);

  @override
  Future<Either<Failure, List<GoodsModel>>> call(String name) async {
    return await _repository.getGoodsWithName(name);
  }
}
