import 'package:dio/dio.dart';
import 'package:mary_ai_pos/core/components/flush_bars.dart';
import 'package:mary_ai_pos/core/utils/helper/helper_widget.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

/// Dio xatoliklaridagi `message` / `detail` ni premium toast orqali ko'rsatish.
/// `flush_bars.dart` ichidagi yagona toast controller orqali ketadi —
/// boshqa joylardagi xatolar bilan bir xil dizayn, ekranda bittadan ortiq
/// toast bo'lib ketishining oldini oladi.
void showApiErrorOverlayIfPossible(String message) {
  final trimmed = message.trim();
  if (trimmed.isEmpty) return;
  final ctx = navigatorKey.currentContext;
  if (ctx == null) return;
  // API xatolarini 6s ko'rsatamiz — default 4s dan uzunroq, foydalanuvchi o'qib ulgursin.
  showErrorMessage(ctx, trimmed, duration: 6);
}

String messageFromDioErrorData(Object? data) {
  if (data is Map) {
    final m = data['message'] ?? data['detail'] ?? data['error'];
    if (m != null) return m.toString().trim();
  }
  if (data is String && data.trim().isNotEmpty) return data.trim();
  return '';
}

/// Dio xatosi yoki server javobidan foydalanuvchiga ko'rsatish uchun
/// 3 tilda tarjimalangan, qisqa xabar qaytaradi.
/// `DioException.message` ichidagi verbose stack-trace o'rniga toza matn.
String userFriendlyDioError(DioException e) {
  final raw = messageFromDioErrorData(e.response?.data);
  if (raw.isNotEmpty && !_looksLikeDioInternal(raw)) return raw;

  final code = e.response?.statusCode;
  switch (code) {
    case 500:
      return S.current.strServerUnreachable500;
    case 502:
      return S.current.strServerUnreachable502;
    case 503:
      return S.current.strServerUnreachable503;
    case 504:
      return S.current.strServerUnreachable504;
  }
  switch (e.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
      return S.current.strFailureMessage_timeout;
    case DioExceptionType.connectionError:
      return S.current.strFailureMessage_connection;
    case DioExceptionType.badResponse:
      return S.current.strServerUnreachableGeneric;
    case DioExceptionType.cancel:
      return S.current.strServerUnreachableGeneric;
    case DioExceptionType.badCertificate:
    case DioExceptionType.unknown:
      return S.current.strServerUnreachableGeneric;
  }
}

bool _looksLikeDioInternal(String s) {
  final low = s.toLowerCase();
  return low.contains('this exception was thrown because') ||
      low.contains('validatestatus was configured to throw') ||
      low.contains('dioexception');
}
