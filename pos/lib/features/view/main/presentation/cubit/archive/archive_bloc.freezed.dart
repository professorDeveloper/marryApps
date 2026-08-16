// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'archive_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$ArchiveEvent {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function(String? id) getArchive,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function(String? id)? getArchive,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function(String? id)? getArchive,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetArchive value) getArchive,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetArchive value)? getArchive,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetArchive value)? getArchive,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ArchiveEventCopyWith<$Res> {
  factory $ArchiveEventCopyWith(
          ArchiveEvent value, $Res Function(ArchiveEvent) then) =
      _$ArchiveEventCopyWithImpl<$Res, ArchiveEvent>;
}

/// @nodoc
class _$ArchiveEventCopyWithImpl<$Res, $Val extends ArchiveEvent>
    implements $ArchiveEventCopyWith<$Res> {
  _$ArchiveEventCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;
}

/// @nodoc
abstract class _$$StartedImplCopyWith<$Res> {
  factory _$$StartedImplCopyWith(
          _$StartedImpl value, $Res Function(_$StartedImpl) then) =
      __$$StartedImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$StartedImplCopyWithImpl<$Res>
    extends _$ArchiveEventCopyWithImpl<$Res, _$StartedImpl>
    implements _$$StartedImplCopyWith<$Res> {
  __$$StartedImplCopyWithImpl(
      _$StartedImpl _value, $Res Function(_$StartedImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$StartedImpl implements _Started {
  const _$StartedImpl();

  @override
  String toString() {
    return 'ArchiveEvent.started()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$StartedImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function(String? id) getArchive,
  }) {
    return started();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function(String? id)? getArchive,
  }) {
    return started?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function(String? id)? getArchive,
    required TResult orElse(),
  }) {
    if (started != null) {
      return started();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetArchive value) getArchive,
  }) {
    return started(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetArchive value)? getArchive,
  }) {
    return started?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetArchive value)? getArchive,
    required TResult orElse(),
  }) {
    if (started != null) {
      return started(this);
    }
    return orElse();
  }
}

abstract class _Started implements ArchiveEvent {
  const factory _Started() = _$StartedImpl;
}

/// @nodoc
abstract class _$$GetArchiveImplCopyWith<$Res> {
  factory _$$GetArchiveImplCopyWith(
          _$GetArchiveImpl value, $Res Function(_$GetArchiveImpl) then) =
      __$$GetArchiveImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String? id});
}

/// @nodoc
class __$$GetArchiveImplCopyWithImpl<$Res>
    extends _$ArchiveEventCopyWithImpl<$Res, _$GetArchiveImpl>
    implements _$$GetArchiveImplCopyWith<$Res> {
  __$$GetArchiveImplCopyWithImpl(
      _$GetArchiveImpl _value, $Res Function(_$GetArchiveImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = freezed,
  }) {
    return _then(_$GetArchiveImpl(
      id: freezed == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc

class _$GetArchiveImpl implements _GetArchive {
  const _$GetArchiveImpl({this.id});

  @override
  final String? id;

  @override
  String toString() {
    return 'ArchiveEvent.getArchive(id: $id)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$GetArchiveImpl &&
            (identical(other.id, id) || other.id == id));
  }

  @override
  int get hashCode => Object.hash(runtimeType, id);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$GetArchiveImplCopyWith<_$GetArchiveImpl> get copyWith =>
      __$$GetArchiveImplCopyWithImpl<_$GetArchiveImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function(String? id) getArchive,
  }) {
    return getArchive(id);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function(String? id)? getArchive,
  }) {
    return getArchive?.call(id);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function(String? id)? getArchive,
    required TResult orElse(),
  }) {
    if (getArchive != null) {
      return getArchive(id);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetArchive value) getArchive,
  }) {
    return getArchive(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetArchive value)? getArchive,
  }) {
    return getArchive?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetArchive value)? getArchive,
    required TResult orElse(),
  }) {
    if (getArchive != null) {
      return getArchive(this);
    }
    return orElse();
  }
}

abstract class _GetArchive implements ArchiveEvent {
  const factory _GetArchive({final String? id}) = _$GetArchiveImpl;

  String? get id;
  @JsonKey(ignore: true)
  _$$GetArchiveImplCopyWith<_$GetArchiveImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
mixin _$ArchiveState {
  Status get status => throw _privateConstructorUsedError;
  ArchiveDetailEntity? get archiveDetail => throw _privateConstructorUsedError;
  Failure? get failure => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $ArchiveStateCopyWith<ArchiveState> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ArchiveStateCopyWith<$Res> {
  factory $ArchiveStateCopyWith(
          ArchiveState value, $Res Function(ArchiveState) then) =
      _$ArchiveStateCopyWithImpl<$Res, ArchiveState>;
  @useResult
  $Res call(
      {Status status, ArchiveDetailEntity? archiveDetail, Failure? failure});
}

/// @nodoc
class _$ArchiveStateCopyWithImpl<$Res, $Val extends ArchiveState>
    implements $ArchiveStateCopyWith<$Res> {
  _$ArchiveStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = null,
    Object? archiveDetail = freezed,
    Object? failure = freezed,
  }) {
    return _then(_value.copyWith(
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as Status,
      archiveDetail: freezed == archiveDetail
          ? _value.archiveDetail
          : archiveDetail // ignore: cast_nullable_to_non_nullable
              as ArchiveDetailEntity?,
      failure: freezed == failure
          ? _value.failure
          : failure // ignore: cast_nullable_to_non_nullable
              as Failure?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ArchiveStateImplCopyWith<$Res>
    implements $ArchiveStateCopyWith<$Res> {
  factory _$$ArchiveStateImplCopyWith(
          _$ArchiveStateImpl value, $Res Function(_$ArchiveStateImpl) then) =
      __$$ArchiveStateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {Status status, ArchiveDetailEntity? archiveDetail, Failure? failure});
}

/// @nodoc
class __$$ArchiveStateImplCopyWithImpl<$Res>
    extends _$ArchiveStateCopyWithImpl<$Res, _$ArchiveStateImpl>
    implements _$$ArchiveStateImplCopyWith<$Res> {
  __$$ArchiveStateImplCopyWithImpl(
      _$ArchiveStateImpl _value, $Res Function(_$ArchiveStateImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = null,
    Object? archiveDetail = freezed,
    Object? failure = freezed,
  }) {
    return _then(_$ArchiveStateImpl(
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as Status,
      archiveDetail: freezed == archiveDetail
          ? _value.archiveDetail
          : archiveDetail // ignore: cast_nullable_to_non_nullable
              as ArchiveDetailEntity?,
      failure: freezed == failure
          ? _value.failure
          : failure // ignore: cast_nullable_to_non_nullable
              as Failure?,
    ));
  }
}

/// @nodoc

class _$ArchiveStateImpl implements _ArchiveState {
  const _$ArchiveStateImpl(
      {this.status = Status.UNKNOWN, this.archiveDetail, this.failure});

  @override
  @JsonKey()
  final Status status;
  @override
  final ArchiveDetailEntity? archiveDetail;
  @override
  final Failure? failure;

  @override
  String toString() {
    return 'ArchiveState(status: $status, archiveDetail: $archiveDetail, failure: $failure)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ArchiveStateImpl &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.archiveDetail, archiveDetail) ||
                other.archiveDetail == archiveDetail) &&
            (identical(other.failure, failure) || other.failure == failure));
  }

  @override
  int get hashCode => Object.hash(runtimeType, status, archiveDetail, failure);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ArchiveStateImplCopyWith<_$ArchiveStateImpl> get copyWith =>
      __$$ArchiveStateImplCopyWithImpl<_$ArchiveStateImpl>(this, _$identity);
}

abstract class _ArchiveState implements ArchiveState {
  const factory _ArchiveState(
      {final Status status,
      final ArchiveDetailEntity? archiveDetail,
      final Failure? failure}) = _$ArchiveStateImpl;

  @override
  Status get status;
  @override
  ArchiveDetailEntity? get archiveDetail;
  @override
  Failure? get failure;
  @override
  @JsonKey(ignore: true)
  _$$ArchiveStateImplCopyWith<_$ArchiveStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
