import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/design_system/pos_design_system.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/core/utils/user_role_permissions.dart';
import 'package:mary_ai_pos/core/values/app_assets.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/bloc/user_bloc.dart';
import 'package:mary_ai_pos/generated/l10n.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/logout_dialog.dart';

const _kBrand = Color(0xFFFB6633);
const _kSlate900 = Color(0xFF0F172A);
const _kSlate500 = Color(0xFF64748B);
const _kSlate200 = Color(0xFFE2E8F0);

class AppSidebar extends StatelessWidget {
  final String activeRoute;
  const AppSidebar({super.key, required this.activeRoute});

  @override
  Widget build(BuildContext context) {
    final role = context.select((UserBloc b) => b.state.userMOdel?.role);
    final canManageMenu = role.canManageMenu;
    final canAccessSettings = role.canAccessSettings;
    final canManageShift = role.canManageShift;

    return Container(
      // Compact ekranlarda kichikroq sidebar — products grid'ga joy beradi
      width: PosBreakpoints.pick<double>(
        context,
        compact: 88,
        comfortable: 100,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(right: BorderSide(color: _kSlate200)),
      ),
      child: Column(
        children: [
          // Logo — umumiy kvadrat (sidebar eni × sidebar eni)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: PosDimensions.s),
            child: Image.asset(
              AppImages.imgBrandLogo,
              width: PosBreakpoints.pick<double>(
                context,
                compact: 72,
                comfortable: 84,
              ),
              height: PosBreakpoints.pick<double>(
                context,
                compact: 72,
                comfortable: 84,
              ),
              fit: BoxFit.contain,
              filterQuality: FilterQuality.high,
            ),
          ),
          Container(height: 1, color: _kSlate200),
          const SizedBox(height: PosDimensions.m),

          // Nav items — virtual klaviatura ochilganda balandlik qisqarsa
          // overflow bermasin uchun scroll'da ko'rinadi. Scrollbar yashirin —
          // shunchaki sirpanadi.
          Expanded(
            child: ScrollConfiguration(
              behavior: ScrollConfiguration.of(context).copyWith(
                scrollbars: false,
                overscroll: false,
              ),
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    _NavItem(
                      icon: _IconTables(),
                      label: S.current.strTables,
                      isActive: activeRoute == AppRoutes.mainScreen,
                      onTap: () => _navigate(context, AppRoutes.mainScreen),
                    ),
                    _NavItem(
                      icon: _IconArchive(),
                      label: S.current.strArchive,
                      isActive: activeRoute == AppRoutes.archiveScreen,
                      onTap: () => _navigate(context, AppRoutes.archiveScreen),
                    ),
                    if (canManageShift)
                      _NavItem(
                        icon: _IconShift(),
                        label: S.current.strShift,
                        isActive: activeRoute == AppRoutes.closeShiftScreen,
                        onTap: () =>
                            _navigate(context, AppRoutes.closeShiftScreen),
                      ),
                    if (canManageMenu)
                      _NavItem(
                        icon: _IconMenu(),
                        label: S.current.strMenu,
                        isActive: activeRoute == AppRoutes.menuMealsScreen ||
                            activeRoute == AppRoutes.menuManageScreen,
                        onTap: () =>
                            _navigate(context, AppRoutes.menuMealsScreen),
                      ),
                    if (canAccessSettings)
                      _NavItem(
                        icon: _IconSettings(),
                        label: S.current.strSettings,
                        isActive: activeRoute == AppRoutes.settingsScreen,
                        onTap: () =>
                            _navigate(context, AppRoutes.settingsScreen),
                      ),
                  ],
                ),
              ),
            ),
          ),

          // Logout
          Container(height: 1, color: _kSlate200),
          Padding(
            padding: const EdgeInsets.only(bottom: 8, top: 4),
            child: _NavItem(
              icon: _IconLogout(),
              label: S.current.strLogout,
              isActive: false,
              isDestructive: true,
              onTap: () {
                showDialog(
                  context: context,
                  barrierDismissible: false,
                  builder: (_) => const LogoutDialog(
                    routeName: AppRoutes.loginPinScreen,
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _navigate(BuildContext context, String route) {
    if (ModalRoute.of(context)?.settings.name == route) return;
    Navigator.pushReplacementNamed(context, route);
  }
}

class _NavItem extends StatefulWidget {
  final Widget icon;
  final String label;
  final bool isActive;
  final bool isDestructive;
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onTap,
    this.isDestructive = false,
  });

  @override
  State<_NavItem> createState() => _NavItemState();
}

class _NavItemState extends State<_NavItem> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final activeIconColor =
        widget.isDestructive ? const Color(0xFFEF4444) : _kBrand;
    final inactiveIconColor = widget.isDestructive
        ? const Color(0xFFEF4444).withOpacity(0.8)
        : _kSlate500;
    final activeLabelColor =
        widget.isDestructive ? const Color(0xFFEF4444) : _kSlate900;
    const inactiveLabelColor = _kSlate500;

    final bgColor = widget.isActive
        ? const Color(0x1AFB6633)
        : _hovered
            ? const Color(0x0DFB6633)
            : Colors.transparent;

    final iconColor = widget.isActive ? activeIconColor : inactiveIconColor;
    final labelColor = widget.isActive ? activeLabelColor : inactiveLabelColor;

    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: widget.onTap,
        child: AnimatedContainer(
          width: double.infinity,
          duration: const Duration(milliseconds: 150),
          // POS minimum touch zone (icon + label)
          margin: const EdgeInsets.symmetric(
            horizontal: PosDimensions.s,
            vertical: PosDimensions.xs,
          ),
          padding: const EdgeInsets.symmetric(
            vertical: PosDimensions.m,
            horizontal: PosDimensions.xs,
          ),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(PosDimensions.radiusMd),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconTheme(
                data: IconThemeData(color: iconColor, size: 26),
                child: widget.icon,
              ),
              const SizedBox(height: PosDimensions.xs + 2),
              Text(
                widget.label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  // POS minimum readable size — 11→12
                  fontSize: PosTypography.captionSm, // 12
                  fontWeight:
                      widget.isActive ? FontWeight.w600 : FontWeight.w500,
                  color: labelColor,
                  fontFamily: PosTypography.family,
                  letterSpacing: 0.1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Custom SVG-like icons via paths ───────────────────────────────────────

class _IconTables extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = IconTheme.of(context);
    return CustomPaint(
      size: Size(theme.size ?? 26, theme.size ?? 26),
      painter: _TablesPainter(theme.color!),
    );
  }
}

class _TablesPainter extends CustomPainter {
  final Color color;
  _TablesPainter(this.color);
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    // 4 teng kvadrat — chizish 22px asosida, size ga mos skalaplanadi.
    final scale = size.width / 22;
    final r = Radius.circular(1.8 * scale);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
          Rect.fromLTWH(2 * scale, 2 * scale, 8 * scale, 8 * scale), r),
      p,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
          Rect.fromLTWH(12 * scale, 2 * scale, 8 * scale, 8 * scale), r),
      p,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
          Rect.fromLTWH(2 * scale, 12 * scale, 8 * scale, 8 * scale), r),
      p,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
          Rect.fromLTWH(12 * scale, 12 * scale, 8 * scale, 8 * scale), r),
      p,
    );
  }

  @override
  bool shouldRepaint(_TablesPainter old) => old.color != color;
}

class _IconMenu extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final t = IconTheme.of(context);
    return Icon(Icons.menu_rounded, size: t.size, color: t.color);
  }
}

class _IconArchive extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final t = IconTheme.of(context);
    return Icon(Icons.archive_outlined, size: t.size, color: t.color);
  }
}

class _IconShift extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final t = IconTheme.of(context);
    return Icon(Icons.bar_chart_rounded, size: t.size, color: t.color);
  }
}

class _IconSettings extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final t = IconTheme.of(context);
    return Icon(Icons.settings_outlined, size: t.size, color: t.color);
  }
}

class _IconLogout extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final t = IconTheme.of(context);
    return Icon(Icons.logout_rounded, size: t.size, color: t.color);
  }
}
