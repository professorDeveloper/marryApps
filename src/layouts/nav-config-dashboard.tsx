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

export const navData: NavSectionProps['data'] = [
  /**
   * Overview
   */
  {
    subheader: 'Overview',
    items: [
      {
         title: 'Menyu',
         path: paths.menu.product.root,
         icon: ICONS.product,
         children: [
               { title: 'Bo\'limlar', path: paths.menu.product.root },
            { title: 'Kategoriyalar', path: paths.menu.category.root },
 { title: 'Yarim tayyor mahsulotlar', path: paths.menu.product.demo.details },
                  { title: 'Taomlar', path: paths.menu.product.demo.edit },
           { title: 'Modifikatorlar', path: paths.menu.product.demo.edit },
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
