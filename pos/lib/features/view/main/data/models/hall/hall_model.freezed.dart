// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'hall_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

HallModel _$HallModelFromJson(Map<String, dynamic> json) {
  return _HallModel.fromJson(json);
}

/// @nodoc
mixin _$HallModel {
  String get id => throw _privateConstructorUsedError;
  @JsonKey(name: 'branch_id')
  String get branchId => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  @JsonKey(name: 'name_i18n')
  Map<String, dynamic>? get nameI18n => throw _privateConstructorUsedError;
  double get width => throw _privateConstructorUsedError;
  double get height => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $HallModelCopyWith<HallModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $HallModelCopyWith<$Res> {
  factory $HallModelCopyWith(HallModel value, $Res Function(HallModel) then) =
      _$HallModelCopyWithImpl<$Res, HallModel>;
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: 'branch_id') String branchId,
      String name,
      @JsonKey(name: 'name_i18n') Map<String, dynamic>? nameI18n,
      double width,
      double height});
}

/// @nodoc
class _$HallModelCopyWithImpl<$Res, $Val extends HallModel>
    implements $HallModelCopyWith<$Res> {
  _$HallModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? branchId = null,
    Object? name = null,
    Object? nameI18n = freezed,
    Object? width = null,
    Object? height = null,
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
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      nameI18n: freezed == nameI18n
          ? _value.nameI18n
          : nameI18n // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      width: null == width
          ? _value.width
          : width // ignore: cast_nullable_to_non_nullable
              as double,
      height: null == height
          ? _value.height
          : height // ignore: cast_nullable_to_non_nullable
              as double,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$HallModelImplCopyWith<$Res>
    implements $HallModelCopyWith<$Res> {
  factory _$$HallModelImplCopyWith(
          _$HallModelImpl value, $Res Function(_$HallModelImpl) then) =
      __$$HallModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: 'branch_id') String branchId,
      String name,
      @JsonKey(name: 'name_i18n') Map<String, dynamic>? nameI18n,
      double width,
      double height});
}

/// @nodoc
class __$$HallModelImplCopyWithImpl<$Res>
    extends _$HallModelCopyWithImpl<$Res, _$HallModelImpl>
    implements _$$HallModelImplCopyWith<$Res> {
  __$$HallModelImplCopyWithImpl(
      _$HallModelImpl _value, $Res Function(_$HallModelImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? branchId = null,
    Object? name = null,
    Object? nameI18n = freezed,
    Object? width = null,
    Object? height = null,
  }) {
    return _then(_$HallModelImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      branchId: null == branchId
          ? _value.branchId
          : branchId // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      nameI18n: freezed == nameI18n
          ? _value._nameI18n
          : nameI18n // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      width: null == width
          ? _value.width
          : width // ignore: cast_nullable_to_non_nullable
              as double,
      height: null == height
          ? _value.height
          : height // ignore: cast_nullable_to_non_nullable
              as double,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$HallModelImpl implements _HallModel {
  const _$HallModelImpl(
      {required this.id,
      @JsonKey(name: 'branch_id') required this.branchId,
      required this.name,
      @JsonKey(name: 'name_i18n') final Map<String, dynamic>? nameI18n,
      required this.width,
      required this.height})
      : _nameI18n = nameI18n;

  factory _$HallModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$HallModelImplFromJson(json);

  @override
  final String id;
  @override
  @JsonKey(name: 'branch_id')
  final String branchId;
  @override
  final String name;
  final Map<String, dynamic>? _nameI18n;
  @override
  @JsonKey(name: 'name_i18n')
  Map<String, dynamic>? get nameI18n {
    final value = _nameI18n;
    if (value == null) return null;
    if (_nameI18n is EqualUnmodifiableMapView) return _nameI18n;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  @override
  final double width;
  @override
  final double height;

  @override
  String toString() {
    return 'HallModel(id: $id, branchId: $branchId, name: $name, nameI18n: $nameI18n, width: $width, height: $height)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$HallModelImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.branchId, branchId) ||
                other.branchId == branchId) &&
            (identical(other.name, name) || other.name == name) &&
            const DeepCollectionEquality().equals(other._nameI18n, _nameI18n) &&
            (identical(other.width, width) || other.width == width) &&
            (identical(other.height, height) || other.height == height));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, branchId, name,
      const DeepCollectionEquality().hash(_nameI18n), width, height);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$HallModelImplCopyWith<_$HallModelImpl> get copyWith =>
      __$$HallModelImplCopyWithImpl<_$HallModelImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$HallModelImplToJson(
      this,
    );
  }
}

abstract class _HallModel implements HallModel {
  const factory _HallModel(
      {required final String id,
      @JsonKey(name: 'branch_id') required final String branchId,
      required final String name,
      @JsonKey(name: 'name_i18n') final Map<String, dynamic>? nameI18n,
      required final double width,
      required final double height}) = _$HallModelImpl;

  factory _HallModel.fromJson(Map<String, dynamic> json) =
      _$HallModelImpl.fromJson;

  @override
  String get id;
  @override
  @JsonKey(name: 'branch_id')
  String get branchId;
  @override
  String get name;
  @override
  @JsonKey(name: 'name_i18n')
  Map<String, dynamic>? get nameI18n;
  @override
  double get width;
  @override
  double get height;
  @override
  @JsonKey(ignore: true)
  _$$HallModelImplCopyWith<_$HallModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
