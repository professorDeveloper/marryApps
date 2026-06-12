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

      // ── Storage & Org ─────────────────────────────────────────────────
      {
        title: t('nav.storageOrg'),
        path: paths.warehouse.storage.root,
        icon: ICONS.storage,
        deepMatch: true,
        children: [
          { title: t('nav.storage'),              path: paths.warehouse.storage.root },
          { title: t('nav.departments'),      path: paths.menu.product.root },
          { title: t('nav.categories'),        path: paths.menu.category.root },
          { title: t('nav.ingredientGroups'), path: paths.menu.ingredients_group.root },
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

      // ── Finance ───────────────────────────────────────────────────────
      {
        title: t('nav.finance'),
        path: paths.warehouse.invoiceDetails.root,
        icon: ICONS.finance,
        deepMatch: true,
        children: [
          { title: t('nav.invoices'),             path: paths.warehouse.invoiceDetails.root },
          { title: t('nav.expensesInvoices'), path: paths.warehouse.outgoingInvoices.root },
          { title: t('nav.separationActs'), path: paths.warehouse.separationActs.root },
          { title: t('nav.deductions'),         path: paths.warehouse.deductions.root },
          { title: t('nav.deductionGroups'), path: paths.warehouse.deductionGroups.root },
          { title: t('nav.transfers'),           path: paths.warehouse.transfers.root },
          { title: t('nav.inventory'),           path: paths.menu.inventory.root },
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

      // ── POS ───────────────────────────────────────────────────────────
      {
        title: t('nav.pos'),
        path: paths.warehouse.orders.root,
        icon: ICONS.pos,
        deepMatch: true,
        children: [
          { title: t('nav.orderManagement'), path: paths.warehouse.orders.root },
          { title: t('nav.transactions'),        path: paths.cashbox.transactions },
          { title: t('nav.transactionGroups'), path: paths.cashbox.transactionGroups },
          { title: t('nav.cashboxReport'),     path: paths.cashbox.report },
        ],
      },

      // ── Staffing ──────────────────────────────────────────────────────
      {
        title: t('nav.staffing'),
        path: paths.staffing.employees,
        icon: ICONS.staffing,
        deepMatch: true,
        children: [
          { title: t('nav.employees'), path: paths.staffing.employees },
          { title: t('nav.shifts'),       path: paths.staffing.shifts },
          { title: t('nav.kpi'),             path: paths.staffing.kpi },
          { title: t('nav.salary'),       path: paths.staffing.salary },
        ],
      },

      // ── System Settings ───────────────────────────────────────────────
      {
        title: t('nav.systemSettings'),
        path: paths.settings.notifications.root,
        icon: ICONS.settings,
        deepMatch: true,
        children: [
          { title: t('nav.restaurantInfo'), path: paths.settings.notifications.root },
          { title: t('nav.devices'),                path: paths.settings.general.root },
          { title: t('nav.halls'),                    path: paths.settings.halls },
          { title: t('nav.cashiers'),              path: paths.cashbox.cashiers },
        ],
      },
    ],
  },
];

// Backward compat alias
export const navData = getNavData(((k: string, fb: string) => fb) as unknown as TFunction);
