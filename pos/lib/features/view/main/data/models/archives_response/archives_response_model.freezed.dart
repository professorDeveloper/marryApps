// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'archives_response_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

ArchivesResponseModel _$ArchivesResponseModelFromJson(
    Map<String, dynamic> json) {
  return _ArchivesResponseModel.fromJson(json);
}

/// @nodoc
mixin _$ArchivesResponseModel {
  @JsonKey(name: "items")
  @ArchiveEntityListConverter()
  List<ArchiveEntity> get archives => throw _privateConstructorUsedError;
  @PaginationResponseEntityConverter()
  PaginationResponseEntity get pagination => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ArchivesResponseModelCopyWith<ArchivesResponseModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ArchivesResponseModelCopyWith<$Res> {
  factory $ArchivesResponseModelCopyWith(ArchivesResponseModel value,
          $Res Function(ArchivesResponseModel) then) =
      _$ArchivesResponseModelCopyWithImpl<$Res, ArchivesResponseModel>;
  @useResult
  $Res call(
      {@JsonKey(name: "items")
      @ArchiveEntityListConverter()
      List<ArchiveEntity> archives,
      @PaginationResponseEntityConverter()
      PaginationResponseEntity pagination});
}

/// @nodoc
class _$ArchivesResponseModelCopyWithImpl<$Res,
        $Val extends ArchivesResponseModel>
    implements $ArchivesResponseModelCopyWith<$Res> {
  _$ArchivesResponseModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? archives = null,
    Object? pagination = null,
  }) {
    return _then(_value.copyWith(
      archives: null == archives
          ? _value.archives
          : archives // ignore: cast_nullable_to_non_nullable
              as List<ArchiveEntity>,
      pagination: null == pagination
          ? _value.pagination
          : pagination // ignore: cast_nullable_to_non_nullable
              as PaginationResponseEntity,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ArchivesResponseModelImplCopyWith<$Res>
    implements $ArchivesResponseModelCopyWith<$Res> {
  factory _$$ArchivesResponseModelImplCopyWith(
          _$ArchivesResponseModelImpl value,
          $Res Function(_$ArchivesResponseModelImpl) then) =
      __$$ArchivesResponseModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@JsonKey(name: "items")
      @ArchiveEntityListConverter()
      List<ArchiveEntity> archives,
      @PaginationResponseEntityConverter()
      PaginationResponseEntity pagination});
}

/// @nodoc
class __$$ArchivesResponseModelImplCopyWithImpl<$Res>
    extends _$ArchivesResponseModelCopyWithImpl<$Res,
        _$ArchivesResponseModelImpl>
    implements _$$ArchivesResponseModelImplCopyWith<$Res> {
  __$$ArchivesResponseModelImplCopyWithImpl(_$ArchivesResponseModelImpl _value,
      $Res Function(_$ArchivesResponseModelImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? archives = null,
    Object? pagination = null,
  }) {
    return _then(_$ArchivesResponseModelImpl(
      archives: null == archives
          ? _value._archives
          : archives // ignore: cast_nullable_to_non_nullable
              as List<ArchiveEntity>,
      pagination: null == pagination
          ? _value.pagination
          : pagination // ignore: cast_nullable_to_non_nullable
              as PaginationResponseEntity,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ArchivesResponseModelImpl extends _ArchivesResponseModel {
  const _$ArchivesResponseModelImpl(
      {@JsonKey(name: "items")
      @ArchiveEntityListConverter()
      final List<ArchiveEntity> archives = const [],
      @PaginationResponseEntityConverter()
      this.pagination = const PaginationResponseModel()})
      : _archives = archives,
        super._();

  factory _$ArchivesResponseModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$ArchivesResponseModelImplFromJson(json);

  final List<ArchiveEntity> _archives;
  @override
  @JsonKey(name: "items")
  @ArchiveEntityListConverter()
  List<ArchiveEntity> get archives {
    if (_archives is EqualUnmodifiableListView) return _archives;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_archives);
  }

  @override
  @JsonKey()
  @PaginationResponseEntityConverter()
  final PaginationResponseEntity pagination;

  @override
  String toString() {
    return 'ArchivesResponseModel(archives: $archives, pagination: $pagination)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ArchivesResponseModelImpl &&
            const DeepCollectionEquality().equals(other._archives, _archives) &&
            (identical(other.pagination, pagination) ||
                other.pagination == pagination));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType, const DeepCollectionEquality().hash(_archives), pagination);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ArchivesResponseModelImplCopyWith<_$ArchivesResponseModelImpl>
      get copyWith => __$$ArchivesResponseModelImplCopyWithImpl<
          _$ArchivesResponseModelImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ArchivesResponseModelImplToJson(
      this,
    );
  }
}

abstract class _ArchivesResponseModel extends ArchivesResponseModel {
  const factory _ArchivesResponseModel(
      {@JsonKey(name: "items")
      @ArchiveEntityListConverter()
      final List<ArchiveEntity> archives,
      @PaginationResponseEntityConverter()
      final PaginationResponseEntity pagination}) = _$ArchivesResponseModelImpl;
  const _ArchivesResponseModel._() : super._();

  factory _ArchivesResponseModel.fromJson(Map<String, dynamic> json) =
      _$ArchivesResponseModelImpl.fromJson;

  @override
  @JsonKey(name: "items")
  @ArchiveEntityListConverter()
  List<ArchiveEntity> get archives;
  @override
  @PaginationResponseEntityConverter()
  PaginationResponseEntity get pagination;
  @override
  @JsonKey(ignore: true)
  _$$ArchivesResponseModelImplCopyWith<_$ArchivesResponseModelImpl>
      get copyWith => throw _privateConstructorUsedError;
}
