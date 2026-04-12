import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// Sign component
const SignPage = lazy(() => import('src/pages/dashboard/sign'));

// Meals components
const Meals = lazy(() =>
  import('src/sections/meals/meals-list-view').then((m) => ({ default: m.Meals }))
);
const MealEditView = lazy(() =>
  import('src/sections/meals/meals-edit-view').then((m) => ({ default: m.MealEditView }))
);

// Semifinished components
const HalfMeals = lazy(() =>
  import('src/sections/menu/compounds/compounds-list-view').then((m) => ({ default: m.HalfMeals }))
);
const CompoundEditViewWrapper = lazy(() =>
  import('src/sections/menu/compounds/compounds-edit-view').then((m) => ({
    default: m.CompoundEditViewWrapper,
  }))
);

// Products/Departments components
const ProductListView = lazy(() =>
  import('src/sections/menu/departments').then((m) => ({
    default: m.DepartmentListView,
  }))
);
const ProductEditView = lazy(() =>
  import('src/sections/menu/departments').then((m) => ({
    default: m.DepartmentEditView,
  }))
);
const CategoryListView = lazy(() =>
  import('src/sections/menu/category/category-list-view').then((m) => ({
    default: m.CategoryListView,
  }))
);
const CategoryEditViewWrapper = lazy(() =>
  import('src/sections/menu/category/category-edit-view').then((m) => ({
    default: m.CategoryEditViewWrapper,
  }))
);

// Ingredients components
const IngredientListView = lazy(() =>
  import('src/sections/warehouse/ingredients-list-view').then((m) => ({
    default: m.IngredientListView,
  }))
);
const IngredientEditViewWrapper = lazy(() =>
  import('src/sections/warehouse/ingredients-edit-view').then((m) => ({
    default: m.IngredientEditViewWrapper,
  }))
);
const IngredientEditViewV2Wrapper = lazy(() =>
  import('src/sections/warehouse/ingredients-edit-view-v2').then((m) => ({
    default: m.IngredientEditViewV2Wrapper,
  }))
);
const IngredientGroupListView = lazy(() =>
  import('src/sections/warehouse/ingredient-group-list-view').then((m) => ({
    default: m.IngredientGroupListView,
  }))
);
const IngredientGroupEditViewWrapper = lazy(() =>
  import('src/sections/warehouse/ingredient-group-edit-view').then((m) => ({
    default: m.IngredientGroupEditViewWrapper,
  }))
);

export const menuRoutes: RouteObject[] = [
  // Products/Departments
  { path: 'menu/departments', element: <ProductListView /> },
  { path: 'menu/departments/new', element: <ProductEditView isNew /> },
  { path: 'menu/departments/:id/edit', element: <ProductEditView /> },
  { path: 'menu/category', element: <CategoryListView /> },
  { path: 'menu/category/new', element: <CategoryEditViewWrapper isNew /> },
  { path: 'menu/category/:id/edit', element: <CategoryEditViewWrapper /> },
  
  // Semifinished
  { path: 'menu/semifinished', element: <HalfMeals /> },
  { path: 'menu/semifinished/new', element: <CompoundEditViewWrapper isNew /> },
  { path: 'menu/semifinished/:id/edit', element: <CompoundEditViewWrapper /> },
  
  // Meals
  { path: 'menu/meals', element: <Meals /> },
  { path: 'menu/meals/new', element: <MealEditView isNew /> },
  { path: 'menu/meals/:id/edit', element: <MealEditView /> },
  
  // Ingredients
  { path: 'menu/ingredient-group', element: <IngredientGroupListView /> },
  {
    path: 'menu/ingredient-group/new',
    element: <IngredientGroupEditViewWrapper isNew />,
  },
  {
    path: 'menu/ingredient-group/:id/edit',
    element: <IngredientGroupEditViewWrapper />,
  },
  { path: 'menu/ingredients', element: <IngredientListView /> },
  { path: 'menu/ingredients/new', element: <IngredientEditViewWrapper isNew /> },
  { path: 'menu/ingredients/:id/edit', element: <IngredientEditViewWrapper /> },
  { path: 'menu/ingredients/new-v2', element: <IngredientEditViewV2Wrapper isNew /> },
  { path: 'menu/ingredients/:id/edit-v2', element: <IngredientEditViewV2Wrapper /> },
];
