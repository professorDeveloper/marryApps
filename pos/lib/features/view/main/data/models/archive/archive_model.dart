import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/extension/int_extension.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archive_entity.dart';

part 'archive_model.freezed.dart';
part 'archive_model.g.dart';

// Backend sanalari UTC'da kelgani uchun qurilmaning lokal zonasiga o'giramiz.
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
class ArchiveModel with _$ArchiveModel implements ArchiveEntity {
  const ArchiveModel._();

  const factory ArchiveModel({
    @Default('') String id,
    @JsonKey(name: 'bill_no', fromJson: parseInt) @Default(0) int bilNumber,
    @JsonKey(name: "bill_status") @Default(OrderStatus.none) OrderStatus status,
    @JsonKey(name: "opened_at", fromJson: _parseLocal) DateTime? opened,
    @JsonKey(name: 'table_number', fromJson: parseInt)
    @Default(0)
    int tableNumber,
    @JsonKey(name: 'grand_total', fromJson: parseInt)
    @Default(0)
    int totalPrice,
    @JsonKey(name: "food_total", fromJson: parseInt) @Default(0) int goodsTotal,
    @JsonKey(name: "service_amount", fromJson: parseInt)
    @Default(0)
    int serviceAmount,
    @JsonKey(name: "discount_amount", fromJson: parseInt)
    @Default(0)
    int discountAmount,
    @JsonKey(name: "quantity", fromJson: parseInt)
    @Default(0)
    int goodsQuantity,
    @JsonKey(name: "customer_paid_amount", fromJson: parseInt)
    @Default(0)
    int customerPaidAmount,
  }) = _ArchiveModel;

  factory ArchiveModel.fromJson(Map<String, dynamic> json) =>
      _$ArchiveModelFromJson(json);
}

class ArchiveEntityListConverter
    implements JsonConverter<List<ArchiveEntity>, List<dynamic>> {
  const ArchiveEntityListConverter();

  @override
  List<ArchiveEntity> fromJson(List<dynamic> json) {
    return json
        .whereType<Map>()
        .map((item) => ArchiveModel.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  @override
  List<dynamic> toJson(List<ArchiveEntity> object) {
    return object
        .map(
          (item) => item is ArchiveModel
              ? item.toJson()
              : {
                  'id': item.id,
                  'bil_number': item.bilNumber,
                  'status': item.status.name.toLowerCase(),
                  'opened': item.opened?.toIso8601String(),
                  'table_number': item.tableNumber,
                  'total_price': item.totalPrice,
                },
        )
        .toList();
  }
}
