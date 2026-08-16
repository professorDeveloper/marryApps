import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/pagination_request_entity.dart';

part 'pagination_request_model.freezed.dart';
part 'pagination_request_model.g.dart';

@freezed
class PaginationRequestModel
    with _$PaginationRequestModel
    implements PaginationRequestEntity {
  const PaginationRequestModel._();

  const factory PaginationRequestModel({
    @Default(10) int limit,
    @Default(0) int offset,
  }) = _PaginationRequestModel;

  factory PaginationRequestModel.fromJson(Map<String, dynamic> json) =>
      _$PaginationRequestModelFromJson(json);

  factory PaginationRequestModel.calculate({
    required int items,
    required int limit,
  }) {
    final safeLimit = limit <= 0 ? 1 : limit;
    final calculatedOffset = items ~/ safeLimit;
    return PaginationRequestModel(limit: safeLimit, offset: calculatedOffset);
  }

  @override
  Map<String, dynamic> request() {
    return {'limit': limit, 'offset': offset};
  }
}

class PaginationRequestEntityConverter
    implements JsonConverter<PaginationRequestEntity?, Map<String, dynamic>?> {
  const PaginationRequestEntityConverter();

  @override
  PaginationRequestEntity? fromJson(Map<String, dynamic>? json) {
    if (json == null) return null;
    return PaginationRequestModel.fromJson(json);
  }

  @override
  Map<String, dynamic>? toJson(PaginationRequestEntity? object) {
    if (object == null) return null;
    return object is PaginationRequestModel
        ? object.toJson()
        : {'limit': object.limit, 'offset': object.offset};
  }
}
