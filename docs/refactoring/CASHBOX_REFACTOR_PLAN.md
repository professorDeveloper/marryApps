# Cashbox Sections Refactoring Plan

## Overview
The `src/sections/cashbox/` folder contains **4 independent feature sections** (cashiers, transaction-groups, transactions, cashbox-report) that are currently disorganized at the root level. They need to be reorganized into modular subsections following the project's feature-based architecture.

## Current Structure ❌
```
src/sections/cashbox/
├── cashiers-list-view.tsx (331 lines)
├── cashiers-edit-view.tsx (132 lines)
├── transaction-groups-list-view.tsx (173 lines)
├── transaction-groups-edit-view.tsx (130 lines)
├── transactions-list-view.tsx (5 lines) → wrapper
├── transactions-edit-view.tsx (404 lines)
├── cashbox-report-view.tsx (570 lines)
├── transfer-edit-view.tsx (444 lines)
├── transfer-list-view.tsx (227 lines)
└── transactions/
    ├── components/
    │   ├── TransactionsActions.tsx
    │   ├── TransactionsDataTable.tsx
    │   └── TransactionsFilters.tsx
    ├── TransactionsListView.tsx
    └── index.ts
```

### Issues
1. **Inconsistent organization** — Some features have subfolders (transactions), others at root (cashiers, transfer)
2. **Duplicate logic** — Date utilities, filters, table configurations scattered across files
3. **No shared utilities** — Each view re-implements similar filtering/pagination patterns
4. **Large monolithic files** — cashbox-report-view (570), transactions-edit-view (404), transfer-edit-view (444)
5. **Missing structure** — No dedicated hooks, types, constants, utils per feature
6. **Wrong abstraction** — "transfer" is shown but should be part of transactions or separate feature

## Target Structure ✅
```
src/sections/cashbox/
├── cashiers/
│   ├── components/
│   │   ├── CashierTableRow.tsx
│   │   ├── CashierDeleteDialog.tsx
│   │   └── CashierFilters.tsx
│   ├── hooks/
│   │   └── useCashierFormConfig.ts
│   ├── utils/
│   │   └── cashier-helpers.ts
│   ├── types.ts
│   ├── constants.ts
│   ├── cashiers-list-view.tsx
│   ├── cashiers-edit-view.tsx
│   └── index.ts
│
├── transaction-groups/
│   ├── components/
│   │   ├── TransactionGroupTableRow.tsx
│   │   ├── TransactionGroupDeleteDialog.tsx
│   │   └── TransactionGroupFilters.tsx
│   ├── hooks/
│   │   └── useTransactionGroupFormConfig.ts
│   ├── utils/
│   │   └── transaction-group-helpers.ts
│   ├── types.ts
│   ├── constants.ts
│   ├── transaction-groups-list-view.tsx
│   ├── transaction-groups-edit-view.tsx
│   └── index.ts
│
├── transactions/
│   ├── components/
│   │   ├── TransactionsActions.tsx ✓ (keep)
│   │   ├── TransactionsDataTable.tsx ✓ (refactor)
│   │   ├── TransactionsFilters.tsx ✓ (keep)
│   │   ├── TransactionsTableRow.tsx (extract)
│   │   └── TransactionDeleteDialog.tsx (extract)
│   ├── hooks/
│   │   ├── useTransactionsData.ts (extract)
│   │   ├── useTransactionFormConfig.ts (extract)
│   │   └── useTransactionFilters.ts (extract)
│   ├── utils/
│   │   ├── transaction-helpers.ts (extract)
│   │   └── date-utils.ts (new)
│   ├── types.ts
│   ├── constants.ts
│   ├── transactions-list-view.tsx (fix wrapper)
│   ├── transactions-edit-view.tsx (refactor)
│   ├── TransactionsListView.tsx (deprecate/remove)
│   └── index.ts
│
├── transfers/
│   ├── components/
│   │   ├── TransferTableRow.tsx
│   │   ├── TransferDeleteDialog.tsx
│   │   └── TransferFilters.tsx
│   ├── hooks/
│   │   ├── useTransferData.ts
│   │   └── useTransferFormConfig.ts
│   ├── utils/
│   │   └── transfer-helpers.ts
│   ├── types.ts
│   ├── constants.ts
│   ├── transfer-list-view.tsx
│   ├── transfer-edit-view.tsx
│   └── index.ts
│
├── cashbox-report/
│   ├── components/
│   │   ├── ReportFilters.tsx
│   │   ├── ReportTable.tsx
│   │   └── ReportSummary.tsx
│   ├── hooks/
│   │   ├── useReportData.ts
│   │   └── useReportFilters.ts
│   ├── utils/
│   │   ├── report-helpers.ts
│   │   └── date-utils.ts
│   ├── types.ts
│   ├── constants.ts
│   ├── cashbox-report-view.tsx (refactored)
│   └── index.ts
│
└── index.ts (root export)
```

## Shared Utilities (To Extract)

### Date utilities (used by all features)
```typescript
// src/sections/cashbox/utils/date-utils.ts
export const getTodayUtcBoundary = (endOfDay = false): string => { ... }
export const toUtcDayBoundary = (value: dayjs.Dayjs, endOfDay = false): string => { ... }
export const toPickerDate = (value?: string): dayjs.Dayjs | null => { ... }
```

### Generic filter hooks pattern
Extract from current implementations to reusable pattern (similar to warehouse refactoring).

## Refactoring Steps by Feature

### Feature 1: Cashiers
**Files:** cashiers-list-view.tsx, cashiers-edit-view.tsx

**Changes:**
1. Create `src/sections/cashbox/cashiers/` folder structure
2. Extract table row rendering to `components/CashierTableRow.tsx`
3. Extract delete dialog to `components/CashierDeleteDialog.tsx`
4. Create `types.ts`, `constants.ts` with cashier-specific types
5. Create `hooks/useCashierFormConfig.ts` for form configuration
6. Move files to new location
7. Update imports in list/edit views
8. Update route imports

**Estimated Lines Changed:** ~100 imports across 2 main files

---

### Feature 2: Transaction Groups
**Files:** transaction-groups-list-view.tsx, transaction-groups-edit-view.tsx

**Changes:**
1. Create `src/sections/cashbox/transaction-groups/` folder structure
2. Extract table row rendering to `components/TransactionGroupTableRow.tsx`
3. Extract delete dialog to `components/TransactionGroupDeleteDialog.tsx`
4. Create `types.ts`, `constants.ts`
5. Create `hooks/useTransactionGroupFormConfig.ts`
6. Move files to new location
7. Update imports

**Estimated Lines Changed:** ~100 imports

---

### Feature 3: Transactions (Most Complex)
**Files:** transactions-list-view.tsx, transactions-edit-view.tsx, TransactionsListView.tsx, + components

**Changes:**
1. Clean up root-level file: `transactions-list-view.tsx` is a wrapper → make it proper re-export
2. Rename `TransactionsListView.tsx` inside `transactions/` folder (was duplicate)
3. Extract `transactions-edit-view.tsx` logic into feature structure:
   - Create `hooks/useTransactionFormConfig.ts`
   - Extract form sections to `components/`
   - Move edit view to `transactions/transactions-edit-view.tsx`
4. Extract shared date utilities to `utils/date-utils.ts`
5. Create `types.ts`, `constants.ts`
6. Refactor components:
   - Keep `TransactionsActions.tsx`, `TransactionsDataTable.tsx`, `TransactionsFilters.tsx`
   - Add `TransactionsTableRow.tsx`, `TransactionDeleteDialog.tsx`
   - Split large `TransactionsDataTable.tsx` if > 300 lines
7. Create `hooks/useTransactionsData.ts` for data fetching/pagination
8. Create `hooks/useTransactionFilters.ts` for filter logic
9. Update all imports (including route config)

**Estimated Lines Changed:** ~300 imports and logic refactoring

---

### Feature 4: Transfers
**Files:** transfer-list-view.tsx, transfer-edit-view.tsx

**Changes:**
1. Create `src/sections/cashbox/transfers/` folder structure
2. Extract table row rendering to `components/TransferTableRow.tsx`
3. Extract delete dialog to `components/TransferDeleteDialog.tsx`
4. Extract form configuration to `hooks/useTransferFormConfig.ts`
5. Create `types.ts`, `constants.ts`
6. Move files to new location
7. Update imports

**Estimated Lines Changed:** ~100 imports

---

### Feature 5: Cashbox Report
**Files:** cashbox-report-view.tsx (570 lines)

**Changes:**
1. Create `src/sections/cashbox/cashbox-report/` folder structure
2. Extract filter UI to `components/ReportFilters.tsx`
3. Extract filter logic to `hooks/useReportFilters.ts`
4. Extract data fetching to `hooks/useReportData.ts`
5. Extract table rendering to `components/ReportTable.tsx`
6. Extract report summary/calculations to `components/ReportSummary.tsx`
7. Move date utilities to shared `utils/date-utils.ts`
8. Create `types.ts`, `constants.ts`
9. Refactor main view to ~100-150 lines (from 570)

**Estimated Lines Changed:** ~400 imports and logic extraction

---

## Import Updates Needed

### In Route Config
File: `src/routes/sections/menu/cashbox.tsx`
- Update all import paths to new feature locations
- Update default exports if component names change

### In Page Components
Check `src/pages/dashboard/cashbox/`:
- Update imports to point to new feature folders

### In Actions/Hooks
Check `src/actions/cashbox.ts`, `src/hooks/*`:
- Update any cross-references

## Testing Checklist

After refactoring:
- [ ] All routes still work (cashbox/cashiers, cashbox/transaction-groups, etc.)
- [ ] List views display data correctly
- [ ] Edit/create flows work
- [ ] Delete dialogs function properly
- [ ] Filters and search work
- [ ] Date pickers function
- [ ] Form validations work
- [ ] TypeScript type checking passes
- [ ] Build succeeds
- [ ] No broken imports

## No Behavioral Changes
✅ All refactoring preserves existing functionality
✅ Public APIs and component props unchanged
✅ Same data fetching and mutations
✅ Same UI/UX behavior

## Implementation Order
1. **Extract shared utilities** (date-utils.ts, helpers)
2. **Refactor Cashiers** (smallest, quickest wins)
3. **Refactor Transaction Groups** (small, straightforward)
4. **Refactor Transfers** (small, straightforward)
5. **Refactor Transactions** (largest, most complex)
6. **Refactor Cashbox Report** (largest file, most extraction needed)
7. **Verify all imports and test**
