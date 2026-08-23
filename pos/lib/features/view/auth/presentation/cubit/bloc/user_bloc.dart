import 'package:bloc/bloc.dart';
import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/core/api/api.dart';
import 'package:mary_ai_pos/core/auth/storage/token_storage_impl.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/core/services/auth/offline_auth_cache.dart';
import 'package:mary_ai_pos/core/services/connectivity/connectivity_cubit.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/core/utils/helper/helper_widget.dart';
import 'package:mary_ai_pos/di.dart' show inject;
import 'package:mary_ai_pos/features/view/auth/data/models/user/user_model.dart';
import 'package:mary_ai_pos/features/view/auth/domain/usecases/user/get_user_usecase.dart';
import 'package:mary_ai_pos/features/view/main/domain/usecase/sync_printer_settings_usecase.dart';
part 'user_event.dart';
part 'user_state.dart';
part 'user_bloc.freezed.dart';

class UserBloc extends Bloc<UserEvent, UserState> {
  late final GetUserUsecase _getUserUsecase;
  late final SyncPrinterSettingsUsecase _syncPrinterSettingsUsecase;

  UserBloc({
    required GetUserUsecase getUserUsecase,
    required SyncPrinterSettingsUsecase syncPrinterSettingsUsecase,
  }) : _getUserUsecase = getUserUsecase,
       _syncPrinterSettingsUsecase = syncPrinterSettingsUsecase,
       super(const UserState()) {
    on<_Started>(_started);
    on<_GetUser>(_getUser);
  }

  void _getUser(_GetUser event, emit) async {
    emit(state.copyWith(status: Status.LOADING));

    // Internet yo'q — API ga murojaat qilmasdan darhol cachega o'tamiz
    if (!inject<ConnectivityCubit>().isOnline) {
      await _tryOfflineUser(emit);
      return;
    }

    final response = await _getUserUsecase.call(NoParams());
    response.fold(
      (l) async {
        if (l.isOffline) {
          await _tryOfflineUser(emit);
          return;
        }
        // Token invalid or expired — force back to login
        Navigator.pushNamedAndRemoveUntil(
          navigatorKey.currentContext!,
          AppRoutes.loginScreen,
          (route) => false,
        );
        emit(state.copyWith(status: Status.ERROR, failure: l));
      },
      (r) async {
        // Navigation already happened in splash screen — just emit user data
        emit(state.copyWith(status: Status.SUCCESS, userMOdel: r));
        // Offline cache'ni yangilash — keyingi offline loginlar uchun
        unawaited(_updateOfflineCache(r));
        unawaited(
          _syncPrinterSettingsUsecase.call(NoParams()).then((sync) {
            sync.fold(
              (f) {
                if (kDebugMode) {
                  debugPrint('[UserBloc] Printer settings sync: $f');
                }
              },
              (_) {},
            );
          }),
        );
      },
    );
  }

  Future<void> _updateOfflineCache(UserModel user) async {
    try {
      final storage = inject<AppTokenStorage>();
      final brandPair = await storage.readBrandIdToken();
      final tokenPair = await storage.readAuthToken();
      if (brandPair == null || tokenPair == null) return;
      final cache = inject<OfflineAuthCache>();

      // Brand-darajali cache (mavjud)
      await cache.saveUser(
        brandId: brandPair.brandId,
        password: brandPair.password,
        user: user,
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
      );

      // Pincode-darajali cache — har bir ofitsiant uchun alohida
      final pincode = await storage.readLastPincode();
      if (pincode != null && pincode.isNotEmpty) {
        await cache.saveForPin(
          brandId: brandPair.brandId,
          pincode: pincode,
          user: user,
          accessToken: tokenPair.accessToken,
          refreshToken: tokenPair.refreshToken,
        );
      }
    } catch (_) {}
  }

  Future<void> _tryOfflineUser(Emitter<UserState> emit) async {
    try {
      final storage = inject<AppTokenStorage>();
      final brandPair = await storage.readBrandIdToken();
      if (brandPair == null) {
        _goToLogin();
        return;
      }

      final offlineCache = inject<OfflineAuthCache>();

      // 1. Brand-darajali cache
      final cached = offlineCache.getCachedUser(brandPair.brandId);
      if (cached != null) {
        emit(state.copyWith(
          status: Status.SUCCESS,
          userMOdel: UserModel.fromJson(cached.userModelJson),
        ));
        return;
      }

      // 2. Per-pin cache — so'nggi pincode bilan
      final pincode = await storage.readLastPincode();
      if (pincode != null && pincode.isNotEmpty) {
        final pinCached = offlineCache.getForPin(brandPair.brandId, pincode);
        if (pinCached != null) {
          emit(state.copyWith(
            status: Status.SUCCESS,
            userMOdel: UserModel.fromJson(pinCached.userModelJson),
          ));
          return;
        }
      }

      _goToLogin();
    } catch (_) {
      _goToLogin();
    }
  }

  void _goToLogin() {
    Navigator.pushNamedAndRemoveUntil(
      navigatorKey.currentContext!,
      AppRoutes.loginScreen,
      (route) => false,
    );
  }

  void _started(_Started event, emit) => emit(const UserState());
}
