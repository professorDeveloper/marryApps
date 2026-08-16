import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/extension/number_formatter.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/payment/payment_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/payment/payment_screen_mixin.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

const _kS900 = Color(0xFF0F172A);
const _kS700 = Color(0xFF334155);
const _kS500 = Color(0xFF64748B);
const _kS200 = Color(0xFFE2E8F0);
const _kS100 = Color(0xFFF1F5F9);
const _kS50 = Color(0xFFF8FAFC);
const _kGreen = Color(0xFF16A34A);
const _kGreenBg = Color(0xFFDCFCE7);
const _kRed = Color(0xFFDC2626);
const _kRedBg = Color(0xFFFEE2E2);

class PaymentCenterColumn extends StatelessWidget with PaymentScreenMixin {
  final int finalTotal;
  final ValueNotifier<bool> discountFocused;
  PaymentCenterColumn({super.key, required this.finalTotal, required this.discountFocused});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: _kS50,
      padding: const EdgeInsets.all(20),
      child: BlocBuilder<PaymentBloc, PaymentState>(
        builder: (context, state) {
          final entered = int.tryParse(state.enterSum) ?? 0;
          final change = entered > finalTotal ? entered - finalTotal : 0;

          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Payment type tabs (2 wide pills: Naqd / Karta)
              _PayTypeTabs(state: state),
              const SizedBox(height: 18),

              // Amount entry block — bosilganda numpad qabul qilingan summa
              // rejimiga qaytadi (chegirma rejimidan chiqish)
              _AmountEntry(
                entered: entered,
                change: change,
                showChange: state.paymentType == PaymentType.cash && change > 0,
                onTap: () => discountFocused.value = false,
              ),
              const SizedBox(height: 14),

              // Quick amount pills
              if (state.paymentType == PaymentType.cash)
                _QuickAmountPills(
                  currentEntered: entered,
                  finalTotal: finalTotal,
                ),

              if (state.paymentType == PaymentType.cash) ...[
                const SizedBox(height: 14),
                // Numpad (large buttons)
                Expanded(child: _Numpad(discountFocused: discountFocused)),
              ] else
                Expanded(
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32),
                      child: Text(
                        S.current.strConfirmCardPayment,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 15,
                          color: _kS500,
                          fontFamily: 'Inter',
                          height: 1.5,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _PayTypeTabs extends StatelessWidget {
  final PaymentState state;
  const _PayTypeTabs({required this.state});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _PayTypePill(
            label: S.current.strCash,
            icon: Icons.payments_outlined,
            isActive: state.paymentType == PaymentType.cash,
            onTap: () => context.read<PaymentBloc>().add(
              const PaymentEvent.updatePaymentType(
                paymentType: PaymentType.cash,
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _PayTypePill(
            label: S.current.strCard,
            icon: Icons.credit_card_outlined,
            isActive: state.paymentType == PaymentType.card,
            onTap: () => context.read<PaymentBloc>().add(
              const PaymentEvent.updatePaymentType(
                paymentType: PaymentType.card,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _PayTypePill extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isActive;
  final VoidCallback onTap;

  const _PayTypePill({
    required this.label,
    required this.icon,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        height: 52,
        decoration: BoxDecoration(
          color: isActive ? _kBrand : Colors.white,
          border: Border.all(color: isActive ? _kBrand : _kS200),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: isActive ? Colors.white : _kS700),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: isActive ? Colors.white : _kS900,
                fontFamily: 'Inter',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

const _kBrand = Color(0xFFFB6633);

class _AmountEntry extends StatelessWidget {
  final int entered;
  final int change;
  final bool showChange;
  final VoidCallback? onTap;

  const _AmountEntry({
    required this.entered,
    required this.change,
    required this.showChange,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 14),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _kS200),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            S.current.strAcceptedAmount,
            style: const TextStyle(fontSize: 13, color: _kS500, fontFamily: 'Inter'),
          ),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                entered > 0 ? entered.formatNWithoutS : '0',
                style: const TextStyle(
                  fontSize: 40,
                  fontWeight: FontWeight.w700,
                  color: _kS900,
                  fontFamily: 'Inter',
                  height: 1.1,
                  letterSpacing: -0.8,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                S.current.strSom,
                style: const TextStyle(
                  fontSize: 14,
                  color: _kS500,
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
          if (showChange) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: _kGreenBg,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    S.current.strChange,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: _kGreen,
                      fontFamily: 'Inter',
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    change.formatN,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: _kGreen,
                      fontFamily: 'Inter',
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    ),
    );
  }
}

class _QuickAmountPills extends StatelessWidget {
  final int currentEntered;
  final int finalTotal;

  const _QuickAmountPills({
    required this.currentEntered,
    required this.finalTotal,
  });

  @override
  Widget build(BuildContext context) {
    final options = <({String label, int? amount})>[
      (label: S.current.strExactAmount, amount: finalTotal),
      (label: '100 000', amount: 100000),
      (label: '200 000', amount: 200000),
      (label: '500 000', amount: 500000),
      (label: '1 000 000', amount: 1000000),
    ];

    return SizedBox(
      // POS minimum touch zone — barmoqqa qulay
      height: 48,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: options.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final opt = options[i];
          final isActive =
              opt.amount != null &&
              currentEntered == opt.amount &&
              opt.amount != 0;
          return _QuickPill(
            label: opt.label,
            isActive: isActive,
            onTap: () => context.read<PaymentBloc>().add(
              PaymentEvent.updateEnterSum(symbol: 'set:${opt.amount ?? 0}'),
            ),
          );
        },
      ),
    );
  }
}

class _QuickPill extends StatelessWidget {
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _QuickPill({
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        padding: const EdgeInsets.symmetric(horizontal: 18),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isActive ? _kBrand : Colors.white,
          border: Border.all(color: isActive ? _kBrand : _kS200),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 15, // PosTypography.bodyMd
            fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
            color: isActive ? Colors.white : _kS700,
            fontFamily: 'Inter',
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
      ),
    );
  }
}

class _Numpad extends StatelessWidget with PaymentScreenMixin {
  final ValueNotifier<bool> discountFocused;
  _Numpad({required this.discountFocused});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: discountFocused,
      builder: (context, isDiscountMode, _) {
        return LayoutBuilder(
          builder: (context, constraints) {
            const cols = 3;
            const spacing = 10.0;
            final cellW = (constraints.maxWidth - spacing * (cols - 1)) / cols;
            final maxCellH = (constraints.maxHeight - spacing * 3) / 4;
            final cellH = maxCellH.clamp(56.0, 80.0);

            return Wrap(
              spacing: spacing,
              runSpacing: spacing,
              children: keyboardKeys.map((key) {
                final isDelete = key == '⌫';
                return SizedBox(
                  width: cellW,
                  height: cellH,
                  child: _NumpadButton(
                    keyLabel: key,
                    isDelete: isDelete,
                    isDiscountMode: isDiscountMode,
                    onTap: () {
                      if (isDiscountMode) {
                        context.read<PaymentBloc>().add(
                          PaymentEvent.updateDiscountAmount(amount: 'numpad:$key'),
                        );
                      } else {
                        context.read<PaymentBloc>().add(
                          PaymentEvent.updateEnterSum(symbol: key),
                        );
                      }
                    },
                  ),
                );
              }).toList(),
            );
          },
        );
      },
    );
  }
}

class _NumpadButton extends StatefulWidget {
  final String keyLabel;
  final bool isDelete;
  final bool isDiscountMode;
  final VoidCallback onTap;

  const _NumpadButton({
    required this.keyLabel,
    required this.isDelete,
    required this.isDiscountMode,
    required this.onTap,
  });

  @override
  State<_NumpadButton> createState() => _NumpadButtonState();
}

class _NumpadButtonState extends State<_NumpadButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final bg = widget.isDelete
        ? (_pressed ? const Color(0xFFFBCDD8) : _kRedBg)
        : widget.isDiscountMode
            ? (_pressed ? const Color(0xFFFDD9CC) : const Color(0xFFFEEDE8))
            : (_pressed ? _kS200 : _kS100);
    return GestureDetector(
      onTap: widget.onTap,
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 80),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(10),
          border: widget.isDiscountMode && !widget.isDelete
              ? Border.all(color: _kBrand.withOpacity(0.3))
              : null,
        ),
        child: Center(
          child: widget.isDelete
              ? Icon(Icons.backspace_outlined, size: 22, color: widget.isDiscountMode ? _kBrand : _kRed)
              : Text(
                  widget.keyLabel,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w600,
                    color: widget.isDiscountMode ? _kBrand : _kS900,
                    fontFamily: 'Inter',
                  ),
                ),
        ),
      ),
    );
  }
}
