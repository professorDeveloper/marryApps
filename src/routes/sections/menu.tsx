import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { Meals } from 'src/sections/meals/meals-list-view';
import { MealEditView } from 'src/sections/meals/meals-edit-view';
import { SalesListView } from 'src/sections/reports/sales-list-view';
import { StocksListView } from 'src/sections/warehouse/stocks-list-view';
import { StocksEditView } from 'src/sections/warehouse/stocks-edit-view';
import { ReportsListView } from 'src/sections/reports/reports-list-view';
import { ReportsEditView } from 'src/sections/reports/reports-edit-view';
import { ArchivesListView } from 'src/sections/reports/archives-list-view';
import { CategoryListView } from 'src/sections/category/category-list-view';
import { CategoryEditView } from 'src/sections/category/category-edit-view';
import { SettingsListView } from 'src/sections/settings/settings-list-view';
import { SettingsEditView } from 'src/sections/settings/settings-edit-view';
import { HalfMeals } from 'src/sections/semifinished/semifinished-list-view';
import { ProductListView } from 'src/sections/products/departments-list-view';
import { ProductEditView } from 'src/sections/products/departments-edit-view';
import { CustomReportsListView } from 'src/sections/reports/custom-list-view';
import { WarehouseListView } from 'src/sections/warehouse/warehouse-list-view';
import { WarehouseEditView } from 'src/sections/warehouse/warehouse-edit-view';
import { TransfersListView } from 'src/sections/warehouse/transfers-list-view';
import { TransfersEditView } from 'src/sections/warehouse/transfers-edit-view';
import { LocationsListView } from 'src/sections/warehouse/locations-list-view';
import { LocationsEditView } from 'src/sections/warehouse/locations-edit-view';
import { SuppliersListView } from 'src/sections/warehouse/suppliers-list-view';
import { SuppliersEditView } from 'src/sections/warehouse/suppliers-edit-view';
import { SettingsGeneralListView } from 'src/sections/settings/general-list-view';
import { SettingsProfileListView } from 'src/sections/settings/profile-list-view';
import { InventoryReportsListView } from 'src/sections/reports/inventory-list-view';
import { SemifinishedEditView } from 'src/sections/semifinished/semifinished-edit-view';
import { SettingsIntegrationsListView } from 'src/sections/settings/integrations-list-view';
import { SettingsNotificationsListView } from 'src/sections/settings/notifications-list-view';

import { AuthGuard } from 'src/auth/guard';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------

const IndexPage = lazy(() => import('src/pages/dashboard/one'));
const PageTwo = lazy(() => import('src/pages/dashboard/two'));
const PageThree = lazy(() => import('src/pages/dashboard/three'));
const PageFour = lazy(() => import('src/pages/dashboard/four'));
const PageFive = lazy(() => import('src/pages/dashboard/five'));
const PageSix = lazy(() => import('src/pages/dashboard/six'));

// ----------------------------------------------------------------------

function SuspenseOutlet() {
  const pathname = usePathname();
  return (
    <Suspense key={pathname} fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

const dashboardLayout = () => (
  <DashboardLayout>
    <SuspenseOutlet />
  </DashboardLayout>
);

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'menu',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      { element: <Navigate to="section" replace />, index: true },
      { path: 'two', element: <PageTwo /> },
      { path: 'three', element: <PageThree /> },
      {
        path: 'group',
        children: [
          { element: <PageFour />, index: true },
          { path: 'five', element: <PageFive /> },
          { path: 'six', element: <PageSix /> },
        ],
      },
      { path: 'section', element: <ProductListView /> },
      { path: 'section/new', element: <ProductEditView isNew /> },
      { path: 'section/:id/edit', element: <ProductEditView /> },
      { path: 'category', element: <CategoryListView /> },
      { path: 'category/new', element: <CategoryEditView isNew /> },
      { path: 'category/:id/edit', element: <CategoryEditView /> },
      { path: 'semifinished', element: <HalfMeals /> },
      { path: 'semifinished/new', element: <SemifinishedEditView /> },
      { path: 'semifinished/:id/edit', element: <SemifinishedEditView /> },
      { path: 'meals', element: <Meals /> },
      { path: 'meals/new', element: <MealEditView isNew /> },
      { path: 'meals/:id/edit', element: <MealEditView /> },
      { path: 'warehouse', element: <WarehouseListView /> },
      { path: 'warehouse/new', element: <WarehouseEditView isNew /> },
      { path: 'warehouse/:id/edit', element: <WarehouseEditView /> },
      { path: 'warehouse/stocks', element: <StocksListView /> },
      { path: 'warehouse/stocks/new', element: <StocksEditView isNew /> },
      { path: 'warehouse/stocks/:id/edit', element: <StocksEditView /> },
      { path: 'warehouse/transfers', element: <TransfersListView /> },
      { path: 'warehouse/transfers/new', element: <TransfersEditView isNew /> },
      { path: 'warehouse/transfers/:id/edit', element: <TransfersEditView /> },
      { path: 'warehouse/locations', element: <LocationsListView /> },
      { path: 'warehouse/locations/new', element: <LocationsEditView isNew /> },
      { path: 'warehouse/locations/:id/edit', element: <LocationsEditView /> },
      { path: 'warehouse/suppliers', element: <SuppliersListView /> },
      { path: 'warehouse/suppliers/new', element: <SuppliersEditView isNew /> },
      { path: 'warehouse/suppliers/:id/edit', element: <SuppliersEditView /> },
      { path: 'reports', element: <ReportsListView /> },
      { path: 'reports/new', element: <ReportsEditView isNew /> },
      { path: 'reports/:id/edit', element: <ReportsEditView /> },
      { path: 'reports/sales', element: <SalesListView /> },
      { path: 'reports/inventory', element: <InventoryReportsListView /> },
      { path: 'reports/custom', element: <CustomReportsListView /> },
      { path: 'reports/archives', element: <ArchivesListView /> },
      { path: 'settings', element: <SettingsListView /> },
      { path: 'settings/new', element: <SettingsEditView isNew /> },
      { path: 'settings/:id/edit', element: <SettingsEditView /> },
      { path: 'settings/general', element: <SettingsGeneralListView /> },
      { path: 'settings/profile', element: <SettingsProfileListView /> },
      { path: 'settings/notifications', element: <SettingsNotificationsListView /> },
      { path: 'settings/integrations', element: <SettingsIntegrationsListView /> },
    ],

  },
];
