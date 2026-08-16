import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/components/flush_bars.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/extension/number_formatter.dart';
import 'package:mary_ai_pos/core/service/printer/printer_service.dart';
import 'package:mary_ai_pos/core/service/receipt/receipt_info_storage.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/bloc/user_bloc.dart';
import 'package:mary_ai_pos/features/view/main/data/models/table_timer/table_timer_response_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archive_detail_entity.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/payment/payment_bloc.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

const _kS900 = Color(0xFF0F172A);
const _kS700 = Color(0xFF334155);
const _kS500 = Color(0xFF64748B);
const _kS300 = Color(0xFFCBD5E1);
const _kS200 = Color(0xFFE2E8F0);
const _kS100 = Color(0xFFF1F5F9);
const _kS50 = Color(0xFFF8FAFC);
const _kBrand = Color(0xFFFB6633);

class ReceiptPreviewModal extends StatelessWidget {
  final ArchiveDetailEntity detail;
  final int finalTotal;
  final DateTime? timerStartedAt;
  final List<PauseInterval> timerPauses;
  final int timerTotalSec;
  final String? timerPricePerHour;

  const ReceiptPreviewModal({
    super.key,
    required this.detail,
    required this.finalTotal,
    this.timerStartedAt,
    this.timerPauses = const [],
    this.timerTotalSec = 0,
    this.timerPricePerHour,
  });

  @override
  Widget build(BuildContext context) {
    final cashierName = context.select<UserBloc, String>(
      (b) => b.state.userMOdel?.fullName ?? detail.cashierName,
    );
    final paymentState = context.watch<PaymentBloc>().state;
    final discountAmt = int.tryParse(paymentState.discountAmount) ?? 0;

    return Dialog(
      backgroundColor: Colors.white,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 520, maxHeight: 720),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            _Header(onClose: () => Navigator.of(context).pop()),
            const Divider(height: 1, color: _kS200),

            // Receipt content
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: _ReceiptCard(
                  detail: detail,
                  cashierName: cashierName,
                  finalTotal: finalTotal,
                  discountAmount: discountAmt,
                  discountType: paymentState.discountType,
                  timerStartedAt: timerStartedAt,
                  timerPauses: timerPauses,
                  timerTotalSec: timerTotalSec,
                  timerPricePerHour: timerPricePerHour,
                  hourAmount: paymentState.hourPrice.toInt(),
                ),
              ),
            ),

            // Actions
            const Divider(height: 1, color: _kS200),
            _ActionsRow(detail: detail),
          ],
        ),
      ),
    );
  }
}

// ─── Header ──────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  final VoidCallback onClose;
  const _Header({required this.onClose});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 18, 14, 18),
      child: Row(
        children: [
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  "Chek ko'rinishi",
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: _kS900,
                    fontFamily: 'Inter',
                    letterSpacing: -0.2,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Chop etishdan oldin tekshiring',
                  style: TextStyle(
                    fontSize: 13,
                    color: _kS500,
                    fontFamily: 'Inter',
                  ),
                ),
              ],
            ),
          ),
          MouseRegion(
            cursor: SystemMouseCursors.click,
            child: GestureDetector(
              onTap: onClose,
              child: Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: _kS100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.close_rounded, size: 18, color: _kS700),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Receipt card (monospace, like thermal printer output) ───────────────────

class _ReceiptCard extends StatelessWidget {
  final ArchiveDetailEntity detail;
  final String cashierName;
  final int finalTotal;
  final int discountAmount;
  final DiscountType discountType;
  final DateTime? timerStartedAt;
  final List<PauseInterval> timerPauses;
  final int timerTotalSec;
  final String? timerPricePerHour;
  final int hourAmount;

  const _ReceiptCard({
    required this.detail,
    required this.cashierName,
    required this.finalTotal,
    required this.discountAmount,
    required this.discountType,
    this.timerStartedAt,
    this.timerPauses = const [],
    this.timerTotalSec = 0,
    this.timerPricePerHour,
    this.hourAmount = 0,
  });

  bool get _hasTimerData =>
      timerStartedAt != null || timerTotalSec > 0 || timerPauses.isNotEmpty;

  int get _totalPauseSec =>
      timerPauses.fold<int>(0, (s, p) => s + p.durationSec);

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

  @override
  Widget build(BuildContext context) {
    final info = inject<ReceiptInfoStorage>().effective;
    final now = DateTime.now();
    final dateStr =
        '${now.day.toString().padLeft(2, '0')}.${now.month.toString().padLeft(2, '0')}.${now.year} '
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
    final guests = detail.guestCount > 0
        ? ' · ${detail.guestCount.toInt()} mehmon'
        : '';
    final tableNum = detail.tableNumber.toInt();
    final subtotal = detail.foodTotal.toInt();
    final service = detail.serviceAmount.toInt();
    final servicePct = detail.servicePercent.toInt();

    final cashierShort = _shortName(cashierName);
    final companyName = info.companyName.toUpperCase();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _kS50,
        border: Border.all(color: _kS200),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Heading (restaurant identity)
          Center(
            child: Text(
              companyName,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: _kS900,
                fontFamily: 'JetBrainsMono',
                letterSpacing: 0.5,
              ),
            ),
          ),
          const SizedBox(height: 6),
          _Meta(info.address),
          _Meta('Tel: ${info.phone}'),
          const SizedBox(height: 12),
          const _Dashed(),
          const SizedBox(height: 10),

          // Info block
          _KVRow('Chek №:', 'A-${detail.bilNumber}'),
          _KVRow('Sana:', dateStr),
          if (tableNum > 0) _KVRow('Stol:', '№$tableNum$guests'),
          _KVRow('Kassir:', cashierShort),

          // ── Soatlik jadval (faqat time-based stol uchun) ──
          if (_hasTimerData) ...[
            const SizedBox(height: 10),
            const _Dashed(),
            const SizedBox(height: 8),
            const Center(
              child: Text(
                'SOATLIK JADVAL',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: _kS900,
                  fontFamily: 'JetBrainsMono',
                  letterSpacing: 0.5,
                ),
              ),
            ),
            const SizedBox(height: 6),
            if (timerStartedAt != null)
              _KVRow('Ochildi:', _fmtClock(timerStartedAt!)),
            for (int i = 0; i < timerPauses.length; i++) ...[
              _KVRow(
                'Pause ${i + 1} bo\'ldi:',
                _fmtClock(timerPauses[i].startedAt),
              ),
              if (timerPauses[i].endedAt != null)
                _KVRow(
                  'To\'xtatildi:',
                  _fmtClock(timerPauses[i].endedAt!),
                ),
              if (timerPauses[i].durationSec > 0)
                _KVRow(
                  'Pause vaqti:',
                  _fmtDuration(timerPauses[i].durationSec),
                ),
            ],
            if (timerTotalSec > 0)
              _KVRow('Faol vaqt:', _fmtDuration(timerTotalSec)),
            if (_totalPauseSec > 0)
              _KVRow('Umumiy pauza:', _fmtDuration(_totalPauseSec)),
            if (timerPricePerHour != null && timerPricePerHour!.isNotEmpty)
              _KVRow('Soatlik narx:',
                  '${(int.tryParse(timerPricePerHour!.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0).formatNWithoutS} so\'m'),
          ],

          const SizedBox(height: 10),
          const _Dashed(),
          const SizedBox(height: 10),

          // Items
          for (final g in detail.goods) ...[
            _LineItem(
              name: g.name,
              qty: g.quantity,
              price: g.price,
              comment: g.comment,
            ),
            const SizedBox(height: 6),
          ],

          const SizedBox(height: 4),
          const _Dashed(),
          const SizedBox(height: 10),

          // Totals
          _KVRow('Oraliq jami', subtotal.formatNWithoutS),
          if (hourAmount > 0)
            _KVRow('Soatlik haq', hourAmount.formatNWithoutS),
          if (service > 0)
            _KVRow(
              servicePct > 0 ? 'Xizmat ($servicePct%)' : 'Xizmat',
              service.formatNWithoutS,
            ),
          if (discountAmount > 0)
            _KVRow(
              discountType == DiscountType.percent
                  ? 'Chegirma ($discountAmount%)'
                  : 'Chegirma',
              '-${discountAmount.formatNWithoutS}',
            ),
          const SizedBox(height: 10),
          const _Dashed(),
          const SizedBox(height: 10),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'JAMI',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: _kS900,
                  fontFamily: 'JetBrainsMono',
                  letterSpacing: 0.5,
                ),
              ),
              Text(
                "${finalTotal.formatNWithoutS} so'm",
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: _kS900,
                  fontFamily: 'JetBrainsMono',
                  letterSpacing: 0.2,
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  static String _shortName(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '—';
    if (parts.length == 1) return parts.first;
    return '${parts.first} ${parts[1][0].toUpperCase()}.';
  }
}

// ─── Receipt primitives ──────────────────────────────────────────────────────

class _Meta extends StatelessWidget {
  final String text;
  const _Meta(this.text);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 11,
          color: _kS700,
          fontFamily: 'JetBrainsMono',
          height: 1.6,
        ),
      ),
    );
  }
}

class _Dashed extends StatelessWidget {
  const _Dashed();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        const dash = 6.0;
        final count = (constraints.maxWidth / (dash * 2)).floor();
        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(
            count,
            (_) => const SizedBox(
              width: dash,
              height: 1,
              child: DecoratedBox(decoration: BoxDecoration(color: _kS300)),
            ),
          ),
        );
      },
    );
  }
}

class _KVRow extends StatelessWidget {
  final String k;
  final String v;
  const _KVRow(this.k, this.v);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            k,
            style: const TextStyle(
              fontSize: 12,
              color: _kS700,
              fontFamily: 'JetBrainsMono',
            ),
          ),
          Text(
            v,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: _kS900,
              fontFamily: 'JetBrainsMono',
              fontFeatures: [FontFeature.tabularFigures()],
            ),
          ),
        ],
      ),
    );
  }
}

class _LineItem extends StatelessWidget {
  final String name;
  final int qty;
  final int price;
  final String comment;

  const _LineItem({
    required this.name,
    required this.qty,
    required this.price,
    this.comment = '',
  });

  @override
  Widget build(BuildContext context) {
    final total = qty * price;
    final note = comment.trim();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          name,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: _kS900,
            fontFamily: 'JetBrainsMono',
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(top: 2),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '$qty × ${price.formatNWithoutS}',
                style: const TextStyle(
                  fontSize: 11,
                  color: _kS500,
                  fontFamily: 'JetBrainsMono',
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
              ),
              Text(
                total.formatNWithoutS,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: _kS900,
                  fontFamily: 'JetBrainsMono',
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
        ),
        if (note.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 2, left: 6),
            child: Text(
              '· $note',
              style: const TextStyle(
                fontSize: 10,
                fontStyle: FontStyle.italic,
                color: _kS500,
                fontFamily: 'JetBrainsMono',
              ),
            ),
          ),
      ],
    );
  }
}

// ─── Actions row (Chop etish · Email · Yakunlash) ────────────────────────────

class _ActionsRow extends StatelessWidget {
  final ArchiveDetailEntity detail;
  const _ActionsRow({required this.detail});

  void _print(BuildContext context) {
    final bloc = context.read<PaymentBloc>();
    final payment = bloc.state;
    final discountAmt = int.tryParse(payment.discountAmount) ?? 0;
    final isPercent = payment.discountType == DiscountType.percent;
    unawaited(
      inject<PrinterService>().printCashierReceiptFromDetail(
        detail: detail,
        // Soatlik haq + timer history — Yakunlash bilan bir xil chek
        hourAmount: payment.hourPrice,
        discountPercent: isPercent ? discountAmt.toDouble() : 0,
        discountAmount: isPercent ? 0 : discountAmt.toDouble(),
        timerStartedAt: bloc.timerStartedAt,
        timerPauses: bloc.timerPauses,
        timerTotalSec: bloc.timerTotalSec,
        timerPricePerHour: bloc.timerPricePerHour,
      ),
    );
    showInfoMessage(
      context,
      'Chop etish printer\'ga yuborildi',
      duration: 2,
    );
    Navigator.of(context).pop();
  }

  void _email(BuildContext context) {
    showInfoMessage(
      context,
      'Email yuborish funksiyasi tez orada qo\'shiladi',
      duration: 2,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
      child: Row(
        children: [
          Expanded(
            child: _OutlinedBtn(
              icon: Icons.print_outlined,
              label: S.current.strPrint,
              onTap: () => _print(context),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _OutlinedBtn(
              icon: Icons.mail_outline_rounded,
              label: S.current.strEmail,
              onTap: () => _email(context),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _BrandBtn(
              label: S.current.strCloseAction,
              onTap: () => Navigator.of(context).pop(),
            ),
          ),
        ],
      ),
    );
  }

}

class _OutlinedBtn extends StatefulWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _OutlinedBtn({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  State<_OutlinedBtn> createState() => _OutlinedBtnState();
}

class _OutlinedBtnState extends State<_OutlinedBtn> {
  bool _hover = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hover = true),
      onExit: (_) => setState(() => _hover = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 120),
          height: 44,
          decoration: BoxDecoration(
            color: _hover ? _kS50 : Colors.white,
            border: Border.all(color: _kS200),
            borderRadius: BorderRadius.circular(10),
          ),
          alignment: Alignment.center,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(widget.icon, size: 16, color: _kS700),
              const SizedBox(width: 8),
              Text(
                widget.label,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: _kS900,
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BrandBtn extends StatefulWidget {
  final String label;
  final VoidCallback onTap;

  const _BrandBtn({required this.label, required this.onTap});

  @override
  State<_BrandBtn> createState() => _BrandBtnState();
}

class _BrandBtnState extends State<_BrandBtn> {
  bool _hover = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hover = true),
      onExit: (_) => setState(() => _hover = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 120),
          height: 44,
          decoration: BoxDecoration(
            color: _hover ? const Color(0xFFEA5A2E) : _kBrand,
            borderRadius: BorderRadius.circular(10),
          ),
          alignment: Alignment.center,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                widget.label,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                  fontFamily: 'Inter',
                ),
              ),
              const SizedBox(width: 6),
              const Icon(Icons.check_rounded, size: 16, color: Colors.white),
            ],
          ),
        ),
      ),
    );
  }
}
