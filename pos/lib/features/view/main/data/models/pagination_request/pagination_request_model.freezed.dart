// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'pagination_request_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

PaginationRequestModel _$PaginationRequestModelFromJson(
    Map<String, dynamic> json) {
  return _PaginationRequestModel.fromJson(json);
}

/// @nodoc
mixin _$PaginationRequestModel {
  int get limit => throw _privateConstructorUsedError;
  int get offset => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $PaginationRequestModelCopyWith<PaginationRequestModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PaginationRequestModelCopyWith<$Res> {
  factory $PaginationRequestModelCopyWith(PaginationRequestModel value,
          $Res Function(PaginationRequestModel) then) =
      _$PaginationRequestModelCopyWithImpl<$Res, PaginationRequestModel>;
  @useResult
  $Res call({int limit, int offset});
}

/// @nodoc
class _$PaginationRequestModelCopyWithImpl<$Res,
        $Val extends PaginationRequestModel>
    implements $PaginationRequestModelCopyWith<$Res> {
  _$PaginationRequestModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? limit = null,
    Object? offset = null,
  }) {
    return _then(_value.copyWith(
      limit: null == limit
          ? _value.limit
          : limit // ignore: cast_nullable_to_non_nullable
              as int,
      offset: null == offset
          ? _value.offset
          : offset // ignore: cast_nullable_to_non_nullable
              as int,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$PaginationRequestModelImplCopyWith<$Res>
    implements $PaginationRequestModelCopyWith<$Res> {
  factory _$$PaginationRequestModelImplCopyWith(
          _$PaginationRequestModelImpl value,
          $Res Function(_$PaginationRequestModelImpl) then) =
      __$$PaginationRequestModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({int limit, int offset});
}

/// @nodoc
class __$$PaginationRequestModelImplCopyWithImpl<$Res>
    extends _$PaginationRequestModelCopyWithImpl<$Res,
        _$PaginationRequestModelImpl>
    implements _$$PaginationRequestModelImplCopyWith<$Res> {
  __$$PaginationRequestModelImplCopyWithImpl(
      _$PaginationRequestModelImpl _value,
      $Res Function(_$PaginationRequestModelImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? limit = null,
    Object? offset = null,
  }) {
    return _then(_$PaginationRequestModelImpl(
      limit: null == limit
          ? _value.limit
          : limit // ignore: cast_nullable_to_non_nullable
              as int,
      offset: null == offset
          ? _value.offset
          : offset // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$PaginationRequestModelImpl extends _PaginationRequestModel {
  const _$PaginationRequestModelImpl({this.limit = 10, this.offset = 0})
      : super._();

  factory _$PaginationRequestModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$PaginationRequestModelImplFromJson(json);

  @override
  @JsonKey()
  final int limit;
  @override
  @JsonKey()
  final int offset;

  @override
  String toString() {
    return 'PaginationRequestModel(limit: $limit, offset: $offset)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PaginationRequestModelImpl &&
            (identical(other.limit, limit) || other.limit == limit) &&
            (identical(other.offset, offset) || other.offset == offset));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, limit, offset);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$PaginationRequestModelImplCopyWith<_$PaginationRequestModelImpl>
      get copyWith => __$$PaginationRequestModelImplCopyWithImpl<
          _$PaginationRequestModelImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$PaginationRequestModelImplToJson(
      this,
    );
  }
}

abstract class _PaginationRequestModel extends PaginationRequestModel {
  const factory _PaginationRequestModel({final int limit, final int offset}) =
      _$PaginationRequestModelImpl;
  const _PaginationRequestModel._() : super._();

  factory _PaginationRequestModel.fromJson(Map<String, dynamic> json) =
      _$PaginationRequestModelImpl.fromJson;

  @override
  int get limit;
  @override
  int get offset;
  @override
  @JsonKey(ignore: true)
  _$$PaginationRequestModelImplCopyWith<_$PaginationRequestModelImpl>
      get copyWith => throw _privateConstructorUsedError;
}
