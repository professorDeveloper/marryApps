import type { RouteObject } from 'react-router';

import { lazy } from 'react';

import { EmployeeFormView } from 'src/sections/user/employee';


const FloorPlanPage = lazy(() => import('src/pages/dashboard/floor-plan'));
const HallsPage = lazy(() => import('src/pages/dashboard/halls'));

const ConnectedDeviceListView = lazy(() =>
  import('src/sections/settings/connected-Device-list-view').then((m) => ({
    default: m.ConnectedDeviceListView,
  }))
);
const ManagementListView = lazy(() =>
  import('src/sections/settings/manegment-list-view').then((m) => ({
    default: m.ManagementListView,
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

export const settingRoutes: RouteObject[] = [
  { path: 'settings/users', element: <EmployeeListView /> },
  { path: 'settings/users/new', element: <EmployeeFormView isNew /> },
  { path: 'settings/users/:id/edit', element: <EmployeeFormView /> },
  { path: 'settings/devices', element: <ConnectedDeviceListView /> },
  { path: 'settings/management', element: <ManagementListView /> },
  { path: 'settings/restaurant-info', element: <RestaurantInfoListView /> },
  { path: 'settings/floor-plan', element: <FloorPlanPage /> },
  { path: 'settings/halls', element: <HallsPage /> },
  { path: 'settings/halls/:id', element: <FloorPlanPage /> },
];
