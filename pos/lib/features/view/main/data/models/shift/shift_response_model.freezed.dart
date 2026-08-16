// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'shift_response_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

ShiftResponseModel _$ShiftResponseModelFromJson(Map<String, dynamic> json) {
  return _ShiftResponseModel.fromJson(json);
}

/// @nodoc
mixin _$ShiftResponseModel {
  String get id => throw _privateConstructorUsedError;
  @JsonKey(name: "branch_id")
  String get branchId => throw _privateConstructorUsedError;
  @JsonKey(name: "cash_register_id")
  String get cashRegisterId => throw _privateConstructorUsedError;
  @JsonKey(name: "cashier_id")
  String get cashierId => throw _privateConstructorUsedError;
  @JsonKey(name: "opened_at", fromJson: _parseLocal)
  DateTime? get openedAt => throw _privateConstructorUsedError;
  @JsonKey(name: "opening_cash", fromJson: _parseIntFlex)
  int get openingCash => throw _privateConstructorUsedError;
  @JsonKey(name: "opening_card", fromJson: _parseIntFlex)
  int get openinCard => throw _privateConstructorUsedError;
  CashStatus get status => throw _privateConstructorUsedError;
  @JsonKey(name: "created_at", fromJson: _parseLocal)
  DateTime? get createdAt => throw _privateConstructorUsedError;
  @JsonKey(name: "updated_at", fromJson: _parseLocal)
  DateTime? get updatedAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ShiftResponseModelCopyWith<ShiftResponseModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ShiftResponseModelCopyWith<$Res> {
  factory $ShiftResponseModelCopyWith(
          ShiftResponseModel value, $Res Function(ShiftResponseModel) then) =
      _$ShiftResponseModelCopyWithImpl<$Res, ShiftResponseModel>;
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: "branch_id") String branchId,
      @JsonKey(name: "cash_register_id") String cashRegisterId,
      @JsonKey(name: "cashier_id") String cashierId,
      @JsonKey(name: "opened_at", fromJson: _parseLocal) DateTime? openedAt,
      @JsonKey(name: "opening_cash", fromJson: _parseIntFlex) int openingCash,
      @JsonKey(name: "opening_card", fromJson: _parseIntFlex) int openinCard,
      CashStatus status,
      @JsonKey(name: "created_at", fromJson: _parseLocal) DateTime? createdAt,
      @JsonKey(name: "updated_at", fromJson: _parseLocal) DateTime? updatedAt});
}

/// @nodoc
class _$ShiftResponseModelCopyWithImpl<$Res, $Val extends ShiftResponseModel>
    implements $ShiftResponseModelCopyWith<$Res> {
  _$ShiftResponseModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? branchId = null,
    Object? cashRegisterId = null,
    Object? cashierId = null,
    Object? openedAt = freezed,
    Object? openingCash = null,
    Object? openinCard = null,
    Object? status = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      branchId: null == branchId
          ? _value.branchId
          : branchId // ignore: cast_nullable_to_non_nullable
              as String,
      cashRegisterId: null == cashRegisterId
          ? _value.cashRegisterId
          : cashRegisterId // ignore: cast_nullable_to_non_nullable
              as String,
      cashierId: null == cashierId
          ? _value.cashierId
          : cashierId // ignore: cast_nullable_to_non_nullable
              as String,
      openedAt: freezed == openedAt
          ? _value.openedAt
          : openedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      openingCash: null == openingCash
          ? _value.openingCash
          : openingCash // ignore: cast_nullable_to_non_nullable
              as int,
      openinCard: null == openinCard
          ? _value.openinCard
          : openinCard // ignore: cast_nullable_to_non_nullable
              as int,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as CashStatus,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ShiftResponseModelImplCopyWith<$Res>
    implements $ShiftResponseModelCopyWith<$Res> {
  factory _$$ShiftResponseModelImplCopyWith(_$ShiftResponseModelImpl value,
          $Res Function(_$ShiftResponseModelImpl) then) =
      __$$ShiftResponseModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: "branch_id") String branchId,
      @JsonKey(name: "cash_register_id") String cashRegisterId,
      @JsonKey(name: "cashier_id") String cashierId,
      @JsonKey(name: "opened_at", fromJson: _parseLocal) DateTime? openedAt,
      @JsonKey(name: "opening_cash", fromJson: _parseIntFlex) int openingCash,
      @JsonKey(name: "opening_card", fromJson: _parseIntFlex) int openinCard,
      CashStatus status,
      @JsonKey(name: "created_at", fromJson: _parseLocal) DateTime? createdAt,
      @JsonKey(name: "updated_at", fromJson: _parseLocal) DateTime? updatedAt});
}

/// @nodoc
class __$$ShiftResponseModelImplCopyWithImpl<$Res>
    extends _$ShiftResponseModelCopyWithImpl<$Res, _$ShiftResponseModelImpl>
    implements _$$ShiftResponseModelImplCopyWith<$Res> {
  __$$ShiftResponseModelImplCopyWithImpl(_$ShiftResponseModelImpl _value,
      $Res Function(_$ShiftResponseModelImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? branchId = null,
    Object? cashRegisterId = null,
    Object? cashierId = null,
    Object? openedAt = freezed,
    Object? openingCash = null,
    Object? openinCard = null,
    Object? status = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
  }) {
    return _then(_$ShiftResponseModelImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      branchId: null == branchId
          ? _value.branchId
          : branchId // ignore: cast_nullable_to_non_nullable
              as String,
      cashRegisterId: null == cashRegisterId
          ? _value.cashRegisterId
          : cashRegisterId // ignore: cast_nullable_to_non_nullable
              as String,
      cashierId: null == cashierId
          ? _value.cashierId
          : cashierId // ignore: cast_nullable_to_non_nullable
              as String,
      openedAt: freezed == openedAt
          ? _value.openedAt
          : openedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      openingCash: null == openingCash
          ? _value.openingCash
          : openingCash // ignore: cast_nullable_to_non_nullable
              as int,
      openinCard: null == openinCard
          ? _value.openinCard
          : openinCard // ignore: cast_nullable_to_non_nullable
              as int,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as CashStatus,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ShiftResponseModelImpl extends _ShiftResponseModel {
  const _$ShiftResponseModelImpl(
      {this.id = '',
      @JsonKey(name: "branch_id") this.branchId = '',
      @JsonKey(name: "cash_register_id") this.cashRegisterId = '',
      @JsonKey(name: "cashier_id") this.cashierId = '',
      @JsonKey(name: "opened_at", fromJson: _parseLocal) this.openedAt,
      @JsonKey(name: "opening_cash", fromJson: _parseIntFlex)
      this.openingCash = 0,
      @JsonKey(name: "opening_card", fromJson: _parseIntFlex)
      this.openinCard = 0,
      this.status = CashStatus.none,
      @JsonKey(name: "created_at", fromJson: _parseLocal) this.createdAt,
      @JsonKey(name: "updated_at", fromJson: _parseLocal) this.updatedAt})
      : super._();

  factory _$ShiftResponseModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$ShiftResponseModelImplFromJson(json);

  @override
  @JsonKey()
  final String id;
  @override
  @JsonKey(name: "branch_id")
  final String branchId;
  @override
  @JsonKey(name: "cash_register_id")
  final String cashRegisterId;
  @override
  @JsonKey(name: "cashier_id")
  final String cashierId;
  @override
  @JsonKey(name: "opened_at", fromJson: _parseLocal)
  final DateTime? openedAt;
  @override
  @JsonKey(name: "opening_cash", fromJson: _parseIntFlex)
  final int openingCash;
  @override
  @JsonKey(name: "opening_card", fromJson: _parseIntFlex)
  final int openinCard;
  @override
  @JsonKey()
  final CashStatus status;
  @override
  @JsonKey(name: "created_at", fromJson: _parseLocal)
  final DateTime? createdAt;
  @override
  @JsonKey(name: "updated_at", fromJson: _parseLocal)
  final DateTime? updatedAt;

  @override
  String toString() {
    return 'ShiftResponseModel(id: $id, branchId: $branchId, cashRegisterId: $cashRegisterId, cashierId: $cashierId, openedAt: $openedAt, openingCash: $openingCash, openinCard: $openinCard, status: $status, createdAt: $createdAt, updatedAt: $updatedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ShiftResponseModelImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.branchId, branchId) ||
                other.branchId == branchId) &&
            (identical(other.cashRegisterId, cashRegisterId) ||
                other.cashRegisterId == cashRegisterId) &&
            (identical(other.cashierId, cashierId) ||
                other.cashierId == cashierId) &&
            (identical(other.openedAt, openedAt) ||
                other.openedAt == openedAt) &&
            (identical(other.openingCash, openingCash) ||
                other.openingCash == openingCash) &&
            (identical(other.openinCard, openinCard) ||
                other.openinCard == openinCard) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      branchId,
      cashRegisterId,
      cashierId,
      openedAt,
      openingCash,
      openinCard,
      status,
      createdAt,
      updatedAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ShiftResponseModelImplCopyWith<_$ShiftResponseModelImpl> get copyWith =>
      __$$ShiftResponseModelImplCopyWithImpl<_$ShiftResponseModelImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ShiftResponseModelImplToJson(
      this,
    );
  }
}

abstract class _ShiftResponseModel extends ShiftResponseModel {
  const factory _ShiftResponseModel(
      {final String id,
      @JsonKey(name: "branch_id") final String branchId,
      @JsonKey(name: "cash_register_id") final String cashRegisterId,
      @JsonKey(name: "cashier_id") final String cashierId,
      @JsonKey(name: "opened_at", fromJson: _parseLocal)
      final DateTime? openedAt,
      @JsonKey(name: "opening_cash", fromJson: _parseIntFlex)
      final int openingCash,
      @JsonKey(name: "opening_card", fromJson: _parseIntFlex)
      final int openinCard,
      final CashStatus status,
      @JsonKey(name: "created_at", fromJson: _parseLocal)
      final DateTime? createdAt,
      @JsonKey(name: "updated_at", fromJson: _parseLocal)
      final DateTime? updatedAt}) = _$ShiftResponseModelImpl;
  const _ShiftResponseModel._() : super._();

  factory _ShiftResponseModel.fromJson(Map<String, dynamic> json) =
      _$ShiftResponseModelImpl.fromJson;

  @override
  String get id;
  @override
  @JsonKey(name: "branch_id")
  String get branchId;
  @override
  @JsonKey(name: "cash_register_id")
  String get cashRegisterId;
  @override
  @JsonKey(name: "cashier_id")
  String get cashierId;
  @override
  @JsonKey(name: "opened_at", fromJson: _parseLocal)
  DateTime? get openedAt;
  @override
  @JsonKey(name: "opening_cash", fromJson: _parseIntFlex)
  int get openingCash;
  @override
  @JsonKey(name: "opening_card", fromJson: _parseIntFlex)
  int get openinCard;
  @override
  CashStatus get status;
  @override
  @JsonKey(name: "created_at", fromJson: _parseLocal)
  DateTime? get createdAt;
  @override
  @JsonKey(name: "updated_at", fromJson: _parseLocal)
  DateTime? get updatedAt;
  @override
  @JsonKey(ignore: true)
  _$$ShiftResponseModelImplCopyWith<_$ShiftResponseModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
