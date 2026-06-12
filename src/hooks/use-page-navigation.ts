import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { usePathname } from 'src/routes/hooks';

import { getSectionForPath } from 'src/layouts/nav-config-sections';

export function usePageNavigation() {
  const pathname = usePathname();
  const { t: tMenu } = useTranslation('menu');

  const dynamicPageTitle = useMemo(() => {
    const isNew = pathname.includes('/new');

    // Dashboard
    if (pathname === '/' || pathname.includes('/dashboard')) {
      const title = tMenu('dashboard', 'Analytics');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }

    // Storages
    if (pathname.includes('/storage/storages')) {
      const title = tMenu('overview.warehouse.storage', 'Storage');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/storage/departments')) {
      const title = tMenu('overview.menu.departments', 'Department');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/storage/categories')) {
      const title = tMenu('overview.menu.categories', 'Categories');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/storage/ingredient-groups')) {
      const title = tMenu('overview.menu.ingredient-group', 'Ingredient Groups');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }

    // Menu Management
    if (pathname.includes('/menu/ingredients')) {
      const title = tMenu('overview.menu.ingredients', 'Ingredients');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/menu/semifinished')) {
      const title = tMenu('overview.menu.semifinished', 'Semifinished');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/menu/meals')) {
      const title = tMenu('overview.menu.meals', 'Meals');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/menu/modifiers')) {
      const title = tMenu('overview.menu.modifiers', 'Modifiers');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }

    // Operations
    if (pathname.includes('/operations/invoices')) {
      const title = tMenu('overview.warehouse.invoiceDetails', 'Incoming Invoices');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/operations/expense-invoices')) {
      const title = tMenu('overview.warehouse.expensesInvoices', 'Expenses Invoices');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/operations/separation-acts')) {
      const title = tMenu('overview.warehouse.separationActs', 'Separation Acts');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/operations/deduction-groups')) {
      const title = tMenu('deductions.groups', 'Deduction Groups');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/operations/deductions')) {
      const title = tMenu('deductions.title', 'Deductions');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/operations/transfers')) {
      const title = tMenu('overview.warehouse.transfers', 'Transfers');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/operations/inventory')) {
      const title = tMenu('overview.warehouse.inventories', 'Inventory Menu');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }

    // Warehouse (remaining pages not yet moved to a new section)
    if (pathname.includes('/warehouse/ingredient-stock')) {
      const title = tMenu('ingredientStock.title', 'Ingredient Stock');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/warehouse/locations')) {
      const title = tMenu('overview.warehouse.locations', 'Locations');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/warehouse/suppliers')) {
      const title = tMenu('overview.warehouse.suppliers', 'Suppliers');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/warehouse/orders')) {
      const title = tMenu('overview.warehouse.orders', 'Order Management');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/warehouse/shipments')) {
      const title = tMenu('overview.warehouse.shipments', 'Shipments');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/warehouse/stocks')) {
      const title = tMenu('overview.warehouse.stocks', 'Stocks');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }

    // Reports
    if (pathname.includes('/reports/bills')) {
      const title = tMenu('overview.reports.bills', 'Bills');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/reports/ingredients')) {
      const title = tMenu('overview.reports.ingredients', 'Ingredient Reports');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/reports/goods')) {
      const title = tMenu('overview.reports.goods', 'Goods Report');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }

    // Cashbooks
    if (pathname.includes('/cashbooks/transaction-groups')) {
      const title = tMenu('cashbox.sidebar.transactionGroups', 'Transaction Groups');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/cashbooks/transactions')) {
      const title = tMenu('cashbox.sidebar.transactions', 'Transactions');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/cashbooks/reports')) {
      const title = tMenu('cashbox.sidebar.report', 'Cashbox Report');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }

    // Employee
    if (pathname.includes('/employee/users/restaurant-staff')) {
      const title = tMenu('overview.employe.staff', 'Restaurant Staff');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/employee/users')) {
      const title = tMenu('overview.employe.title', 'Employees');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/employee/shifts')) {
      const title = tMenu('nav.shifts', 'Shifts');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/employee/kpi')) {
      const title = tMenu('nav.kpi', 'KPI');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/employee/salary')) {
      const title = tMenu('nav.salary', 'Salary');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }

    // Settings
    if (pathname.includes('/settings/cashiers')) {
      const title = tMenu('cashbox.sidebar.cashiers', 'Cashiers');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/settings/devices')) {
      const title = tMenu('devices.title', 'Printer Devices');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/settings/connected-device')) {
      const title = tMenu('overview.settings.connecteddevices', 'Connected Devices');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/settings/restaurant-info')) {
      const title = tMenu('overview.settings.restaurantInfo', 'Restaurant Information');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/settings/integrations')) {
      const title = tMenu('overview.settings.integrations', 'Integrations');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/settings/halls')) {
      const title = tMenu('halls.Halls', 'Halls');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/settings/floor-plan')) {
      const title = tMenu('overview.settings.floorPlan', 'Floor Plan');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/settings')) {
      const title = tMenu('overview.settings.title', 'Settings');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }

    // Other
    if (pathname.includes('/group')) {
      const title = tMenu('management.group.title', 'Group');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }

    return '';
  }, [pathname, tMenu]);

  const dynamicBreadcrumbs = useMemo(() => {
    const links: { name: string; href: string }[] = [];

    const section = getSectionForPath(pathname);
    if (!section) {
      return links;
    }

    links.push({ name: tMenu(section.labelKey, section.fallback), href: section.rootPath });

    // Storages
    if (pathname.includes('/storage/storages')) {
      links.push({ name: tMenu('overview.warehouse.storage', 'Storage'), href: '/storage/storages' });
    }
    if (pathname.includes('/storage/departments')) {
      links.push({ name: tMenu('overview.menu.departments', 'Departments'), href: '/storage/departments' });
    }
    if (pathname.includes('/storage/categories')) {
      links.push({ name: tMenu('overview.menu.categories', 'Categories'), href: '/storage/categories' });
    }
    if (pathname.includes('/storage/ingredient-groups')) {
      links.push({ name: tMenu('overview.menu.ingredient-group', 'Ingredient Groups'), href: '/storage/ingredient-groups' });
    }

    // Menu Management
    if (pathname.includes('/menu/ingredients')) {
      links.push({ name: tMenu('overview.menu.ingredients', 'Ingredients'), href: '/menu/ingredients' });
    }
    if (pathname.includes('/menu/semifinished')) {
      links.push({ name: tMenu('overview.menu.semifinished', 'Semifinished'), href: '/menu/semifinished' });
    }
    if (pathname.includes('/menu/meals')) {
      links.push({ name: tMenu('overview.menu.meals', 'Meals'), href: '/menu/meals' });
    }
    if (pathname.includes('/menu/modifiers')) {
      links.push({ name: tMenu('overview.menu.modifiers', 'Modifiers'), href: '/menu/modifiers' });
    }

    // Operations
    if (pathname.includes('/operations/invoices')) {
      links.push({ name: tMenu('overview.warehouse.invoiceDetails', 'Incoming Invoices'), href: '/operations/invoices' });
    }
    if (pathname.includes('/operations/expense-invoices')) {
      links.push({ name: tMenu('overview.warehouse.expensesInvoices', 'Expenses Invoices'), href: '/operations/expense-invoices' });
    }
    if (pathname.includes('/operations/separation-acts')) {
      links.push({ name: tMenu('overview.warehouse.separationActs', 'Separation Acts'), href: '/operations/separation-acts' });
    }
    if (pathname.includes('/operations/deduction-groups')) {
      links.push({ name: tMenu('deductions.groups', 'Deduction Groups'), href: '/operations/deduction-groups' });
    } else if (pathname.includes('/operations/deductions')) {
      links.push({ name: tMenu('deductions.title', 'Deductions'), href: '/operations/deductions' });
    }
    if (pathname.includes('/operations/transfers')) {
      links.push({ name: tMenu('overview.warehouse.transfers', 'Transfers'), href: '/operations/transfers' });
    }
    if (pathname.includes('/operations/inventory')) {
      links.push({ name: tMenu('overview.warehouse.inventories', 'Inventory'), href: '/operations/inventory' });
    }

    // Reports
    if (pathname.includes('/reports/bills')) {
      links.push({ name: tMenu('overview.reports.bills', 'Bills'), href: '/reports/bills' });
    }
    if (pathname.includes('/reports/ingredients')) {
      links.push({ name: tMenu('overview.reports.ingredients', 'Ingredient Reports'), href: '/reports/ingredients' });
    }
    if (pathname.includes('/reports/goods')) {
      links.push({ name: tMenu('overview.reports.goods', 'Goods Report'), href: '/reports/goods' });
    }

    // Cashbooks
    if (pathname.includes('/cashbooks/transaction-groups')) {
      links.push({ name: tMenu('cashbox.sidebar.transactionGroups', 'Transaction Groups'), href: '/cashbooks/transaction-groups' });
    } else if (pathname.includes('/cashbooks/transactions')) {
      links.push({ name: tMenu('cashbox.sidebar.transactions', 'Transactions'), href: '/cashbooks/transactions' });
    }
    if (pathname.includes('/cashbooks/reports')) {
      links.push({ name: tMenu('cashbox.sidebar.report', 'Cashbox Report'), href: '/cashbooks/reports' });
    }

    // Employee
    if (pathname.includes('/employee/users/restaurant-staff')) {
      links.push({ name: tMenu('overview.employe.staff', 'Restaurant Staff'), href: '/employee/users/restaurant-staff' });
    } else if (pathname.includes('/employee/users')) {
      links.push({ name: tMenu('overview.employe.title', 'Employees'), href: '/employee/users' });
    }
    if (pathname.includes('/employee/shifts')) {
      links.push({ name: tMenu('nav.shifts', 'Shifts'), href: '/employee/shifts' });
    }
    if (pathname.includes('/employee/kpi')) {
      links.push({ name: tMenu('nav.kpi', 'KPI'), href: '/employee/kpi' });
    }
    if (pathname.includes('/employee/salary')) {
      links.push({ name: tMenu('nav.salary', 'Salary'), href: '/employee/salary' });
    }

    // Settings
    if (pathname.includes('/settings/cashiers')) {
      links.push({ name: tMenu('cashbox.sidebar.cashiers', 'Cashiers'), href: '/settings/cashiers' });
    }
    if (pathname.includes('/settings/devices')) {
      links.push({ name: tMenu('devices.title', 'Printer Devices'), href: '/settings/devices' });
    }
    if (pathname.includes('/settings/connected-device')) {
      links.push({ name: tMenu('overview.settings.connecteddevices', 'Connected Devices'), href: '/settings/connected-device' });
    }
    if (pathname.includes('/settings/restaurant-info')) {
      links.push({ name: tMenu('overview.settings.restaurantInfo', 'Restaurant Information'), href: '/settings/restaurant-info' });
    }
    if (pathname.includes('/settings/integrations')) {
      links.push({ name: tMenu('overview.settings.integrations', 'Integrations'), href: '/settings/integrations' });
    }
    if (pathname.includes('/settings/halls')) {
      links.push({ name: tMenu('halls.Halls', 'Halls'), href: '/settings/halls' });
    }

    return links;
  }, [pathname, tMenu]);

  return {
    pageTitle: dynamicPageTitle,
    breadcrumbs: dynamicBreadcrumbs,
  };
}
