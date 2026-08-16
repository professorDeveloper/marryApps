// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'brand_id_token_pair.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

BrandIdTokenPair _$BrandIdTokenPairFromJson(Map<String, dynamic> json) {
  return _BrandIdTokenPair.fromJson(json);
}

/// @nodoc
mixin _$BrandIdTokenPair {
  String get brandId => throw _privateConstructorUsedError;
  String get password => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $BrandIdTokenPairCopyWith<BrandIdTokenPair> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $BrandIdTokenPairCopyWith<$Res> {
  factory $BrandIdTokenPairCopyWith(
          BrandIdTokenPair value, $Res Function(BrandIdTokenPair) then) =
      _$BrandIdTokenPairCopyWithImpl<$Res, BrandIdTokenPair>;
  @useResult
  $Res call({String brandId, String password});
}

/// @nodoc
class _$BrandIdTokenPairCopyWithImpl<$Res, $Val extends BrandIdTokenPair>
    implements $BrandIdTokenPairCopyWith<$Res> {
  _$BrandIdTokenPairCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? brandId = null,
    Object? password = null,
  }) {
    return _then(_value.copyWith(
      brandId: null == brandId
          ? _value.brandId
          : brandId // ignore: cast_nullable_to_non_nullable
              as String,
      password: null == password
          ? _value.password
          : password // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$BrandIdTokenPairImplCopyWith<$Res>
    implements $BrandIdTokenPairCopyWith<$Res> {
  factory _$$BrandIdTokenPairImplCopyWith(_$BrandIdTokenPairImpl value,
          $Res Function(_$BrandIdTokenPairImpl) then) =
      __$$BrandIdTokenPairImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String brandId, String password});
}

/// @nodoc
class __$$BrandIdTokenPairImplCopyWithImpl<$Res>
    extends _$BrandIdTokenPairCopyWithImpl<$Res, _$BrandIdTokenPairImpl>
    implements _$$BrandIdTokenPairImplCopyWith<$Res> {
  __$$BrandIdTokenPairImplCopyWithImpl(_$BrandIdTokenPairImpl _value,
      $Res Function(_$BrandIdTokenPairImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? brandId = null,
    Object? password = null,
  }) {
    return _then(_$BrandIdTokenPairImpl(
      brandId: null == brandId
          ? _value.brandId
          : brandId // ignore: cast_nullable_to_non_nullable
              as String,
      password: null == password
          ? _value.password
          : password // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$BrandIdTokenPairImpl implements _BrandIdTokenPair {
  const _$BrandIdTokenPairImpl({required this.brandId, required this.password});

  factory _$BrandIdTokenPairImpl.fromJson(Map<String, dynamic> json) =>
      _$$BrandIdTokenPairImplFromJson(json);

  @override
  final String brandId;
  @override
  final String password;

  @override
  String toString() {
    return 'BrandIdTokenPair(brandId: $brandId, password: $password)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$BrandIdTokenPairImpl &&
            (identical(other.brandId, brandId) || other.brandId == brandId) &&
            (identical(other.password, password) ||
                other.password == password));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, brandId, password);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$BrandIdTokenPairImplCopyWith<_$BrandIdTokenPairImpl> get copyWith =>
      __$$BrandIdTokenPairImplCopyWithImpl<_$BrandIdTokenPairImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$BrandIdTokenPairImplToJson(
      this,
    );
  }
}

abstract class _BrandIdTokenPair implements BrandIdTokenPair {
  const factory _BrandIdTokenPair(
      {required final String brandId,
      required final String password}) = _$BrandIdTokenPairImpl;

  factory _BrandIdTokenPair.fromJson(Map<String, dynamic> json) =
      _$BrandIdTokenPairImpl.fromJson;

  @override
  String get brandId;
  @override
  String get password;
  @override
  @JsonKey(ignore: true)
  _$$BrandIdTokenPairImplCopyWith<_$BrandIdTokenPairImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
