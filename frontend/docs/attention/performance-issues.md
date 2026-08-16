# Performance & Stability Issues — Findings & Status

> Documented during the May 2026 performance audit of report and ingredient pages.

---

## Fixed

### 1. `ReferenceError: today is not defined` — Ingredient Reports crash
**File:** `src/sections/reports/ingredients/ingredients-reports-list-view.tsx:156`  
**Root cause:** `toUtcDayBoundary(today)` was called inside a `useEffect` where `today` was never declared.  
**Fix:** Replaced with `toUtcDayBoundary(dayjs())`.

---

### 2. Infinite rerender loop — `Maximum update depth exceeded`
**File:** `src/hooks/use-time-filter.ts:15-16`  
**Root cause:** `startDate`/`endDate` were created as `dayjs(isoString)` on every render, producing new object references even when the underlying ISO string hadn't changed. Every report page had a `useEffect([startDate, endDate])` that set state → caused another render → fired again → infinite loop. This was the cause of ~1.8 GB RAM usage.  
**Fix:** Wrapped both with `useMemo` keyed on the ISO string so references are stable.

---

### 3. Duplicate `debouncedSearchQuery` effects in inventory report
**File:** `src/sections/reports/inventory/inventory-list-view.tsx`  
**Root cause:** Two separate `useEffect` blocks both reacted to `debouncedSearchQuery`, causing double state updates on every keystroke.  
**Fix:** Merged into a single effect.

---

### 4. Missing `useCallback` on pagination handlers in inventory report
**File:** `src/sections/reports/inventory/inventory-list-view.tsx`  
**Root cause:** `handlePaginationPageChange` and `handlePaginationRowsPerPageChange` were plain functions, recreated every render and passed as props to `DataTable` — forcing full table re-renders on every parent state change.  
**Fix:** Wrapped with `useCallback`.

---

### 5. Duplicate API calls for categories/departments in meals API
**File:** `src/hooks/use-meals-api.ts`  
**Root cause:** Both `getMeals()` and `getMealById()` independently fetched `/categories` and `/departments` on every call, tripling the number of network requests.  
**Fix:** Added module-level TTL cache (5 min) so reference data is shared across calls.

---

### 6. Static cache without TTL or invalidation in inventory report
**File:** `src/sections/reports/inventory/inventory-list-view.tsx`  
**Root cause:** Module-level `staticDataCache`/`staticDataPromise` had no invalidation — stale storages data was served indefinitely after the first fetch.  
**Fix:** Added `fetchedAt` timestamp and 5-minute TTL; cache clears and re-fetches after expiry.

---

## Known — Not Fixed (intentional or low priority)

### Nav sidebar dual-mounting
**File:** `src/layouts/dashboard/nav-vertical.tsx`  
Both full and mini nav layouts are always mounted in the DOM (CSS-hidden via `hiddenAnimatedStyles`). This is **intentional** — the 400ms CSS transition requires both to be present. Switching to conditional rendering would break the animation. Accept this tradeoff or implement a deferred-unmount pattern (e.g., keep in DOM for the transition duration, then unmount).

---

### Settings context causes wide rerenders on nav toggle
**File:** `src/components/settings/context/settings-provider.tsx`  
All consumers of `useSettingsContext()` rerender when any setting changes (e.g., `isNavMini`). Consider splitting into smaller contexts or using `useShallow`/selector pattern so components only rerender when the specific setting they use changes.

---

### Circular useEffect chain in ingredient reports (cascading state)
**File:** `src/sections/reports/ingredients/ingredients-reports-list-view.tsx`  
Effect at lines 117-125 depends on `[draftFilters, paginationModel.pageSize]` and sets both `paginationModel` and `filters`. Effect at lines 408-416 depends on `[startDate, endDate]` and sets `draftFilters`. These chain through each other on date changes: date change → `draftFilters` update → `filters` update → API call. Not a loop (no circular triggers), but causes 2–3 render cycles per user action. Can be optimized by merging filter application into a single effect or using `useReducer`.

---

### SWR `revalidateIfStale: true` on ingredient reports
**File:** `src/actions/ingredient-reports.ts`  
`revalidateIfStale: true` causes SWR to automatically refetch whenever the key changes AND the data is considered stale. Combined with the filter-driven key (which changes on every pagination/sort/date change), this can trigger more fetches than necessary. Consider `revalidateIfStale: false` and let explicit user actions drive refetches.

---

### Sales report uses mock data
**File:** `src/sections/reports/sales/sales-list-view.tsx`  
The sales list view uses `mockSalesData` instead of a real API. If this page is expected to be functional, replace with an actual API call.

---

### `useInventory` hook and `setInventoryFilters` stability
**File:** `src/sections/warehouse/inventory/hooks/use-inventory.ts`  
The `setInventoryFilters` function returned from `useInventory` may recreate on every render if not memoized inside the hook, causing `useEffect([draftFilters, setInventoryFilters])` in `inventory-list-view.tsx` to fire more than needed. Verify `setInventoryFilters` is wrapped in `useCallback` inside `use-inventory.ts`.
