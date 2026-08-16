// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'orders_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$SavedOrdersEvent {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function(SaveOrderEntity order) addNewOrder,
    required TResult Function(String tableId) removeOrder,
    required TResult Function() clear,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function(SaveOrderEntity order)? addNewOrder,
    TResult? Function(String tableId)? removeOrder,
    TResult? Function()? clear,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function(SaveOrderEntity order)? addNewOrder,
    TResult Function(String tableId)? removeOrder,
    TResult Function()? clear,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_AddNewOrder value) addNewOrder,
    required TResult Function(_RemoveOrder value) removeOrder,
    required TResult Function(_Clear value) clear,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_AddNewOrder value)? addNewOrder,
    TResult? Function(_RemoveOrder value)? removeOrder,
    TResult? Function(_Clear value)? clear,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_AddNewOrder value)? addNewOrder,
    TResult Function(_RemoveOrder value)? removeOrder,
    TResult Function(_Clear value)? clear,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SavedOrdersEventCopyWith<$Res> {
  factory $SavedOrdersEventCopyWith(
          SavedOrdersEvent value, $Res Function(SavedOrdersEvent) then) =
      _$SavedOrdersEventCopyWithImpl<$Res, SavedOrdersEvent>;
}

/// @nodoc
class _$SavedOrdersEventCopyWithImpl<$Res, $Val extends SavedOrdersEvent>
    implements $SavedOrdersEventCopyWith<$Res> {
  _$SavedOrdersEventCopyWithImpl(this._value, this._then);

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
    extends _$SavedOrdersEventCopyWithImpl<$Res, _$StartedImpl>
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
    return 'SavedOrdersEvent.started()';
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
    required TResult Function(SaveOrderEntity order) addNewOrder,
    required TResult Function(String tableId) removeOrder,
    required TResult Function() clear,
  }) {
    return started();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function(SaveOrderEntity order)? addNewOrder,
    TResult? Function(String tableId)? removeOrder,
    TResult? Function()? clear,
  }) {
    return started?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function(SaveOrderEntity order)? addNewOrder,
    TResult Function(String tableId)? removeOrder,
    TResult Function()? clear,
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
    required TResult Function(_AddNewOrder value) addNewOrder,
    required TResult Function(_RemoveOrder value) removeOrder,
    required TResult Function(_Clear value) clear,
  }) {
    return started(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_AddNewOrder value)? addNewOrder,
    TResult? Function(_RemoveOrder value)? removeOrder,
    TResult? Function(_Clear value)? clear,
  }) {
    return started?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_AddNewOrder value)? addNewOrder,
    TResult Function(_RemoveOrder value)? removeOrder,
    TResult Function(_Clear value)? clear,
    required TResult orElse(),
  }) {
    if (started != null) {
      return started(this);
    }
    return orElse();
  }
}

abstract class _Started implements SavedOrdersEvent {
  const factory _Started() = _$StartedImpl;
}

/// @nodoc
abstract class _$$AddNewOrderImplCopyWith<$Res> {
  factory _$$AddNewOrderImplCopyWith(
          _$AddNewOrderImpl value, $Res Function(_$AddNewOrderImpl) then) =
      __$$AddNewOrderImplCopyWithImpl<$Res>;
  @useResult
  $Res call({SaveOrderEntity order});
}

/// @nodoc
class __$$AddNewOrderImplCopyWithImpl<$Res>
    extends _$SavedOrdersEventCopyWithImpl<$Res, _$AddNewOrderImpl>
    implements _$$AddNewOrderImplCopyWith<$Res> {
  __$$AddNewOrderImplCopyWithImpl(
      _$AddNewOrderImpl _value, $Res Function(_$AddNewOrderImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? order = null,
  }) {
    return _then(_$AddNewOrderImpl(
      order: null == order
          ? _value.order
          : order // ignore: cast_nullable_to_non_nullable
              as SaveOrderEntity,
    ));
  }
}

/// @nodoc

class _$AddNewOrderImpl implements _AddNewOrder {
  const _$AddNewOrderImpl({required this.order});

  @override
  final SaveOrderEntity order;

  @override
  String toString() {
    return 'SavedOrdersEvent.addNewOrder(order: $order)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AddNewOrderImpl &&
            (identical(other.order, order) || other.order == order));
  }

  @override
  int get hashCode => Object.hash(runtimeType, order);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AddNewOrderImplCopyWith<_$AddNewOrderImpl> get copyWith =>
      __$$AddNewOrderImplCopyWithImpl<_$AddNewOrderImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function(SaveOrderEntity order) addNewOrder,
    required TResult Function(String tableId) removeOrder,
    required TResult Function() clear,
  }) {
    return addNewOrder(order);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function(SaveOrderEntity order)? addNewOrder,
    TResult? Function(String tableId)? removeOrder,
    TResult? Function()? clear,
  }) {
    return addNewOrder?.call(order);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function(SaveOrderEntity order)? addNewOrder,
    TResult Function(String tableId)? removeOrder,
    TResult Function()? clear,
    required TResult orElse(),
  }) {
    if (addNewOrder != null) {
      return addNewOrder(order);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_AddNewOrder value) addNewOrder,
    required TResult Function(_RemoveOrder value) removeOrder,
    required TResult Function(_Clear value) clear,
  }) {
    return addNewOrder(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_AddNewOrder value)? addNewOrder,
    TResult? Function(_RemoveOrder value)? removeOrder,
    TResult? Function(_Clear value)? clear,
  }) {
    return addNewOrder?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_AddNewOrder value)? addNewOrder,
    TResult Function(_RemoveOrder value)? removeOrder,
    TResult Function(_Clear value)? clear,
    required TResult orElse(),
  }) {
    if (addNewOrder != null) {
      return addNewOrder(this);
    }
    return orElse();
  }
}

abstract class _AddNewOrder implements SavedOrdersEvent {
  const factory _AddNewOrder({required final SaveOrderEntity order}) =
      _$AddNewOrderImpl;

  SaveOrderEntity get order;
  @JsonKey(ignore: true)
  _$$AddNewOrderImplCopyWith<_$AddNewOrderImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$RemoveOrderImplCopyWith<$Res> {
  factory _$$RemoveOrderImplCopyWith(
          _$RemoveOrderImpl value, $Res Function(_$RemoveOrderImpl) then) =
      __$$RemoveOrderImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String tableId});
}

/// @nodoc
class __$$RemoveOrderImplCopyWithImpl<$Res>
    extends _$SavedOrdersEventCopyWithImpl<$Res, _$RemoveOrderImpl>
    implements _$$RemoveOrderImplCopyWith<$Res> {
  __$$RemoveOrderImplCopyWithImpl(
      _$RemoveOrderImpl _value, $Res Function(_$RemoveOrderImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? tableId = null,
  }) {
    return _then(_$RemoveOrderImpl(
      tableId: null == tableId
          ? _value.tableId
          : tableId // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$RemoveOrderImpl implements _RemoveOrder {
  const _$RemoveOrderImpl({required this.tableId});

  @override
  final String tableId;

  @override
  String toString() {
    return 'SavedOrdersEvent.removeOrder(tableId: $tableId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$RemoveOrderImpl &&
            (identical(other.tableId, tableId) || other.tableId == tableId));
  }

  @override
  int get hashCode => Object.hash(runtimeType, tableId);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$RemoveOrderImplCopyWith<_$RemoveOrderImpl> get copyWith =>
      __$$RemoveOrderImplCopyWithImpl<_$RemoveOrderImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function(SaveOrderEntity order) addNewOrder,
    required TResult Function(String tableId) removeOrder,
    required TResult Function() clear,
  }) {
    return removeOrder(tableId);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function(SaveOrderEntity order)? addNewOrder,
    TResult? Function(String tableId)? removeOrder,
    TResult? Function()? clear,
  }) {
    return removeOrder?.call(tableId);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function(SaveOrderEntity order)? addNewOrder,
    TResult Function(String tableId)? removeOrder,
    TResult Function()? clear,
    required TResult orElse(),
  }) {
    if (removeOrder != null) {
      return removeOrder(tableId);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_AddNewOrder value) addNewOrder,
    required TResult Function(_RemoveOrder value) removeOrder,
    required TResult Function(_Clear value) clear,
  }) {
    return removeOrder(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_AddNewOrder value)? addNewOrder,
    TResult? Function(_RemoveOrder value)? removeOrder,
    TResult? Function(_Clear value)? clear,
  }) {
    return removeOrder?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_AddNewOrder value)? addNewOrder,
    TResult Function(_RemoveOrder value)? removeOrder,
    TResult Function(_Clear value)? clear,
    required TResult orElse(),
  }) {
    if (removeOrder != null) {
      return removeOrder(this);
    }
    return orElse();
  }
}

abstract class _RemoveOrder implements SavedOrdersEvent {
  const factory _RemoveOrder({required final String tableId}) =
      _$RemoveOrderImpl;

  String get tableId;
  @JsonKey(ignore: true)
  _$$RemoveOrderImplCopyWith<_$RemoveOrderImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$ClearImplCopyWith<$Res> {
  factory _$$ClearImplCopyWith(
          _$ClearImpl value, $Res Function(_$ClearImpl) then) =
      __$$ClearImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$ClearImplCopyWithImpl<$Res>
    extends _$SavedOrdersEventCopyWithImpl<$Res, _$ClearImpl>
    implements _$$ClearImplCopyWith<$Res> {
  __$$ClearImplCopyWithImpl(
      _$ClearImpl _value, $Res Function(_$ClearImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$ClearImpl implements _Clear {
  const _$ClearImpl();

  @override
  String toString() {
    return 'SavedOrdersEvent.clear()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$ClearImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function(SaveOrderEntity order) addNewOrder,
    required TResult Function(String tableId) removeOrder,
    required TResult Function() clear,
  }) {
    return clear();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function(SaveOrderEntity order)? addNewOrder,
    TResult? Function(String tableId)? removeOrder,
    TResult? Function()? clear,
  }) {
    return clear?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function(SaveOrderEntity order)? addNewOrder,
    TResult Function(String tableId)? removeOrder,
    TResult Function()? clear,
    required TResult orElse(),
  }) {
    if (clear != null) {
      return clear();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_AddNewOrder value) addNewOrder,
    required TResult Function(_RemoveOrder value) removeOrder,
    required TResult Function(_Clear value) clear,
  }) {
    return clear(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_AddNewOrder value)? addNewOrder,
    TResult? Function(_RemoveOrder value)? removeOrder,
    TResult? Function(_Clear value)? clear,
  }) {
    return clear?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_AddNewOrder value)? addNewOrder,
    TResult Function(_RemoveOrder value)? removeOrder,
    TResult Function(_Clear value)? clear,
    required TResult orElse(),
  }) {
    if (clear != null) {
      return clear(this);
    }
    return orElse();
  }
}

abstract class _Clear implements SavedOrdersEvent {
  const factory _Clear() = _$ClearImpl;
}

/// @nodoc
mixin _$SavedOrdersState {
  List<SaveOrderEntity> get order => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $SavedOrdersStateCopyWith<SavedOrdersState> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SavedOrdersStateCopyWith<$Res> {
  factory $SavedOrdersStateCopyWith(
          SavedOrdersState value, $Res Function(SavedOrdersState) then) =
      _$SavedOrdersStateCopyWithImpl<$Res, SavedOrdersState>;
  @useResult
  $Res call({List<SaveOrderEntity> order});
}

/// @nodoc
class _$SavedOrdersStateCopyWithImpl<$Res, $Val extends SavedOrdersState>
    implements $SavedOrdersStateCopyWith<$Res> {
  _$SavedOrdersStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? order = null,
  }) {
    return _then(_value.copyWith(
      order: null == order
          ? _value.order
          : order // ignore: cast_nullable_to_non_nullable
              as List<SaveOrderEntity>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$SavedOrdersStateImplCopyWith<$Res>
    implements $SavedOrdersStateCopyWith<$Res> {
  factory _$$SavedOrdersStateImplCopyWith(_$SavedOrdersStateImpl value,
          $Res Function(_$SavedOrdersStateImpl) then) =
      __$$SavedOrdersStateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({List<SaveOrderEntity> order});
}

/// @nodoc
class __$$SavedOrdersStateImplCopyWithImpl<$Res>
    extends _$SavedOrdersStateCopyWithImpl<$Res, _$SavedOrdersStateImpl>
    implements _$$SavedOrdersStateImplCopyWith<$Res> {
  __$$SavedOrdersStateImplCopyWithImpl(_$SavedOrdersStateImpl _value,
      $Res Function(_$SavedOrdersStateImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? order = null,
  }) {
    return _then(_$SavedOrdersStateImpl(
      order: null == order
          ? _value._order
          : order // ignore: cast_nullable_to_non_nullable
              as List<SaveOrderEntity>,
    ));
  }
}

/// @nodoc

class _$SavedOrdersStateImpl implements _SavedOrdersState {
  const _$SavedOrdersStateImpl({final List<SaveOrderEntity> order = const []})
      : _order = order;

  final List<SaveOrderEntity> _order;
  @override
  @JsonKey()
  List<SaveOrderEntity> get order {
    if (_order is EqualUnmodifiableListView) return _order;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_order);
  }

  @override
  String toString() {
    return 'SavedOrdersState(order: $order)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SavedOrdersStateImpl &&
            const DeepCollectionEquality().equals(other._order, _order));
  }

  @override
  int get hashCode =>
      Object.hash(runtimeType, const DeepCollectionEquality().hash(_order));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$SavedOrdersStateImplCopyWith<_$SavedOrdersStateImpl> get copyWith =>
      __$$SavedOrdersStateImplCopyWithImpl<_$SavedOrdersStateImpl>(
          this, _$identity);
}

abstract class _SavedOrdersState implements SavedOrdersState {
  const factory _SavedOrdersState({final List<SaveOrderEntity> order}) =
      _$SavedOrdersStateImpl;

  @override
  List<SaveOrderEntity> get order;
  @override
  @JsonKey(ignore: true)
  _$$SavedOrdersStateImplCopyWith<_$SavedOrdersStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
