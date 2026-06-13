import type { RouteObject } from 'react-router';

import { Outlet, Navigate } from 'react-router';
import { lazy, Suspense } from 'react';

import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { PageTransition } from 'src/components/animate/page-transition';

import { AuthGuard } from 'src/auth/guard';

import { menuRoutes } from './menu';
import { reportRoutes } from './reports';
import { cashboxRoutes } from './cashbox';
import { settingRoutes } from './settings';
import { warehouseRoutes } from './warehouse';

const ProfilePage = lazy(() => import('src/pages/profile'));
const DashboardPage = lazy(() => import('src/pages/dashboard/overview'));

// Demo / misc pages
const PageTwo = lazy(() => import('src/pages/dashboard/two'));
const PageThree = lazy(() => import('src/pages/dashboard/three'));
const PageFour = lazy(() => import('src/pages/dashboard/four'));
const PageFive = lazy(() => import('src/pages/dashboard/five'));
const PageSix = lazy(() => import('src/pages/dashboard/six'));
const FloorPlanPage = lazy(() => import('src/pages/dashboard/floor-plan'));
const HallsPage = lazy(() => import('src/pages/dashboard/halls'));
// ----------------------------------------------------------------------

function MainPaneFallback() {
  return (
    <LinearProgress
      color="inherit"
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 1200,
      }}
    />
  );
}

function SuspenseOutlet() {
  return (
    <Suspense fallback={<MainPaneFallback />}>
      <PageTransition>
        <Outlet />
      </PageTransition>
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
      { path: 'dashboard', element: <DashboardPage /> },
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
      ...menuRoutes,
      ...warehouseRoutes,
      ...reportRoutes,
      ...cashboxRoutes,
      { path: 'profile', element: <ProfilePage /> },
      ...settingRoutes,

      // Section root redirects: visiting a sidebar section's bare path
      // (e.g. /warehouse) redirects to its first tab instead of 404-ing.
      { path: 'storage', element: <Navigate to={paths.storage.storages.root} replace /> },
      { path: 'menu', element: <Navigate to={paths.menu.meals.root} replace /> },
      { path: 'operations', element: <Navigate to={paths.operations.invoices.root} replace /> },
      { path: 'cashbooks', element: <Navigate to={paths.cashbooks.orders.root} replace /> },
      { path: 'employee', element: <Navigate to={paths.employee.users} replace /> },
      { path: 'settings', element: <Navigate to={paths.settings.notifications.root} replace /> },
      { path: 'warehouse', element: <Navigate to={paths.warehouse.storage.root} replace /> },
    ],
  },
];
