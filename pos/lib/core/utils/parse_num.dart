/// Narx/miqdorni raqamga o'giradi — manba `num` ham, `String` ham bo'lishi
/// mumkin.
///
/// Nega kerak: cloud API narxlarni **satr** sifatida qaytaradi
/// (`"price": "45000"`), lokal kesh esa o'sha shaklni saqlaydi. Ofitsiant
/// ilovasida to'g'ridan-to'g'ri `as num?` qilingan joyda bu butun menyu
/// o'rniga qizil xato kartalarini chizardi. Bir joyda hal qilamiz.
num asNum(Object? value, [num fallback = 0]) {
  if (value == null) return fallback;
  if (value is num) return value;
  if (value is String) {
    final v = value.trim();
    if (v.isEmpty) return fallback;
    return num.tryParse(v) ?? fallback;
  }
  return fallback;
}

int asInt(Object? value, [int fallback = 0]) => asNum(value, fallback).toInt();
