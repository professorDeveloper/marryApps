import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mary_ai_pos/features/view/auth/data/models/user/user_model.dart';

class OfflineCachedUser {
  final String brandId;
  final String password;
  final String accessToken;
  final String refreshToken;
  final Map<String, dynamic> userModelJson;

  const OfflineCachedUser({
    required this.brandId,
    required this.password,
    required this.accessToken,
    required this.refreshToken,
    required this.userModelJson,
  });

  Map<String, dynamic> toJson() => {
        'brandId': brandId,
        'password': password,
        'accessToken': accessToken,
        'refreshToken': refreshToken,
        'userModelJson': userModelJson,
      };

  factory OfflineCachedUser.fromJson(Map<String, dynamic> json) =>
      OfflineCachedUser(
        brandId: json['brandId'] as String? ?? '',
        password: json['password'] as String? ?? '',
        accessToken: json['accessToken'] as String? ?? '',
        refreshToken: json['refreshToken'] as String? ?? '',
        userModelJson: (json['userModelJson'] as Map?)
                ?.cast<String, dynamic>() ??
            {},
      );
}

/// Barcha online login qilgan userlarni lokal saqlaydigan cache.
/// Internet yo'qligida shu cache orqali login imkonini beradi.
class OfflineAuthCache {
  static const _key = 'offline_users_v1';

  /// Pincode → user mapping: har bir ofitsiant pincodi bo'yicha alohida saqlanadi.
  /// Key: "${brandId}_${pincode}"
  static const _pinKey = 'offline_pin_users_v1';

  final SharedPreferences _prefs;

  const OfflineAuthCache(this._prefs);

  Map<String, OfflineCachedUser> _readAll() {
    try {
      final raw = _prefs.getString(_key);
      if (raw == null) return {};
      final map = jsonDecode(raw) as Map<String, dynamic>;
      return map.map(
        (k, v) => MapEntry(
          k,
          OfflineCachedUser.fromJson(v as Map<String, dynamic>),
        ),
      );
    } catch (_) {
      return {};
    }
  }

  Future<void> _writeAll(Map<String, OfflineCachedUser> map) async {
    await _prefs.setString(
      _key,
      jsonEncode(map.map((k, v) => MapEntry(k, v.toJson()))),
    );
  }

  /// Online login muvaffaqiyatli bo'lgandan keyin chaqiriladi.
  Future<void> saveUser({
    required String brandId,
    required String password,
    required UserModel user,
    required String accessToken,
    required String refreshToken,
  }) async {
    if (brandId.isEmpty) return;
    final all = _readAll();
    all[brandId] = OfflineCachedUser(
      brandId: brandId,
      password: password,
      accessToken: accessToken,
      refreshToken: refreshToken,
      userModelJson: user.toJson(),
    );
    await _writeAll(all);
  }

  /// Offline login: brandId + password mos kelsa cached userni qaytaradi.
  OfflineCachedUser? validateAndGetUser(String brandId, String password) {
    if (brandId.isEmpty || password.isEmpty) return null;
    final cached = _readAll()[brandId];
    if (cached == null) return null;
    if (cached.password != password) return null;
    return cached;
  }

  /// UserBloc fallback: faqat brandId bilan (parol tekshirmasdan).
  OfflineCachedUser? getCachedUser(String brandId) {
    if (brandId.isEmpty) return null;
    return _readAll()[brandId];
  }

  // ── Per-pincode cache ─────────────────────────────────────────────────────

  Map<String, OfflineCachedUser> _readPins() {
    try {
      final raw = _prefs.getString(_pinKey);
      if (raw == null) return {};
      final map = jsonDecode(raw) as Map<String, dynamic>;
      return map.map(
        (k, v) => MapEntry(k, OfflineCachedUser.fromJson(v as Map<String, dynamic>)),
      );
    } catch (_) {
      return {};
    }
  }

  Future<void> _writePins(Map<String, OfflineCachedUser> map) async {
    await _prefs.setString(
      _pinKey,
      jsonEncode(map.map((k, v) => MapEntry(k, v.toJson()))),
    );
  }

  /// Har bir ofitsiantning pincodi bilan loginini saqlab qo'yadi.
  Future<void> saveForPin({
    required String brandId,
    required String pincode,
    required UserModel user,
    required String accessToken,
    required String refreshToken,
  }) async {
    if (brandId.isEmpty || pincode.isEmpty) return;
    final all = _readPins();
    all['${brandId}_$pincode'] = OfflineCachedUser(
      brandId: brandId,
      password: pincode,
      accessToken: accessToken,
      refreshToken: refreshToken,
      userModelJson: user.toJson(),
    );
    await _writePins(all);
  }

  /// Offline PIN login: pincode mos kelsa cached user qaytaradi.
  OfflineCachedUser? getForPin(String brandId, String pincode) {
    if (brandId.isEmpty || pincode.isEmpty) return null;
    return _readPins()['${brandId}_$pincode'];
  }
}
