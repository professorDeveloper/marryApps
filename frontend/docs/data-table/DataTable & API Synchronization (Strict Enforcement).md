# System Update: DataTable & API Synchronization (Strict Enforcement)

**Role:** Senior Full-Stack Engineer / Architect.
**Objective:** Update ALL listed frontend list views to synchronize with expanded API capabilities (filtering, sorting, searching).

---

### 1. Resources & Authentication
* **API Documentation:** `api-docs/` folder. This is the single source of truth.
* **Authentication:** Bearer Token in `token.txt`. Use this for all validation calls.
* **Core Rule:** Do NOT modify the internal logic of the `DataTable` utility component; only update the configurations and props passed to it.

---

### 2. Zero-Omission Scope (24 Components)
You are strictly required to audit and update **every single one** of the following files. Do not skip any file, even if the changes seem repetitive.

**Group A: Direct DataTable Implementations**
1. `src/sections/reports/bills-list-view.tsx`
2. `src/sections/reports/goods-report/components/GoodsReportListView.tsx`
3. `src/sections/reports/archives-list-view.tsx`
4. `src/sections/reports/inventory-list-view.tsx`
5. `src/sections/reports/custom-list-view.tsx`
6. `src/sections/reports/ingredients-reports-list-view.tsx`
7. `src/sections/reports/sales-list-view.tsx`
8. `src/sections/cashbox/transaction-groups/transaction-groups-list-view.tsx`
9. `src/sections/cashbox/transactions/components/TransactionsDataTable.tsx`
10. `src/sections/settings/connected-Device-list-view.tsx`
11. `src/sections/settings/users/user-management-view.tsx`
12. `src/sections/meals/meals-list-view.tsx`
13. `src/sections/menu/compounds/compounds-list-view.tsx`
14. `src/sections/warehouse/inventory/components/InventoryDataTable.tsx`
15. `src/sections/warehouse/ingredients/components/IngredientsDataTable.tsx`
16. `src/sections/warehouse/invoice-details-standalone-list-view.tsx`
17. `src/sections/warehouse/orders-management-view.tsx`
18. `src/sections/user/employee/components/EmployeeListView.tsx`

**Group B: Adapter/Wrapper Implementations**
19. `src/sections/menu/category/category-list-view.tsx`
20. `src/sections/menu/departments/DepartmentListView.tsx`
21. `src/sections/menu/modifiers/ModifierListView.tsx`
22. `src/sections/cashbox/cashiers/cashiers-list-view.tsx`
23. `src/sections/products/departments-list-view.tsx`
24. `src/sections/warehouse/storage-list-view.tsx`

---

### 3. Execution Plan (Plan Mode Requirements)
Generate a **Discovery Log** before coding:
* **Comprehensive Audit:** Identify the API endpoint for ALL 24 files. 
* **Gap Analysis:** Compare endpoint capabilities in `api-docs/` vs. current code. List missing filters (Date, Storage, Department) and Sort fields.
* **Adapter Mapping:** Trace the prop-drilling path for Group B files (ListView -> Adapter -> DataTable).
* **Constraint:** Ignore "Ingredient" filters unless already present/essential.

---

### 4. Implementation Rules
* **Standardization:** Use `startDate`, `endDate`, `storageId`, and `departmentId` keys.
* **Exact Matching:** Frontend keys must match API keys exactly (e.g., `dept_id` vs `department_id`).
* **Live Validation:** Use the `token.txt` to `curl/fetch` the endpoint for every modified component. 
    * **Condition:** If a filter causes a 400/500 error, revert it and document the API limitation.

---

### 5. Error Logging & Vulnerability Report
As you scan the code, if you find **any** vulnerabilities (security risks), logic bugs, or significant architectural mistakes (prop-drilling issues, performance bottlenecks), do not ignore them.
* **Task:** Create a file named `refactor-audit-report.md`.
* **Content:** Document every mistake or risk found per file, including suggested fixes.

---

### 6. Quality Check
* Ensure **zero TypeScript errors** in modified files.
* Ensure filter changes trigger the `DataTable` refresh/loading state.
* **Verification:** Provide a final checklist confirming all 24 files were processed.

**Proceed to Plan Mode and present the Discovery Log.**