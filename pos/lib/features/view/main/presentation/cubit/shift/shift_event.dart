part of 'shift_bloc.dart';

@freezed
class ShiftEvent with _$ShiftEvent {
  const factory ShiftEvent.started() = _Started;
  const factory ShiftEvent.checkShift() = _CheckShift;
  const factory ShiftEvent.updateCashSum({required String value}) = _UpdateCashSum;
  const factory ShiftEvent.updateCardSum({required String value}) = _UpdateCardSum;
  const factory ShiftEvent.updateSumType({required ShiftSumType type}) = _UpdateSumType;
  const factory ShiftEvent.openShift() = _OpenShift;
  const factory ShiftEvent.closeShift() = _CloseShift;
  /// Joriy smena bo‘yicha hisobotni kassir printeriga (naqdsiz).
  const factory ShiftEvent.printShiftReport() = _PrintShiftReport;
}