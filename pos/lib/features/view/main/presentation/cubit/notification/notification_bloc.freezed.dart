// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'notification_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$NotificationEvent {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function(ArchivesFilterType filterType) updateFilterType,
    required TResult Function(DateTime start, DateTime end)
        updateDateFilterEvent,
    required TResult Function() getNotifications,
    required TResult Function() againNotifications,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function(ArchivesFilterType filterType)? updateFilterType,
    TResult? Function(DateTime start, DateTime end)? updateDateFilterEvent,
    TResult? Function()? getNotifications,
    TResult? Function()? againNotifications,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function(ArchivesFilterType filterType)? updateFilterType,
    TResult Function(DateTime start, DateTime end)? updateDateFilterEvent,
    TResult Function()? getNotifications,
    TResult Function()? againNotifications,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_UpdateFilterType value) updateFilterType,
    required TResult Function(_UpdateDateFilterEvent value)
        updateDateFilterEvent,
    required TResult Function(_GetNotifications value) getNotifications,
    required TResult Function(_AgainNotifications value) againNotifications,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_UpdateFilterType value)? updateFilterType,
    TResult? Function(_UpdateDateFilterEvent value)? updateDateFilterEvent,
    TResult? Function(_GetNotifications value)? getNotifications,
    TResult? Function(_AgainNotifications value)? againNotifications,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_UpdateFilterType value)? updateFilterType,
    TResult Function(_UpdateDateFilterEvent value)? updateDateFilterEvent,
    TResult Function(_GetNotifications value)? getNotifications,
    TResult Function(_AgainNotifications value)? againNotifications,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $NotificationEventCopyWith<$Res> {
  factory $NotificationEventCopyWith(
          NotificationEvent value, $Res Function(NotificationEvent) then) =
      _$NotificationEventCopyWithImpl<$Res, NotificationEvent>;
}

/// @nodoc
class _$NotificationEventCopyWithImpl<$Res, $Val extends NotificationEvent>
    implements $NotificationEventCopyWith<$Res> {
  _$NotificationEventCopyWithImpl(this._value, this._then);

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
    extends _$NotificationEventCopyWithImpl<$Res, _$StartedImpl>
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
    return 'NotificationEvent.started()';
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
    required TResult Function(ArchivesFilterType filterType) updateFilterType,
    required TResult Function(DateTime start, DateTime end)
        updateDateFilterEvent,
    required TResult Function() getNotifications,
    required TResult Function() againNotifications,
  }) {
    return started();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function(ArchivesFilterType filterType)? updateFilterType,
    TResult? Function(DateTime start, DateTime end)? updateDateFilterEvent,
    TResult? Function()? getNotifications,
    TResult? Function()? againNotifications,
  }) {
    return started?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function(ArchivesFilterType filterType)? updateFilterType,
    TResult Function(DateTime start, DateTime end)? updateDateFilterEvent,
    TResult Function()? getNotifications,
    TResult Function()? againNotifications,
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
    required TResult Function(_UpdateFilterType value) updateFilterType,
    required TResult Function(_UpdateDateFilterEvent value)
        updateDateFilterEvent,
    required TResult Function(_GetNotifications value) getNotifications,
    required TResult Function(_AgainNotifications value) againNotifications,
  }) {
    return started(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_UpdateFilterType value)? updateFilterType,
    TResult? Function(_UpdateDateFilterEvent value)? updateDateFilterEvent,
    TResult? Function(_GetNotifications value)? getNotifications,
    TResult? Function(_AgainNotifications value)? againNotifications,
  }) {
    return started?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_UpdateFilterType value)? updateFilterType,
    TResult Function(_UpdateDateFilterEvent value)? updateDateFilterEvent,
    TResult Function(_GetNotifications value)? getNotifications,
    TResult Function(_AgainNotifications value)? againNotifications,
    required TResult orElse(),
  }) {
    if (started != null) {
      return started(this);
    }
    return orElse();
  }
}

abstract class _Started implements NotificationEvent {
  const factory _Started() = _$StartedImpl;
}

/// @nodoc
abstract class _$$UpdateFilterTypeImplCopyWith<$Res> {
  factory _$$UpdateFilterTypeImplCopyWith(_$UpdateFilterTypeImpl value,
          $Res Function(_$UpdateFilterTypeImpl) then) =
      __$$UpdateFilterTypeImplCopyWithImpl<$Res>;
  @useResult
  $Res call({ArchivesFilterType filterType});
}

/// @nodoc
class __$$UpdateFilterTypeImplCopyWithImpl<$Res>
    extends _$NotificationEventCopyWithImpl<$Res, _$UpdateFilterTypeImpl>
    implements _$$UpdateFilterTypeImplCopyWith<$Res> {
  __$$UpdateFilterTypeImplCopyWithImpl(_$UpdateFilterTypeImpl _value,
      $Res Function(_$UpdateFilterTypeImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? filterType = null,
  }) {
    return _then(_$UpdateFilterTypeImpl(
      filterType: null == filterType
          ? _value.filterType
          : filterType // ignore: cast_nullable_to_non_nullable
              as ArchivesFilterType,
    ));
  }
}

/// @nodoc

class _$UpdateFilterTypeImpl implements _UpdateFilterType {
  const _$UpdateFilterTypeImpl({required this.filterType});

  @override
  final ArchivesFilterType filterType;

  @override
  String toString() {
    return 'NotificationEvent.updateFilterType(filterType: $filterType)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UpdateFilterTypeImpl &&
            (identical(other.filterType, filterType) ||
                other.filterType == filterType));
  }

  @override
  int get hashCode => Object.hash(runtimeType, filterType);

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
    required TResult Function(ArchivesFilterType filterType) updateFilterType,
    required TResult Function(DateTime start, DateTime end)
        updateDateFilterEvent,
    required TResult Function() getNotifications,
    required TResult Function() againNotifications,
  }) {
    return updateFilterType(filterType);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function(ArchivesFilterType filterType)? updateFilterType,
    TResult? Function(DateTime start, DateTime end)? updateDateFilterEvent,
    TResult? Function()? getNotifications,
    TResult? Function()? againNotifications,
  }) {
    return updateFilterType?.call(filterType);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function(ArchivesFilterType filterType)? updateFilterType,
    TResult Function(DateTime start, DateTime end)? updateDateFilterEvent,
    TResult Function()? getNotifications,
    TResult Function()? againNotifications,
    required TResult orElse(),
  }) {
    if (updateFilterType != null) {
      return updateFilterType(filterType);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_UpdateFilterType value) updateFilterType,
    required TResult Function(_UpdateDateFilterEvent value)
        updateDateFilterEvent,
    required TResult Function(_GetNotifications value) getNotifications,
    required TResult Function(_AgainNotifications value) againNotifications,
  }) {
    return updateFilterType(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_UpdateFilterType value)? updateFilterType,
    TResult? Function(_UpdateDateFilterEvent value)? updateDateFilterEvent,
    TResult? Function(_GetNotifications value)? getNotifications,
    TResult? Function(_AgainNotifications value)? againNotifications,
  }) {
    return updateFilterType?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_UpdateFilterType value)? updateFilterType,
    TResult Function(_UpdateDateFilterEvent value)? updateDateFilterEvent,
    TResult Function(_GetNotifications value)? getNotifications,
    TResult Function(_AgainNotifications value)? againNotifications,
    required TResult orElse(),
  }) {
    if (updateFilterType != null) {
      return updateFilterType(this);
    }
    return orElse();
  }
}

abstract class _UpdateFilterType implements NotificationEvent {
  const factory _UpdateFilterType(
      {required final ArchivesFilterType filterType}) = _$UpdateFilterTypeImpl;

  ArchivesFilterType get filterType;
  @JsonKey(ignore: true)
  _$$UpdateFilterTypeImplCopyWith<_$UpdateFilterTypeImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$UpdateDateFilterEventImplCopyWith<$Res> {
  factory _$$UpdateDateFilterEventImplCopyWith(
          _$UpdateDateFilterEventImpl value,
          $Res Function(_$UpdateDateFilterEventImpl) then) =
      __$$UpdateDateFilterEventImplCopyWithImpl<$Res>;
  @useResult
  $Res call({DateTime start, DateTime end});
}

/// @nodoc
class __$$UpdateDateFilterEventImplCopyWithImpl<$Res>
    extends _$NotificationEventCopyWithImpl<$Res, _$UpdateDateFilterEventImpl>
    implements _$$UpdateDateFilterEventImplCopyWith<$Res> {
  __$$UpdateDateFilterEventImplCopyWithImpl(_$UpdateDateFilterEventImpl _value,
      $Res Function(_$UpdateDateFilterEventImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? start = null,
    Object? end = null,
  }) {
    return _then(_$UpdateDateFilterEventImpl(
      start: null == start
          ? _value.start
          : start // ignore: cast_nullable_to_non_nullable
              as DateTime,
      end: null == end
          ? _value.end
          : end // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ));
  }
}

/// @nodoc

class _$UpdateDateFilterEventImpl implements _UpdateDateFilterEvent {
  const _$UpdateDateFilterEventImpl({required this.start, required this.end});

  @override
  final DateTime start;
  @override
  final DateTime end;

  @override
  String toString() {
    return 'NotificationEvent.updateDateFilterEvent(start: $start, end: $end)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UpdateDateFilterEventImpl &&
            (identical(other.start, start) || other.start == start) &&
            (identical(other.end, end) || other.end == end));
  }

  @override
  int get hashCode => Object.hash(runtimeType, start, end);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$UpdateDateFilterEventImplCopyWith<_$UpdateDateFilterEventImpl>
      get copyWith => __$$UpdateDateFilterEventImplCopyWithImpl<
          _$UpdateDateFilterEventImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function(ArchivesFilterType filterType) updateFilterType,
    required TResult Function(DateTime start, DateTime end)
        updateDateFilterEvent,
    required TResult Function() getNotifications,
    required TResult Function() againNotifications,
  }) {
    return updateDateFilterEvent(start, end);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function(ArchivesFilterType filterType)? updateFilterType,
    TResult? Function(DateTime start, DateTime end)? updateDateFilterEvent,
    TResult? Function()? getNotifications,
    TResult? Function()? againNotifications,
  }) {
    return updateDateFilterEvent?.call(start, end);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function(ArchivesFilterType filterType)? updateFilterType,
    TResult Function(DateTime start, DateTime end)? updateDateFilterEvent,
    TResult Function()? getNotifications,
    TResult Function()? againNotifications,
    required TResult orElse(),
  }) {
    if (updateDateFilterEvent != null) {
      return updateDateFilterEvent(start, end);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_UpdateFilterType value) updateFilterType,
    required TResult Function(_UpdateDateFilterEvent value)
        updateDateFilterEvent,
    required TResult Function(_GetNotifications value) getNotifications,
    required TResult Function(_AgainNotifications value) againNotifications,
  }) {
    return updateDateFilterEvent(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_UpdateFilterType value)? updateFilterType,
    TResult? Function(_UpdateDateFilterEvent value)? updateDateFilterEvent,
    TResult? Function(_GetNotifications value)? getNotifications,
    TResult? Function(_AgainNotifications value)? againNotifications,
  }) {
    return updateDateFilterEvent?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_UpdateFilterType value)? updateFilterType,
    TResult Function(_UpdateDateFilterEvent value)? updateDateFilterEvent,
    TResult Function(_GetNotifications value)? getNotifications,
    TResult Function(_AgainNotifications value)? againNotifications,
    required TResult orElse(),
  }) {
    if (updateDateFilterEvent != null) {
      return updateDateFilterEvent(this);
    }
    return orElse();
  }
}

abstract class _UpdateDateFilterEvent implements NotificationEvent {
  const factory _UpdateDateFilterEvent(
      {required final DateTime start,
      required final DateTime end}) = _$UpdateDateFilterEventImpl;

  DateTime get start;
  DateTime get end;
  @JsonKey(ignore: true)
  _$$UpdateDateFilterEventImplCopyWith<_$UpdateDateFilterEventImpl>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$GetNotificationsImplCopyWith<$Res> {
  factory _$$GetNotificationsImplCopyWith(_$GetNotificationsImpl value,
          $Res Function(_$GetNotificationsImpl) then) =
      __$$GetNotificationsImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$GetNotificationsImplCopyWithImpl<$Res>
    extends _$NotificationEventCopyWithImpl<$Res, _$GetNotificationsImpl>
    implements _$$GetNotificationsImplCopyWith<$Res> {
  __$$GetNotificationsImplCopyWithImpl(_$GetNotificationsImpl _value,
      $Res Function(_$GetNotificationsImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$GetNotificationsImpl implements _GetNotifications {
  const _$GetNotificationsImpl();

  @override
  String toString() {
    return 'NotificationEvent.getNotifications()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$GetNotificationsImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function(ArchivesFilterType filterType) updateFilterType,
    required TResult Function(DateTime start, DateTime end)
        updateDateFilterEvent,
    required TResult Function() getNotifications,
    required TResult Function() againNotifications,
  }) {
    return getNotifications();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function(ArchivesFilterType filterType)? updateFilterType,
    TResult? Function(DateTime start, DateTime end)? updateDateFilterEvent,
    TResult? Function()? getNotifications,
    TResult? Function()? againNotifications,
  }) {
    return getNotifications?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function(ArchivesFilterType filterType)? updateFilterType,
    TResult Function(DateTime start, DateTime end)? updateDateFilterEvent,
    TResult Function()? getNotifications,
    TResult Function()? againNotifications,
    required TResult orElse(),
  }) {
    if (getNotifications != null) {
      return getNotifications();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_UpdateFilterType value) updateFilterType,
    required TResult Function(_UpdateDateFilterEvent value)
        updateDateFilterEvent,
    required TResult Function(_GetNotifications value) getNotifications,
    required TResult Function(_AgainNotifications value) againNotifications,
  }) {
    return getNotifications(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_UpdateFilterType value)? updateFilterType,
    TResult? Function(_UpdateDateFilterEvent value)? updateDateFilterEvent,
    TResult? Function(_GetNotifications value)? getNotifications,
    TResult? Function(_AgainNotifications value)? againNotifications,
  }) {
    return getNotifications?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_UpdateFilterType value)? updateFilterType,
    TResult Function(_UpdateDateFilterEvent value)? updateDateFilterEvent,
    TResult Function(_GetNotifications value)? getNotifications,
    TResult Function(_AgainNotifications value)? againNotifications,
    required TResult orElse(),
  }) {
    if (getNotifications != null) {
      return getNotifications(this);
    }
    return orElse();
  }
}

abstract class _GetNotifications implements NotificationEvent {
  const factory _GetNotifications() = _$GetNotificationsImpl;
}

/// @nodoc
abstract class _$$AgainNotificationsImplCopyWith<$Res> {
  factory _$$AgainNotificationsImplCopyWith(_$AgainNotificationsImpl value,
          $Res Function(_$AgainNotificationsImpl) then) =
      __$$AgainNotificationsImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$AgainNotificationsImplCopyWithImpl<$Res>
    extends _$NotificationEventCopyWithImpl<$Res, _$AgainNotificationsImpl>
    implements _$$AgainNotificationsImplCopyWith<$Res> {
  __$$AgainNotificationsImplCopyWithImpl(_$AgainNotificationsImpl _value,
      $Res Function(_$AgainNotificationsImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$AgainNotificationsImpl implements _AgainNotifications {
  const _$AgainNotificationsImpl();

  @override
  String toString() {
    return 'NotificationEvent.againNotifications()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$AgainNotificationsImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() started,
    required TResult Function(ArchivesFilterType filterType) updateFilterType,
    required TResult Function(DateTime start, DateTime end)
        updateDateFilterEvent,
    required TResult Function() getNotifications,
    required TResult Function() againNotifications,
  }) {
    return againNotifications();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? started,
    TResult? Function(ArchivesFilterType filterType)? updateFilterType,
    TResult? Function(DateTime start, DateTime end)? updateDateFilterEvent,
    TResult? Function()? getNotifications,
    TResult? Function()? againNotifications,
  }) {
    return againNotifications?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? started,
    TResult Function(ArchivesFilterType filterType)? updateFilterType,
    TResult Function(DateTime start, DateTime end)? updateDateFilterEvent,
    TResult Function()? getNotifications,
    TResult Function()? againNotifications,
    required TResult orElse(),
  }) {
    if (againNotifications != null) {
      return againNotifications();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Started value) started,
    required TResult Function(_UpdateFilterType value) updateFilterType,
    required TResult Function(_UpdateDateFilterEvent value)
        updateDateFilterEvent,
    required TResult Function(_GetNotifications value) getNotifications,
    required TResult Function(_AgainNotifications value) againNotifications,
  }) {
    return againNotifications(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Started value)? started,
    TResult? Function(_UpdateFilterType value)? updateFilterType,
    TResult? Function(_UpdateDateFilterEvent value)? updateDateFilterEvent,
    TResult? Function(_GetNotifications value)? getNotifications,
    TResult? Function(_AgainNotifications value)? againNotifications,
  }) {
    return againNotifications?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Started value)? started,
    TResult Function(_UpdateFilterType value)? updateFilterType,
    TResult Function(_UpdateDateFilterEvent value)? updateDateFilterEvent,
    TResult Function(_GetNotifications value)? getNotifications,
    TResult Function(_AgainNotifications value)? againNotifications,
    required TResult orElse(),
  }) {
    if (againNotifications != null) {
      return againNotifications(this);
    }
    return orElse();
  }
}

abstract class _AgainNotifications implements NotificationEvent {
  const factory _AgainNotifications() = _$AgainNotificationsImpl;
}

/// @nodoc
mixin _$NotificationState {
  Status get status => throw _privateConstructorUsedError;
  ScrollController? get scrollController => throw _privateConstructorUsedError;
  TextEditingController? get searchController =>
      throw _privateConstructorUsedError;
  ArchivesFilterType get filterType => throw _privateConstructorUsedError;
  DateTime? get start => throw _privateConstructorUsedError;
  DateTime? get end => throw _privateConstructorUsedError;
  Failure? get failure => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $NotificationStateCopyWith<NotificationState> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $NotificationStateCopyWith<$Res> {
  factory $NotificationStateCopyWith(
          NotificationState value, $Res Function(NotificationState) then) =
      _$NotificationStateCopyWithImpl<$Res, NotificationState>;
  @useResult
  $Res call(
      {Status status,
      ScrollController? scrollController,
      TextEditingController? searchController,
      ArchivesFilterType filterType,
      DateTime? start,
      DateTime? end,
      Failure? failure});
}

/// @nodoc
class _$NotificationStateCopyWithImpl<$Res, $Val extends NotificationState>
    implements $NotificationStateCopyWith<$Res> {
  _$NotificationStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = null,
    Object? scrollController = freezed,
    Object? searchController = freezed,
    Object? filterType = null,
    Object? start = freezed,
    Object? end = freezed,
    Object? failure = freezed,
  }) {
    return _then(_value.copyWith(
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as Status,
      scrollController: freezed == scrollController
          ? _value.scrollController
          : scrollController // ignore: cast_nullable_to_non_nullable
              as ScrollController?,
      searchController: freezed == searchController
          ? _value.searchController
          : searchController // ignore: cast_nullable_to_non_nullable
              as TextEditingController?,
      filterType: null == filterType
          ? _value.filterType
          : filterType // ignore: cast_nullable_to_non_nullable
              as ArchivesFilterType,
      start: freezed == start
          ? _value.start
          : start // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      end: freezed == end
          ? _value.end
          : end // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      failure: freezed == failure
          ? _value.failure
          : failure // ignore: cast_nullable_to_non_nullable
              as Failure?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$NotificationStateImplCopyWith<$Res>
    implements $NotificationStateCopyWith<$Res> {
  factory _$$NotificationStateImplCopyWith(_$NotificationStateImpl value,
          $Res Function(_$NotificationStateImpl) then) =
      __$$NotificationStateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {Status status,
      ScrollController? scrollController,
      TextEditingController? searchController,
      ArchivesFilterType filterType,
      DateTime? start,
      DateTime? end,
      Failure? failure});
}

/// @nodoc
class __$$NotificationStateImplCopyWithImpl<$Res>
    extends _$NotificationStateCopyWithImpl<$Res, _$NotificationStateImpl>
    implements _$$NotificationStateImplCopyWith<$Res> {
  __$$NotificationStateImplCopyWithImpl(_$NotificationStateImpl _value,
      $Res Function(_$NotificationStateImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = null,
    Object? scrollController = freezed,
    Object? searchController = freezed,
    Object? filterType = null,
    Object? start = freezed,
    Object? end = freezed,
    Object? failure = freezed,
  }) {
    return _then(_$NotificationStateImpl(
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as Status,
      scrollController: freezed == scrollController
          ? _value.scrollController
          : scrollController // ignore: cast_nullable_to_non_nullable
              as ScrollController?,
      searchController: freezed == searchController
          ? _value.searchController
          : searchController // ignore: cast_nullable_to_non_nullable
              as TextEditingController?,
      filterType: null == filterType
          ? _value.filterType
          : filterType // ignore: cast_nullable_to_non_nullable
              as ArchivesFilterType,
      start: freezed == start
          ? _value.start
          : start // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      end: freezed == end
          ? _value.end
          : end // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      failure: freezed == failure
          ? _value.failure
          : failure // ignore: cast_nullable_to_non_nullable
              as Failure?,
    ));
  }
}

/// @nodoc

class _$NotificationStateImpl implements _NotificationState {
  const _$NotificationStateImpl(
      {this.status = Status.UNKNOWN,
      this.scrollController,
      this.searchController,
      this.filterType = ArchivesFilterType.Today,
      this.start,
      this.end,
      this.failure});

  @override
  @JsonKey()
  final Status status;
  @override
  final ScrollController? scrollController;
  @override
  final TextEditingController? searchController;
  @override
  @JsonKey()
  final ArchivesFilterType filterType;
  @override
  final DateTime? start;
  @override
  final DateTime? end;
  @override
  final Failure? failure;

  @override
  String toString() {
    return 'NotificationState(status: $status, scrollController: $scrollController, searchController: $searchController, filterType: $filterType, start: $start, end: $end, failure: $failure)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$NotificationStateImpl &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.scrollController, scrollController) ||
                other.scrollController == scrollController) &&
            (identical(other.searchController, searchController) ||
                other.searchController == searchController) &&
            (identical(other.filterType, filterType) ||
                other.filterType == filterType) &&
            (identical(other.start, start) || other.start == start) &&
            (identical(other.end, end) || other.end == end) &&
            (identical(other.failure, failure) || other.failure == failure));
  }

  @override
  int get hashCode => Object.hash(runtimeType, status, scrollController,
      searchController, filterType, start, end, failure);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$NotificationStateImplCopyWith<_$NotificationStateImpl> get copyWith =>
      __$$NotificationStateImplCopyWithImpl<_$NotificationStateImpl>(
          this, _$identity);
}

abstract class _NotificationState implements NotificationState {
  const factory _NotificationState(
      {final Status status,
      final ScrollController? scrollController,
      final TextEditingController? searchController,
      final ArchivesFilterType filterType,
      final DateTime? start,
      final DateTime? end,
      final Failure? failure}) = _$NotificationStateImpl;

  @override
  Status get status;
  @override
  ScrollController? get scrollController;
  @override
  TextEditingController? get searchController;
  @override
  ArchivesFilterType get filterType;
  @override
  DateTime? get start;
  @override
  DateTime? get end;
  @override
  Failure? get failure;
  @override
  @JsonKey(ignore: true)
  _$$NotificationStateImplCopyWith<_$NotificationStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
