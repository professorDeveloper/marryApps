import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/core/api/api.dart';
import 'package:mary_ai_pos/core/components/flush_bars.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/auth/domain/usecases/get_app_language/get_app_langauage_usecase.dart';
import 'package:mary_ai_pos/features/view/auth/domain/usecases/set_app_language/set_app_language_uscase.dart';

part 'settings_cubit.freezed.dart';
part 'settings_state.dart';

class SettingsCubit extends Cubit<SettingsState> {
  final SetAppLanguageUscase _setAppLanguageUscase;
  final GetAppLangauageUsecase _getAppLangUseCase;
  SettingsCubit(this._setAppLanguageUscase, this._getAppLangUseCase)
    : super(const SettingsState());

  FutureOr<void> saveAppLang(
    BuildContext context, {
    required String languageCode,
    int? loadingIndex,
  }) async {
    emit(state.copyWith(status: Status.LOADING));
    var result = await _setAppLanguageUscase.call(
      SetAppLanguageParams(lang: languageCode),
    );

    result.fold((failure) {
      showErrorMessage(context, failure.getLocalizedMessage(context));
      emit(state.copyWith(failure: failure));
    }, (lang) => emit(state.copyWith(language: lang, status: Status.UNKNOWN)));
    return null;
  }

  void loadAppLang() async {
    emit(state.copyWith(status: Status.LOADING));
    var result = await _getAppLangUseCase.call(NoParams());
    result.fold(
      (failure) => emit(state.copyWith(failure: failure, status: Status.ERROR)),
      (lang) => emit(state.copyWith(language: lang, status: Status.UNKNOWN)),
    );
  }
}
