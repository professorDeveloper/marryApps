import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/features/view/main/data/models/food_additional/food_additional_model.dart';

part 'goods_model.freezed.dart';
part 'goods_model.g.dart';
 
@freezed
class GoodsModel with _$GoodsModel {
  const factory GoodsModel({
    @JsonKey(name: 'category_id') required String categoryId,
    @JsonKey(name: 'color_code') String? colorCode,
    @JsonKey(name: 'cook_time') required int cookTime,
    @JsonKey(name: 'cost_price') required String costPrice,
    @JsonKey(name: 'department_id') @Default('') String departmentId,
    required String description,
    @JsonKey(name: 'description_i18n') String? descriptionI18n,
    required String id,
    required String name,
    @JsonKey(name: 'name_i18n') String? nameI18n,
    @JsonKey(name: 'picture_url') String? pictureUrl,
    required String price,
    required String profit,
    @JsonKey(name: 'profit_margin') required String profitMargin,
    @Default([])
    @JsonKey(includeFromJson: false, includeToJson: false)
    List<FoodAdditionalModel> additionals,
  }) = _GoodsModel;

  const GoodsModel._();

  factory GoodsModel.fromJson(Map<String, dynamic> json) =>
      _$GoodsModelFromJson(json);

  GoodsModel addAdditionals(
    GoodsModel model,
    List<FoodAdditionalModel> newAdditionals,
  ) => model.copyWith(additionals: newAdditionals);
}
