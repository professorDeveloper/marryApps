abstract class PaginationRequestEntity {
  final int limit;
  final int offset;

  PaginationRequestEntity({required this.limit, required this.offset});

  Map<String, dynamic> request();
}
