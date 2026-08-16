import 'package:mary_ai_pos/core/constants/constants.dart';

abstract class ArchiveEntity {
  final String id;
  final int bilNumber;
  final OrderStatus status;
  final DateTime? opened;
  final int tableNumber;
  final int totalPrice;
  final int goodsTotal;
  final int serviceAmount;
  final int discountAmount;
  final int goodsQuantity;
  final int customerPaidAmount;

  ArchiveEntity({
    required this.id,
    required this.bilNumber,
    required this.status,
    this.opened,
    required this.tableNumber,
    required this.totalPrice,
    required this.goodsTotal,
    required this.serviceAmount,
    required this.discountAmount,
    required this.goodsQuantity,
    required this.customerPaidAmount,
  });
}
