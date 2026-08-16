abstract class OrderFoodEntity {
  final String id;
  final String name;
  final int quantity;
  final int price;
  final String comment;
  final String status;
  final DateTime? createdAt;

  OrderFoodEntity({
    required this.id,
    required this.name,
    required this.quantity,
    required this.price,
    required this.comment,
    this.status = 'pending',
    this.createdAt,
  });
}
