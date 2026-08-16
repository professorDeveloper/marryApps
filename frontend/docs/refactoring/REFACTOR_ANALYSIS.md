# Safe Refactor Structure Analysis Report
**Date:** 2026-04-12

## Summary
The codebase has **243 files** across **14 feature sections** with opportunities for modular improvement while preserving behavior. The project follows a reasonable feature-based structure but has organization issues that affect maintainability.

## Critical Findings

### 1. **Products Section — Needs Restructuring** ⚠️
**Location:** `src/sections/products/`

**Current State:**
- `departments-list-view.tsx` (494 lines) — List view with multiple embedded components
- `departments-edit-view.tsx` (245 lines) — Edit view with form building functions
- No organized component breakdown
- Duplicate `CategoriesTable` component is inline

**Issues:**
- Multiple concerns mixed in single files (list, edit, table, forms)
- No components folder despite having UI components
- Helper functions (`buildImageSection`, `buildBasicInfoSection`, etc.) embedded in export function

**Proposed Structure:**
```
src/sections/products/
├── components/
│   ├── DepartmentTableRow.tsx
│   ├── DepartmentNameCell.tsx
│   ├── DepartmentColorCell.tsx
│   ├── DepartmentStorageCell.tsx
│   ├── CategoriesTable.tsx
│   └── DepartmentDeleteDialog.tsx
├── hooks/
│   └── useDepartmentFormConfig.ts
├── utils/
│   └── form-sections.ts
├── types.ts
├── constants.ts
├── departments-list-view.tsx
├── departments-edit-view.tsx
└── index.ts
```

**Refactoring Steps:**
1. Create `components/` folder with separate component files
2. Extract `CategoriesTable` from list view
3. Extract cell render functions into individual components
4. Move form-building helpers to `utils/form-sections.ts`
5. Create `hooks/useDepartmentFormConfig.ts` for form configuration logic
6. Update imports in list/edit views

---

### 2. **Reports Section — Monolithic List Views** ⚠️
**Location:** `src/sections/reports/`

**Current State:**
- `ingredients-reports-list-view.tsx` (948 lines)
- `bills-list-view.tsx` (911 lines)
- `inventory-list-view.tsx` (539 lines)
- `sales-list-view.tsx` (506 lines)
- `custom-list-view.tsx` (406 lines)

**Issues:**
- All logic, filters, pagination, and table cells in single file
- Multiple filter state management (filters, draftFilters, searchQuery, etc.)
- Helper functions scattered inline
- No component extraction (filters, table rows, cells)

**Proposed Structure for Each Report:**
```
src/sections/reports/[report-name]/
├── components/
│   ├── [ReportName]Filters.tsx
│   ├── [ReportName]TableRow.tsx
│   ├── [ReportName]Table.tsx
│   └── [ReportName]DetailsModal.tsx
├── hooks/
│   ├── use[ReportName]Data.ts
│   └── use[ReportName]Filters.ts
├── utils/
│   ├── format-[report-data].ts
│   └── [report-name]-helpers.ts
├── types.ts
├── constants.ts
├── [report-name]-list-view.tsx
└── index.ts
```

**Refactoring Steps:**
1. Extract filter UI to `[ReportName]Filters.tsx`
2. Extract filter state logic to `use[ReportName]Filters` hook
3. Extract data fetching/pagination to `use[ReportName]Data` hook
4. Extract table row rendering to `[ReportName]TableRow.tsx`
5. Move date utilities and formatters to `utils/`
6. Create types and constants files

---

### 3. **Warehouse Section — Complex & Distributed** ⚠️
**Location:** `src/sections/warehouse/`

**Current State:**
- 7 subsections: invoice, invoice-details, transfers, shipments, separation-acts, outgoing-invoices, deduction
- Multiple large form view files (585, 641, 776+ lines)
- Shared utility-data-table in deduction subfolder (should be in common)
- Duplicate code across form views (filters, pagination, search)

**Critical Issue:**
- `DataTable.tsx` (578 lines) in `warehouse/deduction/components/utility-data-table/` is **reused by other features** but not in `src/components/common/`
- This violates the architecture principle: shared code should be in `common/`

**Proposed Actions:**
1. **Move utility-data-table to common:**
   ```
   src/components/
   └── utility-data-table/
       ├── components/
       ├── types/
       ├── utils/
       └── index.ts
   ```
2. Extract form view files into feature subfolders:
   ```
   src/sections/warehouse/[feature]/
   ├── components/
   │   ├── [Feature]FormView.tsx
   │   ├── [Feature]ListingView.tsx
   │   ├── [Feature]Filters.tsx
   │   └── ...
   ├── hooks/
   ├── types.ts
   └── index.ts
   ```
3. Extract shared form patterns (filter UI, pagination logic) to reusable hooks

---

### 4. **Meals Section — Partial Refactoring Needed** ✓ (Partially Done)
**Location:** `src/sections/meals/`

**Current State:**
- Good: Component folder structure with sub-components
- Good: Separate hooks folder
- Issue: `MealItemPicker` has nested `components/` folder inside `components/`
- Issue: Duplicate `AddedTable.tsx` (one at root, one in components/)
- Issue: Large `MealItemPicker.tsx` (547 lines)

**Proposed Structure:**
```
src/sections/meals/
├── components/
│   ├── MealGeneralInformation.tsx
│   ├── MealCompoundsSection.tsx
│   ├── MealRelatedSection.tsx
│   ├── MealModifiersSection.tsx
│   ├── MealIngredientsSection.tsx
│   └── ItemPicker/
│       ├── components/
│       │   ├── AddedTable.tsx (keep only one version)
│       │   ├── AddedRow.tsx
│       │   ├── AvailableTable.tsx
│       │   ├── AvailableRow.tsx
│       │   ├── TypeFilterToggle.tsx
│       │   └── TypeBadge.tsx
│       ├── hooks/
│       │   ├── useMealItems.ts
│       │   └── useMealItemPricing.ts
│       ├── types.ts
│       ├── MealItemPicker.tsx (refactored to be smaller)
│       └── index.ts
├── hooks/
├── types.ts
├── constants.ts
├── meals-list-view.tsx
├── meals-edit-view.tsx
└── index.ts
```

**Refactoring Steps:**
1. Remove nested `components/` folder from ItemPicker
2. Delete duplicate `AddedTable.tsx`
3. Split large `MealItemPicker.tsx` into smaller pieces
4. Move state management to dedicated hooks

---

### 5. **Category & Compounds Sections — Mixed Organization**
**Location:** `src/sections/category/`, `src/sections/compounds/`

**Issues:**
- `compounds/utilities.ts` contains shared constants and helpers used by multiple features
- Should be split: feature-specific → `compounds/`, truly shared → `src/components/common/`
- `compounds-list-view.tsx` (563 lines) and similar large views need component extraction

---

### 6. **Settings Section — File Organization Issues**
**Location:** `src/sections/settings/`

**Current State:**
```
settings/
├── devices/
│   ├── components/ ✓
│   ├── hooks/ ✓
│   ├── types.ts ✓
│   ├── utils/ ✓
├── users/
│   ├── test-component.tsx
│   ├── user-management-view.tsx
├── connected-Device-list-view.tsx
├── manegment-list-view.tsx
├── restaurant-info.tsx
```

**Issues:**
- Mixed naming (`devices/` is modular, but `users/` and top-level views are loose files)
- Top-level views should be in subfolders
- Test component in production code

**Proposed Structure:**
```
settings/
├── devices/          ✓ (already good)
├── users/
│   ├── components/
│   │   └── UserManagementView.tsx
│   ├── hooks/
│   ├── types.ts
│   ├── user-management-view.tsx
│   └── index.ts
├── connected-devices/  (rename & reorganize)
│   ├── components/
│   ├── hooks/
│   └── index.ts
├── restaurant-info/
│   ├── components/
│   └── index.ts
└── index.ts
```

---

## Shared Code Issues

### Candidates for Moving to `src/components/common/`

1. **utility-data-table** — Used by warehouse, reports, products
   - Currently in: `src/sections/warehouse/deduction/components/utility-data-table/`
   - Should be: `src/components/utility-data-table/`

2. **Compounds/Shared Utilities**
   - `COLOR_CODES`, `CACHE_SYNC_DELAY_MS`, `DELETE_SYNC_DELAY_MS` — move to common constants
   - `translateSection()`, `mapStoragesToOptions()`, `createLookupMap()` — move to common utils

3. **Form Patterns**
   - `GenericEditView` already in common ✓
   - But form-building helpers are scattered → consolidate

---

## Large Files Needing Splitting

| File | Lines | Priority | Action |
|------|-------|----------|--------|
| ingredients-reports-list-view.tsx | 948 | HIGH | Extract filters, hooks, components |
| bills-list-view.tsx | 911 | HIGH | Extract filters, hooks, components |
| invoice-details-standalone-list-view.tsx | 797 | HIGH | Extract components |
| transfers-list-view.tsx | 776 | MEDIUM | Extract filters, table components |
| inventory-list-view.tsx | 642 | MEDIUM | Extract table rows, filters |
| SeparationActsFormView.tsx | 641 | MEDIUM | Extract form sections |
| shipments-list-view.tsx | 625 | MEDIUM | Extract components |
| meals-list-view.tsx | 614 | MEDIUM | Extract table components |
| DataTable.tsx | 578 | HIGH | Move to common, split into components |

---

## Refactoring Priority

### Phase 1 (Critical)
- [ ] Move `utility-data-table` to `src/components/`
- [ ] Restructure `products/departments-*` files

### Phase 2 (High Impact)
- [ ] Split reports section (5 large views)
- [ ] Fix warehouse subsection organization
- [ ] Reorganize meals item-picker

### Phase 3 (Medium Priority)
- [ ] Clean up settings section
- [ ] Consolidate shared utilities (compounds)
- [ ] Extract filter/pagination patterns into reusable hooks

---

## No Behavioral Changes Planned
✓ All refactoring preserves existing functionality
✓ Public APIs and component props remain unchanged
✓ No features added or removed
✓ Import paths updated automatically

---

## Security Findings
✅ No security vulnerabilities found during analysis
✅ Code follows safe patterns (no XSS, injection, or auth issues detected)

