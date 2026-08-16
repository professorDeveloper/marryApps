import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:intl/intl.dart';
import 'package:mary_ai_pos/core/service/printer/receipt/receipt_esc_pos_helper.dart';
import 'package:mary_ai_pos/core/service/printer/receipt/receipt_som_format.dart';

/// Smena yopilishi — faqat terminal (karta) summasi; naqd chekda ko‘rsatilmaydi.
class ShiftCloseReceiptBuilder {
  ShiftCloseReceiptBuilder._();

  static String _fmt(int v) => ReceiptSomFormat.formatInt(v);

  static Future<List<int>> build({
    required String shiftId,
    required DateTime? openedAt,
    required int closingCard,
    required String cashierLabel,
    PaperSize paperSize = PaperSize.mm80,
  }) async {
    final profile = await CapabilityProfile.load();
    final gen = receiptGenerator(paperSize, profile);
    final df = DateFormat('dd.MM.yyyy  HH:mm');
    final now = DateTime.now();

    List<int> bytes = [];
    bytes += receiptEncodingPreamble(gen);

    bytes += gen.text(
      'ЗАКРЫТИЕ СМЕНЫ',
      styles: const PosStyles(
        align: PosAlign.center,
        bold: true,
        height: PosTextSize.size2,
        width: PosTextSize.size1,
      ),
      linesAfter: 1,
    );

    bytes += gen.text(df.format(now));
    bytes += gen.hr();

    bytes += gen.row([
      PosColumn(
        text: 'Кассир:',
        width: 4,
        styles: const PosStyles(bold: true),
      ),
      PosColumn(text: cashierLabel, width: 8),
    ]);
    bytes += gen.row([
      PosColumn(
        text: 'Смена ID:',
        width: 4,
        styles: const PosStyles(bold: true),
      ),
      PosColumn(
        text: shiftId.length > 12 ? '${shiftId.substring(0, 8)}…' : shiftId,
        width: 8,
      ),
    ]);
    if (openedAt != null) {
      bytes += gen.row([
        PosColumn(
          text: 'Открыта:',
          width: 4,
          styles: const PosStyles(bold: true),
        ),
        PosColumn(text: df.format(openedAt.toLocal()), width: 8),
      ]);
      final mins = now.difference(openedAt).inMinutes;
      final h = mins ~/ 60;
      final m = mins % 60;
      bytes += gen.row([
        PosColumn(
          text: 'Длительность:',
          width: 4,
          styles: const PosStyles(bold: true),
        ),
        PosColumn(
          text: '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}',
          width: 8,
        ),
      ]);
    }

    bytes += gen.hr();
    bytes += gen.text(
      'Терминал (итог)',
      styles: const PosStyles(bold: true),
    );
    bytes += gen.row([
      PosColumn(text: 'Карта:', width: 6),
      PosColumn(
        text: '${_fmt(closingCard)} сум',
        width: 6,
        styles: const PosStyles(bold: true, align: PosAlign.right),
      ),
    ]);
    bytes += gen.text(
      'Наличные на чеке не отображаются.',
      styles: const PosStyles(align: PosAlign.center),
      linesAfter: 1,
    );

    bytes += gen.feed(1);
    bytes += gen.text(
      'Спасибо!',
      styles: const PosStyles(align: PosAlign.center),
      linesAfter: 1,
    );
    bytes += gen.cut();

    return bytes;
  }
}
