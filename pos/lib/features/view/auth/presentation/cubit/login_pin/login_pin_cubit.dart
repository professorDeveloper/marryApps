import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/core/api/api.dart';
import 'package:mary_ai_pos/core/auth/models/auth_token_pair/auth_token_pair.dart';
import 'package:mary_ai_pos/core/auth/models/brand_id_token_pair/brand_id_token_pair.dart';
import 'package:mary_ai_pos/core/auth/storage/token_storage_impl.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/core/services/auth/offline_auth_cache.dart';
import 'package:mary_ai_pos/core/services/connectivity/connectivity_cubit.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/core/utils/helper/helper_widget.dart';
import 'package:mary_ai_pos/features/view/auth/data/models/login/request/login_request_model.dart';
import 'package:mary_ai_pos/features/view/auth/domain/usecases/login/login_usecase.dart';
import 'package:mary_ai_pos/features/view/auth/domain/usecases/logout/logout_from_app_usecase.dart';

part 'login_pin_cubit.freezed.dart';
part 'login_pin_state.dart';

class LoginPinCubit extends Cubit<LoginPinState> {
  final LoginUsecase _loginUsecase;
  final LogoutFromAppUseCase _logoutUseCase;
  final AppTokenStorage _secureStorage;
  final OfflineAuthCache _offlineCache;
  final ConnectivityCubit _connectivity;

  LoginPinCubit(
    this._loginUsecase,
    this._logoutUseCase,
    this._secureStorage,
    this._offlineCache,
    this._connectivity,
  ) : super(const LoginPinState());

  void login({required String pincode, required Function() onSuccess}) async {
    emit(state.copyWith(status: Status.LOADING));

    final BrandIdTokenPair? brandIdTokenPair =
        await _secureStorage.readBrandIdToken();
    if (brandIdTokenPair == null) {
      emit(state.copyWith(status: Status.UNKNOWN));
      return;
    }

    // Offline-first: internet yo'q bo'lsa darhol cache dan
    if (!_connectivity.isOnline) {
      final cached = _offlineCache.getForPin(brandIdTokenPair.brandId, pincode);
      if (cached != null) {
        await _secureStorage.writeAuthToken(
          AuthTokenPair(
            accessToken: cached.accessToken,
            refreshToken: cached.refreshToken,
          ),
        );
        emit(state.copyWith(status: Status.SUCCESS));
        onSuccess();
      } else {
        emit(state.copyWith(
          failure: const ConnectionFailure(),
          status: Status.ERROR,
          pin: '',
        ));
      }
      return;
    }

    // Online: API ga murojaat
    final result = await _loginUsecase.call(
      LoginRequestModel(
        brandId: brandIdTokenPair.brandId,
        password: brandIdTokenPair.password,
        pincode: pincode,
      ),
    );

    result.fold(
      (failure) async {
        // API muvaffaqiyatsiz bo'lsa — offline cache dan urinib ko'r
        final cached = _offlineCache.getForPin(brandIdTokenPair.brandId, pincode);
        if (cached != null) {
          await _secureStorage.writeAuthToken(
            AuthTokenPair(
              accessToken: cached.accessToken,
              refreshToken: cached.refreshToken,
            ),
          );
          emit(state.copyWith(status: Status.SUCCESS));
          onSuccess();
        } else {
          emit(state.copyWith(failure: failure, status: Status.ERROR, pin: ''));
        }
      },
      (_) async {
        // Keyingi offline login uchun pincode ni saqla
        await _secureStorage.writeLastPincode(pincode);
        emit(state.copyWith(status: Status.SUCCESS));
        onSuccess();
      },
    );
  }

  void setPin(String value) {
    if (state.status == Status.LOADING) return;

    String pinUpdated = state.pin ?? '';
    final int maxLength = state.pinLength;

    if (value == '⌫') {
      if (pinUpdated.isNotEmpty) {
        pinUpdated = pinUpdated.substring(0, pinUpdated.length - 1);
      }
      emit(state.copyWith(pin: pinUpdated));
      return;
    }

    if (value == '✓') return;

    if (pinUpdated.length >= maxLength) return;

    pinUpdated += value;
    emit(state.copyWith(pin: pinUpdated));

    if (pinUpdated.length == maxLength) {
      final pincode = pinUpdated;
      login(
        pincode: pincode,
        onSuccess: () {
          Navigator.pushNamedAndRemoveUntil(
            navigatorKey.currentContext!,
            AppRoutes.splashScreen,
            (route) => false,
          );
        },
      );
    }
  }

  void togglePinLength() {
    if (state.status == Status.LOADING) return;
    final next = state.pinLength == 4 ? 6 : 4;
    emit(state.copyWith(pinLength: next, pin: ''));
  }

  void logoutFromApp(Function() onLogout) async {
    emit(state.copyWith(status: Status.LOADING));
    var result = await _logoutUseCase.call(NoParams());

    result.fold(
      (failure) {
        emit(state.copyWith(failure: failure, status: Status.ERROR));
      },
      (response) {
        onLogout();
        emit(state.copyWith(status: Status.SUCCESS));
      },
    );
  }
}
