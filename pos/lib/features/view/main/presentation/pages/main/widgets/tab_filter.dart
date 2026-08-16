import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/common/custom_shimmer_container.dart';
import 'package:mary_ai_pos/core/services/cache/cache_service.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/hall/hall_model.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/main/main_cubit.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

const _kS900 = Color(0xFF0F172A);
const _kS500 = Color(0xFF64748B);
const _kS200 = Color(0xFFE2E8F0);
const _kS50 = Color(0xFFF8FAFC);
const _kBrand = Color(0xFFFB6633);

/// Hall filter pill row.
///
/// Includes a leading "Barchasi (N)" option that aggregates all halls.
class TabFilter extends StatelessWidget {
  final String? selectedHallId;
  final List<HallModel> halls;
  final List<CafeTableModel> tables;
  final bool isLoading;

  /// Enables the leading "Barchasi" pill that unsets the hall filter
  /// via [MainCubit.loadAllHallsTables].
  final bool showAllOption;

  const TabFilter({
    super.key,
    required this.halls,
    this.selectedHallId,
    this.tables = const [],
    required this.isLoading,
    this.showAllOption = true,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return SizedBox(
        height: 42,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: 4,
          separatorBuilder: (_, _) => const SizedBox(width: 8),
          itemBuilder: (_, _) => CustomShimmerBox(
            h: 42,
            w: 120,
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      );
    }

    // Counts: cache dagi barcha stollarni o'qib, har zal bo'yicha hisoblaymiz.
    // Shuning uchun zal tanlovi o'zgarsa ham countlar turg'un qoladi.
    final allCached = inject<CacheService>()
        .getTables()
        .map((e) => CafeTableModel.fromJson(e))
        .toList();
    final bool useCache = allCached.isNotEmpty;
    final int allCount = useCache ? allCached.length : tables.length;
    int countFor(String hallId) {
      if (useCache) {
        return allCached.where((t) => t.hallId == hallId).length;
      }
      return tables.where((t) => t.hallId == hallId).length;
    }

    return SizedBox(
      height: 42,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          if (showAllOption) ...[
            _HallPill(
              label: S.current.strAllHalls,
              count: allCount,
              isActive: selectedHallId == null,
              onTap: () => inject<MainCubit>().loadAllHallsTables(),
            ),
            const SizedBox(width: 8),
          ],
          ...List.generate(halls.length, (i) {
            final hall = halls[i];
            return Padding(
              padding: EdgeInsets.only(right: i == halls.length - 1 ? 0 : 8),
              child: _HallPill(
                label: hall.name,
                count: countFor(hall.id),
                isActive: hall.id == selectedHallId,
                onTap: () => inject<MainCubit>().setSelectedHallId(hall.id),
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _HallPill extends StatefulWidget {
  final String label;
  final int count;
  final bool isActive;
  final VoidCallback onTap;

  const _HallPill({
    required this.label,
    required this.count,
    required this.isActive,
    required this.onTap,
  });

  @override
  State<_HallPill> createState() => _HallPillState();
}

class _HallPillState extends State<_HallPill> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final active = widget.isActive;
    final Color bg;
    final Color border;
    final Color textColor;

    if (active) {
      bg = _kBrand;
      border = _kBrand;
      textColor = Colors.white;
    } else if (_hovered) {
      bg = _kS50;
      border = _kS200;
      textColor = _kS900;
    } else {
      bg = Colors.white;
      border = _kS200;
      textColor = _kS500;
    }

    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          height: 46,
          padding: const EdgeInsets.symmetric(horizontal: 18),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: border),
          ),
          alignment: Alignment.center,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                widget.label,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: active ? FontWeight.w600 : FontWeight.w500,
                  color: textColor,
                  fontFamily: 'Inter',
                  letterSpacing: -0.1,
                ),
              ),
              const SizedBox(width: 6),
              Text(
                '(${widget.count})',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: active ? Colors.white.withOpacity(0.8) : _kS500,
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
