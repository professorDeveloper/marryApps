import 'dart:math';

/// RFC 4122 v4 UUID generatori.
///
/// Alohida paket qo'shmaymiz — bizga faqat shu kerak. Klient tomonda
/// generatsiya qilingan UUID buyurtmaning **doimiy** identifikatori bo'ladi:
/// backend `CreateOrderRequest.ID` ni qabul qiladi va o'sha id bilan buyurtma
/// allaqachon mavjud bo'lsa uni qaytaradi (replay-return, `order.go:187-206`).
/// Shu sababli offline'da yaratilgan buyurtmani xohlagancha qayta yuborish
/// mumkin — dublikat tushmaydi.
class UuidV4 {
  static final Random _rnd = Random.secure();

  static String generate() {
    final b = List<int>.generate(16, (_) => _rnd.nextInt(256));

    // Versiya (4) va variant (RFC 4122) bitlari.
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;

    final hex = b.map((x) => x.toRadixString(16).padLeft(2, '0')).join();
    return '${hex.substring(0, 8)}-'
        '${hex.substring(8, 12)}-'
        '${hex.substring(12, 16)}-'
        '${hex.substring(16, 20)}-'
        '${hex.substring(20)}';
  }
}
