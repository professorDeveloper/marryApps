// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'create_order_request_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$CreateOrderRequestModel {
  /// Klientda generatsiya qilinadigan buyurtma id'si.
  ///
  /// Backend `CreateOrder` (`order.go:189-206`) shu id bilan buyurtma bor
  /// bo'lsa uni qaytaradi — ya'ni javob yo'qolib so'rov qayta yuborilsa
  /// ham dublikat tushmaydi. Bo'sh qoldirilsa backend o'zi yangi UUID
  /// beradi va **hech qanday himoya bo'lmaydi**: offline navbat javobni
  /// olmay qayta urinsa ikkinchi buyurtma yaratilardi.
  String get orderId => throw _privateConstructorUsedError;
  String get cashierId => throw _privateConstructorUsedError;
  String get comment => throw _privateConstructorUsedError;
  int get guestCount => throw _privateConstructorUsedError;
  List<OrderItem> get foods => throw _privateConstructorUsedError;
  OrderStatus get status => throw _privateConstructorUsedError;
  String get tableId => throw _privateConstructorUsedError;
  TableStatus get tableStatus => throw _privateConstructorUsedError;
  String get orderType => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $CreateOrderRequestModelCopyWith<CreateOrderRequestModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CreateOrderRequestModelCopyWith<$Res> {
  factory $CreateOrderRequestModelCopyWith(CreateOrderRequestModel value,
          $Res Function(CreateOrderRequestModel) then) =
      _$CreateOrderRequestModelCopyWithImpl<$Res, CreateOrderRequestModel>;
  @useResult
  $Res call(
      {String orderId,
      String cashierId,
      String comment,
      int guestCount,
      List<OrderItem> foods,
      OrderStatus status,
      String tableId,
      TableStatus tableStatus,
      String orderType});
}

/// @nodoc
class _$CreateOrderRequestModelCopyWithImpl<$Res,
        $Val extends CreateOrderRequestModel>
    implements $CreateOrderRequestModelCopyWith<$Res> {
  _$CreateOrderRequestModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? orderId = null,
    Object? cashierId = null,
    Object? comment = null,
    Object? guestCount = null,
    Object? foods = null,
    Object? status = null,
    Object? tableId = null,
    Object? tableStatus = null,
    Object? orderType = null,
  }) {
    return _then(_value.copyWith(
      orderId: null == orderId
          ? _value.orderId
          : orderId // ignore: cast_nullable_to_non_nullable
              as String,
      cashierId: null == cashierId
          ? _value.cashierId
          : cashierId // ignore: cast_nullable_to_non_nullable
              as String,
      comment: null == comment
          ? _value.comment
          : comment // ignore: cast_nullable_to_non_nullable
              as String,
      guestCount: null == guestCount
          ? _value.guestCount
          : guestCount // ignore: cast_nullable_to_non_nullable
              as int,
      foods: null == foods
          ? _value.foods
          : foods // ignore: cast_nullable_to_non_nullable
              as List<OrderItem>,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as OrderStatus,
      tableId: null == tableId
          ? _value.tableId
          : tableId // ignore: cast_nullable_to_non_nullable
              as String,
      tableStatus: null == tableStatus
          ? _value.tableStatus
          : tableStatus // ignore: cast_nullable_to_non_nullable
              as TableStatus,
      orderType: null == orderType
          ? _value.orderType
          : orderType // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CreateOrderRequestModelImplCopyWith<$Res>
    implements $CreateOrderRequestModelCopyWith<$Res> {
  factory _$$CreateOrderRequestModelImplCopyWith(
          _$CreateOrderRequestModelImpl value,
          $Res Function(_$CreateOrderRequestModelImpl) then) =
      __$$CreateOrderRequestModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String orderId,
      String cashierId,
      String comment,
      int guestCount,
      List<OrderItem> foods,
      OrderStatus status,
      String tableId,
      TableStatus tableStatus,
      String orderType});
}

/// @nodoc
class __$$CreateOrderRequestModelImplCopyWithImpl<$Res>
    extends _$CreateOrderRequestModelCopyWithImpl<$Res,
        _$CreateOrderRequestModelImpl>
    implements _$$CreateOrderRequestModelImplCopyWith<$Res> {
  __$$CreateOrderRequestModelImplCopyWithImpl(
      _$CreateOrderRequestModelImpl _value,
      $Res Function(_$CreateOrderRequestModelImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? orderId = null,
    Object? cashierId = null,
    Object? comment = null,
    Object? guestCount = null,
    Object? foods = null,
    Object? status = null,
    Object? tableId = null,
    Object? tableStatus = null,
    Object? orderType = null,
  }) {
    return _then(_$CreateOrderRequestModelImpl(
      orderId: null == orderId
          ? _value.orderId
          : orderId // ignore: cast_nullable_to_non_nullable
              as String,
      cashierId: null == cashierId
          ? _value.cashierId
          : cashierId // ignore: cast_nullable_to_non_nullable
              as String,
      comment: null == comment
          ? _value.comment
          : comment // ignore: cast_nullable_to_non_nullable
              as String,
      guestCount: null == guestCount
          ? _value.guestCount
          : guestCount // ignore: cast_nullable_to_non_nullable
              as int,
      foods: null == foods
          ? _value._foods
          : foods // ignore: cast_nullable_to_non_nullable
              as List<OrderItem>,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as OrderStatus,
      tableId: null == tableId
          ? _value.tableId
          : tableId // ignore: cast_nullable_to_non_nullable
              as String,
      tableStatus: null == tableStatus
          ? _value.tableStatus
          : tableStatus // ignore: cast_nullable_to_non_nullable
              as TableStatus,
      orderType: null == orderType
          ? _value.orderType
          : orderType // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$CreateOrderRequestModelImpl extends _CreateOrderRequestModel {
  const _$CreateOrderRequestModelImpl(
      {this.orderId = '',
      this.cashierId = '',
      this.comment = '',
      this.guestCount = 0,
      final List<OrderItem> foods = const [],
      this.status = OrderStatus.none,
      this.tableId = '',
      this.tableStatus = TableStatus.none,
      this.orderType = ''})
      : _foods = foods,
        super._();

  /// Klientda generatsiya qilinadigan buyurtma id'si.
  ///
  /// Backend `CreateOrder` (`order.go:189-206`) shu id bilan buyurtma bor
  /// bo'lsa uni qaytaradi — ya'ni javob yo'qolib so'rov qayta yuborilsa
  /// ham dublikat tushmaydi. Bo'sh qoldirilsa backend o'zi yangi UUID
  /// beradi va **hech qanday himoya bo'lmaydi**: offline navbat javobni
  /// olmay qayta urinsa ikkinchi buyurtma yaratilardi.
  @override
  @JsonKey()
  final String orderId;
  @override
  @JsonKey()
  final String cashierId;
  @override
  @JsonKey()
  final String comment;
  @override
  @JsonKey()
  final int guestCount;
  final List<OrderItem> _foods;
  @override
  @JsonKey()
  List<OrderItem> get foods {
    if (_foods is EqualUnmodifiableListView) return _foods;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_foods);
  }

  @override
  @JsonKey()
  final OrderStatus status;
  @override
  @JsonKey()
  final String tableId;
  @override
  @JsonKey()
  final TableStatus tableStatus;
  @override
  @JsonKey()
  final String orderType;

  @override
  String toString() {
    return 'CreateOrderRequestModel(orderId: $orderId, cashierId: $cashierId, comment: $comment, guestCount: $guestCount, foods: $foods, status: $status, tableId: $tableId, tableStatus: $tableStatus, orderType: $orderType)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CreateOrderRequestModelImpl &&
            (identical(other.orderId, orderId) || other.orderId == orderId) &&
            (identical(other.cashierId, cashierId) ||
                other.cashierId == cashierId) &&
            (identical(other.comment, comment) || other.comment == comment) &&
            (identical(other.guestCount, guestCount) ||
                other.guestCount == guestCount) &&
            const DeepCollectionEquality().equals(other._foods, _foods) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.tableId, tableId) || other.tableId == tableId) &&
            (identical(other.tableStatus, tableStatus) ||
                other.tableStatus == tableStatus) &&
            (identical(other.orderType, orderType) ||
                other.orderType == orderType));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      orderId,
      cashierId,
      comment,
      guestCount,
      const DeepCollectionEquality().hash(_foods),
      status,
      tableId,
      tableStatus,
      orderType);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CreateOrderRequestModelImplCopyWith<_$CreateOrderRequestModelImpl>
      get copyWith => __$$CreateOrderRequestModelImplCopyWithImpl<
          _$CreateOrderRequestModelImpl>(this, _$identity);
}

abstract class _CreateOrderRequestModel extends CreateOrderRequestModel {
  const factory _CreateOrderRequestModel(
      {final String orderId,
      final String cashierId,
      final String comment,
      final int guestCount,
      final List<OrderItem> foods,
      final OrderStatus status,
      final String tableId,
      final TableStatus tableStatus,
      final String orderType}) = _$CreateOrderRequestModelImpl;
  const _CreateOrderRequestModel._() : super._();

  @override

  /// Klientda generatsiya qilinadigan buyurtma id'si.
  ///
  /// Backend `CreateOrder` (`order.go:189-206`) shu id bilan buyurtma bor
  /// bo'lsa uni qaytaradi — ya'ni javob yo'qolib so'rov qayta yuborilsa
  /// ham dublikat tushmaydi. Bo'sh qoldirilsa backend o'zi yangi UUID
  /// beradi va **hech qanday himoya bo'lmaydi**: offline navbat javobni
  /// olmay qayta urinsa ikkinchi buyurtma yaratilardi.
  String get orderId;
  @override
  String get cashierId;
  @override
  String get comment;
  @override
  int get guestCount;
  @override
  List<OrderItem> get foods;
  @override
  OrderStatus get status;
  @override
  String get tableId;
  @override
  TableStatus get tableStatus;
  @override
  String get orderType;
  @override
  @JsonKey(ignore: true)
  _$$CreateOrderRequestModelImplCopyWith<_$CreateOrderRequestModelImpl>
      get copyWith => throw _privateConstructorUsedError;
}
