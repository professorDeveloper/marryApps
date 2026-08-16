// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'auth_token_pair.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

AuthTokenPair _$AuthTokenPairFromJson(Map<String, dynamic> json) {
  return _AuthTokenPair.fromJson(json);
}

/// @nodoc
mixin _$AuthTokenPair {
  String get accessToken => throw _privateConstructorUsedError;
  String get refreshToken => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $AuthTokenPairCopyWith<AuthTokenPair> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AuthTokenPairCopyWith<$Res> {
  factory $AuthTokenPairCopyWith(
          AuthTokenPair value, $Res Function(AuthTokenPair) then) =
      _$AuthTokenPairCopyWithImpl<$Res, AuthTokenPair>;
  @useResult
  $Res call({String accessToken, String refreshToken});
}

/// @nodoc
class _$AuthTokenPairCopyWithImpl<$Res, $Val extends AuthTokenPair>
    implements $AuthTokenPairCopyWith<$Res> {
  _$AuthTokenPairCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? accessToken = null,
    Object? refreshToken = null,
  }) {
    return _then(_value.copyWith(
      accessToken: null == accessToken
          ? _value.accessToken
          : accessToken // ignore: cast_nullable_to_non_nullable
              as String,
      refreshToken: null == refreshToken
          ? _value.refreshToken
          : refreshToken // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AuthTokenPairImplCopyWith<$Res>
    implements $AuthTokenPairCopyWith<$Res> {
  factory _$$AuthTokenPairImplCopyWith(
          _$AuthTokenPairImpl value, $Res Function(_$AuthTokenPairImpl) then) =
      __$$AuthTokenPairImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String accessToken, String refreshToken});
}

/// @nodoc
class __$$AuthTokenPairImplCopyWithImpl<$Res>
    extends _$AuthTokenPairCopyWithImpl<$Res, _$AuthTokenPairImpl>
    implements _$$AuthTokenPairImplCopyWith<$Res> {
  __$$AuthTokenPairImplCopyWithImpl(
      _$AuthTokenPairImpl _value, $Res Function(_$AuthTokenPairImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? accessToken = null,
    Object? refreshToken = null,
  }) {
    return _then(_$AuthTokenPairImpl(
      accessToken: null == accessToken
          ? _value.accessToken
          : accessToken // ignore: cast_nullable_to_non_nullable
              as String,
      refreshToken: null == refreshToken
          ? _value.refreshToken
          : refreshToken // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AuthTokenPairImpl implements _AuthTokenPair {
  const _$AuthTokenPairImpl(
      {required this.accessToken, required this.refreshToken});

  factory _$AuthTokenPairImpl.fromJson(Map<String, dynamic> json) =>
      _$$AuthTokenPairImplFromJson(json);

  @override
  final String accessToken;
  @override
  final String refreshToken;

  @override
  String toString() {
    return 'AuthTokenPair(accessToken: $accessToken, refreshToken: $refreshToken)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AuthTokenPairImpl &&
            (identical(other.accessToken, accessToken) ||
                other.accessToken == accessToken) &&
            (identical(other.refreshToken, refreshToken) ||
                other.refreshToken == refreshToken));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, accessToken, refreshToken);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AuthTokenPairImplCopyWith<_$AuthTokenPairImpl> get copyWith =>
      __$$AuthTokenPairImplCopyWithImpl<_$AuthTokenPairImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AuthTokenPairImplToJson(
      this,
    );
  }
}

abstract class _AuthTokenPair implements AuthTokenPair {
  const factory _AuthTokenPair(
      {required final String accessToken,
      required final String refreshToken}) = _$AuthTokenPairImpl;

  factory _AuthTokenPair.fromJson(Map<String, dynamic> json) =
      _$AuthTokenPairImpl.fromJson;

  @override
  String get accessToken;
  @override
  String get refreshToken;
  @override
  @JsonKey(ignore: true)
  _$$AuthTokenPairImplCopyWith<_$AuthTokenPairImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
