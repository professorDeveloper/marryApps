// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'save_order_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$SaveOrderModel {
  CafeTableModel get cafeTable => throw _privateConstructorUsedError;
  CreateOrderRequestModel get createOrderRequest =>
      throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $SaveOrderModelCopyWith<SaveOrderModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SaveOrderModelCopyWith<$Res> {
  factory $SaveOrderModelCopyWith(
          SaveOrderModel value, $Res Function(SaveOrderModel) then) =
      _$SaveOrderModelCopyWithImpl<$Res, SaveOrderModel>;
  @useResult
  $Res call(
      {CafeTableModel cafeTable, CreateOrderRequestModel createOrderRequest});

  $CafeTableModelCopyWith<$Res> get cafeTable;
  $CreateOrderRequestModelCopyWith<$Res> get createOrderRequest;
}

/// @nodoc
class _$SaveOrderModelCopyWithImpl<$Res, $Val extends SaveOrderModel>
    implements $SaveOrderModelCopyWith<$Res> {
  _$SaveOrderModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? cafeTable = null,
    Object? createOrderRequest = null,
  }) {
    return _then(_value.copyWith(
      cafeTable: null == cafeTable
          ? _value.cafeTable
          : cafeTable // ignore: cast_nullable_to_non_nullable
              as CafeTableModel,
      createOrderRequest: null == createOrderRequest
          ? _value.createOrderRequest
          : createOrderRequest // ignore: cast_nullable_to_non_nullable
              as CreateOrderRequestModel,
    ) as $Val);
  }

  @override
  @pragma('vm:prefer-inline')
  $CafeTableModelCopyWith<$Res> get cafeTable {
    return $CafeTableModelCopyWith<$Res>(_value.cafeTable, (value) {
      return _then(_value.copyWith(cafeTable: value) as $Val);
    });
  }

  @override
  @pragma('vm:prefer-inline')
  $CreateOrderRequestModelCopyWith<$Res> get createOrderRequest {
    return $CreateOrderRequestModelCopyWith<$Res>(_value.createOrderRequest,
        (value) {
      return _then(_value.copyWith(createOrderRequest: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$SaveOrderModelImplCopyWith<$Res>
    implements $SaveOrderModelCopyWith<$Res> {
  factory _$$SaveOrderModelImplCopyWith(_$SaveOrderModelImpl value,
          $Res Function(_$SaveOrderModelImpl) then) =
      __$$SaveOrderModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {CafeTableModel cafeTable, CreateOrderRequestModel createOrderRequest});

  @override
  $CafeTableModelCopyWith<$Res> get cafeTable;
  @override
  $CreateOrderRequestModelCopyWith<$Res> get createOrderRequest;
}

/// @nodoc
class __$$SaveOrderModelImplCopyWithImpl<$Res>
    extends _$SaveOrderModelCopyWithImpl<$Res, _$SaveOrderModelImpl>
    implements _$$SaveOrderModelImplCopyWith<$Res> {
  __$$SaveOrderModelImplCopyWithImpl(
      _$SaveOrderModelImpl _value, $Res Function(_$SaveOrderModelImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? cafeTable = null,
    Object? createOrderRequest = null,
  }) {
    return _then(_$SaveOrderModelImpl(
      cafeTable: null == cafeTable
          ? _value.cafeTable
          : cafeTable // ignore: cast_nullable_to_non_nullable
              as CafeTableModel,
      createOrderRequest: null == createOrderRequest
          ? _value.createOrderRequest
          : createOrderRequest // ignore: cast_nullable_to_non_nullable
              as CreateOrderRequestModel,
    ));
  }
}

/// @nodoc

class _$SaveOrderModelImpl extends _SaveOrderModel {
  const _$SaveOrderModelImpl(
      {required this.cafeTable, required this.createOrderRequest})
      : super._();

  @override
  final CafeTableModel cafeTable;
  @override
  final CreateOrderRequestModel createOrderRequest;

  @override
  String toString() {
    return 'SaveOrderModel(cafeTable: $cafeTable, createOrderRequest: $createOrderRequest)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SaveOrderModelImpl &&
            (identical(other.cafeTable, cafeTable) ||
                other.cafeTable == cafeTable) &&
            (identical(other.createOrderRequest, createOrderRequest) ||
                other.createOrderRequest == createOrderRequest));
  }

  @override
  int get hashCode => Object.hash(runtimeType, cafeTable, createOrderRequest);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$SaveOrderModelImplCopyWith<_$SaveOrderModelImpl> get copyWith =>
      __$$SaveOrderModelImplCopyWithImpl<_$SaveOrderModelImpl>(
          this, _$identity);
}

abstract class _SaveOrderModel extends SaveOrderModel {
  const factory _SaveOrderModel(
          {required final CafeTableModel cafeTable,
          required final CreateOrderRequestModel createOrderRequest}) =
      _$SaveOrderModelImpl;
  const _SaveOrderModel._() : super._();

  @override
  CafeTableModel get cafeTable;
  @override
  CreateOrderRequestModel get createOrderRequest;
  @override
  @JsonKey(ignore: true)
  _$$SaveOrderModelImplCopyWith<_$SaveOrderModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
