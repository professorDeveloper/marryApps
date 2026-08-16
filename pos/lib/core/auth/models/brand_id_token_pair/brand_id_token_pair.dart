import 'package:freezed_annotation/freezed_annotation.dart';

part 'brand_id_token_pair.freezed.dart';
part 'brand_id_token_pair.g.dart';

@freezed
sealed class BrandIdTokenPair with _$BrandIdTokenPair {
  const factory BrandIdTokenPair({
    required String brandId,
    required String password,
  }) = _BrandIdTokenPair;
  factory BrandIdTokenPair.fromJson(Map<String, dynamic> json) =>
      _$BrandIdTokenPairFromJson(json);
}
