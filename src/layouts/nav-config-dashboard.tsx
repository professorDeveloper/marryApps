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
    ],
  },
];
