// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'hour_price_response_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

HourPriceResponseModel _$HourPriceResponseModelFromJson(
    Map<String, dynamic> json) {
  return _HourPriceResponseModel.fromJson(json);
}

/// @nodoc
mixin _$HourPriceResponseModel {
  @JsonKey(name: "table_id")
  String get tableId => throw _privateConstructorUsedError; //!
  @JsonKey(name: "price_per_hour", fromJson: double.parse)
  double get perHour => throw _privateConstructorUsedError; //!
  @JsonKey(name: "total_price", fromJson: double.parse)
  double get totalPrice => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $HourPriceResponseModelCopyWith<HourPriceResponseModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $HourPriceResponseModelCopyWith<$Res> {
  factory $HourPriceResponseModelCopyWith(HourPriceResponseModel value,
          $Res Function(HourPriceResponseModel) then) =
      _$HourPriceResponseModelCopyWithImpl<$Res, HourPriceResponseModel>;
  @useResult
  $Res call(
      {@JsonKey(name: "table_id") String tableId,
      @JsonKey(name: "price_per_hour", fromJson: double.parse) double perHour,
      @JsonKey(name: "total_price", fromJson: double.parse) double totalPrice});
}

/// @nodoc
class _$HourPriceResponseModelCopyWithImpl<$Res,
        $Val extends HourPriceResponseModel>
    implements $HourPriceResponseModelCopyWith<$Res> {
  _$HourPriceResponseModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? tableId = null,
    Object? perHour = null,
    Object? totalPrice = null,
  }) {
    return _then(_value.copyWith(
      tableId: null == tableId
          ? _value.tableId
          : tableId // ignore: cast_nullable_to_non_nullable
              as String,
      perHour: null == perHour
          ? _value.perHour
          : perHour // ignore: cast_nullable_to_non_nullable
              as double,
      totalPrice: null == totalPrice
          ? _value.totalPrice
          : totalPrice // ignore: cast_nullable_to_non_nullable
              as double,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$HourPriceResponseModelImplCopyWith<$Res>
    implements $HourPriceResponseModelCopyWith<$Res> {
  factory _$$HourPriceResponseModelImplCopyWith(
          _$HourPriceResponseModelImpl value,
          $Res Function(_$HourPriceResponseModelImpl) then) =
      __$$HourPriceResponseModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@JsonKey(name: "table_id") String tableId,
      @JsonKey(name: "price_per_hour", fromJson: double.parse) double perHour,
      @JsonKey(name: "total_price", fromJson: double.parse) double totalPrice});
}

/// @nodoc
class __$$HourPriceResponseModelImplCopyWithImpl<$Res>
    extends _$HourPriceResponseModelCopyWithImpl<$Res,
        _$HourPriceResponseModelImpl>
    implements _$$HourPriceResponseModelImplCopyWith<$Res> {
  __$$HourPriceResponseModelImplCopyWithImpl(
      _$HourPriceResponseModelImpl _value,
      $Res Function(_$HourPriceResponseModelImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? tableId = null,
    Object? perHour = null,
    Object? totalPrice = null,
  }) {
    return _then(_$HourPriceResponseModelImpl(
      tableId: null == tableId
          ? _value.tableId
          : tableId // ignore: cast_nullable_to_non_nullable
              as String,
      perHour: null == perHour
          ? _value.perHour
          : perHour // ignore: cast_nullable_to_non_nullable
              as double,
      totalPrice: null == totalPrice
          ? _value.totalPrice
          : totalPrice // ignore: cast_nullable_to_non_nullable
              as double,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$HourPriceResponseModelImpl extends _HourPriceResponseModel {
  const _$HourPriceResponseModelImpl(
      {@JsonKey(name: "table_id") this.tableId = '',
      @JsonKey(name: "price_per_hour", fromJson: double.parse)
      this.perHour = 0.0,
      @JsonKey(name: "total_price", fromJson: double.parse)
      this.totalPrice = 0.0})
      : super._();

  factory _$HourPriceResponseModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$HourPriceResponseModelImplFromJson(json);

  @override
  @JsonKey(name: "table_id")
  final String tableId;
//!
  @override
  @JsonKey(name: "price_per_hour", fromJson: double.parse)
  final double perHour;
//!
  @override
  @JsonKey(name: "total_price", fromJson: double.parse)
  final double totalPrice;

  @override
  String toString() {
    return 'HourPriceResponseModel(tableId: $tableId, perHour: $perHour, totalPrice: $totalPrice)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$HourPriceResponseModelImpl &&
            (identical(other.tableId, tableId) || other.tableId == tableId) &&
            (identical(other.perHour, perHour) || other.perHour == perHour) &&
            (identical(other.totalPrice, totalPrice) ||
                other.totalPrice == totalPrice));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, tableId, perHour, totalPrice);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$HourPriceResponseModelImplCopyWith<_$HourPriceResponseModelImpl>
      get copyWith => __$$HourPriceResponseModelImplCopyWithImpl<
          _$HourPriceResponseModelImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$HourPriceResponseModelImplToJson(
      this,
    );
  }
}

abstract class _HourPriceResponseModel extends HourPriceResponseModel {
  const factory _HourPriceResponseModel(
      {@JsonKey(name: "table_id") final String tableId,
      @JsonKey(name: "price_per_hour", fromJson: double.parse)
      final double perHour,
      @JsonKey(name: "total_price", fromJson: double.parse)
      final double totalPrice}) = _$HourPriceResponseModelImpl;
  const _HourPriceResponseModel._() : super._();

  factory _HourPriceResponseModel.fromJson(Map<String, dynamic> json) =
      _$HourPriceResponseModelImpl.fromJson;

  @override
  @JsonKey(name: "table_id")
  String get tableId;
  @override //!
  @JsonKey(name: "price_per_hour", fromJson: double.parse)
  double get perHour;
  @override //!
  @JsonKey(name: "total_price", fromJson: double.parse)
  double get totalPrice;
  @override
  @JsonKey(ignore: true)
  _$$HourPriceResponseModelImplCopyWith<_$HourPriceResponseModelImpl>
      get copyWith => throw _privateConstructorUsedError;
}
