import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/create_order/create_order_request_model.dart';

abstract class SaveOrderEntity {
  final CafeTableModel cafeTable;
  final CreateOrderRequestModel createOrderRequest;

  SaveOrderEntity({required this.cafeTable, required this.createOrderRequest});
}
