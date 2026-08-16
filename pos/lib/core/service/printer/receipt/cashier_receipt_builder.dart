import 'dart:math' as math;

import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:intl/intl.dart';
import 'package:mary_ai_pos/core/service/printer/receipt/receipt_esc_pos_helper.dart';
import 'package:mary_ai_pos/core/service/printer/receipt/receipt_notice_lines.dart';
import 'package:mary_ai_pos/core/service/printer/receipt/receipt_som_format.dart';
import 'package:mary_ai_pos/core/service/receipt/receipt_info_storage.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:mary_ai_pos/features/view/main/data/models/open_order/open_order_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/table_timer/table_timer_response_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archive_detail_entity.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/detail/detail_bloc.dart';

/// Kassir cheki — narxlar, jami summa, xizmat to'lovi bilan to'liq chek.
class CashierReceiptBuilder {
  CashierReceiptBuilder._();

  static String _fmt(num value) => ReceiptSomFormat.formatInt(value);

  static String _fmtClock(DateTime dt) {
    final l = dt.toLocal();
    return '${l.hour.toString().padLeft(2, '0')}:${l.minute.toString().padLeft(2, '0')}';
  }

  static String _fmtDuration(int totalSec) {
    final h = totalSec ~/ 3600;
    final m = (totalSec % 3600) ~/ 60;
    final s = totalSec % 60;
    if (h > 0 && m > 0) return '${h}h ${m}min';
    if (h > 0) return '${h}h 0min';
    if (m > 0) return '${m}min ${s}s';
    return '${s}s';
  }

  /// `service_amount` → `service_percent` × mahsulot → `total_amount − mahsulot`.
  static double _servicePart(OpenOrderModel order, double subtotal) {
    final explicit = order.serviceAmountValue;
    if (explicit > 0.0001) return explicit;
    final sp = order.servicePercent;
    if (sp != null && sp > 0) return subtotal * sp / 100.0;
    final tot = order.totalAmountValue;
    if (tot > subtotal + 0.01) return tot - subtotal;
    return 0;
  }

  static String _serviceLabel(OpenOrderModel order, double subtotal, double service) {
    final sp = order.servicePercent;
    if (sp != null && sp > 0) {
      final ps = sp == sp.roundToDouble() ? '${sp.round()}' : '$sp';
      return 'Обслужение ($ps%):';
    }
    if (subtotal > 0.01 && service > 0.01) {
      final approx = (service / subtotal * 100).round();
      return 'Обслужение (~$approx%):';
    }
    return 'Обслужение:';
  }

  static double _discountValue(double preDiscount, double discountPercent, double discountAmount) {
    if (discountPercent > 0) {
      final v = preDiscount * discountPercent / 100.0;
      if (v > 0.0001) return v;
    }
    if (discountAmount > 0.0001) return math.min(discountAmount, preDiscount);
    return 0;
  }

  /// Pause tarixi bloki — ikkala `build` metodida qayta ishlatiladi.
  static void _appendTimerSection({
    required Generator gen,
    required List<int> bytes,
    required DateTime? timerStartedAt,
    required List<PauseInterval> timerPauses,
    required int timerTotalSec,
    required String? timerPricePerHour,
  }) {
    final hasData = timerStartedAt != null || timerTotalSec > 0 || timerPauses.isNotEmpty;
    if (!hasData) return;

    bytes += gen.hr();
    bytes += gen.text(
      'SOATLIK JADVAL',
      styles: const PosStyles(bold: true, align: PosAlign.center),
    );

    if (timerStartedAt != null) {
      bytes += gen.row([
        PosColumn(text: 'Ochildi:', width: 6),
        PosColumn(text: _fmtClock(timerStartedAt), width: 6,
            styles: const PosStyles(align: PosAlign.right)),
      ]);
    }

    // Pause tarixi
    for (int i = 0; i < timerPauses.length; i++) {
      final p = timerPauses[i];
      final num = i + 1;
      bytes += gen.row([
        PosColumn(text: 'Pause $num bo\'ldi:', width: 7),
        PosColumn(text: _fmtClock(p.startedAt), width: 5,
            styles: const PosStyles(align: PosAlign.right)),
      ]);
      if (p.endedAt != null) {
        bytes += gen.row([
          PosColumn(text: 'To\'xtatildi:', width: 7),
          PosColumn(text: _fmtClock(p.endedAt!), width: 5,
              styles: const PosStyles(align: PosAlign.right)),
        ]);
      }
      if (p.durationSec > 0) {
        bytes += gen.row([
          PosColumn(text: 'Pause vaqti:', width: 7),
          PosColumn(text: _fmtDuration(p.durationSec), width: 5,
              styles: const PosStyles(align: PosAlign.right)),
        ]);
      }
    }

    if (timerTotalSec > 0) {
      bytes += gen.row([
        PosColumn(text: 'Faol vaqt:', width: 7),
        PosColumn(text: _fmtDuration(timerTotalSec), width: 5,
            styles: const PosStyles(align: PosAlign.right)),
      ]);
    }

    // Umumiy pauza vaqti
    final totalPauseSec = timerPauses.fold(0, (s, p) => s + p.durationSec);
    if (totalPauseSec > 0) {
      bytes += gen.row([
        PosColumn(text: 'Umumiy pauza:', width: 7),
        PosColumn(text: _fmtDuration(totalPauseSec), width: 5,
            styles: const PosStyles(align: PosAlign.right)),
      ]);
    }

    if (timerPricePerHour != null && timerPricePerHour.isNotEmpty) {
      final ph = int.tryParse(timerPricePerHour.replaceAll(RegExp(r'[^0-9]'), ''));
      if (ph != null && ph > 0) {
        bytes += gen.row([
          PosColumn(text: 'Soatlik narx:', width: 7),
          PosColumn(text: '${_fmt(ph)} sum', width: 5,
              styles: const PosStyles(align: PosAlign.right)),
        ]);
      }
    }
  }

  /// To'liq kassir cheki — [OpenOrderModel] asosida.
  static Future<List<int>> build({
    required OpenOrderModel order,
    required List<OrderItem> items,
    PaperSize paperSize = PaperSize.mm80,
    double discountPercent = 0,
    double discountAmount = 0,
    double hourAmount = 0,
    DateTime? timerStartedAt,
    List<PauseInterval> timerPauses = const [],
    int timerTotalSec = 0,
    String? timerPricePerHour,
  }) async {
    final profile = await CapabilityProfile.load();
    final gen = receiptGenerator(paperSize, profile);
    final now = DateTime.now();
    final timeFmt = DateFormat('dd.MM.yyyy  HH:mm');

    List<int> bytes = [];
    bytes += receiptEncodingPreamble(gen);

    bytes += gen.text(
      'КАССИРСКИЙ ЧЕК',
      styles: const PosStyles(
        align: PosAlign.center, bold: true,
        height: PosTextSize.size2, width: PosTextSize.size1,
      ),
      linesAfter: 1,
    );

    bytes += gen.text(timeFmt.format(now));
    bytes += gen.row([
      PosColumn(text: 'Зал:', width: 4),
      PosColumn(text: order.hallName, width: 8),
    ]);
    bytes += gen.row([
      PosColumn(text: 'Стол:', width: 4),
      PosColumn(text: '${order.tableNumber}', width: 8),
    ]);
    bytes += gen.row([
      PosColumn(text: 'Гости:', width: 4),
      PosColumn(text: '${order.guestCount}', width: 8),
    ]);

    _appendTimerSection(
      gen: gen, bytes: bytes,
      timerStartedAt: timerStartedAt,
      timerPauses: timerPauses,
      timerTotalSec: timerTotalSec,
      timerPricePerHour: timerPricePerHour,
    );

    bytes += gen.hr();

    bytes += gen.row([
      PosColumn(text: 'Блюдо', width: 6, styles: const PosStyles(bold: true, underline: true)),
      PosColumn(text: 'Кол', width: 2, styles: const PosStyles(bold: true, align: PosAlign.center)),
      PosColumn(text: 'Сумма', width: 4, styles: const PosStyles(bold: true, align: PosAlign.right)),
    ]);

    double subtotal = 0;
    for (final item in items) {
      final price = double.tryParse(item.goods.price) ?? 0;
      final lineTotal = price * item.quantity;
      subtotal += lineTotal;
      final name = item.goods.name.length > 22
          ? '${item.goods.name.substring(0, 20)}..'
          : item.goods.name;
      bytes += gen.row([
        PosColumn(text: name, width: 6,
            styles: const PosStyles(height: PosTextSize.size1, width: PosTextSize.size1)),
        PosColumn(text: 'x${item.quantity}', width: 2,
            styles: const PosStyles(align: PosAlign.center, height: PosTextSize.size1, width: PosTextSize.size1)),
        PosColumn(text: _fmt(lineTotal), width: 4,
            styles: const PosStyles(align: PosAlign.right, height: PosTextSize.size1, width: PosTextSize.size1)),
      ]);
      final note = item.comment.trim();
      if (note.isNotEmpty) {
        bytes += gen.text(
          '  · $note',
          styles: const PosStyles(height: PosTextSize.size1, width: PosTextSize.size1),
        );
      }
    }

    bytes += gen.hr();

    bytes += gen.row([
      PosColumn(text: 'Mahsulotlar:', width: 8, styles: const PosStyles(bold: true)),
      PosColumn(text: _fmt(subtotal), width: 4,
          styles: const PosStyles(bold: true, align: PosAlign.right)),
    ]);

    if (hourAmount > 0.0001) {
      bytes += gen.row([
        PosColumn(text: 'Soatlik haq:', width: 8),
        PosColumn(text: _fmt(hourAmount), width: 4,
            styles: const PosStyles(align: PosAlign.right)),
      ]);
    }

    final serviceRaw = _servicePart(order, subtotal);
    final serviceAmt = serviceRaw > 0.0001 ? serviceRaw : 0.0;
    if (serviceAmt > 0) {
      bytes += gen.row([
        PosColumn(text: _serviceLabel(order, subtotal, serviceAmt), width: 8),
        PosColumn(text: _fmt(serviceAmt), width: 4,
            styles: const PosStyles(align: PosAlign.right)),
      ]);
    }

    final preDiscount = subtotal + hourAmount + serviceAmt;
    final discountVal = _discountValue(preDiscount, discountPercent, discountAmount);
    if (discountVal > 0.0001) {
      final discLabel = discountPercent > 0
          ? 'Скидка (${discountPercent == discountPercent.roundToDouble() ? discountPercent.round().toString() : discountPercent.toStringAsFixed(1)}%):'
          : 'Скидка:';
      bytes += gen.row([
        PosColumn(text: discLabel, width: 8),
        PosColumn(text: _fmt(discountVal), width: 4,
            styles: const PosStyles(align: PosAlign.right)),
      ]);
    }

    final toPay = (preDiscount - discountVal).clamp(0.0, double.infinity);

    bytes += gen.hr();
    bytes += gen.row([
      PosColumn(text: 'TO\'LOV:', width: 8,
          styles: const PosStyles(bold: true, height: PosTextSize.size2, width: PosTextSize.size1)),
      PosColumn(text: _fmt(toPay.round()), width: 4,
          styles: const PosStyles(bold: true, align: PosAlign.right,
              height: PosTextSize.size2, width: PosTextSize.size1)),
    ]);

    appendReceiptNoReprepNotice(gen, bytes);
    bytes += gen.feed(1);
    bytes += gen.text('Rahmat!', styles: const PosStyles(align: PosAlign.center, bold: true), linesAfter: 1);
    bytes += gen.cut();

    return bytes;
  }

  /// Ismdan qisqa format ("Ali Valiyev" → "Ali V.")
  static String _shortName(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '—';
    if (parts.length == 1) return parts.first;
    return '${parts.first} ${parts[1][0].toUpperCase()}.';
  }

  /// To'lov ekranidan keyin chek — [ArchiveDetailEntity] asosida.
  /// Preview modal (`ReceiptPreviewModal`) bilan bir xil ko'rinishda chop etiladi.
  static Future<List<int>> buildFromDetail({
    required ArchiveDetailEntity detail,
    PaperSize paperSize = PaperSize.mm80,
    double hourAmount = 0,
    double discountPercent = 0,
    double discountAmount = 0,
    DateTime? timerStartedAt,
    List<PauseInterval> timerPauses = const [],
    int timerTotalSec = 0,
    String? timerPricePerHour,
  }) async {
    final profile = await CapabilityProfile.load();
    final gen = receiptGenerator(paperSize, profile);
    final now = DateTime.now();
    final dateStr = DateFormat('dd.MM.yyyy  HH:mm').format(now);

    // Restoran ma'lumotlari
    final info = inject<ReceiptInfoStorage>().effective;
    final companyName = info.companyName.toUpperCase();

    List<int> bytes = [];
    bytes += receiptEncodingPreamble(gen);

    // ─── 1) Restoran sarlavhasi ──────────────────────────────────────────
    bytes += gen.text(
      companyName,
      styles: const PosStyles(
        align: PosAlign.center,
        bold: true,
        height: PosTextSize.size2,
        width: PosTextSize.size1,
      ),
    );
    if (info.address.isNotEmpty) {
      bytes += gen.text(
        info.address,
        styles: const PosStyles(align: PosAlign.center),
      );
    }
    if (info.phone.isNotEmpty) {
      bytes += gen.text(
        'Tel: ${info.phone}',
        styles: const PosStyles(align: PosAlign.center),
      );
    }

    bytes += gen.hr(ch: '-');

    // ─── 2) Meta info ────────────────────────────────────────────────────
    bytes += gen.row([
      PosColumn(text: 'Chek №:', width: 6),
      PosColumn(
        text: 'A-${detail.bilNumber}',
        width: 6,
        styles: const PosStyles(align: PosAlign.right, bold: true),
      ),
    ]);
    bytes += gen.row([
      PosColumn(text: 'Sana:', width: 4),
      PosColumn(
        text: dateStr,
        width: 8,
        styles: const PosStyles(align: PosAlign.right),
      ),
    ]);
    final tableNum = detail.tableNumber.toInt();
    if (tableNum > 0) {
      final guests = detail.guestCount > 0
          ? ' · ${detail.guestCount.toInt()} mehmon'
          : '';
      bytes += gen.row([
        PosColumn(text: 'Stol:', width: 4),
        PosColumn(
          text: '№$tableNum$guests',
          width: 8,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]);
    }
    bytes += gen.row([
      PosColumn(text: 'Kassir:', width: 5),
      PosColumn(
        text: _shortName(detail.cashierName),
        width: 7,
        styles: const PosStyles(align: PosAlign.right),
      ),
    ]);

    _appendTimerSection(
      gen: gen,
      bytes: bytes,
      timerStartedAt: timerStartedAt,
      timerPauses: timerPauses,
      timerTotalSec: timerTotalSec,
      timerPricePerHour: timerPricePerHour,
    );

    bytes += gen.hr(ch: '-');

    // ─── 3) Items ────────────────────────────────────────────────────────
    double subtotal = 0;
    for (final g in detail.goods.where((g) => g.status != 'cancelled')) {
      final lineTotal = g.price * g.quantity;
      subtotal += lineTotal;
      // Nom — alohida qatorda, to'liq (kesilmaydi)
      bytes += gen.text(
        g.name,
        styles: const PosStyles(bold: true),
      );
      // "qty × price           total" — ikkinchi qator
      bytes += gen.row([
        PosColumn(
          text: '  ${g.quantity} x ${_fmt(g.price)}',
          width: 7,
        ),
        PosColumn(
          text: _fmt(lineTotal),
          width: 5,
          styles: const PosStyles(align: PosAlign.right, bold: true),
        ),
      ]);
      final note = g.comment.trim();
      if (note.isNotEmpty) {
        bytes += gen.text('  · $note');
      }
    }

    bytes += gen.hr(ch: '-');

    // ─── 4) Totals (preview order) ───────────────────────────────────────
    bytes += gen.row([
      PosColumn(text: 'Oraliq jami', width: 7),
      PosColumn(
        text: _fmt(subtotal),
        width: 5,
        styles: const PosStyles(align: PosAlign.right),
      ),
    ]);

    if (hourAmount > 0.0001) {
      bytes += gen.row([
        PosColumn(text: 'Soatlik haq', width: 7),
        PosColumn(
          text: _fmt(hourAmount),
          width: 5,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]);
    }

    final serviceAmt = detail.serviceAmount > 0.0001
        ? detail.serviceAmount
        : (detail.servicePercent > 0 ? subtotal * detail.servicePercent / 100 : 0.0);
    if (serviceAmt > 0.0001) {
      final servicePct = detail.servicePercent.toInt();
      final label = servicePct > 0 ? 'Xizmat ($servicePct%)' : 'Xizmat';
      bytes += gen.row([
        PosColumn(text: label, width: 7),
        PosColumn(
          text: _fmt(serviceAmt),
          width: 5,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]);
    }

    final preDiscount = subtotal + hourAmount + serviceAmt;
    final discVal = _discountValue(preDiscount, discountPercent, discountAmount);
    if (discVal > 0.0001) {
      final discLabel = discountPercent > 0
          ? 'Chegirma (${discountPercent.toInt()}%)'
          : 'Chegirma';
      bytes += gen.row([
        PosColumn(text: discLabel, width: 7),
        PosColumn(
          text: '-${_fmt(discVal)}',
          width: 5,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]);
    }

    bytes += gen.hr(ch: '-');

    final toPay = (preDiscount - discVal).clamp(0.0, double.infinity);
    // ─── 5) JAMI (big, bold) ──────────────────────────────────────────────
    bytes += gen.row([
      PosColumn(
        text: 'JAMI',
        width: 5,
        styles: const PosStyles(
          bold: true,
          height: PosTextSize.size2,
          width: PosTextSize.size1,
        ),
      ),
      PosColumn(
        text: '${_fmt(toPay.round())} so\'m',
        width: 7,
        styles: const PosStyles(
          bold: true,
          align: PosAlign.right,
          height: PosTextSize.size2,
          width: PosTextSize.size1,
        ),
      ),
    ]);

    appendReceiptNoReprepNotice(gen, bytes);
    bytes += gen.feed(1);
    bytes += gen.text(
      'Rahmat!',
      styles: const PosStyles(align: PosAlign.center, bold: true),
      linesAfter: 1,
    );
    bytes += gen.cut();

    return bytes;
  }
}
