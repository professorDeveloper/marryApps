import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/pagination_response_entity.dart';

part 'pagination_response_model.freezed.dart';
part 'pagination_response_model.g.dart';

@freezed
class PaginationResponseModel
    with _$PaginationResponseModel
    implements PaginationResponseEntity {
  const PaginationResponseModel._();

  const factory PaginationResponseModel({
    @Default(0) int offset,
    @Default(0) int limit,
    @Default(0) int total,
  }) = _PaginationResponseModel;

  factory PaginationResponseModel.fromJson(Map<String, dynamic> json) =>
      _$PaginationResponseModelFromJson(json);
}

class PaginationResponseEntityConverter
    implements JsonConverter<PaginationResponseEntity, Map<String, dynamic>> {
  const PaginationResponseEntityConverter();

  @override
  PaginationResponseEntity fromJson(Map<String, dynamic> json) {
    return PaginationResponseModel.fromJson(json);
  }

  @override
  Map<String, dynamic> toJson(PaginationResponseEntity object) {
    if (object is PaginationResponseModel) return object.toJson();
    return {
      'offset': object.offset,
      'limit': object.limit,
      'total': object.total,
    };
  }
}
