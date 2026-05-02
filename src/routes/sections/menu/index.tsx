import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router';

import LinearProgress from '@mui/material/LinearProgress';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

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
const AnalyticsPage = lazy(() => import('src/pages/analytics'));

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
      { path: 'analytics', element: <AnalyticsPage /> },
      ...settingRoutes,
    ],
  },
];
