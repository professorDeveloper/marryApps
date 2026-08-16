/// Fenix `formatNumber` ma'nosi: mingliklar orasida oddiy probel, faqat `0-9` (thermal encoding buzilmaydi).
class ReceiptSomFormat {
  ReceiptSomFormat._();

  static String formatInt(num value) {
    final n = value.round();
    if (n == 0) return '0';
    final neg = n < 0;
    final digits = n.abs().toString();
    final buf = StringBuffer();
    final len = digits.length;
    for (var i = 0; i < len; i++) {
      if (i > 0 && (len - i) % 3 == 0) buf.write(' ');
      buf.write(digits[i]);
    }
    return (neg ? '-' : '') + buf.toString();
  }
}
