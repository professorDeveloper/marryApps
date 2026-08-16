import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/main/data/models/create_order/create_order_request_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/repository/main_repository.dart';

class CreateTakeAwayOrderUsecase
    extends UseCase<String, CreateOrderRequestModel> {
  late final MainRepository _repository;

  CreateTakeAwayOrderUsecase(this._repository);

  @override
  Future<Either<Failure, String>> call(CreateOrderRequestModel params) async =>
      await _repository.createTakewayOrder(request: params);
}
