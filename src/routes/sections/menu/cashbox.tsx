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

export const cashboxRoutes: RouteObject[] = [
  { path: 'cashbox/cashiers', element: <CashiersPage /> },
  { path: 'cashbox/cashiers/new', element: <CashierEditView isNew /> },
  { path: 'cashbox/cashiers/:id/edit', element: <CashierEditView /> },
  { path: 'cashbox/transaction-groups', element: <TransactionGroupsPage /> },
  { path: 'cashbox/transaction-groups/new', element: <CashRegisterEditView isNew /> },
  { path: 'cashbox/transaction-groups/:id/edit', element: <CashRegisterEditView /> },
  { path: 'cashbox/transactions', element: <TransactionsPage /> },
  { path: 'cashbox/transactions/new', element: <TransactionsEditView isNew /> },
  { path: 'cashbox/transactions/:id/edit', element: <TransactionsEditView /> },
  { path: 'cashbox/report', element: <CashboxReportPage /> },
];
