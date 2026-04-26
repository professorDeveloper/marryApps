# Ignored Filters Documentation

This document lists API filter parameters that are available but not currently wired to the UI in list page data tables. These filters may be added in the future when the corresponding UI controls (column filters, dropdown selectors, etc.) are implemented.

## Warehouse / Deductions

| API Endpoint | Filter Param | Reason Not Wired |
|---|---|---|
| `GET /api/v1/deductions` | `ingredient_id` | No column in table for filtering by ingredient. Would require a separate ingredient picker dropdown control not currently present in the UI. |

---

## Warehouse / Ingredient Stock

| API Endpoint | Filter Param | Reason Not Wired |
|---|---|---|
| `GET /api/v1/ingredient-stock` | `ingredient_id` / `ingredient_name` | The table uses the global `search` parameter for text search (which matches ingredient names), making a separate dropdown filter redundant. |
| `GET /api/v1/ingredient-stock` | `measurement` | No column filter UI for measurement units (kg, l, piece). The API supports filtering by this field, but no UI control exists to select it. |

---

## Warehouse / Transfers

| API Endpoint | Filter Param | Reason Not Wired |
|---|---|---|
| `GET /api/v1/transfers` | `from_branch_id`, `to_branch_id` | Backend does not fully support cross-branch filtering yet. Code comment flags this as TODO. Filters are applied client-side only for now. |
| `GET /api/v1/transfers` | `ingredient_id` | No column or UI control exists for selecting a specific ingredient. Would require an ingredient picker dropdown. |

---

## Cashbox / Transactions

| API Endpoint | Filter Param | Reason Not Wired |
|---|---|---|
| `GET /api/v1/transactions` | `pay_type` | No column filter UI for payment type (cash, card). The `pay_type` column displays the value but has no interactive filter dropdown. |

---

## Warehouse / Outgoing Invoices

| API Endpoint | Filter Param | Reason Not Wired |
|---|---|---|
| `GET /api/v1/outgoing-invoices` | `lang` | Language is set globally at the application level; per-request API override is not needed. |

---

## Warehouse / Separation Acts

| API Endpoint | Filter Param | Reason Not Wired |
|---|---|---|
| `GET /api/v1/separation-acts` | `lang` | Language is set globally at the application level; per-request API override is not needed. |

---

## Warehouse / Inventory

| API Endpoint | Filter Param | Reason Not Wired |
|---|---|---|
| `GET /api/v1/inventories` | `ingredient_id` | No ingredient column or filter UI in the inventory list view. A column for ingredient would need to be added to support this filter. |

---

## Users / Staff

| API Endpoint | Filter Param | Reason Not Wired |
|---|---|---|
| `GET /api/v1/users` | `sort_by`, `sort_order` | API documentation does not list sort parameters for this endpoint. Column header clicks do not trigger server-side sort. |
| `GET /api/v1/users` | `status` | The `status` column displays values but has no interactive filter dropdown. Additionally, the API documentation does not list `status` as a supported query parameter. |

---

## Implementation Path

To wire any of these filters in the future:

1. **Identify the list page** component and its corresponding API endpoint.
2. **Add the UI control** (e.g., dropdown filter, search box) to the data table column definition.
3. **Wire the control** to the parent component's state using `onFiltersChange` or similar handler.
4. **Pass the filter value** to the API call in the data-fetching hook or function.
5. **Update the hook/API call** to include the new parameter in the request query string.

All infrastructure is already in place to support this; only UI wiring is needed.
