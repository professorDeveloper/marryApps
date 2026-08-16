import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/create_order/create_order_request_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/save_order_entity.dart';

part 'save_order_model.freezed.dart';

@freezed
class SaveOrderModel with _$SaveOrderModel implements SaveOrderEntity {
  const SaveOrderModel._();

  const factory SaveOrderModel({
    required CafeTableModel cafeTable,
    required CreateOrderRequestModel createOrderRequest,
  }) = _SaveOrderModel;
}
