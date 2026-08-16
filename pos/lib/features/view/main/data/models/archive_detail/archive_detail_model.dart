import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/features/view/main/data/models/order_food/order_food_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archive_detail_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/order_food_entity.dart';

part 'archive_detail_model.freezed.dart';
part 'archive_detail_model.g.dart';

@freezed
class ArchiveDetailModel
    with _$ArchiveDetailModel
    implements ArchiveDetailEntity {
  const ArchiveDetailModel._();

  const factory ArchiveDetailModel({
    @Default('') String id,
    @JsonKey(name: 'bill_no') @Default(0) int bilNumber,
    @JsonKey(name: 'bill_status') @Default(OrderStatus.none) OrderStatus status,
    @JsonKey(name: 'opened_at', fromJson: _parseLocal) DateTime? opened,
    @JsonKey(name: 'payment_type') @Default('') String paymentType,
    @JsonKey(name: 'table_id') @Default('') String tableId,
    @JsonKey(name: 'table_number', fromJson: _parseDouble) @Default(0.0) double tableNumber,
    @JsonKey(name: 'hall_name') @Default('') String hallName,
    @JsonKey(name: 'cashier_id') @Default('') String cashierId,
    @JsonKey(name: 'cashier_name') @Default('') String cashierName,
    @JsonKey(name: 'guest_count', fromJson: _parseDouble) @Default(0.0) double guestCount,
    @JsonKey(name: 'food_cost', fromJson: _parseDouble) @Default(0.0) double foodCost,
    @JsonKey(name: 'food_total', fromJson: _parseDouble) @Default(0.0) double foodTotal,
    @JsonKey(name: 'service_percent', fromJson: _parseDouble)
    @Default(0.0)
    double servicePercent,
    @JsonKey(name: 'service_amount', fromJson: _parseDouble)
    @Default(0.0)
    double serviceAmount,
    @JsonKey(name: 'discount_percent', fromJson: _parseDouble)
    @Default(0.0)
    double discountPercent,
    @JsonKey(name: 'discount_amount', fromJson: _parseDouble)
    @Default(0.0)
    double discountAmount,
    @JsonKey(name: 'grand_total', fromJson: _parseDouble)
    @Default(0.0)
    double grandTotal,
    @JsonKey(name: 'customer_paid_amount', fromJson: _parseDouble)
    @Default(0.0)
    double customerPaidAmount,
    @JsonKey(name: 'change_amount', fromJson: _parseDouble)
    @Default(0.0)
    double changeAmount,
    @JsonKey(name: 'comment') @Default('') String comment,
    @JsonKey(name: "items")
    @OrderFoodEntityListConverter()
    @Default([])
    List<OrderFoodEntity> goods,
  }) = _ArchiveDetailModel;

  factory ArchiveDetailModel.fromJson(Map<String, dynamic> json) =>
      _$ArchiveDetailModelFromJson(json);
}

int _parseFromStringFromDoubleToInt(dynamic value) {
  if (value == null) return 0;
  if (value is int) return value;
  if (value is String) {
    if (value.isEmpty) return 0;

    if (double.tryParse(value) != null) {
      return double.parse(value).toInt();
    }
    return int.tryParse(value) ?? 0;
  }
  return 0;
}

int _parseInt(dynamic value) {
  if (value == null) return 0;
  if (value is int) return value;
  if (value is String) {
    if (value.isEmpty) return 0;
    return int.tryParse(value) ?? 0;
  }
  return 0;
}

double _parseDouble(dynamic value) {
  if (value == null) return 0.0;
  if (value is num) return value.toDouble();
  if (value is String) {
    if (value.isEmpty) return 0.0;
    return double.tryParse(value) ?? 0.0;
  }
  return 0.0;
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
