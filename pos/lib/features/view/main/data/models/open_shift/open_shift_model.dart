import 'package:freezed_annotation/freezed_annotation.dart';

part 'open_shift_model.freezed.dart';
part 'open_shift_model.g.dart';

String _intToString(int value) => value.toString();

@freezed
class OpenShiftModel with _$OpenShiftModel {
  const factory OpenShiftModel({
    @JsonKey(name: "cash_register_id") @Default('') String cashRegisterId,
    @JsonKey(name: "cashier_id") @Default('') String cashierId,
    @JsonKey(name: "opening_card", toJson: _intToString)
    @Default(0) int openCardSum,
    @JsonKey(name: "opening_cash", toJson: _intToString) @Default(0) int openCashSum,
  }) = _OpenShiftModel;

  const OpenShiftModel._();

  factory OpenShiftModel.fromJson(Map<String, dynamic> json) =>
      _$OpenShiftModelFromJson(json);

  //   Map<String, dynamic> request() => {
  //   "cash_register_id": cashRegisterId,
  //   "cashier_id": "7fb82f74-3e43-4a51-8a41-a7f871c25f51",
  //   "opening_card": "0.00",
  //   "opening_cash": "0.00"
  // };
}
