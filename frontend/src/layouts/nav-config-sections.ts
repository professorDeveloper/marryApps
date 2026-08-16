import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------
// Single source of truth for sidebar sections, breadcrumb parent labels,
// and active-state prefix matching.
// ----------------------------------------------------------------------

export type NavSection = {
  key: string;
  labelKey: string;
  fallback: string;
  rootPath: string;
  prefixes: string[];
};

export const SECTIONS: NavSection[] = [
  {
    key: 'analytics',
    labelKey: 'nav.dashboard.overview',
    fallback: 'Analytics',
    rootPath: paths.dashboard.root,
    prefixes: ['/dashboard'],
  },
  {
    key: 'storages',
    labelKey: 'nav.storageOrg',
    fallback: 'Storages',
    rootPath: paths.storage.storages.root,
    prefixes: ['/storage'],
  },
  {
    key: 'menu',
    labelKey: 'nav.menuSetup',
    fallback: 'Menu',
    rootPath: paths.menu.meals.root,
    prefixes: ['/menu'],
  },
  {
    key: 'operations',
    labelKey: 'nav.finance',
    fallback: 'Operations',
    rootPath: paths.operations.invoices.root,
    prefixes: ['/operations'],
  },
  {
    key: 'reports',
    labelKey: 'nav.dataReports',
    fallback: 'Reports',
    rootPath: paths.menu.reports.bills.root,
    prefixes: ['/reports'],
  },
  {
    key: 'cashbooks',
    labelKey: 'nav.pos',
    fallback: 'Cashbooks',
    rootPath: paths.cashbooks.transactions,
    prefixes: ['/cashbooks'],
  },
  {
    key: 'employee',
    labelKey: 'nav.staffing',
    fallback: 'Employee',
    rootPath: paths.employee.users,
    prefixes: ['/employee'],
  },
  {
    key: 'settings',
    labelKey: 'nav.systemSettings',
    fallback: 'Settings',
    rootPath: paths.settings.notifications.root,
    prefixes: ['/settings'],
  },
];

export function getSectionForPath(pathname: string): NavSection | undefined {
  return SECTIONS.find((section) =>
    section.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  );
}
