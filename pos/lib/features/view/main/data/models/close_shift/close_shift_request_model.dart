import 'package:freezed_annotation/freezed_annotation.dart';

part 'close_shift_request_model.freezed.dart';
part 'close_shift_request_model.g.dart';

String _intToString(int value) => value.toString();


@freezed
class CloseShiftRequestModel with _$CloseShiftRequestModel {
  const factory CloseShiftRequestModel({
    @Default('') String shiftId,
    @JsonKey(name: "closing_card",toJson: _intToString) @Default(0) int closingCard,
    @JsonKey(name: "closing_cash",toJson: _intToString) @Default(0) int closingCash,
  }) = _CloseShiftRequestModel;

  const CloseShiftRequestModel._();

 factory CloseShiftRequestModel.fromJson(Map<String,dynamic> json) => _$CloseShiftRequestModelFromJson(json);
}
