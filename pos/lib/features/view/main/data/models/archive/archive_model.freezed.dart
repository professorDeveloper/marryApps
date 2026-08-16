// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'archive_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

ArchiveModel _$ArchiveModelFromJson(Map<String, dynamic> json) {
  return _ArchiveModel.fromJson(json);
}

/// @nodoc
mixin _$ArchiveModel {
  String get id => throw _privateConstructorUsedError;
  @JsonKey(name: 'bill_no', fromJson: parseInt)
  int get bilNumber => throw _privateConstructorUsedError;
  @JsonKey(name: "bill_status")
  OrderStatus get status => throw _privateConstructorUsedError;
  @JsonKey(name: "opened_at", fromJson: _parseLocal)
  DateTime? get opened => throw _privateConstructorUsedError;
  @JsonKey(name: 'table_number', fromJson: parseInt)
  int get tableNumber => throw _privateConstructorUsedError;
  @JsonKey(name: 'grand_total', fromJson: parseInt)
  int get totalPrice => throw _privateConstructorUsedError;
  @JsonKey(name: "food_total", fromJson: parseInt)
  int get goodsTotal => throw _privateConstructorUsedError;
  @JsonKey(name: "service_amount", fromJson: parseInt)
  int get serviceAmount => throw _privateConstructorUsedError;
  @JsonKey(name: "discount_amount", fromJson: parseInt)
  int get discountAmount => throw _privateConstructorUsedError;
  @JsonKey(name: "quantity", fromJson: parseInt)
  int get goodsQuantity => throw _privateConstructorUsedError;
  @JsonKey(name: "customer_paid_amount", fromJson: parseInt)
  int get customerPaidAmount => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ArchiveModelCopyWith<ArchiveModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ArchiveModelCopyWith<$Res> {
  factory $ArchiveModelCopyWith(
          ArchiveModel value, $Res Function(ArchiveModel) then) =
      _$ArchiveModelCopyWithImpl<$Res, ArchiveModel>;
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: 'bill_no', fromJson: parseInt) int bilNumber,
      @JsonKey(name: "bill_status") OrderStatus status,
      @JsonKey(name: "opened_at", fromJson: _parseLocal) DateTime? opened,
      @JsonKey(name: 'table_number', fromJson: parseInt) int tableNumber,
      @JsonKey(name: 'grand_total', fromJson: parseInt) int totalPrice,
      @JsonKey(name: "food_total", fromJson: parseInt) int goodsTotal,
      @JsonKey(name: "service_amount", fromJson: parseInt) int serviceAmount,
      @JsonKey(name: "discount_amount", fromJson: parseInt) int discountAmount,
      @JsonKey(name: "quantity", fromJson: parseInt) int goodsQuantity,
      @JsonKey(name: "customer_paid_amount", fromJson: parseInt)
      int customerPaidAmount});
}

/// @nodoc
class _$ArchiveModelCopyWithImpl<$Res, $Val extends ArchiveModel>
    implements $ArchiveModelCopyWith<$Res> {
  _$ArchiveModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? bilNumber = null,
    Object? status = null,
    Object? opened = freezed,
    Object? tableNumber = null,
    Object? totalPrice = null,
    Object? goodsTotal = null,
    Object? serviceAmount = null,
    Object? discountAmount = null,
    Object? goodsQuantity = null,
    Object? customerPaidAmount = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      bilNumber: null == bilNumber
          ? _value.bilNumber
          : bilNumber // ignore: cast_nullable_to_non_nullable
              as int,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as OrderStatus,
      opened: freezed == opened
          ? _value.opened
          : opened // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      tableNumber: null == tableNumber
          ? _value.tableNumber
          : tableNumber // ignore: cast_nullable_to_non_nullable
              as int,
      totalPrice: null == totalPrice
          ? _value.totalPrice
          : totalPrice // ignore: cast_nullable_to_non_nullable
              as int,
      goodsTotal: null == goodsTotal
          ? _value.goodsTotal
          : goodsTotal // ignore: cast_nullable_to_non_nullable
              as int,
      serviceAmount: null == serviceAmount
          ? _value.serviceAmount
          : serviceAmount // ignore: cast_nullable_to_non_nullable
              as int,
      discountAmount: null == discountAmount
          ? _value.discountAmount
          : discountAmount // ignore: cast_nullable_to_non_nullable
              as int,
      goodsQuantity: null == goodsQuantity
          ? _value.goodsQuantity
          : goodsQuantity // ignore: cast_nullable_to_non_nullable
              as int,
      customerPaidAmount: null == customerPaidAmount
          ? _value.customerPaidAmount
          : customerPaidAmount // ignore: cast_nullable_to_non_nullable
              as int,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ArchiveModelImplCopyWith<$Res>
    implements $ArchiveModelCopyWith<$Res> {
  factory _$$ArchiveModelImplCopyWith(
          _$ArchiveModelImpl value, $Res Function(_$ArchiveModelImpl) then) =
      __$$ArchiveModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: 'bill_no', fromJson: parseInt) int bilNumber,
      @JsonKey(name: "bill_status") OrderStatus status,
      @JsonKey(name: "opened_at", fromJson: _parseLocal) DateTime? opened,
      @JsonKey(name: 'table_number', fromJson: parseInt) int tableNumber,
      @JsonKey(name: 'grand_total', fromJson: parseInt) int totalPrice,
      @JsonKey(name: "food_total", fromJson: parseInt) int goodsTotal,
      @JsonKey(name: "service_amount", fromJson: parseInt) int serviceAmount,
      @JsonKey(name: "discount_amount", fromJson: parseInt) int discountAmount,
      @JsonKey(name: "quantity", fromJson: parseInt) int goodsQuantity,
      @JsonKey(name: "customer_paid_amount", fromJson: parseInt)
      int customerPaidAmount});
}

/// @nodoc
class __$$ArchiveModelImplCopyWithImpl<$Res>
    extends _$ArchiveModelCopyWithImpl<$Res, _$ArchiveModelImpl>
    implements _$$ArchiveModelImplCopyWith<$Res> {
  __$$ArchiveModelImplCopyWithImpl(
      _$ArchiveModelImpl _value, $Res Function(_$ArchiveModelImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? bilNumber = null,
    Object? status = null,
    Object? opened = freezed,
    Object? tableNumber = null,
    Object? totalPrice = null,
    Object? goodsTotal = null,
    Object? serviceAmount = null,
    Object? discountAmount = null,
    Object? goodsQuantity = null,
    Object? customerPaidAmount = null,
  }) {
    return _then(_$ArchiveModelImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      bilNumber: null == bilNumber
          ? _value.bilNumber
          : bilNumber // ignore: cast_nullable_to_non_nullable
              as int,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as OrderStatus,
      opened: freezed == opened
          ? _value.opened
          : opened // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      tableNumber: null == tableNumber
          ? _value.tableNumber
          : tableNumber // ignore: cast_nullable_to_non_nullable
              as int,
      totalPrice: null == totalPrice
          ? _value.totalPrice
          : totalPrice // ignore: cast_nullable_to_non_nullable
              as int,
      goodsTotal: null == goodsTotal
          ? _value.goodsTotal
          : goodsTotal // ignore: cast_nullable_to_non_nullable
              as int,
      serviceAmount: null == serviceAmount
          ? _value.serviceAmount
          : serviceAmount // ignore: cast_nullable_to_non_nullable
              as int,
      discountAmount: null == discountAmount
          ? _value.discountAmount
          : discountAmount // ignore: cast_nullable_to_non_nullable
              as int,
      goodsQuantity: null == goodsQuantity
          ? _value.goodsQuantity
          : goodsQuantity // ignore: cast_nullable_to_non_nullable
              as int,
      customerPaidAmount: null == customerPaidAmount
          ? _value.customerPaidAmount
          : customerPaidAmount // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ArchiveModelImpl extends _ArchiveModel {
  const _$ArchiveModelImpl(
      {this.id = '',
      @JsonKey(name: 'bill_no', fromJson: parseInt) this.bilNumber = 0,
      @JsonKey(name: "bill_status") this.status = OrderStatus.none,
      @JsonKey(name: "opened_at", fromJson: _parseLocal) this.opened,
      @JsonKey(name: 'table_number', fromJson: parseInt) this.tableNumber = 0,
      @JsonKey(name: 'grand_total', fromJson: parseInt) this.totalPrice = 0,
      @JsonKey(name: "food_total", fromJson: parseInt) this.goodsTotal = 0,
      @JsonKey(name: "service_amount", fromJson: parseInt)
      this.serviceAmount = 0,
      @JsonKey(name: "discount_amount", fromJson: parseInt)
      this.discountAmount = 0,
      @JsonKey(name: "quantity", fromJson: parseInt) this.goodsQuantity = 0,
      @JsonKey(name: "customer_paid_amount", fromJson: parseInt)
      this.customerPaidAmount = 0})
      : super._();

  factory _$ArchiveModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$ArchiveModelImplFromJson(json);

  @override
  @JsonKey()
  final String id;
  @override
  @JsonKey(name: 'bill_no', fromJson: parseInt)
  final int bilNumber;
  @override
  @JsonKey(name: "bill_status")
  final OrderStatus status;
  @override
  @JsonKey(name: "opened_at", fromJson: _parseLocal)
  final DateTime? opened;
  @override
  @JsonKey(name: 'table_number', fromJson: parseInt)
  final int tableNumber;
  @override
  @JsonKey(name: 'grand_total', fromJson: parseInt)
  final int totalPrice;
  @override
  @JsonKey(name: "food_total", fromJson: parseInt)
  final int goodsTotal;
  @override
  @JsonKey(name: "service_amount", fromJson: parseInt)
  final int serviceAmount;
  @override
  @JsonKey(name: "discount_amount", fromJson: parseInt)
  final int discountAmount;
  @override
  @JsonKey(name: "quantity", fromJson: parseInt)
  final int goodsQuantity;
  @override
  @JsonKey(name: "customer_paid_amount", fromJson: parseInt)
  final int customerPaidAmount;

  @override
  String toString() {
    return 'ArchiveModel(id: $id, bilNumber: $bilNumber, status: $status, opened: $opened, tableNumber: $tableNumber, totalPrice: $totalPrice, goodsTotal: $goodsTotal, serviceAmount: $serviceAmount, discountAmount: $discountAmount, goodsQuantity: $goodsQuantity, customerPaidAmount: $customerPaidAmount)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ArchiveModelImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.bilNumber, bilNumber) ||
                other.bilNumber == bilNumber) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.opened, opened) || other.opened == opened) &&
            (identical(other.tableNumber, tableNumber) ||
                other.tableNumber == tableNumber) &&
            (identical(other.totalPrice, totalPrice) ||
                other.totalPrice == totalPrice) &&
            (identical(other.goodsTotal, goodsTotal) ||
                other.goodsTotal == goodsTotal) &&
            (identical(other.serviceAmount, serviceAmount) ||
                other.serviceAmount == serviceAmount) &&
            (identical(other.discountAmount, discountAmount) ||
                other.discountAmount == discountAmount) &&
            (identical(other.goodsQuantity, goodsQuantity) ||
                other.goodsQuantity == goodsQuantity) &&
            (identical(other.customerPaidAmount, customerPaidAmount) ||
                other.customerPaidAmount == customerPaidAmount));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      bilNumber,
      status,
      opened,
      tableNumber,
      totalPrice,
      goodsTotal,
      serviceAmount,
      discountAmount,
      goodsQuantity,
      customerPaidAmount);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ArchiveModelImplCopyWith<_$ArchiveModelImpl> get copyWith =>
      __$$ArchiveModelImplCopyWithImpl<_$ArchiveModelImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ArchiveModelImplToJson(
      this,
    );
  }
}

abstract class _ArchiveModel extends ArchiveModel {
  const factory _ArchiveModel(
      {final String id,
      @JsonKey(name: 'bill_no', fromJson: parseInt) final int bilNumber,
      @JsonKey(name: "bill_status") final OrderStatus status,
      @JsonKey(name: "opened_at", fromJson: _parseLocal) final DateTime? opened,
      @JsonKey(name: 'table_number', fromJson: parseInt) final int tableNumber,
      @JsonKey(name: 'grand_total', fromJson: parseInt) final int totalPrice,
      @JsonKey(name: "food_total", fromJson: parseInt) final int goodsTotal,
      @JsonKey(name: "service_amount", fromJson: parseInt)
      final int serviceAmount,
      @JsonKey(name: "discount_amount", fromJson: parseInt)
      final int discountAmount,
      @JsonKey(name: "quantity", fromJson: parseInt) final int goodsQuantity,
      @JsonKey(name: "customer_paid_amount", fromJson: parseInt)
      final int customerPaidAmount}) = _$ArchiveModelImpl;
  const _ArchiveModel._() : super._();

  factory _ArchiveModel.fromJson(Map<String, dynamic> json) =
      _$ArchiveModelImpl.fromJson;

  @override
  String get id;
  @override
  @JsonKey(name: 'bill_no', fromJson: parseInt)
  int get bilNumber;
  @override
  @JsonKey(name: "bill_status")
  OrderStatus get status;
  @override
  @JsonKey(name: "opened_at", fromJson: _parseLocal)
  DateTime? get opened;
  @override
  @JsonKey(name: 'table_number', fromJson: parseInt)
  int get tableNumber;
  @override
  @JsonKey(name: 'grand_total', fromJson: parseInt)
  int get totalPrice;
  @override
  @JsonKey(name: "food_total", fromJson: parseInt)
  int get goodsTotal;
  @override
  @JsonKey(name: "service_amount", fromJson: parseInt)
  int get serviceAmount;
  @override
  @JsonKey(name: "discount_amount", fromJson: parseInt)
  int get discountAmount;
  @override
  @JsonKey(name: "quantity", fromJson: parseInt)
  int get goodsQuantity;
  @override
  @JsonKey(name: "customer_paid_amount", fromJson: parseInt)
  int get customerPaidAmount;
  @override
  @JsonKey(ignore: true)
  _$$ArchiveModelImplCopyWith<_$ArchiveModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
