import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/main/data/models/open_shift/open_shift_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/shift/shift_response_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/repository/main_repository.dart';

class OpenShiftUsecase extends UseCase<ShiftResponseModel, OpenShiftModel> {
  final MainRepository repository;

  OpenShiftUsecase(this.repository);

  @override
  Future<Either<Failure, ShiftResponseModel>> call(
    OpenShiftModel params,
  ) async => await repository.openShift(request: params);
}
