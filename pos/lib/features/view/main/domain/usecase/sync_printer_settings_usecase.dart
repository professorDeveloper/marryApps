import 'package:dartz/dartz.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/service/printer/printer_config_storage.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/main/domain/repository/main_repository.dart';

class SyncPrinterSettingsUsecase extends UseCase<Unit, NoParams> {
  SyncPrinterSettingsUsecase(this._repository, this._storage);

  final MainRepository _repository;
  final PrinterConfigStorage _storage;

  @override
  Future<Either<Failure, Unit>> call(NoParams params) async {
    final result = await _repository.getPrinterSettings();
    return result.fold(
      (l) async => Left<Failure, Unit>(l),
      (list) async {
        await _storage.applyPrinterSettingsList(list);
        return const Right(unit);
      },
    );
  }
}
