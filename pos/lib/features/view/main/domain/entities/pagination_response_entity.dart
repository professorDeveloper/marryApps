abstract class PaginationResponseEntity {
  final int offset;
  final int limit;
  final int total;

  PaginationResponseEntity({
    required this.offset,
    required this.limit,
    required this.total,
  });
}
