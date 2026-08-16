import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part "auth_state.freezed.dart";

@freezed
sealed class AuthState with _$AuthState {
  const factory AuthState({
    @Default(Status.UNKNOWN) Status status,
    @Default(UnknownFailure()) Failure failure,
    @Default(true) bool unAuth,
    @Default(true) bool obsecure,
  }) = _AuthState;
}
