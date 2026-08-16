// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'archives_filter_request_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

ArchivesFilterRequestModel _$ArchivesFilterRequestModelFromJson(
    Map<String, dynamic> json) {
  return _ArchivesFilterRequestModel.fromJson(json);
}

/// @nodoc
mixin _$ArchivesFilterRequestModel {
  int? get archiveNum => throw _privateConstructorUsedError;
  ArchivesFilterType get filterType => throw _privateConstructorUsedError;
  DateTime? get startDate => throw _privateConstructorUsedError;
  DateTime? get endDate => throw _privateConstructorUsedError;
  @PaginationRequestEntityConverter()
  PaginationRequestEntity? get pagination => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ArchivesFilterRequestModelCopyWith<ArchivesFilterRequestModel>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ArchivesFilterRequestModelCopyWith<$Res> {
  factory $ArchivesFilterRequestModelCopyWith(ArchivesFilterRequestModel value,
          $Res Function(ArchivesFilterRequestModel) then) =
      _$ArchivesFilterRequestModelCopyWithImpl<$Res,
          ArchivesFilterRequestModel>;
  @useResult
  $Res call(
      {int? archiveNum,
      ArchivesFilterType filterType,
      DateTime? startDate,
      DateTime? endDate,
      @PaginationRequestEntityConverter() PaginationRequestEntity? pagination});
}

/// @nodoc
class _$ArchivesFilterRequestModelCopyWithImpl<$Res,
        $Val extends ArchivesFilterRequestModel>
    implements $ArchivesFilterRequestModelCopyWith<$Res> {
  _$ArchivesFilterRequestModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? archiveNum = freezed,
    Object? filterType = null,
    Object? startDate = freezed,
    Object? endDate = freezed,
    Object? pagination = freezed,
  }) {
    return _then(_value.copyWith(
      archiveNum: freezed == archiveNum
          ? _value.archiveNum
          : archiveNum // ignore: cast_nullable_to_non_nullable
              as int?,
      filterType: null == filterType
          ? _value.filterType
          : filterType // ignore: cast_nullable_to_non_nullable
              as ArchivesFilterType,
      startDate: freezed == startDate
          ? _value.startDate
          : startDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      endDate: freezed == endDate
          ? _value.endDate
          : endDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      pagination: freezed == pagination
          ? _value.pagination
          : pagination // ignore: cast_nullable_to_non_nullable
              as PaginationRequestEntity?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ArchivesFilterRequestModelImplCopyWith<$Res>
    implements $ArchivesFilterRequestModelCopyWith<$Res> {
  factory _$$ArchivesFilterRequestModelImplCopyWith(
          _$ArchivesFilterRequestModelImpl value,
          $Res Function(_$ArchivesFilterRequestModelImpl) then) =
      __$$ArchivesFilterRequestModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int? archiveNum,
      ArchivesFilterType filterType,
      DateTime? startDate,
      DateTime? endDate,
      @PaginationRequestEntityConverter() PaginationRequestEntity? pagination});
}

/// @nodoc
class __$$ArchivesFilterRequestModelImplCopyWithImpl<$Res>
    extends _$ArchivesFilterRequestModelCopyWithImpl<$Res,
        _$ArchivesFilterRequestModelImpl>
    implements _$$ArchivesFilterRequestModelImplCopyWith<$Res> {
  __$$ArchivesFilterRequestModelImplCopyWithImpl(
      _$ArchivesFilterRequestModelImpl _value,
      $Res Function(_$ArchivesFilterRequestModelImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? archiveNum = freezed,
    Object? filterType = null,
    Object? startDate = freezed,
    Object? endDate = freezed,
    Object? pagination = freezed,
  }) {
    return _then(_$ArchivesFilterRequestModelImpl(
      archiveNum: freezed == archiveNum
          ? _value.archiveNum
          : archiveNum // ignore: cast_nullable_to_non_nullable
              as int?,
      filterType: null == filterType
          ? _value.filterType
          : filterType // ignore: cast_nullable_to_non_nullable
              as ArchivesFilterType,
      startDate: freezed == startDate
          ? _value.startDate
          : startDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      endDate: freezed == endDate
          ? _value.endDate
          : endDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      pagination: freezed == pagination
          ? _value.pagination
          : pagination // ignore: cast_nullable_to_non_nullable
              as PaginationRequestEntity?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ArchivesFilterRequestModelImpl extends _ArchivesFilterRequestModel {
  const _$ArchivesFilterRequestModelImpl(
      {this.archiveNum,
      this.filterType = ArchivesFilterType.Today,
      this.startDate,
      this.endDate,
      @PaginationRequestEntityConverter() this.pagination})
      : super._();

  factory _$ArchivesFilterRequestModelImpl.fromJson(
          Map<String, dynamic> json) =>
      _$$ArchivesFilterRequestModelImplFromJson(json);

  @override
  final int? archiveNum;
  @override
  @JsonKey()
  final ArchivesFilterType filterType;
  @override
  final DateTime? startDate;
  @override
  final DateTime? endDate;
  @override
  @PaginationRequestEntityConverter()
  final PaginationRequestEntity? pagination;

  @override
  String toString() {
    return 'ArchivesFilterRequestModel(archiveNum: $archiveNum, filterType: $filterType, startDate: $startDate, endDate: $endDate, pagination: $pagination)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ArchivesFilterRequestModelImpl &&
            (identical(other.archiveNum, archiveNum) ||
                other.archiveNum == archiveNum) &&
            (identical(other.filterType, filterType) ||
                other.filterType == filterType) &&
            (identical(other.startDate, startDate) ||
                other.startDate == startDate) &&
            (identical(other.endDate, endDate) || other.endDate == endDate) &&
            (identical(other.pagination, pagination) ||
                other.pagination == pagination));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType, archiveNum, filterType, startDate, endDate, pagination);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ArchivesFilterRequestModelImplCopyWith<_$ArchivesFilterRequestModelImpl>
      get copyWith => __$$ArchivesFilterRequestModelImplCopyWithImpl<
          _$ArchivesFilterRequestModelImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ArchivesFilterRequestModelImplToJson(
      this,
    );
  }
}

abstract class _ArchivesFilterRequestModel extends ArchivesFilterRequestModel {
  const factory _ArchivesFilterRequestModel(
          {final int? archiveNum,
          final ArchivesFilterType filterType,
          final DateTime? startDate,
          final DateTime? endDate,
          @PaginationRequestEntityConverter()
          final PaginationRequestEntity? pagination}) =
      _$ArchivesFilterRequestModelImpl;
  const _ArchivesFilterRequestModel._() : super._();

  factory _ArchivesFilterRequestModel.fromJson(Map<String, dynamic> json) =
      _$ArchivesFilterRequestModelImpl.fromJson;

  @override
  int? get archiveNum;
  @override
  ArchivesFilterType get filterType;
  @override
  DateTime? get startDate;
  @override
  DateTime? get endDate;
  @override
  @PaginationRequestEntityConverter()
  PaginationRequestEntity? get pagination;
  @override
  @JsonKey(ignore: true)
  _$$ArchivesFilterRequestModelImplCopyWith<_$ArchivesFilterRequestModelImpl>
      get copyWith => throw _privateConstructorUsedError;
}
