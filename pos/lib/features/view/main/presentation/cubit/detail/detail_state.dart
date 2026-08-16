part of 'detail_bloc.dart';

@freezed
class OrderItem with _$OrderItem {
  const factory OrderItem({
    @Default('') String uniqueId,
    required GoodsModel goods,
    @Default(1) int quantity,
    // `commet` aslida status'ni saqlaydi: 'pending', 'cancelled',
    // 'pending_offline'. Tarixiy nomlanish, refaktor qilmaymiz.
    @Default('') String commet,
    // Foydalanuvchi yozgan taom izohi (mas. "achchiqsiz"). Backend'ga
    // `comment` sifatida yuboriladi va chekka chiqariladi.
    @Default('') String comment,
    // Item qachon buyurtmaga qo'shilgan (server `created_at` yoki
    // offline queue `createdAt`). UI HH:mm formatida ko'rsatadi.
    DateTime? createdAt,
  }) = _OrderItem;
}

@freezed
class DetailState with _$DetailState {
  const factory DetailState({
    @Default(Status.UNKNOWN) Status status,
    @Default(UnknownFailure()) Failure failure,
    TextEditingController? textController,
    List<CategoryModel>? categories,
    List<GoodsModel>? goods,
    String? selectedCategoryId,
    @Default([]) List<OrderItem> selectedGoods,
    @Default([]) List<OrderItem> existingGoods,
    String? activeOrderId,
    // Hozir backend bilan sinxron qilinayotgan mavjud itemlarning nomlari.
    // `goods.name` bo'yicha kalitlangan (refetch dan keyin uniqueId o'zgaradi,
    // lekin name saqlanadi). UI shu set ichidagi itemlarda +/-/X ni disable
    // qiladi.
    @Default(<String>{}) Set<String> existingSyncingNames,
  }) = _DetailState;
}
