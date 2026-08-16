// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'open_shift_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

OpenShiftModel _$OpenShiftModelFromJson(Map<String, dynamic> json) {
  return _OpenShiftModel.fromJson(json);
}

/// @nodoc
mixin _$OpenShiftModel {
  @JsonKey(name: "cash_register_id")
  String get cashRegisterId => throw _privateConstructorUsedError;
  @JsonKey(name: "cashier_id")
  String get cashierId => throw _privateConstructorUsedError;
  @JsonKey(name: "opening_card", toJson: _intToString)
  int get openCardSum => throw _privateConstructorUsedError;
  @JsonKey(name: "opening_cash", toJson: _intToString)
  int get openCashSum => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $OpenShiftModelCopyWith<OpenShiftModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $OpenShiftModelCopyWith<$Res> {
  factory $OpenShiftModelCopyWith(
          OpenShiftModel value, $Res Function(OpenShiftModel) then) =
      _$OpenShiftModelCopyWithImpl<$Res, OpenShiftModel>;
  @useResult
  $Res call(
      {@JsonKey(name: "cash_register_id") String cashRegisterId,
      @JsonKey(name: "cashier_id") String cashierId,
      @JsonKey(name: "opening_card", toJson: _intToString) int openCardSum,
      @JsonKey(name: "opening_cash", toJson: _intToString) int openCashSum});
}

/// @nodoc
class _$OpenShiftModelCopyWithImpl<$Res, $Val extends OpenShiftModel>
    implements $OpenShiftModelCopyWith<$Res> {
  _$OpenShiftModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? cashRegisterId = null,
    Object? cashierId = null,
    Object? openCardSum = null,
    Object? openCashSum = null,
  }) {
    return _then(_value.copyWith(
      cashRegisterId: null == cashRegisterId
          ? _value.cashRegisterId
          : cashRegisterId // ignore: cast_nullable_to_non_nullable
              as String,
      cashierId: null == cashierId
          ? _value.cashierId
          : cashierId // ignore: cast_nullable_to_non_nullable
              as String,
      openCardSum: null == openCardSum
          ? _value.openCardSum
          : openCardSum // ignore: cast_nullable_to_non_nullable
              as int,
      openCashSum: null == openCashSum
          ? _value.openCashSum
          : openCashSum // ignore: cast_nullable_to_non_nullable
              as int,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$OpenShiftModelImplCopyWith<$Res>
    implements $OpenShiftModelCopyWith<$Res> {
  factory _$$OpenShiftModelImplCopyWith(_$OpenShiftModelImpl value,
          $Res Function(_$OpenShiftModelImpl) then) =
      __$$OpenShiftModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@JsonKey(name: "cash_register_id") String cashRegisterId,
      @JsonKey(name: "cashier_id") String cashierId,
      @JsonKey(name: "opening_card", toJson: _intToString) int openCardSum,
      @JsonKey(name: "opening_cash", toJson: _intToString) int openCashSum});
}

/// @nodoc
class __$$OpenShiftModelImplCopyWithImpl<$Res>
    extends _$OpenShiftModelCopyWithImpl<$Res, _$OpenShiftModelImpl>
    implements _$$OpenShiftModelImplCopyWith<$Res> {
  __$$OpenShiftModelImplCopyWithImpl(
      _$OpenShiftModelImpl _value, $Res Function(_$OpenShiftModelImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? cashRegisterId = null,
    Object? cashierId = null,
    Object? openCardSum = null,
    Object? openCashSum = null,
  }) {
    return _then(_$OpenShiftModelImpl(
      cashRegisterId: null == cashRegisterId
          ? _value.cashRegisterId
          : cashRegisterId // ignore: cast_nullable_to_non_nullable
              as String,
      cashierId: null == cashierId
          ? _value.cashierId
          : cashierId // ignore: cast_nullable_to_non_nullable
              as String,
      openCardSum: null == openCardSum
          ? _value.openCardSum
          : openCardSum // ignore: cast_nullable_to_non_nullable
              as int,
      openCashSum: null == openCashSum
          ? _value.openCashSum
          : openCashSum // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$OpenShiftModelImpl extends _OpenShiftModel {
  const _$OpenShiftModelImpl(
      {@JsonKey(name: "cash_register_id") this.cashRegisterId = '',
      @JsonKey(name: "cashier_id") this.cashierId = '',
      @JsonKey(name: "opening_card", toJson: _intToString) this.openCardSum = 0,
      @JsonKey(name: "opening_cash", toJson: _intToString)
      this.openCashSum = 0})
      : super._();

  factory _$OpenShiftModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$OpenShiftModelImplFromJson(json);

  @override
  @JsonKey(name: "cash_register_id")
  final String cashRegisterId;
  @override
  @JsonKey(name: "cashier_id")
  final String cashierId;
  @override
  @JsonKey(name: "opening_card", toJson: _intToString)
  final int openCardSum;
  @override
  @JsonKey(name: "opening_cash", toJson: _intToString)
  final int openCashSum;

  @override
  String toString() {
    return 'OpenShiftModel(cashRegisterId: $cashRegisterId, cashierId: $cashierId, openCardSum: $openCardSum, openCashSum: $openCashSum)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$OpenShiftModelImpl &&
            (identical(other.cashRegisterId, cashRegisterId) ||
                other.cashRegisterId == cashRegisterId) &&
            (identical(other.cashierId, cashierId) ||
                other.cashierId == cashierId) &&
            (identical(other.openCardSum, openCardSum) ||
                other.openCardSum == openCardSum) &&
            (identical(other.openCashSum, openCashSum) ||
                other.openCashSum == openCashSum));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType, cashRegisterId, cashierId, openCardSum, openCashSum);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$OpenShiftModelImplCopyWith<_$OpenShiftModelImpl> get copyWith =>
      __$$OpenShiftModelImplCopyWithImpl<_$OpenShiftModelImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$OpenShiftModelImplToJson(
      this,
    );
  }
}

abstract class _OpenShiftModel extends OpenShiftModel {
  const factory _OpenShiftModel(
      {@JsonKey(name: "cash_register_id") final String cashRegisterId,
      @JsonKey(name: "cashier_id") final String cashierId,
      @JsonKey(name: "opening_card", toJson: _intToString)
      final int openCardSum,
      @JsonKey(name: "opening_cash", toJson: _intToString)
      final int openCashSum}) = _$OpenShiftModelImpl;
  const _OpenShiftModel._() : super._();

  factory _OpenShiftModel.fromJson(Map<String, dynamic> json) =
      _$OpenShiftModelImpl.fromJson;

  @override
  @JsonKey(name: "cash_register_id")
  String get cashRegisterId;
  @override
  @JsonKey(name: "cashier_id")
  String get cashierId;
  @override
  @JsonKey(name: "opening_card", toJson: _intToString)
  int get openCardSum;
  @override
  @JsonKey(name: "opening_cash", toJson: _intToString)
  int get openCashSum;
  @override
  @JsonKey(ignore: true)
  _$$OpenShiftModelImplCopyWith<_$OpenShiftModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
