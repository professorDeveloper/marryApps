import 'package:freezed_annotation/freezed_annotation.dart';

part 'auth_token_pair.freezed.dart';
part 'auth_token_pair.g.dart';

@freezed
sealed class AuthTokenPair with _$AuthTokenPair {
  const factory AuthTokenPair({
    required String accessToken,
    required String refreshToken,
  }) = _AuthTokenPair;
  factory AuthTokenPair.fromJson(Map<String, dynamic> json) =>
      _$AuthTokenPairFromJson(json);
}
