// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'shift_response_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ShiftResponseModelImpl _$$ShiftResponseModelImplFromJson(
        Map<String, dynamic> json) =>
    _$ShiftResponseModelImpl(
      id: json['id'] as String? ?? '',
      branchId: json['branch_id'] as String? ?? '',
      cashRegisterId: json['cash_register_id'] as String? ?? '',
      cashierId: json['cashier_id'] as String? ?? '',
      openedAt: _parseLocal(json['opened_at']),
      openingCash: json['opening_cash'] == null
          ? 0
          : _parseIntFlex(json['opening_cash']),
      openinCard: json['opening_card'] == null
          ? 0
          : _parseIntFlex(json['opening_card']),
      status: $enumDecodeNullable(_$CashStatusEnumMap, json['status']) ??
          CashStatus.none,
      createdAt: _parseLocal(json['created_at']),
      updatedAt: _parseLocal(json['updated_at']),
    );

Map<String, dynamic> _$$ShiftResponseModelImplToJson(
        _$ShiftResponseModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'branch_id': instance.branchId,
      'cash_register_id': instance.cashRegisterId,
      'cashier_id': instance.cashierId,
      'opened_at': instance.openedAt?.toIso8601String(),
      'opening_cash': instance.openingCash,
      'opening_card': instance.openinCard,
      'status': _$CashStatusEnumMap[instance.status]!,
      'created_at': instance.createdAt?.toIso8601String(),
      'updated_at': instance.updatedAt?.toIso8601String(),
    };

const _$CashStatusEnumMap = {
  CashStatus.open: 'open',
  CashStatus.close: 'close',
  CashStatus.none: 'none',
};
