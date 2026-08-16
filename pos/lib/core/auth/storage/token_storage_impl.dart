import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mary_ai_pos/core/auth/models/auth_token_pair/auth_token_pair.dart';
import 'package:mary_ai_pos/core/auth/models/brand_id_token_pair/brand_id_token_pair.dart';

/// Keys for secure storage
enum TokensStorageKeys {
  /// Key for storing authentication tokens
  authToken('app_auth_token'),

  /// Key for app language preference
  appLanguage('app_language'),

  /// Key for brand ID tokens (brand_id + pos_password)
  brandId('app_brand_id_token'),

  /// Key for POS is initialized flag
  posIsInitialized('pos_is_initialized'),

  /// Key for cached user data
  posUser('pos_user'),

  /// Last successfully used pincode (for offline PIN login)
  lastPincode('pos_last_pincode');

  /// Key name
  final String keyName;

  const TokensStorageKeys(this.keyName);
}

/// Implementation of token storage for securely storing authentication tokens
class AppTokenStorage {
  final SharedPreferences _prefs;

  /// Creates a new TokenStorageImpl with the given secure storage
  const AppTokenStorage(this._prefs);

  /// Read auth token pair from secure storage
  Future<BrandIdTokenPair?> readBrandIdToken() async {
    try {
      final tokenJson = _prefs.getString(TokensStorageKeys.brandId.keyName);
      if (tokenJson == null) return null;
      return BrandIdTokenPair.fromJson(
        jsonDecode(tokenJson) as Map<String, dynamic>,
      );
    } catch (e) {
      return null;
    }
  }

  /// Write auth token pair to secure storage
  Future<void> writeBrandIdToken(BrandIdTokenPair token) async {
    await _prefs.setString(
      TokensStorageKeys.brandId.keyName,
      jsonEncode(token.toJson()),
    );
  }

  /// Read auth token pair from secure storage
  Future<AuthTokenPair?> readAuthToken() async {
    try {
      final tokenJson = _prefs.getString(TokensStorageKeys.authToken.keyName);
      if (tokenJson == null) return null;
      return AuthTokenPair.fromJson(
        jsonDecode(tokenJson) as Map<String, dynamic>,
      );
    } catch (e) {
      return null;
    }
  }

  /// Write auth token pair to secure storage
  Future<void> writeAuthToken(AuthTokenPair token) async {
    await _prefs.setString(
      TokensStorageKeys.authToken.keyName,
      jsonEncode(token.toJson()),
    );
  }

  /// Read access token from secure storage
  Future<String?> readAccessToken() async {
    try {
      final tokenPair = await readAuthToken();
      return tokenPair?.accessToken;
    } catch (e) {
      return null;
    }
  }

  /// Read refresh token from secure storage
  Future<String?> readRefreshToken() async {
    try {
      final tokenPair = await readAuthToken();
      return tokenPair?.refreshToken;
    } catch (e) {
      return null;
    }
  }

  /// Write access token to secure storage
  Future<void> writeAccessToken(String accessToken) async {
    try {
      final existingPair = await readAuthToken();
      final newPair = AuthTokenPair(
        accessToken: accessToken,
        refreshToken: existingPair?.refreshToken ?? '',
      );
      await writeAuthToken(newPair);
    } catch (e) {
      // Fallback: just write the access token
      await writeAuthToken(
        AuthTokenPair(accessToken: accessToken, refreshToken: ''),
      );
    }
  }

  /// Write refresh token to secure storage
  Future<void> writeRefreshToken(String refreshToken) async {
    try {
      final existingPair = await readAuthToken();
      final newPair = AuthTokenPair(
        accessToken: existingPair?.accessToken ?? '',
        refreshToken: refreshToken,
      );
      await writeAuthToken(newPair);
    } catch (e) {
      // Fallback: just write the refresh token
      await writeAuthToken(
        AuthTokenPair(accessToken: '', refreshToken: refreshToken),
      );
    }
  }

  /// Delete auth tokens from secure storage
  Future<void> deleteAuthToken() async {
    await _prefs.remove(TokensStorageKeys.authToken.keyName);
  }

  /// Delete only user session (keep POS setup: brand_id, pos_password, pos_is_initialized)
  Future<void> deleteUserSession() async {
    await _prefs.remove(TokensStorageKeys.authToken.keyName);
    await _prefs.remove(TokensStorageKeys.posUser.keyName);
  }

  /// Mark POS as initialized
  Future<void> setPosInitialized(bool value) async {
    await _prefs.setBool(TokensStorageKeys.posIsInitialized.keyName, value);
  }

  /// Check if POS is initialized
  bool get isPosInitialized =>
      _prefs.getBool(TokensStorageKeys.posIsInitialized.keyName) ?? false;

  /// Read string value from secure storage
  Future<String?> readString(TokensStorageKeys key) async {
    try {
      return _prefs.getString(key.keyName);
    } catch (e) {
      return null;
    }
  }

  /// Write string value to secure storage
  Future<void> writeString(TokensStorageKeys key, String value) async {
    await _prefs.setString(key.keyName, value);
  }

  /// Delete value from secure storage
  Future<void> delete(TokensStorageKeys key) async {
    await _prefs.remove(key.keyName);
  }

  Future<void> writeLastPincode(String pincode) async =>
      _prefs.setString(TokensStorageKeys.lastPincode.keyName, pincode);

  Future<String?> readLastPincode() async =>
      _prefs.getString(TokensStorageKeys.lastPincode.keyName);

  /// Clear all stored data
  Future<void> deleteAll() async {
    await _prefs.clear();
  }
}
