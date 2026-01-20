import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  params: icon('ic-params'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  subpaths: icon('ic-subpaths'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
};

// ----------------------------------------------------------------------

import type { TFunction } from 'i18next';

export const getNavData = (t: TFunction): NavSectionProps['data'] => [
  /**
   * Overview
   */
  {
    subheader: t('overview.subheader', 'Overview'),
    items: [
      {
        title: t('dashboard', 'Dashboard'),
        path: paths.dashboard.root,
        icon: ICONS.dashboard,
      },
      {
        title: t('overview.menu.title', 'Menu'),
        path: paths.menu.product.root,
        icon: ICONS.menuItem,
        deepMatch: true,
        children: [
          { title: t('overview.menu.sections', 'Sections'), path: paths.menu.product.root },
          { title: t('overview.menu.categories', 'Categories'), path: paths.menu.category.root },
          { title: t('overview.menu.semifinished', 'Semifinished'), path: paths.menu.semifinished.root },
          { title: t('overview.menu.meals', 'Meals'), path: paths.menu.meals.root },
        ],
      },
      {
        title: t('overview.warehouse.title', 'Ombor'),
        path: paths.menu.warehouse.root,
        icon: ICONS.banking,
        children: [
          { title: t('overview.warehouse.storage', 'Storage'), path: paths.menu.inventory.root },
          { title: t('overview.warehouse.ingredients', 'Ingredients'), path: paths.menu.warehouse.ingredients.root },
          { title: t('overview.warehouse.stocks', 'Stocks'), path: paths.menu.warehouse.stocks.root },
          { title: t('overview.warehouse.transfers', 'Transfers'), path: paths.menu.warehouse.transfers.root },
          { title: t('overview.warehouse.locations', 'Locations'), path: paths.menu.warehouse.locations.root },
          { title: t('overview.warehouse.suppliers', 'Suppliers'), path: paths.menu.warehouse.suppliers.root },
        ],
      },
      {
        title: t('overview.reports.title', 'Hisobotlar'),
        path: paths.menu.reports.root,
        icon: ICONS.file,
        children: [
          { title: t('overview.reports.sales', 'Sales'), path: paths.menu.reports.sales.root },
          { title: t('overview.reports.inventory', 'Inventory'), path: paths.menu.reports.inventory.root },
          { title: t('overview.reports.custom', 'Custom'), path: paths.menu.reports.custom.root },
          { title: t('overview.reports.archives', 'Archives'), path: paths.menu.reports.archives.root },
        ],
      }
    ],
  },
  {
    subheader: t('management.subheader', 'Management'),
    items: [
      // {
      //   title: t('management.group.title', 'Group'),
      //   path: paths.menu.group.root,
      //   icon: ICONS.user,
      //   children: [
      //     { title: t('management.group.four', 'Four'), path: paths.menu.group.root },
      //     { title: t('management.group.five', 'Five'), path: paths.menu.group.five },
      //     { title: t('management.group.six', 'Six'), path: paths.menu.group.six },
      //   ],
      // },
      {
        title: t('overview.employe.title', 'Xodimlar'),
        path: paths.menu.user.root,
        icon: ICONS.user,
        deepMatch: true,

        children: [
          { title: t('overview.employe.admin', 'Admin Xodimlar'), path: paths.menu.user.root },
          { title: t('overview.employe.staff', 'Restoran Xodimlari'), path: paths.menu.user.restaurantStaff },
        ],
      },
      {
        title: t('overview.settings.title', 'Sozlamalar'),
        path: paths.settings.root,
        icon: ICONS.blog,
        children: [
          { title: t('overview.settings.connecteddevices', 'Connected devices'), path: paths.settings.general.root },
          { title: t('overview.settings.deviceManagement', 'Device management'), path: paths.settings.profile.root },
          { title: t('overview.settings.restaurantInfo', 'Restaurant information'), path: paths.settings.notifications.root },
        ],
      },
    ],
  },
];

// Backward compatibility: default navData (English) to avoid returning objects
export const navData: NavSectionProps['data'] = [
  {
    subheader: 'Overview',
    items: [
      {
        title: 'Dashboard',
        path: paths.dashboard.root,
        icon: ICONS.dashboard,
      },
      {
        title: 'Menu',
        path: paths.menu.product.root,
        icon: ICONS.product,
        deepMatch: true,
        children: [
          { title: 'Sections', path: paths.menu.product.root },
          { title: 'Categories', path: paths.menu.category.root },
          { title: 'Semifinished', path: paths.menu.semifinished.root },
          { title: 'Meals', path: paths.menu.meals.root },
        ],
      },
      {
        title: 'Ombor',
        path: paths.menu.warehouse.root,
        icon: ICONS.folder,
        children: [
          { title: 'Storage', path: paths.menu.inventory.root },
          { title: 'Ingredients', path: paths.menu.warehouse.ingredients.root },
          { title: 'Stocks', path: paths.menu.warehouse.stocks.root },
          { title: 'Transfers', path: paths.menu.warehouse.transfers.root },
          { title: 'Locations', path: paths.menu.warehouse.locations.root },
          { title: 'Suppliers', path: paths.menu.warehouse.suppliers.root },
        ],
      },

      {
        title: 'Hisobotlar',
        path: paths.menu.reports.root,
        icon: ICONS.analytics,
        children: [
          { title: 'Sales', path: paths.menu.reports.root },
          { title: 'Inventory', path: paths.menu.reports.root },
          { title: 'Custom', path: paths.menu.reports.root },
          { title: 'Archives', path: paths.menu.reports.root },
        ],
      },
    ],
  },
  {
    subheader: 'Management',
    items: [
      {
        title: 'Group',
        path: paths.menu.group.root,
        icon: ICONS.user,
        children: [
          { title: 'Four', path: paths.menu.group.root },
          { title: 'Five', path: paths.menu.group.five },
          { title: 'Six', path: paths.menu.group.six },
        ],
      },
      {
        title: 'Sozlamalar',
        path: paths.settings.root,
        icon: ICONS.params,
        children: [
          { title: 'General', path: paths.settings.general.root },
          { title: 'Settings', path: paths.settings.profile.root },
          { title: 'Notifications', path: paths.settings.notifications.root },
          { title: 'Integrations', path: paths.settings.integrations.root },
        ],
      },
    ],
  },
];
