import type { TFunction } from 'i18next';
import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  dashboard:  icon('ic-dashboard'),
  storage:    icon('ic-storage'),
  menu:       icon('ic-menu'),
  finance:    icon('ic-file'),
  pos:        icon('ic-invoice'),
  reports:    icon('ic-blog'),
  staffing:   icon('ic-user'),
  settings:   <Iconify icon="solar:settings-bold-duotone" width={24} height={24} />,
};

// ----------------------------------------------------------------------

export const getNavData = (t: TFunction): NavSectionProps['data'] => [
  {
    items: [
      // ── Dashboard ─────────────────────────────────────────────────────
      {
        title: t('nav.dashboard.overview'),
        path: paths.dashboard.overview,
        icon: ICONS.dashboard,
      },

      // ── Storages ──────────────────────────────────────────────────────
      {
        title: t('nav.storageOrg'),
        path: paths.storage.storages.root,
        icon: ICONS.storage,
        deepMatch: true,
        children: [
          { title: t('nav.storage'),              path: paths.storage.storages.root },
          { title: t('nav.departments'),      path: paths.storage.departments.root },
          { title: t('nav.categories'),        path: paths.storage.categories.root },
          { title: t('nav.ingredientGroups'), path: paths.storage.ingredientGroups.root },
        ],
      },

      // ── Menu Setup ────────────────────────────────────────────────────
      {
        title: t('nav.menuSetup'),
        path: paths.menu.meals.root,
        icon: ICONS.menu,
        deepMatch: true,
        children: [
          { title: t('nav.meals'),             path: paths.menu.meals.root },
          { title: t('nav.modifiers'),     path: paths.menu.modifiers.root },
          { title: t('nav.ingredients'), path: paths.menu.ingredients.root },
          { title: t('nav.semifinished'), path: paths.menu.semifinished.root },
        ],
      },

      // ── Operations ────────────────────────────────────────────────────
      {
        title: t('nav.finance'),
        path: paths.operations.invoices.root,
        icon: ICONS.finance,
        deepMatch: true,
        children: [
          { title: t('nav.invoices'),             path: paths.operations.invoices.root },
          { title: t('nav.expensesInvoices'), path: paths.operations.expenseInvoices.root },
          { title: t('nav.separationActs'), path: paths.operations.separationActs.root },
          { title: t('nav.deductions'),         path: paths.operations.deductions.root },
          { title: t('nav.deductionGroups'), path: paths.operations.deductionGroups.root },
          { title: t('nav.transfers'),           path: paths.operations.transfers.root },
          { title: t('nav.inventory'),           path: paths.operations.inventory.root },
        ],
      },

      // ── Data & Reports ────────────────────────────────────────────────
      {
        title: t('nav.dataReports'),
        path: paths.menu.reports.bills.root,
        icon: ICONS.reports,
        deepMatch: true,
        children: [
          { title: t('nav.billReports'),          path: paths.menu.reports.bills.root },
          { title: t('nav.ingredientReports'), path: paths.menu.reports.ingredients.root },
          { title: t('nav.goodsReport'),          path: paths.menu.reports.goods.root },
        ],
      },

      // ── Cashbooks ─────────────────────────────────────────────────────
      {
        title: t('nav.pos'),
        path: paths.cashbooks.transactions,
        icon: ICONS.pos,
        deepMatch: true,
        children: [
          { title: t('nav.orderManagement'), path: paths.warehouse.orders.root },
          { title: t('nav.transactions'),        path: paths.cashbooks.transactions },
          { title: t('nav.transactionGroups'), path: paths.cashbooks.transactionGroups },
          { title: t('nav.cashboxReport'),     path: paths.cashbooks.reports },
        ],
      },

      // ── Employee ──────────────────────────────────────────────────────
      {
        title: t('nav.staffing'),
        path: paths.employee.users,
        icon: ICONS.staffing,
        deepMatch: true,
        children: [
          { title: t('nav.employees'), path: paths.employee.users },
          { title: t('nav.shifts'),       path: paths.employee.shifts },
          { title: t('nav.kpi'),             path: paths.employee.kpi },
          { title: t('nav.salary'),       path: paths.employee.salary },
        ],
      },

      // ── Settings ──────────────────────────────────────────────────────
      {
        title: t('nav.systemSettings'),
        path: paths.settings.notifications.root,
        icon: ICONS.settings,
        deepMatch: true,
        children: [
          { title: t('nav.restaurantInfo'), path: paths.settings.notifications.root },
          { title: t('nav.devices'),                path: paths.settings.general.root },
          { title: t('nav.halls'),                    path: paths.settings.halls },
          { title: t('nav.cashiers'),              path: paths.settings.cashiers },
        ],
      },
    ],
  },
];

// Backward compat alias
export const navData = getNavData(((k: string, fb: string) => fb) as unknown as TFunction);
