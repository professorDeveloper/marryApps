import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/design_system/pos_design_system.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/core/theme/tokens/theme_colors.dart';
import 'package:mary_ai_pos/core/utils/user_role_permissions.dart';
import 'package:mary_ai_pos/generated/l10n.dart';
import 'package:mary_ai_pos/core/widgets/app_scaffold.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/bloc/user_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/main_header.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/settings/sections/appearance_section.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/settings/sections/halls_tables_section.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/settings/sections/printers_section.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/settings/sections/lan_network_section.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/settings/sections/receipt_info_section.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/settings/sections/users_section.dart';

enum SettingsSection {
  users,
  hallsTables,
  appearance,
  printers,
  receiptInfo,
  lanNetwork,
}

extension _SectionMeta on SettingsSection {
  IconData get icon {
    switch (this) {
      case SettingsSection.users:
        return Icons.people_alt_outlined;
      case SettingsSection.hallsTables:
        return Icons.table_restaurant_outlined;
      case SettingsSection.appearance:
        return Icons.tune_rounded;
      case SettingsSection.printers:
        return Icons.print_outlined;
      case SettingsSection.receiptInfo:
        return Icons.receipt_long_outlined;
      case SettingsSection.lanNetwork:
        return Icons.router_outlined;
    }
  }

  String get label {
    switch (this) {
      case SettingsSection.users:
        return S.current.strRestaurantStaff;
      case SettingsSection.hallsTables:
        return S.current.strHalls;
      case SettingsSection.appearance:
        return S.current.strSettings;
      case SettingsSection.printers:
        return S.current.strPrinterSettings;
      case SettingsSection.receiptInfo:
        return "Chek ma'lumotlari";
      case SettingsSection.lanNetwork:
        return S.current.strLanNetwork;
    }
  }

  String get description {
    switch (this) {
      case SettingsSection.users:
        return S.current.strStaffRoles;
      case SettingsSection.hallsTables:
        return S.current.strHallsAndTables;
      case SettingsSection.appearance:
        return S.current.strLanguageAndGeneral;
      case SettingsSection.printers:
        return S.current.strEscPosDevices;
      case SettingsSection.receiptInfo:
        return 'Nom, manzil, telefon, STIR';
      case SettingsSection.lanNetwork:
        return S.current.strHubClientSettings;
    }
  }
}

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  SettingsSection _section = SettingsSection.users;

  @override
  Widget build(BuildContext context) {
    final role = context.select((UserBloc b) => b.state.userMOdel?.role);
    final allowed = role.canAccessSettings;
    final colors = context.colors;

    return AppScaffold(
      activeRoute: AppRoutes.settingsScreen,
      body: Column(
        children: [
          MainHeader(title: S.current.strSettings),
          Expanded(
            child: Container(
              color: colors.bgSecondary,
              child: !allowed
                  ? _AccessDenied(colors: colors)
                  : Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _SettingsSideNav(
                          current: _section,
                          onChange: (s) => setState(() => _section = s),
                        ),
                        Expanded(
                          child: Container(
                            color: colors.bgDefault,
                            child: AnimatedSwitcher(
                              duration: const Duration(milliseconds: 220),
                              switchInCurve: Curves.easeOutCubic,
                              switchOutCurve: Curves.easeInCubic,
                              transitionBuilder: (child, animation) {
                                return FadeTransition(
                                  opacity: animation,
                                  child: SlideTransition(
                                    position: Tween<Offset>(
                                      begin: const Offset(0.015, 0),
                                      end: Offset.zero,
                                    ).animate(animation),
                                    child: child,
                                  ),
                                );
                              },
                              child: _sectionBody(),
                            ),
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionBody() {
    switch (_section) {
      case SettingsSection.appearance:
        return const AppearanceSection(key: ValueKey('appearance'));
      case SettingsSection.printers:
        return const PrintersSection(key: ValueKey('printers'));
      case SettingsSection.users:
        return const UsersSection(key: ValueKey('users'));
      case SettingsSection.hallsTables:
        return const HallsTablesSection(key: ValueKey('hallsTables'));
      case SettingsSection.receiptInfo:
        return const ReceiptInfoSection(key: ValueKey('receiptInfo'));
      case SettingsSection.lanNetwork:
        return const LanNetworkSection(key: ValueKey('lanNetwork'));
    }
  }
}

class _AccessDenied extends StatelessWidget {
  final ThemeColors colors;
  const _AccessDenied({required this.colors});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 360,
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: colors.bgDefault,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: colors.border),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: colors.systemError.withOpacity(0.10),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(Icons.lock_outline,
                  size: 28, color: colors.systemError),
            ),
            const SizedBox(height: 14),
            Text(
              S.current.strAccessRestricted,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: colors.textDefault,
                fontFamily: 'Inter',
              ),
            ),
            const SizedBox(height: 6),
            Text(
              S.current.strSettingsAdminOnly,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: colors.textSecondary,
                fontFamily: 'Inter',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SettingsSideNav extends StatelessWidget {
  final SettingsSection current;
  final ValueChanged<SettingsSection> onChange;
  const _SettingsSideNav({required this.current, required this.onChange});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      width: PosBreakpoints.pick<double>(
        context,
        compact: 220,
        comfortable: 280,
      ),
      decoration: BoxDecoration(
        color: colors.bgSecondary,
        border: Border(right: BorderSide(color: colors.border)),
      ),
      padding: const EdgeInsets.fromLTRB(
        PosDimensions.l,
        PosDimensions.xxl,
        PosDimensions.l,
        PosDimensions.l,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 6, bottom: PosDimensions.m),
            child: Text(
              S.current.strSettings.toUpperCase(),
              style: TextStyle(
                fontSize: PosTypography.captionSm, // 12
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2,
                color: colors.textSecondary,
                fontFamily: PosTypography.family,
              ),
            ),
          ),
          ...SettingsSection.values.map(
            (s) => _NavItem(
              section: s,
              selected: current == s,
              onTap: () => onChange(s),
            ),
          ),
        ],
      ),
    );
  }
}

class _NavItem extends StatefulWidget {
  final SettingsSection section;
  final bool selected;
  final VoidCallback onTap;

  const _NavItem({
    required this.section,
    required this.selected,
    required this.onTap,
  });

  @override
  State<_NavItem> createState() => _NavItemState();
}

class _NavItemState extends State<_NavItem> {
  bool _hover = false;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final selected = widget.selected;
    // Hover holatida ham aktiv brand fonidan yumshoqroq variant ko'rsatamiz —
    // ilgari `bgDefault` ishlatilar edi va ikona pill bilan birga "kulrang/loy"
    // ko'rinishini hosil qilardi. Endi soya bitta brand oilasida turadi.
    final bgColor = selected
        ? colors.buttonBrand.withOpacity(0.12)
        : (_hover ? colors.buttonBrand.withOpacity(0.06) : Colors.transparent);
    final iconBg = selected
        ? colors.buttonBrand
        : (_hover ? colors.buttonBrand.withOpacity(0.10) : colors.bgDefault);
    final iconColor = selected
        ? colors.textOnBrand
        : (_hover ? colors.buttonBrand : colors.textSecondary);
    final titleColor = selected ? colors.buttonBrand : colors.textDefault;

    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: MouseRegion(
        onEnter: (_) => setState(() => _hover = true),
        onExit: (_) => setState(() => _hover = false),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 140),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: widget.onTap,
              child: Padding(
                // POS-friendly tap zone (~56dp height)
                padding: const EdgeInsets.symmetric(
                    horizontal: PosDimensions.m, vertical: PosDimensions.m),
                child: Row(
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 140),
                      // POS-friendly icon container
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: iconBg,
                        borderRadius:
                            BorderRadius.circular(PosDimensions.radiusSm),
                        border: selected
                            ? null
                            : Border.all(
                                color: _hover
                                    ? colors.buttonBrand.withOpacity(0.30)
                                    : colors.border,
                              ),
                      ),
                      child: Icon(widget.section.icon,
                          size: 20, color: iconColor),
                    ),
                    const SizedBox(width: PosDimensions.m),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.section.label,
                            style: TextStyle(
                              fontSize: PosTypography.bodyMd, // 15
                              fontWeight: FontWeight.w600,
                              color: titleColor,
                              fontFamily: PosTypography.family,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            widget.section.description,
                            style: TextStyle(
                              fontSize: PosTypography.captionSm, // 12
                              fontWeight: FontWeight.w500,
                              color: colors.textSecondary,
                              fontFamily: PosTypography.family,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (selected)
                      Icon(Icons.chevron_right_rounded,
                          size: 20, color: colors.buttonBrand),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
