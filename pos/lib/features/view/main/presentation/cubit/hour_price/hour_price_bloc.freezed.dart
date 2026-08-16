// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'hour_price_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$HourPriceEvent {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String? orderId) started,
    required TResult Function() getPrice,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String? orderId)? started,
    TResult? Function()? getPrice,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String? orderId)? started,
    TResult Function()? getPrice,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetPrice value) getPrice,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetPrice value)? getPrice,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetPrice value)? getPrice,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $HourPriceEventCopyWith<$Res> {
  factory $HourPriceEventCopyWith(
          HourPriceEvent value, $Res Function(HourPriceEvent) then) =
      _$HourPriceEventCopyWithImpl<$Res, HourPriceEvent>;
}

/// @nodoc
class _$HourPriceEventCopyWithImpl<$Res, $Val extends HourPriceEvent>
    implements $HourPriceEventCopyWith<$Res> {
  _$HourPriceEventCopyWithImpl(this._value, this._then);

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
  $Res call({String? orderId});
}

/// @nodoc
class __$$StartedImplCopyWithImpl<$Res>
    extends _$HourPriceEventCopyWithImpl<$Res, _$StartedImpl>
    implements _$$StartedImplCopyWith<$Res> {
  __$$StartedImplCopyWithImpl(
      _$StartedImpl _value, $Res Function(_$StartedImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? orderId = freezed,
  }) {
    return _then(_$StartedImpl(
      orderId: freezed == orderId
          ? _value.orderId
          : orderId // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc

class _$StartedImpl implements _Started {
  const _$StartedImpl({this.orderId});

  @override
  final String? orderId;

  @override
  String toString() {
    return 'HourPriceEvent.started(orderId: $orderId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$StartedImpl &&
            (identical(other.orderId, orderId) || other.orderId == orderId));
  }

  @override
  int get hashCode => Object.hash(runtimeType, orderId);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$StartedImplCopyWith<_$StartedImpl> get copyWith =>
      __$$StartedImplCopyWithImpl<_$StartedImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String? orderId) started,
    required TResult Function() getPrice,
  }) {
    return started(orderId);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String? orderId)? started,
    TResult? Function()? getPrice,
  }) {
    return started?.call(orderId);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String? orderId)? started,
    TResult Function()? getPrice,
    required TResult orElse(),
  }) {
    if (started != null) {
      return started(orderId);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetPrice value) getPrice,
  }) {
    return started(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetPrice value)? getPrice,
  }) {
    return started?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetPrice value)? getPrice,
    required TResult orElse(),
  }) {
    if (started != null) {
      return started(this);
    }
    return orElse();
  }
}

abstract class _Started implements HourPriceEvent {
  const factory _Started({final String? orderId}) = _$StartedImpl;

  String? get orderId;
  @JsonKey(ignore: true)
  _$$StartedImplCopyWith<_$StartedImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$GetPriceImplCopyWith<$Res> {
  factory _$$GetPriceImplCopyWith(
          _$GetPriceImpl value, $Res Function(_$GetPriceImpl) then) =
      __$$GetPriceImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$GetPriceImplCopyWithImpl<$Res>
    extends _$HourPriceEventCopyWithImpl<$Res, _$GetPriceImpl>
    implements _$$GetPriceImplCopyWith<$Res> {
  __$$GetPriceImplCopyWithImpl(
      _$GetPriceImpl _value, $Res Function(_$GetPriceImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$GetPriceImpl implements _GetPrice {
  const _$GetPriceImpl();

  @override
  String toString() {
    return 'HourPriceEvent.getPrice()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$GetPriceImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String? orderId) started,
    required TResult Function() getPrice,
  }) {
    return getPrice();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String? orderId)? started,
    TResult? Function()? getPrice,
  }) {
    return getPrice?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String? orderId)? started,
    TResult Function()? getPrice,
    required TResult orElse(),
  }) {
    if (getPrice != null) {
      return getPrice();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetPrice value) getPrice,
  }) {
    return getPrice(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetPrice value)? getPrice,
  }) {
    return getPrice?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetPrice value)? getPrice,
    required TResult orElse(),
  }) {
    if (getPrice != null) {
      return getPrice(this);
    }
    return orElse();
  }
}

abstract class _GetPrice implements HourPriceEvent {
  const factory _GetPrice() = _$GetPriceImpl;
}

/// @nodoc
mixin _$HourPriceState {
  Status get status => throw _privateConstructorUsedError;
  String? get orderId => throw _privateConstructorUsedError;
  HourPriceResponseEntity? get price => throw _privateConstructorUsedError;
  Failure? get failure => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $HourPriceStateCopyWith<HourPriceState> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $HourPriceStateCopyWith<$Res> {
  factory $HourPriceStateCopyWith(
          HourPriceState value, $Res Function(HourPriceState) then) =
      _$HourPriceStateCopyWithImpl<$Res, HourPriceState>;
  @useResult
  $Res call(
      {Status status,
      String? orderId,
      HourPriceResponseEntity? price,
      Failure? failure});
}

/// @nodoc
class _$HourPriceStateCopyWithImpl<$Res, $Val extends HourPriceState>
    implements $HourPriceStateCopyWith<$Res> {
  _$HourPriceStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = null,
    Object? orderId = freezed,
    Object? price = freezed,
    Object? failure = freezed,
  }) {
    return _then(_value.copyWith(
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as Status,
      orderId: freezed == orderId
          ? _value.orderId
          : orderId // ignore: cast_nullable_to_non_nullable
              as String?,
      price: freezed == price
          ? _value.price
          : price // ignore: cast_nullable_to_non_nullable
              as HourPriceResponseEntity?,
      failure: freezed == failure
          ? _value.failure
          : failure // ignore: cast_nullable_to_non_nullable
              as Failure?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$HourPriceStateImplCopyWith<$Res>
    implements $HourPriceStateCopyWith<$Res> {
  factory _$$HourPriceStateImplCopyWith(_$HourPriceStateImpl value,
          $Res Function(_$HourPriceStateImpl) then) =
      __$$HourPriceStateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {Status status,
      String? orderId,
      HourPriceResponseEntity? price,
      Failure? failure});
}

/// @nodoc
class __$$HourPriceStateImplCopyWithImpl<$Res>
    extends _$HourPriceStateCopyWithImpl<$Res, _$HourPriceStateImpl>
    implements _$$HourPriceStateImplCopyWith<$Res> {
  __$$HourPriceStateImplCopyWithImpl(
      _$HourPriceStateImpl _value, $Res Function(_$HourPriceStateImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = null,
    Object? orderId = freezed,
    Object? price = freezed,
    Object? failure = freezed,
  }) {
    return _then(_$HourPriceStateImpl(
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as Status,
      orderId: freezed == orderId
          ? _value.orderId
          : orderId // ignore: cast_nullable_to_non_nullable
              as String?,
      price: freezed == price
          ? _value.price
          : price // ignore: cast_nullable_to_non_nullable
              as HourPriceResponseEntity?,
      failure: freezed == failure
          ? _value.failure
          : failure // ignore: cast_nullable_to_non_nullable
              as Failure?,
    ));
  }
}

/// @nodoc

class _$HourPriceStateImpl implements _HourPriceState {
  const _$HourPriceStateImpl(
      {this.status = Status.UNKNOWN, this.orderId, this.price, this.failure});

  @override
  @JsonKey()
  final Status status;
  @override
  final String? orderId;
  @override
  final HourPriceResponseEntity? price;
  @override
  final Failure? failure;

  @override
  String toString() {
    return 'HourPriceState(status: $status, orderId: $orderId, price: $price, failure: $failure)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$HourPriceStateImpl &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.orderId, orderId) || other.orderId == orderId) &&
            (identical(other.price, price) || other.price == price) &&
            (identical(other.failure, failure) || other.failure == failure));
  }

  @override
  int get hashCode => Object.hash(runtimeType, status, orderId, price, failure);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$HourPriceStateImplCopyWith<_$HourPriceStateImpl> get copyWith =>
      __$$HourPriceStateImplCopyWithImpl<_$HourPriceStateImpl>(
          this, _$identity);
}

abstract class _HourPriceState implements HourPriceState {
  const factory _HourPriceState(
      {final Status status,
      final String? orderId,
      final HourPriceResponseEntity? price,
      final Failure? failure}) = _$HourPriceStateImpl;

  @override
  Status get status;
  @override
  String? get orderId;
  @override
  HourPriceResponseEntity? get price;
  @override
  Failure? get failure;
  @override
  @JsonKey(ignore: true)
  _$$HourPriceStateImplCopyWith<_$HourPriceStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
