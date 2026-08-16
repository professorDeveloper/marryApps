import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/number_formatter.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

class SplitBillModal extends StatefulWidget {
  final String tableNumber;
  final int totalAmount;
  final int guestCount;
  final VoidCallback? onConfirm;

  const SplitBillModal({
    super.key,
    required this.tableNumber,
    required this.totalAmount,
    required this.guestCount,
    this.onConfirm,
  });

  @override
  State<SplitBillModal> createState() => _SplitBillModalState();
}

class _SplitBillModalState extends State<SplitBillModal> {
  late int _selectedTipPercent;

  @override
  void initState() {
    super.initState();
    _selectedTipPercent = 0;
  }

  int get _perPersonAmount => (widget.totalAmount / widget.guestCount).ceil();

  int get _tipAmount => ((widget.totalAmount * _selectedTipPercent) ~/ 100);

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        width: 420,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: colors.bgDefault,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'To\'lovni bo\'lish',
                      style: context.textStyles.bold20.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${widget.tableNumber}-stol',
                      style: context.textStyles.bodySm.copyWith(
                        color: colors.textSecondary,
                      ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: const Icon(Icons.close, size: 24),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Total info
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                spacing: 12,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(S.current.strTotalLabel, style: context.textStyles.bodySm),
                      Text(
                        widget.totalAmount.formatN,
                        style: context.textStyles.bold18.copyWith(
                          color: const Color(0xFFFB6633),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                  Container(height: 1, color: colors.border),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Har bir kishi (${widget.guestCount}):',
                        style: context.textStyles.bodySm,
                      ),
                      Text(
                        _perPersonAmount.formatN,
                        style: context.textStyles.bold16.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Tip section
            Text(
              'Tip qo\'shish',
              style: context.textStyles.bodySm.copyWith(
                fontWeight: FontWeight.w600,
                color: colors.textDefault,
              ),
            ),
            const SizedBox(height: 10),

            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [10, 15, 20, 25].map((percent) {
                final isSelected = _selectedTipPercent == percent;
                return GestureDetector(
                  onTap: () {
                    setState(() => _selectedTipPercent = percent);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? const Color(0xFFFB6633)
                          : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isSelected
                            ? const Color(0xFFFB6633)
                            : colors.border,
                      ),
                    ),
                    child: Column(
                      children: [
                        Text(
                          '$percent%',
                          style: context.textStyles.bodySm.copyWith(
                            color: isSelected
                                ? Colors.white
                                : colors.textDefault,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          (_perPersonAmount * percent ~/ 100).formatN,
                          style: context.textStyles.bodySm.copyWith(
                            color: isSelected
                                ? Colors.white
                                : colors.textSecondary,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 20),

            // Final total with tip
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF3EE),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: const Color(0xFFFB6633).withOpacity(0.2),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Jami Tip:',
                    style: context.textStyles.bodySm.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    _tipAmount.formatN,
                    style: context.textStyles.bold18.copyWith(
                      color: const Color(0xFFFB6633),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Buttons
            Row(
              spacing: 12,
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Center(
                        child: Text(
                          'Bekor qilish',
                          style: context.textStyles.bodySm.copyWith(
                            color: colors.textDefault,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      widget.onConfirm?.call();
                      Navigator.pop(context);
                    },
                    child: Container(
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFB6633),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Center(
                        child: Text(
                          'Tasdiqla',
                          style: context.textStyles.bodySm.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
