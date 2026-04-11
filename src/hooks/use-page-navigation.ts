import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { usePathname } from 'src/routes/hooks';

export function usePageNavigation() {
  const pathname = usePathname();
  const { t: tMenu } = useTranslation('menu');
 
  const dynamicPageTitle = useMemo(() => {
    const isNew = pathname.includes('/new');
    
    // Dashboard
    if (pathname === '/' || pathname.includes('/dashboard')) {
      const title = tMenu('dashboard', 'Dashboard');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    
    // Menu Management
    if (pathname.includes('/menu/departments')) {
      const title = tMenu('overview.menu.departments', 'Department');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/menu/category')) {
      const title = tMenu('overview.menu.categories', 'Categories');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/menu/ingredient-group')) {
      const title = tMenu('overview.menu.ingredient-group', 'Ingredient Groups');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
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
    
    // Warehouse
    if (pathname.includes('/warehouse/storage')) {
      const title = tMenu('overview.warehouse.storage', 'Storage');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/warehouse/ingredient-stock')) {
      const title = tMenu('ingredientStock.title', 'Ingredient Stock');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/warehouse/invoice-details')) {
      const title = tMenu('overview.warehouse.invoiceDetails', 'Incoming Invoices');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/warehouse/expenses-invoices')) {
      const title = tMenu('overview.warehouse.expensesInvoices', 'Expenses Invoices');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/warehouse/separations-acts')) {
      const title = tMenu('overview.warehouse.separationActs', 'Separation Acts');
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
    if (pathname.includes('/warehouse/inventories')) {
      const title = tMenu('overview.warehouse.inventories', 'Inventory Menu');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    
    // Warehouse Operations
    if (pathname.includes('/warehouse/deductions')) {
      const title = tMenu('deductions.title', 'Deductions');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/warehouse/deduction-groups')) {
      const title = tMenu('deductions.groups', 'Deduction Groups');
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
    if (pathname.includes('/warehouse/transfers')) {
      const title = tMenu('overview.warehouse.transfers', 'Transfers');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/warehouse/invoices')) {
      const title = tMenu('overview.warehouse.invoices', 'Invoices');
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
    if (pathname.includes('/reports/sales')) {
      const title = tMenu('overview.reports.sales', 'Sales');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/reports/inventory')) {
      const title = tMenu('overview.reports.inventory', 'Inventory');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/reports/custom')) {
      const title = tMenu('overview.reports.custom', 'Custom');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/reports/archives')) {
      const title = tMenu('overview.reports.archives', 'Archives');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    
    // Cashbox
    if (pathname.includes('/cashbox/cashbox')) {
      const title = tMenu('cashbox.sidebar.title', 'Cashbox');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/cashbox/cashiers')) {
      const title = tMenu('cashbox.sidebar.cashiers', 'Cashiers');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/cashbox/transaction-groups')) {
      const title = tMenu('cashbox.sidebar.transactionGroups', 'Transaction Groups');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/cashbox/transactions')) {
      const title = tMenu('cashbox.sidebar.transactions', 'Transactions');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/cashbox/report')) {
      const title = tMenu('cashbox.sidebar.report', 'Cashbox Report');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    
    // User Management
    if (pathname.includes('/user/restaurant-staff')) {
      const title = tMenu('overview.employe.staff', 'Restaurant Staff');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/user')) {
      const title = tMenu('overview.employe.title', 'Employees');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    
    // Settings
    if (pathname.includes('/settings/devices')) {
      const title = tMenu('devices.title', 'Printer Devices');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/settings/connected-device')) {
      const title = tMenu('overview.settings.connecteddevices', 'Connected Devices');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/settings/management')) {
      const title = tMenu('overview.settings.deviceManagement', 'Device Management');
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
    if (pathname.includes('/settings/floor-plan')) {
      const title = tMenu('overview.settings.floorPlan', 'Floor Plan');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/settings')) {
      const title = tMenu('overview.settings.title', 'Settings');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    
    // Other
    if (pathname.includes('/settings/halls')) {
      const title = tMenu('halls.Halls', 'Halls');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    if (pathname.includes('/group')) {
      const title = tMenu('management.group.title', 'Group');
      return isNew ? `New ${title.toLowerCase()}` : title;
    }
    
    return '';
  }, [pathname, tMenu]);

  const dynamicBreadcrumbs = useMemo(() => {
    const links = [];
    
    // Debug: log the pathname
    console.log('Current pathname:', pathname);
    console.log('Current pathname:', pathname);
    console.log('Current pathname:', pathname);
    console.log('Current pathname:', pathname);
    console.log('Current pathname:', pathname);
    console.log('Current pathname:', pathname);
    console.log('Current pathname:', pathname);
    console.log('Current pathname:', pathname);
    console.log('Current pathname:', pathname);
    console.log('Current pathname:', pathname);
    console.log('Current pathname:', pathname);
    
    // Dashboard
    if (pathname === '/' || pathname.includes('/dashboard')) {
      links.push({ name: tMenu('dashboard', 'Dashboard'), href: '/' });
    }
    
    // Menu Management
    if (pathname.includes('/menu')) {
      links.push({ name: tMenu('overview.menu.title', 'Menu'), href: '/menu/departments' });
    }
    if (pathname.includes('/menu/departments')) {
      links.push({ name: tMenu('overview.menu.departments', 'Departments'), href: '/menu/departments' });
    }
    if (pathname.includes('/menu/category')) {
      links.push({ name: tMenu('overview.menu.categories', 'Categories'), href: '/menu/category' });
    }
    if (pathname.includes('/menu/ingredient-group')) {
      links.push({ name: tMenu('overview.menu.ingredient-group', 'Ingredient Groups'), href: '/menu/ingredient-group' });
    }
    if (pathname.includes('/menu/ingredients')) {
      links.push({ name: tMenu('overview.menu.ingredients', 'Ingredients'), href: '/menu/ingredients' });
    }
    if (pathname.includes('/menu/semifinished')) {
      links.push({ name: tMenu('overview.menu.semifinished', 'Semifinished'), href: '/menu/semifinished' });
    }
    if (pathname.includes('/menu/meals')) {
      links.push({ name: tMenu('overview.menu.meals', 'Meals'), href: '/menu/meals' });
    }
    
    // Warehouse
    if (pathname.includes('/warehouse')) {
      console.log('Adding Warehouse breadcrumb');
      links.push({ name: tMenu('overview.warehouse.title', 'Warehouse'), href: '/warehouse/storage' });
    }
    if (pathname.includes('/warehouse/storage')) {
      console.log('Adding Storage breadcrumb');
      links.push({ name: tMenu('overview.warehouse.storage', 'Storage'), href: '/warehouse/storage' });
    }
    if (pathname.includes('/warehouse/ingredient-stock')) {
      console.log('Adding Ingredient Stock breadcrumb');
      links.push({ name: tMenu('ingredientStock.title', 'Ingredient Stock'), href: '/warehouse/ingredient-stock' });
    }
    if (pathname.includes('/warehouse/invoice-details')) {
      links.push({ name: tMenu('overview.warehouse.invoiceDetails', 'Incoming Invoices'), href: '/warehouse/invoice-details' });
    }
    if (pathname.includes('/warehouse/expenses-invoices')) {
      links.push({ name: tMenu('overview.warehouse.expensesInvoices', 'Expenses Invoices'), href: '/warehouse/expenses-invoices' });
    }
    if (pathname.includes('/warehouse/separations-acts')) {
      links.push({ name: tMenu('overview.warehouse.separationActs', 'Separation Acts'), href: '/warehouse/separations-acts' });
    }
    if (pathname.includes('/warehouse/locations')) {
      links.push({ name: tMenu('overview.warehouse.locations', 'Locations'), href: '/warehouse/locations' });
    }
    if (pathname.includes('/warehouse/suppliers')) {
      links.push({ name: tMenu('overview.warehouse.suppliers', 'Suppliers'), href: '/warehouse/suppliers' });
    }
    if (pathname.includes('/warehouse/inventories')) {
      links.push({ name: tMenu('overview.warehouse.inventories', 'Inventory Menu'), href: '/warehouse/inventories' });
    }
    
    // Warehouse Operations
    if (pathname.includes('/warehouse/deductions')) {
      links.push({ name: tMenu('deductions.title', 'Deductions'), href: '/warehouse/deductions' });
    }
    if (pathname.includes('/warehouse/deduction-groups')) {
      links.push({ name: tMenu('deductions.groups', 'Deduction Groups'), href: '/warehouse/deduction-groups' });
    }
    if (pathname.includes('/warehouse/orders')) {
      links.push({ name: tMenu('overview.warehouse.orders', 'Order Management'), href: '/warehouse/orders' });
    }
    if (pathname.includes('/warehouse/shipments')) {
      links.push({ name: tMenu('overview.warehouse.shipments', 'Shipments'), href: '/warehouse/shipments' });
    }
    if (pathname.includes('/warehouse/transfers')) {
      links.push({ name: tMenu('overview.warehouse.transfers', 'Transfers'), href: '/warehouse/transfers' });
    }
    if (pathname.includes('/warehouse/invoices')) {
    links.push({ name: tMenu('overview.warehouse.invoices', 'Invoices'), href: '/warehouse/invoices' });
    }
    if (pathname.includes('/warehouse/stocks')) {
      links.push({ name: tMenu('overview.warehouse.stocks', 'Stocks'), href: '/warehouse/stocks' });
    }
    
    // Reports
    if (pathname.includes('/reports')) {
      links.push({ name: tMenu('overview.reports.title', 'Reports'), href: '/reports' });
    }
    if (pathname.includes('/reports/bills')) {
      links.push({ name: tMenu('overview.reports.bills', 'Bills'), href: '/reports/bills' });
    }
    if (pathname.includes('/reports/ingredients')) {
      links.push({ name: tMenu('overview.reports.ingredients', 'Ingredient Reports'), href: '/reports/ingredients' });
    }
    if (pathname.includes('/reports/goods')) {
      links.push({ name: tMenu('overview.reports.goods', 'Goods Report'), href: '/reports/goods' });
    }
    if (pathname.includes('/reports/sales')) {
      links.push({ name: tMenu('overview.reports.sales', 'Sales'), href: '/reports/sales' });
    }
    if (pathname.includes('/reports/inventory')) {
      links.push({ name: tMenu('overview.reports.inventory', 'Inventory'), href: '/reports/inventory' });
    }
    if (pathname.includes('/reports/custom')) {
      links.push({ name: tMenu('overview.reports.custom', 'Custom'), href: '/reports/custom' });
    }
    if (pathname.includes('/reports/archives')) {
      links.push({ name: tMenu('overview.reports.archives', 'Archives'), href: '/reports/archives' });
    }
    
    // Cashbox
    if (pathname.includes('/cashbox')) {
      links.push({ name: tMenu('cashbox.sidebar.title', 'Cashbox'), href: '/cashbox/cashiers' });
    }
    if (pathname.includes('/cashiers')) {
      links.push({ name: tMenu('cashbox.sidebar.cashiers', 'Cashiers'), href: '/cashbox/cashiers' });
    }
    if (pathname.includes('/transaction-groups')) {
      links.push({ name: tMenu('cashbox.sidebar.transactionGroups', 'Transaction Groups'), href: '/cashbox/transaction-groups' });
    }
    if (pathname.includes('/transactions')) {
      links.push({ name: tMenu('cashbox.sidebar.transactions', 'Transactions'), href: '/cashbox/transactions' });
    }
    if (pathname.includes('/cashbox/report')) {
      links.push({ name: tMenu('cashbox.sidebar.report', 'Cashbox Report'), href: '/cashbox/report' });
    }
    
    // User Management
    if (pathname.includes('/user')) {
      links.push({ name: tMenu('overview.employe.title', 'Employees'), href: '/user' });
    }
    if (pathname.includes('/restaurant-staff')) {
      links.push({ name: tMenu('overview.employe.staff', 'Restaurant Staff'), href: '/user/restaurant-staff' });
    }
    
    // Settings
    if (pathname.includes('/settings')) {
      links.push({ name: tMenu('overview.settings.title', 'Settings'), href: '/settings/devices' });
    }
    if (pathname.includes('/settings/devices')) {
      links.push({ name: tMenu('devices.title', 'Printer Devices'), href: '/settings/devices' });
    }
    if (pathname.includes('/settings/connected-device')) {
      links.push({ name: tMenu('overview.settings.connecteddevices', 'Connected Devices'), href: '/settings/connected-device' });
    }
    if (pathname.includes('/settings/management')) {
      links.push({ name: tMenu('overview.settings.deviceManagement', 'Device Management'), href: '/settings/management' });
    }
    if (pathname.includes('/settings/restaurant-info')) {
      links.push({ name: tMenu('overview.settings.restaurantInfo', 'Restaurant Information'), href: '/settings/restaurant-info' });
    }
    if (pathname.includes('/settings/integrations')) {
      links.push({ name: tMenu('overview.settings.integrations', 'Integrations'), href: '/settings/integrations' });
    }
    if (pathname.includes('/settings/floor-plan')) {
      links.push({ name: tMenu('overview.settings.floorPlan', 'Floor Plan'), href: '/settings/floor-plan' });
    }
    
    // Other
    if (pathname.includes('/settings/halls')) {
      links.push({ name: tMenu('halls.Halls', 'Halls'), href: '/settings/halls' });
    }
    if (pathname.includes('/group')) {
      links.push({ name: tMenu('management.group.title', 'Group'), href: '/group' });
    }
    
    console.log('Final breadcrumb links:', links);
    return links;
  }, [pathname, tMenu]);

  return {
    pageTitle: dynamicPageTitle,
    breadcrumbs: dynamicBreadcrumbs,
  };
}
