// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'set_app_language_uscase.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

SetAppLanguageParams _$SetAppLanguageParamsFromJson(Map<String, dynamic> json) {
  return _SetAppLanguageParams.fromJson(json);
}

/// @nodoc
mixin _$SetAppLanguageParams {
  String get lang => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $SetAppLanguageParamsCopyWith<SetAppLanguageParams> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SetAppLanguageParamsCopyWith<$Res> {
  factory $SetAppLanguageParamsCopyWith(SetAppLanguageParams value,
          $Res Function(SetAppLanguageParams) then) =
      _$SetAppLanguageParamsCopyWithImpl<$Res, SetAppLanguageParams>;
  @useResult
  $Res call({String lang});
}

/// @nodoc
class _$SetAppLanguageParamsCopyWithImpl<$Res,
        $Val extends SetAppLanguageParams>
    implements $SetAppLanguageParamsCopyWith<$Res> {
  _$SetAppLanguageParamsCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? lang = null,
  }) {
    return _then(_value.copyWith(
      lang: null == lang
          ? _value.lang
          : lang // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$SetAppLanguageParamsImplCopyWith<$Res>
    implements $SetAppLanguageParamsCopyWith<$Res> {
  factory _$$SetAppLanguageParamsImplCopyWith(_$SetAppLanguageParamsImpl value,
          $Res Function(_$SetAppLanguageParamsImpl) then) =
      __$$SetAppLanguageParamsImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String lang});
}

/// @nodoc
class __$$SetAppLanguageParamsImplCopyWithImpl<$Res>
    extends _$SetAppLanguageParamsCopyWithImpl<$Res, _$SetAppLanguageParamsImpl>
    implements _$$SetAppLanguageParamsImplCopyWith<$Res> {
  __$$SetAppLanguageParamsImplCopyWithImpl(_$SetAppLanguageParamsImpl _value,
      $Res Function(_$SetAppLanguageParamsImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? lang = null,
  }) {
    return _then(_$SetAppLanguageParamsImpl(
      lang: null == lang
          ? _value.lang
          : lang // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$SetAppLanguageParamsImpl implements _SetAppLanguageParams {
  const _$SetAppLanguageParamsImpl({required this.lang});

  factory _$SetAppLanguageParamsImpl.fromJson(Map<String, dynamic> json) =>
      _$$SetAppLanguageParamsImplFromJson(json);

  @override
  final String lang;

  @override
  String toString() {
    return 'SetAppLanguageParams(lang: $lang)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SetAppLanguageParamsImpl &&
            (identical(other.lang, lang) || other.lang == lang));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, lang);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$SetAppLanguageParamsImplCopyWith<_$SetAppLanguageParamsImpl>
      get copyWith =>
          __$$SetAppLanguageParamsImplCopyWithImpl<_$SetAppLanguageParamsImpl>(
              this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$SetAppLanguageParamsImplToJson(
      this,
    );
  }
}

abstract class _SetAppLanguageParams implements SetAppLanguageParams {
  const factory _SetAppLanguageParams({required final String lang}) =
      _$SetAppLanguageParamsImpl;

  factory _SetAppLanguageParams.fromJson(Map<String, dynamic> json) =
      _$SetAppLanguageParamsImpl.fromJson;

  @override
  String get lang;
  @override
  @JsonKey(ignore: true)
  _$$SetAppLanguageParamsImplCopyWith<_$SetAppLanguageParamsImpl>
      get copyWith => throw _privateConstructorUsedError;
}
