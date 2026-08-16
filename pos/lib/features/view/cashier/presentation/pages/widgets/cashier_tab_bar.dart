import 'package:flutter/material.dart';

/// Kassir dashboard: Taomlar, Kassa, Hisoblar, Sozlamalar.
class CashierTabBar extends StatelessWidget {
  const CashierTabBar({
    super.key,
    required this.selectedTab,
    required this.onTabChanged,
  });

  final int selectedTab;
  final ValueChanged<int> onTabChanged;

  static const _labels = ['Taomlar', 'Kassa', 'Hisoblar', 'Sozlamalar'];

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 48,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: _labels.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final selected = selectedTab == index;
          return ChoiceChip(
            label: Text(_labels[index]),
            selected: selected,
            onSelected: (_) => onTabChanged(index),
          );
        },
      ),
    );
  }
}
