part of 'user_bloc.dart';

@freezed
class UserState with _$UserState {
  const factory UserState({
    @Default(Status.UNKNOWN) Status status,
    UserModel? userMOdel,
    Failure? failure,
  }) = _UserState;
}
