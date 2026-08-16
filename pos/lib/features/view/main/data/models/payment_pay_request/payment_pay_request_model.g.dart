// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'payment_pay_request_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$PaymentPayRequestModelImpl _$$PaymentPayRequestModelImplFromJson(
        Map<String, dynamic> json) =>
    _$PaymentPayRequestModelImpl(
      orderId: json['order_id'] as String? ?? '',
      cashRegisterId: json['cash_register_id'] as String? ?? '',
      cashierId: json['cashier_id'] as String? ?? '',
      customPaidAmount: (json['customer_paid_amount'] as num?)?.toInt() ?? 0,
      discountAmount: (json['discount_amount'] as num?)?.toInt() ?? 0,
      discountPercent: (json['discount_percent'] as num?)?.toInt() ?? 0,
      paymentType:
          $enumDecodeNullable(_$PaymentTypeEnumMap, json['payment_type']) ??
              PaymentType.cash,
      comment: json['comment'] as String? ?? '',
    );

Map<String, dynamic> _$$PaymentPayRequestModelImplToJson(
        _$PaymentPayRequestModelImpl instance) =>
    <String, dynamic>{
      'order_id': instance.orderId,
      'cash_register_id': instance.cashRegisterId,
      'cashier_id': instance.cashierId,
      'customer_paid_amount': instance.customPaidAmount,
      'discount_amount': instance.discountAmount,
      'discount_percent': instance.discountPercent,
      'payment_type': _$PaymentTypeEnumMap[instance.paymentType]!,
      'comment': instance.comment,
    };

const _$PaymentTypeEnumMap = {
  PaymentType.cash: 'cash',
  PaymentType.card: 'card',
  PaymentType.qr: 'qr',
};
