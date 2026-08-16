part of 'detail_bloc.dart';

@freezed
class DetailEvent with _$DetailEvent {
  const factory DetailEvent.started() = _Started;
  const factory DetailEvent.getCategories() = _GetCategories;
  const factory DetailEvent.initSavedGoods({
    required List<OrderItem> savedGoods,
  }) = _InitSavedGoods;
  const factory DetailEvent.setSelectedCategoryId({required String id}) =
      _SetSelectedCategoryId;
  const factory DetailEvent.addFoodAdditional({
    required List<FoodAdditionalModel> additionals,
    required String orderId,
    required String comment,
  }) = _AddFoodAdditional;
  const factory DetailEvent.selectGood({required GoodsModel good}) =
      _SelectGood;
  const factory DetailEvent.incrementQuantity({required String goodsId}) =
      _IncrementQuantity;
  const factory DetailEvent.decrementQuantity({required String goodsId}) =
      _DecrementQuantity;
  const factory DetailEvent.clearGoods() = _ClearGoods;
  const factory DetailEvent.searchTextChanged({required String text}) =
      _SearchTextChanged;
  const factory DetailEvent.fetchBillOrders({
    required String billId,
    @Default(false) bool force,
  }) = _FetchBillOrders;
  const factory DetailEvent.setActiveOrderId({required String orderId}) =
      _SetActiveOrderId;
  const factory DetailEvent.cancelOrderItem({
    required String itemId,
    required String tableId,
  }) = _CancelOrderItem;

  /// Mavjud (serverda saqlangan) item miqdorini +1 oshiradi.
  /// `itemKey` — UI `OrderItem.uniqueId` (grouped item identifier).
  const factory DetailEvent.incrementExistingItem({
    required String itemKey,
    required String tableId,
  }) = _IncrementExistingItem;

  /// Mavjud item miqdorini -1 kamaytiradi. Agar 1 da bo'lsa — itemni o'chiradi.
  const factory DetailEvent.decrementExistingItem({
    required String itemKey,
    required String tableId,
  }) = _DecrementExistingItem;

  /// Mavjud itemni to'liq o'chiradi (barcha tegishli line-itemlarni bekor qiladi).
  const factory DetailEvent.deleteExistingItem({
    required String itemKey,
    required String tableId,
  }) = _DeleteExistingItem;

  /// Mavjud itemning miqdorini bevosita berilgan qiymatga o'rnatadi va
  /// backendga darhol (debouncesiz) sinxronlaydi. Edit-modaldan "Save"
  /// bosilganda chaqiriladi.
  const factory DetailEvent.setExistingItemQuantity({
    required String itemKey,
    required String tableId,
    required int quantity,
  }) = _SetExistingItemQuantity;

  /// Internal: debounce vaqti tugagandan keyin backendga sinxronlash.
  const factory DetailEvent.syncExistingItem({
    required String itemKey,
    required String tableId,
  }) = _SyncExistingItem;
}
