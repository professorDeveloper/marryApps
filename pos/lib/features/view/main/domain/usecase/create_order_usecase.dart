import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/main/data/models/create_order/create_order_request_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/repository/main_repository.dart';

class CreateOrderUsecase extends UseCase<bool, CreateOrderRequestModel> {
  late final MainRepository _repository;

  CreateOrderUsecase(this._repository);

  @override
  Future<Either<Failure, bool>> call(CreateOrderRequestModel params) async =>
      await _repository.createOrder(request: params);
}
