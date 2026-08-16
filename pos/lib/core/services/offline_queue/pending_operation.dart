import 'package:hive_flutter/hive_flutter.dart';

part 'pending_operation.g.dart';

@HiveType(typeId: 10)
enum PendingOperationType {
  @HiveField(0)
  createOrder,
  @HiveField(1)
  addItems,
  @HiveField(2)
  payOrder,
}

@HiveType(typeId: 11)
class PendingOperation extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final PendingOperationType type;

  /// JSON-encoded request payload
  @HiveField(2)
  final String payload;

  /// tableId — sync vaqtida orderId topish uchun
  @HiveField(3)
  final String tableId;

  @HiveField(4)
  final DateTime createdAt;

  PendingOperation({
    required this.id,
    required this.type,
    required this.payload,
    required this.tableId,
    required this.createdAt,
  });
}
