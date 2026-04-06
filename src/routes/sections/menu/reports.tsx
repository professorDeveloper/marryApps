import type { RouteObject } from 'react-router';

import { lazy } from 'react';

const ReportsListView = lazy(() =>
  import('src/sections/reports/reports-list-view').then((m) => ({ default: m.ReportsListView }))
);
const ReportsEditView = lazy(() =>
  import('src/sections/reports/reports-edit-view').then((m) => ({ default: m.ReportsEditView }))
);
const SalesListView = lazy(() =>
  import('src/sections/reports/sales-list-view').then((m) => ({ default: m.SalesListView }))
);
const BillsListView = lazy(() =>
  import('src/sections/reports/bills-list-view').then((m) => ({ default: m.BillsListView }))
);
const ArchivesListView = lazy(() =>
  import('src/sections/reports/archives-list-view').then((m) => ({ default: m.ArchivesListView }))
);
const CustomReportsListView = lazy(() =>
  import('src/sections/reports/custom-list-view').then((m) => ({ default: m.CustomReportsListView }))
);
const InventoryReportsListView = lazy(() =>
  import('src/sections/reports/inventory-list-view').then((m) => ({
    default: m.InventoryReportsListView,
  }))
);
const IngredientReportsListView = lazy(() =>
  import('src/sections/reports/ingredients-reports-list-view').then((m) => ({
    default: m.IngredientReportsListView,
  }))
);
const GoodsReportsListView = lazy(() =>
  import('src/sections/reports/goods-reports-list-view').then((m) => ({
    default: m.GoodsReportsListView,
  }))
);
const GoodsReportsDetailView = lazy(() =>
  import('src/sections/reports/goods-reports-detail-view').then((m) => ({
    default: m.GoodsReportsDetailView,
  }))
);

export const reportRoutes: RouteObject[] = [
  { path: 'reports', element: <ReportsListView /> },
  { path: 'reports/new', element: <ReportsEditView isNew /> },
  { path: 'reports/:id/edit', element: <ReportsEditView /> },
  { path: 'reports/sales', element: <SalesListView /> },
  { path: 'reports/inventory', element: <InventoryReportsListView /> },
  { path: 'reports/custom', element: <CustomReportsListView /> },
  { path: 'reports/archives', element: <ArchivesListView /> },
  { path: 'reports/bills', element: <BillsListView /> },
  { path: 'reports/ingredients', element: <IngredientReportsListView /> },
  { path: 'reports/goods', element: <GoodsReportsListView /> },
  { path: 'reports/goods/:id', element: <GoodsReportsDetailView /> },
];
