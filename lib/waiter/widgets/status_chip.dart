import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/theme/slate_dawn.dart';

enum StatusTone { success, warning, danger, neutral }

/// Slate Dawn §7 — status har doim **yumshoq chip**: yarim shaffof fon +
/// mos keluvchi matn rangi. Hech qachon to'liq to'ldirilgan emas (to'liq
/// to'ldirish faqat accent CTA uchun).
class StatusChip extends StatelessWidget {
  final String text;
  final StatusTone tone;
  final IconData? icon;

  /// `true` bo'lsa butun kenglikni egallaydi (xato xabarlari uchun).
  final bool expand;

  const StatusChip({
    super.key,
    required this.text,
    this.tone = StatusTone.neutral,
    this.icon,
    this.expand = false,
  });

  @override
  Widget build(BuildContext context) {
    final sd = context.sd;
    final color = switch (tone) {
      StatusTone.success => sd.success,
      StatusTone.warning => sd.warning,
      StatusTone.danger => sd.danger,
      StatusTone.neutral => sd.text2,
    };

    final chip = Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 10,
        vertical: SlateDawn.spaceSm,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(SlateDawn.radius),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 15, color: color),
            const SizedBox(width: SlateDawn.spaceXs),
          ],
          Flexible(
            child: Text(
              text,
              style: TextStyle(
                color: color,
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );

    return expand ? SizedBox(width: double.infinity, child: chip) : chip;
  }
}
