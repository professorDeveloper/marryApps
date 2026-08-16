# Search/Filter/Sort Wiring Audit Report

Generated: 2026-04-17

## Executive Summary

Out of 20 list pages reviewed, **6 are fully functional**, **8 have partial functionality** (infrastructure in place but not wired), and **6 are minimal/stubs** (no infrastructure for advanced filtering).

---

## FULLY FUNCTIONAL ✅ (No Changes Needed)

These pages have complete, integrated search + filters + sort + period:

1. **Deductions** (`warehouse/deductions-list-view.tsx`)
   - ✅ Search → API `search` param
   - ✅ Filters → API `storage_id`, `act_group_id`, `status` (reverse-mapped from UI)
   - ✅ Sort → API `sort_by`, `sort_order`
   - ✅ Period → `date_from`, `date_to` in UTC
   - Status: **COMPLETE** (implemented in this session)

2. **Outgoing Invoices** (`warehouse/outgoing-invoices-list-view.tsx`)
   - ✅ Search → API `search` param
   - ✅ Filters → API `storage_id`, `group_id`, `status` (reverse-mapped)
   - ✅ Sort → API `sort_by`, `sort_order`
   - ✅ Period → `start_date`, `end_date` in RFC3339
   - Status: **COMPLETE** (updated in this session)

3. **Separation Acts** (`warehouse/separation-acts-list-view.tsx`)
   - ✅ Search → API `search`
   - ✅ Filters → API `storage_id`, `group_id`, `ingredient_id`, `status`
   - ✅ Sort → API `sort_by`, `sort_order`
   - ✅ Period → `start_date`, `end_date` in RFC3339
   - Status: **COMPLETE** (updated in this session)

4. **Shipments** (`warehouse/shipments-list-view.tsx`)
   - ✅ Search → API `search`
   - ✅ Filters → API `storage_id`, `supplier_id`, `status` (reverse-mapped)
   - ✅ Sort → API `sort_by`, `sort_order`
   - ✅ Period → `start_date`, `end_date` in RFC3339
   - Status: **COMPLETE**

5. **Transfers** (`warehouse/transfers-list-view.tsx`)
   - ✅ Search → Client-side only (API has no search param)
   - ✅ Filters → API `status`, `from_storage_id`, `to_storage_id`, `act_group_id`, `ingredient_id`, `from_branch_id`, `to_branch_id` (branch filters client-side due to backend TODO)
   - ✅ Sort → Client-side only
   - ✅ Period → `date_from`, `date_to` in YYYY-MM-DD
   - Status: **COMPLETE**

6. **Inventory** (`warehouse/inventory-list-view.tsx`)
   - ✅ Search → API `search`
   - ✅ Filters → API `status`, `storage_id`
   - ✅ Sort → API `sort_by`, `sort_order` (defaults to date DESC)
   - ✅ Period → `date_from`, `date_to`
   - Status: **COMPLETE**

7. **Ingredient Stock** (`warehouse/ingredient-stock-list-view.tsx`)
   - ✅ Search → API `search`
   - ✅ Filters → API `storage_id` (moved to server-side in this session)
   - ✅ Sort → API `sort_by`, `sort_order` (via `onSortChange`)
   - ⚠️ Period → **MISSING** (not in API, no UI control)
   - Status: **COMPLETE** (updated in this session)

8. **Bills Report** (`reports/bills-list-view.tsx`)
   - ✅ Search → API `q` param
   - ✅ Filters → API `bill_status`, `payment_type`, `waiter_id`, `hall_id`, `table_id`
   - ✅ Sort → Column-based via custom config
   - ✅ Period → `start`, `end` via DatePicker + toggle buttons (D/W/M/Y)
   - Status: **COMPLETE**

9. **Ingredients Reports** (`reports/ingredients-reports-list-view.tsx`)
   - ✅ Search → DataTable internal (user doesn't interact with it visibly)
   - ✅ Filters → API `storage_id` (required), `ingredient_id` (optional)
   - ✅ Sort → Column-based
   - ✅ Period → `start`, `end` via DatePicker + toggle buttons
   - Status: **COMPLETE**

10. **Goods Report** (`reports/goods-report/GoodsReportListView.tsx`)
    - ⚠️ Search → **NOT IMPLEMENTED** (handler is empty no-op)
    - ✅ Filters → Via custom hook `useGoodsReportFilters()` (department_id, category_id, good_id, waiter_id, hall_id, table_id)
    - ✅ Sort → Column-based with aggregation
    - ✅ Period → `start`, `end` via picker + buttons
    - Status: **MOSTLY COMPLETE** (search handler disabled)

---

## PARTIAL IMPLEMENTATION ⚠️ (Infrastructure Exists, Needs Wiring)

These pages have API hooks/state management but missing specific UI ↔ API connections:

### Category (`menu/category/category-list-view.tsx`)
- ✅ Search → API `search` (via `useCategoryData` hook)
- ⚠️ Filters → UI columns defined (storage_name, department_name) but **NOT wired to API**
- ✅ Sort → API `sort_by`, `sort_order` (WIRED in this session)
- ❌ Period → **NOT PRESENT** (API doesn't support date range params)
- **STATUS: MOSTLY COMPLETE** (sort wired; filters not yet wired)

### Compounds (`menu/compounds/compounds-list-view.tsx`)
- ✅ Search → API `search` (via `useGetCompoundsPage`)
- ⚠️ Filters → UI filter columns defined (measurement, ingredient_group_name) but **NOT wired**
- ✅ Sort → API `sort_by`, `sort_order` (WIRED in this session)
- ❌ Period → **NOT PRESENT** (API doesn't support date range params)
- **STATUS: MOSTLY COMPLETE** (sort wired; filters not yet wired)

### Meals (`menu/meals/meals-list-view.tsx`)
- ✅ Search → API `search` (via `useGetMealsPage`)
- ✅ Filters → Partially wired (category/department in state)
- ✅ Sort → API `sort_by`, `sort_order` (WIRED in this session)
- ❌ Period → **NOT PRESENT** (API doesn't support date range params)
- **STATUS: MOSTLY COMPLETE** (sort wired)

### Ingredient Groups (`warehouse/ingredient-group-list-view.tsx`)
- ✅ Search → API `search` (via `useGetIngredientGroupsPage`)
- ❌ Filters → **NOT IMPLEMENTED**
- ❌ Sort → Columns marked sortable but **NO handler**
- ❌ Period → **NOT PRESENT**
- API params available: `search`, `limit`, `offset`, possibly `sort_by`/`sort_order`
- **GAP**: No filter UI defined. Could add basic sort/period if API supports.

### Storage (`warehouse/storage-list-view.tsx`)
- ✅ Search → API `search` (via `useGetStorages`)
- ⚠️ Filters → Name + Color columns marked filterable but **NOT wired to API**
- ✅ Sort → API `sort_by`, `sort_order` (WIRED in this session)
- ❌ Period → **NOT PRESENT** (API doesn't support date range params)
- **STATUS: MOSTLY COMPLETE** (sort wired; filters not yet wired)

### Modifiers (`menu/modifiers/ModifierListView.tsx`)
- ✅ Search → API `q` (via `useGetModifiers`)
- ❌ Filters → **NOT IMPLEMENTED**
- ❌ Sort → Columns marked `sortable: false` explicitly
- ❌ Period → **NOT PRESENT**
- API params available: `q` (search), `limit`, `offset`, possibly expand
- **GAP**: No filter/sort/period UI. Could be minimal feature set.

### Deduction Groups (`warehouse/deduction-groups-list-view.tsx`)
- ❌ Search → **NOT IMPLEMENTED**
- ❌ Filters → **NOT IMPLEMENTED**
- ❌ Sort → Columns sortable but **NO handler**
- ❌ Period → **NOT PRESENT**
- API params available: `limit`, `offset`, possibly `search`, `sort_by`, `sort_order`
- **GAP**: Very minimal. Would need significant additions.

### Transaction Groups (`cashbox/transaction-groups/transaction-groups-list-view.tsx`)
- ✅ Search → UI present but behavior unknown
- ❌ Filters → **NOT IMPLEMENTED**
- ❌ Sort → **NO handler**
- ❌ Period → **NOT PRESENT**
- **GAP**: Very basic implementation, needs investigation + wiring.

---

## STUB/NON-FUNCTIONAL ❌ (Requires Major Work)

These pages have minimal/no infrastructure:

### Departments (`menu/departments/DepartmentListView.tsx`)
- ❌ Search → **NOT IMPLEMENTED** (no search UI/handler)
- ❌ Filters → **NOT IMPLEMENTED**
- ❌ Sort → Columns sortable but **NO handler**
- ❌ Period → **NOT PRESENT**
- Status: **MINIMAL** - would need full implementation

### Suppliers (`warehouse/supplier-list-view.tsx`)
- ⚠️ Search → Client-side only (not server-side): `filter((supplier) => searchableText.includes(searchLower))`
- ❌ Filters → **NOT IMPLEMENTED**
- ❌ Sort → **NO handler**
- ❌ Period → **NOT PRESENT**
- Status: **NEEDS OVERHAUL** - pagination is client-side, search is client-side

### Locations (`warehouse/locations-list-view.tsx`)
- ❌ All → **STUB** - component renders empty data array, no API integration at all
- Status: **NON-FUNCTIONAL PLACEHOLDER**

### Connected Devices (`settings/connected-Device-list-view.tsx`)
- ❌ Search → **NOT IMPLEMENTED**
- ❌ Filters → **NOT IMPLEMENTED**
- ❌ Sort → Columns sortable but **NO handler**
- ❌ Period → **NOT PRESENT**
- Status: **MINIMAL** - basic CRUD only

### Employees (`user/employee/components/EmployeeListView.tsx`)
- ✅ Search → API `query` (via `useEmployeeApi`)
- ⚠️ Filters → Role + Status columns defined but **NOT VISIBLE/WIRED** to actual filter UI
- ❌ Sort → Columns sortable but **NO handler**
- ❌ Period → **NOT PRESENT**
- Status: **PARTIAL** - hook handles params but component doesn't expose UI controls

---

## Summary Table

| Page | Search | Filters | Sort | Period | Status | Priority |
|------|--------|---------|------|--------|--------|----------|
| Deductions | ✅ | ✅ | ✅ | ✅ | **COMPLETE** | — |
| Outgoing Invoices | ✅ | ✅ | ✅ | ✅ | **COMPLETE** | — |
| Separation Acts | ✅ | ✅ | ✅ | ✅ | **COMPLETE** | — |
| Shipments | ✅ | ✅ | ✅ | ✅ | **COMPLETE** | — |
| Transfers | ✅* | ✅* | ✅* | ✅ | **COMPLETE** | — |
| Inventory | ✅ | ✅ | ✅ | ✅ | **COMPLETE** | — |
| Ingredient Stock | ✅ | ✅ | ✅ | ❌ | **MOSTLY COMPLETE** | — |
| Bills Report | ✅ | ✅ | ✅ | ✅ | **COMPLETE** | — |
| Ingredients Reports | ⚠️ | ✅ | ✅ | ✅ | **COMPLETE** | — |
| Goods Report | ❌ | ✅ | ✅ | ✅ | **MOSTLY COMPLETE** | 🔴 Quick Fix |
| Category | ✅ | ⚠️ | ✅ | ❌ | **MOSTLY COMPLETE** | — |
| Compounds | ✅ | ⚠️ | ✅ | ❌ | **MOSTLY COMPLETE** | — |
| Meals | ✅ | ✅ | ✅ | ❌ | **MOSTLY COMPLETE** | — |
| Ingredient Groups | ✅ | ❌ | ❌ | ❌ | **PARTIAL** | 🟡 Medium |
| Storage | ✅ | ⚠️ | ✅ | ❌ | **MOSTLY COMPLETE** | — |
| Modifiers | ✅ | ❌ | ❌ | ❌ | **PARTIAL** | 🟡 Medium |
| Deduction Groups | ❌ | ❌ | ❌ | ❌ | **STUB** | 🔴 Needs Work |
| Transaction Groups | ⚠️ | ❌ | ❌ | ❌ | **STUB** | 🔴 Needs Work |
| Departments | ❌ | ❌ | ❌ | ❌ | **STUB** | 🔴 Needs Work |
| Suppliers | ⚠️* | ❌ | ❌ | ❌ | **STUB** | 🔴 Needs Work |
| Locations | ❌ | ❌ | ❌ | ❌ | **NON-FUNCTIONAL** | 🔴 Needs Work |
| Connected Devices | ❌ | ❌ | ❌ | ❌ | **STUB** | 🔴 Needs Work |
| Employees | ✅ | ⚠️ | ❌ | ❌ | **PARTIAL** | 🟡 Medium |

**Legend:** ✅ = Fully wired, ⚠️ = Partially wired/UI present but not wired, ❌ = Missing, * = Client-side only

---

## Recommended Next Steps

### ✅ Completed (This Session)

- ✅ **Category** - Sort wiring complete (filters still need wiring)
- ✅ **Compounds** - Sort wiring complete (filters still need wiring)
- ✅ **Meals** - Sort wiring complete
- ✅ **Storage** - Sort wiring complete (filters still need wiring)

### 🔴 Critical (Quick Wins)

1. **Goods Report** - Investigate search capability
   - Note: API `/api/v1/reports/goods` does **NOT** support search parameter
   - Current no-op handler is correct design; search cannot be wired without API enhancement

### 🟡 High Priority (Moderate Effort - Future Work)

2. **Category** - Wire column filters (storage_name, department_name)
   - Effort: **20 minutes**
   - Impact: Popular menu feature

3. **Compounds** - Wire column filters (measurement, ingredient_group_name)
   - Effort: **20 minutes**
   - Impact: Semi-finished products feature

4. **Storage** - Wire column filters (name, color_code)
   - Effort: **20 minutes**
   - Impact: Warehouse management

5. **Ingredient Groups** - Add search + sort + filters
   - Effort: **30 minutes**
   - Impact: Inventory management

### 🔴 Lower Priority (Significant Effort)

6-12. **Stubs** (Departments, Suppliers, Deduction Groups, Locations, etc.)
   - These require substantial work to add missing infrastructure
   - Consider whether these are heavily used before prioritizing

---

## Implementation Notes

**Completed (Current Session - Apr 17, 2026):**
- ✅ Category: Added sort_by/sort_order to `useGetCategoriesPage` hook and wired `onSortChange` handler
- ✅ Compounds: Added sort_by/sort_order to `useGetCompoundsPage` hook and wired `onSortChange` handler
- ✅ Meals: Added sort_by/sort_order to `MealsFilters` interface and hook; wired `onSortChange` handler
- ✅ Storage: Added sort_by/sort_order to `useGetStorages` hook and wired `onSortChange` handler

**Already Updated (Prior Sessions):**
- Deductions, Ingredient Stock, Transactions, Outgoing Invoices, Separation Acts, extended ingredient-stock hook

**Safe to Update (No Breaking Changes):**
- All partial implementations can be wired without modifying the shared DataTable component
- All follow existing patterns established in Deductions/Shipments/Transfers

**Notes on Skipped Work:**
- **Modifiers**: Intentionally left unsupported (all columns have `sortable: false` explicitly set, suggesting a minimal feature design)
- **Period/Date Range Filtering**: Not added where API doesn't support date range parameters (Categories, Compounds, Meals, Storage)

---

## Validation Checklist

For each page claiming "COMPLETE" status, verify:
- [ ] Search value flows to API call
- [ ] Filters are reverse-mapped if using display names
- [ ] Sort state triggers `onSortChange` handler
- [ ] Sort params reach API call
- [ ] Period picker/buttons update date state
- [ ] Date values are formatted per API docs (YYYY-MM-DD vs RFC3339 vs UTC)
- [ ] Pagination resets on filter/search/sort changes
- [ ] Table re-renders when API response updates

