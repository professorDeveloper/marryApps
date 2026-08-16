import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';

part 'user_model.freezed.dart';
part 'user_model.g.dart';

// Backend uses `full_name` (snake_case), but offline-cached payloads saved
// by older builds may contain `fullName` (camelCase). `readValue` accepts both
// while keeping the standard freezed fromJson factory (so toJson is generated).
Object? _readFullName(Map json, String key) =>
    json['full_name'] ?? json['fullName'];

@freezed
class UserModel with _$UserModel {
  const factory UserModel({
    @Default('') String id,
    @JsonKey(name: 'full_name', readValue: _readFullName)
    @Default('')
    String fullName,
    @Default('') String username,
    @Default(UserRole.none) UserRole role,
    @JsonKey(name: "is_active") @Default(false) bool isActive,
    @JsonKey(name: "phone_number") @Default('') String phoneNumber,
    @JsonKey(name: 'brand_id') @Default('') String brandId,
    @JsonKey(name: 'branch_id') @Default('') String branchId,
    @JsonKey(name: 'created_at') DateTime? createAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _UserModel;

  const UserModel._();

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);
}
