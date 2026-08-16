import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Agar kassir sozlamalarda hech narsa kiritmagan bo'lsa, shu qiymatlar chekka chiqadi.
const _kDefaultCompanyName = 'Friends Club';
const _kDefaultAddress = 'ул. Юсуфа Хос Ходжиба, 73';
const _kDefaultPhone = '+998 95 143 30 00';

class ReceiptInfo {
  final String companyName;
  final String address;
  final String phone;

  const ReceiptInfo({
    this.companyName = '',
    this.address = '',
    this.phone = '',
  });

  /// Fallback default'lar bilan to'ldirilgan versiya — UIda chekka chiqadi.
  ReceiptInfo withDefaults() => ReceiptInfo(
        companyName: companyName.isNotEmpty ? companyName : _kDefaultCompanyName,
        address: address.isNotEmpty ? address : _kDefaultAddress,
        phone: phone.isNotEmpty ? phone : _kDefaultPhone,
      );

  ReceiptInfo copyWith({
    String? companyName,
    String? address,
    String? phone,
  }) =>
      ReceiptInfo(
        companyName: companyName ?? this.companyName,
        address: address ?? this.address,
        phone: phone ?? this.phone,
      );

  Map<String, dynamic> toJson() => {
        'company_name': companyName,
        'address': address,
        'phone': phone,
      };

  factory ReceiptInfo.fromJson(Map<String, dynamic> json) => ReceiptInfo(
        companyName: (json['company_name'] ?? '').toString(),
        address: (json['address'] ?? '').toString(),
        phone: (json['phone'] ?? '').toString(),
      );
}

/// Receipt headeriga chiqadigan tashkilot ma'lumotlarini saqlaydi.
/// Har bir kassir o'z terminali uchun alohida sozlay oladi — lokal.
class ReceiptInfoStorage {
  static const _kKey = 'receipt_info_v1';

  final SharedPreferences _prefs;
  ReceiptInfo _cache;

  ReceiptInfoStorage(this._prefs) : _cache = _read(_prefs);

  static ReceiptInfo _read(SharedPreferences prefs) {
    try {
      final raw = prefs.getString(_kKey);
      if (raw == null || raw.isEmpty) return const ReceiptInfo();
      final json = jsonDecode(raw);
      if (json is! Map<String, dynamic>) return const ReceiptInfo();
      return ReceiptInfo.fromJson(json);
    } catch (_) {
      return const ReceiptInfo();
    }
  }

  /// Foydalanuvchi kiritgan qiymatlar (bo'sh bo'lishi mumkin).
  ReceiptInfo get current => _cache;

  /// Chekka chiqariladigan — bo'sh bo'lsa default'lar bilan to'ldiriladi.
  ReceiptInfo get effective => _cache.withDefaults();

  Future<void> save(ReceiptInfo info) async {
    _cache = info;
    await _prefs.setString(_kKey, jsonEncode(info.toJson()));
  }
}
