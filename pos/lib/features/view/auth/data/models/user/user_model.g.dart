// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$UserModelImpl _$$UserModelImplFromJson(Map<String, dynamic> json) =>
    _$UserModelImpl(
      id: json['id'] as String? ?? '',
      fullName: _readFullName(json, 'full_name') as String? ?? '',
      username: json['username'] as String? ?? '',
      role:
          $enumDecodeNullable(_$UserRoleEnumMap, json['role']) ?? UserRole.none,
      isActive: json['is_active'] as bool? ?? false,
      phoneNumber: json['phone_number'] as String? ?? '',
      brandId: json['brand_id'] as String? ?? '',
      branchId: json['branch_id'] as String? ?? '',
      createAt: json['created_at'] == null
          ? null
          : DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] == null
          ? null
          : DateTime.parse(json['updated_at'] as String),
    );

Map<String, dynamic> _$$UserModelImplToJson(_$UserModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'full_name': instance.fullName,
      'username': instance.username,
      'role': _$UserRoleEnumMap[instance.role]!,
      'is_active': instance.isActive,
      'phone_number': instance.phoneNumber,
      'brand_id': instance.brandId,
      'branch_id': instance.branchId,
      'created_at': instance.createAt?.toIso8601String(),
      'updated_at': instance.updatedAt?.toIso8601String(),
    };

const _$UserRoleEnumMap = {
  UserRole.admin: 'admin',
  UserRole.manager: 'manager',
  UserRole.cashier: 'cashier',
  UserRole.waiter: 'waiter',
  UserRole.kitchen: 'kitchen',
  UserRole.user: 'user',
  UserRole.superadmin: 'superadmin',
  UserRole.none: 'none',
};
