import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/api/api.dart';
import 'package:mary_ai_pos/core/auth/models/auth_token_pair/auth_token_pair.dart';
import 'package:mary_ai_pos/core/auth/models/brand_id_token_pair/brand_id_token_pair.dart';
import 'package:mary_ai_pos/core/auth/storage/token_storage_impl.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/services/auth/offline_auth_cache.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/auth/domain/usecases/check_user_auth/check_user_auth.dart';
import 'package:mary_ai_pos/features/view/auth/domain/usecases/check_user_auth/check_user_data_usecase.dart';
import 'package:mary_ai_pos/features/view/auth/domain/usecases/login_with_brand/login_with_brand_usecase.dart';
import 'package:mary_ai_pos/features/view/auth/domain/usecases/logout/logout_from_app_usecase.dart';
import 'package:mary_ai_pos/features/view/auth/domain/usecases/logout/logout_usecase.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/auth/auth_state.dart';

class AuthCubit extends Cubit<AuthState> {
  AuthCubit(
    this._checkUserAuthUseCase,
    this._logoutUseCase,
    this._loginWithBrandUsecase,
    this._logoutUsecase,
    this._checkUserDataUsecase,
    this._offlineAuthCache,
    this._tokenStorage,
  ) : super(const AuthState());
  final CheckUserAuthUseCase _checkUserAuthUseCase;
  final LogoutFromAppUseCase _logoutUseCase;
  final LoginWithBrandUsecase _loginWithBrandUsecase;
  final LogoutUsecase _logoutUsecase;
  final CheckUserDataUsecase _checkUserDataUsecase;
  final OfflineAuthCache _offlineAuthCache;
  final AppTokenStorage _tokenStorage;

  Future<bool> chechUserData() async {
    return await _checkUserDataUsecase
        .call(NoParams())
        .then((value) => value.fold((l) => false, (r) => r));
  }

  Future<bool> checkUserToAuth() async {
    var result = await _checkUserAuthUseCase.call(NoParams());
    result.fold(
      (failure) => emit(state.copyWith(unAuth: true)),
      (response) => emit(state.copyWith(unAuth: response)),
    );

    return state.unAuth;
  }

  void logout({required VoidCallback onSuccess}) async {
    emit(state.copyWith(status: Status.LOADING));
    var response = await _logoutUsecase.call(NoParams());
    response.fold(
      (l) {
        l.showErrorMsg();
        emit(state.copyWith(failure: l, status: Status.ERROR));
      },
      (r) {
        emit(state.copyWith(status: Status.SUCCESS));
        onSuccess();
      },
    );
  }

  void loginWithBrandId({
    required BrandIdTokenPair req,
    required Function() onSuccess,
  }) async {
    emit(state.copyWith(status: Status.LOADING));

    var result = await _loginWithBrandUsecase.call(req);

    result.fold(
      (failure) async {
        if (failure.isOffline) {
          final cached = _offlineAuthCache.validateAndGetUser(
            req.brandId,
            req.password,
          );
          if (cached != null) {
            await _tokenStorage.writeAuthToken(
              AuthTokenPair(
                accessToken: cached.accessToken,
                refreshToken: cached.refreshToken,
              ),
            );
            await _tokenStorage.writeBrandIdToken(req);
            emit(state.copyWith(status: Status.SUCCESS));
            onSuccess();
            return;
          }
        }
        emit(state.copyWith(failure: failure, status: Status.ERROR));
      },
      (response) {
        emit(state.copyWith(status: Status.SUCCESS));
        onSuccess();
      },
    );
  }

  Future<void> logoutFromApp(Function() onSuccess) async {
    emit(state.copyWith(status: Status.LOADING));

    var result = await _logoutUseCase.call(NoParams());

    result.fold(
      (failure) {
        failure.showErrorMsg();
        emit(state.copyWith(failure: failure, status: Status.ERROR));
      },
      (response) {
        emit(state.copyWith(status: Status.SUCCESS));
        onSuccess();
      },
    );
  }

  void toggle() => emit(state.copyWith(obsecure: !state.obsecure));
}
