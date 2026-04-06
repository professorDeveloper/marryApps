import type { RouteObject } from 'react-router';

import { lazy } from 'react';

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
const UsersPage = lazy(() =>
  import('src/pages/dashboard/settings/users').then((m) => ({
    default: m.UsersPage,
  }))
);

export const settingRoutes: RouteObject[] = [
  { path: 'settings/users', element: <UsersPage /> },
  { path: 'settings/connected-device', element: <ConnectedDeviceListView /> },
  { path: 'settings/management', element: <ManagementListView /> },
  { path: 'settings/restaurant-info', element: <RestaurantInfoListView /> },
  { path: 'settings/floor-plan', element: <FloorPlanPage /> },
  { path: 'settings/halls', element: <HallsPage /> },
];
