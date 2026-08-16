import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/main/data/models/category/category_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/repository/main_repository.dart';

class GetCategoriesUsecase extends UseCase<List<CategoryModel>, NoParams> {
  final MainRepository _repository;
  GetCategoriesUsecase(this._repository);

  @override
  Future<Either<Failure, List<CategoryModel>>> call(NoParams params) async =>
      await _repository.getCategories();
}
