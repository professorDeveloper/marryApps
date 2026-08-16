// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'cafe_tables_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

CafeTableModel _$CafeTableModelFromJson(Map<String, dynamic> json) {
  return _CafeTableModel.fromJson(json);
}

/// @nodoc
mixin _$CafeTableModel {
  String get id => throw _privateConstructorUsedError;
  @JsonKey(name: 'hall_id')
  String get hallId => throw _privateConstructorUsedError;
  int get number => throw _privateConstructorUsedError;
  @JsonKey(name: 'pos_x')
  double get posX => throw _privateConstructorUsedError;
  @JsonKey(name: 'pos_y')
  double get posY => throw _privateConstructorUsedError;
  double get width => throw _privateConstructorUsedError;
  double get height => throw _privateConstructorUsedError;
  double get rotation => throw _privateConstructorUsedError;
  int get capacity => throw _privateConstructorUsedError;
  TableStatus get status => throw _privateConstructorUsedError;
  @JsonKey(name: 'shape', unknownEnumValue: TableShape.rectangle)
  TableShape get shape => throw _privateConstructorUsedError;
  @JsonKey(name: 'table_type')
  String? get tableType => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CafeTableModelCopyWith<CafeTableModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CafeTableModelCopyWith<$Res> {
  factory $CafeTableModelCopyWith(
          CafeTableModel value, $Res Function(CafeTableModel) then) =
      _$CafeTableModelCopyWithImpl<$Res, CafeTableModel>;
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: 'hall_id') String hallId,
      int number,
      @JsonKey(name: 'pos_x') double posX,
      @JsonKey(name: 'pos_y') double posY,
      double width,
      double height,
      double rotation,
      int capacity,
      TableStatus status,
      @JsonKey(name: 'shape', unknownEnumValue: TableShape.rectangle)
      TableShape shape,
      @JsonKey(name: 'table_type') String? tableType});
}

/// @nodoc
class _$CafeTableModelCopyWithImpl<$Res, $Val extends CafeTableModel>
    implements $CafeTableModelCopyWith<$Res> {
  _$CafeTableModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? hallId = null,
    Object? number = null,
    Object? posX = null,
    Object? posY = null,
    Object? width = null,
    Object? height = null,
    Object? rotation = null,
    Object? capacity = null,
    Object? status = null,
    Object? shape = null,
    Object? tableType = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      hallId: null == hallId
          ? _value.hallId
          : hallId // ignore: cast_nullable_to_non_nullable
              as String,
      number: null == number
          ? _value.number
          : number // ignore: cast_nullable_to_non_nullable
              as int,
      posX: null == posX
          ? _value.posX
          : posX // ignore: cast_nullable_to_non_nullable
              as double,
      posY: null == posY
          ? _value.posY
          : posY // ignore: cast_nullable_to_non_nullable
              as double,
      width: null == width
          ? _value.width
          : width // ignore: cast_nullable_to_non_nullable
              as double,
      height: null == height
          ? _value.height
          : height // ignore: cast_nullable_to_non_nullable
              as double,
      rotation: null == rotation
          ? _value.rotation
          : rotation // ignore: cast_nullable_to_non_nullable
              as double,
      capacity: null == capacity
          ? _value.capacity
          : capacity // ignore: cast_nullable_to_non_nullable
              as int,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as TableStatus,
      shape: null == shape
          ? _value.shape
          : shape // ignore: cast_nullable_to_non_nullable
              as TableShape,
      tableType: freezed == tableType
          ? _value.tableType
          : tableType // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CafeTableModelImplCopyWith<$Res>
    implements $CafeTableModelCopyWith<$Res> {
  factory _$$CafeTableModelImplCopyWith(_$CafeTableModelImpl value,
          $Res Function(_$CafeTableModelImpl) then) =
      __$$CafeTableModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: 'hall_id') String hallId,
      int number,
      @JsonKey(name: 'pos_x') double posX,
      @JsonKey(name: 'pos_y') double posY,
      double width,
      double height,
      double rotation,
      int capacity,
      TableStatus status,
      @JsonKey(name: 'shape', unknownEnumValue: TableShape.rectangle)
      TableShape shape,
      @JsonKey(name: 'table_type') String? tableType});
}

/// @nodoc
class __$$CafeTableModelImplCopyWithImpl<$Res>
    extends _$CafeTableModelCopyWithImpl<$Res, _$CafeTableModelImpl>
    implements _$$CafeTableModelImplCopyWith<$Res> {
  __$$CafeTableModelImplCopyWithImpl(
      _$CafeTableModelImpl _value, $Res Function(_$CafeTableModelImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? hallId = null,
    Object? number = null,
    Object? posX = null,
    Object? posY = null,
    Object? width = null,
    Object? height = null,
    Object? rotation = null,
    Object? capacity = null,
    Object? status = null,
    Object? shape = null,
    Object? tableType = freezed,
  }) {
    return _then(_$CafeTableModelImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      hallId: null == hallId
          ? _value.hallId
          : hallId // ignore: cast_nullable_to_non_nullable
              as String,
      number: null == number
          ? _value.number
          : number // ignore: cast_nullable_to_non_nullable
              as int,
      posX: null == posX
          ? _value.posX
          : posX // ignore: cast_nullable_to_non_nullable
              as double,
      posY: null == posY
          ? _value.posY
          : posY // ignore: cast_nullable_to_non_nullable
              as double,
      width: null == width
          ? _value.width
          : width // ignore: cast_nullable_to_non_nullable
              as double,
      height: null == height
          ? _value.height
          : height // ignore: cast_nullable_to_non_nullable
              as double,
      rotation: null == rotation
          ? _value.rotation
          : rotation // ignore: cast_nullable_to_non_nullable
              as double,
      capacity: null == capacity
          ? _value.capacity
          : capacity // ignore: cast_nullable_to_non_nullable
              as int,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as TableStatus,
      shape: null == shape
          ? _value.shape
          : shape // ignore: cast_nullable_to_non_nullable
              as TableShape,
      tableType: freezed == tableType
          ? _value.tableType
          : tableType // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CafeTableModelImpl implements _CafeTableModel {
  const _$CafeTableModelImpl(
      {required this.id,
      @JsonKey(name: 'hall_id') required this.hallId,
      required this.number,
      @JsonKey(name: 'pos_x') required this.posX,
      @JsonKey(name: 'pos_y') required this.posY,
      required this.width,
      required this.height,
      required this.rotation,
      required this.capacity,
      this.status = TableStatus.free,
      @JsonKey(name: 'shape', unknownEnumValue: TableShape.rectangle)
      this.shape = TableShape.rectangle,
      @JsonKey(name: 'table_type') this.tableType});

  factory _$CafeTableModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$CafeTableModelImplFromJson(json);

  @override
  final String id;
  @override
  @JsonKey(name: 'hall_id')
  final String hallId;
  @override
  final int number;
  @override
  @JsonKey(name: 'pos_x')
  final double posX;
  @override
  @JsonKey(name: 'pos_y')
  final double posY;
  @override
  final double width;
  @override
  final double height;
  @override
  final double rotation;
  @override
  final int capacity;
  @override
  @JsonKey()
  final TableStatus status;
  @override
  @JsonKey(name: 'shape', unknownEnumValue: TableShape.rectangle)
  final TableShape shape;
  @override
  @JsonKey(name: 'table_type')
  final String? tableType;

  @override
  String toString() {
    return 'CafeTableModel(id: $id, hallId: $hallId, number: $number, posX: $posX, posY: $posY, width: $width, height: $height, rotation: $rotation, capacity: $capacity, status: $status, shape: $shape, tableType: $tableType)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CafeTableModelImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.hallId, hallId) || other.hallId == hallId) &&
            (identical(other.number, number) || other.number == number) &&
            (identical(other.posX, posX) || other.posX == posX) &&
            (identical(other.posY, posY) || other.posY == posY) &&
            (identical(other.width, width) || other.width == width) &&
            (identical(other.height, height) || other.height == height) &&
            (identical(other.rotation, rotation) ||
                other.rotation == rotation) &&
            (identical(other.capacity, capacity) ||
                other.capacity == capacity) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.shape, shape) || other.shape == shape) &&
            (identical(other.tableType, tableType) ||
                other.tableType == tableType));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, hallId, number, posX, posY,
      width, height, rotation, capacity, status, shape, tableType);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CafeTableModelImplCopyWith<_$CafeTableModelImpl> get copyWith =>
      __$$CafeTableModelImplCopyWithImpl<_$CafeTableModelImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CafeTableModelImplToJson(
      this,
    );
  }
}

abstract class _CafeTableModel implements CafeTableModel {
  const factory _CafeTableModel(
          {required final String id,
          @JsonKey(name: 'hall_id') required final String hallId,
          required final int number,
          @JsonKey(name: 'pos_x') required final double posX,
          @JsonKey(name: 'pos_y') required final double posY,
          required final double width,
          required final double height,
          required final double rotation,
          required final int capacity,
          final TableStatus status,
          @JsonKey(name: 'shape', unknownEnumValue: TableShape.rectangle)
          final TableShape shape,
          @JsonKey(name: 'table_type') final String? tableType}) =
      _$CafeTableModelImpl;

  factory _CafeTableModel.fromJson(Map<String, dynamic> json) =
      _$CafeTableModelImpl.fromJson;

  @override
  String get id;
  @override
  @JsonKey(name: 'hall_id')
  String get hallId;
  @override
  int get number;
  @override
  @JsonKey(name: 'pos_x')
  double get posX;
  @override
  @JsonKey(name: 'pos_y')
  double get posY;
  @override
  double get width;
  @override
  double get height;
  @override
  double get rotation;
  @override
  int get capacity;
  @override
  TableStatus get status;
  @override
  @JsonKey(name: 'shape', unknownEnumValue: TableShape.rectangle)
  TableShape get shape;
  @override
  @JsonKey(name: 'table_type')
  String? get tableType;
  @override
  @JsonKey(ignore: true)
  _$$CafeTableModelImplCopyWith<_$CafeTableModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
