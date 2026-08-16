// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'close_shift_request_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

CloseShiftRequestModel _$CloseShiftRequestModelFromJson(
    Map<String, dynamic> json) {
  return _CloseShiftRequestModel.fromJson(json);
}

/// @nodoc
mixin _$CloseShiftRequestModel {
  String get shiftId => throw _privateConstructorUsedError;
  @JsonKey(name: "closing_card", toJson: _intToString)
  int get closingCard => throw _privateConstructorUsedError;
  @JsonKey(name: "closing_cash", toJson: _intToString)
  int get closingCash => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CloseShiftRequestModelCopyWith<CloseShiftRequestModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CloseShiftRequestModelCopyWith<$Res> {
  factory $CloseShiftRequestModelCopyWith(CloseShiftRequestModel value,
          $Res Function(CloseShiftRequestModel) then) =
      _$CloseShiftRequestModelCopyWithImpl<$Res, CloseShiftRequestModel>;
  @useResult
  $Res call(
      {String shiftId,
      @JsonKey(name: "closing_card", toJson: _intToString) int closingCard,
      @JsonKey(name: "closing_cash", toJson: _intToString) int closingCash});
}

/// @nodoc
class _$CloseShiftRequestModelCopyWithImpl<$Res,
        $Val extends CloseShiftRequestModel>
    implements $CloseShiftRequestModelCopyWith<$Res> {
  _$CloseShiftRequestModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? shiftId = null,
    Object? closingCard = null,
    Object? closingCash = null,
  }) {
    return _then(_value.copyWith(
      shiftId: null == shiftId
          ? _value.shiftId
          : shiftId // ignore: cast_nullable_to_non_nullable
              as String,
      closingCard: null == closingCard
          ? _value.closingCard
          : closingCard // ignore: cast_nullable_to_non_nullable
              as int,
      closingCash: null == closingCash
          ? _value.closingCash
          : closingCash // ignore: cast_nullable_to_non_nullable
              as int,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CloseShiftRequestModelImplCopyWith<$Res>
    implements $CloseShiftRequestModelCopyWith<$Res> {
  factory _$$CloseShiftRequestModelImplCopyWith(
          _$CloseShiftRequestModelImpl value,
          $Res Function(_$CloseShiftRequestModelImpl) then) =
      __$$CloseShiftRequestModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String shiftId,
      @JsonKey(name: "closing_card", toJson: _intToString) int closingCard,
      @JsonKey(name: "closing_cash", toJson: _intToString) int closingCash});
}

/// @nodoc
class __$$CloseShiftRequestModelImplCopyWithImpl<$Res>
    extends _$CloseShiftRequestModelCopyWithImpl<$Res,
        _$CloseShiftRequestModelImpl>
    implements _$$CloseShiftRequestModelImplCopyWith<$Res> {
  __$$CloseShiftRequestModelImplCopyWithImpl(
      _$CloseShiftRequestModelImpl _value,
      $Res Function(_$CloseShiftRequestModelImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? shiftId = null,
    Object? closingCard = null,
    Object? closingCash = null,
  }) {
    return _then(_$CloseShiftRequestModelImpl(
      shiftId: null == shiftId
          ? _value.shiftId
          : shiftId // ignore: cast_nullable_to_non_nullable
              as String,
      closingCard: null == closingCard
          ? _value.closingCard
          : closingCard // ignore: cast_nullable_to_non_nullable
              as int,
      closingCash: null == closingCash
          ? _value.closingCash
          : closingCash // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CloseShiftRequestModelImpl extends _CloseShiftRequestModel {
  const _$CloseShiftRequestModelImpl(
      {this.shiftId = '',
      @JsonKey(name: "closing_card", toJson: _intToString) this.closingCard = 0,
      @JsonKey(name: "closing_cash", toJson: _intToString)
      this.closingCash = 0})
      : super._();

  factory _$CloseShiftRequestModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$CloseShiftRequestModelImplFromJson(json);

  @override
  @JsonKey()
  final String shiftId;
  @override
  @JsonKey(name: "closing_card", toJson: _intToString)
  final int closingCard;
  @override
  @JsonKey(name: "closing_cash", toJson: _intToString)
  final int closingCash;

  @override
  String toString() {
    return 'CloseShiftRequestModel(shiftId: $shiftId, closingCard: $closingCard, closingCash: $closingCash)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CloseShiftRequestModelImpl &&
            (identical(other.shiftId, shiftId) || other.shiftId == shiftId) &&
            (identical(other.closingCard, closingCard) ||
                other.closingCard == closingCard) &&
            (identical(other.closingCash, closingCash) ||
                other.closingCash == closingCash));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode =>
      Object.hash(runtimeType, shiftId, closingCard, closingCash);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CloseShiftRequestModelImplCopyWith<_$CloseShiftRequestModelImpl>
      get copyWith => __$$CloseShiftRequestModelImplCopyWithImpl<
          _$CloseShiftRequestModelImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CloseShiftRequestModelImplToJson(
      this,
    );
  }
}

abstract class _CloseShiftRequestModel extends CloseShiftRequestModel {
  const factory _CloseShiftRequestModel(
      {final String shiftId,
      @JsonKey(name: "closing_card", toJson: _intToString)
      final int closingCard,
      @JsonKey(name: "closing_cash", toJson: _intToString)
      final int closingCash}) = _$CloseShiftRequestModelImpl;
  const _CloseShiftRequestModel._() : super._();

  factory _CloseShiftRequestModel.fromJson(Map<String, dynamic> json) =
      _$CloseShiftRequestModelImpl.fromJson;

  @override
  String get shiftId;
  @override
  @JsonKey(name: "closing_card", toJson: _intToString)
  int get closingCard;
  @override
  @JsonKey(name: "closing_cash", toJson: _intToString)
  int get closingCash;
  @override
  @JsonKey(ignore: true)
  _$$CloseShiftRequestModelImplCopyWith<_$CloseShiftRequestModelImpl>
      get copyWith => throw _privateConstructorUsedError;
}
