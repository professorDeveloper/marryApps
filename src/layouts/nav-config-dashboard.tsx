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
        title: t('overview.menu.title', 'Menu'),
        path: paths.menu.product.root,
        icon: ICONS.product,
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
        icon: ICONS.folder,
        children: [
          { title: t('overview.warehouse.stocks', 'Stocks'), path: paths.menu.warehouse.stocks.root },
          { title: t('overview.warehouse.transfers', 'Transfers'), path: paths.menu.warehouse.transfers.root },
          { title: t('overview.warehouse.locations', 'Locations'), path: paths.menu.warehouse.locations.root },
          { title: t('overview.warehouse.suppliers', 'Suppliers'), path: paths.menu.warehouse.suppliers.root },
        ],
      },
      {
        title: t('overview.reports.title', 'Hisobotlar'),
        path: paths.menu.reports.root,
        icon: ICONS.analytics,
        children: [
          { title: t('overview.reports.sales', 'Sales'), path: paths.menu.reports.sales.root },
          { title: t('overview.reports.inventory', 'Inventory'), path: paths.menu.reports.inventory.root },
          { title: t('overview.reports.custom', 'Custom'), path: paths.menu.reports.custom.root },
          { title: t('overview.reports.archives', 'Archives'), path: paths.menu.reports.archives.root },
        ],
      },
      {
        title: t('overview.settings.title', 'Sozlamalar'),
        path: paths.menu.settings.root,
        icon: ICONS.params,
        children: [
          { title: t('overview.settings.general', 'General'), path: paths.menu.settings.general.root },
          { title: t('overview.settings.profile', 'Profile'), path: paths.menu.settings.profile.root },
          { title: t('overview.settings.notifications', 'Notifications'), path: paths.menu.settings.notifications.root },
          { title: t('overview.settings.integrations', 'Integrations'), path: paths.menu.settings.integrations.root },
        ],
      },
    ],
  },
  {
    subheader: t('management.subheader', 'Management'),
    items: [
      {
        title: t('management.group.title', 'Group'),
        path: paths.menu.group.root,
        icon: ICONS.user,
        children: [
          { title: t('management.group.four', 'Four'), path: paths.menu.group.root },
          { title: t('management.group.five', 'Five'), path: paths.menu.group.five },
          { title: t('management.group.six', 'Six'), path: paths.menu.group.six },
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
        title: 'Menu',
        path: paths.menu.product.root,
        icon: ICONS.product,
        deepMatch: true,
        children: [
          { title: "Sections", path: paths.menu.product.root },
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
        path: paths.menu.settings.root,
        icon: ICONS.params,
        children: [
          { title: 'General', path: paths.menu.settings.root },
          { title: 'Profile', path: paths.menu.settings.root },
          { title: 'Notifications', path: paths.menu.settings.root },
          { title: 'Integrations', path: paths.menu.settings.root },
        ],
      },
    ],
  },
];
