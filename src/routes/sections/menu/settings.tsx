import type { RouteObject } from 'react-router';

import { lazy } from 'react';

const EmployeeFormView = lazy(() =>
  import('src/sections/user/employee').then((m) => ({
    default: m.EmployeeFormView,
  }))
);

const FloorPlanPage = lazy(() => import('src/pages/dashboard/floor-plan'));
const HallsPage = lazy(() => import('src/pages/dashboard/halls'));

const ConnectedDeviceListView = lazy(() =>
  import('src/sections/settings/connected-Device-list-view').then((m) => ({
    default: m.ConnectedDeviceListView,
  }))
);
const RestaurantInfoListView = lazy(() =>
  import('src/sections/settings/restaurant-info').then((m) => ({
    default: m.RestaurantInfoListView,
  }))
);
const EmployeeListView = lazy(() =>
  import('src/sections/user/employee').then((m) => ({
    default: m.EmployeeListView,
  }))
);

const ShiftsListView = lazy(() =>
  import('src/sections/staffing/shifts/ShiftsListView').then((m) => ({
    default: m.ShiftsListView,
  }))
);

const KpiListView = lazy(() =>
  import('src/sections/staffing/kpi/KpiListView').then((m) => ({
    default: m.KpiListView,
  }))
);

const SalaryReportView = lazy(() =>
  import('src/sections/staffing/salary/SalaryReportView').then((m) => ({
    default: m.SalaryReportView,
  }))
);

export const settingRoutes: RouteObject[] = [
  { path: 'employee/users', element: <EmployeeListView /> },
  { path: 'employee/users/new', element: <EmployeeFormView isNew /> },
  { path: 'employee/users/:id/edit', element: <EmployeeFormView /> },
  { path: 'settings/devices', element: <ConnectedDeviceListView /> },
  { path: 'settings/restaurant-info', element: <RestaurantInfoListView /> },
  { path: 'settings/floor-plan', element: <FloorPlanPage /> },
  { path: 'settings/halls', element: <HallsPage /> },
  { path: 'settings/halls/:id', element: <FloorPlanPage /> },
  { path: 'employee/shifts', element: <ShiftsListView /> },
  { path: 'employee/kpi', element: <KpiListView /> },
  { path: 'employee/salary', element: <SalaryReportView /> },
];
