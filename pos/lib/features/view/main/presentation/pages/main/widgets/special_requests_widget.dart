import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';

class SpecialRequestsWidget extends StatefulWidget {
  final VoidCallback? onSelectionChanged;

  const SpecialRequestsWidget({
    super.key,
    this.onSelectionChanged,
  });

  @override
  State<SpecialRequestsWidget> createState() => _SpecialRequestsWidgetState();
}

class _SpecialRequestsWidgetState extends State<SpecialRequestsWidget> {
  final Map<String, bool> _selectedRequests = {
    'Tez tayyor qil': false,
    'Sotsiz': false,
    'Qo\'shimcha yog\'siz': false,
    'Juda pichan': false,
  };

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
                Text(
                  'Maxsus so\'rovlar',
                  style: context.textStyles.bold20.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: const Icon(Icons.close, size: 24),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Requests list
            Column(
              spacing: 12,
              children: _selectedRequests.entries.map((entry) {
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedRequests[entry.key] = !entry.value;
                    });
                    widget.onSelectionChanged?.call();
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: entry.value
                          ? const Color(0xFFFFF3EE)
                          : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: entry.value
                            ? const Color(0xFFFB6633).withOpacity(0.3)
                            : colors.border,
                      ),
                    ),
                    child: Row(
                      spacing: 12,
                      children: [
                        Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            color: entry.value
                                ? const Color(0xFFFB6633)
                                : Colors.transparent,
                            border: Border.all(
                              color: entry.value
                                  ? const Color(0xFFFB6633)
                                  : colors.border,
                              width: 2,
                            ),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: entry.value
                              ? const Icon(
                                  Icons.check,
                                  size: 14,
                                  color: Colors.white,
                                )
                              : null,
                        ),
                        Text(
                          entry.key,
                          style: context.textStyles.bodySm.copyWith(
                            color: colors.textDefault,
                            fontWeight:
                                entry.value ? FontWeight.w600 : FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
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
                          'Saqlash',
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
