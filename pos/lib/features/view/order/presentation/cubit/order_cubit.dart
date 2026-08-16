import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:mary_ai_pos/features/view/order/data/models/order_models.dart';

// State
class OrderState extends Equatable {
  final List<OrderItem> items;
  final bool isLoading;
  final String? error;

  const OrderState({this.items = const [], this.isLoading = false, this.error});

  double get subtotal => items.fold(0, (sum, item) => sum + item.total);
  double get tax => subtotal * 0.1; // 10% tax example, should be configurable
  double get total => subtotal + tax;

  OrderState copyWith({
    List<OrderItem>? items,
    bool? isLoading,
    String? error,
  }) {
    return OrderState(
      items: items ?? this.items,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }

  @override
  List<Object?> get props => [items, isLoading, error];
}

// Cubit
class OrderCubit extends Cubit<OrderState> {
  OrderCubit() : super(const OrderState());

  void addItem(Product product) {
    final currentItems = List<OrderItem>.from(state.items);
    final existingIndex = currentItems.indexWhere(
      (i) => i.product.id == product.id && i.modifiers.isEmpty,
    );

    if (existingIndex != -1) {
      // Increment quantity if exact match found
      currentItems[existingIndex] = currentItems[existingIndex].copyWith(
        quantity: currentItems[existingIndex].quantity + 1,
      );
    } else {
      // Add new item
      currentItems.add(OrderItem(product: product));
    }

    emit(state.copyWith(items: currentItems));
  }

  void removeItem(OrderItem item) {
    final currentItems = List<OrderItem>.from(state.items);
    currentItems.remove(item);
    emit(state.copyWith(items: currentItems));
  }

  void updateQuantity(OrderItem item, int delta) {
    final currentItems = List<OrderItem>.from(state.items);
    final index = currentItems.indexOf(item);
    if (index == -1) return;

    final newQuantity = item.quantity + delta;
    if (newQuantity <= 0) {
      currentItems.removeAt(index);
    } else {
      currentItems[index] = item.copyWith(quantity: newQuantity);
    }

    emit(state.copyWith(items: currentItems));
  }

  void clearOrder() {
    emit(const OrderState(items: []));
  }
}
