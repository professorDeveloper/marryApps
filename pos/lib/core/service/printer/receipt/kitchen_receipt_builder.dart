import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:intl/intl.dart';
import 'package:mary_ai_pos/core/service/printer/receipt/receipt_esc_pos_helper.dart';
import 'package:mary_ai_pos/core/service/printer/receipt/receipt_notice_lines.dart';
import 'package:mary_ai_pos/features/view/main/data/models/open_order/open_order_model.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/detail/detail_bloc.dart';

/// Oshxona cheki — faqat taom nomi va miqdori, narxsiz.
class KitchenReceiptBuilder {
  KitchenReceiptBuilder._();

  static Future<List<int>> build({
    required OpenOrderModel order,
    required List<OrderItem> items,
    PaperSize paperSize = PaperSize.mm80,
  }) async {
    final profile = await CapabilityProfile.load();
    final gen = receiptGenerator(paperSize, profile);
    final time = DateFormat('HH:mm').format(DateTime.now());

    List<int> bytes = [];
    bytes += receiptEncodingPreamble(gen);

    // ── Header ──────────────────────────────────────────────────────────────
    bytes += gen.text(
      '** КУХОННЫЙ ЧЕК **',
      styles: const PosStyles(
        align: PosAlign.center,
        bold: true,
        height: PosTextSize.size2,
        width: PosTextSize.size1,
      ),
    );

    // Olib ketish buyurtmasida stol yo'q — `tableNumber` 0 bo'lib qoladi va
    // "Стол: 0" oshxonani chalg'itardi.
    final isTakeaway = (order.orderType ?? '').toLowerCase().contains('away');

    bytes += gen.row([
      PosColumn(
        text: isTakeaway ? 'НАВЫНОС' : 'Стол: ${order.tableNumber}',
        width: 8,
        styles: const PosStyles(bold: true),
      ),
      PosColumn(
        text: time,
        width: 4,
        styles: const PosStyles(align: PosAlign.right),
      ),
    ]);

    if (order.hallName.isNotEmpty) {
      bytes += gen.text('Зал: ${order.hallName}');
    }

    bytes += gen.hr();

    // ── Items — katta shrift, narxsiz ────────────────────────────────────────
    for (final item in items) {
      final name = item.goods.name.length > 28
          ? '${item.goods.name.substring(0, 26)}..'
          : item.goods.name;

      bytes += gen.row([
        PosColumn(
          text: name,
          width: 9,
          styles: const PosStyles(bold: true),
        ),
        PosColumn(
          text: 'x${item.quantity}',
          width: 3,
          styles: const PosStyles(bold: true, align: PosAlign.right),
        ),
      ]);

      if (item.commet.isNotEmpty) {
        bytes += gen.text(
          '  >> ${item.commet}',
          styles: const PosStyles(underline: true),
        );
      }
    }

    bytes += gen.hr();

    // ── Footer ───────────────────────────────────────────────────────────────
    bytes += gen.text('Гостей: ${order.guestCount}');
    appendReceiptNoReprepNotice(gen, bytes);
    bytes += gen.feed(2);
    bytes += gen.cut();

    return bytes;
  }
}
