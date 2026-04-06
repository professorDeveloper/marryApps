import type { RouteObject } from 'react-router';

import { lazy } from 'react';


// Storage
const WarehouseStorageListView = lazy(() =>
  import('src/sections/warehouse/storage-list-view').then((m) => ({ default: m.WarehouseStorageListView }))
);
const WarehouseEditView = lazy(() =>
  import('src/sections/storage/storage-edit-view').then((m) => ({ default: m.WarehouseEditView }))
);

// Inventory
const InventoryListView = lazy(() =>
  import('src/sections/warehouse/inventory-list-view').then((m) => ({
    default: m.InventoryListView,
  }))
);
const InventoryFormView = lazy(() =>
  import('src/sections/warehouse/inventory').then((m) => ({ default: m.InventoryFormView }))
);

// Stocks
const StocksListView = lazy(() =>
  import('src/sections/warehouse/stocks-list-view').then((m) => ({ default: m.StocksListView }))
);
const StocksEditView = lazy(() =>
  import('src/sections/warehouse/stocks-edit-view').then((m) => ({ default: m.StocksEditView }))
);

// Transfers
const TransfersListView = lazy(() =>
  import('src/sections/warehouse/transfers-list-view').then((m) => ({
    default: m.TransfersListView,
  }))
);
const TransfersFormView = lazy(() => import('src/sections/warehouse/transfers-edit-view'));

// Shipments
const ShipmentsListView = lazy(() =>
  import('src/sections/warehouse/shipments-list-view').then((m) => ({
    default: m.ShipmentsListView,
  }))
);
const ShipmentsFormView = lazy(() => import('src/sections/warehouse/shipments-edit-view'));

// Outgoing invoices
const OutgoingInvoicesListView = lazy(() =>
  import('src/sections/warehouse/outgoing-invoices-list-view').then((m) => ({
    default: m.OutgoingInvoicesListView,
  }))
);
const OutgoingInvoiceFormView = lazy(
  () => import('src/sections/warehouse/outgoing-invoices-edit-view')
);

// Separation acts
const SeparationActsListView = lazy(() =>
  import('src/sections/warehouse/separation-acts-list-view').then((m) => ({
    default: m.SeparationActsListView,
  }))
);
const SeparationActsFormView = lazy(
  () => import('src/sections/warehouse/separation-acts-edit-view')
);

// Locations
const LocationsListView = lazy(() =>
  import('src/sections/warehouse/locations-list-view').then((m) => ({
    default: m.LocationsListView,
  }))
);
const LocationsEditView = lazy(() =>
  import('src/sections/warehouse/locations-edit-view').then((m) => ({
    default: m.LocationsEditView,
  }))
);

// Suppliers
const InvoicesListView = lazy(() =>
  import('src/sections/warehouse/supplier-list-view').then((m) => ({
    default: m.InvoicesListView,
  }))
);
const SupplierEditView = lazy(() =>
  import('src/sections/warehouse/supplier-edit-view').then((m) => ({
    default: m.SupplierEditView,
  }))
);

// Ingredient groups
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

// Ingredients
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
const IngredientStockListView = lazy(
  () => import('src/sections/warehouse/ingredient-stock-list-view')
);

// Invoices
const InvoiceFormView = lazy(
  () => import('src/sections/warehouse/invoice/components/InvoiceFormView')
);
const InvoiceDetailsStandaloneListView = lazy(() =>
  import('src/sections/warehouse/invoice-details-standalone-list-view').then((m) => ({
    default: m.InvoiceDetailsStandaloneListView,
  }))
);
const InvoiceDetailsEditView = lazy(() =>
  import('src/sections/warehouse/invoice-details-edit-view').then((m) => ({
    default: m.InvoiceDetailsEditView,
  }))
);

// Deductions
const DeductionsListView = lazy(() =>
  import('src/sections/warehouse/deductions-list-view').then((m) => ({
    default: m.DeductionsListView,
  }))
);
const DeductionFormView = lazy(() => import('src/sections/warehouse/deductions-edit-view'));
const DeductionGroupsListView = lazy(() =>
  import('src/sections/warehouse/deduction-groups-list-view').then((m) => ({
    default: m.DeductionGroupsListView,
  }))
);
const DeductionGroupEditView = lazy(() =>
  import('src/sections/warehouse/deduction-group-edit-view').then((m) => ({
    default: m.DeductionGroupEditView,
  }))
);

// Orders
const OrdersManagementView = lazy(() =>
  import('src/sections/warehouse/orders-management-view').then((m) => ({
    default: m.OrdersManagementView,
  }))
);
const OrdersCreateView = lazy(() =>
  import('src/sections/warehouse/orders-create-view').then((m) => ({
    default: m.OrdersCreateView,
  }))
);

export const warehouseRoutes: RouteObject[] = [
  // Warehouse Storage
  { path: 'warehouse/storage', element: <WarehouseStorageListView /> },
  { path: 'warehouse/stocks/new', element: <StocksEditView isNew /> },
  { path: 'warehouse/stocks/:id/edit', element: <StocksEditView /> },
  { path: 'warehouse/transfers', element: <TransfersListView /> },
  { path: 'warehouse/transfers/new', element: <TransfersFormView isNew /> },
  { path: 'warehouse/transfers/:id/edit', element: <TransfersFormView /> },
  { path: 'warehouse/inventories', element: <InventoryListView /> },
  { path: 'warehouse/inventories/new', element: <InventoryFormView /> },
  { path: 'warehouse/inventories/:id/edit', element: <InventoryFormView /> },
  { path: 'warehouse/shipments', element: <ShipmentsListView /> },
  { path: 'warehouse/shipments/new', element: <ShipmentsFormView /> },
  { path: 'warehouse/shipments/:id/edit', element: <ShipmentsFormView /> },
  { path: 'warehouse/expenses-invoices', element: <OutgoingInvoicesListView /> },
  { path: 'warehouse/expenses-invoices/new', element: <OutgoingInvoiceFormView /> },
  { path: 'warehouse/expenses-invoices/:id/edit', element: <OutgoingInvoiceFormView /> },
  { path: 'warehouse/separations-acts', element: <SeparationActsListView /> },
  { path: 'warehouse/separations-acts/new', element: <SeparationActsFormView /> },
  { path: 'warehouse/separations-acts/:id/edit', element: <SeparationActsFormView /> },
  { path: 'warehouse/locations', element: <LocationsListView /> },
  { path: 'warehouse/locations/new', element: <LocationsEditView isNew /> },
  { path: 'warehouse/locations/:id/edit', element: <LocationsEditView /> },
  { path: 'warehouse/suppliers', element: <InvoicesListView /> },
  { path: 'warehouse/suppliers/new', element: <SupplierEditView isNew /> },
  { path: 'warehouse/suppliers/:id/edit', element: <SupplierEditView /> },
 
  { path: 'warehouse/ingredient-stock', element: <IngredientStockListView /> },
  { path: 'warehouse/invoices', element: <InvoicesListView /> },
  { path: 'warehouse/invoices/new', element: <InvoiceFormView /> },
  { path: 'warehouse/invoices/:id/edit', element: <InvoiceFormView /> },
  { path: 'warehouse/invoice-details', element: <InvoiceDetailsStandaloneListView /> },
  { path: 'warehouse/invoice-details/new', element: <InvoiceDetailsEditView isNew /> },
  { path: 'warehouse/invoice-details/:id/edit', element: <InvoiceDetailsEditView /> },
  { path: 'warehouse/deductions', element: <DeductionsListView /> },
  { path: 'warehouse/deductions/new', element: <DeductionFormView isNew /> },
  { path: 'warehouse/deductions/:id', element: <DeductionFormView /> },
  { path: 'warehouse/deduction-groups', element: <DeductionGroupsListView /> },
  { path: 'warehouse/deduction-groups/new', element: <DeductionGroupEditView isNew /> },
  { path: 'warehouse/deduction-groups/:id/edit', element: <DeductionGroupEditView /> },
  { path: 'warehouse/orders', element: <OrdersManagementView /> },
  { path: 'warehouse/orders/new', element: <OrdersCreateView /> },
];
