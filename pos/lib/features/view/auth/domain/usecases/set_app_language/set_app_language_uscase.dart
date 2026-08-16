import 'package:dartz/dartz.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/auth/domain/repository/auth_repository.dart';

part 'set_app_language_uscase.freezed.dart';
part 'set_app_language_uscase.g.dart';

class SetAppLanguageUscase extends UseCase<String, SetAppLanguageParams> {
  final AuthRepository _repo;

  SetAppLanguageUscase(this._repo);

  @override
  Future<Either<Failure, String>> call(SetAppLanguageParams params) =>
      _repo.setAppLang(params.lang);
}

@freezed
class SetAppLanguageParams with _$SetAppLanguageParams {
  const factory SetAppLanguageParams({required String lang}) =
      _SetAppLanguageParams;

  factory SetAppLanguageParams.fromJson(Map<String, dynamic> json) =>
      _$SetAppLanguageParamsFromJson(json);
}
