import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/payment_pay_request_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/repository/main_repository.dart';

class CreatePaymentUsecase implements UseCase<bool, PaymentPayRequestEntity> {
  final MainRepository repository;

  CreatePaymentUsecase(this.repository);

  @override
  Future<Either<Failure, bool>> call(PaymentPayRequestEntity params) async {
    return await repository.createPayment(request: params);
  }
}
