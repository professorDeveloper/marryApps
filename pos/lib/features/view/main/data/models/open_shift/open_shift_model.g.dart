// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'open_shift_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$OpenShiftModelImpl _$$OpenShiftModelImplFromJson(Map<String, dynamic> json) =>
    _$OpenShiftModelImpl(
      cashRegisterId: json['cash_register_id'] as String? ?? '',
      cashierId: json['cashier_id'] as String? ?? '',
      openCardSum: (json['opening_card'] as num?)?.toInt() ?? 0,
      openCashSum: (json['opening_cash'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$$OpenShiftModelImplToJson(
        _$OpenShiftModelImpl instance) =>
    <String, dynamic>{
      'cash_register_id': instance.cashRegisterId,
      'cashier_id': instance.cashierId,
      'opening_card': _intToString(instance.openCardSum),
      'opening_cash': _intToString(instance.openCashSum),
    };
