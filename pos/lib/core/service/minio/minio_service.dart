import 'package:mary_ai_pos/core/api/api.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:flutter/foundation.dart';

class MinioService {
  MinioService._();

  static final MinioService _instance = MinioService._();

  static MinioService get instance => _instance;

  final DioClient _client = inject<DioClient>();

  /// Tashqi URL'larni to'g'ridan-to'g'ri yuklash uchun alohida Dio.
  /// `_client` interceptor'lari (Authorization, baseUrl, validateStatus va h.k.)
  /// tashqi hostlarga mos kelmaydi.
  final Dio _externalHttp = Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
      responseType: ResponseType.bytes,
      followRedirects: true,
      validateStatus: (s) => s != null && s >= 200 && s < 400,
    ),
  );

  /// Bir xil `object_name` uchun bitta Future (FutureBuilder qayta-qayta yangi Future yaratganda ham
  /// tarmoqdan qayta yuklamaslik) + muvaffaqiyatli javobni xotirada ushlab turish.
  final Map<String, Future<Uint8List?>> _imageFutureByObjectName = {};

  /// `FutureBuilder` har `build`da yangi `Future` bersa ham xuddi shu instance qaytadi — qayta so‘rov yo‘q.
  Future<Uint8List?> getImageByObjectName(String objectName) {
    final key = objectName.trim();
    if (key.isEmpty) return SynchronousFuture(null);
    return _imageFutureByObjectName.putIfAbsent(
      key,
      () => _fetchImageBytesOnce(key),
    );
  }

  /// `object_name` to'liq HTTP URL bo'lsa — bu Minio kaliti emas. Backendning
  /// `/media/image/download` proxy'si tashqi hostni yuklab bera olmaydi
  /// (500 download_failed bilan tushadi), shuning uchun rasmni to'g'ridan-to'g'ri
  /// olib kelamiz.
  bool _isExternalUrl(String key) {
    final low = key.toLowerCase();
    return low.startsWith('http://') || low.startsWith('https://');
  }

  Future<Uint8List?> _fetchImageBytesOnce(String key) async {
    try {
      final Response response = _isExternalUrl(key)
          ? await _externalHttp.get<List<int>>(key)
          : await _client.post(
              ListAPI.mediaImage,
              data: {"object_name": key},
              options: Options(responseType: ResponseType.bytes),
            );

      final raw = response.data;
      Uint8List? bytes;
      if (raw is Uint8List && raw.isNotEmpty) {
        bytes = raw;
      } else if (raw is List<int> && raw.isNotEmpty) {
        bytes = Uint8List.fromList(raw);
      }
      if (bytes == null) {
        _imageFutureByObjectName.remove(key);
      }
      return bytes;
    } catch (_) {
      _imageFutureByObjectName.remove(key);
      return null;
    }
  }

  Future<Uint8List?> getAudioByObjectName(String objectName) async {
    try {
      final Response response = await _client.post(
        ListAPI.mediaAudio,
        data: {"object_name": objectName},
        options: Options(responseType: ResponseType.bytes),
      );

      return response.data;
    } catch (_) {
      return null;
    }
  }

  Future<Uint8List?> getBookByObjectName(String objectName) async {
    try {
      final Response response = await _client.post(
        ListAPI.mediaBook,
        data: {"object_name": objectName},
        options: Options(responseType: ResponseType.bytes),
      );

      return response.data;
    } catch (_) {
      return null;
    }
  }

  Future<Uint8List?> getVideoByObjectName(String objectName) async {
    try {
      final Response response = await _client.post(
        ListAPI.mediaVideo,
        data: {"object_name": objectName},
        options: Options(responseType: ResponseType.bytes),
      );

      return response.data;
    } catch (_) {
      return null;
    }
  }

  Future<String?> postImage(File imageFile) async {
    try {
      final FormData formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          imageFile.path,
          filename: imageFile.path.split('/').last,
        ),
      });

      final Response response = await _client.post(
        ListAPI.mediaImagePost,
        data: formData,
      );

      return _parsePostImageResponse(response);
    } catch (e) {
      return null;
    }
  }

  /// Rasm yo‘li bo‘lmaganda (masalan, ayrim web/brauzer stsenariylari).
  Future<String?> postImageBytes(Uint8List bytes, {required String filename}) async {
    try {
      final FormData formData = FormData.fromMap({
        'file': MultipartFile.fromBytes(bytes, filename: filename),
      });

      final Response response = await _client.post(
        ListAPI.mediaImagePost,
        data: formData,
      );

      return _parsePostImageResponse(response);
    } catch (e) {
      return null;
    }
  }

  String? _parsePostImageResponse(Response response) {
    final data = response.data['data'];
    if (data is Map<String, dynamic>) {
      return (data['url'] ??
              data['picture_url'] ??
              data['object_name'])
          ?.toString();
    }
    return response.data['data']?['object_name']?.toString();
  }
}
