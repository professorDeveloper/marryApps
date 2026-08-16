import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/hour_price_response_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/repository/main_repository.dart';

class GetHourPriceUsecase extends UseCase<HourPriceResponseEntity, String> {
  late final MainRepository _repository;

  GetHourPriceUsecase({required MainRepository repository})
    : _repository = repository;

  @override
  Future<Either<Failure, HourPriceResponseEntity>> call(String params) async =>
      await _repository.getHourPrice(orderId: params);
}
