// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'main_tab_cubit.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$MainTabState {
  int get main => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $MainTabStateCopyWith<MainTabState> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $MainTabStateCopyWith<$Res> {
  factory $MainTabStateCopyWith(
          MainTabState value, $Res Function(MainTabState) then) =
      _$MainTabStateCopyWithImpl<$Res, MainTabState>;
  @useResult
  $Res call({int main});
}

/// @nodoc
class _$MainTabStateCopyWithImpl<$Res, $Val extends MainTabState>
    implements $MainTabStateCopyWith<$Res> {
  _$MainTabStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? main = null,
  }) {
    return _then(_value.copyWith(
      main: null == main
          ? _value.main
          : main // ignore: cast_nullable_to_non_nullable
              as int,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$MainTabStateImplCopyWith<$Res>
    implements $MainTabStateCopyWith<$Res> {
  factory _$$MainTabStateImplCopyWith(
          _$MainTabStateImpl value, $Res Function(_$MainTabStateImpl) then) =
      __$$MainTabStateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({int main});
}

/// @nodoc
class __$$MainTabStateImplCopyWithImpl<$Res>
    extends _$MainTabStateCopyWithImpl<$Res, _$MainTabStateImpl>
    implements _$$MainTabStateImplCopyWith<$Res> {
  __$$MainTabStateImplCopyWithImpl(
      _$MainTabStateImpl _value, $Res Function(_$MainTabStateImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? main = null,
  }) {
    return _then(_$MainTabStateImpl(
      main: null == main
          ? _value.main
          : main // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc

class _$MainTabStateImpl implements _MainTabState {
  const _$MainTabStateImpl({this.main = 0});

  @override
  @JsonKey()
  final int main;

  @override
  String toString() {
    return 'MainTabState(main: $main)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$MainTabStateImpl &&
            (identical(other.main, main) || other.main == main));
  }

  @override
  int get hashCode => Object.hash(runtimeType, main);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$MainTabStateImplCopyWith<_$MainTabStateImpl> get copyWith =>
      __$$MainTabStateImplCopyWithImpl<_$MainTabStateImpl>(this, _$identity);
}

abstract class _MainTabState implements MainTabState {
  const factory _MainTabState({final int main}) = _$MainTabStateImpl;

  @override
  int get main;
  @override
  @JsonKey(ignore: true)
  _$$MainTabStateImplCopyWith<_$MainTabStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
