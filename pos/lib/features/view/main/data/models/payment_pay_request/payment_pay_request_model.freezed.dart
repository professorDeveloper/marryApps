// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'payment_pay_request_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

PaymentPayRequestModel _$PaymentPayRequestModelFromJson(
    Map<String, dynamic> json) {
  return _PaymentPayRequestModel.fromJson(json);
}

/// @nodoc
mixin _$PaymentPayRequestModel {
  @JsonKey(name: 'order_id')
  String get orderId => throw _privateConstructorUsedError;
  @JsonKey(name: 'cash_register_id')
  String get cashRegisterId => throw _privateConstructorUsedError;
  @JsonKey(name: 'cashier_id')
  String get cashierId => throw _privateConstructorUsedError;
  @JsonKey(name: 'customer_paid_amount')
  int get customPaidAmount => throw _privateConstructorUsedError;
  @JsonKey(name: 'discount_amount')
  int get discountAmount => throw _privateConstructorUsedError;
  @JsonKey(name: 'discount_percent')
  int get discountPercent => throw _privateConstructorUsedError;
  @JsonKey(name: 'payment_type')
  PaymentType get paymentType => throw _privateConstructorUsedError;
  String get comment => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $PaymentPayRequestModelCopyWith<PaymentPayRequestModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PaymentPayRequestModelCopyWith<$Res> {
  factory $PaymentPayRequestModelCopyWith(PaymentPayRequestModel value,
          $Res Function(PaymentPayRequestModel) then) =
      _$PaymentPayRequestModelCopyWithImpl<$Res, PaymentPayRequestModel>;
  @useResult
  $Res call(
      {@JsonKey(name: 'order_id') String orderId,
      @JsonKey(name: 'cash_register_id') String cashRegisterId,
      @JsonKey(name: 'cashier_id') String cashierId,
      @JsonKey(name: 'customer_paid_amount') int customPaidAmount,
      @JsonKey(name: 'discount_amount') int discountAmount,
      @JsonKey(name: 'discount_percent') int discountPercent,
      @JsonKey(name: 'payment_type') PaymentType paymentType,
      String comment});
}

/// @nodoc
class _$PaymentPayRequestModelCopyWithImpl<$Res,
        $Val extends PaymentPayRequestModel>
    implements $PaymentPayRequestModelCopyWith<$Res> {
  _$PaymentPayRequestModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? orderId = null,
    Object? cashRegisterId = null,
    Object? cashierId = null,
    Object? customPaidAmount = null,
    Object? discountAmount = null,
    Object? discountPercent = null,
    Object? paymentType = null,
    Object? comment = null,
  }) {
    return _then(_value.copyWith(
      orderId: null == orderId
          ? _value.orderId
          : orderId // ignore: cast_nullable_to_non_nullable
              as String,
      cashRegisterId: null == cashRegisterId
          ? _value.cashRegisterId
          : cashRegisterId // ignore: cast_nullable_to_non_nullable
              as String,
      cashierId: null == cashierId
          ? _value.cashierId
          : cashierId // ignore: cast_nullable_to_non_nullable
              as String,
      customPaidAmount: null == customPaidAmount
          ? _value.customPaidAmount
          : customPaidAmount // ignore: cast_nullable_to_non_nullable
              as int,
      discountAmount: null == discountAmount
          ? _value.discountAmount
          : discountAmount // ignore: cast_nullable_to_non_nullable
              as int,
      discountPercent: null == discountPercent
          ? _value.discountPercent
          : discountPercent // ignore: cast_nullable_to_non_nullable
              as int,
      paymentType: null == paymentType
          ? _value.paymentType
          : paymentType // ignore: cast_nullable_to_non_nullable
              as PaymentType,
      comment: null == comment
          ? _value.comment
          : comment // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$PaymentPayRequestModelImplCopyWith<$Res>
    implements $PaymentPayRequestModelCopyWith<$Res> {
  factory _$$PaymentPayRequestModelImplCopyWith(
          _$PaymentPayRequestModelImpl value,
          $Res Function(_$PaymentPayRequestModelImpl) then) =
      __$$PaymentPayRequestModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@JsonKey(name: 'order_id') String orderId,
      @JsonKey(name: 'cash_register_id') String cashRegisterId,
      @JsonKey(name: 'cashier_id') String cashierId,
      @JsonKey(name: 'customer_paid_amount') int customPaidAmount,
      @JsonKey(name: 'discount_amount') int discountAmount,
      @JsonKey(name: 'discount_percent') int discountPercent,
      @JsonKey(name: 'payment_type') PaymentType paymentType,
      String comment});
}

/// @nodoc
class __$$PaymentPayRequestModelImplCopyWithImpl<$Res>
    extends _$PaymentPayRequestModelCopyWithImpl<$Res,
        _$PaymentPayRequestModelImpl>
    implements _$$PaymentPayRequestModelImplCopyWith<$Res> {
  __$$PaymentPayRequestModelImplCopyWithImpl(
      _$PaymentPayRequestModelImpl _value,
      $Res Function(_$PaymentPayRequestModelImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? orderId = null,
    Object? cashRegisterId = null,
    Object? cashierId = null,
    Object? customPaidAmount = null,
    Object? discountAmount = null,
    Object? discountPercent = null,
    Object? paymentType = null,
    Object? comment = null,
  }) {
    return _then(_$PaymentPayRequestModelImpl(
      orderId: null == orderId
          ? _value.orderId
          : orderId // ignore: cast_nullable_to_non_nullable
              as String,
      cashRegisterId: null == cashRegisterId
          ? _value.cashRegisterId
          : cashRegisterId // ignore: cast_nullable_to_non_nullable
              as String,
      cashierId: null == cashierId
          ? _value.cashierId
          : cashierId // ignore: cast_nullable_to_non_nullable
              as String,
      customPaidAmount: null == customPaidAmount
          ? _value.customPaidAmount
          : customPaidAmount // ignore: cast_nullable_to_non_nullable
              as int,
      discountAmount: null == discountAmount
          ? _value.discountAmount
          : discountAmount // ignore: cast_nullable_to_non_nullable
              as int,
      discountPercent: null == discountPercent
          ? _value.discountPercent
          : discountPercent // ignore: cast_nullable_to_non_nullable
              as int,
      paymentType: null == paymentType
          ? _value.paymentType
          : paymentType // ignore: cast_nullable_to_non_nullable
              as PaymentType,
      comment: null == comment
          ? _value.comment
          : comment // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$PaymentPayRequestModelImpl extends _PaymentPayRequestModel {
  const _$PaymentPayRequestModelImpl(
      {@JsonKey(name: 'order_id') this.orderId = '',
      @JsonKey(name: 'cash_register_id') this.cashRegisterId = '',
      @JsonKey(name: 'cashier_id') this.cashierId = '',
      @JsonKey(name: 'customer_paid_amount') this.customPaidAmount = 0,
      @JsonKey(name: 'discount_amount') this.discountAmount = 0,
      @JsonKey(name: 'discount_percent') this.discountPercent = 0,
      @JsonKey(name: 'payment_type') this.paymentType = PaymentType.cash,
      this.comment = ''})
      : super._();

  factory _$PaymentPayRequestModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$PaymentPayRequestModelImplFromJson(json);

  @override
  @JsonKey(name: 'order_id')
  final String orderId;
  @override
  @JsonKey(name: 'cash_register_id')
  final String cashRegisterId;
  @override
  @JsonKey(name: 'cashier_id')
  final String cashierId;
  @override
  @JsonKey(name: 'customer_paid_amount')
  final int customPaidAmount;
  @override
  @JsonKey(name: 'discount_amount')
  final int discountAmount;
  @override
  @JsonKey(name: 'discount_percent')
  final int discountPercent;
  @override
  @JsonKey(name: 'payment_type')
  final PaymentType paymentType;
  @override
  @JsonKey()
  final String comment;

  @override
  String toString() {
    return 'PaymentPayRequestModel(orderId: $orderId, cashRegisterId: $cashRegisterId, cashierId: $cashierId, customPaidAmount: $customPaidAmount, discountAmount: $discountAmount, discountPercent: $discountPercent, paymentType: $paymentType, comment: $comment)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PaymentPayRequestModelImpl &&
            (identical(other.orderId, orderId) || other.orderId == orderId) &&
            (identical(other.cashRegisterId, cashRegisterId) ||
                other.cashRegisterId == cashRegisterId) &&
            (identical(other.cashierId, cashierId) ||
                other.cashierId == cashierId) &&
            (identical(other.customPaidAmount, customPaidAmount) ||
                other.customPaidAmount == customPaidAmount) &&
            (identical(other.discountAmount, discountAmount) ||
                other.discountAmount == discountAmount) &&
            (identical(other.discountPercent, discountPercent) ||
                other.discountPercent == discountPercent) &&
            (identical(other.paymentType, paymentType) ||
                other.paymentType == paymentType) &&
            (identical(other.comment, comment) || other.comment == comment));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      orderId,
      cashRegisterId,
      cashierId,
      customPaidAmount,
      discountAmount,
      discountPercent,
      paymentType,
      comment);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$PaymentPayRequestModelImplCopyWith<_$PaymentPayRequestModelImpl>
      get copyWith => __$$PaymentPayRequestModelImplCopyWithImpl<
          _$PaymentPayRequestModelImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$PaymentPayRequestModelImplToJson(
      this,
    );
  }
}

abstract class _PaymentPayRequestModel extends PaymentPayRequestModel {
  const factory _PaymentPayRequestModel(
      {@JsonKey(name: 'order_id') final String orderId,
      @JsonKey(name: 'cash_register_id') final String cashRegisterId,
      @JsonKey(name: 'cashier_id') final String cashierId,
      @JsonKey(name: 'customer_paid_amount') final int customPaidAmount,
      @JsonKey(name: 'discount_amount') final int discountAmount,
      @JsonKey(name: 'discount_percent') final int discountPercent,
      @JsonKey(name: 'payment_type') final PaymentType paymentType,
      final String comment}) = _$PaymentPayRequestModelImpl;
  const _PaymentPayRequestModel._() : super._();

  factory _PaymentPayRequestModel.fromJson(Map<String, dynamic> json) =
      _$PaymentPayRequestModelImpl.fromJson;

  @override
  @JsonKey(name: 'order_id')
  String get orderId;
  @override
  @JsonKey(name: 'cash_register_id')
  String get cashRegisterId;
  @override
  @JsonKey(name: 'cashier_id')
  String get cashierId;
  @override
  @JsonKey(name: 'customer_paid_amount')
  int get customPaidAmount;
  @override
  @JsonKey(name: 'discount_amount')
  int get discountAmount;
  @override
  @JsonKey(name: 'discount_percent')
  int get discountPercent;
  @override
  @JsonKey(name: 'payment_type')
  PaymentType get paymentType;
  @override
  String get comment;
  @override
  @JsonKey(ignore: true)
  _$$PaymentPayRequestModelImplCopyWith<_$PaymentPayRequestModelImpl>
      get copyWith => throw _privateConstructorUsedError;
}
