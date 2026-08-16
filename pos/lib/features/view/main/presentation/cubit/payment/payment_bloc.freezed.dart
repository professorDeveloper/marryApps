// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'payment_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$PaymentEvent {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String? tableId, String? orderId) started,
    required TResult Function(String symbol) updateEnterSum,
    required TResult Function() getDetail,
    required TResult Function() payment,
    required TResult Function(DiscountType dicountType) updateDiscountType,
    required TResult Function(String amount) updateDiscountAmount,
    required TResult Function(PaymentType paymentType) updatePaymentType,
    required TResult Function(double hourPrice) upadeHourPrice,
    required TResult Function(Map<String, DateTime> timestamps)
        itemTimestampsLoaded,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String? tableId, String? orderId)? started,
    TResult? Function(String symbol)? updateEnterSum,
    TResult? Function()? getDetail,
    TResult? Function()? payment,
    TResult? Function(DiscountType dicountType)? updateDiscountType,
    TResult? Function(String amount)? updateDiscountAmount,
    TResult? Function(PaymentType paymentType)? updatePaymentType,
    TResult? Function(double hourPrice)? upadeHourPrice,
    TResult? Function(Map<String, DateTime> timestamps)? itemTimestampsLoaded,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String? tableId, String? orderId)? started,
    TResult Function(String symbol)? updateEnterSum,
    TResult Function()? getDetail,
    TResult Function()? payment,
    TResult Function(DiscountType dicountType)? updateDiscountType,
    TResult Function(String amount)? updateDiscountAmount,
    TResult Function(PaymentType paymentType)? updatePaymentType,
    TResult Function(double hourPrice)? upadeHourPrice,
    TResult Function(Map<String, DateTime> timestamps)? itemTimestampsLoaded,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_UpdateEnterSum value) updateEnterSum,
    required TResult Function(_GetDetail value) getDetail,
    required TResult Function(_Payment value) payment,
    required TResult Function(_DiscountType value) updateDiscountType,
    required TResult Function(_UpdateDiscountAmount value) updateDiscountAmount,
    required TResult Function(_UpdatePaymentType value) updatePaymentType,
    required TResult Function(_UpdateHourPrice value) upadeHourPrice,
    required TResult Function(_ItemTimestampsLoaded value) itemTimestampsLoaded,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_UpdateEnterSum value)? updateEnterSum,
    TResult? Function(_GetDetail value)? getDetail,
    TResult? Function(_Payment value)? payment,
    TResult? Function(_DiscountType value)? updateDiscountType,
    TResult? Function(_UpdateDiscountAmount value)? updateDiscountAmount,
    TResult? Function(_UpdatePaymentType value)? updatePaymentType,
    TResult? Function(_UpdateHourPrice value)? upadeHourPrice,
    TResult? Function(_ItemTimestampsLoaded value)? itemTimestampsLoaded,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_UpdateEnterSum value)? updateEnterSum,
    TResult Function(_GetDetail value)? getDetail,
    TResult Function(_Payment value)? payment,
    TResult Function(_DiscountType value)? updateDiscountType,
    TResult Function(_UpdateDiscountAmount value)? updateDiscountAmount,
    TResult Function(_UpdatePaymentType value)? updatePaymentType,
    TResult Function(_UpdateHourPrice value)? upadeHourPrice,
    TResult Function(_ItemTimestampsLoaded value)? itemTimestampsLoaded,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PaymentEventCopyWith<$Res> {
  factory $PaymentEventCopyWith(
          PaymentEvent value, $Res Function(PaymentEvent) then) =
      _$PaymentEventCopyWithImpl<$Res, PaymentEvent>;
}

/// @nodoc
class _$PaymentEventCopyWithImpl<$Res, $Val extends PaymentEvent>
    implements $PaymentEventCopyWith<$Res> {
  _$PaymentEventCopyWithImpl(this._value, this._then);

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
  $Res call({String? tableId, String? orderId});
}

/// @nodoc
class __$$StartedImplCopyWithImpl<$Res>
    extends _$PaymentEventCopyWithImpl<$Res, _$StartedImpl>
    implements _$$StartedImplCopyWith<$Res> {
  __$$StartedImplCopyWithImpl(
      _$StartedImpl _value, $Res Function(_$StartedImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? tableId = freezed,
    Object? orderId = freezed,
  }) {
    return _then(_$StartedImpl(
      tableId: freezed == tableId
          ? _value.tableId
          : tableId // ignore: cast_nullable_to_non_nullable
              as String?,
      orderId: freezed == orderId
          ? _value.orderId
          : orderId // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc

class _$StartedImpl implements _Started {
  const _$StartedImpl({this.tableId, this.orderId});

  @override
  final String? tableId;
  @override
  final String? orderId;

  @override
  String toString() {
    return 'PaymentEvent.started(tableId: $tableId, orderId: $orderId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$StartedImpl &&
            (identical(other.tableId, tableId) || other.tableId == tableId) &&
            (identical(other.orderId, orderId) || other.orderId == orderId));
  }

  @override
  int get hashCode => Object.hash(runtimeType, tableId, orderId);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$StartedImplCopyWith<_$StartedImpl> get copyWith =>
      __$$StartedImplCopyWithImpl<_$StartedImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String? tableId, String? orderId) started,
    required TResult Function(String symbol) updateEnterSum,
    required TResult Function() getDetail,
    required TResult Function() payment,
    required TResult Function(DiscountType dicountType) updateDiscountType,
    required TResult Function(String amount) updateDiscountAmount,
    required TResult Function(PaymentType paymentType) updatePaymentType,
    required TResult Function(double hourPrice) upadeHourPrice,
    required TResult Function(Map<String, DateTime> timestamps)
        itemTimestampsLoaded,
  }) {
    return started(tableId, orderId);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String? tableId, String? orderId)? started,
    TResult? Function(String symbol)? updateEnterSum,
    TResult? Function()? getDetail,
    TResult? Function()? payment,
    TResult? Function(DiscountType dicountType)? updateDiscountType,
    TResult? Function(String amount)? updateDiscountAmount,
    TResult? Function(PaymentType paymentType)? updatePaymentType,
    TResult? Function(double hourPrice)? upadeHourPrice,
    TResult? Function(Map<String, DateTime> timestamps)? itemTimestampsLoaded,
  }) {
    return started?.call(tableId, orderId);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String? tableId, String? orderId)? started,
    TResult Function(String symbol)? updateEnterSum,
    TResult Function()? getDetail,
    TResult Function()? payment,
    TResult Function(DiscountType dicountType)? updateDiscountType,
    TResult Function(String amount)? updateDiscountAmount,
    TResult Function(PaymentType paymentType)? updatePaymentType,
    TResult Function(double hourPrice)? upadeHourPrice,
    TResult Function(Map<String, DateTime> timestamps)? itemTimestampsLoaded,
    required TResult orElse(),
  }) {
    if (started != null) {
      return started(tableId, orderId);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_UpdateEnterSum value) updateEnterSum,
    required TResult Function(_GetDetail value) getDetail,
    required TResult Function(_Payment value) payment,
    required TResult Function(_DiscountType value) updateDiscountType,
    required TResult Function(_UpdateDiscountAmount value) updateDiscountAmount,
    required TResult Function(_UpdatePaymentType value) updatePaymentType,
    required TResult Function(_UpdateHourPrice value) upadeHourPrice,
    required TResult Function(_ItemTimestampsLoaded value) itemTimestampsLoaded,
  }) {
    return started(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_UpdateEnterSum value)? updateEnterSum,
    TResult? Function(_GetDetail value)? getDetail,
    TResult? Function(_Payment value)? payment,
    TResult? Function(_DiscountType value)? updateDiscountType,
    TResult? Function(_UpdateDiscountAmount value)? updateDiscountAmount,
    TResult? Function(_UpdatePaymentType value)? updatePaymentType,
    TResult? Function(_UpdateHourPrice value)? upadeHourPrice,
    TResult? Function(_ItemTimestampsLoaded value)? itemTimestampsLoaded,
  }) {
    return started?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_UpdateEnterSum value)? updateEnterSum,
    TResult Function(_GetDetail value)? getDetail,
    TResult Function(_Payment value)? payment,
    TResult Function(_DiscountType value)? updateDiscountType,
    TResult Function(_UpdateDiscountAmount value)? updateDiscountAmount,
    TResult Function(_UpdatePaymentType value)? updatePaymentType,
    TResult Function(_UpdateHourPrice value)? upadeHourPrice,
    TResult Function(_ItemTimestampsLoaded value)? itemTimestampsLoaded,
    required TResult orElse(),
  }) {
    if (started != null) {
      return started(this);
    }
    return orElse();
  }
}

abstract class _Started implements PaymentEvent {
  const factory _Started({final String? tableId, final String? orderId}) =
      _$StartedImpl;

  String? get tableId;
  String? get orderId;
  @JsonKey(ignore: true)
  _$$StartedImplCopyWith<_$StartedImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$UpdateEnterSumImplCopyWith<$Res> {
  factory _$$UpdateEnterSumImplCopyWith(_$UpdateEnterSumImpl value,
          $Res Function(_$UpdateEnterSumImpl) then) =
      __$$UpdateEnterSumImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String symbol});
}

/// @nodoc
class __$$UpdateEnterSumImplCopyWithImpl<$Res>
    extends _$PaymentEventCopyWithImpl<$Res, _$UpdateEnterSumImpl>
    implements _$$UpdateEnterSumImplCopyWith<$Res> {
  __$$UpdateEnterSumImplCopyWithImpl(
      _$UpdateEnterSumImpl _value, $Res Function(_$UpdateEnterSumImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? symbol = null,
  }) {
    return _then(_$UpdateEnterSumImpl(
      symbol: null == symbol
          ? _value.symbol
          : symbol // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$UpdateEnterSumImpl implements _UpdateEnterSum {
  const _$UpdateEnterSumImpl({required this.symbol});

  @override
  final String symbol;

  @override
  String toString() {
    return 'PaymentEvent.updateEnterSum(symbol: $symbol)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UpdateEnterSumImpl &&
            (identical(other.symbol, symbol) || other.symbol == symbol));
  }

  @override
  int get hashCode => Object.hash(runtimeType, symbol);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$UpdateEnterSumImplCopyWith<_$UpdateEnterSumImpl> get copyWith =>
      __$$UpdateEnterSumImplCopyWithImpl<_$UpdateEnterSumImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String? tableId, String? orderId) started,
    required TResult Function(String symbol) updateEnterSum,
    required TResult Function() getDetail,
    required TResult Function() payment,
    required TResult Function(DiscountType dicountType) updateDiscountType,
    required TResult Function(String amount) updateDiscountAmount,
    required TResult Function(PaymentType paymentType) updatePaymentType,
    required TResult Function(double hourPrice) upadeHourPrice,
    required TResult Function(Map<String, DateTime> timestamps)
        itemTimestampsLoaded,
  }) {
    return updateEnterSum(symbol);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String? tableId, String? orderId)? started,
    TResult? Function(String symbol)? updateEnterSum,
    TResult? Function()? getDetail,
    TResult? Function()? payment,
    TResult? Function(DiscountType dicountType)? updateDiscountType,
    TResult? Function(String amount)? updateDiscountAmount,
    TResult? Function(PaymentType paymentType)? updatePaymentType,
    TResult? Function(double hourPrice)? upadeHourPrice,
    TResult? Function(Map<String, DateTime> timestamps)? itemTimestampsLoaded,
  }) {
    return updateEnterSum?.call(symbol);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String? tableId, String? orderId)? started,
    TResult Function(String symbol)? updateEnterSum,
    TResult Function()? getDetail,
    TResult Function()? payment,
    TResult Function(DiscountType dicountType)? updateDiscountType,
    TResult Function(String amount)? updateDiscountAmount,
    TResult Function(PaymentType paymentType)? updatePaymentType,
    TResult Function(double hourPrice)? upadeHourPrice,
    TResult Function(Map<String, DateTime> timestamps)? itemTimestampsLoaded,
    required TResult orElse(),
  }) {
    if (updateEnterSum != null) {
      return updateEnterSum(symbol);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_UpdateEnterSum value) updateEnterSum,
    required TResult Function(_GetDetail value) getDetail,
    required TResult Function(_Payment value) payment,
    required TResult Function(_DiscountType value) updateDiscountType,
    required TResult Function(_UpdateDiscountAmount value) updateDiscountAmount,
    required TResult Function(_UpdatePaymentType value) updatePaymentType,
    required TResult Function(_UpdateHourPrice value) upadeHourPrice,
    required TResult Function(_ItemTimestampsLoaded value) itemTimestampsLoaded,
  }) {
    return updateEnterSum(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_UpdateEnterSum value)? updateEnterSum,
    TResult? Function(_GetDetail value)? getDetail,
    TResult? Function(_Payment value)? payment,
    TResult? Function(_DiscountType value)? updateDiscountType,
    TResult? Function(_UpdateDiscountAmount value)? updateDiscountAmount,
    TResult? Function(_UpdatePaymentType value)? updatePaymentType,
    TResult? Function(_UpdateHourPrice value)? upadeHourPrice,
    TResult? Function(_ItemTimestampsLoaded value)? itemTimestampsLoaded,
  }) {
    return updateEnterSum?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_UpdateEnterSum value)? updateEnterSum,
    TResult Function(_GetDetail value)? getDetail,
    TResult Function(_Payment value)? payment,
    TResult Function(_DiscountType value)? updateDiscountType,
    TResult Function(_UpdateDiscountAmount value)? updateDiscountAmount,
    TResult Function(_UpdatePaymentType value)? updatePaymentType,
    TResult Function(_UpdateHourPrice value)? upadeHourPrice,
    TResult Function(_ItemTimestampsLoaded value)? itemTimestampsLoaded,
    required TResult orElse(),
  }) {
    if (updateEnterSum != null) {
      return updateEnterSum(this);
    }
    return orElse();
  }
}

abstract class _UpdateEnterSum implements PaymentEvent {
  const factory _UpdateEnterSum({required final String symbol}) =
      _$UpdateEnterSumImpl;

  String get symbol;
  @JsonKey(ignore: true)
  _$$UpdateEnterSumImplCopyWith<_$UpdateEnterSumImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$GetDetailImplCopyWith<$Res> {
  factory _$$GetDetailImplCopyWith(
          _$GetDetailImpl value, $Res Function(_$GetDetailImpl) then) =
      __$$GetDetailImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$GetDetailImplCopyWithImpl<$Res>
    extends _$PaymentEventCopyWithImpl<$Res, _$GetDetailImpl>
    implements _$$GetDetailImplCopyWith<$Res> {
  __$$GetDetailImplCopyWithImpl(
      _$GetDetailImpl _value, $Res Function(_$GetDetailImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$GetDetailImpl implements _GetDetail {
  const _$GetDetailImpl();

  @override
  String toString() {
    return 'PaymentEvent.getDetail()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$GetDetailImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String? tableId, String? orderId) started,
    required TResult Function(String symbol) updateEnterSum,
    required TResult Function() getDetail,
    required TResult Function() payment,
    required TResult Function(DiscountType dicountType) updateDiscountType,
    required TResult Function(String amount) updateDiscountAmount,
    required TResult Function(PaymentType paymentType) updatePaymentType,
    required TResult Function(double hourPrice) upadeHourPrice,
    required TResult Function(Map<String, DateTime> timestamps)
        itemTimestampsLoaded,
  }) {
    return getDetail();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String? tableId, String? orderId)? started,
    TResult? Function(String symbol)? updateEnterSum,
    TResult? Function()? getDetail,
    TResult? Function()? payment,
    TResult? Function(DiscountType dicountType)? updateDiscountType,
    TResult? Function(String amount)? updateDiscountAmount,
    TResult? Function(PaymentType paymentType)? updatePaymentType,
    TResult? Function(double hourPrice)? upadeHourPrice,
    TResult? Function(Map<String, DateTime> timestamps)? itemTimestampsLoaded,
  }) {
    return getDetail?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String? tableId, String? orderId)? started,
    TResult Function(String symbol)? updateEnterSum,
    TResult Function()? getDetail,
    TResult Function()? payment,
    TResult Function(DiscountType dicountType)? updateDiscountType,
    TResult Function(String amount)? updateDiscountAmount,
    TResult Function(PaymentType paymentType)? updatePaymentType,
    TResult Function(double hourPrice)? upadeHourPrice,
    TResult Function(Map<String, DateTime> timestamps)? itemTimestampsLoaded,
    required TResult orElse(),
  }) {
    if (getDetail != null) {
      return getDetail();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_UpdateEnterSum value) updateEnterSum,
    required TResult Function(_GetDetail value) getDetail,
    required TResult Function(_Payment value) payment,
    required TResult Function(_DiscountType value) updateDiscountType,
    required TResult Function(_UpdateDiscountAmount value) updateDiscountAmount,
    required TResult Function(_UpdatePaymentType value) updatePaymentType,
    required TResult Function(_UpdateHourPrice value) upadeHourPrice,
    required TResult Function(_ItemTimestampsLoaded value) itemTimestampsLoaded,
  }) {
    return getDetail(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_UpdateEnterSum value)? updateEnterSum,
    TResult? Function(_GetDetail value)? getDetail,
    TResult? Function(_Payment value)? payment,
    TResult? Function(_DiscountType value)? updateDiscountType,
    TResult? Function(_UpdateDiscountAmount value)? updateDiscountAmount,
    TResult? Function(_UpdatePaymentType value)? updatePaymentType,
    TResult? Function(_UpdateHourPrice value)? upadeHourPrice,
    TResult? Function(_ItemTimestampsLoaded value)? itemTimestampsLoaded,
  }) {
    return getDetail?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_UpdateEnterSum value)? updateEnterSum,
    TResult Function(_GetDetail value)? getDetail,
    TResult Function(_Payment value)? payment,
    TResult Function(_DiscountType value)? updateDiscountType,
    TResult Function(_UpdateDiscountAmount value)? updateDiscountAmount,
    TResult Function(_UpdatePaymentType value)? updatePaymentType,
    TResult Function(_UpdateHourPrice value)? upadeHourPrice,
    TResult Function(_ItemTimestampsLoaded value)? itemTimestampsLoaded,
    required TResult orElse(),
  }) {
    if (getDetail != null) {
      return getDetail(this);
    }
    return orElse();
  }
}

abstract class _GetDetail implements PaymentEvent {
  const factory _GetDetail() = _$GetDetailImpl;
}

/// @nodoc
abstract class _$$PaymentImplCopyWith<$Res> {
  factory _$$PaymentImplCopyWith(
          _$PaymentImpl value, $Res Function(_$PaymentImpl) then) =
      __$$PaymentImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$PaymentImplCopyWithImpl<$Res>
    extends _$PaymentEventCopyWithImpl<$Res, _$PaymentImpl>
    implements _$$PaymentImplCopyWith<$Res> {
  __$$PaymentImplCopyWithImpl(
      _$PaymentImpl _value, $Res Function(_$PaymentImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$PaymentImpl implements _Payment {
  const _$PaymentImpl();

  @override
  String toString() {
    return 'PaymentEvent.payment()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$PaymentImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String? tableId, String? orderId) started,
    required TResult Function(String symbol) updateEnterSum,
    required TResult Function() getDetail,
    required TResult Function() payment,
    required TResult Function(DiscountType dicountType) updateDiscountType,
    required TResult Function(String amount) updateDiscountAmount,
    required TResult Function(PaymentType paymentType) updatePaymentType,
    required TResult Function(double hourPrice) upadeHourPrice,
    required TResult Function(Map<String, DateTime> timestamps)
        itemTimestampsLoaded,
  }) {
    return payment();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String? tableId, String? orderId)? started,
    TResult? Function(String symbol)? updateEnterSum,
    TResult? Function()? getDetail,
    TResult? Function()? payment,
    TResult? Function(DiscountType dicountType)? updateDiscountType,
    TResult? Function(String amount)? updateDiscountAmount,
    TResult? Function(PaymentType paymentType)? updatePaymentType,
    TResult? Function(double hourPrice)? upadeHourPrice,
    TResult? Function(Map<String, DateTime> timestamps)? itemTimestampsLoaded,
  }) {
    return payment?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String? tableId, String? orderId)? started,
    TResult Function(String symbol)? updateEnterSum,
    TResult Function()? getDetail,
    TResult Function()? payment,
    TResult Function(DiscountType dicountType)? updateDiscountType,
    TResult Function(String amount)? updateDiscountAmount,
    TResult Function(PaymentType paymentType)? updatePaymentType,
    TResult Function(double hourPrice)? upadeHourPrice,
    TResult Function(Map<String, DateTime> timestamps)? itemTimestampsLoaded,
    required TResult orElse(),
  }) {
    if (payment != null) {
      return payment();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_UpdateEnterSum value) updateEnterSum,
    required TResult Function(_GetDetail value) getDetail,
    required TResult Function(_Payment value) payment,
    required TResult Function(_DiscountType value) updateDiscountType,
    required TResult Function(_UpdateDiscountAmount value) updateDiscountAmount,
    required TResult Function(_UpdatePaymentType value) updatePaymentType,
    required TResult Function(_UpdateHourPrice value) upadeHourPrice,
    required TResult Function(_ItemTimestampsLoaded value) itemTimestampsLoaded,
  }) {
    return payment(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_UpdateEnterSum value)? updateEnterSum,
    TResult? Function(_GetDetail value)? getDetail,
    TResult? Function(_Payment value)? payment,
    TResult? Function(_DiscountType value)? updateDiscountType,
    TResult? Function(_UpdateDiscountAmount value)? updateDiscountAmount,
    TResult? Function(_UpdatePaymentType value)? updatePaymentType,
    TResult? Function(_UpdateHourPrice value)? upadeHourPrice,
    TResult? Function(_ItemTimestampsLoaded value)? itemTimestampsLoaded,
  }) {
    return payment?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_UpdateEnterSum value)? updateEnterSum,
    TResult Function(_GetDetail value)? getDetail,
    TResult Function(_Payment value)? payment,
    TResult Function(_DiscountType value)? updateDiscountType,
    TResult Function(_UpdateDiscountAmount value)? updateDiscountAmount,
    TResult Function(_UpdatePaymentType value)? updatePaymentType,
    TResult Function(_UpdateHourPrice value)? upadeHourPrice,
    TResult Function(_ItemTimestampsLoaded value)? itemTimestampsLoaded,
    required TResult orElse(),
  }) {
    if (payment != null) {
      return payment(this);
    }
    return orElse();
  }
}

abstract class _Payment implements PaymentEvent {
  const factory _Payment() = _$PaymentImpl;
}

/// @nodoc
abstract class _$$DiscountTypeImplCopyWith<$Res> {
  factory _$$DiscountTypeImplCopyWith(
          _$DiscountTypeImpl value, $Res Function(_$DiscountTypeImpl) then) =
      __$$DiscountTypeImplCopyWithImpl<$Res>;
  @useResult
  $Res call({DiscountType dicountType});
}

/// @nodoc
class __$$DiscountTypeImplCopyWithImpl<$Res>
    extends _$PaymentEventCopyWithImpl<$Res, _$DiscountTypeImpl>
    implements _$$DiscountTypeImplCopyWith<$Res> {
  __$$DiscountTypeImplCopyWithImpl(
      _$DiscountTypeImpl _value, $Res Function(_$DiscountTypeImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? dicountType = null,
  }) {
    return _then(_$DiscountTypeImpl(
      dicountType: null == dicountType
          ? _value.dicountType
          : dicountType // ignore: cast_nullable_to_non_nullable
              as DiscountType,
    ));
  }
}

/// @nodoc

class _$DiscountTypeImpl implements _DiscountType {
  const _$DiscountTypeImpl({required this.dicountType});

  @override
  final DiscountType dicountType;

  @override
  String toString() {
    return 'PaymentEvent.updateDiscountType(dicountType: $dicountType)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DiscountTypeImpl &&
            (identical(other.dicountType, dicountType) ||
                other.dicountType == dicountType));
  }

  @override
  int get hashCode => Object.hash(runtimeType, dicountType);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$DiscountTypeImplCopyWith<_$DiscountTypeImpl> get copyWith =>
      __$$DiscountTypeImplCopyWithImpl<_$DiscountTypeImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String? tableId, String? orderId) started,
    required TResult Function(String symbol) updateEnterSum,
    required TResult Function() getDetail,
    required TResult Function() payment,
    required TResult Function(DiscountType dicountType) updateDiscountType,
    required TResult Function(String amount) updateDiscountAmount,
    required TResult Function(PaymentType paymentType) updatePaymentType,
    required TResult Function(double hourPrice) upadeHourPrice,
    required TResult Function(Map<String, DateTime> timestamps)
        itemTimestampsLoaded,
  }) {
    return updateDiscountType(dicountType);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String? tableId, String? orderId)? started,
    TResult? Function(String symbol)? updateEnterSum,
    TResult? Function()? getDetail,
    TResult? Function()? payment,
    TResult? Function(DiscountType dicountType)? updateDiscountType,
    TResult? Function(String amount)? updateDiscountAmount,
    TResult? Function(PaymentType paymentType)? updatePaymentType,
    TResult? Function(double hourPrice)? upadeHourPrice,
    TResult? Function(Map<String, DateTime> timestamps)? itemTimestampsLoaded,
  }) {
    return updateDiscountType?.call(dicountType);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String? tableId, String? orderId)? started,
    TResult Function(String symbol)? updateEnterSum,
    TResult Function()? getDetail,
    TResult Function()? payment,
    TResult Function(DiscountType dicountType)? updateDiscountType,
    TResult Function(String amount)? updateDiscountAmount,
    TResult Function(PaymentType paymentType)? updatePaymentType,
    TResult Function(double hourPrice)? upadeHourPrice,
    TResult Function(Map<String, DateTime> timestamps)? itemTimestampsLoaded,
    required TResult orElse(),
  }) {
    if (updateDiscountType != null) {
      return updateDiscountType(dicountType);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_UpdateEnterSum value) updateEnterSum,
    required TResult Function(_GetDetail value) getDetail,
    required TResult Function(_Payment value) payment,
    required TResult Function(_DiscountType value) updateDiscountType,
    required TResult Function(_UpdateDiscountAmount value) updateDiscountAmount,
    required TResult Function(_UpdatePaymentType value) updatePaymentType,
    required TResult Function(_UpdateHourPrice value) upadeHourPrice,
    required TResult Function(_ItemTimestampsLoaded value) itemTimestampsLoaded,
  }) {
    return updateDiscountType(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_UpdateEnterSum value)? updateEnterSum,
    TResult? Function(_GetDetail value)? getDetail,
    TResult? Function(_Payment value)? payment,
    TResult? Function(_DiscountType value)? updateDiscountType,
    TResult? Function(_UpdateDiscountAmount value)? updateDiscountAmount,
    TResult? Function(_UpdatePaymentType value)? updatePaymentType,
    TResult? Function(_UpdateHourPrice value)? upadeHourPrice,
    TResult? Function(_ItemTimestampsLoaded value)? itemTimestampsLoaded,
  }) {
    return updateDiscountType?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_UpdateEnterSum value)? updateEnterSum,
    TResult Function(_GetDetail value)? getDetail,
    TResult Function(_Payment value)? payment,
    TResult Function(_DiscountType value)? updateDiscountType,
    TResult Function(_UpdateDiscountAmount value)? updateDiscountAmount,
    TResult Function(_UpdatePaymentType value)? updatePaymentType,
    TResult Function(_UpdateHourPrice value)? upadeHourPrice,
    TResult Function(_ItemTimestampsLoaded value)? itemTimestampsLoaded,
    required TResult orElse(),
  }) {
    if (updateDiscountType != null) {
      return updateDiscountType(this);
    }
    return orElse();
  }
}

abstract class _DiscountType implements PaymentEvent {
  const factory _DiscountType({required final DiscountType dicountType}) =
      _$DiscountTypeImpl;

  DiscountType get dicountType;
  @JsonKey(ignore: true)
  _$$DiscountTypeImplCopyWith<_$DiscountTypeImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$UpdateDiscountAmountImplCopyWith<$Res> {
  factory _$$UpdateDiscountAmountImplCopyWith(_$UpdateDiscountAmountImpl value,
          $Res Function(_$UpdateDiscountAmountImpl) then) =
      __$$UpdateDiscountAmountImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String amount});
}

/// @nodoc
class __$$UpdateDiscountAmountImplCopyWithImpl<$Res>
    extends _$PaymentEventCopyWithImpl<$Res, _$UpdateDiscountAmountImpl>
    implements _$$UpdateDiscountAmountImplCopyWith<$Res> {
  __$$UpdateDiscountAmountImplCopyWithImpl(_$UpdateDiscountAmountImpl _value,
      $Res Function(_$UpdateDiscountAmountImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? amount = null,
  }) {
    return _then(_$UpdateDiscountAmountImpl(
      amount: null == amount
          ? _value.amount
          : amount // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$UpdateDiscountAmountImpl implements _UpdateDiscountAmount {
  const _$UpdateDiscountAmountImpl({required this.amount});

  @override
  final String amount;

  @override
  String toString() {
    return 'PaymentEvent.updateDiscountAmount(amount: $amount)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UpdateDiscountAmountImpl &&
            (identical(other.amount, amount) || other.amount == amount));
  }

  @override
  int get hashCode => Object.hash(runtimeType, amount);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$UpdateDiscountAmountImplCopyWith<_$UpdateDiscountAmountImpl>
      get copyWith =>
          __$$UpdateDiscountAmountImplCopyWithImpl<_$UpdateDiscountAmountImpl>(
              this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String? tableId, String? orderId) started,
    required TResult Function(String symbol) updateEnterSum,
    required TResult Function() getDetail,
    required TResult Function() payment,
    required TResult Function(DiscountType dicountType) updateDiscountType,
    required TResult Function(String amount) updateDiscountAmount,
    required TResult Function(PaymentType paymentType) updatePaymentType,
    required TResult Function(double hourPrice) upadeHourPrice,
    required TResult Function(Map<String, DateTime> timestamps)
        itemTimestampsLoaded,
  }) {
    return updateDiscountAmount(amount);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String? tableId, String? orderId)? started,
    TResult? Function(String symbol)? updateEnterSum,
    TResult? Function()? getDetail,
    TResult? Function()? payment,
    TResult? Function(DiscountType dicountType)? updateDiscountType,
    TResult? Function(String amount)? updateDiscountAmount,
    TResult? Function(PaymentType paymentType)? updatePaymentType,
    TResult? Function(double hourPrice)? upadeHourPrice,
    TResult? Function(Map<String, DateTime> timestamps)? itemTimestampsLoaded,
  }) {
    return updateDiscountAmount?.call(amount);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String? tableId, String? orderId)? started,
    TResult Function(String symbol)? updateEnterSum,
    TResult Function()? getDetail,
    TResult Function()? payment,
    TResult Function(DiscountType dicountType)? updateDiscountType,
    TResult Function(String amount)? updateDiscountAmount,
    TResult Function(PaymentType paymentType)? updatePaymentType,
    TResult Function(double hourPrice)? upadeHourPrice,
    TResult Function(Map<String, DateTime> timestamps)? itemTimestampsLoaded,
    required TResult orElse(),
  }) {
    if (updateDiscountAmount != null) {
      return updateDiscountAmount(amount);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_UpdateEnterSum value) updateEnterSum,
    required TResult Function(_GetDetail value) getDetail,
    required TResult Function(_Payment value) payment,
    required TResult Function(_DiscountType value) updateDiscountType,
    required TResult Function(_UpdateDiscountAmount value) updateDiscountAmount,
    required TResult Function(_UpdatePaymentType value) updatePaymentType,
    required TResult Function(_UpdateHourPrice value) upadeHourPrice,
    required TResult Function(_ItemTimestampsLoaded value) itemTimestampsLoaded,
  }) {
    return updateDiscountAmount(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_UpdateEnterSum value)? updateEnterSum,
    TResult? Function(_GetDetail value)? getDetail,
    TResult? Function(_Payment value)? payment,
    TResult? Function(_DiscountType value)? updateDiscountType,
    TResult? Function(_UpdateDiscountAmount value)? updateDiscountAmount,
    TResult? Function(_UpdatePaymentType value)? updatePaymentType,
    TResult? Function(_UpdateHourPrice value)? upadeHourPrice,
    TResult? Function(_ItemTimestampsLoaded value)? itemTimestampsLoaded,
  }) {
    return updateDiscountAmount?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_UpdateEnterSum value)? updateEnterSum,
    TResult Function(_GetDetail value)? getDetail,
    TResult Function(_Payment value)? payment,
    TResult Function(_DiscountType value)? updateDiscountType,
    TResult Function(_UpdateDiscountAmount value)? updateDiscountAmount,
    TResult Function(_UpdatePaymentType value)? updatePaymentType,
    TResult Function(_UpdateHourPrice value)? upadeHourPrice,
    TResult Function(_ItemTimestampsLoaded value)? itemTimestampsLoaded,
    required TResult orElse(),
  }) {
    if (updateDiscountAmount != null) {
      return updateDiscountAmount(this);
    }
    return orElse();
  }
}

abstract class _UpdateDiscountAmount implements PaymentEvent {
  const factory _UpdateDiscountAmount({required final String amount}) =
      _$UpdateDiscountAmountImpl;

  String get amount;
  @JsonKey(ignore: true)
  _$$UpdateDiscountAmountImplCopyWith<_$UpdateDiscountAmountImpl>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$UpdatePaymentTypeImplCopyWith<$Res> {
  factory _$$UpdatePaymentTypeImplCopyWith(_$UpdatePaymentTypeImpl value,
          $Res Function(_$UpdatePaymentTypeImpl) then) =
      __$$UpdatePaymentTypeImplCopyWithImpl<$Res>;
  @useResult
  $Res call({PaymentType paymentType});
}

/// @nodoc
class __$$UpdatePaymentTypeImplCopyWithImpl<$Res>
    extends _$PaymentEventCopyWithImpl<$Res, _$UpdatePaymentTypeImpl>
    implements _$$UpdatePaymentTypeImplCopyWith<$Res> {
  __$$UpdatePaymentTypeImplCopyWithImpl(_$UpdatePaymentTypeImpl _value,
      $Res Function(_$UpdatePaymentTypeImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? paymentType = null,
  }) {
    return _then(_$UpdatePaymentTypeImpl(
      paymentType: null == paymentType
          ? _value.paymentType
          : paymentType // ignore: cast_nullable_to_non_nullable
              as PaymentType,
    ));
  }
}

/// @nodoc

class _$UpdatePaymentTypeImpl implements _UpdatePaymentType {
  const _$UpdatePaymentTypeImpl({required this.paymentType});

  @override
  final PaymentType paymentType;

  @override
  String toString() {
    return 'PaymentEvent.updatePaymentType(paymentType: $paymentType)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UpdatePaymentTypeImpl &&
            (identical(other.paymentType, paymentType) ||
                other.paymentType == paymentType));
  }

  @override
  int get hashCode => Object.hash(runtimeType, paymentType);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$UpdatePaymentTypeImplCopyWith<_$UpdatePaymentTypeImpl> get copyWith =>
      __$$UpdatePaymentTypeImplCopyWithImpl<_$UpdatePaymentTypeImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String? tableId, String? orderId) started,
    required TResult Function(String symbol) updateEnterSum,
    required TResult Function() getDetail,
    required TResult Function() payment,
    required TResult Function(DiscountType dicountType) updateDiscountType,
    required TResult Function(String amount) updateDiscountAmount,
    required TResult Function(PaymentType paymentType) updatePaymentType,
    required TResult Function(double hourPrice) upadeHourPrice,
    required TResult Function(Map<String, DateTime> timestamps)
        itemTimestampsLoaded,
  }) {
    return updatePaymentType(paymentType);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String? tableId, String? orderId)? started,
    TResult? Function(String symbol)? updateEnterSum,
    TResult? Function()? getDetail,
    TResult? Function()? payment,
    TResult? Function(DiscountType dicountType)? updateDiscountType,
    TResult? Function(String amount)? updateDiscountAmount,
    TResult? Function(PaymentType paymentType)? updatePaymentType,
    TResult? Function(double hourPrice)? upadeHourPrice,
    TResult? Function(Map<String, DateTime> timestamps)? itemTimestampsLoaded,
  }) {
    return updatePaymentType?.call(paymentType);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String? tableId, String? orderId)? started,
    TResult Function(String symbol)? updateEnterSum,
    TResult Function()? getDetail,
    TResult Function()? payment,
    TResult Function(DiscountType dicountType)? updateDiscountType,
    TResult Function(String amount)? updateDiscountAmount,
    TResult Function(PaymentType paymentType)? updatePaymentType,
    TResult Function(double hourPrice)? upadeHourPrice,
    TResult Function(Map<String, DateTime> timestamps)? itemTimestampsLoaded,
    required TResult orElse(),
  }) {
    if (updatePaymentType != null) {
      return updatePaymentType(paymentType);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_UpdateEnterSum value) updateEnterSum,
    required TResult Function(_GetDetail value) getDetail,
    required TResult Function(_Payment value) payment,
    required TResult Function(_DiscountType value) updateDiscountType,
    required TResult Function(_UpdateDiscountAmount value) updateDiscountAmount,
    required TResult Function(_UpdatePaymentType value) updatePaymentType,
    required TResult Function(_UpdateHourPrice value) upadeHourPrice,
    required TResult Function(_ItemTimestampsLoaded value) itemTimestampsLoaded,
  }) {
    return updatePaymentType(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_UpdateEnterSum value)? updateEnterSum,
    TResult? Function(_GetDetail value)? getDetail,
    TResult? Function(_Payment value)? payment,
    TResult? Function(_DiscountType value)? updateDiscountType,
    TResult? Function(_UpdateDiscountAmount value)? updateDiscountAmount,
    TResult? Function(_UpdatePaymentType value)? updatePaymentType,
    TResult? Function(_UpdateHourPrice value)? upadeHourPrice,
    TResult? Function(_ItemTimestampsLoaded value)? itemTimestampsLoaded,
  }) {
    return updatePaymentType?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_UpdateEnterSum value)? updateEnterSum,
    TResult Function(_GetDetail value)? getDetail,
    TResult Function(_Payment value)? payment,
    TResult Function(_DiscountType value)? updateDiscountType,
    TResult Function(_UpdateDiscountAmount value)? updateDiscountAmount,
    TResult Function(_UpdatePaymentType value)? updatePaymentType,
    TResult Function(_UpdateHourPrice value)? upadeHourPrice,
    TResult Function(_ItemTimestampsLoaded value)? itemTimestampsLoaded,
    required TResult orElse(),
  }) {
    if (updatePaymentType != null) {
      return updatePaymentType(this);
    }
    return orElse();
  }
}

abstract class _UpdatePaymentType implements PaymentEvent {
  const factory _UpdatePaymentType({required final PaymentType paymentType}) =
      _$UpdatePaymentTypeImpl;

  PaymentType get paymentType;
  @JsonKey(ignore: true)
  _$$UpdatePaymentTypeImplCopyWith<_$UpdatePaymentTypeImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$UpdateHourPriceImplCopyWith<$Res> {
  factory _$$UpdateHourPriceImplCopyWith(_$UpdateHourPriceImpl value,
          $Res Function(_$UpdateHourPriceImpl) then) =
      __$$UpdateHourPriceImplCopyWithImpl<$Res>;
  @useResult
  $Res call({double hourPrice});
}

/// @nodoc
class __$$UpdateHourPriceImplCopyWithImpl<$Res>
    extends _$PaymentEventCopyWithImpl<$Res, _$UpdateHourPriceImpl>
    implements _$$UpdateHourPriceImplCopyWith<$Res> {
  __$$UpdateHourPriceImplCopyWithImpl(
      _$UpdateHourPriceImpl _value, $Res Function(_$UpdateHourPriceImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? hourPrice = null,
  }) {
    return _then(_$UpdateHourPriceImpl(
      hourPrice: null == hourPrice
          ? _value.hourPrice
          : hourPrice // ignore: cast_nullable_to_non_nullable
              as double,
    ));
  }
}

/// @nodoc

class _$UpdateHourPriceImpl implements _UpdateHourPrice {
  const _$UpdateHourPriceImpl({required this.hourPrice});

  @override
  final double hourPrice;

  @override
  String toString() {
    return 'PaymentEvent.upadeHourPrice(hourPrice: $hourPrice)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UpdateHourPriceImpl &&
            (identical(other.hourPrice, hourPrice) ||
                other.hourPrice == hourPrice));
  }

  @override
  int get hashCode => Object.hash(runtimeType, hourPrice);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$UpdateHourPriceImplCopyWith<_$UpdateHourPriceImpl> get copyWith =>
      __$$UpdateHourPriceImplCopyWithImpl<_$UpdateHourPriceImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String? tableId, String? orderId) started,
    required TResult Function(String symbol) updateEnterSum,
    required TResult Function() getDetail,
    required TResult Function() payment,
    required TResult Function(DiscountType dicountType) updateDiscountType,
    required TResult Function(String amount) updateDiscountAmount,
    required TResult Function(PaymentType paymentType) updatePaymentType,
    required TResult Function(double hourPrice) upadeHourPrice,
    required TResult Function(Map<String, DateTime> timestamps)
        itemTimestampsLoaded,
  }) {
    return upadeHourPrice(hourPrice);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String? tableId, String? orderId)? started,
    TResult? Function(String symbol)? updateEnterSum,
    TResult? Function()? getDetail,
    TResult? Function()? payment,
    TResult? Function(DiscountType dicountType)? updateDiscountType,
    TResult? Function(String amount)? updateDiscountAmount,
    TResult? Function(PaymentType paymentType)? updatePaymentType,
    TResult? Function(double hourPrice)? upadeHourPrice,
    TResult? Function(Map<String, DateTime> timestamps)? itemTimestampsLoaded,
  }) {
    return upadeHourPrice?.call(hourPrice);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String? tableId, String? orderId)? started,
    TResult Function(String symbol)? updateEnterSum,
    TResult Function()? getDetail,
    TResult Function()? payment,
    TResult Function(DiscountType dicountType)? updateDiscountType,
    TResult Function(String amount)? updateDiscountAmount,
    TResult Function(PaymentType paymentType)? updatePaymentType,
    TResult Function(double hourPrice)? upadeHourPrice,
    TResult Function(Map<String, DateTime> timestamps)? itemTimestampsLoaded,
    required TResult orElse(),
  }) {
    if (upadeHourPrice != null) {
      return upadeHourPrice(hourPrice);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_UpdateEnterSum value) updateEnterSum,
    required TResult Function(_GetDetail value) getDetail,
    required TResult Function(_Payment value) payment,
    required TResult Function(_DiscountType value) updateDiscountType,
    required TResult Function(_UpdateDiscountAmount value) updateDiscountAmount,
    required TResult Function(_UpdatePaymentType value) updatePaymentType,
    required TResult Function(_UpdateHourPrice value) upadeHourPrice,
    required TResult Function(_ItemTimestampsLoaded value) itemTimestampsLoaded,
  }) {
    return upadeHourPrice(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_UpdateEnterSum value)? updateEnterSum,
    TResult? Function(_GetDetail value)? getDetail,
    TResult? Function(_Payment value)? payment,
    TResult? Function(_DiscountType value)? updateDiscountType,
    TResult? Function(_UpdateDiscountAmount value)? updateDiscountAmount,
    TResult? Function(_UpdatePaymentType value)? updatePaymentType,
    TResult? Function(_UpdateHourPrice value)? upadeHourPrice,
    TResult? Function(_ItemTimestampsLoaded value)? itemTimestampsLoaded,
  }) {
    return upadeHourPrice?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_UpdateEnterSum value)? updateEnterSum,
    TResult Function(_GetDetail value)? getDetail,
    TResult Function(_Payment value)? payment,
    TResult Function(_DiscountType value)? updateDiscountType,
    TResult Function(_UpdateDiscountAmount value)? updateDiscountAmount,
    TResult Function(_UpdatePaymentType value)? updatePaymentType,
    TResult Function(_UpdateHourPrice value)? upadeHourPrice,
    TResult Function(_ItemTimestampsLoaded value)? itemTimestampsLoaded,
    required TResult orElse(),
  }) {
    if (upadeHourPrice != null) {
      return upadeHourPrice(this);
    }
    return orElse();
  }
}

abstract class _UpdateHourPrice implements PaymentEvent {
  const factory _UpdateHourPrice({required final double hourPrice}) =
      _$UpdateHourPriceImpl;

  double get hourPrice;
  @JsonKey(ignore: true)
  _$$UpdateHourPriceImplCopyWith<_$UpdateHourPriceImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$ItemTimestampsLoadedImplCopyWith<$Res> {
  factory _$$ItemTimestampsLoadedImplCopyWith(_$ItemTimestampsLoadedImpl value,
          $Res Function(_$ItemTimestampsLoadedImpl) then) =
      __$$ItemTimestampsLoadedImplCopyWithImpl<$Res>;
  @useResult
  $Res call({Map<String, DateTime> timestamps});
}

/// @nodoc
class __$$ItemTimestampsLoadedImplCopyWithImpl<$Res>
    extends _$PaymentEventCopyWithImpl<$Res, _$ItemTimestampsLoadedImpl>
    implements _$$ItemTimestampsLoadedImplCopyWith<$Res> {
  __$$ItemTimestampsLoadedImplCopyWithImpl(_$ItemTimestampsLoadedImpl _value,
      $Res Function(_$ItemTimestampsLoadedImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? timestamps = null,
  }) {
    return _then(_$ItemTimestampsLoadedImpl(
      timestamps: null == timestamps
          ? _value._timestamps
          : timestamps // ignore: cast_nullable_to_non_nullable
              as Map<String, DateTime>,
    ));
  }
}

/// @nodoc

class _$ItemTimestampsLoadedImpl implements _ItemTimestampsLoaded {
  const _$ItemTimestampsLoadedImpl(
      {required final Map<String, DateTime> timestamps})
      : _timestamps = timestamps;

  final Map<String, DateTime> _timestamps;
  @override
  Map<String, DateTime> get timestamps {
    if (_timestamps is EqualUnmodifiableMapView) return _timestamps;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(_timestamps);
  }

  @override
  String toString() {
    return 'PaymentEvent.itemTimestampsLoaded(timestamps: $timestamps)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ItemTimestampsLoadedImpl &&
            const DeepCollectionEquality()
                .equals(other._timestamps, _timestamps));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType, const DeepCollectionEquality().hash(_timestamps));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ItemTimestampsLoadedImplCopyWith<_$ItemTimestampsLoadedImpl>
      get copyWith =>
          __$$ItemTimestampsLoadedImplCopyWithImpl<_$ItemTimestampsLoadedImpl>(
              this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String? tableId, String? orderId) started,
    required TResult Function(String symbol) updateEnterSum,
    required TResult Function() getDetail,
    required TResult Function() payment,
    required TResult Function(DiscountType dicountType) updateDiscountType,
    required TResult Function(String amount) updateDiscountAmount,
    required TResult Function(PaymentType paymentType) updatePaymentType,
    required TResult Function(double hourPrice) upadeHourPrice,
    required TResult Function(Map<String, DateTime> timestamps)
        itemTimestampsLoaded,
  }) {
    return itemTimestampsLoaded(timestamps);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String? tableId, String? orderId)? started,
    TResult? Function(String symbol)? updateEnterSum,
    TResult? Function()? getDetail,
    TResult? Function()? payment,
    TResult? Function(DiscountType dicountType)? updateDiscountType,
    TResult? Function(String amount)? updateDiscountAmount,
    TResult? Function(PaymentType paymentType)? updatePaymentType,
    TResult? Function(double hourPrice)? upadeHourPrice,
    TResult? Function(Map<String, DateTime> timestamps)? itemTimestampsLoaded,
  }) {
    return itemTimestampsLoaded?.call(timestamps);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String? tableId, String? orderId)? started,
    TResult Function(String symbol)? updateEnterSum,
    TResult Function()? getDetail,
    TResult Function()? payment,
    TResult Function(DiscountType dicountType)? updateDiscountType,
    TResult Function(String amount)? updateDiscountAmount,
    TResult Function(PaymentType paymentType)? updatePaymentType,
    TResult Function(double hourPrice)? upadeHourPrice,
    TResult Function(Map<String, DateTime> timestamps)? itemTimestampsLoaded,
    required TResult orElse(),
  }) {
    if (itemTimestampsLoaded != null) {
      return itemTimestampsLoaded(timestamps);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_UpdateEnterSum value) updateEnterSum,
    required TResult Function(_GetDetail value) getDetail,
    required TResult Function(_Payment value) payment,
    required TResult Function(_DiscountType value) updateDiscountType,
    required TResult Function(_UpdateDiscountAmount value) updateDiscountAmount,
    required TResult Function(_UpdatePaymentType value) updatePaymentType,
    required TResult Function(_UpdateHourPrice value) upadeHourPrice,
    required TResult Function(_ItemTimestampsLoaded value) itemTimestampsLoaded,
  }) {
    return itemTimestampsLoaded(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_UpdateEnterSum value)? updateEnterSum,
    TResult? Function(_GetDetail value)? getDetail,
    TResult? Function(_Payment value)? payment,
    TResult? Function(_DiscountType value)? updateDiscountType,
    TResult? Function(_UpdateDiscountAmount value)? updateDiscountAmount,
    TResult? Function(_UpdatePaymentType value)? updatePaymentType,
    TResult? Function(_UpdateHourPrice value)? upadeHourPrice,
    TResult? Function(_ItemTimestampsLoaded value)? itemTimestampsLoaded,
  }) {
    return itemTimestampsLoaded?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_UpdateEnterSum value)? updateEnterSum,
    TResult Function(_GetDetail value)? getDetail,
    TResult Function(_Payment value)? payment,
    TResult Function(_DiscountType value)? updateDiscountType,
    TResult Function(_UpdateDiscountAmount value)? updateDiscountAmount,
    TResult Function(_UpdatePaymentType value)? updatePaymentType,
    TResult Function(_UpdateHourPrice value)? upadeHourPrice,
    TResult Function(_ItemTimestampsLoaded value)? itemTimestampsLoaded,
    required TResult orElse(),
  }) {
    if (itemTimestampsLoaded != null) {
      return itemTimestampsLoaded(this);
    }
    return orElse();
  }
}

abstract class _ItemTimestampsLoaded implements PaymentEvent {
  const factory _ItemTimestampsLoaded(
          {required final Map<String, DateTime> timestamps}) =
      _$ItemTimestampsLoadedImpl;

  Map<String, DateTime> get timestamps;
  @JsonKey(ignore: true)
  _$$ItemTimestampsLoadedImplCopyWith<_$ItemTimestampsLoadedImpl>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
mixin _$PaymentState {
  Status get status => throw _privateConstructorUsedError;
  Status get detailStatus => throw _privateConstructorUsedError;
  ArchiveDetailEntity? get detail => throw _privateConstructorUsedError;
  String? get tableId => throw _privateConstructorUsedError;
  String? get orderId => throw _privateConstructorUsedError;
  TextEditingController? get textController =>
      throw _privateConstructorUsedError;
  String get discountAmount => throw _privateConstructorUsedError;
  PaymentType get paymentType => throw _privateConstructorUsedError;
  String get enterSum => throw _privateConstructorUsedError;
  int get returnAmount => throw _privateConstructorUsedError;
  DiscountType get discountType => throw _privateConstructorUsedError;
  double get hourPrice =>
      throw _privateConstructorUsedError; // Item nomi -> eng erta urilgan vaqt. `/order-items/order/{id}` dan
// olinadi; `/bills/{id}` items'da `created_at` yo'q.
  Map<String, DateTime> get itemTimestamps =>
      throw _privateConstructorUsedError;
  Failure? get failure => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $PaymentStateCopyWith<PaymentState> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PaymentStateCopyWith<$Res> {
  factory $PaymentStateCopyWith(
          PaymentState value, $Res Function(PaymentState) then) =
      _$PaymentStateCopyWithImpl<$Res, PaymentState>;
  @useResult
  $Res call(
      {Status status,
      Status detailStatus,
      ArchiveDetailEntity? detail,
      String? tableId,
      String? orderId,
      TextEditingController? textController,
      String discountAmount,
      PaymentType paymentType,
      String enterSum,
      int returnAmount,
      DiscountType discountType,
      double hourPrice,
      Map<String, DateTime> itemTimestamps,
      Failure? failure});
}

/// @nodoc
class _$PaymentStateCopyWithImpl<$Res, $Val extends PaymentState>
    implements $PaymentStateCopyWith<$Res> {
  _$PaymentStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = null,
    Object? detailStatus = null,
    Object? detail = freezed,
    Object? tableId = freezed,
    Object? orderId = freezed,
    Object? textController = freezed,
    Object? discountAmount = null,
    Object? paymentType = null,
    Object? enterSum = null,
    Object? returnAmount = null,
    Object? discountType = null,
    Object? hourPrice = null,
    Object? itemTimestamps = null,
    Object? failure = freezed,
  }) {
    return _then(_value.copyWith(
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as Status,
      detailStatus: null == detailStatus
          ? _value.detailStatus
          : detailStatus // ignore: cast_nullable_to_non_nullable
              as Status,
      detail: freezed == detail
          ? _value.detail
          : detail // ignore: cast_nullable_to_non_nullable
              as ArchiveDetailEntity?,
      tableId: freezed == tableId
          ? _value.tableId
          : tableId // ignore: cast_nullable_to_non_nullable
              as String?,
      orderId: freezed == orderId
          ? _value.orderId
          : orderId // ignore: cast_nullable_to_non_nullable
              as String?,
      textController: freezed == textController
          ? _value.textController
          : textController // ignore: cast_nullable_to_non_nullable
              as TextEditingController?,
      discountAmount: null == discountAmount
          ? _value.discountAmount
          : discountAmount // ignore: cast_nullable_to_non_nullable
              as String,
      paymentType: null == paymentType
          ? _value.paymentType
          : paymentType // ignore: cast_nullable_to_non_nullable
              as PaymentType,
      enterSum: null == enterSum
          ? _value.enterSum
          : enterSum // ignore: cast_nullable_to_non_nullable
              as String,
      returnAmount: null == returnAmount
          ? _value.returnAmount
          : returnAmount // ignore: cast_nullable_to_non_nullable
              as int,
      discountType: null == discountType
          ? _value.discountType
          : discountType // ignore: cast_nullable_to_non_nullable
              as DiscountType,
      hourPrice: null == hourPrice
          ? _value.hourPrice
          : hourPrice // ignore: cast_nullable_to_non_nullable
              as double,
      itemTimestamps: null == itemTimestamps
          ? _value.itemTimestamps
          : itemTimestamps // ignore: cast_nullable_to_non_nullable
              as Map<String, DateTime>,
      failure: freezed == failure
          ? _value.failure
          : failure // ignore: cast_nullable_to_non_nullable
              as Failure?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$PaymentStateImplCopyWith<$Res>
    implements $PaymentStateCopyWith<$Res> {
  factory _$$PaymentStateImplCopyWith(
          _$PaymentStateImpl value, $Res Function(_$PaymentStateImpl) then) =
      __$$PaymentStateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {Status status,
      Status detailStatus,
      ArchiveDetailEntity? detail,
      String? tableId,
      String? orderId,
      TextEditingController? textController,
      String discountAmount,
      PaymentType paymentType,
      String enterSum,
      int returnAmount,
      DiscountType discountType,
      double hourPrice,
      Map<String, DateTime> itemTimestamps,
      Failure? failure});
}

/// @nodoc
class __$$PaymentStateImplCopyWithImpl<$Res>
    extends _$PaymentStateCopyWithImpl<$Res, _$PaymentStateImpl>
    implements _$$PaymentStateImplCopyWith<$Res> {
  __$$PaymentStateImplCopyWithImpl(
      _$PaymentStateImpl _value, $Res Function(_$PaymentStateImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = null,
    Object? detailStatus = null,
    Object? detail = freezed,
    Object? tableId = freezed,
    Object? orderId = freezed,
    Object? textController = freezed,
    Object? discountAmount = null,
    Object? paymentType = null,
    Object? enterSum = null,
    Object? returnAmount = null,
    Object? discountType = null,
    Object? hourPrice = null,
    Object? itemTimestamps = null,
    Object? failure = freezed,
  }) {
    return _then(_$PaymentStateImpl(
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as Status,
      detailStatus: null == detailStatus
          ? _value.detailStatus
          : detailStatus // ignore: cast_nullable_to_non_nullable
              as Status,
      detail: freezed == detail
          ? _value.detail
          : detail // ignore: cast_nullable_to_non_nullable
              as ArchiveDetailEntity?,
      tableId: freezed == tableId
          ? _value.tableId
          : tableId // ignore: cast_nullable_to_non_nullable
              as String?,
      orderId: freezed == orderId
          ? _value.orderId
          : orderId // ignore: cast_nullable_to_non_nullable
              as String?,
      textController: freezed == textController
          ? _value.textController
          : textController // ignore: cast_nullable_to_non_nullable
              as TextEditingController?,
      discountAmount: null == discountAmount
          ? _value.discountAmount
          : discountAmount // ignore: cast_nullable_to_non_nullable
              as String,
      paymentType: null == paymentType
          ? _value.paymentType
          : paymentType // ignore: cast_nullable_to_non_nullable
              as PaymentType,
      enterSum: null == enterSum
          ? _value.enterSum
          : enterSum // ignore: cast_nullable_to_non_nullable
              as String,
      returnAmount: null == returnAmount
          ? _value.returnAmount
          : returnAmount // ignore: cast_nullable_to_non_nullable
              as int,
      discountType: null == discountType
          ? _value.discountType
          : discountType // ignore: cast_nullable_to_non_nullable
              as DiscountType,
      hourPrice: null == hourPrice
          ? _value.hourPrice
          : hourPrice // ignore: cast_nullable_to_non_nullable
              as double,
      itemTimestamps: null == itemTimestamps
          ? _value._itemTimestamps
          : itemTimestamps // ignore: cast_nullable_to_non_nullable
              as Map<String, DateTime>,
      failure: freezed == failure
          ? _value.failure
          : failure // ignore: cast_nullable_to_non_nullable
              as Failure?,
    ));
  }
}

/// @nodoc

class _$PaymentStateImpl implements _PaymentState {
  const _$PaymentStateImpl(
      {this.status = Status.UNKNOWN,
      this.detailStatus = Status.UNKNOWN,
      this.detail,
      this.tableId,
      this.orderId,
      this.textController,
      this.discountAmount = '0',
      this.paymentType = PaymentType.cash,
      this.enterSum = '0',
      this.returnAmount = 0,
      this.discountType = DiscountType.money,
      this.hourPrice = 0,
      final Map<String, DateTime> itemTimestamps = const <String, DateTime>{},
      this.failure})
      : _itemTimestamps = itemTimestamps;

  @override
  @JsonKey()
  final Status status;
  @override
  @JsonKey()
  final Status detailStatus;
  @override
  final ArchiveDetailEntity? detail;
  @override
  final String? tableId;
  @override
  final String? orderId;
  @override
  final TextEditingController? textController;
  @override
  @JsonKey()
  final String discountAmount;
  @override
  @JsonKey()
  final PaymentType paymentType;
  @override
  @JsonKey()
  final String enterSum;
  @override
  @JsonKey()
  final int returnAmount;
  @override
  @JsonKey()
  final DiscountType discountType;
  @override
  @JsonKey()
  final double hourPrice;
// Item nomi -> eng erta urilgan vaqt. `/order-items/order/{id}` dan
// olinadi; `/bills/{id}` items'da `created_at` yo'q.
  final Map<String, DateTime> _itemTimestamps;
// Item nomi -> eng erta urilgan vaqt. `/order-items/order/{id}` dan
// olinadi; `/bills/{id}` items'da `created_at` yo'q.
  @override
  @JsonKey()
  Map<String, DateTime> get itemTimestamps {
    if (_itemTimestamps is EqualUnmodifiableMapView) return _itemTimestamps;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(_itemTimestamps);
  }

  @override
  final Failure? failure;

  @override
  String toString() {
    return 'PaymentState(status: $status, detailStatus: $detailStatus, detail: $detail, tableId: $tableId, orderId: $orderId, textController: $textController, discountAmount: $discountAmount, paymentType: $paymentType, enterSum: $enterSum, returnAmount: $returnAmount, discountType: $discountType, hourPrice: $hourPrice, itemTimestamps: $itemTimestamps, failure: $failure)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PaymentStateImpl &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.detailStatus, detailStatus) ||
                other.detailStatus == detailStatus) &&
            (identical(other.detail, detail) || other.detail == detail) &&
            (identical(other.tableId, tableId) || other.tableId == tableId) &&
            (identical(other.orderId, orderId) || other.orderId == orderId) &&
            (identical(other.textController, textController) ||
                other.textController == textController) &&
            (identical(other.discountAmount, discountAmount) ||
                other.discountAmount == discountAmount) &&
            (identical(other.paymentType, paymentType) ||
                other.paymentType == paymentType) &&
            (identical(other.enterSum, enterSum) ||
                other.enterSum == enterSum) &&
            (identical(other.returnAmount, returnAmount) ||
                other.returnAmount == returnAmount) &&
            (identical(other.discountType, discountType) ||
                other.discountType == discountType) &&
            (identical(other.hourPrice, hourPrice) ||
                other.hourPrice == hourPrice) &&
            const DeepCollectionEquality()
                .equals(other._itemTimestamps, _itemTimestamps) &&
            (identical(other.failure, failure) || other.failure == failure));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      status,
      detailStatus,
      detail,
      tableId,
      orderId,
      textController,
      discountAmount,
      paymentType,
      enterSum,
      returnAmount,
      discountType,
      hourPrice,
      const DeepCollectionEquality().hash(_itemTimestamps),
      failure);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$PaymentStateImplCopyWith<_$PaymentStateImpl> get copyWith =>
      __$$PaymentStateImplCopyWithImpl<_$PaymentStateImpl>(this, _$identity);
}

abstract class _PaymentState implements PaymentState {
  const factory _PaymentState(
      {final Status status,
      final Status detailStatus,
      final ArchiveDetailEntity? detail,
      final String? tableId,
      final String? orderId,
      final TextEditingController? textController,
      final String discountAmount,
      final PaymentType paymentType,
      final String enterSum,
      final int returnAmount,
      final DiscountType discountType,
      final double hourPrice,
      final Map<String, DateTime> itemTimestamps,
      final Failure? failure}) = _$PaymentStateImpl;

  @override
  Status get status;
  @override
  Status get detailStatus;
  @override
  ArchiveDetailEntity? get detail;
  @override
  String? get tableId;
  @override
  String? get orderId;
  @override
  TextEditingController? get textController;
  @override
  String get discountAmount;
  @override
  PaymentType get paymentType;
  @override
  String get enterSum;
  @override
  int get returnAmount;
  @override
  DiscountType get discountType;
  @override
  double get hourPrice;
  @override // Item nomi -> eng erta urilgan vaqt. `/order-items/order/{id}` dan
// olinadi; `/bills/{id}` items'da `created_at` yo'q.
  Map<String, DateTime> get itemTimestamps;
  @override
  Failure? get failure;
  @override
  @JsonKey(ignore: true)
  _$$PaymentStateImplCopyWith<_$PaymentStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
