// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'main_cubit.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$MainState {
  List<CafeTableModel>? get tables => throw _privateConstructorUsedError;
  List<HallModel>? get halls => throw _privateConstructorUsedError;
  bool get isLoading => throw _privateConstructorUsedError;
  String? get selectedHallId => throw _privateConstructorUsedError;
  Failure get failure => throw _privateConstructorUsedError;
  Status get status => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $MainStateCopyWith<MainState> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $MainStateCopyWith<$Res> {
  factory $MainStateCopyWith(MainState value, $Res Function(MainState) then) =
      _$MainStateCopyWithImpl<$Res, MainState>;
  @useResult
  $Res call(
      {List<CafeTableModel>? tables,
      List<HallModel>? halls,
      bool isLoading,
      String? selectedHallId,
      Failure failure,
      Status status});
}

/// @nodoc
class _$MainStateCopyWithImpl<$Res, $Val extends MainState>
    implements $MainStateCopyWith<$Res> {
  _$MainStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? tables = freezed,
    Object? halls = freezed,
    Object? isLoading = null,
    Object? selectedHallId = freezed,
    Object? failure = null,
    Object? status = null,
  }) {
    return _then(_value.copyWith(
      tables: freezed == tables
          ? _value.tables
          : tables // ignore: cast_nullable_to_non_nullable
              as List<CafeTableModel>?,
      halls: freezed == halls
          ? _value.halls
          : halls // ignore: cast_nullable_to_non_nullable
              as List<HallModel>?,
      isLoading: null == isLoading
          ? _value.isLoading
          : isLoading // ignore: cast_nullable_to_non_nullable
              as bool,
      selectedHallId: freezed == selectedHallId
          ? _value.selectedHallId
          : selectedHallId // ignore: cast_nullable_to_non_nullable
              as String?,
      failure: null == failure
          ? _value.failure
          : failure // ignore: cast_nullable_to_non_nullable
              as Failure,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as Status,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$MainStateImplCopyWith<$Res>
    implements $MainStateCopyWith<$Res> {
  factory _$$MainStateImplCopyWith(
          _$MainStateImpl value, $Res Function(_$MainStateImpl) then) =
      __$$MainStateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {List<CafeTableModel>? tables,
      List<HallModel>? halls,
      bool isLoading,
      String? selectedHallId,
      Failure failure,
      Status status});
}

/// @nodoc
class __$$MainStateImplCopyWithImpl<$Res>
    extends _$MainStateCopyWithImpl<$Res, _$MainStateImpl>
    implements _$$MainStateImplCopyWith<$Res> {
  __$$MainStateImplCopyWithImpl(
      _$MainStateImpl _value, $Res Function(_$MainStateImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? tables = freezed,
    Object? halls = freezed,
    Object? isLoading = null,
    Object? selectedHallId = freezed,
    Object? failure = null,
    Object? status = null,
  }) {
    return _then(_$MainStateImpl(
      tables: freezed == tables
          ? _value._tables
          : tables // ignore: cast_nullable_to_non_nullable
              as List<CafeTableModel>?,
      halls: freezed == halls
          ? _value._halls
          : halls // ignore: cast_nullable_to_non_nullable
              as List<HallModel>?,
      isLoading: null == isLoading
          ? _value.isLoading
          : isLoading // ignore: cast_nullable_to_non_nullable
              as bool,
      selectedHallId: freezed == selectedHallId
          ? _value.selectedHallId
          : selectedHallId // ignore: cast_nullable_to_non_nullable
              as String?,
      failure: null == failure
          ? _value.failure
          : failure // ignore: cast_nullable_to_non_nullable
              as Failure,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as Status,
    ));
  }
}

/// @nodoc

class _$MainStateImpl implements _MainState {
  const _$MainStateImpl(
      {final List<CafeTableModel>? tables,
      final List<HallModel>? halls,
      this.isLoading = false,
      this.selectedHallId,
      this.failure = const UnknownFailure(),
      this.status = Status.UNKNOWN})
      : _tables = tables,
        _halls = halls;

  final List<CafeTableModel>? _tables;
  @override
  List<CafeTableModel>? get tables {
    final value = _tables;
    if (value == null) return null;
    if (_tables is EqualUnmodifiableListView) return _tables;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  final List<HallModel>? _halls;
  @override
  List<HallModel>? get halls {
    final value = _halls;
    if (value == null) return null;
    if (_halls is EqualUnmodifiableListView) return _halls;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  @override
  @JsonKey()
  final bool isLoading;
  @override
  final String? selectedHallId;
  @override
  @JsonKey()
  final Failure failure;
  @override
  @JsonKey()
  final Status status;

  @override
  String toString() {
    return 'MainState(tables: $tables, halls: $halls, isLoading: $isLoading, selectedHallId: $selectedHallId, failure: $failure, status: $status)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$MainStateImpl &&
            const DeepCollectionEquality().equals(other._tables, _tables) &&
            const DeepCollectionEquality().equals(other._halls, _halls) &&
            (identical(other.isLoading, isLoading) ||
                other.isLoading == isLoading) &&
            (identical(other.selectedHallId, selectedHallId) ||
                other.selectedHallId == selectedHallId) &&
            (identical(other.failure, failure) || other.failure == failure) &&
            (identical(other.status, status) || other.status == status));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      const DeepCollectionEquality().hash(_tables),
      const DeepCollectionEquality().hash(_halls),
      isLoading,
      selectedHallId,
      failure,
      status);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$MainStateImplCopyWith<_$MainStateImpl> get copyWith =>
      __$$MainStateImplCopyWithImpl<_$MainStateImpl>(this, _$identity);
}

abstract class _MainState implements MainState {
  const factory _MainState(
      {final List<CafeTableModel>? tables,
      final List<HallModel>? halls,
      final bool isLoading,
      final String? selectedHallId,
      final Failure failure,
      final Status status}) = _$MainStateImpl;

  @override
  List<CafeTableModel>? get tables;
  @override
  List<HallModel>? get halls;
  @override
  bool get isLoading;
  @override
  String? get selectedHallId;
  @override
  Failure get failure;
  @override
  Status get status;
  @override
  @JsonKey(ignore: true)
  _$$MainStateImplCopyWith<_$MainStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
