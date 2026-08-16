import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/core/api/api.dart';

part 'shift_response_model.freezed.dart';
part 'shift_response_model.g.dart';

int _parseIntFlex(dynamic v) {
  if (v == null) return 0;
  if (v is int) return v;
  if (v is num) return v.toInt();
  if (v is String) return int.tryParse(v) ?? 0;
  return 0;
}

// Backend UTC sanalarini qurilma lokal zonasiga o'giradi.
DateTime? _parseLocal(Object? v) {
  if (v == null) return null;
  if (v is String) {
    if (v.isEmpty) return null;
    return DateTime.tryParse(v)?.toLocal();
  }
  if (v is DateTime) return v.toLocal();
  return null;
}

@freezed
class ShiftResponseModel with _$ShiftResponseModel {
  const factory ShiftResponseModel({
    @Default('') String id,
    @JsonKey(name: "branch_id") @Default('') String branchId,
    @JsonKey(name: "cash_register_id") @Default('') String cashRegisterId,
    @JsonKey(name: "cashier_id") @Default('') String cashierId,
    @JsonKey(name: "opened_at", fromJson: _parseLocal) DateTime? openedAt,
    @JsonKey(name: "opening_cash", fromJson: _parseIntFlex)
    @Default(0)
    int openingCash,
    @JsonKey(name: "opening_card", fromJson: _parseIntFlex)
    @Default(0)
    int openinCard,
    @Default(CashStatus.none) CashStatus status,
    @JsonKey(name: "created_at", fromJson: _parseLocal) DateTime? createdAt,
    @JsonKey(name: "updated_at", fromJson: _parseLocal) DateTime? updatedAt,
  }) = _ShiftResponseModel;

  const ShiftResponseModel._();

  factory ShiftResponseModel.fromJson(Map<String, dynamic> json) =>
      _$ShiftResponseModelFromJson(json);
}
