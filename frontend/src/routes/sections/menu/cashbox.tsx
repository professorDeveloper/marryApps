import type { RouteObject } from 'react-router';

import { lazy } from 'react';

const CashiersPage = lazy(() => import('src/pages/dashboard/cashbox/cashiers'));
const TransactionGroupsPage = lazy(() => import('src/pages/dashboard/cashbox/transaction-groups'));
const TransactionsPage = lazy(() => import('src/pages/dashboard/cashbox/transactions'));
const CashboxReportPage = lazy(() => import('src/pages/dashboard/cashbox/cashbox-report'));

const CashierEditView = lazy(() =>
  import('src/sections/cashbox/cashiers').then((m) => ({ default: m.CashierEditView }))
);
const CashRegisterEditView = lazy(() =>
  import('src/sections/cashbox/transaction-groups').then((m) => ({
    default: m.CashRegisterEditView,
  }))
);
const TransactionsEditView = lazy(() =>
  import('src/sections/cashbox/transactions-edit-view').then((m) => ({
    default: m.TransactionsEditView,
  }))
);
const OrdersManagementView = lazy(() =>
  import('src/sections/warehouse/orders').then((m) => ({
    default: m.OrdersManagementView,
  }))
);
const OrdersCreateView = lazy(() =>
  import('src/sections/warehouse/orders').then((m) => ({
    default: m.OrdersCreateView,
  }))
);

export const cashboxRoutes: RouteObject[] = [
  { path: 'settings/cashiers', element: <CashiersPage /> },
  { path: 'settings/cashiers/new', element: <CashierEditView isNew /> },
  { path: 'settings/cashiers/:id/edit', element: <CashierEditView /> },
  { path: 'cashbooks/transaction-groups', element: <TransactionGroupsPage /> },
  { path: 'cashbooks/transaction-groups/new', element: <CashRegisterEditView isNew /> },
  { path: 'cashbooks/transaction-groups/:id/edit', element: <CashRegisterEditView /> },
  { path: 'cashbooks/transactions', element: <TransactionsPage /> },
  { path: 'cashbooks/transactions/new', element: <TransactionsEditView isNew /> },
  { path: 'cashbooks/transactions/:id/edit', element: <TransactionsEditView /> },
  { path: 'cashbooks/reports', element: <CashboxReportPage /> },
  { path: 'cashbooks/orders', element: <OrdersManagementView /> },
  { path: 'cashbooks/orders/new', element: <OrdersCreateView /> },
];
