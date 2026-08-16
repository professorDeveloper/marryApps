part of 'settings_cubit.dart';

@freezed
class SettingsState with _$SettingsState {
  const factory SettingsState({
    @Default(Status.UNKNOWN) Status status,
    @Default(UnknownFailure()) Failure failure,
    @Default('ru') String language,
    @Default(false) bool hasDark,
    @Default(AppThemeMode.system) AppThemeMode themeMode,
  }) = _SettingsState;
}

enum AppThemeMode { light, dark, system }
