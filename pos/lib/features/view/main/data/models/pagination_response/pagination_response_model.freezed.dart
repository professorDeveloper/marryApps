// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'pagination_response_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

PaginationResponseModel _$PaginationResponseModelFromJson(
    Map<String, dynamic> json) {
  return _PaginationResponseModel.fromJson(json);
}

/// @nodoc
mixin _$PaginationResponseModel {
  int get offset => throw _privateConstructorUsedError;
  int get limit => throw _privateConstructorUsedError;
  int get total => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $PaginationResponseModelCopyWith<PaginationResponseModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PaginationResponseModelCopyWith<$Res> {
  factory $PaginationResponseModelCopyWith(PaginationResponseModel value,
          $Res Function(PaginationResponseModel) then) =
      _$PaginationResponseModelCopyWithImpl<$Res, PaginationResponseModel>;
  @useResult
  $Res call({int offset, int limit, int total});
}

/// @nodoc
class _$PaginationResponseModelCopyWithImpl<$Res,
        $Val extends PaginationResponseModel>
    implements $PaginationResponseModelCopyWith<$Res> {
  _$PaginationResponseModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? offset = null,
    Object? limit = null,
    Object? total = null,
  }) {
    return _then(_value.copyWith(
      offset: null == offset
          ? _value.offset
          : offset // ignore: cast_nullable_to_non_nullable
              as int,
      limit: null == limit
          ? _value.limit
          : limit // ignore: cast_nullable_to_non_nullable
              as int,
      total: null == total
          ? _value.total
          : total // ignore: cast_nullable_to_non_nullable
              as int,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$PaginationResponseModelImplCopyWith<$Res>
    implements $PaginationResponseModelCopyWith<$Res> {
  factory _$$PaginationResponseModelImplCopyWith(
          _$PaginationResponseModelImpl value,
          $Res Function(_$PaginationResponseModelImpl) then) =
      __$$PaginationResponseModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({int offset, int limit, int total});
}

/// @nodoc
class __$$PaginationResponseModelImplCopyWithImpl<$Res>
    extends _$PaginationResponseModelCopyWithImpl<$Res,
        _$PaginationResponseModelImpl>
    implements _$$PaginationResponseModelImplCopyWith<$Res> {
  __$$PaginationResponseModelImplCopyWithImpl(
      _$PaginationResponseModelImpl _value,
      $Res Function(_$PaginationResponseModelImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? offset = null,
    Object? limit = null,
    Object? total = null,
  }) {
    return _then(_$PaginationResponseModelImpl(
      offset: null == offset
          ? _value.offset
          : offset // ignore: cast_nullable_to_non_nullable
              as int,
      limit: null == limit
          ? _value.limit
          : limit // ignore: cast_nullable_to_non_nullable
              as int,
      total: null == total
          ? _value.total
          : total // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$PaginationResponseModelImpl extends _PaginationResponseModel {
  const _$PaginationResponseModelImpl(
      {this.offset = 0, this.limit = 0, this.total = 0})
      : super._();

  factory _$PaginationResponseModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$PaginationResponseModelImplFromJson(json);

  @override
  @JsonKey()
  final int offset;
  @override
  @JsonKey()
  final int limit;
  @override
  @JsonKey()
  final int total;

  @override
  String toString() {
    return 'PaginationResponseModel(offset: $offset, limit: $limit, total: $total)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PaginationResponseModelImpl &&
            (identical(other.offset, offset) || other.offset == offset) &&
            (identical(other.limit, limit) || other.limit == limit) &&
            (identical(other.total, total) || other.total == total));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, offset, limit, total);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$PaginationResponseModelImplCopyWith<_$PaginationResponseModelImpl>
      get copyWith => __$$PaginationResponseModelImplCopyWithImpl<
          _$PaginationResponseModelImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$PaginationResponseModelImplToJson(
      this,
    );
  }
}

abstract class _PaginationResponseModel extends PaginationResponseModel {
  const factory _PaginationResponseModel(
      {final int offset,
      final int limit,
      final int total}) = _$PaginationResponseModelImpl;
  const _PaginationResponseModel._() : super._();

  factory _PaginationResponseModel.fromJson(Map<String, dynamic> json) =
      _$PaginationResponseModelImpl.fromJson;

  @override
  int get offset;
  @override
  int get limit;
  @override
  int get total;
  @override
  @JsonKey(ignore: true)
  _$$PaginationResponseModelImplCopyWith<_$PaginationResponseModelImpl>
      get copyWith => throw _privateConstructorUsedError;
}
