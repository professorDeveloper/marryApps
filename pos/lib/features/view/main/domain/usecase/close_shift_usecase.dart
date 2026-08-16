import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/main/data/models/close_shift/close_shift_request_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/repository/main_repository.dart';

class CloseShiftUsecase extends UseCase<bool, CloseShiftRequestModel> {
  final MainRepository repository;

  CloseShiftUsecase(this.repository);

  @override
  Future<Either<Failure, bool>> call(CloseShiftRequestModel params) async =>
      await repository.closeShift(request: params);
}
