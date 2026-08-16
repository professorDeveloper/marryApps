part of 'shift_bloc.dart';

@freezed
class ShiftState with _$ShiftState {
  const factory ShiftState({
    @Default(Status.UNKNOWN) Status status,
    ShiftResponseModel? shift,
    @Default(ShiftSumType.cash) ShiftSumType sum,
    @Default("0") String cashSum,
    @Default('0') String cardSum,
    Failure? failure,
  }) = _ShiftState;
}
