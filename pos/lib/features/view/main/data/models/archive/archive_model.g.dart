// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'archive_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ArchiveModelImpl _$$ArchiveModelImplFromJson(Map<String, dynamic> json) =>
    _$ArchiveModelImpl(
      id: json['id'] as String? ?? '',
      bilNumber: json['bill_no'] == null ? 0 : parseInt(json['bill_no']),
      status: $enumDecodeNullable(_$OrderStatusEnumMap, json['bill_status']) ??
          OrderStatus.none,
      opened: _parseLocal(json['opened_at']),
      tableNumber:
          json['table_number'] == null ? 0 : parseInt(json['table_number']),
      totalPrice:
          json['grand_total'] == null ? 0 : parseInt(json['grand_total']),
      goodsTotal: json['food_total'] == null ? 0 : parseInt(json['food_total']),
      serviceAmount:
          json['service_amount'] == null ? 0 : parseInt(json['service_amount']),
      discountAmount: json['discount_amount'] == null
          ? 0
          : parseInt(json['discount_amount']),
      goodsQuantity: json['quantity'] == null ? 0 : parseInt(json['quantity']),
      customerPaidAmount: json['customer_paid_amount'] == null
          ? 0
          : parseInt(json['customer_paid_amount']),
    );

Map<String, dynamic> _$$ArchiveModelImplToJson(_$ArchiveModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'bill_no': instance.bilNumber,
      'bill_status': _$OrderStatusEnumMap[instance.status]!,
      'opened_at': instance.opened?.toIso8601String(),
      'table_number': instance.tableNumber,
      'grand_total': instance.totalPrice,
      'food_total': instance.goodsTotal,
      'service_amount': instance.serviceAmount,
      'discount_amount': instance.discountAmount,
      'quantity': instance.goodsQuantity,
      'customer_paid_amount': instance.customerPaidAmount,
    };

const _$OrderStatusEnumMap = {
  OrderStatus.opened: 'opened',
  OrderStatus.pending: 'pending',
  OrderStatus.open: 'open',
  OrderStatus.closed: 'closed',
  OrderStatus.paid: 'paid',
  OrderStatus.debt: 'debt',
  OrderStatus.deleted: 'deleted',
  OrderStatus.none: 'none',
};
