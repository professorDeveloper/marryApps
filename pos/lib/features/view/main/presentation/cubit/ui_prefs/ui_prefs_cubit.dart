import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';

class UiPrefsState {
  final ThemeMode themeMode;
  final bool menuShowImages;

  const UiPrefsState({
    this.themeMode = ThemeMode.light,
    this.menuShowImages = true,
  });

  UiPrefsState copyWith({ThemeMode? themeMode, bool? menuShowImages}) =>
      UiPrefsState(
        themeMode: themeMode ?? this.themeMode,
        menuShowImages: menuShowImages ?? this.menuShowImages,
      );
}

class UiPrefsCubit extends Cubit<UiPrefsState> {
  static const _kThemeMode = 'app_theme_mode';
  static const _kMenuShowImages = 'menu_show_images';

  final SharedPreferences _prefs;

  UiPrefsCubit(this._prefs) : super(const UiPrefsState()) {
    _load();
  }

  void _load() {
    final themeRaw = _prefs.getString(_kThemeMode);
    final mode = switch (themeRaw) {
      'dark' => ThemeMode.dark,
      'light' => ThemeMode.light,
      _ => ThemeMode.light,
    };
    final showImages = _prefs.getBool(_kMenuShowImages) ?? true;
    emit(state.copyWith(themeMode: mode, menuShowImages: showImages));
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    await _prefs.setString(
      _kThemeMode,
      mode == ThemeMode.dark ? 'dark' : 'light',
    );
    emit(state.copyWith(themeMode: mode));
  }

  Future<void> setMenuShowImages(bool value) async {
    await _prefs.setBool(_kMenuShowImages, value);
    emit(state.copyWith(menuShowImages: value));
  }
}
