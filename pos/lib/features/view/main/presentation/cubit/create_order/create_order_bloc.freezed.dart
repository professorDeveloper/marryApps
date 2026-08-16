// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'create_order_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$CreateOrderEvent {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(
            int guestCount, String? tableId, TableStatus tableStatus)
        started,
    required TResult Function(List<OrderItem> orders) createOrder,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(int guestCount, String? tableId, TableStatus tableStatus)?
        started,
    TResult? Function(List<OrderItem> orders)? createOrder,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(int guestCount, String? tableId, TableStatus tableStatus)?
        started,
    TResult Function(List<OrderItem> orders)? createOrder,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_CreateOrder value) createOrder,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_CreateOrder value)? createOrder,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_CreateOrder value)? createOrder,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CreateOrderEventCopyWith<$Res> {
  factory $CreateOrderEventCopyWith(
          CreateOrderEvent value, $Res Function(CreateOrderEvent) then) =
      _$CreateOrderEventCopyWithImpl<$Res, CreateOrderEvent>;
}

/// @nodoc
class _$CreateOrderEventCopyWithImpl<$Res, $Val extends CreateOrderEvent>
    implements $CreateOrderEventCopyWith<$Res> {
  _$CreateOrderEventCopyWithImpl(this._value, this._then);

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
  @useResult
  $Res call({int guestCount, String? tableId, TableStatus tableStatus});
}

/// @nodoc
class __$$StartedImplCopyWithImpl<$Res>
    extends _$CreateOrderEventCopyWithImpl<$Res, _$StartedImpl>
    implements _$$StartedImplCopyWith<$Res> {
  __$$StartedImplCopyWithImpl(
      _$StartedImpl _value, $Res Function(_$StartedImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? guestCount = null,
    Object? tableId = freezed,
    Object? tableStatus = null,
  }) {
    return _then(_$StartedImpl(
      guestCount: null == guestCount
          ? _value.guestCount
          : guestCount // ignore: cast_nullable_to_non_nullable
              as int,
      tableId: freezed == tableId
          ? _value.tableId
          : tableId // ignore: cast_nullable_to_non_nullable
              as String?,
      tableStatus: null == tableStatus
          ? _value.tableStatus
          : tableStatus // ignore: cast_nullable_to_non_nullable
              as TableStatus,
    ));
  }
}

/// @nodoc

class _$StartedImpl implements _Started {
  const _$StartedImpl(
      {required this.guestCount, this.tableId, required this.tableStatus});

  @override
  final int guestCount;
  @override
  final String? tableId;
  @override
  final TableStatus tableStatus;

  @override
  String toString() {
    return 'CreateOrderEvent.started(guestCount: $guestCount, tableId: $tableId, tableStatus: $tableStatus)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$StartedImpl &&
            (identical(other.guestCount, guestCount) ||
                other.guestCount == guestCount) &&
            (identical(other.tableId, tableId) || other.tableId == tableId) &&
            (identical(other.tableStatus, tableStatus) ||
                other.tableStatus == tableStatus));
  }

  @override
  int get hashCode =>
      Object.hash(runtimeType, guestCount, tableId, tableStatus);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$StartedImplCopyWith<_$StartedImpl> get copyWith =>
      __$$StartedImplCopyWithImpl<_$StartedImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(
            int guestCount, String? tableId, TableStatus tableStatus)
        started,
    required TResult Function(List<OrderItem> orders) createOrder,
  }) {
    return started(guestCount, tableId, tableStatus);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(int guestCount, String? tableId, TableStatus tableStatus)?
        started,
    TResult? Function(List<OrderItem> orders)? createOrder,
  }) {
    return started?.call(guestCount, tableId, tableStatus);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(int guestCount, String? tableId, TableStatus tableStatus)?
        started,
    TResult Function(List<OrderItem> orders)? createOrder,
    required TResult orElse(),
  }) {
    if (started != null) {
      return started(guestCount, tableId, tableStatus);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_CreateOrder value) createOrder,
  }) {
    return started(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_CreateOrder value)? createOrder,
  }) {
    return started?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_CreateOrder value)? createOrder,
    required TResult orElse(),
  }) {
    if (started != null) {
      return started(this);
    }
    return orElse();
  }
}

abstract class _Started implements CreateOrderEvent {
  const factory _Started(
      {required final int guestCount,
      final String? tableId,
      required final TableStatus tableStatus}) = _$StartedImpl;

  int get guestCount;
  String? get tableId;
  TableStatus get tableStatus;
  @JsonKey(ignore: true)
  _$$StartedImplCopyWith<_$StartedImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$CreateOrderImplCopyWith<$Res> {
  factory _$$CreateOrderImplCopyWith(
          _$CreateOrderImpl value, $Res Function(_$CreateOrderImpl) then) =
      __$$CreateOrderImplCopyWithImpl<$Res>;
  @useResult
  $Res call({List<OrderItem> orders});
}

/// @nodoc
class __$$CreateOrderImplCopyWithImpl<$Res>
    extends _$CreateOrderEventCopyWithImpl<$Res, _$CreateOrderImpl>
    implements _$$CreateOrderImplCopyWith<$Res> {
  __$$CreateOrderImplCopyWithImpl(
      _$CreateOrderImpl _value, $Res Function(_$CreateOrderImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? orders = null,
  }) {
    return _then(_$CreateOrderImpl(
      orders: null == orders
          ? _value._orders
          : orders // ignore: cast_nullable_to_non_nullable
              as List<OrderItem>,
    ));
  }
}

/// @nodoc

class _$CreateOrderImpl implements _CreateOrder {
  const _$CreateOrderImpl({required final List<OrderItem> orders})
      : _orders = orders;

  final List<OrderItem> _orders;
  @override
  List<OrderItem> get orders {
    if (_orders is EqualUnmodifiableListView) return _orders;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_orders);
  }

  @override
  String toString() {
    return 'CreateOrderEvent.createOrder(orders: $orders)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CreateOrderImpl &&
            const DeepCollectionEquality().equals(other._orders, _orders));
  }

  @override
  int get hashCode =>
      Object.hash(runtimeType, const DeepCollectionEquality().hash(_orders));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CreateOrderImplCopyWith<_$CreateOrderImpl> get copyWith =>
      __$$CreateOrderImplCopyWithImpl<_$CreateOrderImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(
            int guestCount, String? tableId, TableStatus tableStatus)
        started,
    required TResult Function(List<OrderItem> orders) createOrder,
  }) {
    return createOrder(orders);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(int guestCount, String? tableId, TableStatus tableStatus)?
        started,
    TResult? Function(List<OrderItem> orders)? createOrder,
  }) {
    return createOrder?.call(orders);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(int guestCount, String? tableId, TableStatus tableStatus)?
        started,
    TResult Function(List<OrderItem> orders)? createOrder,
    required TResult orElse(),
  }) {
    if (createOrder != null) {
      return createOrder(orders);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_CreateOrder value) createOrder,
  }) {
    return createOrder(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_CreateOrder value)? createOrder,
  }) {
    return createOrder?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_CreateOrder value)? createOrder,
    required TResult orElse(),
  }) {
    if (createOrder != null) {
      return createOrder(this);
    }
    return orElse();
  }
}

abstract class _CreateOrder implements CreateOrderEvent {
  const factory _CreateOrder({required final List<OrderItem> orders}) =
      _$CreateOrderImpl;

  List<OrderItem> get orders;
  @JsonKey(ignore: true)
  _$$CreateOrderImplCopyWith<_$CreateOrderImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
mixin _$CreateOrderState {
  Status get status => throw _privateConstructorUsedError;
  String get tableId => throw _privateConstructorUsedError;
  TableStatus get tableStatus => throw _privateConstructorUsedError;
  int get guestCount => throw _privateConstructorUsedError;
  bool get success => throw _privateConstructorUsedError;
  Failure? get failure => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $CreateOrderStateCopyWith<CreateOrderState> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CreateOrderStateCopyWith<$Res> {
  factory $CreateOrderStateCopyWith(
          CreateOrderState value, $Res Function(CreateOrderState) then) =
      _$CreateOrderStateCopyWithImpl<$Res, CreateOrderState>;
  @useResult
  $Res call(
      {Status status,
      String tableId,
      TableStatus tableStatus,
      int guestCount,
      bool success,
      Failure? failure});
}

/// @nodoc
class _$CreateOrderStateCopyWithImpl<$Res, $Val extends CreateOrderState>
    implements $CreateOrderStateCopyWith<$Res> {
  _$CreateOrderStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = null,
    Object? tableId = null,
    Object? tableStatus = null,
    Object? guestCount = null,
    Object? success = null,
    Object? failure = freezed,
  }) {
    return _then(_value.copyWith(
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as Status,
      tableId: null == tableId
          ? _value.tableId
          : tableId // ignore: cast_nullable_to_non_nullable
              as String,
      tableStatus: null == tableStatus
          ? _value.tableStatus
          : tableStatus // ignore: cast_nullable_to_non_nullable
              as TableStatus,
      guestCount: null == guestCount
          ? _value.guestCount
          : guestCount // ignore: cast_nullable_to_non_nullable
              as int,
      success: null == success
          ? _value.success
          : success // ignore: cast_nullable_to_non_nullable
              as bool,
      failure: freezed == failure
          ? _value.failure
          : failure // ignore: cast_nullable_to_non_nullable
              as Failure?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CreateOrderStateImplCopyWith<$Res>
    implements $CreateOrderStateCopyWith<$Res> {
  factory _$$CreateOrderStateImplCopyWith(_$CreateOrderStateImpl value,
          $Res Function(_$CreateOrderStateImpl) then) =
      __$$CreateOrderStateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {Status status,
      String tableId,
      TableStatus tableStatus,
      int guestCount,
      bool success,
      Failure? failure});
}

/// @nodoc
class __$$CreateOrderStateImplCopyWithImpl<$Res>
    extends _$CreateOrderStateCopyWithImpl<$Res, _$CreateOrderStateImpl>
    implements _$$CreateOrderStateImplCopyWith<$Res> {
  __$$CreateOrderStateImplCopyWithImpl(_$CreateOrderStateImpl _value,
      $Res Function(_$CreateOrderStateImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = null,
    Object? tableId = null,
    Object? tableStatus = null,
    Object? guestCount = null,
    Object? success = null,
    Object? failure = freezed,
  }) {
    return _then(_$CreateOrderStateImpl(
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as Status,
      tableId: null == tableId
          ? _value.tableId
          : tableId // ignore: cast_nullable_to_non_nullable
              as String,
      tableStatus: null == tableStatus
          ? _value.tableStatus
          : tableStatus // ignore: cast_nullable_to_non_nullable
              as TableStatus,
      guestCount: null == guestCount
          ? _value.guestCount
          : guestCount // ignore: cast_nullable_to_non_nullable
              as int,
      success: null == success
          ? _value.success
          : success // ignore: cast_nullable_to_non_nullable
              as bool,
      failure: freezed == failure
          ? _value.failure
          : failure // ignore: cast_nullable_to_non_nullable
              as Failure?,
    ));
  }
}

/// @nodoc

class _$CreateOrderStateImpl implements _CreateOrderState {
  const _$CreateOrderStateImpl(
      {this.status = Status.UNKNOWN,
      this.tableId = '',
      this.tableStatus = TableStatus.none,
      this.guestCount = 0,
      this.success = false,
      this.failure});

  @override
  @JsonKey()
  final Status status;
  @override
  @JsonKey()
  final String tableId;
  @override
  @JsonKey()
  final TableStatus tableStatus;
  @override
  @JsonKey()
  final int guestCount;
  @override
  @JsonKey()
  final bool success;
  @override
  final Failure? failure;

  @override
  String toString() {
    return 'CreateOrderState(status: $status, tableId: $tableId, tableStatus: $tableStatus, guestCount: $guestCount, success: $success, failure: $failure)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CreateOrderStateImpl &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.tableId, tableId) || other.tableId == tableId) &&
            (identical(other.tableStatus, tableStatus) ||
                other.tableStatus == tableStatus) &&
            (identical(other.guestCount, guestCount) ||
                other.guestCount == guestCount) &&
            (identical(other.success, success) || other.success == success) &&
            (identical(other.failure, failure) || other.failure == failure));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType, status, tableId, tableStatus, guestCount, success, failure);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CreateOrderStateImplCopyWith<_$CreateOrderStateImpl> get copyWith =>
      __$$CreateOrderStateImplCopyWithImpl<_$CreateOrderStateImpl>(
          this, _$identity);
}

abstract class _CreateOrderState implements CreateOrderState {
  const factory _CreateOrderState(
      {final Status status,
      final String tableId,
      final TableStatus tableStatus,
      final int guestCount,
      final bool success,
      final Failure? failure}) = _$CreateOrderStateImpl;

  @override
  Status get status;
  @override
  String get tableId;
  @override
  TableStatus get tableStatus;
  @override
  int get guestCount;
  @override
  bool get success;
  @override
  Failure? get failure;
  @override
  @JsonKey(ignore: true)
  _$$CreateOrderStateImplCopyWith<_$CreateOrderStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
