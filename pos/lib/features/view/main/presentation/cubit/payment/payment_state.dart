part of 'payment_bloc.dart';

@freezed
class PaymentState with _$PaymentState {
  const factory PaymentState({
    @Default(Status.UNKNOWN) Status status,
    @Default(Status.UNKNOWN) Status detailStatus,
    ArchiveDetailEntity? detail,
    String? tableId,
    String? orderId,
    TextEditingController? textController,
    @Default('0') String discountAmount,
    @Default(PaymentType.cash) PaymentType paymentType,
    @Default('0') String enterSum,
    @Default(0) int returnAmount,
    @Default(DiscountType.money) DiscountType discountType,
    @Default(0) double hourPrice,
    // Item nomi -> eng erta urilgan vaqt. `/order-items/order/{id}` dan
    // olinadi; `/bills/{id}` items'da `created_at` yo'q.
    @Default(<String, DateTime>{}) Map<String, DateTime> itemTimestamps,
    Failure? failure,
  }) = _PaymentState;
}
