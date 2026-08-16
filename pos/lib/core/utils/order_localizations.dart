import 'package:flutter/material.dart';

/// Localized label for an order status string coming from the API.
/// Supports uz (default) and ru. Unknown statuses are returned as-is.
String localizedOrderStatus(BuildContext context, String status) {
  final lang = Localizations.localeOf(context).languageCode;
  return _statusLabels[status.toLowerCase()]?[lang] ??
      _statusLabels[status.toLowerCase()]?['uz'] ??
      status;
}

/// Localized label for an order type string ("dine_in", "takeaway").
String localizedOrderType(BuildContext context, String orderType) {
  final lang = Localizations.localeOf(context).languageCode;
  return _orderTypeLabels[orderType.toLowerCase()]?[lang] ??
      _orderTypeLabels[orderType.toLowerCase()]?['uz'] ??
      orderType;
}

const Map<String, Map<String, String>> _statusLabels = {
  'open': {'uz': 'Ochiq', 'ru': 'Открыт'},
  'opened': {'uz': 'Ochiq', 'ru': 'Открыт'},
  'pending': {'uz': 'Kutilmoqda', 'ru': 'В ожидании'},
  'cooking': {'uz': 'Pishirilmoqda', 'ru': 'Готовится'},
  'ready': {'uz': 'Tayyor', 'ru': 'Готов'},
  'served': {'uz': 'Berildi', 'ru': 'Подано'},
  'paid': {'uz': "To'landi", 'ru': 'Оплачен'},
  'closed': {'uz': 'Yopildi', 'ru': 'Закрыт'},
  'cancelled': {'uz': 'Bekor qilindi', 'ru': 'Отменён'},
  'canceled': {'uz': 'Bekor qilindi', 'ru': 'Отменён'},
  'deleted': {'uz': "O'chirildi", 'ru': 'Удалён'},
  'reserved': {'uz': 'Bron', 'ru': 'Бронь'},
  'rescheduled': {'uz': "Ko'chirilgan", 'ru': 'Перенесён'},
};

const Map<String, Map<String, String>> _orderTypeLabels = {
  'dine_in': {'uz': 'Zalda', 'ru': 'В зале'},
  'takeaway': {'uz': 'Olib ketish', 'ru': 'На вынос'},
  'delivery': {'uz': 'Yetkazib berish', 'ru': 'Доставка'},
};
