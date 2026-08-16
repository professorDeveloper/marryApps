import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/order_food_entity.dart';

abstract class ArchiveDetailEntity {
  final String id;
  final int bilNumber;
  final OrderStatus status;
  final DateTime? opened;
  final String paymentType;
  final String tableId;
  final double tableNumber;
  final String hallName;
  final String cashierId;
  final String cashierName;
  final double guestCount;
  final double foodCost;
  final double foodTotal;
  final double servicePercent;
  final double serviceAmount;
  final double discountPercent;
  final double discountAmount;
  final double grandTotal;
  final double customerPaidAmount;
  final double changeAmount;
  final String comment;
  final List<OrderFoodEntity> goods;

  ArchiveDetailEntity({
    required this.id,
    required this.bilNumber,
    required this.status,
    required this.opened,
    required this.paymentType,
    required this.tableId,
    required this.tableNumber,
    required this.hallName,
    required this.cashierId,
    required this.cashierName,
    required this.guestCount,
    required this.foodCost,
    required this.foodTotal,
    required this.servicePercent,
    required this.serviceAmount,
    required this.discountPercent,
    required this.discountAmount,
    required this.grandTotal,
    required this.customerPaidAmount,
    required this.changeAmount,
    required this.comment,
    required this.goods,
  });
}
