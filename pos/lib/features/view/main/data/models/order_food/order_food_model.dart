import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/core/extension/int_extension.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/order_food_entity.dart';

part 'order_food_model.freezed.dart';
part 'order_food_model.g.dart';

@freezed
class OrderFoodModel with _$OrderFoodModel implements OrderFoodEntity {
  const OrderFoodModel._();

  const factory OrderFoodModel({
    @Default('') String id,
    @JsonKey(name: "good_name") @Default('') String name,
    @Default(0) int quantity,
    @JsonKey(fromJson: parseInt) @Default(0) int price,
    @Default('') String comment,
    @Default('pending') String status,
    // Backend `created_at` (UTC) — har bir item qachon buyurtmaga qo'shilgan.
    // Agar mavjud bo'lsa, UI vaqt belgisi sifatida ko'rsatadi.
    @JsonKey(name: 'created_at', fromJson: _parseLocalDate) DateTime? createdAt,
  }) = _OrderFoodModel;

  factory OrderFoodModel.fromJson(Map<String, dynamic> json) =>
      _$OrderFoodModelFromJson(json);
}

DateTime? _parseLocalDate(Object? v) {
  if (v == null) return null;
  if (v is String) {
    if (v.isEmpty) return null;
    return DateTime.tryParse(v)?.toLocal();
  }
  if (v is DateTime) return v.toLocal();
  return null;
}

class OrderFoodEntityListConverter
    implements JsonConverter<List<OrderFoodEntity>, List<dynamic>> {
  const OrderFoodEntityListConverter();

  @override
  List<OrderFoodEntity> fromJson(List<dynamic> json) {
    return json
        .whereType<Map>()
        .map((item) => OrderFoodModel.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  @override
  List<dynamic> toJson(List<OrderFoodEntity> object) {
    return object
        .map(
          (item) => item is OrderFoodModel
              ? item.toJson()
              : {
                  'id': item.id,
                  'name': item.name,
                  'quantity': item.quantity,
                  'price': item.price,
                  'comment': item.comment,
                },
        )
        .toList();
  }
}
