import 'package:mary_ai_pos/core/api/api_error_overlay.dart';
import 'package:mary_ai_pos/core/auth/models/auth_token_pair/auth_token_pair.dart';
import 'package:mary_ai_pos/core/auth/storage/token_storage_impl.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/core/utils/helper/helper_widget.dart';
import 'package:mary_ai_pos/features/view/auth/data/models/login/response/login_response.dart';

import 'api.dart';

class MySmartDioInterceptor extends Interceptor {
  MySmartDioInterceptor(this._dio, this._tokenStorage);
  final Dio _dio;
  final AppTokenStorage _tokenStorage;

  //? to ensure refresh future calls once
  Future<void>? _refreshFuture;

  @override 
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final tokenPair = await _tokenStorage.readAuthToken();
    final lang = await _tokenStorage.readString(TokensStorageKeys.appLanguage);

    options.headers['Content-Type'] = 'application/json';
    options.headers['Accept'] = 'application/json';

    if (tokenPair != null && tokenPair.accessToken.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer ${tokenPair.accessToken}';
    }
    if (lang != null && lang.isNotEmpty) {
      options.headers['Language'] = lang;
    }

    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    debugPrint('⚠️ onError called: ${err.message}');
    debugPrint('⚠️ Response data: ${err.response?.data}');

    final statusCode = err.response?.statusCode;

    if (statusCode == 401) {
      final bool isRefreshCall = err.requestOptions.path.endsWith(
        ListAPI.refresh,
      );
      final String? authHeader = err.requestOptions.headers['Authorization']
          ?.toString();
      final bool hasAuthHeader =
          authHeader != null &&
          authHeader.isNotEmpty &&
          authHeader != 'Bearer ';

      // Do not force logout for unauthorized calls made without auth token.
      // Example: wrong pin on login-pincode endpoint.
      if (!hasAuthHeader && !isRefreshCall) {
        return handler.next(err);
      }

      if (isRefreshCall) {
        await _logoutAndRedirectToLogin();
        return handler.next(err);
      }

      try {
        await (_refreshFuture ??= _refreshAccessToken());

        final newTokenPair = await _tokenStorage.readAuthToken();
        if (newTokenPair != null && newTokenPair.accessToken.isNotEmpty) {
          err.requestOptions.headers['Authorization'] =
              'Bearer ${newTokenPair.accessToken}';
          final response = await _dio.fetch(err.requestOptions);
          return handler.resolve(response);
        }
      } catch (e) {
        debugPrint('Refresh failed: $e');
        await _logoutAndRedirectToLogin();
        return handler.next(err);
      } finally {
        _refreshFuture = null;
      }
    }

    // API javobidagi xabar — toast orqali ko'rsatamiz (401 refresh va token
    // yo'qligi bundan tashqari). Backend body'da xabar bo'lmasa ham status
    // kodi bo'yicha tushunarli fallback chiqaramiz — aks holda 500/502 kabi
    // xatoliklar foydalanuvchi uchun "jim" qoladi.
    final resp = err.response;
    final sc = resp?.statusCode;
    if (resp != null &&
        sc != null &&
        sc >= 400 &&
        sc != 401 &&
        !err.requestOptions.path.endsWith(ListAPI.refresh)) {
      var msg = messageFromDioErrorData(resp.data);
      if (msg.isEmpty) {
        msg = _fallbackMessageForStatus(sc);
      }
      showApiErrorOverlayIfPossible(msg);
    } else if (resp == null &&
        !err.requestOptions.path.endsWith(ListAPI.refresh)) {
      // Response yo'q — tarmoq/timeout xatolari. Oddiy fallback.
      final fallback = _fallbackMessageForDioType(err.type);
      if (fallback.isNotEmpty) {
        showApiErrorOverlayIfPossible(fallback);
      }
    }

    handler.next(err);
  }

  Future<void> _refreshAccessToken() async {
    final refreshToken = await _tokenStorage.readRefreshToken();

    if (refreshToken == null || refreshToken.isEmpty) {
      throw Exception('No refresh token available');
    }

    try {
      final response = await _dio.post(
        ListAPI.refresh,
        data: {'refreshToken': refreshToken},
        options: Options(headers: {'Content-Type': 'application/json'}),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final LoginResponse model = LoginResponse.fromJson(
          response.data['data'],
        );

        final tokenPair = AuthTokenPair(
          accessToken: model.accessToken,
          refreshToken: model.refreshToken,
        );

        await _tokenStorage.writeAuthToken(tokenPair);
        return;
      }
      throw Exception('Invalid refresh response');
    } on DioException catch (_) {
      rethrow;
    }
  }

  Future<void> _logoutAndRedirectToLogin() async {
    // Only clear auth session, keep POS setup (brand_id, pos_password)
    await _tokenStorage.deleteUserSession();

    Navigator.pushNamedAndRemoveUntil(
      // ignore: use_build_context_synchronously
      navigatorKey.currentState!.context,
      AppRoutes.loginPinScreen,
      (route) => false,
    );
  }

  /// Backend body bo'sh bo'lsa — status kodi bo'yicha tushunarli xabar.
  String _fallbackMessageForStatus(int sc) {
    if (sc == 500) return "Serverda ichki xatolik (500). Qayta urinib ko'ring.";
    if (sc == 502) return "Server bilan ulanishda muammo (502).";
    if (sc == 503) return "Xizmat vaqtincha mavjud emas (503).";
    if (sc == 504) return "Server javob bermayapti (504). Internetni tekshiring.";
    if (sc == 400) return "So'rov noto'g'ri (400).";
    if (sc == 403) return "Ruxsat yo'q (403).";
    if (sc == 404) return "Ma'lumot topilmadi (404).";
    if (sc == 409) return "Holat mos kelmaydi (409).";
    if (sc == 422) return "Kiritilgan ma'lumotlarda xato (422).";
    if (sc >= 500) return "Server xatosi ($sc).";
    return "Xatolik yuz berdi ($sc).";
  }

  /// Response bo'lmagan tarmoq xatolari uchun fallback (timeout, connection).
  String _fallbackMessageForDioType(DioExceptionType t) {
    switch (t) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return "Server javob bermayapti. Internetni tekshiring.";
      case DioExceptionType.connectionError:
        return "Server bilan ulanib bo'lmadi. Internetni tekshiring.";
      case DioExceptionType.badCertificate:
        return "Server sertifikati noto'g'ri.";
      case DioExceptionType.cancel:
      case DioExceptionType.badResponse:
      case DioExceptionType.unknown:
        return '';
    }
  }
}
