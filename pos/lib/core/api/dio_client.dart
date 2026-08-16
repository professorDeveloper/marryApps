import 'dart:collection';

import 'package:alice_dio/alice_dio_adapter.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:mary_ai_pos/core/auth/storage/token_storage_impl.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/api/dio_interceptor.dart';
import 'package:mary_ai_pos/core/services/connectivity/connectivity_cubit.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';

class DioClient {
  final AppTokenStorage _tokenStorage;
  final ConnectivityCubit _connectivity;
  late final Dio _dio;
  final aliceDioAdapter = AliceDioAdapter();

  // Bir xil GET so'rov hali tugamagan bo'lsa — uni qayta yubormaymiz,
  // mavjud Future ga ulanamiz. Bu widget rebuild va duplicate trigger'lar
  // tufayli serverga ketadigan takroriy so'rovlarni bloklaydi.
  final Map<String, Future<Response<dynamic>>> _inflightGets = {};

  String _inflightKey(String url, Map<String, dynamic>? query) {
    if (query == null || query.isEmpty) return url;
    final sorted = SplayTreeMap<String, dynamic>.from(query);
    final qs = sorted.entries.map((e) => '${e.key}=${e.value}').join('&');
    return '$url?$qs';
  }

  DioClient(this._tokenStorage, this._connectivity) {
    _dio = Dio(
      BaseOptions(
        baseUrl: BASE_URL,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        validateStatus: (status) => status != null && status < 400,
      ),
    );

    _dio.interceptors.add(_OfflineInterceptor(_connectivity));
    _dio.interceptors.add(MySmartDioInterceptor(_dio, _tokenStorage));
    _dio.interceptors.add(aliceDioAdapter);

    _dio.interceptors.add(
      PrettyDioLogger(
        requestHeader: true,
        requestBody: true,
        responseBody: true,
        enabled: kDebugMode,
        filter: (options, args) {
          if (args.hasUint8ListData) return false;
          if (args.data is FormData) return false;
          return true;
        },
      ),
    );
  }

  Dio get dio => _dio;
  bool get isOnline => _connectivity.isOnline;

  // ==== HTTP Methods ====

  Future<Response<dynamic>> get(
    String url, {
    Map<String, dynamic>? queryParameters,
  }) async {
    final key = _inflightKey(url, queryParameters);
    final existing = _inflightGets[key];
    if (existing != null) {
      // Xuddi shunday so'rov uchib ketayotgan bo'lsa — o'sha Future ga ulanamiz
      return existing;
    }

    // DIQQAT: whenComplete callback'i VOID qaytarishi kerak. Arrow form
    // `() => _inflightGets.remove(key)` olib tashlangan Future ni qaytaradi
    // (o'zi wrappedFuture bo'ladi) — bu self-referential deadlock keltirib
    // chiqaradi. Block form ishlating.
    final future = _dio.get(url, queryParameters: queryParameters).whenComplete(() {
      _inflightGets.remove(key);
    });
    _inflightGets[key] = future;

    try {
      final response = await future;
      if (response.statusCode != 200) {
        throw DioException(
          requestOptions: response.requestOptions,
          response: response,
        );
      }
      return response;
    } on DioException {
      rethrow;
    }
  }

  Future<Response<dynamic>> post(
    String url, {
    dynamic data,
    Map<String, dynamic>? headers,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.post(
        url,
        data: data,
        queryParameters: queryParameters,
        options: options ?? Options(headers: headers),
      );
      if (response.statusCode == 200 ||
          response.statusCode == 201 ||
          response.statusCode == 203) {
        return response;
      } else {
        throw DioException(
          requestOptions: response.requestOptions,
          response: response,
        );
      }
    } on DioException {
      rethrow;
    }
  }

  Future<Response<dynamic>> put(
    String url, {
    dynamic data,
    Map<String, dynamic>? headers,
  }) async {
    try {
      final response = await _dio.put(
        url,
        data: data,
        options: Options(headers: headers),
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        return response;
      } else {
        throw DioException(
          requestOptions: response.requestOptions,
          response: response,
        );
      }
    } on DioException {
      rethrow;
    }
  }

  Future<Response<dynamic>> patch(
    String url, {
    dynamic data,
    Map<String, dynamic>? headers,
  }) async {
    try {
      final response = await _dio.patch(
        url,
        data: data,
        options: Options(headers: headers),
      );
      if (response.statusCode == 200) {
        return response;
      } else {
        throw DioException(
          requestOptions: response.requestOptions,
          response: response,
        );
      }
    } on DioException {
      rethrow;
    }
  }

  Future<dynamic> delete(
    String url, {
    dynamic data,
    Map<String, dynamic>? headers,
  }) async {
    try {
      final response = await _dio.delete(
        url,
        data: data,
        options: Options(headers: headers),
      );
      if (response.statusCode == 204) {
        return true;
      }
      return response.data;
    } on DioException {
      rethrow;
    }
  }
}

class _OfflineInterceptor extends Interceptor {
  final ConnectivityCubit _connectivity;
  _OfflineInterceptor(this._connectivity);

  static const _readMethods = {'GET', 'HEAD'};

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (!_connectivity.isOnline &&
        !_readMethods.contains(options.method.toUpperCase())) {
      handler.reject(
        DioException(
          requestOptions: options,
          type: DioExceptionType.connectionError,
          message: 'offline',
        ),
        true,
      );
      return;
    }
    handler.next(options);
  }
}
