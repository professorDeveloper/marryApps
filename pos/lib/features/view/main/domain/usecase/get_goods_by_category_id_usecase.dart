import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/main/data/models/goods/goods_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/repository/main_repository.dart';

class GetGoodsByCategoryIdUseCase implements UseCase<List<GoodsModel>, String> {
  final MainRepository _repository;

  GetGoodsByCategoryIdUseCase(this._repository);

  @override
  Future<Either<Failure, List<GoodsModel>>> call(String categoryId) {
    return _repository.getGoodsByCategoryId(categoryId);
  }
}
