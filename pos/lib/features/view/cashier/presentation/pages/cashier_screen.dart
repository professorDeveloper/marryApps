import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/core/widgets/app_scaffold.dart';
import 'package:mary_ai_pos/features/view/cashier/presentation/pages/widgets/cashier_bottom_bar.dart';
import 'package:mary_ai_pos/features/view/cashier/presentation/pages/widgets/cashier_tab_bar.dart';
import 'package:mary_ai_pos/features/view/cashier/presentation/pages/widgets/tab_kassa/kassa_tab.dart';
import 'package:mary_ai_pos/features/view/cashier/presentation/pages/widgets/tab_dishes/dishes_tab.dart';
import 'package:mary_ai_pos/features/view/cashier/presentation/pages/widgets/tab_bills/bills_tab.dart';
import 'package:mary_ai_pos/features/view/cashier/presentation/pages/widgets/tab_settings/settings_tab.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/main_header.dart';

class CashierScreen extends StatefulWidget {
  const CashierScreen({super.key});

  @override
  State<CashierScreen> createState() => _CashierScreenState();
}

class _CashierScreenState extends State<CashierScreen> {
  int _selectedTab = 1; // Default: Касса tab (index 1)

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      activeRoute: AppRoutes.mainScreen,
      body: Column(
        children: [
          // Header
          const MainHeader(title: 'Kassir Dashboard'),

          // Tab bar
          CashierTabBar(
            selectedTab: _selectedTab,
            onTabChanged: (index) {
              setState(() => _selectedTab = index);
            },
          ),

          // Content area
          Expanded(
            child: _buildTabContent(_selectedTab),
          ),

          // Bottom info bar
          const CashierBottomBar(),
        ],
      ),
    );
  }

  Widget _buildTabContent(int tabIndex) {
    switch (tabIndex) {
      case 0:
        return const DishesTab();
      case 1:
        return const KassaTab();
      case 2:
        return const BillsTab();
      case 3:
        return const SettingsTab();
      default:
        return const SizedBox.shrink();
    }
  }
}
