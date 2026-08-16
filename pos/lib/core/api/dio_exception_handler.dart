import 'dart:io';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:dio/dio.dart';

Failure handleDioException(DioException error) {
  try {
    // ===== TIMEOUT =====
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return const TimeoutFailure();
    }

    // ===== NO INTERNET =====
    if (error.type == DioExceptionType.connectionError ||
        error.error is SocketException) {
      return const ConnectionFailure();
    }

    // ===== REQUEST CANCELLED =====
    if (error.type == DioExceptionType.cancel) {
      return const OtherFailure();
    }

    // ===== SERVER RESPONSE =====
    final response = error.response;
    if (response != null) {
      final data = response.data;
      // ===== Backend message =====
      if (data is Map<String, dynamic>) {
        if (data['error'] != null) {
          return MessageFailure(data['error'].toString());
        }
      }

      final statusCode = response.statusCode ?? 0;

      switch (statusCode) {
        case 400:
        case 422:
          return const ValidationFailure();

        case 401:
          return const UnauthorizedFailure();

        case 403:
          return const UnauthenticatedFailure();

        case 404:
          return const NotFoundFailure();

        case 408:
          return const TimeoutFailure();

        case 500:
        case 502:
        case 503:
        case 504:
          return const ServerFailure();
      }
    }

    // ===== UNKNOWN =====
    return const UnknownFailure();
  } catch (_) {
    return const UnknownFailure();
  }
}
