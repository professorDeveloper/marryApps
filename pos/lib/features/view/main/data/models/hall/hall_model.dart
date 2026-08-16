import 'package:freezed_annotation/freezed_annotation.dart';

part 'hall_model.freezed.dart';
part 'hall_model.g.dart';

@freezed
class HallModel with _$HallModel {
  const factory HallModel({
    required String id,
    @JsonKey(name: 'branch_id') required String branchId,
    required String name,
    @JsonKey(name: 'name_i18n') Map<String, dynamic>? nameI18n,
    required double width,
    required double height,
  }) = _HallModel;

  factory HallModel.fromJson(Map<String, dynamic> json) =>
      _$HallModelFromJson(json);
}
