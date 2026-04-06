import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { PageTransition } from 'src/components/animate/page-transition';

import { AuthGuard } from 'src/auth/guard';

import { menuRoutes } from './menu';
import { reportRoutes } from './reports';
import { cashboxRoutes } from './cashbox';
import { settingRoutes } from './settings';
import { warehouseRoutes } from './warehouse';

// Demo / misc pages
const PageTwo = lazy(() => import('src/pages/dashboard/two'));
const PageThree = lazy(() => import('src/pages/dashboard/three'));
const PageFour = lazy(() => import('src/pages/dashboard/four'));
const PageFive = lazy(() => import('src/pages/dashboard/five'));
const PageSix = lazy(() => import('src/pages/dashboard/six'));
const FloorPlanPage = lazy(() => import('src/pages/dashboard/floor-plan'));
const HallsPage = lazy(() => import('src/pages/dashboard/halls'));

// ----------------------------------------------------------------------

function SuspenseOutlet() {
  return (
    <Suspense fallback={<LoadingScreen />}>
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
      { element: <Navigate to="menu/departments" replace />, index: true },
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
      ...settingRoutes,
    ],
  },
];
