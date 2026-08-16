// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'archive_detail_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ArchiveDetailModelImpl _$$ArchiveDetailModelImplFromJson(
        Map<String, dynamic> json) =>
    _$ArchiveDetailModelImpl(
      id: json['id'] as String? ?? '',
      bilNumber: (json['bill_no'] as num?)?.toInt() ?? 0,
      status: $enumDecodeNullable(_$OrderStatusEnumMap, json['bill_status']) ??
          OrderStatus.none,
      opened: _parseLocal(json['opened_at']),
      paymentType: json['payment_type'] as String? ?? '',
      tableId: json['table_id'] as String? ?? '',
      tableNumber: json['table_number'] == null
          ? 0.0
          : _parseDouble(json['table_number']),
      hallName: json['hall_name'] as String? ?? '',
      cashierId: json['cashier_id'] as String? ?? '',
      cashierName: json['cashier_name'] as String? ?? '',
      guestCount:
          json['guest_count'] == null ? 0.0 : _parseDouble(json['guest_count']),
      foodCost:
          json['food_cost'] == null ? 0.0 : _parseDouble(json['food_cost']),
      foodTotal:
          json['food_total'] == null ? 0.0 : _parseDouble(json['food_total']),
      servicePercent: json['service_percent'] == null
          ? 0.0
          : _parseDouble(json['service_percent']),
      serviceAmount: json['service_amount'] == null
          ? 0.0
          : _parseDouble(json['service_amount']),
      discountPercent: json['discount_percent'] == null
          ? 0.0
          : _parseDouble(json['discount_percent']),
      discountAmount: json['discount_amount'] == null
          ? 0.0
          : _parseDouble(json['discount_amount']),
      grandTotal:
          json['grand_total'] == null ? 0.0 : _parseDouble(json['grand_total']),
      customerPaidAmount: json['customer_paid_amount'] == null
          ? 0.0
          : _parseDouble(json['customer_paid_amount']),
      changeAmount: json['change_amount'] == null
          ? 0.0
          : _parseDouble(json['change_amount']),
      comment: json['comment'] as String? ?? '',
      goods: json['items'] == null
          ? const []
          : const OrderFoodEntityListConverter()
              .fromJson(json['items'] as List),
    );

Map<String, dynamic> _$$ArchiveDetailModelImplToJson(
        _$ArchiveDetailModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'bill_no': instance.bilNumber,
      'bill_status': _$OrderStatusEnumMap[instance.status]!,
      'opened_at': instance.opened?.toIso8601String(),
      'payment_type': instance.paymentType,
      'table_id': instance.tableId,
      'table_number': instance.tableNumber,
      'hall_name': instance.hallName,
      'cashier_id': instance.cashierId,
      'cashier_name': instance.cashierName,
      'guest_count': instance.guestCount,
      'food_cost': instance.foodCost,
      'food_total': instance.foodTotal,
      'service_percent': instance.servicePercent,
      'service_amount': instance.serviceAmount,
      'discount_percent': instance.discountPercent,
      'discount_amount': instance.discountAmount,
      'grand_total': instance.grandTotal,
      'customer_paid_amount': instance.customerPaidAmount,
      'change_amount': instance.changeAmount,
      'comment': instance.comment,
      'items': const OrderFoodEntityListConverter().toJson(instance.goods),
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
