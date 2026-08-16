// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'archive_detail_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

ArchiveDetailModel _$ArchiveDetailModelFromJson(Map<String, dynamic> json) {
  return _ArchiveDetailModel.fromJson(json);
}

/// @nodoc
mixin _$ArchiveDetailModel {
  String get id => throw _privateConstructorUsedError;
  @JsonKey(name: 'bill_no')
  int get bilNumber => throw _privateConstructorUsedError;
  @JsonKey(name: 'bill_status')
  OrderStatus get status => throw _privateConstructorUsedError;
  @JsonKey(name: 'opened_at', fromJson: _parseLocal)
  DateTime? get opened => throw _privateConstructorUsedError;
  @JsonKey(name: 'payment_type')
  String get paymentType => throw _privateConstructorUsedError;
  @JsonKey(name: 'table_id')
  String get tableId => throw _privateConstructorUsedError;
  @JsonKey(name: 'table_number', fromJson: _parseDouble)
  double get tableNumber => throw _privateConstructorUsedError;
  @JsonKey(name: 'hall_name')
  String get hallName => throw _privateConstructorUsedError;
  @JsonKey(name: 'cashier_id')
  String get cashierId => throw _privateConstructorUsedError;
  @JsonKey(name: 'cashier_name')
  String get cashierName => throw _privateConstructorUsedError;
  @JsonKey(name: 'guest_count', fromJson: _parseDouble)
  double get guestCount => throw _privateConstructorUsedError;
  @JsonKey(name: 'food_cost', fromJson: _parseDouble)
  double get foodCost => throw _privateConstructorUsedError;
  @JsonKey(name: 'food_total', fromJson: _parseDouble)
  double get foodTotal => throw _privateConstructorUsedError;
  @JsonKey(name: 'service_percent', fromJson: _parseDouble)
  double get servicePercent => throw _privateConstructorUsedError;
  @JsonKey(name: 'service_amount', fromJson: _parseDouble)
  double get serviceAmount => throw _privateConstructorUsedError;
  @JsonKey(name: 'discount_percent', fromJson: _parseDouble)
  double get discountPercent => throw _privateConstructorUsedError;
  @JsonKey(name: 'discount_amount', fromJson: _parseDouble)
  double get discountAmount => throw _privateConstructorUsedError;
  @JsonKey(name: 'grand_total', fromJson: _parseDouble)
  double get grandTotal => throw _privateConstructorUsedError;
  @JsonKey(name: 'customer_paid_amount', fromJson: _parseDouble)
  double get customerPaidAmount => throw _privateConstructorUsedError;
  @JsonKey(name: 'change_amount', fromJson: _parseDouble)
  double get changeAmount => throw _privateConstructorUsedError;
  @JsonKey(name: 'comment')
  String get comment => throw _privateConstructorUsedError;
  @JsonKey(name: "items")
  @OrderFoodEntityListConverter()
  List<OrderFoodEntity> get goods => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ArchiveDetailModelCopyWith<ArchiveDetailModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ArchiveDetailModelCopyWith<$Res> {
  factory $ArchiveDetailModelCopyWith(
          ArchiveDetailModel value, $Res Function(ArchiveDetailModel) then) =
      _$ArchiveDetailModelCopyWithImpl<$Res, ArchiveDetailModel>;
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: 'bill_no') int bilNumber,
      @JsonKey(name: 'bill_status') OrderStatus status,
      @JsonKey(name: 'opened_at', fromJson: _parseLocal) DateTime? opened,
      @JsonKey(name: 'payment_type') String paymentType,
      @JsonKey(name: 'table_id') String tableId,
      @JsonKey(name: 'table_number', fromJson: _parseDouble) double tableNumber,
      @JsonKey(name: 'hall_name') String hallName,
      @JsonKey(name: 'cashier_id') String cashierId,
      @JsonKey(name: 'cashier_name') String cashierName,
      @JsonKey(name: 'guest_count', fromJson: _parseDouble) double guestCount,
      @JsonKey(name: 'food_cost', fromJson: _parseDouble) double foodCost,
      @JsonKey(name: 'food_total', fromJson: _parseDouble) double foodTotal,
      @JsonKey(name: 'service_percent', fromJson: _parseDouble)
      double servicePercent,
      @JsonKey(name: 'service_amount', fromJson: _parseDouble)
      double serviceAmount,
      @JsonKey(name: 'discount_percent', fromJson: _parseDouble)
      double discountPercent,
      @JsonKey(name: 'discount_amount', fromJson: _parseDouble)
      double discountAmount,
      @JsonKey(name: 'grand_total', fromJson: _parseDouble) double grandTotal,
      @JsonKey(name: 'customer_paid_amount', fromJson: _parseDouble)
      double customerPaidAmount,
      @JsonKey(name: 'change_amount', fromJson: _parseDouble)
      double changeAmount,
      @JsonKey(name: 'comment') String comment,
      @JsonKey(name: "items")
      @OrderFoodEntityListConverter()
      List<OrderFoodEntity> goods});
}

/// @nodoc
class _$ArchiveDetailModelCopyWithImpl<$Res, $Val extends ArchiveDetailModel>
    implements $ArchiveDetailModelCopyWith<$Res> {
  _$ArchiveDetailModelCopyWithImpl(this._value, this._then);

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
    Object? paymentType = null,
    Object? tableId = null,
    Object? tableNumber = null,
    Object? hallName = null,
    Object? cashierId = null,
    Object? cashierName = null,
    Object? guestCount = null,
    Object? foodCost = null,
    Object? foodTotal = null,
    Object? servicePercent = null,
    Object? serviceAmount = null,
    Object? discountPercent = null,
    Object? discountAmount = null,
    Object? grandTotal = null,
    Object? customerPaidAmount = null,
    Object? changeAmount = null,
    Object? comment = null,
    Object? goods = null,
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
      paymentType: null == paymentType
          ? _value.paymentType
          : paymentType // ignore: cast_nullable_to_non_nullable
              as String,
      tableId: null == tableId
          ? _value.tableId
          : tableId // ignore: cast_nullable_to_non_nullable
              as String,
      tableNumber: null == tableNumber
          ? _value.tableNumber
          : tableNumber // ignore: cast_nullable_to_non_nullable
              as double,
      hallName: null == hallName
          ? _value.hallName
          : hallName // ignore: cast_nullable_to_non_nullable
              as String,
      cashierId: null == cashierId
          ? _value.cashierId
          : cashierId // ignore: cast_nullable_to_non_nullable
              as String,
      cashierName: null == cashierName
          ? _value.cashierName
          : cashierName // ignore: cast_nullable_to_non_nullable
              as String,
      guestCount: null == guestCount
          ? _value.guestCount
          : guestCount // ignore: cast_nullable_to_non_nullable
              as double,
      foodCost: null == foodCost
          ? _value.foodCost
          : foodCost // ignore: cast_nullable_to_non_nullable
              as double,
      foodTotal: null == foodTotal
          ? _value.foodTotal
          : foodTotal // ignore: cast_nullable_to_non_nullable
              as double,
      servicePercent: null == servicePercent
          ? _value.servicePercent
          : servicePercent // ignore: cast_nullable_to_non_nullable
              as double,
      serviceAmount: null == serviceAmount
          ? _value.serviceAmount
          : serviceAmount // ignore: cast_nullable_to_non_nullable
              as double,
      discountPercent: null == discountPercent
          ? _value.discountPercent
          : discountPercent // ignore: cast_nullable_to_non_nullable
              as double,
      discountAmount: null == discountAmount
          ? _value.discountAmount
          : discountAmount // ignore: cast_nullable_to_non_nullable
              as double,
      grandTotal: null == grandTotal
          ? _value.grandTotal
          : grandTotal // ignore: cast_nullable_to_non_nullable
              as double,
      customerPaidAmount: null == customerPaidAmount
          ? _value.customerPaidAmount
          : customerPaidAmount // ignore: cast_nullable_to_non_nullable
              as double,
      changeAmount: null == changeAmount
          ? _value.changeAmount
          : changeAmount // ignore: cast_nullable_to_non_nullable
              as double,
      comment: null == comment
          ? _value.comment
          : comment // ignore: cast_nullable_to_non_nullable
              as String,
      goods: null == goods
          ? _value.goods
          : goods // ignore: cast_nullable_to_non_nullable
              as List<OrderFoodEntity>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ArchiveDetailModelImplCopyWith<$Res>
    implements $ArchiveDetailModelCopyWith<$Res> {
  factory _$$ArchiveDetailModelImplCopyWith(_$ArchiveDetailModelImpl value,
          $Res Function(_$ArchiveDetailModelImpl) then) =
      __$$ArchiveDetailModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: 'bill_no') int bilNumber,
      @JsonKey(name: 'bill_status') OrderStatus status,
      @JsonKey(name: 'opened_at', fromJson: _parseLocal) DateTime? opened,
      @JsonKey(name: 'payment_type') String paymentType,
      @JsonKey(name: 'table_id') String tableId,
      @JsonKey(name: 'table_number', fromJson: _parseDouble) double tableNumber,
      @JsonKey(name: 'hall_name') String hallName,
      @JsonKey(name: 'cashier_id') String cashierId,
      @JsonKey(name: 'cashier_name') String cashierName,
      @JsonKey(name: 'guest_count', fromJson: _parseDouble) double guestCount,
      @JsonKey(name: 'food_cost', fromJson: _parseDouble) double foodCost,
      @JsonKey(name: 'food_total', fromJson: _parseDouble) double foodTotal,
      @JsonKey(name: 'service_percent', fromJson: _parseDouble)
      double servicePercent,
      @JsonKey(name: 'service_amount', fromJson: _parseDouble)
      double serviceAmount,
      @JsonKey(name: 'discount_percent', fromJson: _parseDouble)
      double discountPercent,
      @JsonKey(name: 'discount_amount', fromJson: _parseDouble)
      double discountAmount,
      @JsonKey(name: 'grand_total', fromJson: _parseDouble) double grandTotal,
      @JsonKey(name: 'customer_paid_amount', fromJson: _parseDouble)
      double customerPaidAmount,
      @JsonKey(name: 'change_amount', fromJson: _parseDouble)
      double changeAmount,
      @JsonKey(name: 'comment') String comment,
      @JsonKey(name: "items")
      @OrderFoodEntityListConverter()
      List<OrderFoodEntity> goods});
}

/// @nodoc
class __$$ArchiveDetailModelImplCopyWithImpl<$Res>
    extends _$ArchiveDetailModelCopyWithImpl<$Res, _$ArchiveDetailModelImpl>
    implements _$$ArchiveDetailModelImplCopyWith<$Res> {
  __$$ArchiveDetailModelImplCopyWithImpl(_$ArchiveDetailModelImpl _value,
      $Res Function(_$ArchiveDetailModelImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? bilNumber = null,
    Object? status = null,
    Object? opened = freezed,
    Object? paymentType = null,
    Object? tableId = null,
    Object? tableNumber = null,
    Object? hallName = null,
    Object? cashierId = null,
    Object? cashierName = null,
    Object? guestCount = null,
    Object? foodCost = null,
    Object? foodTotal = null,
    Object? servicePercent = null,
    Object? serviceAmount = null,
    Object? discountPercent = null,
    Object? discountAmount = null,
    Object? grandTotal = null,
    Object? customerPaidAmount = null,
    Object? changeAmount = null,
    Object? comment = null,
    Object? goods = null,
  }) {
    return _then(_$ArchiveDetailModelImpl(
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
      paymentType: null == paymentType
          ? _value.paymentType
          : paymentType // ignore: cast_nullable_to_non_nullable
              as String,
      tableId: null == tableId
          ? _value.tableId
          : tableId // ignore: cast_nullable_to_non_nullable
              as String,
      tableNumber: null == tableNumber
          ? _value.tableNumber
          : tableNumber // ignore: cast_nullable_to_non_nullable
              as double,
      hallName: null == hallName
          ? _value.hallName
          : hallName // ignore: cast_nullable_to_non_nullable
              as String,
      cashierId: null == cashierId
          ? _value.cashierId
          : cashierId // ignore: cast_nullable_to_non_nullable
              as String,
      cashierName: null == cashierName
          ? _value.cashierName
          : cashierName // ignore: cast_nullable_to_non_nullable
              as String,
      guestCount: null == guestCount
          ? _value.guestCount
          : guestCount // ignore: cast_nullable_to_non_nullable
              as double,
      foodCost: null == foodCost
          ? _value.foodCost
          : foodCost // ignore: cast_nullable_to_non_nullable
              as double,
      foodTotal: null == foodTotal
          ? _value.foodTotal
          : foodTotal // ignore: cast_nullable_to_non_nullable
              as double,
      servicePercent: null == servicePercent
          ? _value.servicePercent
          : servicePercent // ignore: cast_nullable_to_non_nullable
              as double,
      serviceAmount: null == serviceAmount
          ? _value.serviceAmount
          : serviceAmount // ignore: cast_nullable_to_non_nullable
              as double,
      discountPercent: null == discountPercent
          ? _value.discountPercent
          : discountPercent // ignore: cast_nullable_to_non_nullable
              as double,
      discountAmount: null == discountAmount
          ? _value.discountAmount
          : discountAmount // ignore: cast_nullable_to_non_nullable
              as double,
      grandTotal: null == grandTotal
          ? _value.grandTotal
          : grandTotal // ignore: cast_nullable_to_non_nullable
              as double,
      customerPaidAmount: null == customerPaidAmount
          ? _value.customerPaidAmount
          : customerPaidAmount // ignore: cast_nullable_to_non_nullable
              as double,
      changeAmount: null == changeAmount
          ? _value.changeAmount
          : changeAmount // ignore: cast_nullable_to_non_nullable
              as double,
      comment: null == comment
          ? _value.comment
          : comment // ignore: cast_nullable_to_non_nullable
              as String,
      goods: null == goods
          ? _value._goods
          : goods // ignore: cast_nullable_to_non_nullable
              as List<OrderFoodEntity>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ArchiveDetailModelImpl extends _ArchiveDetailModel {
  const _$ArchiveDetailModelImpl(
      {this.id = '',
      @JsonKey(name: 'bill_no') this.bilNumber = 0,
      @JsonKey(name: 'bill_status') this.status = OrderStatus.none,
      @JsonKey(name: 'opened_at', fromJson: _parseLocal) this.opened,
      @JsonKey(name: 'payment_type') this.paymentType = '',
      @JsonKey(name: 'table_id') this.tableId = '',
      @JsonKey(name: 'table_number', fromJson: _parseDouble)
      this.tableNumber = 0.0,
      @JsonKey(name: 'hall_name') this.hallName = '',
      @JsonKey(name: 'cashier_id') this.cashierId = '',
      @JsonKey(name: 'cashier_name') this.cashierName = '',
      @JsonKey(name: 'guest_count', fromJson: _parseDouble)
      this.guestCount = 0.0,
      @JsonKey(name: 'food_cost', fromJson: _parseDouble) this.foodCost = 0.0,
      @JsonKey(name: 'food_total', fromJson: _parseDouble) this.foodTotal = 0.0,
      @JsonKey(name: 'service_percent', fromJson: _parseDouble)
      this.servicePercent = 0.0,
      @JsonKey(name: 'service_amount', fromJson: _parseDouble)
      this.serviceAmount = 0.0,
      @JsonKey(name: 'discount_percent', fromJson: _parseDouble)
      this.discountPercent = 0.0,
      @JsonKey(name: 'discount_amount', fromJson: _parseDouble)
      this.discountAmount = 0.0,
      @JsonKey(name: 'grand_total', fromJson: _parseDouble)
      this.grandTotal = 0.0,
      @JsonKey(name: 'customer_paid_amount', fromJson: _parseDouble)
      this.customerPaidAmount = 0.0,
      @JsonKey(name: 'change_amount', fromJson: _parseDouble)
      this.changeAmount = 0.0,
      @JsonKey(name: 'comment') this.comment = '',
      @JsonKey(name: "items")
      @OrderFoodEntityListConverter()
      final List<OrderFoodEntity> goods = const []})
      : _goods = goods,
        super._();

  factory _$ArchiveDetailModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$ArchiveDetailModelImplFromJson(json);

  @override
  @JsonKey()
  final String id;
  @override
  @JsonKey(name: 'bill_no')
  final int bilNumber;
  @override
  @JsonKey(name: 'bill_status')
  final OrderStatus status;
  @override
  @JsonKey(name: 'opened_at', fromJson: _parseLocal)
  final DateTime? opened;
  @override
  @JsonKey(name: 'payment_type')
  final String paymentType;
  @override
  @JsonKey(name: 'table_id')
  final String tableId;
  @override
  @JsonKey(name: 'table_number', fromJson: _parseDouble)
  final double tableNumber;
  @override
  @JsonKey(name: 'hall_name')
  final String hallName;
  @override
  @JsonKey(name: 'cashier_id')
  final String cashierId;
  @override
  @JsonKey(name: 'cashier_name')
  final String cashierName;
  @override
  @JsonKey(name: 'guest_count', fromJson: _parseDouble)
  final double guestCount;
  @override
  @JsonKey(name: 'food_cost', fromJson: _parseDouble)
  final double foodCost;
  @override
  @JsonKey(name: 'food_total', fromJson: _parseDouble)
  final double foodTotal;
  @override
  @JsonKey(name: 'service_percent', fromJson: _parseDouble)
  final double servicePercent;
  @override
  @JsonKey(name: 'service_amount', fromJson: _parseDouble)
  final double serviceAmount;
  @override
  @JsonKey(name: 'discount_percent', fromJson: _parseDouble)
  final double discountPercent;
  @override
  @JsonKey(name: 'discount_amount', fromJson: _parseDouble)
  final double discountAmount;
  @override
  @JsonKey(name: 'grand_total', fromJson: _parseDouble)
  final double grandTotal;
  @override
  @JsonKey(name: 'customer_paid_amount', fromJson: _parseDouble)
  final double customerPaidAmount;
  @override
  @JsonKey(name: 'change_amount', fromJson: _parseDouble)
  final double changeAmount;
  @override
  @JsonKey(name: 'comment')
  final String comment;
  final List<OrderFoodEntity> _goods;
  @override
  @JsonKey(name: "items")
  @OrderFoodEntityListConverter()
  List<OrderFoodEntity> get goods {
    if (_goods is EqualUnmodifiableListView) return _goods;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_goods);
  }

  @override
  String toString() {
    return 'ArchiveDetailModel(id: $id, bilNumber: $bilNumber, status: $status, opened: $opened, paymentType: $paymentType, tableId: $tableId, tableNumber: $tableNumber, hallName: $hallName, cashierId: $cashierId, cashierName: $cashierName, guestCount: $guestCount, foodCost: $foodCost, foodTotal: $foodTotal, servicePercent: $servicePercent, serviceAmount: $serviceAmount, discountPercent: $discountPercent, discountAmount: $discountAmount, grandTotal: $grandTotal, customerPaidAmount: $customerPaidAmount, changeAmount: $changeAmount, comment: $comment, goods: $goods)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ArchiveDetailModelImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.bilNumber, bilNumber) ||
                other.bilNumber == bilNumber) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.opened, opened) || other.opened == opened) &&
            (identical(other.paymentType, paymentType) ||
                other.paymentType == paymentType) &&
            (identical(other.tableId, tableId) || other.tableId == tableId) &&
            (identical(other.tableNumber, tableNumber) ||
                other.tableNumber == tableNumber) &&
            (identical(other.hallName, hallName) ||
                other.hallName == hallName) &&
            (identical(other.cashierId, cashierId) ||
                other.cashierId == cashierId) &&
            (identical(other.cashierName, cashierName) ||
                other.cashierName == cashierName) &&
            (identical(other.guestCount, guestCount) ||
                other.guestCount == guestCount) &&
            (identical(other.foodCost, foodCost) ||
                other.foodCost == foodCost) &&
            (identical(other.foodTotal, foodTotal) ||
                other.foodTotal == foodTotal) &&
            (identical(other.servicePercent, servicePercent) ||
                other.servicePercent == servicePercent) &&
            (identical(other.serviceAmount, serviceAmount) ||
                other.serviceAmount == serviceAmount) &&
            (identical(other.discountPercent, discountPercent) ||
                other.discountPercent == discountPercent) &&
            (identical(other.discountAmount, discountAmount) ||
                other.discountAmount == discountAmount) &&
            (identical(other.grandTotal, grandTotal) ||
                other.grandTotal == grandTotal) &&
            (identical(other.customerPaidAmount, customerPaidAmount) ||
                other.customerPaidAmount == customerPaidAmount) &&
            (identical(other.changeAmount, changeAmount) ||
                other.changeAmount == changeAmount) &&
            (identical(other.comment, comment) || other.comment == comment) &&
            const DeepCollectionEquality().equals(other._goods, _goods));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hashAll([
        runtimeType,
        id,
        bilNumber,
        status,
        opened,
        paymentType,
        tableId,
        tableNumber,
        hallName,
        cashierId,
        cashierName,
        guestCount,
        foodCost,
        foodTotal,
        servicePercent,
        serviceAmount,
        discountPercent,
        discountAmount,
        grandTotal,
        customerPaidAmount,
        changeAmount,
        comment,
        const DeepCollectionEquality().hash(_goods)
      ]);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ArchiveDetailModelImplCopyWith<_$ArchiveDetailModelImpl> get copyWith =>
      __$$ArchiveDetailModelImplCopyWithImpl<_$ArchiveDetailModelImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ArchiveDetailModelImplToJson(
      this,
    );
  }
}

abstract class _ArchiveDetailModel extends ArchiveDetailModel {
  const factory _ArchiveDetailModel(
      {final String id,
      @JsonKey(name: 'bill_no') final int bilNumber,
      @JsonKey(name: 'bill_status') final OrderStatus status,
      @JsonKey(name: 'opened_at', fromJson: _parseLocal) final DateTime? opened,
      @JsonKey(name: 'payment_type') final String paymentType,
      @JsonKey(name: 'table_id') final String tableId,
      @JsonKey(name: 'table_number', fromJson: _parseDouble)
      final double tableNumber,
      @JsonKey(name: 'hall_name') final String hallName,
      @JsonKey(name: 'cashier_id') final String cashierId,
      @JsonKey(name: 'cashier_name') final String cashierName,
      @JsonKey(name: 'guest_count', fromJson: _parseDouble)
      final double guestCount,
      @JsonKey(name: 'food_cost', fromJson: _parseDouble) final double foodCost,
      @JsonKey(name: 'food_total', fromJson: _parseDouble)
      final double foodTotal,
      @JsonKey(name: 'service_percent', fromJson: _parseDouble)
      final double servicePercent,
      @JsonKey(name: 'service_amount', fromJson: _parseDouble)
      final double serviceAmount,
      @JsonKey(name: 'discount_percent', fromJson: _parseDouble)
      final double discountPercent,
      @JsonKey(name: 'discount_amount', fromJson: _parseDouble)
      final double discountAmount,
      @JsonKey(name: 'grand_total', fromJson: _parseDouble)
      final double grandTotal,
      @JsonKey(name: 'customer_paid_amount', fromJson: _parseDouble)
      final double customerPaidAmount,
      @JsonKey(name: 'change_amount', fromJson: _parseDouble)
      final double changeAmount,
      @JsonKey(name: 'comment') final String comment,
      @JsonKey(name: "items")
      @OrderFoodEntityListConverter()
      final List<OrderFoodEntity> goods}) = _$ArchiveDetailModelImpl;
  const _ArchiveDetailModel._() : super._();

  factory _ArchiveDetailModel.fromJson(Map<String, dynamic> json) =
      _$ArchiveDetailModelImpl.fromJson;

  @override
  String get id;
  @override
  @JsonKey(name: 'bill_no')
  int get bilNumber;
  @override
  @JsonKey(name: 'bill_status')
  OrderStatus get status;
  @override
  @JsonKey(name: 'opened_at', fromJson: _parseLocal)
  DateTime? get opened;
  @override
  @JsonKey(name: 'payment_type')
  String get paymentType;
  @override
  @JsonKey(name: 'table_id')
  String get tableId;
  @override
  @JsonKey(name: 'table_number', fromJson: _parseDouble)
  double get tableNumber;
  @override
  @JsonKey(name: 'hall_name')
  String get hallName;
  @override
  @JsonKey(name: 'cashier_id')
  String get cashierId;
  @override
  @JsonKey(name: 'cashier_name')
  String get cashierName;
  @override
  @JsonKey(name: 'guest_count', fromJson: _parseDouble)
  double get guestCount;
  @override
  @JsonKey(name: 'food_cost', fromJson: _parseDouble)
  double get foodCost;
  @override
  @JsonKey(name: 'food_total', fromJson: _parseDouble)
  double get foodTotal;
  @override
  @JsonKey(name: 'service_percent', fromJson: _parseDouble)
  double get servicePercent;
  @override
  @JsonKey(name: 'service_amount', fromJson: _parseDouble)
  double get serviceAmount;
  @override
  @JsonKey(name: 'discount_percent', fromJson: _parseDouble)
  double get discountPercent;
  @override
  @JsonKey(name: 'discount_amount', fromJson: _parseDouble)
  double get discountAmount;
  @override
  @JsonKey(name: 'grand_total', fromJson: _parseDouble)
  double get grandTotal;
  @override
  @JsonKey(name: 'customer_paid_amount', fromJson: _parseDouble)
  double get customerPaidAmount;
  @override
  @JsonKey(name: 'change_amount', fromJson: _parseDouble)
  double get changeAmount;
  @override
  @JsonKey(name: 'comment')
  String get comment;
  @override
  @JsonKey(name: "items")
  @OrderFoodEntityListConverter()
  List<OrderFoodEntity> get goods;
  @override
  @JsonKey(ignore: true)
  _$$ArchiveDetailModelImplCopyWith<_$ArchiveDetailModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
