// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'login_pin_cubit.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$LoginPinState {
  Status get status => throw _privateConstructorUsedError;
  Failure get failure => throw _privateConstructorUsedError;
  String? get pin => throw _privateConstructorUsedError;
  int get pinLength => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $LoginPinStateCopyWith<LoginPinState> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $LoginPinStateCopyWith<$Res> {
  factory $LoginPinStateCopyWith(
          LoginPinState value, $Res Function(LoginPinState) then) =
      _$LoginPinStateCopyWithImpl<$Res, LoginPinState>;
  @useResult
  $Res call({Status status, Failure failure, String? pin, int pinLength});
}

/// @nodoc
class _$LoginPinStateCopyWithImpl<$Res, $Val extends LoginPinState>
    implements $LoginPinStateCopyWith<$Res> {
  _$LoginPinStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = null,
    Object? failure = null,
    Object? pin = freezed,
    Object? pinLength = null,
  }) {
    return _then(_value.copyWith(
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as Status,
      failure: null == failure
          ? _value.failure
          : failure // ignore: cast_nullable_to_non_nullable
              as Failure,
      pin: freezed == pin
          ? _value.pin
          : pin // ignore: cast_nullable_to_non_nullable
              as String?,
      pinLength: null == pinLength
          ? _value.pinLength
          : pinLength // ignore: cast_nullable_to_non_nullable
              as int,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$LoginPinStateImplCopyWith<$Res>
    implements $LoginPinStateCopyWith<$Res> {
  factory _$$LoginPinStateImplCopyWith(
          _$LoginPinStateImpl value, $Res Function(_$LoginPinStateImpl) then) =
      __$$LoginPinStateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({Status status, Failure failure, String? pin, int pinLength});
}

/// @nodoc
class __$$LoginPinStateImplCopyWithImpl<$Res>
    extends _$LoginPinStateCopyWithImpl<$Res, _$LoginPinStateImpl>
    implements _$$LoginPinStateImplCopyWith<$Res> {
  __$$LoginPinStateImplCopyWithImpl(
      _$LoginPinStateImpl _value, $Res Function(_$LoginPinStateImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = null,
    Object? failure = null,
    Object? pin = freezed,
    Object? pinLength = null,
  }) {
    return _then(_$LoginPinStateImpl(
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as Status,
      failure: null == failure
          ? _value.failure
          : failure // ignore: cast_nullable_to_non_nullable
              as Failure,
      pin: freezed == pin
          ? _value.pin
          : pin // ignore: cast_nullable_to_non_nullable
              as String?,
      pinLength: null == pinLength
          ? _value.pinLength
          : pinLength // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc

class _$LoginPinStateImpl implements _LoginPinState {
  const _$LoginPinStateImpl(
      {this.status = Status.UNKNOWN,
      this.failure = const UnknownFailure(),
      this.pin,
      this.pinLength = 4});

  @override
  @JsonKey()
  final Status status;
  @override
  @JsonKey()
  final Failure failure;
  @override
  final String? pin;
  @override
  @JsonKey()
  final int pinLength;

  @override
  String toString() {
    return 'LoginPinState(status: $status, failure: $failure, pin: $pin, pinLength: $pinLength)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$LoginPinStateImpl &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.failure, failure) || other.failure == failure) &&
            (identical(other.pin, pin) || other.pin == pin) &&
            (identical(other.pinLength, pinLength) ||
                other.pinLength == pinLength));
  }

  @override
  int get hashCode => Object.hash(runtimeType, status, failure, pin, pinLength);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$LoginPinStateImplCopyWith<_$LoginPinStateImpl> get copyWith =>
      __$$LoginPinStateImplCopyWithImpl<_$LoginPinStateImpl>(this, _$identity);
}

abstract class _LoginPinState implements LoginPinState {
  const factory _LoginPinState(
      {final Status status,
      final Failure failure,
      final String? pin,
      final int pinLength}) = _$LoginPinStateImpl;

  @override
  Status get status;
  @override
  Failure get failure;
  @override
  String? get pin;
  @override
  int get pinLength;
  @override
  @JsonKey(ignore: true)
  _$$LoginPinStateImplCopyWith<_$LoginPinStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
