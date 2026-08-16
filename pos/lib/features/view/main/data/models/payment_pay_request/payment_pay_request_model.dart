import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/payment_pay_request_entity.dart';

part 'payment_pay_request_model.freezed.dart';
part 'payment_pay_request_model.g.dart';

@freezed
class PaymentPayRequestModel
    with _$PaymentPayRequestModel
    implements PaymentPayRequestEntity {
  const PaymentPayRequestModel._();

  const factory PaymentPayRequestModel({
    @JsonKey(name: 'order_id') @Default('') String orderId,
    @JsonKey(name: 'cash_register_id') @Default('') String cashRegisterId,
    @JsonKey(name: 'cashier_id') @Default('') String cashierId,
    @JsonKey(name: 'customer_paid_amount') @Default(0) int customPaidAmount,
    @JsonKey(name: 'discount_amount') @Default(0) int discountAmount,
    @JsonKey(name: 'discount_percent') @Default(0) int discountPercent,
    @JsonKey(name: 'payment_type')
    @Default(PaymentType.cash)
    PaymentType paymentType,
    @Default('') String comment,
  }) = _PaymentPayRequestModel;

  factory PaymentPayRequestModel.fromJson(Map<String, dynamic> json) =>
      _$PaymentPayRequestModelFromJson(json);

  @override
  Map<String, dynamic> request() {
    final map = <String, dynamic>{
      'customer_paid_amount': '$customPaidAmount',
      'payment_type': paymentType.name,
    };
    final hasDiscount = discountAmount > 0 || discountPercent > 0;
    if (hasDiscount) {
      if (discountAmount > 0) {
        map['discount_amount'] = '$discountAmount';
      }
      if (discountPercent > 0) {
        map['discount_percent'] = '$discountPercent';
      }
      map['discount_comment'] = comment;
    }
    return map;
  }
}
