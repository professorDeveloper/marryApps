// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'close_shift_request_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CloseShiftRequestModelImpl _$$CloseShiftRequestModelImplFromJson(
        Map<String, dynamic> json) =>
    _$CloseShiftRequestModelImpl(
      shiftId: json['shiftId'] as String? ?? '',
      closingCard: (json['closing_card'] as num?)?.toInt() ?? 0,
      closingCash: (json['closing_cash'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$$CloseShiftRequestModelImplToJson(
        _$CloseShiftRequestModelImpl instance) =>
    <String, dynamic>{
      'shiftId': instance.shiftId,
      'closing_card': _intToString(instance.closingCard),
      'closing_cash': _intToString(instance.closingCash),
    };
