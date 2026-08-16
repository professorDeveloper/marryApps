class Product {
  final String id;
  final String name;
  final double price;
  final String? imageUrl;
  final String categoryId;

  const Product({
    required this.id,
    required this.name,
    required this.price,
    this.imageUrl,
    required this.categoryId,
  });
}

class OrderItem {
  final Product product;
  final int quantity;
  final List<String> modifiers; // e.g., "No onions", "Extra cheese"
  final String? note;

  const OrderItem({
    required this.product,
    this.quantity = 1,
    this.modifiers = const [],
    this.note,
  });

  double get total => product.price * quantity;

  OrderItem copyWith({
    Product? product,
    int? quantity,
    List<String>? modifiers,
    String? note,
  }) {
    return OrderItem(
      product: product ?? this.product,
      quantity: quantity ?? this.quantity,
      modifiers: modifiers ?? this.modifiers,
      note: note ?? this.note,
    );
  }
}
