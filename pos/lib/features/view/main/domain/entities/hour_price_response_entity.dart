abstract class HourPriceResponseEntity {
  String tableId;
  double perHour;
  double totalPrice;

  HourPriceResponseEntity({
    required this.tableId,
    required this.perHour,
    required this.totalPrice,
  });
}
