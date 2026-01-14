import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { Meals } from 'src/sections/meals/meals-list-view';
import { MealEditView } from 'src/sections/meals/meals-edit-view';
import { SalesListView } from 'src/sections/reports/sales-list-view';
import { HalfMeals } from 'src/sections/compounds/compounds-list-view';
import { ReportsEditView } from 'src/sections/reports/reports-edit-view';
import { ReportsListView } from 'src/sections/reports/reports-list-view';
import { StocksEditView } from 'src/sections/warehouse/stocks-edit-view';
import { StocksListView } from 'src/sections/warehouse/stocks-list-view';
import { ArchivesListView } from 'src/sections/reports/archives-list-view';
import { CategoryListView } from 'src/sections/category/category-list-view';
import { CustomReportsListView } from 'src/sections/reports/custom-list-view';
import { ProductEditView } from 'src/sections/products/departments-edit-view';
import { ProductListView } from 'src/sections/products/departments-list-view';
import { LocationsEditView } from 'src/sections/warehouse/locations-edit-view';
import { LocationsListView } from 'src/sections/warehouse/locations-list-view';
import { SuppliersEditView } from 'src/sections/warehouse/suppliers-edit-view';
import { SuppliersListView } from 'src/sections/warehouse/suppliers-list-view';
import { TransfersEditView } from 'src/sections/warehouse/transfers-edit-view';
import { TransfersListView } from 'src/sections/warehouse/transfers-list-view';
import { WarehouseEditView } from 'src/sections/warehouse/warehouse-edit-view';
import { WarehouseListView } from 'src/sections/warehouse/warehouse-list-view';
import { ConnectedDeviceListView } from 'src/sections/settings/connected-Device-list-view';
import { ManagementListView } from 'src/sections/settings/manegment-list-view';
import { CategoryEditViewWrapper } from 'src/sections/category/category-edit-view';
import { InventoryReportsListView } from 'src/sections/reports/inventory-list-view';
import { CompoundEditViewWrapper } from 'src/sections/compounds/compounds-edit-view';
import { RestaurantInfoListView } from 'src/sections/settings/restaurant-info';

import { AuthGuard } from 'src/auth/guard';

import { usePathname } from '../hooks';
import { EmployeesPage } from 'src/pages/dashboard/user/employees';
import { RestaurantStaffPage } from 'src/pages/dashboard/user/restaurant-staff';
import { EmployeeNewPage } from 'src/pages/dashboard/user/new';
import { EmployeeEditPage } from 'src/pages/dashboard/user/edit';
import { RestaurantStaffNewPage } from 'src/pages/dashboard/user/restaurant-staff-new';
import { RestaurantStaffEditPage } from 'src/pages/dashboard/user/restaurant-staff-edit';

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

const dashboardLayoutElement = CONFIG.auth.skip ? (
  <DashboardLayout>
    <SuspenseOutlet />
  </DashboardLayout>
) : (
  <AuthGuard>
    <DashboardLayout>
      <SuspenseOutlet />
    </DashboardLayout>
  </AuthGuard>
);

export const dashboardRoutes: RouteObject[] = [
  {
    element: dashboardLayoutElement,
    children: [
      {
        path: 'menu',
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
          { path: 'category/new', element: <CategoryEditViewWrapper isNew /> },
          { path: 'category/:id/edit', element: <CategoryEditViewWrapper /> },
          { path: 'user', element: <EmployeesPage /> },
          { path: 'user/restaurant-staff', element: <RestaurantStaffPage /> },
          { path: 'user/new', element: <EmployeeNewPage /> },
          { path: 'user/:id/edit', element: <EmployeeEditPage /> },
          { path: 'user/restaurant-staff/new', element: <RestaurantStaffNewPage /> },
          { path: 'user/restaurant-staff/:id/edit', element: <RestaurantStaffEditPage /> },
          { path: 'semifinished', element: <HalfMeals /> },
          { path: 'semifinished/new', element: <CompoundEditViewWrapper isNew /> },
          { path: 'semifinished/:id/edit', element: <CompoundEditViewWrapper /> },
          { path: 'meals', element: <Meals /> },
          { path: 'meals/new', element: <MealEditView isNew /> },
          { path: 'meals/:id/edit', element: <MealEditView /> },
          { path: 'inventory', element: <WarehouseListView /> },
          { path: 'inventory/new', element: <WarehouseEditView isNew /> },
          { path: 'inventory/:id/edit', element: <WarehouseEditView /> },
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
        ],
      },
      {
        path: 'setting',
        children: [
          { path: 'connected-device', element: <ConnectedDeviceListView /> },
          { path: 'management', element: <ManagementListView /> },
          { path: 'restaurant-info', element: <RestaurantInfoListView /> },
        ],
      },
    ],
  },
];
