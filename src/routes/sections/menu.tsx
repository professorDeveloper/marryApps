import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { Meals } from 'src/sections/meals/meals-list-view';
import { MealEditView } from 'src/sections/meals/meals-edit-view';
import { ProductListView } from 'src/sections/products/product-list-view';
import { ProductEditView } from 'src/sections/products/product-edit-view';
import { CategoryListView } from 'src/sections/category/category-list-view';
import { CategoryEditView } from 'src/sections/category/category-edit-view';
import { HalfMeals } from 'src/sections/semifinished/semifinished-list-view';
import { SemifinishedEditView } from 'src/sections/semifinished/semifinished-edit-view';

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
      { element: <Navigate to="product" replace />, index: true },
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
      { path: 'product', element: <ProductListView /> },
      { path: 'product/new', element: <ProductEditView isNew /> },
      { path: 'product/:id/edit', element: <ProductEditView /> },
      { path: 'category', element: <CategoryListView /> },
      { path: 'category/new', element: <CategoryEditView isNew /> },
      { path: 'category/:id/edit', element: <CategoryEditView /> },
      { path: 'semifinished', element: <HalfMeals /> },
      { path: 'semifinished/new', element: <SemifinishedEditView /> },
      { path: 'semifinished/:id/edit', element: <SemifinishedEditView /> },
      { path: 'meals', element: <Meals /> },
      { path: 'meals/new', element: <MealEditView isNew /> },
      { path: 'meals/:id/edit', element: <MealEditView /> },
    ],

  },
];
