import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/main/data/models/shift/shift_response_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/repository/main_repository.dart';

class CheckShiftUsecase extends UseCase<ShiftResponseModel?, String> {
  final MainRepository repository;

  CheckShiftUsecase(this.repository);

  @override
  Future<Either<Failure, ShiftResponseModel?>> call(String params) async =>
      await repository.checkShift(id: params);
}
