// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'detail_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$DetailEvent {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getCategories,
    required TResult Function(List<OrderItem> savedGoods) initSavedGoods,
    required TResult Function(String id) setSelectedCategoryId,
    required TResult Function(List<FoodAdditionalModel> additionals,
            String orderId, String comment)
        addFoodAdditional,
    required TResult Function(GoodsModel good) selectGood,
    required TResult Function(String goodsId) incrementQuantity,
    required TResult Function(String goodsId) decrementQuantity,
    required TResult Function() clearGoods,
    required TResult Function(String text) searchTextChanged,
    required TResult Function(String billId, bool force) fetchBillOrders,
    required TResult Function(String orderId) setActiveOrderId,
    required TResult Function(String itemId, String tableId) cancelOrderItem,
    required TResult Function(String itemKey, String tableId)
        incrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        decrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        deleteExistingItem,
    required TResult Function(String itemKey, String tableId, int quantity)
        setExistingItemQuantity,
    required TResult Function(String itemKey, String tableId) syncExistingItem,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getCategories,
    TResult? Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult? Function(String id)? setSelectedCategoryId,
    TResult? Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult? Function(GoodsModel good)? selectGood,
    TResult? Function(String goodsId)? incrementQuantity,
    TResult? Function(String goodsId)? decrementQuantity,
    TResult? Function()? clearGoods,
    TResult? Function(String text)? searchTextChanged,
    TResult? Function(String billId, bool force)? fetchBillOrders,
    TResult? Function(String orderId)? setActiveOrderId,
    TResult? Function(String itemId, String tableId)? cancelOrderItem,
    TResult? Function(String itemKey, String tableId)? incrementExistingItem,
    TResult? Function(String itemKey, String tableId)? decrementExistingItem,
    TResult? Function(String itemKey, String tableId)? deleteExistingItem,
    TResult? Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult? Function(String itemKey, String tableId)? syncExistingItem,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getCategories,
    TResult Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult Function(String id)? setSelectedCategoryId,
    TResult Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult Function(GoodsModel good)? selectGood,
    TResult Function(String goodsId)? incrementQuantity,
    TResult Function(String goodsId)? decrementQuantity,
    TResult Function()? clearGoods,
    TResult Function(String text)? searchTextChanged,
    TResult Function(String billId, bool force)? fetchBillOrders,
    TResult Function(String orderId)? setActiveOrderId,
    TResult Function(String itemId, String tableId)? cancelOrderItem,
    TResult Function(String itemKey, String tableId)? incrementExistingItem,
    TResult Function(String itemKey, String tableId)? decrementExistingItem,
    TResult Function(String itemKey, String tableId)? deleteExistingItem,
    TResult Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult Function(String itemKey, String tableId)? syncExistingItem,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetCategories value) getCategories,
    required TResult Function(_InitSavedGoods value) initSavedGoods,
    required TResult Function(_SetSelectedCategoryId value)
        setSelectedCategoryId,
    required TResult Function(_AddFoodAdditional value) addFoodAdditional,
    required TResult Function(_SelectGood value) selectGood,
    required TResult Function(_IncrementQuantity value) incrementQuantity,
    required TResult Function(_DecrementQuantity value) decrementQuantity,
    required TResult Function(_ClearGoods value) clearGoods,
    required TResult Function(_SearchTextChanged value) searchTextChanged,
    required TResult Function(_FetchBillOrders value) fetchBillOrders,
    required TResult Function(_SetActiveOrderId value) setActiveOrderId,
    required TResult Function(_CancelOrderItem value) cancelOrderItem,
    required TResult Function(_IncrementExistingItem value)
        incrementExistingItem,
    required TResult Function(_DecrementExistingItem value)
        decrementExistingItem,
    required TResult Function(_DeleteExistingItem value) deleteExistingItem,
    required TResult Function(_SetExistingItemQuantity value)
        setExistingItemQuantity,
    required TResult Function(_SyncExistingItem value) syncExistingItem,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetCategories value)? getCategories,
    TResult? Function(_InitSavedGoods value)? initSavedGoods,
    TResult? Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult? Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult? Function(_SelectGood value)? selectGood,
    TResult? Function(_IncrementQuantity value)? incrementQuantity,
    TResult? Function(_DecrementQuantity value)? decrementQuantity,
    TResult? Function(_ClearGoods value)? clearGoods,
    TResult? Function(_SearchTextChanged value)? searchTextChanged,
    TResult? Function(_FetchBillOrders value)? fetchBillOrders,
    TResult? Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult? Function(_CancelOrderItem value)? cancelOrderItem,
    TResult? Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult? Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult? Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult? Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult? Function(_SyncExistingItem value)? syncExistingItem,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetCategories value)? getCategories,
    TResult Function(_InitSavedGoods value)? initSavedGoods,
    TResult Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult Function(_SelectGood value)? selectGood,
    TResult Function(_IncrementQuantity value)? incrementQuantity,
    TResult Function(_DecrementQuantity value)? decrementQuantity,
    TResult Function(_ClearGoods value)? clearGoods,
    TResult Function(_SearchTextChanged value)? searchTextChanged,
    TResult Function(_FetchBillOrders value)? fetchBillOrders,
    TResult Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult Function(_CancelOrderItem value)? cancelOrderItem,
    TResult Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult Function(_SyncExistingItem value)? syncExistingItem,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $DetailEventCopyWith<$Res> {
  factory $DetailEventCopyWith(
          DetailEvent value, $Res Function(DetailEvent) then) =
      _$DetailEventCopyWithImpl<$Res, DetailEvent>;
}

/// @nodoc
class _$DetailEventCopyWithImpl<$Res, $Val extends DetailEvent>
    implements $DetailEventCopyWith<$Res> {
  _$DetailEventCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;
}

/// @nodoc
abstract class _$$StartedImplCopyWith<$Res> {
  factory _$$StartedImplCopyWith(
          _$StartedImpl value, $Res Function(_$StartedImpl) then) =
      __$$StartedImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$StartedImplCopyWithImpl<$Res>
    extends _$DetailEventCopyWithImpl<$Res, _$StartedImpl>
    implements _$$StartedImplCopyWith<$Res> {
  __$$StartedImplCopyWithImpl(
      _$StartedImpl _value, $Res Function(_$StartedImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$StartedImpl implements _Started {
  const _$StartedImpl();

  @override
  String toString() {
    return 'DetailEvent.started()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$StartedImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getCategories,
    required TResult Function(List<OrderItem> savedGoods) initSavedGoods,
    required TResult Function(String id) setSelectedCategoryId,
    required TResult Function(List<FoodAdditionalModel> additionals,
            String orderId, String comment)
        addFoodAdditional,
    required TResult Function(GoodsModel good) selectGood,
    required TResult Function(String goodsId) incrementQuantity,
    required TResult Function(String goodsId) decrementQuantity,
    required TResult Function() clearGoods,
    required TResult Function(String text) searchTextChanged,
    required TResult Function(String billId, bool force) fetchBillOrders,
    required TResult Function(String orderId) setActiveOrderId,
    required TResult Function(String itemId, String tableId) cancelOrderItem,
    required TResult Function(String itemKey, String tableId)
        incrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        decrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        deleteExistingItem,
    required TResult Function(String itemKey, String tableId, int quantity)
        setExistingItemQuantity,
    required TResult Function(String itemKey, String tableId) syncExistingItem,
  }) {
    return started();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getCategories,
    TResult? Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult? Function(String id)? setSelectedCategoryId,
    TResult? Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult? Function(GoodsModel good)? selectGood,
    TResult? Function(String goodsId)? incrementQuantity,
    TResult? Function(String goodsId)? decrementQuantity,
    TResult? Function()? clearGoods,
    TResult? Function(String text)? searchTextChanged,
    TResult? Function(String billId, bool force)? fetchBillOrders,
    TResult? Function(String orderId)? setActiveOrderId,
    TResult? Function(String itemId, String tableId)? cancelOrderItem,
    TResult? Function(String itemKey, String tableId)? incrementExistingItem,
    TResult? Function(String itemKey, String tableId)? decrementExistingItem,
    TResult? Function(String itemKey, String tableId)? deleteExistingItem,
    TResult? Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult? Function(String itemKey, String tableId)? syncExistingItem,
  }) {
    return started?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getCategories,
    TResult Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult Function(String id)? setSelectedCategoryId,
    TResult Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult Function(GoodsModel good)? selectGood,
    TResult Function(String goodsId)? incrementQuantity,
    TResult Function(String goodsId)? decrementQuantity,
    TResult Function()? clearGoods,
    TResult Function(String text)? searchTextChanged,
    TResult Function(String billId, bool force)? fetchBillOrders,
    TResult Function(String orderId)? setActiveOrderId,
    TResult Function(String itemId, String tableId)? cancelOrderItem,
    TResult Function(String itemKey, String tableId)? incrementExistingItem,
    TResult Function(String itemKey, String tableId)? decrementExistingItem,
    TResult Function(String itemKey, String tableId)? deleteExistingItem,
    TResult Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult Function(String itemKey, String tableId)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (started != null) {
      return started();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetCategories value) getCategories,
    required TResult Function(_InitSavedGoods value) initSavedGoods,
    required TResult Function(_SetSelectedCategoryId value)
        setSelectedCategoryId,
    required TResult Function(_AddFoodAdditional value) addFoodAdditional,
    required TResult Function(_SelectGood value) selectGood,
    required TResult Function(_IncrementQuantity value) incrementQuantity,
    required TResult Function(_DecrementQuantity value) decrementQuantity,
    required TResult Function(_ClearGoods value) clearGoods,
    required TResult Function(_SearchTextChanged value) searchTextChanged,
    required TResult Function(_FetchBillOrders value) fetchBillOrders,
    required TResult Function(_SetActiveOrderId value) setActiveOrderId,
    required TResult Function(_CancelOrderItem value) cancelOrderItem,
    required TResult Function(_IncrementExistingItem value)
        incrementExistingItem,
    required TResult Function(_DecrementExistingItem value)
        decrementExistingItem,
    required TResult Function(_DeleteExistingItem value) deleteExistingItem,
    required TResult Function(_SetExistingItemQuantity value)
        setExistingItemQuantity,
    required TResult Function(_SyncExistingItem value) syncExistingItem,
  }) {
    return started(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetCategories value)? getCategories,
    TResult? Function(_InitSavedGoods value)? initSavedGoods,
    TResult? Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult? Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult? Function(_SelectGood value)? selectGood,
    TResult? Function(_IncrementQuantity value)? incrementQuantity,
    TResult? Function(_DecrementQuantity value)? decrementQuantity,
    TResult? Function(_ClearGoods value)? clearGoods,
    TResult? Function(_SearchTextChanged value)? searchTextChanged,
    TResult? Function(_FetchBillOrders value)? fetchBillOrders,
    TResult? Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult? Function(_CancelOrderItem value)? cancelOrderItem,
    TResult? Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult? Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult? Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult? Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult? Function(_SyncExistingItem value)? syncExistingItem,
  }) {
    return started?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetCategories value)? getCategories,
    TResult Function(_InitSavedGoods value)? initSavedGoods,
    TResult Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult Function(_SelectGood value)? selectGood,
    TResult Function(_IncrementQuantity value)? incrementQuantity,
    TResult Function(_DecrementQuantity value)? decrementQuantity,
    TResult Function(_ClearGoods value)? clearGoods,
    TResult Function(_SearchTextChanged value)? searchTextChanged,
    TResult Function(_FetchBillOrders value)? fetchBillOrders,
    TResult Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult Function(_CancelOrderItem value)? cancelOrderItem,
    TResult Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult Function(_SyncExistingItem value)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (started != null) {
      return started(this);
    }
    return orElse();
  }
}

abstract class _Started implements DetailEvent {
  const factory _Started() = _$StartedImpl;
}

/// @nodoc
abstract class _$$GetCategoriesImplCopyWith<$Res> {
  factory _$$GetCategoriesImplCopyWith(
          _$GetCategoriesImpl value, $Res Function(_$GetCategoriesImpl) then) =
      __$$GetCategoriesImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$GetCategoriesImplCopyWithImpl<$Res>
    extends _$DetailEventCopyWithImpl<$Res, _$GetCategoriesImpl>
    implements _$$GetCategoriesImplCopyWith<$Res> {
  __$$GetCategoriesImplCopyWithImpl(
      _$GetCategoriesImpl _value, $Res Function(_$GetCategoriesImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$GetCategoriesImpl implements _GetCategories {
  const _$GetCategoriesImpl();

  @override
  String toString() {
    return 'DetailEvent.getCategories()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$GetCategoriesImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getCategories,
    required TResult Function(List<OrderItem> savedGoods) initSavedGoods,
    required TResult Function(String id) setSelectedCategoryId,
    required TResult Function(List<FoodAdditionalModel> additionals,
            String orderId, String comment)
        addFoodAdditional,
    required TResult Function(GoodsModel good) selectGood,
    required TResult Function(String goodsId) incrementQuantity,
    required TResult Function(String goodsId) decrementQuantity,
    required TResult Function() clearGoods,
    required TResult Function(String text) searchTextChanged,
    required TResult Function(String billId, bool force) fetchBillOrders,
    required TResult Function(String orderId) setActiveOrderId,
    required TResult Function(String itemId, String tableId) cancelOrderItem,
    required TResult Function(String itemKey, String tableId)
        incrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        decrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        deleteExistingItem,
    required TResult Function(String itemKey, String tableId, int quantity)
        setExistingItemQuantity,
    required TResult Function(String itemKey, String tableId) syncExistingItem,
  }) {
    return getCategories();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getCategories,
    TResult? Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult? Function(String id)? setSelectedCategoryId,
    TResult? Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult? Function(GoodsModel good)? selectGood,
    TResult? Function(String goodsId)? incrementQuantity,
    TResult? Function(String goodsId)? decrementQuantity,
    TResult? Function()? clearGoods,
    TResult? Function(String text)? searchTextChanged,
    TResult? Function(String billId, bool force)? fetchBillOrders,
    TResult? Function(String orderId)? setActiveOrderId,
    TResult? Function(String itemId, String tableId)? cancelOrderItem,
    TResult? Function(String itemKey, String tableId)? incrementExistingItem,
    TResult? Function(String itemKey, String tableId)? decrementExistingItem,
    TResult? Function(String itemKey, String tableId)? deleteExistingItem,
    TResult? Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult? Function(String itemKey, String tableId)? syncExistingItem,
  }) {
    return getCategories?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getCategories,
    TResult Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult Function(String id)? setSelectedCategoryId,
    TResult Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult Function(GoodsModel good)? selectGood,
    TResult Function(String goodsId)? incrementQuantity,
    TResult Function(String goodsId)? decrementQuantity,
    TResult Function()? clearGoods,
    TResult Function(String text)? searchTextChanged,
    TResult Function(String billId, bool force)? fetchBillOrders,
    TResult Function(String orderId)? setActiveOrderId,
    TResult Function(String itemId, String tableId)? cancelOrderItem,
    TResult Function(String itemKey, String tableId)? incrementExistingItem,
    TResult Function(String itemKey, String tableId)? decrementExistingItem,
    TResult Function(String itemKey, String tableId)? deleteExistingItem,
    TResult Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult Function(String itemKey, String tableId)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (getCategories != null) {
      return getCategories();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetCategories value) getCategories,
    required TResult Function(_InitSavedGoods value) initSavedGoods,
    required TResult Function(_SetSelectedCategoryId value)
        setSelectedCategoryId,
    required TResult Function(_AddFoodAdditional value) addFoodAdditional,
    required TResult Function(_SelectGood value) selectGood,
    required TResult Function(_IncrementQuantity value) incrementQuantity,
    required TResult Function(_DecrementQuantity value) decrementQuantity,
    required TResult Function(_ClearGoods value) clearGoods,
    required TResult Function(_SearchTextChanged value) searchTextChanged,
    required TResult Function(_FetchBillOrders value) fetchBillOrders,
    required TResult Function(_SetActiveOrderId value) setActiveOrderId,
    required TResult Function(_CancelOrderItem value) cancelOrderItem,
    required TResult Function(_IncrementExistingItem value)
        incrementExistingItem,
    required TResult Function(_DecrementExistingItem value)
        decrementExistingItem,
    required TResult Function(_DeleteExistingItem value) deleteExistingItem,
    required TResult Function(_SetExistingItemQuantity value)
        setExistingItemQuantity,
    required TResult Function(_SyncExistingItem value) syncExistingItem,
  }) {
    return getCategories(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetCategories value)? getCategories,
    TResult? Function(_InitSavedGoods value)? initSavedGoods,
    TResult? Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult? Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult? Function(_SelectGood value)? selectGood,
    TResult? Function(_IncrementQuantity value)? incrementQuantity,
    TResult? Function(_DecrementQuantity value)? decrementQuantity,
    TResult? Function(_ClearGoods value)? clearGoods,
    TResult? Function(_SearchTextChanged value)? searchTextChanged,
    TResult? Function(_FetchBillOrders value)? fetchBillOrders,
    TResult? Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult? Function(_CancelOrderItem value)? cancelOrderItem,
    TResult? Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult? Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult? Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult? Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult? Function(_SyncExistingItem value)? syncExistingItem,
  }) {
    return getCategories?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetCategories value)? getCategories,
    TResult Function(_InitSavedGoods value)? initSavedGoods,
    TResult Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult Function(_SelectGood value)? selectGood,
    TResult Function(_IncrementQuantity value)? incrementQuantity,
    TResult Function(_DecrementQuantity value)? decrementQuantity,
    TResult Function(_ClearGoods value)? clearGoods,
    TResult Function(_SearchTextChanged value)? searchTextChanged,
    TResult Function(_FetchBillOrders value)? fetchBillOrders,
    TResult Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult Function(_CancelOrderItem value)? cancelOrderItem,
    TResult Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult Function(_SyncExistingItem value)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (getCategories != null) {
      return getCategories(this);
    }
    return orElse();
  }
}

abstract class _GetCategories implements DetailEvent {
  const factory _GetCategories() = _$GetCategoriesImpl;
}

/// @nodoc
abstract class _$$InitSavedGoodsImplCopyWith<$Res> {
  factory _$$InitSavedGoodsImplCopyWith(_$InitSavedGoodsImpl value,
          $Res Function(_$InitSavedGoodsImpl) then) =
      __$$InitSavedGoodsImplCopyWithImpl<$Res>;
  @useResult
  $Res call({List<OrderItem> savedGoods});
}

/// @nodoc
class __$$InitSavedGoodsImplCopyWithImpl<$Res>
    extends _$DetailEventCopyWithImpl<$Res, _$InitSavedGoodsImpl>
    implements _$$InitSavedGoodsImplCopyWith<$Res> {
  __$$InitSavedGoodsImplCopyWithImpl(
      _$InitSavedGoodsImpl _value, $Res Function(_$InitSavedGoodsImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? savedGoods = null,
  }) {
    return _then(_$InitSavedGoodsImpl(
      savedGoods: null == savedGoods
          ? _value._savedGoods
          : savedGoods // ignore: cast_nullable_to_non_nullable
              as List<OrderItem>,
    ));
  }
}

/// @nodoc

class _$InitSavedGoodsImpl implements _InitSavedGoods {
  const _$InitSavedGoodsImpl({required final List<OrderItem> savedGoods})
      : _savedGoods = savedGoods;

  final List<OrderItem> _savedGoods;
  @override
  List<OrderItem> get savedGoods {
    if (_savedGoods is EqualUnmodifiableListView) return _savedGoods;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_savedGoods);
  }

  @override
  String toString() {
    return 'DetailEvent.initSavedGoods(savedGoods: $savedGoods)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$InitSavedGoodsImpl &&
            const DeepCollectionEquality()
                .equals(other._savedGoods, _savedGoods));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType, const DeepCollectionEquality().hash(_savedGoods));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$InitSavedGoodsImplCopyWith<_$InitSavedGoodsImpl> get copyWith =>
      __$$InitSavedGoodsImplCopyWithImpl<_$InitSavedGoodsImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getCategories,
    required TResult Function(List<OrderItem> savedGoods) initSavedGoods,
    required TResult Function(String id) setSelectedCategoryId,
    required TResult Function(List<FoodAdditionalModel> additionals,
            String orderId, String comment)
        addFoodAdditional,
    required TResult Function(GoodsModel good) selectGood,
    required TResult Function(String goodsId) incrementQuantity,
    required TResult Function(String goodsId) decrementQuantity,
    required TResult Function() clearGoods,
    required TResult Function(String text) searchTextChanged,
    required TResult Function(String billId, bool force) fetchBillOrders,
    required TResult Function(String orderId) setActiveOrderId,
    required TResult Function(String itemId, String tableId) cancelOrderItem,
    required TResult Function(String itemKey, String tableId)
        incrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        decrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        deleteExistingItem,
    required TResult Function(String itemKey, String tableId, int quantity)
        setExistingItemQuantity,
    required TResult Function(String itemKey, String tableId) syncExistingItem,
  }) {
    return initSavedGoods(savedGoods);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getCategories,
    TResult? Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult? Function(String id)? setSelectedCategoryId,
    TResult? Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult? Function(GoodsModel good)? selectGood,
    TResult? Function(String goodsId)? incrementQuantity,
    TResult? Function(String goodsId)? decrementQuantity,
    TResult? Function()? clearGoods,
    TResult? Function(String text)? searchTextChanged,
    TResult? Function(String billId, bool force)? fetchBillOrders,
    TResult? Function(String orderId)? setActiveOrderId,
    TResult? Function(String itemId, String tableId)? cancelOrderItem,
    TResult? Function(String itemKey, String tableId)? incrementExistingItem,
    TResult? Function(String itemKey, String tableId)? decrementExistingItem,
    TResult? Function(String itemKey, String tableId)? deleteExistingItem,
    TResult? Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult? Function(String itemKey, String tableId)? syncExistingItem,
  }) {
    return initSavedGoods?.call(savedGoods);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getCategories,
    TResult Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult Function(String id)? setSelectedCategoryId,
    TResult Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult Function(GoodsModel good)? selectGood,
    TResult Function(String goodsId)? incrementQuantity,
    TResult Function(String goodsId)? decrementQuantity,
    TResult Function()? clearGoods,
    TResult Function(String text)? searchTextChanged,
    TResult Function(String billId, bool force)? fetchBillOrders,
    TResult Function(String orderId)? setActiveOrderId,
    TResult Function(String itemId, String tableId)? cancelOrderItem,
    TResult Function(String itemKey, String tableId)? incrementExistingItem,
    TResult Function(String itemKey, String tableId)? decrementExistingItem,
    TResult Function(String itemKey, String tableId)? deleteExistingItem,
    TResult Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult Function(String itemKey, String tableId)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (initSavedGoods != null) {
      return initSavedGoods(savedGoods);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetCategories value) getCategories,
    required TResult Function(_InitSavedGoods value) initSavedGoods,
    required TResult Function(_SetSelectedCategoryId value)
        setSelectedCategoryId,
    required TResult Function(_AddFoodAdditional value) addFoodAdditional,
    required TResult Function(_SelectGood value) selectGood,
    required TResult Function(_IncrementQuantity value) incrementQuantity,
    required TResult Function(_DecrementQuantity value) decrementQuantity,
    required TResult Function(_ClearGoods value) clearGoods,
    required TResult Function(_SearchTextChanged value) searchTextChanged,
    required TResult Function(_FetchBillOrders value) fetchBillOrders,
    required TResult Function(_SetActiveOrderId value) setActiveOrderId,
    required TResult Function(_CancelOrderItem value) cancelOrderItem,
    required TResult Function(_IncrementExistingItem value)
        incrementExistingItem,
    required TResult Function(_DecrementExistingItem value)
        decrementExistingItem,
    required TResult Function(_DeleteExistingItem value) deleteExistingItem,
    required TResult Function(_SetExistingItemQuantity value)
        setExistingItemQuantity,
    required TResult Function(_SyncExistingItem value) syncExistingItem,
  }) {
    return initSavedGoods(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetCategories value)? getCategories,
    TResult? Function(_InitSavedGoods value)? initSavedGoods,
    TResult? Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult? Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult? Function(_SelectGood value)? selectGood,
    TResult? Function(_IncrementQuantity value)? incrementQuantity,
    TResult? Function(_DecrementQuantity value)? decrementQuantity,
    TResult? Function(_ClearGoods value)? clearGoods,
    TResult? Function(_SearchTextChanged value)? searchTextChanged,
    TResult? Function(_FetchBillOrders value)? fetchBillOrders,
    TResult? Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult? Function(_CancelOrderItem value)? cancelOrderItem,
    TResult? Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult? Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult? Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult? Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult? Function(_SyncExistingItem value)? syncExistingItem,
  }) {
    return initSavedGoods?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetCategories value)? getCategories,
    TResult Function(_InitSavedGoods value)? initSavedGoods,
    TResult Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult Function(_SelectGood value)? selectGood,
    TResult Function(_IncrementQuantity value)? incrementQuantity,
    TResult Function(_DecrementQuantity value)? decrementQuantity,
    TResult Function(_ClearGoods value)? clearGoods,
    TResult Function(_SearchTextChanged value)? searchTextChanged,
    TResult Function(_FetchBillOrders value)? fetchBillOrders,
    TResult Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult Function(_CancelOrderItem value)? cancelOrderItem,
    TResult Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult Function(_SyncExistingItem value)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (initSavedGoods != null) {
      return initSavedGoods(this);
    }
    return orElse();
  }
}

abstract class _InitSavedGoods implements DetailEvent {
  const factory _InitSavedGoods({required final List<OrderItem> savedGoods}) =
      _$InitSavedGoodsImpl;

  List<OrderItem> get savedGoods;
  @JsonKey(ignore: true)
  _$$InitSavedGoodsImplCopyWith<_$InitSavedGoodsImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$SetSelectedCategoryIdImplCopyWith<$Res> {
  factory _$$SetSelectedCategoryIdImplCopyWith(
          _$SetSelectedCategoryIdImpl value,
          $Res Function(_$SetSelectedCategoryIdImpl) then) =
      __$$SetSelectedCategoryIdImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String id});
}

/// @nodoc
class __$$SetSelectedCategoryIdImplCopyWithImpl<$Res>
    extends _$DetailEventCopyWithImpl<$Res, _$SetSelectedCategoryIdImpl>
    implements _$$SetSelectedCategoryIdImplCopyWith<$Res> {
  __$$SetSelectedCategoryIdImplCopyWithImpl(_$SetSelectedCategoryIdImpl _value,
      $Res Function(_$SetSelectedCategoryIdImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
  }) {
    return _then(_$SetSelectedCategoryIdImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$SetSelectedCategoryIdImpl implements _SetSelectedCategoryId {
  const _$SetSelectedCategoryIdImpl({required this.id});

  @override
  final String id;

  @override
  String toString() {
    return 'DetailEvent.setSelectedCategoryId(id: $id)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SetSelectedCategoryIdImpl &&
            (identical(other.id, id) || other.id == id));
  }

  @override
  int get hashCode => Object.hash(runtimeType, id);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$SetSelectedCategoryIdImplCopyWith<_$SetSelectedCategoryIdImpl>
      get copyWith => __$$SetSelectedCategoryIdImplCopyWithImpl<
          _$SetSelectedCategoryIdImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getCategories,
    required TResult Function(List<OrderItem> savedGoods) initSavedGoods,
    required TResult Function(String id) setSelectedCategoryId,
    required TResult Function(List<FoodAdditionalModel> additionals,
            String orderId, String comment)
        addFoodAdditional,
    required TResult Function(GoodsModel good) selectGood,
    required TResult Function(String goodsId) incrementQuantity,
    required TResult Function(String goodsId) decrementQuantity,
    required TResult Function() clearGoods,
    required TResult Function(String text) searchTextChanged,
    required TResult Function(String billId, bool force) fetchBillOrders,
    required TResult Function(String orderId) setActiveOrderId,
    required TResult Function(String itemId, String tableId) cancelOrderItem,
    required TResult Function(String itemKey, String tableId)
        incrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        decrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        deleteExistingItem,
    required TResult Function(String itemKey, String tableId, int quantity)
        setExistingItemQuantity,
    required TResult Function(String itemKey, String tableId) syncExistingItem,
  }) {
    return setSelectedCategoryId(id);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getCategories,
    TResult? Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult? Function(String id)? setSelectedCategoryId,
    TResult? Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult? Function(GoodsModel good)? selectGood,
    TResult? Function(String goodsId)? incrementQuantity,
    TResult? Function(String goodsId)? decrementQuantity,
    TResult? Function()? clearGoods,
    TResult? Function(String text)? searchTextChanged,
    TResult? Function(String billId, bool force)? fetchBillOrders,
    TResult? Function(String orderId)? setActiveOrderId,
    TResult? Function(String itemId, String tableId)? cancelOrderItem,
    TResult? Function(String itemKey, String tableId)? incrementExistingItem,
    TResult? Function(String itemKey, String tableId)? decrementExistingItem,
    TResult? Function(String itemKey, String tableId)? deleteExistingItem,
    TResult? Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult? Function(String itemKey, String tableId)? syncExistingItem,
  }) {
    return setSelectedCategoryId?.call(id);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getCategories,
    TResult Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult Function(String id)? setSelectedCategoryId,
    TResult Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult Function(GoodsModel good)? selectGood,
    TResult Function(String goodsId)? incrementQuantity,
    TResult Function(String goodsId)? decrementQuantity,
    TResult Function()? clearGoods,
    TResult Function(String text)? searchTextChanged,
    TResult Function(String billId, bool force)? fetchBillOrders,
    TResult Function(String orderId)? setActiveOrderId,
    TResult Function(String itemId, String tableId)? cancelOrderItem,
    TResult Function(String itemKey, String tableId)? incrementExistingItem,
    TResult Function(String itemKey, String tableId)? decrementExistingItem,
    TResult Function(String itemKey, String tableId)? deleteExistingItem,
    TResult Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult Function(String itemKey, String tableId)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (setSelectedCategoryId != null) {
      return setSelectedCategoryId(id);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetCategories value) getCategories,
    required TResult Function(_InitSavedGoods value) initSavedGoods,
    required TResult Function(_SetSelectedCategoryId value)
        setSelectedCategoryId,
    required TResult Function(_AddFoodAdditional value) addFoodAdditional,
    required TResult Function(_SelectGood value) selectGood,
    required TResult Function(_IncrementQuantity value) incrementQuantity,
    required TResult Function(_DecrementQuantity value) decrementQuantity,
    required TResult Function(_ClearGoods value) clearGoods,
    required TResult Function(_SearchTextChanged value) searchTextChanged,
    required TResult Function(_FetchBillOrders value) fetchBillOrders,
    required TResult Function(_SetActiveOrderId value) setActiveOrderId,
    required TResult Function(_CancelOrderItem value) cancelOrderItem,
    required TResult Function(_IncrementExistingItem value)
        incrementExistingItem,
    required TResult Function(_DecrementExistingItem value)
        decrementExistingItem,
    required TResult Function(_DeleteExistingItem value) deleteExistingItem,
    required TResult Function(_SetExistingItemQuantity value)
        setExistingItemQuantity,
    required TResult Function(_SyncExistingItem value) syncExistingItem,
  }) {
    return setSelectedCategoryId(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetCategories value)? getCategories,
    TResult? Function(_InitSavedGoods value)? initSavedGoods,
    TResult? Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult? Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult? Function(_SelectGood value)? selectGood,
    TResult? Function(_IncrementQuantity value)? incrementQuantity,
    TResult? Function(_DecrementQuantity value)? decrementQuantity,
    TResult? Function(_ClearGoods value)? clearGoods,
    TResult? Function(_SearchTextChanged value)? searchTextChanged,
    TResult? Function(_FetchBillOrders value)? fetchBillOrders,
    TResult? Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult? Function(_CancelOrderItem value)? cancelOrderItem,
    TResult? Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult? Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult? Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult? Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult? Function(_SyncExistingItem value)? syncExistingItem,
  }) {
    return setSelectedCategoryId?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetCategories value)? getCategories,
    TResult Function(_InitSavedGoods value)? initSavedGoods,
    TResult Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult Function(_SelectGood value)? selectGood,
    TResult Function(_IncrementQuantity value)? incrementQuantity,
    TResult Function(_DecrementQuantity value)? decrementQuantity,
    TResult Function(_ClearGoods value)? clearGoods,
    TResult Function(_SearchTextChanged value)? searchTextChanged,
    TResult Function(_FetchBillOrders value)? fetchBillOrders,
    TResult Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult Function(_CancelOrderItem value)? cancelOrderItem,
    TResult Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult Function(_SyncExistingItem value)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (setSelectedCategoryId != null) {
      return setSelectedCategoryId(this);
    }
    return orElse();
  }
}

abstract class _SetSelectedCategoryId implements DetailEvent {
  const factory _SetSelectedCategoryId({required final String id}) =
      _$SetSelectedCategoryIdImpl;

  String get id;
  @JsonKey(ignore: true)
  _$$SetSelectedCategoryIdImplCopyWith<_$SetSelectedCategoryIdImpl>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$AddFoodAdditionalImplCopyWith<$Res> {
  factory _$$AddFoodAdditionalImplCopyWith(_$AddFoodAdditionalImpl value,
          $Res Function(_$AddFoodAdditionalImpl) then) =
      __$$AddFoodAdditionalImplCopyWithImpl<$Res>;
  @useResult
  $Res call(
      {List<FoodAdditionalModel> additionals, String orderId, String comment});
}

/// @nodoc
class __$$AddFoodAdditionalImplCopyWithImpl<$Res>
    extends _$DetailEventCopyWithImpl<$Res, _$AddFoodAdditionalImpl>
    implements _$$AddFoodAdditionalImplCopyWith<$Res> {
  __$$AddFoodAdditionalImplCopyWithImpl(_$AddFoodAdditionalImpl _value,
      $Res Function(_$AddFoodAdditionalImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? additionals = null,
    Object? orderId = null,
    Object? comment = null,
  }) {
    return _then(_$AddFoodAdditionalImpl(
      additionals: null == additionals
          ? _value._additionals
          : additionals // ignore: cast_nullable_to_non_nullable
              as List<FoodAdditionalModel>,
      orderId: null == orderId
          ? _value.orderId
          : orderId // ignore: cast_nullable_to_non_nullable
              as String,
      comment: null == comment
          ? _value.comment
          : comment // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$AddFoodAdditionalImpl implements _AddFoodAdditional {
  const _$AddFoodAdditionalImpl(
      {required final List<FoodAdditionalModel> additionals,
      required this.orderId,
      required this.comment})
      : _additionals = additionals;

  final List<FoodAdditionalModel> _additionals;
  @override
  List<FoodAdditionalModel> get additionals {
    if (_additionals is EqualUnmodifiableListView) return _additionals;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_additionals);
  }

  @override
  final String orderId;
  @override
  final String comment;

  @override
  String toString() {
    return 'DetailEvent.addFoodAdditional(additionals: $additionals, orderId: $orderId, comment: $comment)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AddFoodAdditionalImpl &&
            const DeepCollectionEquality()
                .equals(other._additionals, _additionals) &&
            (identical(other.orderId, orderId) || other.orderId == orderId) &&
            (identical(other.comment, comment) || other.comment == comment));
  }

  @override
  int get hashCode => Object.hash(runtimeType,
      const DeepCollectionEquality().hash(_additionals), orderId, comment);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AddFoodAdditionalImplCopyWith<_$AddFoodAdditionalImpl> get copyWith =>
      __$$AddFoodAdditionalImplCopyWithImpl<_$AddFoodAdditionalImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getCategories,
    required TResult Function(List<OrderItem> savedGoods) initSavedGoods,
    required TResult Function(String id) setSelectedCategoryId,
    required TResult Function(List<FoodAdditionalModel> additionals,
            String orderId, String comment)
        addFoodAdditional,
    required TResult Function(GoodsModel good) selectGood,
    required TResult Function(String goodsId) incrementQuantity,
    required TResult Function(String goodsId) decrementQuantity,
    required TResult Function() clearGoods,
    required TResult Function(String text) searchTextChanged,
    required TResult Function(String billId, bool force) fetchBillOrders,
    required TResult Function(String orderId) setActiveOrderId,
    required TResult Function(String itemId, String tableId) cancelOrderItem,
    required TResult Function(String itemKey, String tableId)
        incrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        decrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        deleteExistingItem,
    required TResult Function(String itemKey, String tableId, int quantity)
        setExistingItemQuantity,
    required TResult Function(String itemKey, String tableId) syncExistingItem,
  }) {
    return addFoodAdditional(additionals, orderId, comment);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getCategories,
    TResult? Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult? Function(String id)? setSelectedCategoryId,
    TResult? Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult? Function(GoodsModel good)? selectGood,
    TResult? Function(String goodsId)? incrementQuantity,
    TResult? Function(String goodsId)? decrementQuantity,
    TResult? Function()? clearGoods,
    TResult? Function(String text)? searchTextChanged,
    TResult? Function(String billId, bool force)? fetchBillOrders,
    TResult? Function(String orderId)? setActiveOrderId,
    TResult? Function(String itemId, String tableId)? cancelOrderItem,
    TResult? Function(String itemKey, String tableId)? incrementExistingItem,
    TResult? Function(String itemKey, String tableId)? decrementExistingItem,
    TResult? Function(String itemKey, String tableId)? deleteExistingItem,
    TResult? Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult? Function(String itemKey, String tableId)? syncExistingItem,
  }) {
    return addFoodAdditional?.call(additionals, orderId, comment);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getCategories,
    TResult Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult Function(String id)? setSelectedCategoryId,
    TResult Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult Function(GoodsModel good)? selectGood,
    TResult Function(String goodsId)? incrementQuantity,
    TResult Function(String goodsId)? decrementQuantity,
    TResult Function()? clearGoods,
    TResult Function(String text)? searchTextChanged,
    TResult Function(String billId, bool force)? fetchBillOrders,
    TResult Function(String orderId)? setActiveOrderId,
    TResult Function(String itemId, String tableId)? cancelOrderItem,
    TResult Function(String itemKey, String tableId)? incrementExistingItem,
    TResult Function(String itemKey, String tableId)? decrementExistingItem,
    TResult Function(String itemKey, String tableId)? deleteExistingItem,
    TResult Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult Function(String itemKey, String tableId)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (addFoodAdditional != null) {
      return addFoodAdditional(additionals, orderId, comment);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetCategories value) getCategories,
    required TResult Function(_InitSavedGoods value) initSavedGoods,
    required TResult Function(_SetSelectedCategoryId value)
        setSelectedCategoryId,
    required TResult Function(_AddFoodAdditional value) addFoodAdditional,
    required TResult Function(_SelectGood value) selectGood,
    required TResult Function(_IncrementQuantity value) incrementQuantity,
    required TResult Function(_DecrementQuantity value) decrementQuantity,
    required TResult Function(_ClearGoods value) clearGoods,
    required TResult Function(_SearchTextChanged value) searchTextChanged,
    required TResult Function(_FetchBillOrders value) fetchBillOrders,
    required TResult Function(_SetActiveOrderId value) setActiveOrderId,
    required TResult Function(_CancelOrderItem value) cancelOrderItem,
    required TResult Function(_IncrementExistingItem value)
        incrementExistingItem,
    required TResult Function(_DecrementExistingItem value)
        decrementExistingItem,
    required TResult Function(_DeleteExistingItem value) deleteExistingItem,
    required TResult Function(_SetExistingItemQuantity value)
        setExistingItemQuantity,
    required TResult Function(_SyncExistingItem value) syncExistingItem,
  }) {
    return addFoodAdditional(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetCategories value)? getCategories,
    TResult? Function(_InitSavedGoods value)? initSavedGoods,
    TResult? Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult? Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult? Function(_SelectGood value)? selectGood,
    TResult? Function(_IncrementQuantity value)? incrementQuantity,
    TResult? Function(_DecrementQuantity value)? decrementQuantity,
    TResult? Function(_ClearGoods value)? clearGoods,
    TResult? Function(_SearchTextChanged value)? searchTextChanged,
    TResult? Function(_FetchBillOrders value)? fetchBillOrders,
    TResult? Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult? Function(_CancelOrderItem value)? cancelOrderItem,
    TResult? Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult? Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult? Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult? Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult? Function(_SyncExistingItem value)? syncExistingItem,
  }) {
    return addFoodAdditional?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetCategories value)? getCategories,
    TResult Function(_InitSavedGoods value)? initSavedGoods,
    TResult Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult Function(_SelectGood value)? selectGood,
    TResult Function(_IncrementQuantity value)? incrementQuantity,
    TResult Function(_DecrementQuantity value)? decrementQuantity,
    TResult Function(_ClearGoods value)? clearGoods,
    TResult Function(_SearchTextChanged value)? searchTextChanged,
    TResult Function(_FetchBillOrders value)? fetchBillOrders,
    TResult Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult Function(_CancelOrderItem value)? cancelOrderItem,
    TResult Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult Function(_SyncExistingItem value)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (addFoodAdditional != null) {
      return addFoodAdditional(this);
    }
    return orElse();
  }
}

abstract class _AddFoodAdditional implements DetailEvent {
  const factory _AddFoodAdditional(
      {required final List<FoodAdditionalModel> additionals,
      required final String orderId,
      required final String comment}) = _$AddFoodAdditionalImpl;

  List<FoodAdditionalModel> get additionals;
  String get orderId;
  String get comment;
  @JsonKey(ignore: true)
  _$$AddFoodAdditionalImplCopyWith<_$AddFoodAdditionalImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$SelectGoodImplCopyWith<$Res> {
  factory _$$SelectGoodImplCopyWith(
          _$SelectGoodImpl value, $Res Function(_$SelectGoodImpl) then) =
      __$$SelectGoodImplCopyWithImpl<$Res>;
  @useResult
  $Res call({GoodsModel good});

  $GoodsModelCopyWith<$Res> get good;
}

/// @nodoc
class __$$SelectGoodImplCopyWithImpl<$Res>
    extends _$DetailEventCopyWithImpl<$Res, _$SelectGoodImpl>
    implements _$$SelectGoodImplCopyWith<$Res> {
  __$$SelectGoodImplCopyWithImpl(
      _$SelectGoodImpl _value, $Res Function(_$SelectGoodImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? good = null,
  }) {
    return _then(_$SelectGoodImpl(
      good: null == good
          ? _value.good
          : good // ignore: cast_nullable_to_non_nullable
              as GoodsModel,
    ));
  }

  @override
  @pragma('vm:prefer-inline')
  $GoodsModelCopyWith<$Res> get good {
    return $GoodsModelCopyWith<$Res>(_value.good, (value) {
      return _then(_value.copyWith(good: value));
    });
  }
}

/// @nodoc

class _$SelectGoodImpl implements _SelectGood {
  const _$SelectGoodImpl({required this.good});

  @override
  final GoodsModel good;

  @override
  String toString() {
    return 'DetailEvent.selectGood(good: $good)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SelectGoodImpl &&
            (identical(other.good, good) || other.good == good));
  }

  @override
  int get hashCode => Object.hash(runtimeType, good);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$SelectGoodImplCopyWith<_$SelectGoodImpl> get copyWith =>
      __$$SelectGoodImplCopyWithImpl<_$SelectGoodImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getCategories,
    required TResult Function(List<OrderItem> savedGoods) initSavedGoods,
    required TResult Function(String id) setSelectedCategoryId,
    required TResult Function(List<FoodAdditionalModel> additionals,
            String orderId, String comment)
        addFoodAdditional,
    required TResult Function(GoodsModel good) selectGood,
    required TResult Function(String goodsId) incrementQuantity,
    required TResult Function(String goodsId) decrementQuantity,
    required TResult Function() clearGoods,
    required TResult Function(String text) searchTextChanged,
    required TResult Function(String billId, bool force) fetchBillOrders,
    required TResult Function(String orderId) setActiveOrderId,
    required TResult Function(String itemId, String tableId) cancelOrderItem,
    required TResult Function(String itemKey, String tableId)
        incrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        decrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        deleteExistingItem,
    required TResult Function(String itemKey, String tableId, int quantity)
        setExistingItemQuantity,
    required TResult Function(String itemKey, String tableId) syncExistingItem,
  }) {
    return selectGood(good);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getCategories,
    TResult? Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult? Function(String id)? setSelectedCategoryId,
    TResult? Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult? Function(GoodsModel good)? selectGood,
    TResult? Function(String goodsId)? incrementQuantity,
    TResult? Function(String goodsId)? decrementQuantity,
    TResult? Function()? clearGoods,
    TResult? Function(String text)? searchTextChanged,
    TResult? Function(String billId, bool force)? fetchBillOrders,
    TResult? Function(String orderId)? setActiveOrderId,
    TResult? Function(String itemId, String tableId)? cancelOrderItem,
    TResult? Function(String itemKey, String tableId)? incrementExistingItem,
    TResult? Function(String itemKey, String tableId)? decrementExistingItem,
    TResult? Function(String itemKey, String tableId)? deleteExistingItem,
    TResult? Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult? Function(String itemKey, String tableId)? syncExistingItem,
  }) {
    return selectGood?.call(good);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getCategories,
    TResult Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult Function(String id)? setSelectedCategoryId,
    TResult Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult Function(GoodsModel good)? selectGood,
    TResult Function(String goodsId)? incrementQuantity,
    TResult Function(String goodsId)? decrementQuantity,
    TResult Function()? clearGoods,
    TResult Function(String text)? searchTextChanged,
    TResult Function(String billId, bool force)? fetchBillOrders,
    TResult Function(String orderId)? setActiveOrderId,
    TResult Function(String itemId, String tableId)? cancelOrderItem,
    TResult Function(String itemKey, String tableId)? incrementExistingItem,
    TResult Function(String itemKey, String tableId)? decrementExistingItem,
    TResult Function(String itemKey, String tableId)? deleteExistingItem,
    TResult Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult Function(String itemKey, String tableId)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (selectGood != null) {
      return selectGood(good);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetCategories value) getCategories,
    required TResult Function(_InitSavedGoods value) initSavedGoods,
    required TResult Function(_SetSelectedCategoryId value)
        setSelectedCategoryId,
    required TResult Function(_AddFoodAdditional value) addFoodAdditional,
    required TResult Function(_SelectGood value) selectGood,
    required TResult Function(_IncrementQuantity value) incrementQuantity,
    required TResult Function(_DecrementQuantity value) decrementQuantity,
    required TResult Function(_ClearGoods value) clearGoods,
    required TResult Function(_SearchTextChanged value) searchTextChanged,
    required TResult Function(_FetchBillOrders value) fetchBillOrders,
    required TResult Function(_SetActiveOrderId value) setActiveOrderId,
    required TResult Function(_CancelOrderItem value) cancelOrderItem,
    required TResult Function(_IncrementExistingItem value)
        incrementExistingItem,
    required TResult Function(_DecrementExistingItem value)
        decrementExistingItem,
    required TResult Function(_DeleteExistingItem value) deleteExistingItem,
    required TResult Function(_SetExistingItemQuantity value)
        setExistingItemQuantity,
    required TResult Function(_SyncExistingItem value) syncExistingItem,
  }) {
    return selectGood(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetCategories value)? getCategories,
    TResult? Function(_InitSavedGoods value)? initSavedGoods,
    TResult? Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult? Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult? Function(_SelectGood value)? selectGood,
    TResult? Function(_IncrementQuantity value)? incrementQuantity,
    TResult? Function(_DecrementQuantity value)? decrementQuantity,
    TResult? Function(_ClearGoods value)? clearGoods,
    TResult? Function(_SearchTextChanged value)? searchTextChanged,
    TResult? Function(_FetchBillOrders value)? fetchBillOrders,
    TResult? Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult? Function(_CancelOrderItem value)? cancelOrderItem,
    TResult? Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult? Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult? Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult? Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult? Function(_SyncExistingItem value)? syncExistingItem,
  }) {
    return selectGood?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetCategories value)? getCategories,
    TResult Function(_InitSavedGoods value)? initSavedGoods,
    TResult Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult Function(_SelectGood value)? selectGood,
    TResult Function(_IncrementQuantity value)? incrementQuantity,
    TResult Function(_DecrementQuantity value)? decrementQuantity,
    TResult Function(_ClearGoods value)? clearGoods,
    TResult Function(_SearchTextChanged value)? searchTextChanged,
    TResult Function(_FetchBillOrders value)? fetchBillOrders,
    TResult Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult Function(_CancelOrderItem value)? cancelOrderItem,
    TResult Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult Function(_SyncExistingItem value)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (selectGood != null) {
      return selectGood(this);
    }
    return orElse();
  }
}

abstract class _SelectGood implements DetailEvent {
  const factory _SelectGood({required final GoodsModel good}) =
      _$SelectGoodImpl;

  GoodsModel get good;
  @JsonKey(ignore: true)
  _$$SelectGoodImplCopyWith<_$SelectGoodImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$IncrementQuantityImplCopyWith<$Res> {
  factory _$$IncrementQuantityImplCopyWith(_$IncrementQuantityImpl value,
          $Res Function(_$IncrementQuantityImpl) then) =
      __$$IncrementQuantityImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String goodsId});
}

/// @nodoc
class __$$IncrementQuantityImplCopyWithImpl<$Res>
    extends _$DetailEventCopyWithImpl<$Res, _$IncrementQuantityImpl>
    implements _$$IncrementQuantityImplCopyWith<$Res> {
  __$$IncrementQuantityImplCopyWithImpl(_$IncrementQuantityImpl _value,
      $Res Function(_$IncrementQuantityImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? goodsId = null,
  }) {
    return _then(_$IncrementQuantityImpl(
      goodsId: null == goodsId
          ? _value.goodsId
          : goodsId // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$IncrementQuantityImpl implements _IncrementQuantity {
  const _$IncrementQuantityImpl({required this.goodsId});

  @override
  final String goodsId;

  @override
  String toString() {
    return 'DetailEvent.incrementQuantity(goodsId: $goodsId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$IncrementQuantityImpl &&
            (identical(other.goodsId, goodsId) || other.goodsId == goodsId));
  }

  @override
  int get hashCode => Object.hash(runtimeType, goodsId);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$IncrementQuantityImplCopyWith<_$IncrementQuantityImpl> get copyWith =>
      __$$IncrementQuantityImplCopyWithImpl<_$IncrementQuantityImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getCategories,
    required TResult Function(List<OrderItem> savedGoods) initSavedGoods,
    required TResult Function(String id) setSelectedCategoryId,
    required TResult Function(List<FoodAdditionalModel> additionals,
            String orderId, String comment)
        addFoodAdditional,
    required TResult Function(GoodsModel good) selectGood,
    required TResult Function(String goodsId) incrementQuantity,
    required TResult Function(String goodsId) decrementQuantity,
    required TResult Function() clearGoods,
    required TResult Function(String text) searchTextChanged,
    required TResult Function(String billId, bool force) fetchBillOrders,
    required TResult Function(String orderId) setActiveOrderId,
    required TResult Function(String itemId, String tableId) cancelOrderItem,
    required TResult Function(String itemKey, String tableId)
        incrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        decrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        deleteExistingItem,
    required TResult Function(String itemKey, String tableId, int quantity)
        setExistingItemQuantity,
    required TResult Function(String itemKey, String tableId) syncExistingItem,
  }) {
    return incrementQuantity(goodsId);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getCategories,
    TResult? Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult? Function(String id)? setSelectedCategoryId,
    TResult? Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult? Function(GoodsModel good)? selectGood,
    TResult? Function(String goodsId)? incrementQuantity,
    TResult? Function(String goodsId)? decrementQuantity,
    TResult? Function()? clearGoods,
    TResult? Function(String text)? searchTextChanged,
    TResult? Function(String billId, bool force)? fetchBillOrders,
    TResult? Function(String orderId)? setActiveOrderId,
    TResult? Function(String itemId, String tableId)? cancelOrderItem,
    TResult? Function(String itemKey, String tableId)? incrementExistingItem,
    TResult? Function(String itemKey, String tableId)? decrementExistingItem,
    TResult? Function(String itemKey, String tableId)? deleteExistingItem,
    TResult? Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult? Function(String itemKey, String tableId)? syncExistingItem,
  }) {
    return incrementQuantity?.call(goodsId);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getCategories,
    TResult Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult Function(String id)? setSelectedCategoryId,
    TResult Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult Function(GoodsModel good)? selectGood,
    TResult Function(String goodsId)? incrementQuantity,
    TResult Function(String goodsId)? decrementQuantity,
    TResult Function()? clearGoods,
    TResult Function(String text)? searchTextChanged,
    TResult Function(String billId, bool force)? fetchBillOrders,
    TResult Function(String orderId)? setActiveOrderId,
    TResult Function(String itemId, String tableId)? cancelOrderItem,
    TResult Function(String itemKey, String tableId)? incrementExistingItem,
    TResult Function(String itemKey, String tableId)? decrementExistingItem,
    TResult Function(String itemKey, String tableId)? deleteExistingItem,
    TResult Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult Function(String itemKey, String tableId)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (incrementQuantity != null) {
      return incrementQuantity(goodsId);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetCategories value) getCategories,
    required TResult Function(_InitSavedGoods value) initSavedGoods,
    required TResult Function(_SetSelectedCategoryId value)
        setSelectedCategoryId,
    required TResult Function(_AddFoodAdditional value) addFoodAdditional,
    required TResult Function(_SelectGood value) selectGood,
    required TResult Function(_IncrementQuantity value) incrementQuantity,
    required TResult Function(_DecrementQuantity value) decrementQuantity,
    required TResult Function(_ClearGoods value) clearGoods,
    required TResult Function(_SearchTextChanged value) searchTextChanged,
    required TResult Function(_FetchBillOrders value) fetchBillOrders,
    required TResult Function(_SetActiveOrderId value) setActiveOrderId,
    required TResult Function(_CancelOrderItem value) cancelOrderItem,
    required TResult Function(_IncrementExistingItem value)
        incrementExistingItem,
    required TResult Function(_DecrementExistingItem value)
        decrementExistingItem,
    required TResult Function(_DeleteExistingItem value) deleteExistingItem,
    required TResult Function(_SetExistingItemQuantity value)
        setExistingItemQuantity,
    required TResult Function(_SyncExistingItem value) syncExistingItem,
  }) {
    return incrementQuantity(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetCategories value)? getCategories,
    TResult? Function(_InitSavedGoods value)? initSavedGoods,
    TResult? Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult? Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult? Function(_SelectGood value)? selectGood,
    TResult? Function(_IncrementQuantity value)? incrementQuantity,
    TResult? Function(_DecrementQuantity value)? decrementQuantity,
    TResult? Function(_ClearGoods value)? clearGoods,
    TResult? Function(_SearchTextChanged value)? searchTextChanged,
    TResult? Function(_FetchBillOrders value)? fetchBillOrders,
    TResult? Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult? Function(_CancelOrderItem value)? cancelOrderItem,
    TResult? Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult? Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult? Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult? Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult? Function(_SyncExistingItem value)? syncExistingItem,
  }) {
    return incrementQuantity?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetCategories value)? getCategories,
    TResult Function(_InitSavedGoods value)? initSavedGoods,
    TResult Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult Function(_SelectGood value)? selectGood,
    TResult Function(_IncrementQuantity value)? incrementQuantity,
    TResult Function(_DecrementQuantity value)? decrementQuantity,
    TResult Function(_ClearGoods value)? clearGoods,
    TResult Function(_SearchTextChanged value)? searchTextChanged,
    TResult Function(_FetchBillOrders value)? fetchBillOrders,
    TResult Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult Function(_CancelOrderItem value)? cancelOrderItem,
    TResult Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult Function(_SyncExistingItem value)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (incrementQuantity != null) {
      return incrementQuantity(this);
    }
    return orElse();
  }
}

abstract class _IncrementQuantity implements DetailEvent {
  const factory _IncrementQuantity({required final String goodsId}) =
      _$IncrementQuantityImpl;

  String get goodsId;
  @JsonKey(ignore: true)
  _$$IncrementQuantityImplCopyWith<_$IncrementQuantityImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$DecrementQuantityImplCopyWith<$Res> {
  factory _$$DecrementQuantityImplCopyWith(_$DecrementQuantityImpl value,
          $Res Function(_$DecrementQuantityImpl) then) =
      __$$DecrementQuantityImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String goodsId});
}

/// @nodoc
class __$$DecrementQuantityImplCopyWithImpl<$Res>
    extends _$DetailEventCopyWithImpl<$Res, _$DecrementQuantityImpl>
    implements _$$DecrementQuantityImplCopyWith<$Res> {
  __$$DecrementQuantityImplCopyWithImpl(_$DecrementQuantityImpl _value,
      $Res Function(_$DecrementQuantityImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? goodsId = null,
  }) {
    return _then(_$DecrementQuantityImpl(
      goodsId: null == goodsId
          ? _value.goodsId
          : goodsId // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$DecrementQuantityImpl implements _DecrementQuantity {
  const _$DecrementQuantityImpl({required this.goodsId});

  @override
  final String goodsId;

  @override
  String toString() {
    return 'DetailEvent.decrementQuantity(goodsId: $goodsId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DecrementQuantityImpl &&
            (identical(other.goodsId, goodsId) || other.goodsId == goodsId));
  }

  @override
  int get hashCode => Object.hash(runtimeType, goodsId);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$DecrementQuantityImplCopyWith<_$DecrementQuantityImpl> get copyWith =>
      __$$DecrementQuantityImplCopyWithImpl<_$DecrementQuantityImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getCategories,
    required TResult Function(List<OrderItem> savedGoods) initSavedGoods,
    required TResult Function(String id) setSelectedCategoryId,
    required TResult Function(List<FoodAdditionalModel> additionals,
            String orderId, String comment)
        addFoodAdditional,
    required TResult Function(GoodsModel good) selectGood,
    required TResult Function(String goodsId) incrementQuantity,
    required TResult Function(String goodsId) decrementQuantity,
    required TResult Function() clearGoods,
    required TResult Function(String text) searchTextChanged,
    required TResult Function(String billId, bool force) fetchBillOrders,
    required TResult Function(String orderId) setActiveOrderId,
    required TResult Function(String itemId, String tableId) cancelOrderItem,
    required TResult Function(String itemKey, String tableId)
        incrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        decrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        deleteExistingItem,
    required TResult Function(String itemKey, String tableId, int quantity)
        setExistingItemQuantity,
    required TResult Function(String itemKey, String tableId) syncExistingItem,
  }) {
    return decrementQuantity(goodsId);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getCategories,
    TResult? Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult? Function(String id)? setSelectedCategoryId,
    TResult? Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult? Function(GoodsModel good)? selectGood,
    TResult? Function(String goodsId)? incrementQuantity,
    TResult? Function(String goodsId)? decrementQuantity,
    TResult? Function()? clearGoods,
    TResult? Function(String text)? searchTextChanged,
    TResult? Function(String billId, bool force)? fetchBillOrders,
    TResult? Function(String orderId)? setActiveOrderId,
    TResult? Function(String itemId, String tableId)? cancelOrderItem,
    TResult? Function(String itemKey, String tableId)? incrementExistingItem,
    TResult? Function(String itemKey, String tableId)? decrementExistingItem,
    TResult? Function(String itemKey, String tableId)? deleteExistingItem,
    TResult? Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult? Function(String itemKey, String tableId)? syncExistingItem,
  }) {
    return decrementQuantity?.call(goodsId);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getCategories,
    TResult Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult Function(String id)? setSelectedCategoryId,
    TResult Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult Function(GoodsModel good)? selectGood,
    TResult Function(String goodsId)? incrementQuantity,
    TResult Function(String goodsId)? decrementQuantity,
    TResult Function()? clearGoods,
    TResult Function(String text)? searchTextChanged,
    TResult Function(String billId, bool force)? fetchBillOrders,
    TResult Function(String orderId)? setActiveOrderId,
    TResult Function(String itemId, String tableId)? cancelOrderItem,
    TResult Function(String itemKey, String tableId)? incrementExistingItem,
    TResult Function(String itemKey, String tableId)? decrementExistingItem,
    TResult Function(String itemKey, String tableId)? deleteExistingItem,
    TResult Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult Function(String itemKey, String tableId)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (decrementQuantity != null) {
      return decrementQuantity(goodsId);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetCategories value) getCategories,
    required TResult Function(_InitSavedGoods value) initSavedGoods,
    required TResult Function(_SetSelectedCategoryId value)
        setSelectedCategoryId,
    required TResult Function(_AddFoodAdditional value) addFoodAdditional,
    required TResult Function(_SelectGood value) selectGood,
    required TResult Function(_IncrementQuantity value) incrementQuantity,
    required TResult Function(_DecrementQuantity value) decrementQuantity,
    required TResult Function(_ClearGoods value) clearGoods,
    required TResult Function(_SearchTextChanged value) searchTextChanged,
    required TResult Function(_FetchBillOrders value) fetchBillOrders,
    required TResult Function(_SetActiveOrderId value) setActiveOrderId,
    required TResult Function(_CancelOrderItem value) cancelOrderItem,
    required TResult Function(_IncrementExistingItem value)
        incrementExistingItem,
    required TResult Function(_DecrementExistingItem value)
        decrementExistingItem,
    required TResult Function(_DeleteExistingItem value) deleteExistingItem,
    required TResult Function(_SetExistingItemQuantity value)
        setExistingItemQuantity,
    required TResult Function(_SyncExistingItem value) syncExistingItem,
  }) {
    return decrementQuantity(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetCategories value)? getCategories,
    TResult? Function(_InitSavedGoods value)? initSavedGoods,
    TResult? Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult? Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult? Function(_SelectGood value)? selectGood,
    TResult? Function(_IncrementQuantity value)? incrementQuantity,
    TResult? Function(_DecrementQuantity value)? decrementQuantity,
    TResult? Function(_ClearGoods value)? clearGoods,
    TResult? Function(_SearchTextChanged value)? searchTextChanged,
    TResult? Function(_FetchBillOrders value)? fetchBillOrders,
    TResult? Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult? Function(_CancelOrderItem value)? cancelOrderItem,
    TResult? Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult? Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult? Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult? Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult? Function(_SyncExistingItem value)? syncExistingItem,
  }) {
    return decrementQuantity?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetCategories value)? getCategories,
    TResult Function(_InitSavedGoods value)? initSavedGoods,
    TResult Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult Function(_SelectGood value)? selectGood,
    TResult Function(_IncrementQuantity value)? incrementQuantity,
    TResult Function(_DecrementQuantity value)? decrementQuantity,
    TResult Function(_ClearGoods value)? clearGoods,
    TResult Function(_SearchTextChanged value)? searchTextChanged,
    TResult Function(_FetchBillOrders value)? fetchBillOrders,
    TResult Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult Function(_CancelOrderItem value)? cancelOrderItem,
    TResult Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult Function(_SyncExistingItem value)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (decrementQuantity != null) {
      return decrementQuantity(this);
    }
    return orElse();
  }
}

abstract class _DecrementQuantity implements DetailEvent {
  const factory _DecrementQuantity({required final String goodsId}) =
      _$DecrementQuantityImpl;

  String get goodsId;
  @JsonKey(ignore: true)
  _$$DecrementQuantityImplCopyWith<_$DecrementQuantityImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$ClearGoodsImplCopyWith<$Res> {
  factory _$$ClearGoodsImplCopyWith(
          _$ClearGoodsImpl value, $Res Function(_$ClearGoodsImpl) then) =
      __$$ClearGoodsImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$ClearGoodsImplCopyWithImpl<$Res>
    extends _$DetailEventCopyWithImpl<$Res, _$ClearGoodsImpl>
    implements _$$ClearGoodsImplCopyWith<$Res> {
  __$$ClearGoodsImplCopyWithImpl(
      _$ClearGoodsImpl _value, $Res Function(_$ClearGoodsImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$ClearGoodsImpl implements _ClearGoods {
  const _$ClearGoodsImpl();

  @override
  String toString() {
    return 'DetailEvent.clearGoods()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$ClearGoodsImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getCategories,
    required TResult Function(List<OrderItem> savedGoods) initSavedGoods,
    required TResult Function(String id) setSelectedCategoryId,
    required TResult Function(List<FoodAdditionalModel> additionals,
            String orderId, String comment)
        addFoodAdditional,
    required TResult Function(GoodsModel good) selectGood,
    required TResult Function(String goodsId) incrementQuantity,
    required TResult Function(String goodsId) decrementQuantity,
    required TResult Function() clearGoods,
    required TResult Function(String text) searchTextChanged,
    required TResult Function(String billId, bool force) fetchBillOrders,
    required TResult Function(String orderId) setActiveOrderId,
    required TResult Function(String itemId, String tableId) cancelOrderItem,
    required TResult Function(String itemKey, String tableId)
        incrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        decrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        deleteExistingItem,
    required TResult Function(String itemKey, String tableId, int quantity)
        setExistingItemQuantity,
    required TResult Function(String itemKey, String tableId) syncExistingItem,
  }) {
    return clearGoods();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getCategories,
    TResult? Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult? Function(String id)? setSelectedCategoryId,
    TResult? Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult? Function(GoodsModel good)? selectGood,
    TResult? Function(String goodsId)? incrementQuantity,
    TResult? Function(String goodsId)? decrementQuantity,
    TResult? Function()? clearGoods,
    TResult? Function(String text)? searchTextChanged,
    TResult? Function(String billId, bool force)? fetchBillOrders,
    TResult? Function(String orderId)? setActiveOrderId,
    TResult? Function(String itemId, String tableId)? cancelOrderItem,
    TResult? Function(String itemKey, String tableId)? incrementExistingItem,
    TResult? Function(String itemKey, String tableId)? decrementExistingItem,
    TResult? Function(String itemKey, String tableId)? deleteExistingItem,
    TResult? Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult? Function(String itemKey, String tableId)? syncExistingItem,
  }) {
    return clearGoods?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getCategories,
    TResult Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult Function(String id)? setSelectedCategoryId,
    TResult Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult Function(GoodsModel good)? selectGood,
    TResult Function(String goodsId)? incrementQuantity,
    TResult Function(String goodsId)? decrementQuantity,
    TResult Function()? clearGoods,
    TResult Function(String text)? searchTextChanged,
    TResult Function(String billId, bool force)? fetchBillOrders,
    TResult Function(String orderId)? setActiveOrderId,
    TResult Function(String itemId, String tableId)? cancelOrderItem,
    TResult Function(String itemKey, String tableId)? incrementExistingItem,
    TResult Function(String itemKey, String tableId)? decrementExistingItem,
    TResult Function(String itemKey, String tableId)? deleteExistingItem,
    TResult Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult Function(String itemKey, String tableId)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (clearGoods != null) {
      return clearGoods();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetCategories value) getCategories,
    required TResult Function(_InitSavedGoods value) initSavedGoods,
    required TResult Function(_SetSelectedCategoryId value)
        setSelectedCategoryId,
    required TResult Function(_AddFoodAdditional value) addFoodAdditional,
    required TResult Function(_SelectGood value) selectGood,
    required TResult Function(_IncrementQuantity value) incrementQuantity,
    required TResult Function(_DecrementQuantity value) decrementQuantity,
    required TResult Function(_ClearGoods value) clearGoods,
    required TResult Function(_SearchTextChanged value) searchTextChanged,
    required TResult Function(_FetchBillOrders value) fetchBillOrders,
    required TResult Function(_SetActiveOrderId value) setActiveOrderId,
    required TResult Function(_CancelOrderItem value) cancelOrderItem,
    required TResult Function(_IncrementExistingItem value)
        incrementExistingItem,
    required TResult Function(_DecrementExistingItem value)
        decrementExistingItem,
    required TResult Function(_DeleteExistingItem value) deleteExistingItem,
    required TResult Function(_SetExistingItemQuantity value)
        setExistingItemQuantity,
    required TResult Function(_SyncExistingItem value) syncExistingItem,
  }) {
    return clearGoods(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetCategories value)? getCategories,
    TResult? Function(_InitSavedGoods value)? initSavedGoods,
    TResult? Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult? Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult? Function(_SelectGood value)? selectGood,
    TResult? Function(_IncrementQuantity value)? incrementQuantity,
    TResult? Function(_DecrementQuantity value)? decrementQuantity,
    TResult? Function(_ClearGoods value)? clearGoods,
    TResult? Function(_SearchTextChanged value)? searchTextChanged,
    TResult? Function(_FetchBillOrders value)? fetchBillOrders,
    TResult? Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult? Function(_CancelOrderItem value)? cancelOrderItem,
    TResult? Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult? Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult? Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult? Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult? Function(_SyncExistingItem value)? syncExistingItem,
  }) {
    return clearGoods?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetCategories value)? getCategories,
    TResult Function(_InitSavedGoods value)? initSavedGoods,
    TResult Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult Function(_SelectGood value)? selectGood,
    TResult Function(_IncrementQuantity value)? incrementQuantity,
    TResult Function(_DecrementQuantity value)? decrementQuantity,
    TResult Function(_ClearGoods value)? clearGoods,
    TResult Function(_SearchTextChanged value)? searchTextChanged,
    TResult Function(_FetchBillOrders value)? fetchBillOrders,
    TResult Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult Function(_CancelOrderItem value)? cancelOrderItem,
    TResult Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult Function(_SyncExistingItem value)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (clearGoods != null) {
      return clearGoods(this);
    }
    return orElse();
  }
}

abstract class _ClearGoods implements DetailEvent {
  const factory _ClearGoods() = _$ClearGoodsImpl;
}

/// @nodoc
abstract class _$$SearchTextChangedImplCopyWith<$Res> {
  factory _$$SearchTextChangedImplCopyWith(_$SearchTextChangedImpl value,
          $Res Function(_$SearchTextChangedImpl) then) =
      __$$SearchTextChangedImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String text});
}

/// @nodoc
class __$$SearchTextChangedImplCopyWithImpl<$Res>
    extends _$DetailEventCopyWithImpl<$Res, _$SearchTextChangedImpl>
    implements _$$SearchTextChangedImplCopyWith<$Res> {
  __$$SearchTextChangedImplCopyWithImpl(_$SearchTextChangedImpl _value,
      $Res Function(_$SearchTextChangedImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? text = null,
  }) {
    return _then(_$SearchTextChangedImpl(
      text: null == text
          ? _value.text
          : text // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$SearchTextChangedImpl implements _SearchTextChanged {
  const _$SearchTextChangedImpl({required this.text});

  @override
  final String text;

  @override
  String toString() {
    return 'DetailEvent.searchTextChanged(text: $text)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SearchTextChangedImpl &&
            (identical(other.text, text) || other.text == text));
  }

  @override
  int get hashCode => Object.hash(runtimeType, text);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$SearchTextChangedImplCopyWith<_$SearchTextChangedImpl> get copyWith =>
      __$$SearchTextChangedImplCopyWithImpl<_$SearchTextChangedImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getCategories,
    required TResult Function(List<OrderItem> savedGoods) initSavedGoods,
    required TResult Function(String id) setSelectedCategoryId,
    required TResult Function(List<FoodAdditionalModel> additionals,
            String orderId, String comment)
        addFoodAdditional,
    required TResult Function(GoodsModel good) selectGood,
    required TResult Function(String goodsId) incrementQuantity,
    required TResult Function(String goodsId) decrementQuantity,
    required TResult Function() clearGoods,
    required TResult Function(String text) searchTextChanged,
    required TResult Function(String billId, bool force) fetchBillOrders,
    required TResult Function(String orderId) setActiveOrderId,
    required TResult Function(String itemId, String tableId) cancelOrderItem,
    required TResult Function(String itemKey, String tableId)
        incrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        decrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        deleteExistingItem,
    required TResult Function(String itemKey, String tableId, int quantity)
        setExistingItemQuantity,
    required TResult Function(String itemKey, String tableId) syncExistingItem,
  }) {
    return searchTextChanged(text);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getCategories,
    TResult? Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult? Function(String id)? setSelectedCategoryId,
    TResult? Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult? Function(GoodsModel good)? selectGood,
    TResult? Function(String goodsId)? incrementQuantity,
    TResult? Function(String goodsId)? decrementQuantity,
    TResult? Function()? clearGoods,
    TResult? Function(String text)? searchTextChanged,
    TResult? Function(String billId, bool force)? fetchBillOrders,
    TResult? Function(String orderId)? setActiveOrderId,
    TResult? Function(String itemId, String tableId)? cancelOrderItem,
    TResult? Function(String itemKey, String tableId)? incrementExistingItem,
    TResult? Function(String itemKey, String tableId)? decrementExistingItem,
    TResult? Function(String itemKey, String tableId)? deleteExistingItem,
    TResult? Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult? Function(String itemKey, String tableId)? syncExistingItem,
  }) {
    return searchTextChanged?.call(text);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getCategories,
    TResult Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult Function(String id)? setSelectedCategoryId,
    TResult Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult Function(GoodsModel good)? selectGood,
    TResult Function(String goodsId)? incrementQuantity,
    TResult Function(String goodsId)? decrementQuantity,
    TResult Function()? clearGoods,
    TResult Function(String text)? searchTextChanged,
    TResult Function(String billId, bool force)? fetchBillOrders,
    TResult Function(String orderId)? setActiveOrderId,
    TResult Function(String itemId, String tableId)? cancelOrderItem,
    TResult Function(String itemKey, String tableId)? incrementExistingItem,
    TResult Function(String itemKey, String tableId)? decrementExistingItem,
    TResult Function(String itemKey, String tableId)? deleteExistingItem,
    TResult Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult Function(String itemKey, String tableId)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (searchTextChanged != null) {
      return searchTextChanged(text);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetCategories value) getCategories,
    required TResult Function(_InitSavedGoods value) initSavedGoods,
    required TResult Function(_SetSelectedCategoryId value)
        setSelectedCategoryId,
    required TResult Function(_AddFoodAdditional value) addFoodAdditional,
    required TResult Function(_SelectGood value) selectGood,
    required TResult Function(_IncrementQuantity value) incrementQuantity,
    required TResult Function(_DecrementQuantity value) decrementQuantity,
    required TResult Function(_ClearGoods value) clearGoods,
    required TResult Function(_SearchTextChanged value) searchTextChanged,
    required TResult Function(_FetchBillOrders value) fetchBillOrders,
    required TResult Function(_SetActiveOrderId value) setActiveOrderId,
    required TResult Function(_CancelOrderItem value) cancelOrderItem,
    required TResult Function(_IncrementExistingItem value)
        incrementExistingItem,
    required TResult Function(_DecrementExistingItem value)
        decrementExistingItem,
    required TResult Function(_DeleteExistingItem value) deleteExistingItem,
    required TResult Function(_SetExistingItemQuantity value)
        setExistingItemQuantity,
    required TResult Function(_SyncExistingItem value) syncExistingItem,
  }) {
    return searchTextChanged(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetCategories value)? getCategories,
    TResult? Function(_InitSavedGoods value)? initSavedGoods,
    TResult? Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult? Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult? Function(_SelectGood value)? selectGood,
    TResult? Function(_IncrementQuantity value)? incrementQuantity,
    TResult? Function(_DecrementQuantity value)? decrementQuantity,
    TResult? Function(_ClearGoods value)? clearGoods,
    TResult? Function(_SearchTextChanged value)? searchTextChanged,
    TResult? Function(_FetchBillOrders value)? fetchBillOrders,
    TResult? Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult? Function(_CancelOrderItem value)? cancelOrderItem,
    TResult? Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult? Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult? Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult? Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult? Function(_SyncExistingItem value)? syncExistingItem,
  }) {
    return searchTextChanged?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetCategories value)? getCategories,
    TResult Function(_InitSavedGoods value)? initSavedGoods,
    TResult Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult Function(_SelectGood value)? selectGood,
    TResult Function(_IncrementQuantity value)? incrementQuantity,
    TResult Function(_DecrementQuantity value)? decrementQuantity,
    TResult Function(_ClearGoods value)? clearGoods,
    TResult Function(_SearchTextChanged value)? searchTextChanged,
    TResult Function(_FetchBillOrders value)? fetchBillOrders,
    TResult Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult Function(_CancelOrderItem value)? cancelOrderItem,
    TResult Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult Function(_SyncExistingItem value)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (searchTextChanged != null) {
      return searchTextChanged(this);
    }
    return orElse();
  }
}

abstract class _SearchTextChanged implements DetailEvent {
  const factory _SearchTextChanged({required final String text}) =
      _$SearchTextChangedImpl;

  String get text;
  @JsonKey(ignore: true)
  _$$SearchTextChangedImplCopyWith<_$SearchTextChangedImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$FetchBillOrdersImplCopyWith<$Res> {
  factory _$$FetchBillOrdersImplCopyWith(_$FetchBillOrdersImpl value,
          $Res Function(_$FetchBillOrdersImpl) then) =
      __$$FetchBillOrdersImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String billId, bool force});
}

/// @nodoc
class __$$FetchBillOrdersImplCopyWithImpl<$Res>
    extends _$DetailEventCopyWithImpl<$Res, _$FetchBillOrdersImpl>
    implements _$$FetchBillOrdersImplCopyWith<$Res> {
  __$$FetchBillOrdersImplCopyWithImpl(
      _$FetchBillOrdersImpl _value, $Res Function(_$FetchBillOrdersImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? billId = null,
    Object? force = null,
  }) {
    return _then(_$FetchBillOrdersImpl(
      billId: null == billId
          ? _value.billId
          : billId // ignore: cast_nullable_to_non_nullable
              as String,
      force: null == force
          ? _value.force
          : force // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc

class _$FetchBillOrdersImpl implements _FetchBillOrders {
  const _$FetchBillOrdersImpl({required this.billId, this.force = false});

  @override
  final String billId;
  @override
  @JsonKey()
  final bool force;

  @override
  String toString() {
    return 'DetailEvent.fetchBillOrders(billId: $billId, force: $force)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$FetchBillOrdersImpl &&
            (identical(other.billId, billId) || other.billId == billId) &&
            (identical(other.force, force) || other.force == force));
  }

  @override
  int get hashCode => Object.hash(runtimeType, billId, force);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$FetchBillOrdersImplCopyWith<_$FetchBillOrdersImpl> get copyWith =>
      __$$FetchBillOrdersImplCopyWithImpl<_$FetchBillOrdersImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getCategories,
    required TResult Function(List<OrderItem> savedGoods) initSavedGoods,
    required TResult Function(String id) setSelectedCategoryId,
    required TResult Function(List<FoodAdditionalModel> additionals,
            String orderId, String comment)
        addFoodAdditional,
    required TResult Function(GoodsModel good) selectGood,
    required TResult Function(String goodsId) incrementQuantity,
    required TResult Function(String goodsId) decrementQuantity,
    required TResult Function() clearGoods,
    required TResult Function(String text) searchTextChanged,
    required TResult Function(String billId, bool force) fetchBillOrders,
    required TResult Function(String orderId) setActiveOrderId,
    required TResult Function(String itemId, String tableId) cancelOrderItem,
    required TResult Function(String itemKey, String tableId)
        incrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        decrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        deleteExistingItem,
    required TResult Function(String itemKey, String tableId, int quantity)
        setExistingItemQuantity,
    required TResult Function(String itemKey, String tableId) syncExistingItem,
  }) {
    return fetchBillOrders(billId, force);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getCategories,
    TResult? Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult? Function(String id)? setSelectedCategoryId,
    TResult? Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult? Function(GoodsModel good)? selectGood,
    TResult? Function(String goodsId)? incrementQuantity,
    TResult? Function(String goodsId)? decrementQuantity,
    TResult? Function()? clearGoods,
    TResult? Function(String text)? searchTextChanged,
    TResult? Function(String billId, bool force)? fetchBillOrders,
    TResult? Function(String orderId)? setActiveOrderId,
    TResult? Function(String itemId, String tableId)? cancelOrderItem,
    TResult? Function(String itemKey, String tableId)? incrementExistingItem,
    TResult? Function(String itemKey, String tableId)? decrementExistingItem,
    TResult? Function(String itemKey, String tableId)? deleteExistingItem,
    TResult? Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult? Function(String itemKey, String tableId)? syncExistingItem,
  }) {
    return fetchBillOrders?.call(billId, force);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getCategories,
    TResult Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult Function(String id)? setSelectedCategoryId,
    TResult Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult Function(GoodsModel good)? selectGood,
    TResult Function(String goodsId)? incrementQuantity,
    TResult Function(String goodsId)? decrementQuantity,
    TResult Function()? clearGoods,
    TResult Function(String text)? searchTextChanged,
    TResult Function(String billId, bool force)? fetchBillOrders,
    TResult Function(String orderId)? setActiveOrderId,
    TResult Function(String itemId, String tableId)? cancelOrderItem,
    TResult Function(String itemKey, String tableId)? incrementExistingItem,
    TResult Function(String itemKey, String tableId)? decrementExistingItem,
    TResult Function(String itemKey, String tableId)? deleteExistingItem,
    TResult Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult Function(String itemKey, String tableId)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (fetchBillOrders != null) {
      return fetchBillOrders(billId, force);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetCategories value) getCategories,
    required TResult Function(_InitSavedGoods value) initSavedGoods,
    required TResult Function(_SetSelectedCategoryId value)
        setSelectedCategoryId,
    required TResult Function(_AddFoodAdditional value) addFoodAdditional,
    required TResult Function(_SelectGood value) selectGood,
    required TResult Function(_IncrementQuantity value) incrementQuantity,
    required TResult Function(_DecrementQuantity value) decrementQuantity,
    required TResult Function(_ClearGoods value) clearGoods,
    required TResult Function(_SearchTextChanged value) searchTextChanged,
    required TResult Function(_FetchBillOrders value) fetchBillOrders,
    required TResult Function(_SetActiveOrderId value) setActiveOrderId,
    required TResult Function(_CancelOrderItem value) cancelOrderItem,
    required TResult Function(_IncrementExistingItem value)
        incrementExistingItem,
    required TResult Function(_DecrementExistingItem value)
        decrementExistingItem,
    required TResult Function(_DeleteExistingItem value) deleteExistingItem,
    required TResult Function(_SetExistingItemQuantity value)
        setExistingItemQuantity,
    required TResult Function(_SyncExistingItem value) syncExistingItem,
  }) {
    return fetchBillOrders(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetCategories value)? getCategories,
    TResult? Function(_InitSavedGoods value)? initSavedGoods,
    TResult? Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult? Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult? Function(_SelectGood value)? selectGood,
    TResult? Function(_IncrementQuantity value)? incrementQuantity,
    TResult? Function(_DecrementQuantity value)? decrementQuantity,
    TResult? Function(_ClearGoods value)? clearGoods,
    TResult? Function(_SearchTextChanged value)? searchTextChanged,
    TResult? Function(_FetchBillOrders value)? fetchBillOrders,
    TResult? Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult? Function(_CancelOrderItem value)? cancelOrderItem,
    TResult? Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult? Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult? Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult? Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult? Function(_SyncExistingItem value)? syncExistingItem,
  }) {
    return fetchBillOrders?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetCategories value)? getCategories,
    TResult Function(_InitSavedGoods value)? initSavedGoods,
    TResult Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult Function(_SelectGood value)? selectGood,
    TResult Function(_IncrementQuantity value)? incrementQuantity,
    TResult Function(_DecrementQuantity value)? decrementQuantity,
    TResult Function(_ClearGoods value)? clearGoods,
    TResult Function(_SearchTextChanged value)? searchTextChanged,
    TResult Function(_FetchBillOrders value)? fetchBillOrders,
    TResult Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult Function(_CancelOrderItem value)? cancelOrderItem,
    TResult Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult Function(_SyncExistingItem value)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (fetchBillOrders != null) {
      return fetchBillOrders(this);
    }
    return orElse();
  }
}

abstract class _FetchBillOrders implements DetailEvent {
  const factory _FetchBillOrders(
      {required final String billId, final bool force}) = _$FetchBillOrdersImpl;

  String get billId;
  bool get force;
  @JsonKey(ignore: true)
  _$$FetchBillOrdersImplCopyWith<_$FetchBillOrdersImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$SetActiveOrderIdImplCopyWith<$Res> {
  factory _$$SetActiveOrderIdImplCopyWith(_$SetActiveOrderIdImpl value,
          $Res Function(_$SetActiveOrderIdImpl) then) =
      __$$SetActiveOrderIdImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String orderId});
}

/// @nodoc
class __$$SetActiveOrderIdImplCopyWithImpl<$Res>
    extends _$DetailEventCopyWithImpl<$Res, _$SetActiveOrderIdImpl>
    implements _$$SetActiveOrderIdImplCopyWith<$Res> {
  __$$SetActiveOrderIdImplCopyWithImpl(_$SetActiveOrderIdImpl _value,
      $Res Function(_$SetActiveOrderIdImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? orderId = null,
  }) {
    return _then(_$SetActiveOrderIdImpl(
      orderId: null == orderId
          ? _value.orderId
          : orderId // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$SetActiveOrderIdImpl implements _SetActiveOrderId {
  const _$SetActiveOrderIdImpl({required this.orderId});

  @override
  final String orderId;

  @override
  String toString() {
    return 'DetailEvent.setActiveOrderId(orderId: $orderId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SetActiveOrderIdImpl &&
            (identical(other.orderId, orderId) || other.orderId == orderId));
  }

  @override
  int get hashCode => Object.hash(runtimeType, orderId);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$SetActiveOrderIdImplCopyWith<_$SetActiveOrderIdImpl> get copyWith =>
      __$$SetActiveOrderIdImplCopyWithImpl<_$SetActiveOrderIdImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getCategories,
    required TResult Function(List<OrderItem> savedGoods) initSavedGoods,
    required TResult Function(String id) setSelectedCategoryId,
    required TResult Function(List<FoodAdditionalModel> additionals,
            String orderId, String comment)
        addFoodAdditional,
    required TResult Function(GoodsModel good) selectGood,
    required TResult Function(String goodsId) incrementQuantity,
    required TResult Function(String goodsId) decrementQuantity,
    required TResult Function() clearGoods,
    required TResult Function(String text) searchTextChanged,
    required TResult Function(String billId, bool force) fetchBillOrders,
    required TResult Function(String orderId) setActiveOrderId,
    required TResult Function(String itemId, String tableId) cancelOrderItem,
    required TResult Function(String itemKey, String tableId)
        incrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        decrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        deleteExistingItem,
    required TResult Function(String itemKey, String tableId, int quantity)
        setExistingItemQuantity,
    required TResult Function(String itemKey, String tableId) syncExistingItem,
  }) {
    return setActiveOrderId(orderId);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getCategories,
    TResult? Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult? Function(String id)? setSelectedCategoryId,
    TResult? Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult? Function(GoodsModel good)? selectGood,
    TResult? Function(String goodsId)? incrementQuantity,
    TResult? Function(String goodsId)? decrementQuantity,
    TResult? Function()? clearGoods,
    TResult? Function(String text)? searchTextChanged,
    TResult? Function(String billId, bool force)? fetchBillOrders,
    TResult? Function(String orderId)? setActiveOrderId,
    TResult? Function(String itemId, String tableId)? cancelOrderItem,
    TResult? Function(String itemKey, String tableId)? incrementExistingItem,
    TResult? Function(String itemKey, String tableId)? decrementExistingItem,
    TResult? Function(String itemKey, String tableId)? deleteExistingItem,
    TResult? Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult? Function(String itemKey, String tableId)? syncExistingItem,
  }) {
    return setActiveOrderId?.call(orderId);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getCategories,
    TResult Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult Function(String id)? setSelectedCategoryId,
    TResult Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult Function(GoodsModel good)? selectGood,
    TResult Function(String goodsId)? incrementQuantity,
    TResult Function(String goodsId)? decrementQuantity,
    TResult Function()? clearGoods,
    TResult Function(String text)? searchTextChanged,
    TResult Function(String billId, bool force)? fetchBillOrders,
    TResult Function(String orderId)? setActiveOrderId,
    TResult Function(String itemId, String tableId)? cancelOrderItem,
    TResult Function(String itemKey, String tableId)? incrementExistingItem,
    TResult Function(String itemKey, String tableId)? decrementExistingItem,
    TResult Function(String itemKey, String tableId)? deleteExistingItem,
    TResult Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult Function(String itemKey, String tableId)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (setActiveOrderId != null) {
      return setActiveOrderId(orderId);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetCategories value) getCategories,
    required TResult Function(_InitSavedGoods value) initSavedGoods,
    required TResult Function(_SetSelectedCategoryId value)
        setSelectedCategoryId,
    required TResult Function(_AddFoodAdditional value) addFoodAdditional,
    required TResult Function(_SelectGood value) selectGood,
    required TResult Function(_IncrementQuantity value) incrementQuantity,
    required TResult Function(_DecrementQuantity value) decrementQuantity,
    required TResult Function(_ClearGoods value) clearGoods,
    required TResult Function(_SearchTextChanged value) searchTextChanged,
    required TResult Function(_FetchBillOrders value) fetchBillOrders,
    required TResult Function(_SetActiveOrderId value) setActiveOrderId,
    required TResult Function(_CancelOrderItem value) cancelOrderItem,
    required TResult Function(_IncrementExistingItem value)
        incrementExistingItem,
    required TResult Function(_DecrementExistingItem value)
        decrementExistingItem,
    required TResult Function(_DeleteExistingItem value) deleteExistingItem,
    required TResult Function(_SetExistingItemQuantity value)
        setExistingItemQuantity,
    required TResult Function(_SyncExistingItem value) syncExistingItem,
  }) {
    return setActiveOrderId(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetCategories value)? getCategories,
    TResult? Function(_InitSavedGoods value)? initSavedGoods,
    TResult? Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult? Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult? Function(_SelectGood value)? selectGood,
    TResult? Function(_IncrementQuantity value)? incrementQuantity,
    TResult? Function(_DecrementQuantity value)? decrementQuantity,
    TResult? Function(_ClearGoods value)? clearGoods,
    TResult? Function(_SearchTextChanged value)? searchTextChanged,
    TResult? Function(_FetchBillOrders value)? fetchBillOrders,
    TResult? Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult? Function(_CancelOrderItem value)? cancelOrderItem,
    TResult? Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult? Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult? Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult? Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult? Function(_SyncExistingItem value)? syncExistingItem,
  }) {
    return setActiveOrderId?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetCategories value)? getCategories,
    TResult Function(_InitSavedGoods value)? initSavedGoods,
    TResult Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult Function(_SelectGood value)? selectGood,
    TResult Function(_IncrementQuantity value)? incrementQuantity,
    TResult Function(_DecrementQuantity value)? decrementQuantity,
    TResult Function(_ClearGoods value)? clearGoods,
    TResult Function(_SearchTextChanged value)? searchTextChanged,
    TResult Function(_FetchBillOrders value)? fetchBillOrders,
    TResult Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult Function(_CancelOrderItem value)? cancelOrderItem,
    TResult Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult Function(_SyncExistingItem value)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (setActiveOrderId != null) {
      return setActiveOrderId(this);
    }
    return orElse();
  }
}

abstract class _SetActiveOrderId implements DetailEvent {
  const factory _SetActiveOrderId({required final String orderId}) =
      _$SetActiveOrderIdImpl;

  String get orderId;
  @JsonKey(ignore: true)
  _$$SetActiveOrderIdImplCopyWith<_$SetActiveOrderIdImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$CancelOrderItemImplCopyWith<$Res> {
  factory _$$CancelOrderItemImplCopyWith(_$CancelOrderItemImpl value,
          $Res Function(_$CancelOrderItemImpl) then) =
      __$$CancelOrderItemImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String itemId, String tableId});
}

/// @nodoc
class __$$CancelOrderItemImplCopyWithImpl<$Res>
    extends _$DetailEventCopyWithImpl<$Res, _$CancelOrderItemImpl>
    implements _$$CancelOrderItemImplCopyWith<$Res> {
  __$$CancelOrderItemImplCopyWithImpl(
      _$CancelOrderItemImpl _value, $Res Function(_$CancelOrderItemImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? itemId = null,
    Object? tableId = null,
  }) {
    return _then(_$CancelOrderItemImpl(
      itemId: null == itemId
          ? _value.itemId
          : itemId // ignore: cast_nullable_to_non_nullable
              as String,
      tableId: null == tableId
          ? _value.tableId
          : tableId // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$CancelOrderItemImpl implements _CancelOrderItem {
  const _$CancelOrderItemImpl({required this.itemId, required this.tableId});

  @override
  final String itemId;
  @override
  final String tableId;

  @override
  String toString() {
    return 'DetailEvent.cancelOrderItem(itemId: $itemId, tableId: $tableId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CancelOrderItemImpl &&
            (identical(other.itemId, itemId) || other.itemId == itemId) &&
            (identical(other.tableId, tableId) || other.tableId == tableId));
  }

  @override
  int get hashCode => Object.hash(runtimeType, itemId, tableId);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CancelOrderItemImplCopyWith<_$CancelOrderItemImpl> get copyWith =>
      __$$CancelOrderItemImplCopyWithImpl<_$CancelOrderItemImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getCategories,
    required TResult Function(List<OrderItem> savedGoods) initSavedGoods,
    required TResult Function(String id) setSelectedCategoryId,
    required TResult Function(List<FoodAdditionalModel> additionals,
            String orderId, String comment)
        addFoodAdditional,
    required TResult Function(GoodsModel good) selectGood,
    required TResult Function(String goodsId) incrementQuantity,
    required TResult Function(String goodsId) decrementQuantity,
    required TResult Function() clearGoods,
    required TResult Function(String text) searchTextChanged,
    required TResult Function(String billId, bool force) fetchBillOrders,
    required TResult Function(String orderId) setActiveOrderId,
    required TResult Function(String itemId, String tableId) cancelOrderItem,
    required TResult Function(String itemKey, String tableId)
        incrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        decrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        deleteExistingItem,
    required TResult Function(String itemKey, String tableId, int quantity)
        setExistingItemQuantity,
    required TResult Function(String itemKey, String tableId) syncExistingItem,
  }) {
    return cancelOrderItem(itemId, tableId);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getCategories,
    TResult? Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult? Function(String id)? setSelectedCategoryId,
    TResult? Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult? Function(GoodsModel good)? selectGood,
    TResult? Function(String goodsId)? incrementQuantity,
    TResult? Function(String goodsId)? decrementQuantity,
    TResult? Function()? clearGoods,
    TResult? Function(String text)? searchTextChanged,
    TResult? Function(String billId, bool force)? fetchBillOrders,
    TResult? Function(String orderId)? setActiveOrderId,
    TResult? Function(String itemId, String tableId)? cancelOrderItem,
    TResult? Function(String itemKey, String tableId)? incrementExistingItem,
    TResult? Function(String itemKey, String tableId)? decrementExistingItem,
    TResult? Function(String itemKey, String tableId)? deleteExistingItem,
    TResult? Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult? Function(String itemKey, String tableId)? syncExistingItem,
  }) {
    return cancelOrderItem?.call(itemId, tableId);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getCategories,
    TResult Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult Function(String id)? setSelectedCategoryId,
    TResult Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult Function(GoodsModel good)? selectGood,
    TResult Function(String goodsId)? incrementQuantity,
    TResult Function(String goodsId)? decrementQuantity,
    TResult Function()? clearGoods,
    TResult Function(String text)? searchTextChanged,
    TResult Function(String billId, bool force)? fetchBillOrders,
    TResult Function(String orderId)? setActiveOrderId,
    TResult Function(String itemId, String tableId)? cancelOrderItem,
    TResult Function(String itemKey, String tableId)? incrementExistingItem,
    TResult Function(String itemKey, String tableId)? decrementExistingItem,
    TResult Function(String itemKey, String tableId)? deleteExistingItem,
    TResult Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult Function(String itemKey, String tableId)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (cancelOrderItem != null) {
      return cancelOrderItem(itemId, tableId);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetCategories value) getCategories,
    required TResult Function(_InitSavedGoods value) initSavedGoods,
    required TResult Function(_SetSelectedCategoryId value)
        setSelectedCategoryId,
    required TResult Function(_AddFoodAdditional value) addFoodAdditional,
    required TResult Function(_SelectGood value) selectGood,
    required TResult Function(_IncrementQuantity value) incrementQuantity,
    required TResult Function(_DecrementQuantity value) decrementQuantity,
    required TResult Function(_ClearGoods value) clearGoods,
    required TResult Function(_SearchTextChanged value) searchTextChanged,
    required TResult Function(_FetchBillOrders value) fetchBillOrders,
    required TResult Function(_SetActiveOrderId value) setActiveOrderId,
    required TResult Function(_CancelOrderItem value) cancelOrderItem,
    required TResult Function(_IncrementExistingItem value)
        incrementExistingItem,
    required TResult Function(_DecrementExistingItem value)
        decrementExistingItem,
    required TResult Function(_DeleteExistingItem value) deleteExistingItem,
    required TResult Function(_SetExistingItemQuantity value)
        setExistingItemQuantity,
    required TResult Function(_SyncExistingItem value) syncExistingItem,
  }) {
    return cancelOrderItem(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetCategories value)? getCategories,
    TResult? Function(_InitSavedGoods value)? initSavedGoods,
    TResult? Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult? Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult? Function(_SelectGood value)? selectGood,
    TResult? Function(_IncrementQuantity value)? incrementQuantity,
    TResult? Function(_DecrementQuantity value)? decrementQuantity,
    TResult? Function(_ClearGoods value)? clearGoods,
    TResult? Function(_SearchTextChanged value)? searchTextChanged,
    TResult? Function(_FetchBillOrders value)? fetchBillOrders,
    TResult? Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult? Function(_CancelOrderItem value)? cancelOrderItem,
    TResult? Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult? Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult? Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult? Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult? Function(_SyncExistingItem value)? syncExistingItem,
  }) {
    return cancelOrderItem?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetCategories value)? getCategories,
    TResult Function(_InitSavedGoods value)? initSavedGoods,
    TResult Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult Function(_SelectGood value)? selectGood,
    TResult Function(_IncrementQuantity value)? incrementQuantity,
    TResult Function(_DecrementQuantity value)? decrementQuantity,
    TResult Function(_ClearGoods value)? clearGoods,
    TResult Function(_SearchTextChanged value)? searchTextChanged,
    TResult Function(_FetchBillOrders value)? fetchBillOrders,
    TResult Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult Function(_CancelOrderItem value)? cancelOrderItem,
    TResult Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult Function(_SyncExistingItem value)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (cancelOrderItem != null) {
      return cancelOrderItem(this);
    }
    return orElse();
  }
}

abstract class _CancelOrderItem implements DetailEvent {
  const factory _CancelOrderItem(
      {required final String itemId,
      required final String tableId}) = _$CancelOrderItemImpl;

  String get itemId;
  String get tableId;
  @JsonKey(ignore: true)
  _$$CancelOrderItemImplCopyWith<_$CancelOrderItemImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$IncrementExistingItemImplCopyWith<$Res> {
  factory _$$IncrementExistingItemImplCopyWith(
          _$IncrementExistingItemImpl value,
          $Res Function(_$IncrementExistingItemImpl) then) =
      __$$IncrementExistingItemImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String itemKey, String tableId});
}

/// @nodoc
class __$$IncrementExistingItemImplCopyWithImpl<$Res>
    extends _$DetailEventCopyWithImpl<$Res, _$IncrementExistingItemImpl>
    implements _$$IncrementExistingItemImplCopyWith<$Res> {
  __$$IncrementExistingItemImplCopyWithImpl(_$IncrementExistingItemImpl _value,
      $Res Function(_$IncrementExistingItemImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? itemKey = null,
    Object? tableId = null,
  }) {
    return _then(_$IncrementExistingItemImpl(
      itemKey: null == itemKey
          ? _value.itemKey
          : itemKey // ignore: cast_nullable_to_non_nullable
              as String,
      tableId: null == tableId
          ? _value.tableId
          : tableId // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$IncrementExistingItemImpl implements _IncrementExistingItem {
  const _$IncrementExistingItemImpl(
      {required this.itemKey, required this.tableId});

  @override
  final String itemKey;
  @override
  final String tableId;

  @override
  String toString() {
    return 'DetailEvent.incrementExistingItem(itemKey: $itemKey, tableId: $tableId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$IncrementExistingItemImpl &&
            (identical(other.itemKey, itemKey) || other.itemKey == itemKey) &&
            (identical(other.tableId, tableId) || other.tableId == tableId));
  }

  @override
  int get hashCode => Object.hash(runtimeType, itemKey, tableId);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$IncrementExistingItemImplCopyWith<_$IncrementExistingItemImpl>
      get copyWith => __$$IncrementExistingItemImplCopyWithImpl<
          _$IncrementExistingItemImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getCategories,
    required TResult Function(List<OrderItem> savedGoods) initSavedGoods,
    required TResult Function(String id) setSelectedCategoryId,
    required TResult Function(List<FoodAdditionalModel> additionals,
            String orderId, String comment)
        addFoodAdditional,
    required TResult Function(GoodsModel good) selectGood,
    required TResult Function(String goodsId) incrementQuantity,
    required TResult Function(String goodsId) decrementQuantity,
    required TResult Function() clearGoods,
    required TResult Function(String text) searchTextChanged,
    required TResult Function(String billId, bool force) fetchBillOrders,
    required TResult Function(String orderId) setActiveOrderId,
    required TResult Function(String itemId, String tableId) cancelOrderItem,
    required TResult Function(String itemKey, String tableId)
        incrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        decrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        deleteExistingItem,
    required TResult Function(String itemKey, String tableId, int quantity)
        setExistingItemQuantity,
    required TResult Function(String itemKey, String tableId) syncExistingItem,
  }) {
    return incrementExistingItem(itemKey, tableId);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getCategories,
    TResult? Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult? Function(String id)? setSelectedCategoryId,
    TResult? Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult? Function(GoodsModel good)? selectGood,
    TResult? Function(String goodsId)? incrementQuantity,
    TResult? Function(String goodsId)? decrementQuantity,
    TResult? Function()? clearGoods,
    TResult? Function(String text)? searchTextChanged,
    TResult? Function(String billId, bool force)? fetchBillOrders,
    TResult? Function(String orderId)? setActiveOrderId,
    TResult? Function(String itemId, String tableId)? cancelOrderItem,
    TResult? Function(String itemKey, String tableId)? incrementExistingItem,
    TResult? Function(String itemKey, String tableId)? decrementExistingItem,
    TResult? Function(String itemKey, String tableId)? deleteExistingItem,
    TResult? Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult? Function(String itemKey, String tableId)? syncExistingItem,
  }) {
    return incrementExistingItem?.call(itemKey, tableId);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getCategories,
    TResult Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult Function(String id)? setSelectedCategoryId,
    TResult Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult Function(GoodsModel good)? selectGood,
    TResult Function(String goodsId)? incrementQuantity,
    TResult Function(String goodsId)? decrementQuantity,
    TResult Function()? clearGoods,
    TResult Function(String text)? searchTextChanged,
    TResult Function(String billId, bool force)? fetchBillOrders,
    TResult Function(String orderId)? setActiveOrderId,
    TResult Function(String itemId, String tableId)? cancelOrderItem,
    TResult Function(String itemKey, String tableId)? incrementExistingItem,
    TResult Function(String itemKey, String tableId)? decrementExistingItem,
    TResult Function(String itemKey, String tableId)? deleteExistingItem,
    TResult Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult Function(String itemKey, String tableId)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (incrementExistingItem != null) {
      return incrementExistingItem(itemKey, tableId);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetCategories value) getCategories,
    required TResult Function(_InitSavedGoods value) initSavedGoods,
    required TResult Function(_SetSelectedCategoryId value)
        setSelectedCategoryId,
    required TResult Function(_AddFoodAdditional value) addFoodAdditional,
    required TResult Function(_SelectGood value) selectGood,
    required TResult Function(_IncrementQuantity value) incrementQuantity,
    required TResult Function(_DecrementQuantity value) decrementQuantity,
    required TResult Function(_ClearGoods value) clearGoods,
    required TResult Function(_SearchTextChanged value) searchTextChanged,
    required TResult Function(_FetchBillOrders value) fetchBillOrders,
    required TResult Function(_SetActiveOrderId value) setActiveOrderId,
    required TResult Function(_CancelOrderItem value) cancelOrderItem,
    required TResult Function(_IncrementExistingItem value)
        incrementExistingItem,
    required TResult Function(_DecrementExistingItem value)
        decrementExistingItem,
    required TResult Function(_DeleteExistingItem value) deleteExistingItem,
    required TResult Function(_SetExistingItemQuantity value)
        setExistingItemQuantity,
    required TResult Function(_SyncExistingItem value) syncExistingItem,
  }) {
    return incrementExistingItem(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetCategories value)? getCategories,
    TResult? Function(_InitSavedGoods value)? initSavedGoods,
    TResult? Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult? Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult? Function(_SelectGood value)? selectGood,
    TResult? Function(_IncrementQuantity value)? incrementQuantity,
    TResult? Function(_DecrementQuantity value)? decrementQuantity,
    TResult? Function(_ClearGoods value)? clearGoods,
    TResult? Function(_SearchTextChanged value)? searchTextChanged,
    TResult? Function(_FetchBillOrders value)? fetchBillOrders,
    TResult? Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult? Function(_CancelOrderItem value)? cancelOrderItem,
    TResult? Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult? Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult? Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult? Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult? Function(_SyncExistingItem value)? syncExistingItem,
  }) {
    return incrementExistingItem?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetCategories value)? getCategories,
    TResult Function(_InitSavedGoods value)? initSavedGoods,
    TResult Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult Function(_SelectGood value)? selectGood,
    TResult Function(_IncrementQuantity value)? incrementQuantity,
    TResult Function(_DecrementQuantity value)? decrementQuantity,
    TResult Function(_ClearGoods value)? clearGoods,
    TResult Function(_SearchTextChanged value)? searchTextChanged,
    TResult Function(_FetchBillOrders value)? fetchBillOrders,
    TResult Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult Function(_CancelOrderItem value)? cancelOrderItem,
    TResult Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult Function(_SyncExistingItem value)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (incrementExistingItem != null) {
      return incrementExistingItem(this);
    }
    return orElse();
  }
}

abstract class _IncrementExistingItem implements DetailEvent {
  const factory _IncrementExistingItem(
      {required final String itemKey,
      required final String tableId}) = _$IncrementExistingItemImpl;

  String get itemKey;
  String get tableId;
  @JsonKey(ignore: true)
  _$$IncrementExistingItemImplCopyWith<_$IncrementExistingItemImpl>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$DecrementExistingItemImplCopyWith<$Res> {
  factory _$$DecrementExistingItemImplCopyWith(
          _$DecrementExistingItemImpl value,
          $Res Function(_$DecrementExistingItemImpl) then) =
      __$$DecrementExistingItemImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String itemKey, String tableId});
}

/// @nodoc
class __$$DecrementExistingItemImplCopyWithImpl<$Res>
    extends _$DetailEventCopyWithImpl<$Res, _$DecrementExistingItemImpl>
    implements _$$DecrementExistingItemImplCopyWith<$Res> {
  __$$DecrementExistingItemImplCopyWithImpl(_$DecrementExistingItemImpl _value,
      $Res Function(_$DecrementExistingItemImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? itemKey = null,
    Object? tableId = null,
  }) {
    return _then(_$DecrementExistingItemImpl(
      itemKey: null == itemKey
          ? _value.itemKey
          : itemKey // ignore: cast_nullable_to_non_nullable
              as String,
      tableId: null == tableId
          ? _value.tableId
          : tableId // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$DecrementExistingItemImpl implements _DecrementExistingItem {
  const _$DecrementExistingItemImpl(
      {required this.itemKey, required this.tableId});

  @override
  final String itemKey;
  @override
  final String tableId;

  @override
  String toString() {
    return 'DetailEvent.decrementExistingItem(itemKey: $itemKey, tableId: $tableId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DecrementExistingItemImpl &&
            (identical(other.itemKey, itemKey) || other.itemKey == itemKey) &&
            (identical(other.tableId, tableId) || other.tableId == tableId));
  }

  @override
  int get hashCode => Object.hash(runtimeType, itemKey, tableId);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$DecrementExistingItemImplCopyWith<_$DecrementExistingItemImpl>
      get copyWith => __$$DecrementExistingItemImplCopyWithImpl<
          _$DecrementExistingItemImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getCategories,
    required TResult Function(List<OrderItem> savedGoods) initSavedGoods,
    required TResult Function(String id) setSelectedCategoryId,
    required TResult Function(List<FoodAdditionalModel> additionals,
            String orderId, String comment)
        addFoodAdditional,
    required TResult Function(GoodsModel good) selectGood,
    required TResult Function(String goodsId) incrementQuantity,
    required TResult Function(String goodsId) decrementQuantity,
    required TResult Function() clearGoods,
    required TResult Function(String text) searchTextChanged,
    required TResult Function(String billId, bool force) fetchBillOrders,
    required TResult Function(String orderId) setActiveOrderId,
    required TResult Function(String itemId, String tableId) cancelOrderItem,
    required TResult Function(String itemKey, String tableId)
        incrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        decrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        deleteExistingItem,
    required TResult Function(String itemKey, String tableId, int quantity)
        setExistingItemQuantity,
    required TResult Function(String itemKey, String tableId) syncExistingItem,
  }) {
    return decrementExistingItem(itemKey, tableId);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getCategories,
    TResult? Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult? Function(String id)? setSelectedCategoryId,
    TResult? Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult? Function(GoodsModel good)? selectGood,
    TResult? Function(String goodsId)? incrementQuantity,
    TResult? Function(String goodsId)? decrementQuantity,
    TResult? Function()? clearGoods,
    TResult? Function(String text)? searchTextChanged,
    TResult? Function(String billId, bool force)? fetchBillOrders,
    TResult? Function(String orderId)? setActiveOrderId,
    TResult? Function(String itemId, String tableId)? cancelOrderItem,
    TResult? Function(String itemKey, String tableId)? incrementExistingItem,
    TResult? Function(String itemKey, String tableId)? decrementExistingItem,
    TResult? Function(String itemKey, String tableId)? deleteExistingItem,
    TResult? Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult? Function(String itemKey, String tableId)? syncExistingItem,
  }) {
    return decrementExistingItem?.call(itemKey, tableId);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getCategories,
    TResult Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult Function(String id)? setSelectedCategoryId,
    TResult Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult Function(GoodsModel good)? selectGood,
    TResult Function(String goodsId)? incrementQuantity,
    TResult Function(String goodsId)? decrementQuantity,
    TResult Function()? clearGoods,
    TResult Function(String text)? searchTextChanged,
    TResult Function(String billId, bool force)? fetchBillOrders,
    TResult Function(String orderId)? setActiveOrderId,
    TResult Function(String itemId, String tableId)? cancelOrderItem,
    TResult Function(String itemKey, String tableId)? incrementExistingItem,
    TResult Function(String itemKey, String tableId)? decrementExistingItem,
    TResult Function(String itemKey, String tableId)? deleteExistingItem,
    TResult Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult Function(String itemKey, String tableId)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (decrementExistingItem != null) {
      return decrementExistingItem(itemKey, tableId);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetCategories value) getCategories,
    required TResult Function(_InitSavedGoods value) initSavedGoods,
    required TResult Function(_SetSelectedCategoryId value)
        setSelectedCategoryId,
    required TResult Function(_AddFoodAdditional value) addFoodAdditional,
    required TResult Function(_SelectGood value) selectGood,
    required TResult Function(_IncrementQuantity value) incrementQuantity,
    required TResult Function(_DecrementQuantity value) decrementQuantity,
    required TResult Function(_ClearGoods value) clearGoods,
    required TResult Function(_SearchTextChanged value) searchTextChanged,
    required TResult Function(_FetchBillOrders value) fetchBillOrders,
    required TResult Function(_SetActiveOrderId value) setActiveOrderId,
    required TResult Function(_CancelOrderItem value) cancelOrderItem,
    required TResult Function(_IncrementExistingItem value)
        incrementExistingItem,
    required TResult Function(_DecrementExistingItem value)
        decrementExistingItem,
    required TResult Function(_DeleteExistingItem value) deleteExistingItem,
    required TResult Function(_SetExistingItemQuantity value)
        setExistingItemQuantity,
    required TResult Function(_SyncExistingItem value) syncExistingItem,
  }) {
    return decrementExistingItem(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetCategories value)? getCategories,
    TResult? Function(_InitSavedGoods value)? initSavedGoods,
    TResult? Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult? Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult? Function(_SelectGood value)? selectGood,
    TResult? Function(_IncrementQuantity value)? incrementQuantity,
    TResult? Function(_DecrementQuantity value)? decrementQuantity,
    TResult? Function(_ClearGoods value)? clearGoods,
    TResult? Function(_SearchTextChanged value)? searchTextChanged,
    TResult? Function(_FetchBillOrders value)? fetchBillOrders,
    TResult? Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult? Function(_CancelOrderItem value)? cancelOrderItem,
    TResult? Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult? Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult? Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult? Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult? Function(_SyncExistingItem value)? syncExistingItem,
  }) {
    return decrementExistingItem?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetCategories value)? getCategories,
    TResult Function(_InitSavedGoods value)? initSavedGoods,
    TResult Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult Function(_SelectGood value)? selectGood,
    TResult Function(_IncrementQuantity value)? incrementQuantity,
    TResult Function(_DecrementQuantity value)? decrementQuantity,
    TResult Function(_ClearGoods value)? clearGoods,
    TResult Function(_SearchTextChanged value)? searchTextChanged,
    TResult Function(_FetchBillOrders value)? fetchBillOrders,
    TResult Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult Function(_CancelOrderItem value)? cancelOrderItem,
    TResult Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult Function(_SyncExistingItem value)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (decrementExistingItem != null) {
      return decrementExistingItem(this);
    }
    return orElse();
  }
}

abstract class _DecrementExistingItem implements DetailEvent {
  const factory _DecrementExistingItem(
      {required final String itemKey,
      required final String tableId}) = _$DecrementExistingItemImpl;

  String get itemKey;
  String get tableId;
  @JsonKey(ignore: true)
  _$$DecrementExistingItemImplCopyWith<_$DecrementExistingItemImpl>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$DeleteExistingItemImplCopyWith<$Res> {
  factory _$$DeleteExistingItemImplCopyWith(_$DeleteExistingItemImpl value,
          $Res Function(_$DeleteExistingItemImpl) then) =
      __$$DeleteExistingItemImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String itemKey, String tableId});
}

/// @nodoc
class __$$DeleteExistingItemImplCopyWithImpl<$Res>
    extends _$DetailEventCopyWithImpl<$Res, _$DeleteExistingItemImpl>
    implements _$$DeleteExistingItemImplCopyWith<$Res> {
  __$$DeleteExistingItemImplCopyWithImpl(_$DeleteExistingItemImpl _value,
      $Res Function(_$DeleteExistingItemImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? itemKey = null,
    Object? tableId = null,
  }) {
    return _then(_$DeleteExistingItemImpl(
      itemKey: null == itemKey
          ? _value.itemKey
          : itemKey // ignore: cast_nullable_to_non_nullable
              as String,
      tableId: null == tableId
          ? _value.tableId
          : tableId // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$DeleteExistingItemImpl implements _DeleteExistingItem {
  const _$DeleteExistingItemImpl(
      {required this.itemKey, required this.tableId});

  @override
  final String itemKey;
  @override
  final String tableId;

  @override
  String toString() {
    return 'DetailEvent.deleteExistingItem(itemKey: $itemKey, tableId: $tableId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DeleteExistingItemImpl &&
            (identical(other.itemKey, itemKey) || other.itemKey == itemKey) &&
            (identical(other.tableId, tableId) || other.tableId == tableId));
  }

  @override
  int get hashCode => Object.hash(runtimeType, itemKey, tableId);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$DeleteExistingItemImplCopyWith<_$DeleteExistingItemImpl> get copyWith =>
      __$$DeleteExistingItemImplCopyWithImpl<_$DeleteExistingItemImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getCategories,
    required TResult Function(List<OrderItem> savedGoods) initSavedGoods,
    required TResult Function(String id) setSelectedCategoryId,
    required TResult Function(List<FoodAdditionalModel> additionals,
            String orderId, String comment)
        addFoodAdditional,
    required TResult Function(GoodsModel good) selectGood,
    required TResult Function(String goodsId) incrementQuantity,
    required TResult Function(String goodsId) decrementQuantity,
    required TResult Function() clearGoods,
    required TResult Function(String text) searchTextChanged,
    required TResult Function(String billId, bool force) fetchBillOrders,
    required TResult Function(String orderId) setActiveOrderId,
    required TResult Function(String itemId, String tableId) cancelOrderItem,
    required TResult Function(String itemKey, String tableId)
        incrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        decrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        deleteExistingItem,
    required TResult Function(String itemKey, String tableId, int quantity)
        setExistingItemQuantity,
    required TResult Function(String itemKey, String tableId) syncExistingItem,
  }) {
    return deleteExistingItem(itemKey, tableId);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getCategories,
    TResult? Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult? Function(String id)? setSelectedCategoryId,
    TResult? Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult? Function(GoodsModel good)? selectGood,
    TResult? Function(String goodsId)? incrementQuantity,
    TResult? Function(String goodsId)? decrementQuantity,
    TResult? Function()? clearGoods,
    TResult? Function(String text)? searchTextChanged,
    TResult? Function(String billId, bool force)? fetchBillOrders,
    TResult? Function(String orderId)? setActiveOrderId,
    TResult? Function(String itemId, String tableId)? cancelOrderItem,
    TResult? Function(String itemKey, String tableId)? incrementExistingItem,
    TResult? Function(String itemKey, String tableId)? decrementExistingItem,
    TResult? Function(String itemKey, String tableId)? deleteExistingItem,
    TResult? Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult? Function(String itemKey, String tableId)? syncExistingItem,
  }) {
    return deleteExistingItem?.call(itemKey, tableId);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getCategories,
    TResult Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult Function(String id)? setSelectedCategoryId,
    TResult Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult Function(GoodsModel good)? selectGood,
    TResult Function(String goodsId)? incrementQuantity,
    TResult Function(String goodsId)? decrementQuantity,
    TResult Function()? clearGoods,
    TResult Function(String text)? searchTextChanged,
    TResult Function(String billId, bool force)? fetchBillOrders,
    TResult Function(String orderId)? setActiveOrderId,
    TResult Function(String itemId, String tableId)? cancelOrderItem,
    TResult Function(String itemKey, String tableId)? incrementExistingItem,
    TResult Function(String itemKey, String tableId)? decrementExistingItem,
    TResult Function(String itemKey, String tableId)? deleteExistingItem,
    TResult Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult Function(String itemKey, String tableId)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (deleteExistingItem != null) {
      return deleteExistingItem(itemKey, tableId);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetCategories value) getCategories,
    required TResult Function(_InitSavedGoods value) initSavedGoods,
    required TResult Function(_SetSelectedCategoryId value)
        setSelectedCategoryId,
    required TResult Function(_AddFoodAdditional value) addFoodAdditional,
    required TResult Function(_SelectGood value) selectGood,
    required TResult Function(_IncrementQuantity value) incrementQuantity,
    required TResult Function(_DecrementQuantity value) decrementQuantity,
    required TResult Function(_ClearGoods value) clearGoods,
    required TResult Function(_SearchTextChanged value) searchTextChanged,
    required TResult Function(_FetchBillOrders value) fetchBillOrders,
    required TResult Function(_SetActiveOrderId value) setActiveOrderId,
    required TResult Function(_CancelOrderItem value) cancelOrderItem,
    required TResult Function(_IncrementExistingItem value)
        incrementExistingItem,
    required TResult Function(_DecrementExistingItem value)
        decrementExistingItem,
    required TResult Function(_DeleteExistingItem value) deleteExistingItem,
    required TResult Function(_SetExistingItemQuantity value)
        setExistingItemQuantity,
    required TResult Function(_SyncExistingItem value) syncExistingItem,
  }) {
    return deleteExistingItem(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetCategories value)? getCategories,
    TResult? Function(_InitSavedGoods value)? initSavedGoods,
    TResult? Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult? Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult? Function(_SelectGood value)? selectGood,
    TResult? Function(_IncrementQuantity value)? incrementQuantity,
    TResult? Function(_DecrementQuantity value)? decrementQuantity,
    TResult? Function(_ClearGoods value)? clearGoods,
    TResult? Function(_SearchTextChanged value)? searchTextChanged,
    TResult? Function(_FetchBillOrders value)? fetchBillOrders,
    TResult? Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult? Function(_CancelOrderItem value)? cancelOrderItem,
    TResult? Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult? Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult? Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult? Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult? Function(_SyncExistingItem value)? syncExistingItem,
  }) {
    return deleteExistingItem?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetCategories value)? getCategories,
    TResult Function(_InitSavedGoods value)? initSavedGoods,
    TResult Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult Function(_SelectGood value)? selectGood,
    TResult Function(_IncrementQuantity value)? incrementQuantity,
    TResult Function(_DecrementQuantity value)? decrementQuantity,
    TResult Function(_ClearGoods value)? clearGoods,
    TResult Function(_SearchTextChanged value)? searchTextChanged,
    TResult Function(_FetchBillOrders value)? fetchBillOrders,
    TResult Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult Function(_CancelOrderItem value)? cancelOrderItem,
    TResult Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult Function(_SyncExistingItem value)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (deleteExistingItem != null) {
      return deleteExistingItem(this);
    }
    return orElse();
  }
}

abstract class _DeleteExistingItem implements DetailEvent {
  const factory _DeleteExistingItem(
      {required final String itemKey,
      required final String tableId}) = _$DeleteExistingItemImpl;

  String get itemKey;
  String get tableId;
  @JsonKey(ignore: true)
  _$$DeleteExistingItemImplCopyWith<_$DeleteExistingItemImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$SetExistingItemQuantityImplCopyWith<$Res> {
  factory _$$SetExistingItemQuantityImplCopyWith(
          _$SetExistingItemQuantityImpl value,
          $Res Function(_$SetExistingItemQuantityImpl) then) =
      __$$SetExistingItemQuantityImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String itemKey, String tableId, int quantity});
}

/// @nodoc
class __$$SetExistingItemQuantityImplCopyWithImpl<$Res>
    extends _$DetailEventCopyWithImpl<$Res, _$SetExistingItemQuantityImpl>
    implements _$$SetExistingItemQuantityImplCopyWith<$Res> {
  __$$SetExistingItemQuantityImplCopyWithImpl(
      _$SetExistingItemQuantityImpl _value,
      $Res Function(_$SetExistingItemQuantityImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? itemKey = null,
    Object? tableId = null,
    Object? quantity = null,
  }) {
    return _then(_$SetExistingItemQuantityImpl(
      itemKey: null == itemKey
          ? _value.itemKey
          : itemKey // ignore: cast_nullable_to_non_nullable
              as String,
      tableId: null == tableId
          ? _value.tableId
          : tableId // ignore: cast_nullable_to_non_nullable
              as String,
      quantity: null == quantity
          ? _value.quantity
          : quantity // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc

class _$SetExistingItemQuantityImpl implements _SetExistingItemQuantity {
  const _$SetExistingItemQuantityImpl(
      {required this.itemKey, required this.tableId, required this.quantity});

  @override
  final String itemKey;
  @override
  final String tableId;
  @override
  final int quantity;

  @override
  String toString() {
    return 'DetailEvent.setExistingItemQuantity(itemKey: $itemKey, tableId: $tableId, quantity: $quantity)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SetExistingItemQuantityImpl &&
            (identical(other.itemKey, itemKey) || other.itemKey == itemKey) &&
            (identical(other.tableId, tableId) || other.tableId == tableId) &&
            (identical(other.quantity, quantity) ||
                other.quantity == quantity));
  }

  @override
  int get hashCode => Object.hash(runtimeType, itemKey, tableId, quantity);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$SetExistingItemQuantityImplCopyWith<_$SetExistingItemQuantityImpl>
      get copyWith => __$$SetExistingItemQuantityImplCopyWithImpl<
          _$SetExistingItemQuantityImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getCategories,
    required TResult Function(List<OrderItem> savedGoods) initSavedGoods,
    required TResult Function(String id) setSelectedCategoryId,
    required TResult Function(List<FoodAdditionalModel> additionals,
            String orderId, String comment)
        addFoodAdditional,
    required TResult Function(GoodsModel good) selectGood,
    required TResult Function(String goodsId) incrementQuantity,
    required TResult Function(String goodsId) decrementQuantity,
    required TResult Function() clearGoods,
    required TResult Function(String text) searchTextChanged,
    required TResult Function(String billId, bool force) fetchBillOrders,
    required TResult Function(String orderId) setActiveOrderId,
    required TResult Function(String itemId, String tableId) cancelOrderItem,
    required TResult Function(String itemKey, String tableId)
        incrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        decrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        deleteExistingItem,
    required TResult Function(String itemKey, String tableId, int quantity)
        setExistingItemQuantity,
    required TResult Function(String itemKey, String tableId) syncExistingItem,
  }) {
    return setExistingItemQuantity(itemKey, tableId, quantity);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getCategories,
    TResult? Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult? Function(String id)? setSelectedCategoryId,
    TResult? Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult? Function(GoodsModel good)? selectGood,
    TResult? Function(String goodsId)? incrementQuantity,
    TResult? Function(String goodsId)? decrementQuantity,
    TResult? Function()? clearGoods,
    TResult? Function(String text)? searchTextChanged,
    TResult? Function(String billId, bool force)? fetchBillOrders,
    TResult? Function(String orderId)? setActiveOrderId,
    TResult? Function(String itemId, String tableId)? cancelOrderItem,
    TResult? Function(String itemKey, String tableId)? incrementExistingItem,
    TResult? Function(String itemKey, String tableId)? decrementExistingItem,
    TResult? Function(String itemKey, String tableId)? deleteExistingItem,
    TResult? Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult? Function(String itemKey, String tableId)? syncExistingItem,
  }) {
    return setExistingItemQuantity?.call(itemKey, tableId, quantity);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getCategories,
    TResult Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult Function(String id)? setSelectedCategoryId,
    TResult Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult Function(GoodsModel good)? selectGood,
    TResult Function(String goodsId)? incrementQuantity,
    TResult Function(String goodsId)? decrementQuantity,
    TResult Function()? clearGoods,
    TResult Function(String text)? searchTextChanged,
    TResult Function(String billId, bool force)? fetchBillOrders,
    TResult Function(String orderId)? setActiveOrderId,
    TResult Function(String itemId, String tableId)? cancelOrderItem,
    TResult Function(String itemKey, String tableId)? incrementExistingItem,
    TResult Function(String itemKey, String tableId)? decrementExistingItem,
    TResult Function(String itemKey, String tableId)? deleteExistingItem,
    TResult Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult Function(String itemKey, String tableId)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (setExistingItemQuantity != null) {
      return setExistingItemQuantity(itemKey, tableId, quantity);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetCategories value) getCategories,
    required TResult Function(_InitSavedGoods value) initSavedGoods,
    required TResult Function(_SetSelectedCategoryId value)
        setSelectedCategoryId,
    required TResult Function(_AddFoodAdditional value) addFoodAdditional,
    required TResult Function(_SelectGood value) selectGood,
    required TResult Function(_IncrementQuantity value) incrementQuantity,
    required TResult Function(_DecrementQuantity value) decrementQuantity,
    required TResult Function(_ClearGoods value) clearGoods,
    required TResult Function(_SearchTextChanged value) searchTextChanged,
    required TResult Function(_FetchBillOrders value) fetchBillOrders,
    required TResult Function(_SetActiveOrderId value) setActiveOrderId,
    required TResult Function(_CancelOrderItem value) cancelOrderItem,
    required TResult Function(_IncrementExistingItem value)
        incrementExistingItem,
    required TResult Function(_DecrementExistingItem value)
        decrementExistingItem,
    required TResult Function(_DeleteExistingItem value) deleteExistingItem,
    required TResult Function(_SetExistingItemQuantity value)
        setExistingItemQuantity,
    required TResult Function(_SyncExistingItem value) syncExistingItem,
  }) {
    return setExistingItemQuantity(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetCategories value)? getCategories,
    TResult? Function(_InitSavedGoods value)? initSavedGoods,
    TResult? Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult? Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult? Function(_SelectGood value)? selectGood,
    TResult? Function(_IncrementQuantity value)? incrementQuantity,
    TResult? Function(_DecrementQuantity value)? decrementQuantity,
    TResult? Function(_ClearGoods value)? clearGoods,
    TResult? Function(_SearchTextChanged value)? searchTextChanged,
    TResult? Function(_FetchBillOrders value)? fetchBillOrders,
    TResult? Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult? Function(_CancelOrderItem value)? cancelOrderItem,
    TResult? Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult? Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult? Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult? Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult? Function(_SyncExistingItem value)? syncExistingItem,
  }) {
    return setExistingItemQuantity?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetCategories value)? getCategories,
    TResult Function(_InitSavedGoods value)? initSavedGoods,
    TResult Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult Function(_SelectGood value)? selectGood,
    TResult Function(_IncrementQuantity value)? incrementQuantity,
    TResult Function(_DecrementQuantity value)? decrementQuantity,
    TResult Function(_ClearGoods value)? clearGoods,
    TResult Function(_SearchTextChanged value)? searchTextChanged,
    TResult Function(_FetchBillOrders value)? fetchBillOrders,
    TResult Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult Function(_CancelOrderItem value)? cancelOrderItem,
    TResult Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult Function(_SyncExistingItem value)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (setExistingItemQuantity != null) {
      return setExistingItemQuantity(this);
    }
    return orElse();
  }
}

abstract class _SetExistingItemQuantity implements DetailEvent {
  const factory _SetExistingItemQuantity(
      {required final String itemKey,
      required final String tableId,
      required final int quantity}) = _$SetExistingItemQuantityImpl;

  String get itemKey;
  String get tableId;
  int get quantity;
  @JsonKey(ignore: true)
  _$$SetExistingItemQuantityImplCopyWith<_$SetExistingItemQuantityImpl>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$SyncExistingItemImplCopyWith<$Res> {
  factory _$$SyncExistingItemImplCopyWith(_$SyncExistingItemImpl value,
          $Res Function(_$SyncExistingItemImpl) then) =
      __$$SyncExistingItemImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String itemKey, String tableId});
}

/// @nodoc
class __$$SyncExistingItemImplCopyWithImpl<$Res>
    extends _$DetailEventCopyWithImpl<$Res, _$SyncExistingItemImpl>
    implements _$$SyncExistingItemImplCopyWith<$Res> {
  __$$SyncExistingItemImplCopyWithImpl(_$SyncExistingItemImpl _value,
      $Res Function(_$SyncExistingItemImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? itemKey = null,
    Object? tableId = null,
  }) {
    return _then(_$SyncExistingItemImpl(
      itemKey: null == itemKey
          ? _value.itemKey
          : itemKey // ignore: cast_nullable_to_non_nullable
              as String,
      tableId: null == tableId
          ? _value.tableId
          : tableId // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$SyncExistingItemImpl implements _SyncExistingItem {
  const _$SyncExistingItemImpl({required this.itemKey, required this.tableId});

  @override
  final String itemKey;
  @override
  final String tableId;

  @override
  String toString() {
    return 'DetailEvent.syncExistingItem(itemKey: $itemKey, tableId: $tableId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SyncExistingItemImpl &&
            (identical(other.itemKey, itemKey) || other.itemKey == itemKey) &&
            (identical(other.tableId, tableId) || other.tableId == tableId));
  }

  @override
  int get hashCode => Object.hash(runtimeType, itemKey, tableId);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$SyncExistingItemImplCopyWith<_$SyncExistingItemImpl> get copyWith =>
      __$$SyncExistingItemImplCopyWithImpl<_$SyncExistingItemImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getCategories,
    required TResult Function(List<OrderItem> savedGoods) initSavedGoods,
    required TResult Function(String id) setSelectedCategoryId,
    required TResult Function(List<FoodAdditionalModel> additionals,
            String orderId, String comment)
        addFoodAdditional,
    required TResult Function(GoodsModel good) selectGood,
    required TResult Function(String goodsId) incrementQuantity,
    required TResult Function(String goodsId) decrementQuantity,
    required TResult Function() clearGoods,
    required TResult Function(String text) searchTextChanged,
    required TResult Function(String billId, bool force) fetchBillOrders,
    required TResult Function(String orderId) setActiveOrderId,
    required TResult Function(String itemId, String tableId) cancelOrderItem,
    required TResult Function(String itemKey, String tableId)
        incrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        decrementExistingItem,
    required TResult Function(String itemKey, String tableId)
        deleteExistingItem,
    required TResult Function(String itemKey, String tableId, int quantity)
        setExistingItemQuantity,
    required TResult Function(String itemKey, String tableId) syncExistingItem,
  }) {
    return syncExistingItem(itemKey, tableId);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getCategories,
    TResult? Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult? Function(String id)? setSelectedCategoryId,
    TResult? Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult? Function(GoodsModel good)? selectGood,
    TResult? Function(String goodsId)? incrementQuantity,
    TResult? Function(String goodsId)? decrementQuantity,
    TResult? Function()? clearGoods,
    TResult? Function(String text)? searchTextChanged,
    TResult? Function(String billId, bool force)? fetchBillOrders,
    TResult? Function(String orderId)? setActiveOrderId,
    TResult? Function(String itemId, String tableId)? cancelOrderItem,
    TResult? Function(String itemKey, String tableId)? incrementExistingItem,
    TResult? Function(String itemKey, String tableId)? decrementExistingItem,
    TResult? Function(String itemKey, String tableId)? deleteExistingItem,
    TResult? Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult? Function(String itemKey, String tableId)? syncExistingItem,
  }) {
    return syncExistingItem?.call(itemKey, tableId);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getCategories,
    TResult Function(List<OrderItem> savedGoods)? initSavedGoods,
    TResult Function(String id)? setSelectedCategoryId,
    TResult Function(List<FoodAdditionalModel> additionals, String orderId,
            String comment)?
        addFoodAdditional,
    TResult Function(GoodsModel good)? selectGood,
    TResult Function(String goodsId)? incrementQuantity,
    TResult Function(String goodsId)? decrementQuantity,
    TResult Function()? clearGoods,
    TResult Function(String text)? searchTextChanged,
    TResult Function(String billId, bool force)? fetchBillOrders,
    TResult Function(String orderId)? setActiveOrderId,
    TResult Function(String itemId, String tableId)? cancelOrderItem,
    TResult Function(String itemKey, String tableId)? incrementExistingItem,
    TResult Function(String itemKey, String tableId)? decrementExistingItem,
    TResult Function(String itemKey, String tableId)? deleteExistingItem,
    TResult Function(String itemKey, String tableId, int quantity)?
        setExistingItemQuantity,
    TResult Function(String itemKey, String tableId)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (syncExistingItem != null) {
      return syncExistingItem(itemKey, tableId);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetCategories value) getCategories,
    required TResult Function(_InitSavedGoods value) initSavedGoods,
    required TResult Function(_SetSelectedCategoryId value)
        setSelectedCategoryId,
    required TResult Function(_AddFoodAdditional value) addFoodAdditional,
    required TResult Function(_SelectGood value) selectGood,
    required TResult Function(_IncrementQuantity value) incrementQuantity,
    required TResult Function(_DecrementQuantity value) decrementQuantity,
    required TResult Function(_ClearGoods value) clearGoods,
    required TResult Function(_SearchTextChanged value) searchTextChanged,
    required TResult Function(_FetchBillOrders value) fetchBillOrders,
    required TResult Function(_SetActiveOrderId value) setActiveOrderId,
    required TResult Function(_CancelOrderItem value) cancelOrderItem,
    required TResult Function(_IncrementExistingItem value)
        incrementExistingItem,
    required TResult Function(_DecrementExistingItem value)
        decrementExistingItem,
    required TResult Function(_DeleteExistingItem value) deleteExistingItem,
    required TResult Function(_SetExistingItemQuantity value)
        setExistingItemQuantity,
    required TResult Function(_SyncExistingItem value) syncExistingItem,
  }) {
    return syncExistingItem(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetCategories value)? getCategories,
    TResult? Function(_InitSavedGoods value)? initSavedGoods,
    TResult? Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult? Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult? Function(_SelectGood value)? selectGood,
    TResult? Function(_IncrementQuantity value)? incrementQuantity,
    TResult? Function(_DecrementQuantity value)? decrementQuantity,
    TResult? Function(_ClearGoods value)? clearGoods,
    TResult? Function(_SearchTextChanged value)? searchTextChanged,
    TResult? Function(_FetchBillOrders value)? fetchBillOrders,
    TResult? Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult? Function(_CancelOrderItem value)? cancelOrderItem,
    TResult? Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult? Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult? Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult? Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult? Function(_SyncExistingItem value)? syncExistingItem,
  }) {
    return syncExistingItem?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetCategories value)? getCategories,
    TResult Function(_InitSavedGoods value)? initSavedGoods,
    TResult Function(_SetSelectedCategoryId value)? setSelectedCategoryId,
    TResult Function(_AddFoodAdditional value)? addFoodAdditional,
    TResult Function(_SelectGood value)? selectGood,
    TResult Function(_IncrementQuantity value)? incrementQuantity,
    TResult Function(_DecrementQuantity value)? decrementQuantity,
    TResult Function(_ClearGoods value)? clearGoods,
    TResult Function(_SearchTextChanged value)? searchTextChanged,
    TResult Function(_FetchBillOrders value)? fetchBillOrders,
    TResult Function(_SetActiveOrderId value)? setActiveOrderId,
    TResult Function(_CancelOrderItem value)? cancelOrderItem,
    TResult Function(_IncrementExistingItem value)? incrementExistingItem,
    TResult Function(_DecrementExistingItem value)? decrementExistingItem,
    TResult Function(_DeleteExistingItem value)? deleteExistingItem,
    TResult Function(_SetExistingItemQuantity value)? setExistingItemQuantity,
    TResult Function(_SyncExistingItem value)? syncExistingItem,
    required TResult orElse(),
  }) {
    if (syncExistingItem != null) {
      return syncExistingItem(this);
    }
    return orElse();
  }
}

abstract class _SyncExistingItem implements DetailEvent {
  const factory _SyncExistingItem(
      {required final String itemKey,
      required final String tableId}) = _$SyncExistingItemImpl;

  String get itemKey;
  String get tableId;
  @JsonKey(ignore: true)
  _$$SyncExistingItemImplCopyWith<_$SyncExistingItemImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
mixin _$OrderItem {
  String get uniqueId => throw _privateConstructorUsedError;
  GoodsModel get goods => throw _privateConstructorUsedError;
  int get quantity =>
      throw _privateConstructorUsedError; // `commet` aslida status'ni saqlaydi: 'pending', 'cancelled',
// 'pending_offline'. Tarixiy nomlanish, refaktor qilmaymiz.
  String get commet =>
      throw _privateConstructorUsedError; // Foydalanuvchi yozgan taom izohi (mas. "achchiqsiz"). Backend'ga
// `comment` sifatida yuboriladi va chekka chiqariladi.
  String get comment =>
      throw _privateConstructorUsedError; // Item qachon buyurtmaga qo'shilgan (server `created_at` yoki
// offline queue `createdAt`). UI HH:mm formatida ko'rsatadi.
  DateTime? get createdAt => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $OrderItemCopyWith<OrderItem> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $OrderItemCopyWith<$Res> {
  factory $OrderItemCopyWith(OrderItem value, $Res Function(OrderItem) then) =
      _$OrderItemCopyWithImpl<$Res, OrderItem>;
  @useResult
  $Res call(
      {String uniqueId,
      GoodsModel goods,
      int quantity,
      String commet,
      String comment,
      DateTime? createdAt});

  $GoodsModelCopyWith<$Res> get goods;
}

/// @nodoc
class _$OrderItemCopyWithImpl<$Res, $Val extends OrderItem>
    implements $OrderItemCopyWith<$Res> {
  _$OrderItemCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? uniqueId = null,
    Object? goods = null,
    Object? quantity = null,
    Object? commet = null,
    Object? comment = null,
    Object? createdAt = freezed,
  }) {
    return _then(_value.copyWith(
      uniqueId: null == uniqueId
          ? _value.uniqueId
          : uniqueId // ignore: cast_nullable_to_non_nullable
              as String,
      goods: null == goods
          ? _value.goods
          : goods // ignore: cast_nullable_to_non_nullable
              as GoodsModel,
      quantity: null == quantity
          ? _value.quantity
          : quantity // ignore: cast_nullable_to_non_nullable
              as int,
      commet: null == commet
          ? _value.commet
          : commet // ignore: cast_nullable_to_non_nullable
              as String,
      comment: null == comment
          ? _value.comment
          : comment // ignore: cast_nullable_to_non_nullable
              as String,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }

  @override
  @pragma('vm:prefer-inline')
  $GoodsModelCopyWith<$Res> get goods {
    return $GoodsModelCopyWith<$Res>(_value.goods, (value) {
      return _then(_value.copyWith(goods: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$OrderItemImplCopyWith<$Res>
    implements $OrderItemCopyWith<$Res> {
  factory _$$OrderItemImplCopyWith(
          _$OrderItemImpl value, $Res Function(_$OrderItemImpl) then) =
      __$$OrderItemImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String uniqueId,
      GoodsModel goods,
      int quantity,
      String commet,
      String comment,
      DateTime? createdAt});

  @override
  $GoodsModelCopyWith<$Res> get goods;
}

/// @nodoc
class __$$OrderItemImplCopyWithImpl<$Res>
    extends _$OrderItemCopyWithImpl<$Res, _$OrderItemImpl>
    implements _$$OrderItemImplCopyWith<$Res> {
  __$$OrderItemImplCopyWithImpl(
      _$OrderItemImpl _value, $Res Function(_$OrderItemImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? uniqueId = null,
    Object? goods = null,
    Object? quantity = null,
    Object? commet = null,
    Object? comment = null,
    Object? createdAt = freezed,
  }) {
    return _then(_$OrderItemImpl(
      uniqueId: null == uniqueId
          ? _value.uniqueId
          : uniqueId // ignore: cast_nullable_to_non_nullable
              as String,
      goods: null == goods
          ? _value.goods
          : goods // ignore: cast_nullable_to_non_nullable
              as GoodsModel,
      quantity: null == quantity
          ? _value.quantity
          : quantity // ignore: cast_nullable_to_non_nullable
              as int,
      commet: null == commet
          ? _value.commet
          : commet // ignore: cast_nullable_to_non_nullable
              as String,
      comment: null == comment
          ? _value.comment
          : comment // ignore: cast_nullable_to_non_nullable
              as String,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc

class _$OrderItemImpl implements _OrderItem {
  const _$OrderItemImpl(
      {this.uniqueId = '',
      required this.goods,
      this.quantity = 1,
      this.commet = '',
      this.comment = '',
      this.createdAt});

  @override
  @JsonKey()
  final String uniqueId;
  @override
  final GoodsModel goods;
  @override
  @JsonKey()
  final int quantity;
// `commet` aslida status'ni saqlaydi: 'pending', 'cancelled',
// 'pending_offline'. Tarixiy nomlanish, refaktor qilmaymiz.
  @override
  @JsonKey()
  final String commet;
// Foydalanuvchi yozgan taom izohi (mas. "achchiqsiz"). Backend'ga
// `comment` sifatida yuboriladi va chekka chiqariladi.
  @override
  @JsonKey()
  final String comment;
// Item qachon buyurtmaga qo'shilgan (server `created_at` yoki
// offline queue `createdAt`). UI HH:mm formatida ko'rsatadi.
  @override
  final DateTime? createdAt;

  @override
  String toString() {
    return 'OrderItem(uniqueId: $uniqueId, goods: $goods, quantity: $quantity, commet: $commet, comment: $comment, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$OrderItemImpl &&
            (identical(other.uniqueId, uniqueId) ||
                other.uniqueId == uniqueId) &&
            (identical(other.goods, goods) || other.goods == goods) &&
            (identical(other.quantity, quantity) ||
                other.quantity == quantity) &&
            (identical(other.commet, commet) || other.commet == commet) &&
            (identical(other.comment, comment) || other.comment == comment) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType, uniqueId, goods, quantity, commet, comment, createdAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$OrderItemImplCopyWith<_$OrderItemImpl> get copyWith =>
      __$$OrderItemImplCopyWithImpl<_$OrderItemImpl>(this, _$identity);
}

abstract class _OrderItem implements OrderItem {
  const factory _OrderItem(
      {final String uniqueId,
      required final GoodsModel goods,
      final int quantity,
      final String commet,
      final String comment,
      final DateTime? createdAt}) = _$OrderItemImpl;

  @override
  String get uniqueId;
  @override
  GoodsModel get goods;
  @override
  int get quantity;
  @override // `commet` aslida status'ni saqlaydi: 'pending', 'cancelled',
// 'pending_offline'. Tarixiy nomlanish, refaktor qilmaymiz.
  String get commet;
  @override // Foydalanuvchi yozgan taom izohi (mas. "achchiqsiz"). Backend'ga
// `comment` sifatida yuboriladi va chekka chiqariladi.
  String get comment;
  @override // Item qachon buyurtmaga qo'shilgan (server `created_at` yoki
// offline queue `createdAt`). UI HH:mm formatida ko'rsatadi.
  DateTime? get createdAt;
  @override
  @JsonKey(ignore: true)
  _$$OrderItemImplCopyWith<_$OrderItemImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
mixin _$DetailState {
  Status get status => throw _privateConstructorUsedError;
  Failure get failure => throw _privateConstructorUsedError;
  TextEditingController? get textController =>
      throw _privateConstructorUsedError;
  List<CategoryModel>? get categories => throw _privateConstructorUsedError;
  List<GoodsModel>? get goods => throw _privateConstructorUsedError;
  String? get selectedCategoryId => throw _privateConstructorUsedError;
  List<OrderItem> get selectedGoods => throw _privateConstructorUsedError;
  List<OrderItem> get existingGoods => throw _privateConstructorUsedError;
  String? get activeOrderId =>
      throw _privateConstructorUsedError; // Hozir backend bilan sinxron qilinayotgan mavjud itemlarning nomlari.
// `goods.name` bo'yicha kalitlangan (refetch dan keyin uniqueId o'zgaradi,
// lekin name saqlanadi). UI shu set ichidagi itemlarda +/-/X ni disable
// qiladi.
  Set<String> get existingSyncingNames => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $DetailStateCopyWith<DetailState> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $DetailStateCopyWith<$Res> {
  factory $DetailStateCopyWith(
          DetailState value, $Res Function(DetailState) then) =
      _$DetailStateCopyWithImpl<$Res, DetailState>;
  @useResult
  $Res call(
      {Status status,
      Failure failure,
      TextEditingController? textController,
      List<CategoryModel>? categories,
      List<GoodsModel>? goods,
      String? selectedCategoryId,
      List<OrderItem> selectedGoods,
      List<OrderItem> existingGoods,
      String? activeOrderId,
      Set<String> existingSyncingNames});
}

/// @nodoc
class _$DetailStateCopyWithImpl<$Res, $Val extends DetailState>
    implements $DetailStateCopyWith<$Res> {
  _$DetailStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = null,
    Object? failure = null,
    Object? textController = freezed,
    Object? categories = freezed,
    Object? goods = freezed,
    Object? selectedCategoryId = freezed,
    Object? selectedGoods = null,
    Object? existingGoods = null,
    Object? activeOrderId = freezed,
    Object? existingSyncingNames = null,
  }) {
    return _then(_value.copyWith(
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as Status,
      failure: null == failure
          ? _value.failure
          : failure // ignore: cast_nullable_to_non_nullable
              as Failure,
      textController: freezed == textController
          ? _value.textController
          : textController // ignore: cast_nullable_to_non_nullable
              as TextEditingController?,
      categories: freezed == categories
          ? _value.categories
          : categories // ignore: cast_nullable_to_non_nullable
              as List<CategoryModel>?,
      goods: freezed == goods
          ? _value.goods
          : goods // ignore: cast_nullable_to_non_nullable
              as List<GoodsModel>?,
      selectedCategoryId: freezed == selectedCategoryId
          ? _value.selectedCategoryId
          : selectedCategoryId // ignore: cast_nullable_to_non_nullable
              as String?,
      selectedGoods: null == selectedGoods
          ? _value.selectedGoods
          : selectedGoods // ignore: cast_nullable_to_non_nullable
              as List<OrderItem>,
      existingGoods: null == existingGoods
          ? _value.existingGoods
          : existingGoods // ignore: cast_nullable_to_non_nullable
              as List<OrderItem>,
      activeOrderId: freezed == activeOrderId
          ? _value.activeOrderId
          : activeOrderId // ignore: cast_nullable_to_non_nullable
              as String?,
      existingSyncingNames: null == existingSyncingNames
          ? _value.existingSyncingNames
          : existingSyncingNames // ignore: cast_nullable_to_non_nullable
              as Set<String>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$DetailStateImplCopyWith<$Res>
    implements $DetailStateCopyWith<$Res> {
  factory _$$DetailStateImplCopyWith(
          _$DetailStateImpl value, $Res Function(_$DetailStateImpl) then) =
      __$$DetailStateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {Status status,
      Failure failure,
      TextEditingController? textController,
      List<CategoryModel>? categories,
      List<GoodsModel>? goods,
      String? selectedCategoryId,
      List<OrderItem> selectedGoods,
      List<OrderItem> existingGoods,
      String? activeOrderId,
      Set<String> existingSyncingNames});
}

/// @nodoc
class __$$DetailStateImplCopyWithImpl<$Res>
    extends _$DetailStateCopyWithImpl<$Res, _$DetailStateImpl>
    implements _$$DetailStateImplCopyWith<$Res> {
  __$$DetailStateImplCopyWithImpl(
      _$DetailStateImpl _value, $Res Function(_$DetailStateImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = null,
    Object? failure = null,
    Object? textController = freezed,
    Object? categories = freezed,
    Object? goods = freezed,
    Object? selectedCategoryId = freezed,
    Object? selectedGoods = null,
    Object? existingGoods = null,
    Object? activeOrderId = freezed,
    Object? existingSyncingNames = null,
  }) {
    return _then(_$DetailStateImpl(
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as Status,
      failure: null == failure
          ? _value.failure
          : failure // ignore: cast_nullable_to_non_nullable
              as Failure,
      textController: freezed == textController
          ? _value.textController
          : textController // ignore: cast_nullable_to_non_nullable
              as TextEditingController?,
      categories: freezed == categories
          ? _value._categories
          : categories // ignore: cast_nullable_to_non_nullable
              as List<CategoryModel>?,
      goods: freezed == goods
          ? _value._goods
          : goods // ignore: cast_nullable_to_non_nullable
              as List<GoodsModel>?,
      selectedCategoryId: freezed == selectedCategoryId
          ? _value.selectedCategoryId
          : selectedCategoryId // ignore: cast_nullable_to_non_nullable
              as String?,
      selectedGoods: null == selectedGoods
          ? _value._selectedGoods
          : selectedGoods // ignore: cast_nullable_to_non_nullable
              as List<OrderItem>,
      existingGoods: null == existingGoods
          ? _value._existingGoods
          : existingGoods // ignore: cast_nullable_to_non_nullable
              as List<OrderItem>,
      activeOrderId: freezed == activeOrderId
          ? _value.activeOrderId
          : activeOrderId // ignore: cast_nullable_to_non_nullable
              as String?,
      existingSyncingNames: null == existingSyncingNames
          ? _value._existingSyncingNames
          : existingSyncingNames // ignore: cast_nullable_to_non_nullable
              as Set<String>,
    ));
  }
}

/// @nodoc

class _$DetailStateImpl implements _DetailState {
  const _$DetailStateImpl(
      {this.status = Status.UNKNOWN,
      this.failure = const UnknownFailure(),
      this.textController,
      final List<CategoryModel>? categories,
      final List<GoodsModel>? goods,
      this.selectedCategoryId,
      final List<OrderItem> selectedGoods = const [],
      final List<OrderItem> existingGoods = const [],
      this.activeOrderId,
      final Set<String> existingSyncingNames = const <String>{}})
      : _categories = categories,
        _goods = goods,
        _selectedGoods = selectedGoods,
        _existingGoods = existingGoods,
        _existingSyncingNames = existingSyncingNames;

  @override
  @JsonKey()
  final Status status;
  @override
  @JsonKey()
  final Failure failure;
  @override
  final TextEditingController? textController;
  final List<CategoryModel>? _categories;
  @override
  List<CategoryModel>? get categories {
    final value = _categories;
    if (value == null) return null;
    if (_categories is EqualUnmodifiableListView) return _categories;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  final List<GoodsModel>? _goods;
  @override
  List<GoodsModel>? get goods {
    final value = _goods;
    if (value == null) return null;
    if (_goods is EqualUnmodifiableListView) return _goods;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  @override
  final String? selectedCategoryId;
  final List<OrderItem> _selectedGoods;
  @override
  @JsonKey()
  List<OrderItem> get selectedGoods {
    if (_selectedGoods is EqualUnmodifiableListView) return _selectedGoods;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_selectedGoods);
  }

  final List<OrderItem> _existingGoods;
  @override
  @JsonKey()
  List<OrderItem> get existingGoods {
    if (_existingGoods is EqualUnmodifiableListView) return _existingGoods;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_existingGoods);
  }

  @override
  final String? activeOrderId;
// Hozir backend bilan sinxron qilinayotgan mavjud itemlarning nomlari.
// `goods.name` bo'yicha kalitlangan (refetch dan keyin uniqueId o'zgaradi,
// lekin name saqlanadi). UI shu set ichidagi itemlarda +/-/X ni disable
// qiladi.
  final Set<String> _existingSyncingNames;
// Hozir backend bilan sinxron qilinayotgan mavjud itemlarning nomlari.
// `goods.name` bo'yicha kalitlangan (refetch dan keyin uniqueId o'zgaradi,
// lekin name saqlanadi). UI shu set ichidagi itemlarda +/-/X ni disable
// qiladi.
  @override
  @JsonKey()
  Set<String> get existingSyncingNames {
    if (_existingSyncingNames is EqualUnmodifiableSetView)
      return _existingSyncingNames;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableSetView(_existingSyncingNames);
  }

  @override
  String toString() {
    return 'DetailState(status: $status, failure: $failure, textController: $textController, categories: $categories, goods: $goods, selectedCategoryId: $selectedCategoryId, selectedGoods: $selectedGoods, existingGoods: $existingGoods, activeOrderId: $activeOrderId, existingSyncingNames: $existingSyncingNames)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DetailStateImpl &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.failure, failure) || other.failure == failure) &&
            (identical(other.textController, textController) ||
                other.textController == textController) &&
            const DeepCollectionEquality()
                .equals(other._categories, _categories) &&
            const DeepCollectionEquality().equals(other._goods, _goods) &&
            (identical(other.selectedCategoryId, selectedCategoryId) ||
                other.selectedCategoryId == selectedCategoryId) &&
            const DeepCollectionEquality()
                .equals(other._selectedGoods, _selectedGoods) &&
            const DeepCollectionEquality()
                .equals(other._existingGoods, _existingGoods) &&
            (identical(other.activeOrderId, activeOrderId) ||
                other.activeOrderId == activeOrderId) &&
            const DeepCollectionEquality()
                .equals(other._existingSyncingNames, _existingSyncingNames));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      status,
      failure,
      textController,
      const DeepCollectionEquality().hash(_categories),
      const DeepCollectionEquality().hash(_goods),
      selectedCategoryId,
      const DeepCollectionEquality().hash(_selectedGoods),
      const DeepCollectionEquality().hash(_existingGoods),
      activeOrderId,
      const DeepCollectionEquality().hash(_existingSyncingNames));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$DetailStateImplCopyWith<_$DetailStateImpl> get copyWith =>
      __$$DetailStateImplCopyWithImpl<_$DetailStateImpl>(this, _$identity);
}

abstract class _DetailState implements DetailState {
  const factory _DetailState(
      {final Status status,
      final Failure failure,
      final TextEditingController? textController,
      final List<CategoryModel>? categories,
      final List<GoodsModel>? goods,
      final String? selectedCategoryId,
      final List<OrderItem> selectedGoods,
      final List<OrderItem> existingGoods,
      final String? activeOrderId,
      final Set<String> existingSyncingNames}) = _$DetailStateImpl;

  @override
  Status get status;
  @override
  Failure get failure;
  @override
  TextEditingController? get textController;
  @override
  List<CategoryModel>? get categories;
  @override
  List<GoodsModel>? get goods;
  @override
  String? get selectedCategoryId;
  @override
  List<OrderItem> get selectedGoods;
  @override
  List<OrderItem> get existingGoods;
  @override
  String? get activeOrderId;
  @override // Hozir backend bilan sinxron qilinayotgan mavjud itemlarning nomlari.
// `goods.name` bo'yicha kalitlangan (refetch dan keyin uniqueId o'zgaradi,
// lekin name saqlanadi). UI shu set ichidagi itemlarda +/-/X ni disable
// qiladi.
  Set<String> get existingSyncingNames;
  @override
  @JsonKey(ignore: true)
  _$$DetailStateImplCopyWith<_$DetailStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
