import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/design_system/pos_design_system.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/bloc/user_bloc.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/settings/settings_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/shift/shift_bloc.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

const _kSlate200 = Color(0xFFE2E8F0);
const _kSlate500 = Color(0xFF64748B);
const _kSlate900 = Color(0xFF0F172A);
const _kGreen600 = Color(0xFF16A34A);
const _kIndigo = Color(0xFF6366F1);

class MainHeader extends StatelessWidget {
  final Widget? titleWidget;
  final String title;
  final Widget? leading;
  final Widget? trailing;

  const MainHeader({
    super.key,
    this.title = '',
    this.titleWidget,
    this.leading,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      // POS-grade header: 72dp asosiy height (DS subBar 56 emas — chip'lar ko'p)
      height: 72,
      padding: EdgeInsetsDirectional.symmetric(
        horizontal: PosBreakpoints.pick<double>(
          context,
          compact: PosDimensions.l, // 16
          comfortable: PosDimensions.xl, // 20
        ),
        vertical: PosDimensions.m, // 12
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: _kSlate200)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Left: leading + title
          Flexible(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (leading != null) ...[
                  leading!,
                  const SizedBox(width: PosDimensions.s),
                ],
                if (titleWidget != null)
                  Flexible(child: titleWidget!)
                else if (title.isNotEmpty)
                  Flexible(
                    child: Text(
                      title,
                      style: const TextStyle(
                        fontSize: PosTypography.headlineSm,
                        // 20
                        fontWeight: FontWeight.w700,
                        color: _kSlate900,
                        fontFamily: PosTypography.family,
                        letterSpacing: -0.3,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
              ],
            ),
          ),
          // Right: trailing + chips
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (trailing != null) ...[
                trailing!,
                const SizedBox(width: PosDimensions.s),
              ],
              // Shift chip
              const _ShiftChip(),
              const SizedBox(width: 6),
              // Cashier chip
              const _CashierChip(),
              const SizedBox(width: 6),
              // Clock
              const _ClockChip(),
              const SizedBox(width: 6),
              // Language toggle
              const _LangToggle(),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Shift chip ─────────────────────────────────────────────────────────────

class _ShiftChip extends StatelessWidget {
  const _ShiftChip();

  @override
  Widget build(BuildContext context) {
    // Til o'zgarganda S.current ni qayta o'qish uchun SettingsCubit'ga dependency
    context.select((SettingsCubit c) => c.state.language);
    final shift = context.select((ShiftBloc b) => b.state.shift);
    final openedAt = shift?.openedAt;
    final timeStr = openedAt != null
        ? '${openedAt.hour.toString().padLeft(2, '0')}:${openedAt.minute.toString().padLeft(2, '0')}'
        : '--:--';

    return _Chip(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: _kGreen600,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: _kGreen600.withOpacity(0.3),
                  blurRadius: 0,
                  spreadRadius: 3,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                S.current.strShift,
                style: const TextStyle(
                  fontSize: 11,
                  color: _kSlate500,
                  fontWeight: FontWeight.w400,
                  fontFamily: 'Inter',
                ),
              ),
              Text(
                timeStr,
                style: const TextStyle(
                  fontSize: 13,
                  color: _kSlate900,
                  fontWeight: FontWeight.w500,
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Cashier chip ────────────────────────────────────────────────────────────

class _CashierChip extends StatelessWidget {
  const _CashierChip();

  @override
  Widget build(BuildContext context) {
    context.select((SettingsCubit c) => c.state.language);
    final user = context.select((UserBloc b) => b.state.userMOdel);
    if (user == null) return const SizedBox.shrink();

    final name = user.fullName;
    final parts = name.trim().split(' ');
    final initials = parts.length >= 2
        ? '${parts[0][0]}${parts[1][0]}'.toUpperCase()
        : name.isNotEmpty
        ? name.substring(0, name.length.clamp(0, 2)).toUpperCase()
        : '?';
    final shortName = parts.isNotEmpty
        ? '${parts[0]}${parts.length > 1 ? ' ${parts[1][0]}.' : ''}'
        : name;
    final roleLabel = _roleLabel(user.role);

    return _Chip(
      padding: const EdgeInsets.fromLTRB(4, 4, 12, 4),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: _kIndigo,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                initials,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  fontFamily: 'Inter',
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                roleLabel,
                style: const TextStyle(
                  fontSize: 11,
                  color: _kSlate500,
                  fontWeight: FontWeight.w400,
                  fontFamily: 'Inter',
                ),
              ),
              Text(
                shortName,
                style: const TextStyle(
                  fontSize: 13,
                  color: _kSlate900,
                  fontWeight: FontWeight.w500,
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _roleLabel(UserRole? role) {
    if (role == null || role == UserRole.none) return '';
    return switch (role) {
      UserRole.admin => S.current.strRoleAdmin,
      UserRole.superadmin => S.current.strRoleSuperadmin,
      UserRole.manager => S.current.strRoleManager,
      UserRole.cashier => S.current.strRoleCashier,
      UserRole.waiter => S.current.strRoleWaiter,
      UserRole.kitchen => S.current.strRoleChef,
      UserRole.user => S.current.strRoleUser,
      UserRole.none => '',
    };
  }
}

// ─── Clock chip ──────────────────────────────────────────────────────────────

class _ClockChip extends StatefulWidget {
  const _ClockChip();

  @override
  State<_ClockChip> createState() => _ClockChipState();
}

class _ClockChipState extends State<_ClockChip> {
  late DateTime _now;
  late Timer _timer;

  @override
  void initState() {
    super.initState();
    _now = DateTime.now();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) {
      setState(() => _now = DateTime.now());
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.select((SettingsCubit c) => c.state.language);
    final hh = _now.hour.toString().padLeft(2, '0');
    final mm = _now.minute.toString().padLeft(2, '0');
    final dayStr =
        '${_dayShort(_now.weekday, lang)}, ${_now.day} ${_monthShort(_now.month, lang)}';

    return _Chip(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            '$hh:$mm',
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: _kSlate900,
              fontFamily: 'Inter',
              fontFeatures: [FontFeature.tabularFigures()],
              height: 1,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            dayStr,
            style: const TextStyle(
              fontSize: 10,
              color: _kSlate500,
              fontWeight: FontWeight.w400,
              fontFamily: 'Inter',
            ),
          ),
        ],
      ),
    );
  }

  String _dayShort(int weekday, String lang) {
    const uz = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
    const ru = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const en = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    final idx = weekday - 1;
    switch (lang) {
      case 'ru':
        return ru[idx];
      case 'en':
        return en[idx];
      default:
        return uz[idx];
    }
  }

  String _monthShort(int m, String lang) {
    const uz = [
      'yan', 'fev', 'mar', 'apr', 'may', 'iyn',
      'iyl', 'avg', 'sen', 'okt', 'noy', 'dek',
    ];
    const ru = [
      'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
      'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
    ];
    const en = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
    ];
    final idx = m - 1;
    switch (lang) {
      case 'ru':
        return ru[idx];
      case 'en':
        return en[idx];
      default:
        return uz[idx];
    }
  }
}

// ─── Language toggle ─────────────────────────────────────────────────────────

class _LangToggle extends StatelessWidget {
  const _LangToggle();

  @override
  Widget build(BuildContext context) {
    final lang = context.select((SettingsCubit c) => c.state.language);
    return Container(
      height: 48,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: _kSlate200),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: ['uz', 'ru'].map((code) {
          final selected = lang == code;
          return GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => context.read<SettingsCubit>().saveAppLang(
              context,
              languageCode: code,
            ),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              constraints: const BoxConstraints(minWidth: 56),
              alignment: Alignment.center,
              padding: const EdgeInsets.symmetric(horizontal: 18),
              decoration: BoxDecoration(
                color: selected ? Colors.white : Colors.transparent,
                borderRadius: BorderRadius.circular(PosDimensions.radiusSm - 1),
                boxShadow: selected
                    ? [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.06),
                          blurRadius: 2,
                          offset: const Offset(0, 1),
                        ),
                      ]
                    : null,
              ),
              child: Text(
                code.toUpperCase(),
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: PosTypography.bodyMd, // 15
                  fontWeight: FontWeight.w700,
                  color: selected ? _kSlate900 : _kSlate500,
                  fontFamily: PosTypography.family,
                  letterSpacing: 0.3,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ─── Chip container ──────────────────────────────────────────────────────────

class _Chip extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;

  const _Chip({required this.child, this.padding});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 48,
      padding:
          padding ?? const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: _kSlate200),
      ),
      child: child,
    );
  }
}
