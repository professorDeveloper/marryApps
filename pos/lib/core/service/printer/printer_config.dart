import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';

class PrinterConfig {
  final String ip;
  final int port;
  final PaperSize paperSize;
  final int timeoutMs;

  const PrinterConfig({
    required this.ip,
    this.port = 9100,
    this.paperSize = PaperSize.mm80,
    this.timeoutMs = 10000,
    this.connectionType = 'cable',
  });

  /// Backend `GET/POST …/printer-settings` — `connection_type`: rasmiy jadvalda
  /// **`cable`** (LAN) va **`wlan`** (Wi‑Fi); default `cable`.
  final String connectionType;

  /// `cable` — USB kabel orqali Windows printer API ishlatiladi (IP kerak emas).
  bool get usesWindowsPrinter => connectionType.toLowerCase() == 'cable';

  /// Wi-Fi / LAN orqali RAW TCP (IP:port). `cable` bu yerga kirmaydi.
  bool get usesNetworkTcp {
    switch (connectionType.toLowerCase()) {
      case 'wlan':
      case 'wifi':
      case 'lan':
      case 'ethernet':
        return true;
      default:
        return false;
    }
  }

  @override
  String toString() => 'PrinterConfig($ip:$port, $connectionType)';
}
