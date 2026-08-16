// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'archives_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$ArchivesEvent {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getArchived,
    required TResult Function(Status status) statusChanged,
    required TResult Function(ArchivesResponseEntity archives) archivesUpdated,
    required TResult Function(Failure? failure) failureChanged,
    required TResult Function(String value) searchChanged,
    required TResult Function(String value) searchByArchiveNum,
    required TResult Function(String id) selectArchive,
    required TResult Function() getArchiveDetail,
    required TResult Function(ArchivesFilterType type) updateFilterType,
    required TResult Function(DateTime startDate, DateTime endDate)
        updateFilterDateRange,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getArchived,
    TResult? Function(Status status)? statusChanged,
    TResult? Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult? Function(Failure? failure)? failureChanged,
    TResult? Function(String value)? searchChanged,
    TResult? Function(String value)? searchByArchiveNum,
    TResult? Function(String id)? selectArchive,
    TResult? Function()? getArchiveDetail,
    TResult? Function(ArchivesFilterType type)? updateFilterType,
    TResult? Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getArchived,
    TResult Function(Status status)? statusChanged,
    TResult Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult Function(Failure? failure)? failureChanged,
    TResult Function(String value)? searchChanged,
    TResult Function(String value)? searchByArchiveNum,
    TResult Function(String id)? selectArchive,
    TResult Function()? getArchiveDetail,
    TResult Function(ArchivesFilterType type)? updateFilterType,
    TResult Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetArchived value) getArchived,
    required TResult Function(_StatusChanged value) statusChanged,
    required TResult Function(_ArchivesUpdated value) archivesUpdated,
    required TResult Function(_FailureChanged value) failureChanged,
    required TResult Function(_SearchChanged value) searchChanged,
    required TResult Function(_SearchByArchiveNum value) searchByArchiveNum,
    required TResult Function(_SelectArchive value) selectArchive,
    required TResult Function(_GetArchiveDetail value) getArchiveDetail,
    required TResult Function(_UpdateFilterType value) updateFilterType,
    required TResult Function(_UpdateFilterDateRange value)
        updateFilterDateRange,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetArchived value)? getArchived,
    TResult? Function(_StatusChanged value)? statusChanged,
    TResult? Function(_ArchivesUpdated value)? archivesUpdated,
    TResult? Function(_FailureChanged value)? failureChanged,
    TResult? Function(_SearchChanged value)? searchChanged,
    TResult? Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult? Function(_SelectArchive value)? selectArchive,
    TResult? Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult? Function(_UpdateFilterType value)? updateFilterType,
    TResult? Function(_UpdateFilterDateRange value)? updateFilterDateRange,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetArchived value)? getArchived,
    TResult Function(_StatusChanged value)? statusChanged,
    TResult Function(_ArchivesUpdated value)? archivesUpdated,
    TResult Function(_FailureChanged value)? failureChanged,
    TResult Function(_SearchChanged value)? searchChanged,
    TResult Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult Function(_SelectArchive value)? selectArchive,
    TResult Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult Function(_UpdateFilterType value)? updateFilterType,
    TResult Function(_UpdateFilterDateRange value)? updateFilterDateRange,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ArchivesEventCopyWith<$Res> {
  factory $ArchivesEventCopyWith(
          ArchivesEvent value, $Res Function(ArchivesEvent) then) =
      _$ArchivesEventCopyWithImpl<$Res, ArchivesEvent>;
}

/// @nodoc
class _$ArchivesEventCopyWithImpl<$Res, $Val extends ArchivesEvent>
    implements $ArchivesEventCopyWith<$Res> {
  _$ArchivesEventCopyWithImpl(this._value, this._then);

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
    extends _$ArchivesEventCopyWithImpl<$Res, _$StartedImpl>
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
    return 'ArchivesEvent.started()';
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
    required TResult Function() getArchived,
    required TResult Function(Status status) statusChanged,
    required TResult Function(ArchivesResponseEntity archives) archivesUpdated,
    required TResult Function(Failure? failure) failureChanged,
    required TResult Function(String value) searchChanged,
    required TResult Function(String value) searchByArchiveNum,
    required TResult Function(String id) selectArchive,
    required TResult Function() getArchiveDetail,
    required TResult Function(ArchivesFilterType type) updateFilterType,
    required TResult Function(DateTime startDate, DateTime endDate)
        updateFilterDateRange,
  }) {
    return started();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getArchived,
    TResult? Function(Status status)? statusChanged,
    TResult? Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult? Function(Failure? failure)? failureChanged,
    TResult? Function(String value)? searchChanged,
    TResult? Function(String value)? searchByArchiveNum,
    TResult? Function(String id)? selectArchive,
    TResult? Function()? getArchiveDetail,
    TResult? Function(ArchivesFilterType type)? updateFilterType,
    TResult? Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
  }) {
    return started?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getArchived,
    TResult Function(Status status)? statusChanged,
    TResult Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult Function(Failure? failure)? failureChanged,
    TResult Function(String value)? searchChanged,
    TResult Function(String value)? searchByArchiveNum,
    TResult Function(String id)? selectArchive,
    TResult Function()? getArchiveDetail,
    TResult Function(ArchivesFilterType type)? updateFilterType,
    TResult Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
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
    required TResult Function(_GetArchived value) getArchived,
    required TResult Function(_StatusChanged value) statusChanged,
    required TResult Function(_ArchivesUpdated value) archivesUpdated,
    required TResult Function(_FailureChanged value) failureChanged,
    required TResult Function(_SearchChanged value) searchChanged,
    required TResult Function(_SearchByArchiveNum value) searchByArchiveNum,
    required TResult Function(_SelectArchive value) selectArchive,
    required TResult Function(_GetArchiveDetail value) getArchiveDetail,
    required TResult Function(_UpdateFilterType value) updateFilterType,
    required TResult Function(_UpdateFilterDateRange value)
        updateFilterDateRange,
  }) {
    return started(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetArchived value)? getArchived,
    TResult? Function(_StatusChanged value)? statusChanged,
    TResult? Function(_ArchivesUpdated value)? archivesUpdated,
    TResult? Function(_FailureChanged value)? failureChanged,
    TResult? Function(_SearchChanged value)? searchChanged,
    TResult? Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult? Function(_SelectArchive value)? selectArchive,
    TResult? Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult? Function(_UpdateFilterType value)? updateFilterType,
    TResult? Function(_UpdateFilterDateRange value)? updateFilterDateRange,
  }) {
    return started?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetArchived value)? getArchived,
    TResult Function(_StatusChanged value)? statusChanged,
    TResult Function(_ArchivesUpdated value)? archivesUpdated,
    TResult Function(_FailureChanged value)? failureChanged,
    TResult Function(_SearchChanged value)? searchChanged,
    TResult Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult Function(_SelectArchive value)? selectArchive,
    TResult Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult Function(_UpdateFilterType value)? updateFilterType,
    TResult Function(_UpdateFilterDateRange value)? updateFilterDateRange,
    required TResult orElse(),
  }) {
    if (started != null) {
      return started(this);
    }
    return orElse();
  }
}

abstract class _Started implements ArchivesEvent {
  const factory _Started() = _$StartedImpl;
}

/// @nodoc
abstract class _$$GetArchivedImplCopyWith<$Res> {
  factory _$$GetArchivedImplCopyWith(
          _$GetArchivedImpl value, $Res Function(_$GetArchivedImpl) then) =
      __$$GetArchivedImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$GetArchivedImplCopyWithImpl<$Res>
    extends _$ArchivesEventCopyWithImpl<$Res, _$GetArchivedImpl>
    implements _$$GetArchivedImplCopyWith<$Res> {
  __$$GetArchivedImplCopyWithImpl(
      _$GetArchivedImpl _value, $Res Function(_$GetArchivedImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$GetArchivedImpl implements _GetArchived {
  const _$GetArchivedImpl();

  @override
  String toString() {
    return 'ArchivesEvent.getArchived()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$GetArchivedImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getArchived,
    required TResult Function(Status status) statusChanged,
    required TResult Function(ArchivesResponseEntity archives) archivesUpdated,
    required TResult Function(Failure? failure) failureChanged,
    required TResult Function(String value) searchChanged,
    required TResult Function(String value) searchByArchiveNum,
    required TResult Function(String id) selectArchive,
    required TResult Function() getArchiveDetail,
    required TResult Function(ArchivesFilterType type) updateFilterType,
    required TResult Function(DateTime startDate, DateTime endDate)
        updateFilterDateRange,
  }) {
    return getArchived();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getArchived,
    TResult? Function(Status status)? statusChanged,
    TResult? Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult? Function(Failure? failure)? failureChanged,
    TResult? Function(String value)? searchChanged,
    TResult? Function(String value)? searchByArchiveNum,
    TResult? Function(String id)? selectArchive,
    TResult? Function()? getArchiveDetail,
    TResult? Function(ArchivesFilterType type)? updateFilterType,
    TResult? Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
  }) {
    return getArchived?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getArchived,
    TResult Function(Status status)? statusChanged,
    TResult Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult Function(Failure? failure)? failureChanged,
    TResult Function(String value)? searchChanged,
    TResult Function(String value)? searchByArchiveNum,
    TResult Function(String id)? selectArchive,
    TResult Function()? getArchiveDetail,
    TResult Function(ArchivesFilterType type)? updateFilterType,
    TResult Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
    required TResult orElse(),
  }) {
    if (getArchived != null) {
      return getArchived();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetArchived value) getArchived,
    required TResult Function(_StatusChanged value) statusChanged,
    required TResult Function(_ArchivesUpdated value) archivesUpdated,
    required TResult Function(_FailureChanged value) failureChanged,
    required TResult Function(_SearchChanged value) searchChanged,
    required TResult Function(_SearchByArchiveNum value) searchByArchiveNum,
    required TResult Function(_SelectArchive value) selectArchive,
    required TResult Function(_GetArchiveDetail value) getArchiveDetail,
    required TResult Function(_UpdateFilterType value) updateFilterType,
    required TResult Function(_UpdateFilterDateRange value)
        updateFilterDateRange,
  }) {
    return getArchived(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetArchived value)? getArchived,
    TResult? Function(_StatusChanged value)? statusChanged,
    TResult? Function(_ArchivesUpdated value)? archivesUpdated,
    TResult? Function(_FailureChanged value)? failureChanged,
    TResult? Function(_SearchChanged value)? searchChanged,
    TResult? Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult? Function(_SelectArchive value)? selectArchive,
    TResult? Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult? Function(_UpdateFilterType value)? updateFilterType,
    TResult? Function(_UpdateFilterDateRange value)? updateFilterDateRange,
  }) {
    return getArchived?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetArchived value)? getArchived,
    TResult Function(_StatusChanged value)? statusChanged,
    TResult Function(_ArchivesUpdated value)? archivesUpdated,
    TResult Function(_FailureChanged value)? failureChanged,
    TResult Function(_SearchChanged value)? searchChanged,
    TResult Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult Function(_SelectArchive value)? selectArchive,
    TResult Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult Function(_UpdateFilterType value)? updateFilterType,
    TResult Function(_UpdateFilterDateRange value)? updateFilterDateRange,
    required TResult orElse(),
  }) {
    if (getArchived != null) {
      return getArchived(this);
    }
    return orElse();
  }
}

abstract class _GetArchived implements ArchivesEvent {
  const factory _GetArchived() = _$GetArchivedImpl;
}

/// @nodoc
abstract class _$$StatusChangedImplCopyWith<$Res> {
  factory _$$StatusChangedImplCopyWith(
          _$StatusChangedImpl value, $Res Function(_$StatusChangedImpl) then) =
      __$$StatusChangedImplCopyWithImpl<$Res>;
  @useResult
  $Res call({Status status});
}

/// @nodoc
class __$$StatusChangedImplCopyWithImpl<$Res>
    extends _$ArchivesEventCopyWithImpl<$Res, _$StatusChangedImpl>
    implements _$$StatusChangedImplCopyWith<$Res> {
  __$$StatusChangedImplCopyWithImpl(
      _$StatusChangedImpl _value, $Res Function(_$StatusChangedImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = null,
  }) {
    return _then(_$StatusChangedImpl(
      null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as Status,
    ));
  }
}

/// @nodoc

class _$StatusChangedImpl implements _StatusChanged {
  const _$StatusChangedImpl(this.status);

  @override
  final Status status;

  @override
  String toString() {
    return 'ArchivesEvent.statusChanged(status: $status)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$StatusChangedImpl &&
            (identical(other.status, status) || other.status == status));
  }

  @override
  int get hashCode => Object.hash(runtimeType, status);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$StatusChangedImplCopyWith<_$StatusChangedImpl> get copyWith =>
      __$$StatusChangedImplCopyWithImpl<_$StatusChangedImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getArchived,
    required TResult Function(Status status) statusChanged,
    required TResult Function(ArchivesResponseEntity archives) archivesUpdated,
    required TResult Function(Failure? failure) failureChanged,
    required TResult Function(String value) searchChanged,
    required TResult Function(String value) searchByArchiveNum,
    required TResult Function(String id) selectArchive,
    required TResult Function() getArchiveDetail,
    required TResult Function(ArchivesFilterType type) updateFilterType,
    required TResult Function(DateTime startDate, DateTime endDate)
        updateFilterDateRange,
  }) {
    return statusChanged(status);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getArchived,
    TResult? Function(Status status)? statusChanged,
    TResult? Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult? Function(Failure? failure)? failureChanged,
    TResult? Function(String value)? searchChanged,
    TResult? Function(String value)? searchByArchiveNum,
    TResult? Function(String id)? selectArchive,
    TResult? Function()? getArchiveDetail,
    TResult? Function(ArchivesFilterType type)? updateFilterType,
    TResult? Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
  }) {
    return statusChanged?.call(status);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getArchived,
    TResult Function(Status status)? statusChanged,
    TResult Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult Function(Failure? failure)? failureChanged,
    TResult Function(String value)? searchChanged,
    TResult Function(String value)? searchByArchiveNum,
    TResult Function(String id)? selectArchive,
    TResult Function()? getArchiveDetail,
    TResult Function(ArchivesFilterType type)? updateFilterType,
    TResult Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
    required TResult orElse(),
  }) {
    if (statusChanged != null) {
      return statusChanged(status);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetArchived value) getArchived,
    required TResult Function(_StatusChanged value) statusChanged,
    required TResult Function(_ArchivesUpdated value) archivesUpdated,
    required TResult Function(_FailureChanged value) failureChanged,
    required TResult Function(_SearchChanged value) searchChanged,
    required TResult Function(_SearchByArchiveNum value) searchByArchiveNum,
    required TResult Function(_SelectArchive value) selectArchive,
    required TResult Function(_GetArchiveDetail value) getArchiveDetail,
    required TResult Function(_UpdateFilterType value) updateFilterType,
    required TResult Function(_UpdateFilterDateRange value)
        updateFilterDateRange,
  }) {
    return statusChanged(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetArchived value)? getArchived,
    TResult? Function(_StatusChanged value)? statusChanged,
    TResult? Function(_ArchivesUpdated value)? archivesUpdated,
    TResult? Function(_FailureChanged value)? failureChanged,
    TResult? Function(_SearchChanged value)? searchChanged,
    TResult? Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult? Function(_SelectArchive value)? selectArchive,
    TResult? Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult? Function(_UpdateFilterType value)? updateFilterType,
    TResult? Function(_UpdateFilterDateRange value)? updateFilterDateRange,
  }) {
    return statusChanged?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetArchived value)? getArchived,
    TResult Function(_StatusChanged value)? statusChanged,
    TResult Function(_ArchivesUpdated value)? archivesUpdated,
    TResult Function(_FailureChanged value)? failureChanged,
    TResult Function(_SearchChanged value)? searchChanged,
    TResult Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult Function(_SelectArchive value)? selectArchive,
    TResult Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult Function(_UpdateFilterType value)? updateFilterType,
    TResult Function(_UpdateFilterDateRange value)? updateFilterDateRange,
    required TResult orElse(),
  }) {
    if (statusChanged != null) {
      return statusChanged(this);
    }
    return orElse();
  }
}

abstract class _StatusChanged implements ArchivesEvent {
  const factory _StatusChanged(final Status status) = _$StatusChangedImpl;

  Status get status;
  @JsonKey(ignore: true)
  _$$StatusChangedImplCopyWith<_$StatusChangedImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$ArchivesUpdatedImplCopyWith<$Res> {
  factory _$$ArchivesUpdatedImplCopyWith(_$ArchivesUpdatedImpl value,
          $Res Function(_$ArchivesUpdatedImpl) then) =
      __$$ArchivesUpdatedImplCopyWithImpl<$Res>;
  @useResult
  $Res call({ArchivesResponseEntity archives});
}

/// @nodoc
class __$$ArchivesUpdatedImplCopyWithImpl<$Res>
    extends _$ArchivesEventCopyWithImpl<$Res, _$ArchivesUpdatedImpl>
    implements _$$ArchivesUpdatedImplCopyWith<$Res> {
  __$$ArchivesUpdatedImplCopyWithImpl(
      _$ArchivesUpdatedImpl _value, $Res Function(_$ArchivesUpdatedImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? archives = null,
  }) {
    return _then(_$ArchivesUpdatedImpl(
      null == archives
          ? _value.archives
          : archives // ignore: cast_nullable_to_non_nullable
              as ArchivesResponseEntity,
    ));
  }
}

/// @nodoc

class _$ArchivesUpdatedImpl implements _ArchivesUpdated {
  const _$ArchivesUpdatedImpl(this.archives);

  @override
  final ArchivesResponseEntity archives;

  @override
  String toString() {
    return 'ArchivesEvent.archivesUpdated(archives: $archives)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ArchivesUpdatedImpl &&
            (identical(other.archives, archives) ||
                other.archives == archives));
  }

  @override
  int get hashCode => Object.hash(runtimeType, archives);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ArchivesUpdatedImplCopyWith<_$ArchivesUpdatedImpl> get copyWith =>
      __$$ArchivesUpdatedImplCopyWithImpl<_$ArchivesUpdatedImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getArchived,
    required TResult Function(Status status) statusChanged,
    required TResult Function(ArchivesResponseEntity archives) archivesUpdated,
    required TResult Function(Failure? failure) failureChanged,
    required TResult Function(String value) searchChanged,
    required TResult Function(String value) searchByArchiveNum,
    required TResult Function(String id) selectArchive,
    required TResult Function() getArchiveDetail,
    required TResult Function(ArchivesFilterType type) updateFilterType,
    required TResult Function(DateTime startDate, DateTime endDate)
        updateFilterDateRange,
  }) {
    return archivesUpdated(archives);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getArchived,
    TResult? Function(Status status)? statusChanged,
    TResult? Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult? Function(Failure? failure)? failureChanged,
    TResult? Function(String value)? searchChanged,
    TResult? Function(String value)? searchByArchiveNum,
    TResult? Function(String id)? selectArchive,
    TResult? Function()? getArchiveDetail,
    TResult? Function(ArchivesFilterType type)? updateFilterType,
    TResult? Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
  }) {
    return archivesUpdated?.call(archives);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getArchived,
    TResult Function(Status status)? statusChanged,
    TResult Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult Function(Failure? failure)? failureChanged,
    TResult Function(String value)? searchChanged,
    TResult Function(String value)? searchByArchiveNum,
    TResult Function(String id)? selectArchive,
    TResult Function()? getArchiveDetail,
    TResult Function(ArchivesFilterType type)? updateFilterType,
    TResult Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
    required TResult orElse(),
  }) {
    if (archivesUpdated != null) {
      return archivesUpdated(archives);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetArchived value) getArchived,
    required TResult Function(_StatusChanged value) statusChanged,
    required TResult Function(_ArchivesUpdated value) archivesUpdated,
    required TResult Function(_FailureChanged value) failureChanged,
    required TResult Function(_SearchChanged value) searchChanged,
    required TResult Function(_SearchByArchiveNum value) searchByArchiveNum,
    required TResult Function(_SelectArchive value) selectArchive,
    required TResult Function(_GetArchiveDetail value) getArchiveDetail,
    required TResult Function(_UpdateFilterType value) updateFilterType,
    required TResult Function(_UpdateFilterDateRange value)
        updateFilterDateRange,
  }) {
    return archivesUpdated(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetArchived value)? getArchived,
    TResult? Function(_StatusChanged value)? statusChanged,
    TResult? Function(_ArchivesUpdated value)? archivesUpdated,
    TResult? Function(_FailureChanged value)? failureChanged,
    TResult? Function(_SearchChanged value)? searchChanged,
    TResult? Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult? Function(_SelectArchive value)? selectArchive,
    TResult? Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult? Function(_UpdateFilterType value)? updateFilterType,
    TResult? Function(_UpdateFilterDateRange value)? updateFilterDateRange,
  }) {
    return archivesUpdated?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetArchived value)? getArchived,
    TResult Function(_StatusChanged value)? statusChanged,
    TResult Function(_ArchivesUpdated value)? archivesUpdated,
    TResult Function(_FailureChanged value)? failureChanged,
    TResult Function(_SearchChanged value)? searchChanged,
    TResult Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult Function(_SelectArchive value)? selectArchive,
    TResult Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult Function(_UpdateFilterType value)? updateFilterType,
    TResult Function(_UpdateFilterDateRange value)? updateFilterDateRange,
    required TResult orElse(),
  }) {
    if (archivesUpdated != null) {
      return archivesUpdated(this);
    }
    return orElse();
  }
}

abstract class _ArchivesUpdated implements ArchivesEvent {
  const factory _ArchivesUpdated(final ArchivesResponseEntity archives) =
      _$ArchivesUpdatedImpl;

  ArchivesResponseEntity get archives;
  @JsonKey(ignore: true)
  _$$ArchivesUpdatedImplCopyWith<_$ArchivesUpdatedImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$FailureChangedImplCopyWith<$Res> {
  factory _$$FailureChangedImplCopyWith(_$FailureChangedImpl value,
          $Res Function(_$FailureChangedImpl) then) =
      __$$FailureChangedImplCopyWithImpl<$Res>;
  @useResult
  $Res call({Failure? failure});
}

/// @nodoc
class __$$FailureChangedImplCopyWithImpl<$Res>
    extends _$ArchivesEventCopyWithImpl<$Res, _$FailureChangedImpl>
    implements _$$FailureChangedImplCopyWith<$Res> {
  __$$FailureChangedImplCopyWithImpl(
      _$FailureChangedImpl _value, $Res Function(_$FailureChangedImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? failure = freezed,
  }) {
    return _then(_$FailureChangedImpl(
      freezed == failure
          ? _value.failure
          : failure // ignore: cast_nullable_to_non_nullable
              as Failure?,
    ));
  }
}

/// @nodoc

class _$FailureChangedImpl implements _FailureChanged {
  const _$FailureChangedImpl(this.failure);

  @override
  final Failure? failure;

  @override
  String toString() {
    return 'ArchivesEvent.failureChanged(failure: $failure)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$FailureChangedImpl &&
            (identical(other.failure, failure) || other.failure == failure));
  }

  @override
  int get hashCode => Object.hash(runtimeType, failure);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$FailureChangedImplCopyWith<_$FailureChangedImpl> get copyWith =>
      __$$FailureChangedImplCopyWithImpl<_$FailureChangedImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getArchived,
    required TResult Function(Status status) statusChanged,
    required TResult Function(ArchivesResponseEntity archives) archivesUpdated,
    required TResult Function(Failure? failure) failureChanged,
    required TResult Function(String value) searchChanged,
    required TResult Function(String value) searchByArchiveNum,
    required TResult Function(String id) selectArchive,
    required TResult Function() getArchiveDetail,
    required TResult Function(ArchivesFilterType type) updateFilterType,
    required TResult Function(DateTime startDate, DateTime endDate)
        updateFilterDateRange,
  }) {
    return failureChanged(failure);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getArchived,
    TResult? Function(Status status)? statusChanged,
    TResult? Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult? Function(Failure? failure)? failureChanged,
    TResult? Function(String value)? searchChanged,
    TResult? Function(String value)? searchByArchiveNum,
    TResult? Function(String id)? selectArchive,
    TResult? Function()? getArchiveDetail,
    TResult? Function(ArchivesFilterType type)? updateFilterType,
    TResult? Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
  }) {
    return failureChanged?.call(failure);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getArchived,
    TResult Function(Status status)? statusChanged,
    TResult Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult Function(Failure? failure)? failureChanged,
    TResult Function(String value)? searchChanged,
    TResult Function(String value)? searchByArchiveNum,
    TResult Function(String id)? selectArchive,
    TResult Function()? getArchiveDetail,
    TResult Function(ArchivesFilterType type)? updateFilterType,
    TResult Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
    required TResult orElse(),
  }) {
    if (failureChanged != null) {
      return failureChanged(failure);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetArchived value) getArchived,
    required TResult Function(_StatusChanged value) statusChanged,
    required TResult Function(_ArchivesUpdated value) archivesUpdated,
    required TResult Function(_FailureChanged value) failureChanged,
    required TResult Function(_SearchChanged value) searchChanged,
    required TResult Function(_SearchByArchiveNum value) searchByArchiveNum,
    required TResult Function(_SelectArchive value) selectArchive,
    required TResult Function(_GetArchiveDetail value) getArchiveDetail,
    required TResult Function(_UpdateFilterType value) updateFilterType,
    required TResult Function(_UpdateFilterDateRange value)
        updateFilterDateRange,
  }) {
    return failureChanged(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetArchived value)? getArchived,
    TResult? Function(_StatusChanged value)? statusChanged,
    TResult? Function(_ArchivesUpdated value)? archivesUpdated,
    TResult? Function(_FailureChanged value)? failureChanged,
    TResult? Function(_SearchChanged value)? searchChanged,
    TResult? Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult? Function(_SelectArchive value)? selectArchive,
    TResult? Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult? Function(_UpdateFilterType value)? updateFilterType,
    TResult? Function(_UpdateFilterDateRange value)? updateFilterDateRange,
  }) {
    return failureChanged?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetArchived value)? getArchived,
    TResult Function(_StatusChanged value)? statusChanged,
    TResult Function(_ArchivesUpdated value)? archivesUpdated,
    TResult Function(_FailureChanged value)? failureChanged,
    TResult Function(_SearchChanged value)? searchChanged,
    TResult Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult Function(_SelectArchive value)? selectArchive,
    TResult Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult Function(_UpdateFilterType value)? updateFilterType,
    TResult Function(_UpdateFilterDateRange value)? updateFilterDateRange,
    required TResult orElse(),
  }) {
    if (failureChanged != null) {
      return failureChanged(this);
    }
    return orElse();
  }
}

abstract class _FailureChanged implements ArchivesEvent {
  const factory _FailureChanged(final Failure? failure) = _$FailureChangedImpl;

  Failure? get failure;
  @JsonKey(ignore: true)
  _$$FailureChangedImplCopyWith<_$FailureChangedImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$SearchChangedImplCopyWith<$Res> {
  factory _$$SearchChangedImplCopyWith(
          _$SearchChangedImpl value, $Res Function(_$SearchChangedImpl) then) =
      __$$SearchChangedImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String value});
}

/// @nodoc
class __$$SearchChangedImplCopyWithImpl<$Res>
    extends _$ArchivesEventCopyWithImpl<$Res, _$SearchChangedImpl>
    implements _$$SearchChangedImplCopyWith<$Res> {
  __$$SearchChangedImplCopyWithImpl(
      _$SearchChangedImpl _value, $Res Function(_$SearchChangedImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? value = null,
  }) {
    return _then(_$SearchChangedImpl(
      null == value
          ? _value.value
          : value // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$SearchChangedImpl implements _SearchChanged {
  const _$SearchChangedImpl(this.value);

  @override
  final String value;

  @override
  String toString() {
    return 'ArchivesEvent.searchChanged(value: $value)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SearchChangedImpl &&
            (identical(other.value, value) || other.value == value));
  }

  @override
  int get hashCode => Object.hash(runtimeType, value);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$SearchChangedImplCopyWith<_$SearchChangedImpl> get copyWith =>
      __$$SearchChangedImplCopyWithImpl<_$SearchChangedImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getArchived,
    required TResult Function(Status status) statusChanged,
    required TResult Function(ArchivesResponseEntity archives) archivesUpdated,
    required TResult Function(Failure? failure) failureChanged,
    required TResult Function(String value) searchChanged,
    required TResult Function(String value) searchByArchiveNum,
    required TResult Function(String id) selectArchive,
    required TResult Function() getArchiveDetail,
    required TResult Function(ArchivesFilterType type) updateFilterType,
    required TResult Function(DateTime startDate, DateTime endDate)
        updateFilterDateRange,
  }) {
    return searchChanged(value);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getArchived,
    TResult? Function(Status status)? statusChanged,
    TResult? Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult? Function(Failure? failure)? failureChanged,
    TResult? Function(String value)? searchChanged,
    TResult? Function(String value)? searchByArchiveNum,
    TResult? Function(String id)? selectArchive,
    TResult? Function()? getArchiveDetail,
    TResult? Function(ArchivesFilterType type)? updateFilterType,
    TResult? Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
  }) {
    return searchChanged?.call(value);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getArchived,
    TResult Function(Status status)? statusChanged,
    TResult Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult Function(Failure? failure)? failureChanged,
    TResult Function(String value)? searchChanged,
    TResult Function(String value)? searchByArchiveNum,
    TResult Function(String id)? selectArchive,
    TResult Function()? getArchiveDetail,
    TResult Function(ArchivesFilterType type)? updateFilterType,
    TResult Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
    required TResult orElse(),
  }) {
    if (searchChanged != null) {
      return searchChanged(value);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetArchived value) getArchived,
    required TResult Function(_StatusChanged value) statusChanged,
    required TResult Function(_ArchivesUpdated value) archivesUpdated,
    required TResult Function(_FailureChanged value) failureChanged,
    required TResult Function(_SearchChanged value) searchChanged,
    required TResult Function(_SearchByArchiveNum value) searchByArchiveNum,
    required TResult Function(_SelectArchive value) selectArchive,
    required TResult Function(_GetArchiveDetail value) getArchiveDetail,
    required TResult Function(_UpdateFilterType value) updateFilterType,
    required TResult Function(_UpdateFilterDateRange value)
        updateFilterDateRange,
  }) {
    return searchChanged(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetArchived value)? getArchived,
    TResult? Function(_StatusChanged value)? statusChanged,
    TResult? Function(_ArchivesUpdated value)? archivesUpdated,
    TResult? Function(_FailureChanged value)? failureChanged,
    TResult? Function(_SearchChanged value)? searchChanged,
    TResult? Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult? Function(_SelectArchive value)? selectArchive,
    TResult? Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult? Function(_UpdateFilterType value)? updateFilterType,
    TResult? Function(_UpdateFilterDateRange value)? updateFilterDateRange,
  }) {
    return searchChanged?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetArchived value)? getArchived,
    TResult Function(_StatusChanged value)? statusChanged,
    TResult Function(_ArchivesUpdated value)? archivesUpdated,
    TResult Function(_FailureChanged value)? failureChanged,
    TResult Function(_SearchChanged value)? searchChanged,
    TResult Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult Function(_SelectArchive value)? selectArchive,
    TResult Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult Function(_UpdateFilterType value)? updateFilterType,
    TResult Function(_UpdateFilterDateRange value)? updateFilterDateRange,
    required TResult orElse(),
  }) {
    if (searchChanged != null) {
      return searchChanged(this);
    }
    return orElse();
  }
}

abstract class _SearchChanged implements ArchivesEvent {
  const factory _SearchChanged(final String value) = _$SearchChangedImpl;

  String get value;
  @JsonKey(ignore: true)
  _$$SearchChangedImplCopyWith<_$SearchChangedImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$SearchByArchiveNumImplCopyWith<$Res> {
  factory _$$SearchByArchiveNumImplCopyWith(_$SearchByArchiveNumImpl value,
          $Res Function(_$SearchByArchiveNumImpl) then) =
      __$$SearchByArchiveNumImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String value});
}

/// @nodoc
class __$$SearchByArchiveNumImplCopyWithImpl<$Res>
    extends _$ArchivesEventCopyWithImpl<$Res, _$SearchByArchiveNumImpl>
    implements _$$SearchByArchiveNumImplCopyWith<$Res> {
  __$$SearchByArchiveNumImplCopyWithImpl(_$SearchByArchiveNumImpl _value,
      $Res Function(_$SearchByArchiveNumImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? value = null,
  }) {
    return _then(_$SearchByArchiveNumImpl(
      null == value
          ? _value.value
          : value // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$SearchByArchiveNumImpl implements _SearchByArchiveNum {
  const _$SearchByArchiveNumImpl(this.value);

  @override
  final String value;

  @override
  String toString() {
    return 'ArchivesEvent.searchByArchiveNum(value: $value)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SearchByArchiveNumImpl &&
            (identical(other.value, value) || other.value == value));
  }

  @override
  int get hashCode => Object.hash(runtimeType, value);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$SearchByArchiveNumImplCopyWith<_$SearchByArchiveNumImpl> get copyWith =>
      __$$SearchByArchiveNumImplCopyWithImpl<_$SearchByArchiveNumImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getArchived,
    required TResult Function(Status status) statusChanged,
    required TResult Function(ArchivesResponseEntity archives) archivesUpdated,
    required TResult Function(Failure? failure) failureChanged,
    required TResult Function(String value) searchChanged,
    required TResult Function(String value) searchByArchiveNum,
    required TResult Function(String id) selectArchive,
    required TResult Function() getArchiveDetail,
    required TResult Function(ArchivesFilterType type) updateFilterType,
    required TResult Function(DateTime startDate, DateTime endDate)
        updateFilterDateRange,
  }) {
    return searchByArchiveNum(value);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getArchived,
    TResult? Function(Status status)? statusChanged,
    TResult? Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult? Function(Failure? failure)? failureChanged,
    TResult? Function(String value)? searchChanged,
    TResult? Function(String value)? searchByArchiveNum,
    TResult? Function(String id)? selectArchive,
    TResult? Function()? getArchiveDetail,
    TResult? Function(ArchivesFilterType type)? updateFilterType,
    TResult? Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
  }) {
    return searchByArchiveNum?.call(value);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getArchived,
    TResult Function(Status status)? statusChanged,
    TResult Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult Function(Failure? failure)? failureChanged,
    TResult Function(String value)? searchChanged,
    TResult Function(String value)? searchByArchiveNum,
    TResult Function(String id)? selectArchive,
    TResult Function()? getArchiveDetail,
    TResult Function(ArchivesFilterType type)? updateFilterType,
    TResult Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
    required TResult orElse(),
  }) {
    if (searchByArchiveNum != null) {
      return searchByArchiveNum(value);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetArchived value) getArchived,
    required TResult Function(_StatusChanged value) statusChanged,
    required TResult Function(_ArchivesUpdated value) archivesUpdated,
    required TResult Function(_FailureChanged value) failureChanged,
    required TResult Function(_SearchChanged value) searchChanged,
    required TResult Function(_SearchByArchiveNum value) searchByArchiveNum,
    required TResult Function(_SelectArchive value) selectArchive,
    required TResult Function(_GetArchiveDetail value) getArchiveDetail,
    required TResult Function(_UpdateFilterType value) updateFilterType,
    required TResult Function(_UpdateFilterDateRange value)
        updateFilterDateRange,
  }) {
    return searchByArchiveNum(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetArchived value)? getArchived,
    TResult? Function(_StatusChanged value)? statusChanged,
    TResult? Function(_ArchivesUpdated value)? archivesUpdated,
    TResult? Function(_FailureChanged value)? failureChanged,
    TResult? Function(_SearchChanged value)? searchChanged,
    TResult? Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult? Function(_SelectArchive value)? selectArchive,
    TResult? Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult? Function(_UpdateFilterType value)? updateFilterType,
    TResult? Function(_UpdateFilterDateRange value)? updateFilterDateRange,
  }) {
    return searchByArchiveNum?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetArchived value)? getArchived,
    TResult Function(_StatusChanged value)? statusChanged,
    TResult Function(_ArchivesUpdated value)? archivesUpdated,
    TResult Function(_FailureChanged value)? failureChanged,
    TResult Function(_SearchChanged value)? searchChanged,
    TResult Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult Function(_SelectArchive value)? selectArchive,
    TResult Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult Function(_UpdateFilterType value)? updateFilterType,
    TResult Function(_UpdateFilterDateRange value)? updateFilterDateRange,
    required TResult orElse(),
  }) {
    if (searchByArchiveNum != null) {
      return searchByArchiveNum(this);
    }
    return orElse();
  }
}

abstract class _SearchByArchiveNum implements ArchivesEvent {
  const factory _SearchByArchiveNum(final String value) =
      _$SearchByArchiveNumImpl;

  String get value;
  @JsonKey(ignore: true)
  _$$SearchByArchiveNumImplCopyWith<_$SearchByArchiveNumImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$SelectArchiveImplCopyWith<$Res> {
  factory _$$SelectArchiveImplCopyWith(
          _$SelectArchiveImpl value, $Res Function(_$SelectArchiveImpl) then) =
      __$$SelectArchiveImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String id});
}

/// @nodoc
class __$$SelectArchiveImplCopyWithImpl<$Res>
    extends _$ArchivesEventCopyWithImpl<$Res, _$SelectArchiveImpl>
    implements _$$SelectArchiveImplCopyWith<$Res> {
  __$$SelectArchiveImplCopyWithImpl(
      _$SelectArchiveImpl _value, $Res Function(_$SelectArchiveImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
  }) {
    return _then(_$SelectArchiveImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$SelectArchiveImpl implements _SelectArchive {
  const _$SelectArchiveImpl({required this.id});

  @override
  final String id;

  @override
  String toString() {
    return 'ArchivesEvent.selectArchive(id: $id)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SelectArchiveImpl &&
            (identical(other.id, id) || other.id == id));
  }

  @override
  int get hashCode => Object.hash(runtimeType, id);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$SelectArchiveImplCopyWith<_$SelectArchiveImpl> get copyWith =>
      __$$SelectArchiveImplCopyWithImpl<_$SelectArchiveImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getArchived,
    required TResult Function(Status status) statusChanged,
    required TResult Function(ArchivesResponseEntity archives) archivesUpdated,
    required TResult Function(Failure? failure) failureChanged,
    required TResult Function(String value) searchChanged,
    required TResult Function(String value) searchByArchiveNum,
    required TResult Function(String id) selectArchive,
    required TResult Function() getArchiveDetail,
    required TResult Function(ArchivesFilterType type) updateFilterType,
    required TResult Function(DateTime startDate, DateTime endDate)
        updateFilterDateRange,
  }) {
    return selectArchive(id);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getArchived,
    TResult? Function(Status status)? statusChanged,
    TResult? Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult? Function(Failure? failure)? failureChanged,
    TResult? Function(String value)? searchChanged,
    TResult? Function(String value)? searchByArchiveNum,
    TResult? Function(String id)? selectArchive,
    TResult? Function()? getArchiveDetail,
    TResult? Function(ArchivesFilterType type)? updateFilterType,
    TResult? Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
  }) {
    return selectArchive?.call(id);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getArchived,
    TResult Function(Status status)? statusChanged,
    TResult Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult Function(Failure? failure)? failureChanged,
    TResult Function(String value)? searchChanged,
    TResult Function(String value)? searchByArchiveNum,
    TResult Function(String id)? selectArchive,
    TResult Function()? getArchiveDetail,
    TResult Function(ArchivesFilterType type)? updateFilterType,
    TResult Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
    required TResult orElse(),
  }) {
    if (selectArchive != null) {
      return selectArchive(id);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetArchived value) getArchived,
    required TResult Function(_StatusChanged value) statusChanged,
    required TResult Function(_ArchivesUpdated value) archivesUpdated,
    required TResult Function(_FailureChanged value) failureChanged,
    required TResult Function(_SearchChanged value) searchChanged,
    required TResult Function(_SearchByArchiveNum value) searchByArchiveNum,
    required TResult Function(_SelectArchive value) selectArchive,
    required TResult Function(_GetArchiveDetail value) getArchiveDetail,
    required TResult Function(_UpdateFilterType value) updateFilterType,
    required TResult Function(_UpdateFilterDateRange value)
        updateFilterDateRange,
  }) {
    return selectArchive(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetArchived value)? getArchived,
    TResult? Function(_StatusChanged value)? statusChanged,
    TResult? Function(_ArchivesUpdated value)? archivesUpdated,
    TResult? Function(_FailureChanged value)? failureChanged,
    TResult? Function(_SearchChanged value)? searchChanged,
    TResult? Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult? Function(_SelectArchive value)? selectArchive,
    TResult? Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult? Function(_UpdateFilterType value)? updateFilterType,
    TResult? Function(_UpdateFilterDateRange value)? updateFilterDateRange,
  }) {
    return selectArchive?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetArchived value)? getArchived,
    TResult Function(_StatusChanged value)? statusChanged,
    TResult Function(_ArchivesUpdated value)? archivesUpdated,
    TResult Function(_FailureChanged value)? failureChanged,
    TResult Function(_SearchChanged value)? searchChanged,
    TResult Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult Function(_SelectArchive value)? selectArchive,
    TResult Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult Function(_UpdateFilterType value)? updateFilterType,
    TResult Function(_UpdateFilterDateRange value)? updateFilterDateRange,
    required TResult orElse(),
  }) {
    if (selectArchive != null) {
      return selectArchive(this);
    }
    return orElse();
  }
}

abstract class _SelectArchive implements ArchivesEvent {
  const factory _SelectArchive({required final String id}) =
      _$SelectArchiveImpl;

  String get id;
  @JsonKey(ignore: true)
  _$$SelectArchiveImplCopyWith<_$SelectArchiveImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$GetArchiveDetailImplCopyWith<$Res> {
  factory _$$GetArchiveDetailImplCopyWith(_$GetArchiveDetailImpl value,
          $Res Function(_$GetArchiveDetailImpl) then) =
      __$$GetArchiveDetailImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$GetArchiveDetailImplCopyWithImpl<$Res>
    extends _$ArchivesEventCopyWithImpl<$Res, _$GetArchiveDetailImpl>
    implements _$$GetArchiveDetailImplCopyWith<$Res> {
  __$$GetArchiveDetailImplCopyWithImpl(_$GetArchiveDetailImpl _value,
      $Res Function(_$GetArchiveDetailImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$GetArchiveDetailImpl implements _GetArchiveDetail {
  const _$GetArchiveDetailImpl();

  @override
  String toString() {
    return 'ArchivesEvent.getArchiveDetail()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$GetArchiveDetailImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getArchived,
    required TResult Function(Status status) statusChanged,
    required TResult Function(ArchivesResponseEntity archives) archivesUpdated,
    required TResult Function(Failure? failure) failureChanged,
    required TResult Function(String value) searchChanged,
    required TResult Function(String value) searchByArchiveNum,
    required TResult Function(String id) selectArchive,
    required TResult Function() getArchiveDetail,
    required TResult Function(ArchivesFilterType type) updateFilterType,
    required TResult Function(DateTime startDate, DateTime endDate)
        updateFilterDateRange,
  }) {
    return getArchiveDetail();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getArchived,
    TResult? Function(Status status)? statusChanged,
    TResult? Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult? Function(Failure? failure)? failureChanged,
    TResult? Function(String value)? searchChanged,
    TResult? Function(String value)? searchByArchiveNum,
    TResult? Function(String id)? selectArchive,
    TResult? Function()? getArchiveDetail,
    TResult? Function(ArchivesFilterType type)? updateFilterType,
    TResult? Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
  }) {
    return getArchiveDetail?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getArchived,
    TResult Function(Status status)? statusChanged,
    TResult Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult Function(Failure? failure)? failureChanged,
    TResult Function(String value)? searchChanged,
    TResult Function(String value)? searchByArchiveNum,
    TResult Function(String id)? selectArchive,
    TResult Function()? getArchiveDetail,
    TResult Function(ArchivesFilterType type)? updateFilterType,
    TResult Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
    required TResult orElse(),
  }) {
    if (getArchiveDetail != null) {
      return getArchiveDetail();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetArchived value) getArchived,
    required TResult Function(_StatusChanged value) statusChanged,
    required TResult Function(_ArchivesUpdated value) archivesUpdated,
    required TResult Function(_FailureChanged value) failureChanged,
    required TResult Function(_SearchChanged value) searchChanged,
    required TResult Function(_SearchByArchiveNum value) searchByArchiveNum,
    required TResult Function(_SelectArchive value) selectArchive,
    required TResult Function(_GetArchiveDetail value) getArchiveDetail,
    required TResult Function(_UpdateFilterType value) updateFilterType,
    required TResult Function(_UpdateFilterDateRange value)
        updateFilterDateRange,
  }) {
    return getArchiveDetail(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetArchived value)? getArchived,
    TResult? Function(_StatusChanged value)? statusChanged,
    TResult? Function(_ArchivesUpdated value)? archivesUpdated,
    TResult? Function(_FailureChanged value)? failureChanged,
    TResult? Function(_SearchChanged value)? searchChanged,
    TResult? Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult? Function(_SelectArchive value)? selectArchive,
    TResult? Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult? Function(_UpdateFilterType value)? updateFilterType,
    TResult? Function(_UpdateFilterDateRange value)? updateFilterDateRange,
  }) {
    return getArchiveDetail?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetArchived value)? getArchived,
    TResult Function(_StatusChanged value)? statusChanged,
    TResult Function(_ArchivesUpdated value)? archivesUpdated,
    TResult Function(_FailureChanged value)? failureChanged,
    TResult Function(_SearchChanged value)? searchChanged,
    TResult Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult Function(_SelectArchive value)? selectArchive,
    TResult Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult Function(_UpdateFilterType value)? updateFilterType,
    TResult Function(_UpdateFilterDateRange value)? updateFilterDateRange,
    required TResult orElse(),
  }) {
    if (getArchiveDetail != null) {
      return getArchiveDetail(this);
    }
    return orElse();
  }
}

abstract class _GetArchiveDetail implements ArchivesEvent {
  const factory _GetArchiveDetail() = _$GetArchiveDetailImpl;
}

/// @nodoc
abstract class _$$UpdateFilterTypeImplCopyWith<$Res> {
  factory _$$UpdateFilterTypeImplCopyWith(_$UpdateFilterTypeImpl value,
          $Res Function(_$UpdateFilterTypeImpl) then) =
      __$$UpdateFilterTypeImplCopyWithImpl<$Res>;
  @useResult
  $Res call({ArchivesFilterType type});
}

/// @nodoc
class __$$UpdateFilterTypeImplCopyWithImpl<$Res>
    extends _$ArchivesEventCopyWithImpl<$Res, _$UpdateFilterTypeImpl>
    implements _$$UpdateFilterTypeImplCopyWith<$Res> {
  __$$UpdateFilterTypeImplCopyWithImpl(_$UpdateFilterTypeImpl _value,
      $Res Function(_$UpdateFilterTypeImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? type = null,
  }) {
    return _then(_$UpdateFilterTypeImpl(
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as ArchivesFilterType,
    ));
  }
}

/// @nodoc

class _$UpdateFilterTypeImpl implements _UpdateFilterType {
  const _$UpdateFilterTypeImpl({required this.type});

  @override
  final ArchivesFilterType type;

  @override
  String toString() {
    return 'ArchivesEvent.updateFilterType(type: $type)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UpdateFilterTypeImpl &&
            (identical(other.type, type) || other.type == type));
  }

  @override
  int get hashCode => Object.hash(runtimeType, type);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$UpdateFilterTypeImplCopyWith<_$UpdateFilterTypeImpl> get copyWith =>
      __$$UpdateFilterTypeImplCopyWithImpl<_$UpdateFilterTypeImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getArchived,
    required TResult Function(Status status) statusChanged,
    required TResult Function(ArchivesResponseEntity archives) archivesUpdated,
    required TResult Function(Failure? failure) failureChanged,
    required TResult Function(String value) searchChanged,
    required TResult Function(String value) searchByArchiveNum,
    required TResult Function(String id) selectArchive,
    required TResult Function() getArchiveDetail,
    required TResult Function(ArchivesFilterType type) updateFilterType,
    required TResult Function(DateTime startDate, DateTime endDate)
        updateFilterDateRange,
  }) {
    return updateFilterType(type);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getArchived,
    TResult? Function(Status status)? statusChanged,
    TResult? Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult? Function(Failure? failure)? failureChanged,
    TResult? Function(String value)? searchChanged,
    TResult? Function(String value)? searchByArchiveNum,
    TResult? Function(String id)? selectArchive,
    TResult? Function()? getArchiveDetail,
    TResult? Function(ArchivesFilterType type)? updateFilterType,
    TResult? Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
  }) {
    return updateFilterType?.call(type);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getArchived,
    TResult Function(Status status)? statusChanged,
    TResult Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult Function(Failure? failure)? failureChanged,
    TResult Function(String value)? searchChanged,
    TResult Function(String value)? searchByArchiveNum,
    TResult Function(String id)? selectArchive,
    TResult Function()? getArchiveDetail,
    TResult Function(ArchivesFilterType type)? updateFilterType,
    TResult Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
    required TResult orElse(),
  }) {
    if (updateFilterType != null) {
      return updateFilterType(type);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetArchived value) getArchived,
    required TResult Function(_StatusChanged value) statusChanged,
    required TResult Function(_ArchivesUpdated value) archivesUpdated,
    required TResult Function(_FailureChanged value) failureChanged,
    required TResult Function(_SearchChanged value) searchChanged,
    required TResult Function(_SearchByArchiveNum value) searchByArchiveNum,
    required TResult Function(_SelectArchive value) selectArchive,
    required TResult Function(_GetArchiveDetail value) getArchiveDetail,
    required TResult Function(_UpdateFilterType value) updateFilterType,
    required TResult Function(_UpdateFilterDateRange value)
        updateFilterDateRange,
  }) {
    return updateFilterType(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetArchived value)? getArchived,
    TResult? Function(_StatusChanged value)? statusChanged,
    TResult? Function(_ArchivesUpdated value)? archivesUpdated,
    TResult? Function(_FailureChanged value)? failureChanged,
    TResult? Function(_SearchChanged value)? searchChanged,
    TResult? Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult? Function(_SelectArchive value)? selectArchive,
    TResult? Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult? Function(_UpdateFilterType value)? updateFilterType,
    TResult? Function(_UpdateFilterDateRange value)? updateFilterDateRange,
  }) {
    return updateFilterType?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetArchived value)? getArchived,
    TResult Function(_StatusChanged value)? statusChanged,
    TResult Function(_ArchivesUpdated value)? archivesUpdated,
    TResult Function(_FailureChanged value)? failureChanged,
    TResult Function(_SearchChanged value)? searchChanged,
    TResult Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult Function(_SelectArchive value)? selectArchive,
    TResult Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult Function(_UpdateFilterType value)? updateFilterType,
    TResult Function(_UpdateFilterDateRange value)? updateFilterDateRange,
    required TResult orElse(),
  }) {
    if (updateFilterType != null) {
      return updateFilterType(this);
    }
    return orElse();
  }
}

abstract class _UpdateFilterType implements ArchivesEvent {
  const factory _UpdateFilterType({required final ArchivesFilterType type}) =
      _$UpdateFilterTypeImpl;

  ArchivesFilterType get type;
  @JsonKey(ignore: true)
  _$$UpdateFilterTypeImplCopyWith<_$UpdateFilterTypeImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$UpdateFilterDateRangeImplCopyWith<$Res> {
  factory _$$UpdateFilterDateRangeImplCopyWith(
          _$UpdateFilterDateRangeImpl value,
          $Res Function(_$UpdateFilterDateRangeImpl) then) =
      __$$UpdateFilterDateRangeImplCopyWithImpl<$Res>;
  @useResult
  $Res call({DateTime startDate, DateTime endDate});
}

/// @nodoc
class __$$UpdateFilterDateRangeImplCopyWithImpl<$Res>
    extends _$ArchivesEventCopyWithImpl<$Res, _$UpdateFilterDateRangeImpl>
    implements _$$UpdateFilterDateRangeImplCopyWith<$Res> {
  __$$UpdateFilterDateRangeImplCopyWithImpl(_$UpdateFilterDateRangeImpl _value,
      $Res Function(_$UpdateFilterDateRangeImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? startDate = null,
    Object? endDate = null,
  }) {
    return _then(_$UpdateFilterDateRangeImpl(
      startDate: null == startDate
          ? _value.startDate
          : startDate // ignore: cast_nullable_to_non_nullable
              as DateTime,
      endDate: null == endDate
          ? _value.endDate
          : endDate // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ));
  }
}

/// @nodoc

class _$UpdateFilterDateRangeImpl implements _UpdateFilterDateRange {
  const _$UpdateFilterDateRangeImpl(
      {required this.startDate, required this.endDate});

  @override
  final DateTime startDate;
  @override
  final DateTime endDate;

  @override
  String toString() {
    return 'ArchivesEvent.updateFilterDateRange(startDate: $startDate, endDate: $endDate)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UpdateFilterDateRangeImpl &&
            (identical(other.startDate, startDate) ||
                other.startDate == startDate) &&
            (identical(other.endDate, endDate) || other.endDate == endDate));
  }

  @override
  int get hashCode => Object.hash(runtimeType, startDate, endDate);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$UpdateFilterDateRangeImplCopyWith<_$UpdateFilterDateRangeImpl>
      get copyWith => __$$UpdateFilterDateRangeImplCopyWithImpl<
          _$UpdateFilterDateRangeImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function() getArchived,
    required TResult Function(Status status) statusChanged,
    required TResult Function(ArchivesResponseEntity archives) archivesUpdated,
    required TResult Function(Failure? failure) failureChanged,
    required TResult Function(String value) searchChanged,
    required TResult Function(String value) searchByArchiveNum,
    required TResult Function(String id) selectArchive,
    required TResult Function() getArchiveDetail,
    required TResult Function(ArchivesFilterType type) updateFilterType,
    required TResult Function(DateTime startDate, DateTime endDate)
        updateFilterDateRange,
  }) {
    return updateFilterDateRange(startDate, endDate);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function()? getArchived,
    TResult? Function(Status status)? statusChanged,
    TResult? Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult? Function(Failure? failure)? failureChanged,
    TResult? Function(String value)? searchChanged,
    TResult? Function(String value)? searchByArchiveNum,
    TResult? Function(String id)? selectArchive,
    TResult? Function()? getArchiveDetail,
    TResult? Function(ArchivesFilterType type)? updateFilterType,
    TResult? Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
  }) {
    return updateFilterDateRange?.call(startDate, endDate);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function()? getArchived,
    TResult Function(Status status)? statusChanged,
    TResult Function(ArchivesResponseEntity archives)? archivesUpdated,
    TResult Function(Failure? failure)? failureChanged,
    TResult Function(String value)? searchChanged,
    TResult Function(String value)? searchByArchiveNum,
    TResult Function(String id)? selectArchive,
    TResult Function()? getArchiveDetail,
    TResult Function(ArchivesFilterType type)? updateFilterType,
    TResult Function(DateTime startDate, DateTime endDate)?
        updateFilterDateRange,
    required TResult orElse(),
  }) {
    if (updateFilterDateRange != null) {
      return updateFilterDateRange(startDate, endDate);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_GetArchived value) getArchived,
    required TResult Function(_StatusChanged value) statusChanged,
    required TResult Function(_ArchivesUpdated value) archivesUpdated,
    required TResult Function(_FailureChanged value) failureChanged,
    required TResult Function(_SearchChanged value) searchChanged,
    required TResult Function(_SearchByArchiveNum value) searchByArchiveNum,
    required TResult Function(_SelectArchive value) selectArchive,
    required TResult Function(_GetArchiveDetail value) getArchiveDetail,
    required TResult Function(_UpdateFilterType value) updateFilterType,
    required TResult Function(_UpdateFilterDateRange value)
        updateFilterDateRange,
  }) {
    return updateFilterDateRange(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_GetArchived value)? getArchived,
    TResult? Function(_StatusChanged value)? statusChanged,
    TResult? Function(_ArchivesUpdated value)? archivesUpdated,
    TResult? Function(_FailureChanged value)? failureChanged,
    TResult? Function(_SearchChanged value)? searchChanged,
    TResult? Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult? Function(_SelectArchive value)? selectArchive,
    TResult? Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult? Function(_UpdateFilterType value)? updateFilterType,
    TResult? Function(_UpdateFilterDateRange value)? updateFilterDateRange,
  }) {
    return updateFilterDateRange?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_GetArchived value)? getArchived,
    TResult Function(_StatusChanged value)? statusChanged,
    TResult Function(_ArchivesUpdated value)? archivesUpdated,
    TResult Function(_FailureChanged value)? failureChanged,
    TResult Function(_SearchChanged value)? searchChanged,
    TResult Function(_SearchByArchiveNum value)? searchByArchiveNum,
    TResult Function(_SelectArchive value)? selectArchive,
    TResult Function(_GetArchiveDetail value)? getArchiveDetail,
    TResult Function(_UpdateFilterType value)? updateFilterType,
    TResult Function(_UpdateFilterDateRange value)? updateFilterDateRange,
    required TResult orElse(),
  }) {
    if (updateFilterDateRange != null) {
      return updateFilterDateRange(this);
    }
    return orElse();
  }
}

abstract class _UpdateFilterDateRange implements ArchivesEvent {
  const factory _UpdateFilterDateRange(
      {required final DateTime startDate,
      required final DateTime endDate}) = _$UpdateFilterDateRangeImpl;

  DateTime get startDate;
  DateTime get endDate;
  @JsonKey(ignore: true)
  _$$UpdateFilterDateRangeImplCopyWith<_$UpdateFilterDateRangeImpl>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
mixin _$ArchivesState {
  Status get status => throw _privateConstructorUsedError;
  Status get archiveStatus => throw _privateConstructorUsedError;
  ArchivesFilterType get filterType => throw _privateConstructorUsedError;
  List<ArchivesFilterType> get filters => throw _privateConstructorUsedError;
  DateTime? get startFilterDate => throw _privateConstructorUsedError;
  DateTime? get endFilterDate => throw _privateConstructorUsedError;
  TextEditingController? get textController =>
      throw _privateConstructorUsedError;
  ArchivesResponseEntity? get archives => throw _privateConstructorUsedError;
  ArchiveDetailEntity? get selectArchiveDetail =>
      throw _privateConstructorUsedError;
  ArchiveEntity? get selectArchive => throw _privateConstructorUsedError;
  Failure? get failure => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $ArchivesStateCopyWith<ArchivesState> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ArchivesStateCopyWith<$Res> {
  factory $ArchivesStateCopyWith(
          ArchivesState value, $Res Function(ArchivesState) then) =
      _$ArchivesStateCopyWithImpl<$Res, ArchivesState>;
  @useResult
  $Res call(
      {Status status,
      Status archiveStatus,
      ArchivesFilterType filterType,
      List<ArchivesFilterType> filters,
      DateTime? startFilterDate,
      DateTime? endFilterDate,
      TextEditingController? textController,
      ArchivesResponseEntity? archives,
      ArchiveDetailEntity? selectArchiveDetail,
      ArchiveEntity? selectArchive,
      Failure? failure});
}

/// @nodoc
class _$ArchivesStateCopyWithImpl<$Res, $Val extends ArchivesState>
    implements $ArchivesStateCopyWith<$Res> {
  _$ArchivesStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = null,
    Object? archiveStatus = null,
    Object? filterType = null,
    Object? filters = null,
    Object? startFilterDate = freezed,
    Object? endFilterDate = freezed,
    Object? textController = freezed,
    Object? archives = freezed,
    Object? selectArchiveDetail = freezed,
    Object? selectArchive = freezed,
    Object? failure = freezed,
  }) {
    return _then(_value.copyWith(
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as Status,
      archiveStatus: null == archiveStatus
          ? _value.archiveStatus
          : archiveStatus // ignore: cast_nullable_to_non_nullable
              as Status,
      filterType: null == filterType
          ? _value.filterType
          : filterType // ignore: cast_nullable_to_non_nullable
              as ArchivesFilterType,
      filters: null == filters
          ? _value.filters
          : filters // ignore: cast_nullable_to_non_nullable
              as List<ArchivesFilterType>,
      startFilterDate: freezed == startFilterDate
          ? _value.startFilterDate
          : startFilterDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      endFilterDate: freezed == endFilterDate
          ? _value.endFilterDate
          : endFilterDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      textController: freezed == textController
          ? _value.textController
          : textController // ignore: cast_nullable_to_non_nullable
              as TextEditingController?,
      archives: freezed == archives
          ? _value.archives
          : archives // ignore: cast_nullable_to_non_nullable
              as ArchivesResponseEntity?,
      selectArchiveDetail: freezed == selectArchiveDetail
          ? _value.selectArchiveDetail
          : selectArchiveDetail // ignore: cast_nullable_to_non_nullable
              as ArchiveDetailEntity?,
      selectArchive: freezed == selectArchive
          ? _value.selectArchive
          : selectArchive // ignore: cast_nullable_to_non_nullable
              as ArchiveEntity?,
      failure: freezed == failure
          ? _value.failure
          : failure // ignore: cast_nullable_to_non_nullable
              as Failure?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ArchivesStateImplCopyWith<$Res>
    implements $ArchivesStateCopyWith<$Res> {
  factory _$$ArchivesStateImplCopyWith(
          _$ArchivesStateImpl value, $Res Function(_$ArchivesStateImpl) then) =
      __$$ArchivesStateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {Status status,
      Status archiveStatus,
      ArchivesFilterType filterType,
      List<ArchivesFilterType> filters,
      DateTime? startFilterDate,
      DateTime? endFilterDate,
      TextEditingController? textController,
      ArchivesResponseEntity? archives,
      ArchiveDetailEntity? selectArchiveDetail,
      ArchiveEntity? selectArchive,
      Failure? failure});
}

/// @nodoc
class __$$ArchivesStateImplCopyWithImpl<$Res>
    extends _$ArchivesStateCopyWithImpl<$Res, _$ArchivesStateImpl>
    implements _$$ArchivesStateImplCopyWith<$Res> {
  __$$ArchivesStateImplCopyWithImpl(
      _$ArchivesStateImpl _value, $Res Function(_$ArchivesStateImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = null,
    Object? archiveStatus = null,
    Object? filterType = null,
    Object? filters = null,
    Object? startFilterDate = freezed,
    Object? endFilterDate = freezed,
    Object? textController = freezed,
    Object? archives = freezed,
    Object? selectArchiveDetail = freezed,
    Object? selectArchive = freezed,
    Object? failure = freezed,
  }) {
    return _then(_$ArchivesStateImpl(
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as Status,
      archiveStatus: null == archiveStatus
          ? _value.archiveStatus
          : archiveStatus // ignore: cast_nullable_to_non_nullable
              as Status,
      filterType: null == filterType
          ? _value.filterType
          : filterType // ignore: cast_nullable_to_non_nullable
              as ArchivesFilterType,
      filters: null == filters
          ? _value._filters
          : filters // ignore: cast_nullable_to_non_nullable
              as List<ArchivesFilterType>,
      startFilterDate: freezed == startFilterDate
          ? _value.startFilterDate
          : startFilterDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      endFilterDate: freezed == endFilterDate
          ? _value.endFilterDate
          : endFilterDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      textController: freezed == textController
          ? _value.textController
          : textController // ignore: cast_nullable_to_non_nullable
              as TextEditingController?,
      archives: freezed == archives
          ? _value.archives
          : archives // ignore: cast_nullable_to_non_nullable
              as ArchivesResponseEntity?,
      selectArchiveDetail: freezed == selectArchiveDetail
          ? _value.selectArchiveDetail
          : selectArchiveDetail // ignore: cast_nullable_to_non_nullable
              as ArchiveDetailEntity?,
      selectArchive: freezed == selectArchive
          ? _value.selectArchive
          : selectArchive // ignore: cast_nullable_to_non_nullable
              as ArchiveEntity?,
      failure: freezed == failure
          ? _value.failure
          : failure // ignore: cast_nullable_to_non_nullable
              as Failure?,
    ));
  }
}

/// @nodoc

class _$ArchivesStateImpl implements _ArchivesState {
  const _$ArchivesStateImpl(
      {this.status = Status.UNKNOWN,
      this.archiveStatus = Status.UNKNOWN,
      this.filterType = ArchivesFilterType.Today,
      final List<ArchivesFilterType> filters = const [
        ArchivesFilterType.All,
        ArchivesFilterType.Today,
        ArchivesFilterType.Week,
        ArchivesFilterType.month
      ],
      this.startFilterDate,
      this.endFilterDate,
      this.textController,
      this.archives,
      this.selectArchiveDetail,
      this.selectArchive,
      this.failure})
      : _filters = filters;

  @override
  @JsonKey()
  final Status status;
  @override
  @JsonKey()
  final Status archiveStatus;
  @override
  @JsonKey()
  final ArchivesFilterType filterType;
  final List<ArchivesFilterType> _filters;
  @override
  @JsonKey()
  List<ArchivesFilterType> get filters {
    if (_filters is EqualUnmodifiableListView) return _filters;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_filters);
  }

  @override
  final DateTime? startFilterDate;
  @override
  final DateTime? endFilterDate;
  @override
  final TextEditingController? textController;
  @override
  final ArchivesResponseEntity? archives;
  @override
  final ArchiveDetailEntity? selectArchiveDetail;
  @override
  final ArchiveEntity? selectArchive;
  @override
  final Failure? failure;

  @override
  String toString() {
    return 'ArchivesState(status: $status, archiveStatus: $archiveStatus, filterType: $filterType, filters: $filters, startFilterDate: $startFilterDate, endFilterDate: $endFilterDate, textController: $textController, archives: $archives, selectArchiveDetail: $selectArchiveDetail, selectArchive: $selectArchive, failure: $failure)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ArchivesStateImpl &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.archiveStatus, archiveStatus) ||
                other.archiveStatus == archiveStatus) &&
            (identical(other.filterType, filterType) ||
                other.filterType == filterType) &&
            const DeepCollectionEquality().equals(other._filters, _filters) &&
            (identical(other.startFilterDate, startFilterDate) ||
                other.startFilterDate == startFilterDate) &&
            (identical(other.endFilterDate, endFilterDate) ||
                other.endFilterDate == endFilterDate) &&
            (identical(other.textController, textController) ||
                other.textController == textController) &&
            (identical(other.archives, archives) ||
                other.archives == archives) &&
            (identical(other.selectArchiveDetail, selectArchiveDetail) ||
                other.selectArchiveDetail == selectArchiveDetail) &&
            (identical(other.selectArchive, selectArchive) ||
                other.selectArchive == selectArchive) &&
            (identical(other.failure, failure) || other.failure == failure));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      status,
      archiveStatus,
      filterType,
      const DeepCollectionEquality().hash(_filters),
      startFilterDate,
      endFilterDate,
      textController,
      archives,
      selectArchiveDetail,
      selectArchive,
      failure);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ArchivesStateImplCopyWith<_$ArchivesStateImpl> get copyWith =>
      __$$ArchivesStateImplCopyWithImpl<_$ArchivesStateImpl>(this, _$identity);
}

abstract class _ArchivesState implements ArchivesState {
  const factory _ArchivesState(
      {final Status status,
      final Status archiveStatus,
      final ArchivesFilterType filterType,
      final List<ArchivesFilterType> filters,
      final DateTime? startFilterDate,
      final DateTime? endFilterDate,
      final TextEditingController? textController,
      final ArchivesResponseEntity? archives,
      final ArchiveDetailEntity? selectArchiveDetail,
      final ArchiveEntity? selectArchive,
      final Failure? failure}) = _$ArchivesStateImpl;

  @override
  Status get status;
  @override
  Status get archiveStatus;
  @override
  ArchivesFilterType get filterType;
  @override
  List<ArchivesFilterType> get filters;
  @override
  DateTime? get startFilterDate;
  @override
  DateTime? get endFilterDate;
  @override
  TextEditingController? get textController;
  @override
  ArchivesResponseEntity? get archives;
  @override
  ArchiveDetailEntity? get selectArchiveDetail;
  @override
  ArchiveEntity? get selectArchive;
  @override
  Failure? get failure;
  @override
  @JsonKey(ignore: true)
  _$$ArchivesStateImplCopyWith<_$ArchivesStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
