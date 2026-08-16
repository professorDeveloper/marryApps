import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/number_formatter.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/bloc/user_bloc.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archive_detail_entity.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/payment/payment_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/payment/widgets/receipt_preview_modal.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

const _kS900 = Color(0xFF0F172A);
const _kS700 = Color(0xFF334155);
const _kS500 = Color(0xFF64748B);
const _kS200 = Color(0xFFE2E8F0);
const _kS50 = Color(0xFFF8FAFC);
const _kBrand = Color(0xFFFB6633);

class PaymentRightSideBar extends StatelessWidget {
  final ArchiveDetailEntity detail;
  final int finalTotal;
  final ValueNotifier<bool> discountFocused;
  const PaymentRightSideBar({
    super.key,
    required this.detail,
    required this.finalTotal,
    required this.discountFocused,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(left: BorderSide(color: context.colors.border)),
      ),
      child: BlocBuilder<PaymentBloc, PaymentState>(
        builder: (context, state) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Discount pills
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: _DiscountSection(state: state, discountFocused: discountFocused),
              ),
              const SizedBox(height: 8),
              // Dark total card
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: _DarkTotalCard(
                  detail: detail,
                  finalTotal: finalTotal,
                ),
              ),
              const Spacer(),
              // Chek ko'rish (outlined) + Tasdiqlash (brand)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                child: Column(
                  children: [
                    _OutlinedActionButton(
                      label: S.current.strViewReceipt,
                      icon: Icons.receipt_long_outlined,
                      onTap: () {
                        final bloc = context.read<PaymentBloc>();
                        final userBloc = context.read<UserBloc>();
                        showDialog<void>(
                          context: context,
                          barrierColor: Colors.black54,
                          builder: (_) => MultiBlocProvider(
                            providers: [
                              BlocProvider<PaymentBloc>.value(value: bloc),
                              BlocProvider<UserBloc>.value(value: userBloc),
                            ],
                            child: ReceiptPreviewModal(
                              detail: detail,
                              finalTotal: finalTotal,
                              timerStartedAt: bloc.timerStartedAt,
                              timerPauses: bloc.timerPauses,
                              timerTotalSec: bloc.timerTotalSec,
                              timerPricePerHour: bloc.timerPricePerHour,
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 10),
                    _ConfirmButton(
                      state: state,
                      finalTotal: finalTotal,
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _DiscountSection extends StatelessWidget {
  final PaymentState state;
  final ValueNotifier<bool> discountFocused;
  const _DiscountSection({required this.state, required this.discountFocused});

  @override
  Widget build(BuildContext context) {
    const percentages = [0, 5, 10, 15, 20, 25];
    final amount = int.tryParse(state.discountAmount) ?? 0;
    final isPercent = state.discountType == DiscountType.percent;
    final currentPercent = isPercent ? amount : -1;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          S.current.strDiscount,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: _kS900,
            fontFamily: 'Inter',
          ),
        ),
        const SizedBox(height: 10),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 3,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          childAspectRatio: 2.2,
          children: percentages.map((p) {
            final active = currentPercent == p;
            return _DiscountPill(
              label: '$p%',
              isActive: active,
              onTap: () {
                discountFocused.value = false;
                final bloc = context.read<PaymentBloc>();
                bloc.add(const PaymentEvent.updateDiscountType(
                  dicountType: DiscountType.percent,
                ));
                bloc.add(
                  PaymentEvent.updateDiscountAmount(
                    amount: p == 0 ? '0' : p.toString(),
                  ),
                );
              },
            );
          }).toList(),
        ),
        const SizedBox(height: 12),
        _ManualDiscountInput(
          amount: amount,
          isPercent: isPercent,
          discountFocused: discountFocused,
        ),
      ],
    );
  }
}

class _ManualDiscountInput extends StatefulWidget {
  final int amount;
  final bool isPercent;
  final ValueNotifier<bool> discountFocused;

  const _ManualDiscountInput({
    required this.amount,
    required this.isPercent,
    required this.discountFocused,
  });

  @override
  State<_ManualDiscountInput> createState() => _ManualDiscountInputState();
}

class _ManualDiscountInputState extends State<_ManualDiscountInput> {
  late TextEditingController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = TextEditingController(
      text: widget.amount == 0 ? '' : widget.amount.toString(),
    );
  }

  @override
  void didUpdateWidget(covariant _ManualDiscountInput old) {
    super.didUpdateWidget(old);
    final desired = widget.amount == 0 ? '' : widget.amount.toString();
    if (_ctrl.text != desired) {
      _ctrl.value = TextEditingValue(
        text: desired,
        selection: TextSelection.collapsed(offset: desired.length),
      );
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          S.current.strManualInput,
          style: const TextStyle(
            fontSize: 12,
            color: _kS500,
            fontFamily: 'Inter',
          ),
        ),
        const SizedBox(height: 6),
        Row(
          children: [
            Expanded(
              child: ValueListenableBuilder<bool>(
                valueListenable: widget.discountFocused,
                builder: (context, isActive, _) {
                  return SizedBox(
                    height: 40,
                    child: TextField(
                      controller: _ctrl,
                      keyboardType: TextInputType.number,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: _kS900,
                        fontFamily: 'Inter',
                      ),
                      decoration: InputDecoration(
                        hintText: '0',
                        hintStyle: const TextStyle(
                          fontSize: 14,
                          color: _kS500,
                          fontFamily: 'Inter',
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        isDense: true,
                        filled: true,
                        fillColor: isActive ? const Color(0xFFFFF4F0) : Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: _kS200),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(
                            color: isActive ? _kBrand : _kS200,
                            width: isActive ? 1.5 : 1.0,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: _kBrand, width: 1.5),
                        ),
                      ),
                      onTap: () => widget.discountFocused.value = true,
                      onChanged: (v) {
                        widget.discountFocused.value = true;
                        context.read<PaymentBloc>().add(
                          PaymentEvent.updateDiscountAmount(
                            amount: v.isEmpty ? '0' : v,
                          ),
                        );
                      },
                    ),
                  );
                },
              ),
            ),
            const SizedBox(width: 6),
            _UnitToggle(
              label: '%',
              isActive: widget.isPercent,
              onTap: () => context.read<PaymentBloc>().add(
                const PaymentEvent.updateDiscountType(
                  dicountType: DiscountType.percent,
                ),
              ),
            ),
            const SizedBox(width: 4),
            _UnitToggle(
              label: S.current.strSom,
              isActive: !widget.isPercent,
              onTap: () => context.read<PaymentBloc>().add(
                const PaymentEvent.updateDiscountType(
                  dicountType: DiscountType.money,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _UnitToggle extends StatelessWidget {
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _UnitToggle({
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        height: 40,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isActive ? _kBrand : Colors.white,
          border: Border.all(color: isActive ? _kBrand : _kS200),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: isActive ? Colors.white : _kS700,
            fontFamily: 'Inter',
          ),
        ),
      ),
    );
  }
}

class _DiscountPill extends StatelessWidget {
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _DiscountPill({
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isActive ? _kBrand : Colors.white,
          border: Border.all(color: isActive ? _kBrand : _kS200),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
            color: isActive ? Colors.white : _kS900,
            fontFamily: 'Inter',
          ),
        ),
      ),
    );
  }
}

class _DarkTotalCard extends StatelessWidget {
  final ArchiveDetailEntity detail;
  final int finalTotal;

  const _DarkTotalCard({required this.detail, required this.finalTotal});

  @override
  Widget build(BuildContext context) {
    final activeGoods = detail.goods.where((g) => g.status != 'cancelled');
    final itemCount =
        activeGoods.fold<int>(0, (sum, g) => sum + g.quantity);
    final guestCount = detail.guestCount.toInt();
    final timerTotalSec = context.read<PaymentBloc>().timerTotalSec;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
      decoration: BoxDecoration(
        color: _kS900,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            S.current.strPaymentAmount,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF94A3B8),
              fontFamily: 'Inter',
            ),
          ),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Flexible(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    finalTotal.formatNWithoutS,
                    style: const TextStyle(
                      fontSize: 40,
                      fontWeight: FontWeight.w700,
                      color: _kBrand,
                      fontFamily: 'Inter',
                      height: 1.05,
                      letterSpacing: -0.8,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                S.current.strSom,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF94A3B8),
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _DarkMetric(
                  label: S.current.strDishesColumn,
                  value: '$itemCount ${S.current.strPiecesSuffix}',
                ),
              ),
              Container(
                width: 1,
                height: 32,
                color: Colors.white.withOpacity(0.1),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(left: 12),
                  child: _DarkMetric(
                    label: S.current.strGuest,
                    value: '$guestCount ${S.current.strPersonsSuffix}',
                  ),
                ),
              ),
            ],
          ),
          if (timerTotalSec > 0) ...[
            const SizedBox(height: 12),
            Container(height: 1, color: Colors.white.withOpacity(0.08)),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(
                  Icons.schedule_rounded,
                  size: 14,
                  color: Color(0xFF94A3B8),
                ),
                const SizedBox(width: 6),
                Text(
                  _fmtDuration(timerTotalSec),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                    fontFamily: 'Inter',
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  static String _fmtDuration(int totalSec) {
    final minutes = totalSec ~/ 60;
    if (minutes < 60) return '$minutes daqiqa';
    final hours = minutes ~/ 60;
    final mins = minutes % 60;
    if (mins == 0) return '$hours soat';
    return '$hours soat $mins daqiqa';
  }
}

class _DarkMetric extends StatelessWidget {
  final String label;
  final String value;
  const _DarkMetric({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: Color(0xFF94A3B8),
            fontFamily: 'Inter',
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: Colors.white,
            fontFamily: 'Inter',
          ),
        ),
      ],
    );
  }
}

class _OutlinedActionButton extends StatefulWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  const _OutlinedActionButton({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  @override
  State<_OutlinedActionButton> createState() => _OutlinedActionButtonState();
}

class _OutlinedActionButtonState extends State<_OutlinedActionButton> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 120),
          // POS minimum touch target
          height: 56,
          decoration: BoxDecoration(
            color: _hovered ? _kS50 : Colors.white,
            border: Border.all(color: _kS200),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(widget.icon, size: 18, color: _kS500),
              const SizedBox(width: 8),
              Text(
                widget.label,
                style: const TextStyle(
                  fontSize: 15, // PosTypography.bodyMd
                  fontWeight: FontWeight.w600,
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

class _ConfirmButton extends StatelessWidget {
  final PaymentState state;
  final int finalTotal;

  const _ConfirmButton({required this.state, required this.finalTotal});

  @override
  Widget build(BuildContext context) {
    final enteredAmt = int.tryParse(state.enterSum) ?? 0;
    final cashOk = state.paymentType != PaymentType.cash ||
        finalTotal <= 0 ||
        (enteredAmt > 0 && enteredAmt >= finalTotal);
    final canConfirm = state.status != Status.LOADING && cashOk;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: canConfirm
          ? () => context.read<PaymentBloc>().add(
                const PaymentEvent.payment(),
              )
          : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        // POS primary CTA — comfortable touch target
        height: 64,
        decoration: BoxDecoration(
          color: canConfirm ? _kBrand : _kBrand.withOpacity(0.4),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Center(
          child: state.status == Status.LOADING
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator.adaptive(
                    strokeWidth: 2,
                    backgroundColor: Colors.white,
                  ),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.check_rounded,
                      size: 20,
                      color: Colors.white,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      S.current.strConfirm,
                      style: const TextStyle(
                        fontSize: 18, // PosTypography.buttonLg
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        fontFamily: 'Inter',
                        letterSpacing: -0.2,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
