# Backend Missing Features — Strict API Gap Report

> Generated: 2026-04-16
> Method: Every feature compared directly against documented API parameters.
> Rule: If a parameter is not explicitly listed in the API docs → it is MISSING.

---

### 1. Department

Endpoint: `GET /api/v1/departments`

MISSING:

- [ ] filter by `storage_id` as a query param (only path-based `/departments/storage/{storageId}` exists — not composable with other filters)

---

### 2. Categories

Endpoint: `GET /api/v1/categories`

MISSING:

- [ ] filter by `storage_id` as a query param (only path-based `/categories/storage/{storageId}` exists)
- [ ] filter by `department_id` as a query param (only path-based `/categories/department/{departmentId}` exists)
- [ ] sorting by `created_at` (`sort_by`, `sort_order` params not documented)

---

### 3. Ingredient Group

Endpoint: `GET /api/v1/ingredient-groups`

No missing features. (`search` param is documented.)

---

### 4. Ingredients

Endpoint: `GET /api/v1/ingredients`

MISSING:

- [ ] filter by `group_id` (ingredient group)
- [ ] filter by `measurement`
- [ ] sorting by `price` (`sort_by`, `sort_order` params not documented)

---

### 5. Semi-Finished (Compounds)

Endpoint: `GET /api/v1/compounds`

MISSING:

- [ ] filter by `measurement_group` (no such param documented)
- [ ] sorting by `price` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `quantity` (`sort_by`, `sort_order` params not documented)

---

### 6. Meals (Goods)

Endpoint: `GET /api/v1/goods`

MISSING:

- [ ] filter by `price` range — the only price filter is a separate endpoint `/goods/search/by-price` with required `min_price`+`max_price`, it is not part of the main list endpoint and cannot be combined with other filters
- [ ] filter by `cooking_time` (no such param documented anywhere)
- [ ] sorting by `cost_price` (`sort_by`, `sort_order` params not documented on main list endpoint)

---

### 7. Storage

Endpoint: `GET /api/v1/storages`

MISSING:

- [ ] search by `name` (`search` param not documented on `GET /api/v1/storages` — only `/storages/search?q=` exists as a separate endpoint)

---

### 8. Ingredient Stock

Endpoint: `GET /api/v1/ingredient-stock`

No missing features. (`search`, `storage_id`, `measurement`, `sort_by`, `sort_order` all documented.)

---

### 9. Inventory

Endpoint: `GET /api/v1/inventories`

MISSING:

- [ ] search by `description` as a query param on the main list endpoint — only `/inventories/search?q=` exists as a separate endpoint, not composable with filters
- [ ] sorting by `remaining` (`sort_by` param not documented)
- [ ] sorting by `shortage` (`sort_by` param not documented)
- [ ] sorting by `surplus` (`sort_by` param not documented)
- [ ] sorting by `date` (`sort_by` param not documented)

---

### 10. Invoice

Endpoint: `GET /api/v1/invoices`

No missing features. (`date_from`, `date_to`, `storage_id`, `supplier_id`, `ingredient_id`, `status` all documented.)

---

### 11. Transfers

Endpoint: `GET /api/v1/transfers`

MISSING:

- [ ] sorting by `balance` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `date` (`sort_by`, `sort_order` params not documented)

---

### 12. Dispatches

> The frontend page is called "Dispatches". The closest endpoint found is `GET /api/v1/shipments`.

Endpoint: `GET /api/v1/shipments`

MISSING:

- [ ] filter by `ingredient_id` (not documented on `/api/v1/shipments`)
- [ ] sorting by `total_amount` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `paid_amount` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `date` (`sort_by`, `sort_order` params not documented)

---

### 13. Expense Invoices

> The frontend page is called "Expense Invoices". The closest endpoint found is `GET /api/v1/outgoing-invoices`.

Endpoint: `GET /api/v1/outgoing-invoices`

MISSING:

- [ ] filter by `ingredient_id` (not documented on `/api/v1/outgoing-invoices`)
- [ ] sorting by `total_amount` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `date` (`sort_by`, `sort_order` params not documented)

---

### 14. Separation Acts

Endpoint: `GET /api/v1/separation-acts`

MISSING:

- [ ] sorting by `total_amount` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `date` (`sort_by`, `sort_order` params not documented)

---

### 15. Deductions

Endpoint: `GET /api/v1/deductions`

MISSING:

- [ ] sorting by `balance` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `date` (`sort_by`, `sort_order` params not documented)

---

### 16. Suppliers

Endpoint: `GET /api/v1/suppliers`

MISSING:

- [ ] search by `phone` — `/api/v1/suppliers/search` searches by name only (`q` param description says "Search query", tested against "Search suppliers by name"), phone is not mentioned

---

### 17. Employees

Endpoint: `GET /api/v1/users`

MISSING:

- [ ] filter by `status` (no `status` param documented on `GET /api/v1/users`)
- [ ] sorting by any field (no `sort_by`, `sort_order` params documented)

---

### 18. Order Management

Endpoint: `GET /api/v1/orders`

MISSING:

- [ ] filter by `hall_id` (not documented on `GET /api/v1/orders` — only `table_id` is present)
- [ ] filter by `schedule_date` (not documented — only `from`/`to` period params exist, which are generic date range, not specifically schedule date)
- [ ] sorting by `schedule_date` specifically (only generic `sort_by`/`sort_order` exist with no documented allowed values)

---

### 19. Bill Reports

Endpoint: `GET /api/v1/bills`

MISSING:

- [ ] filter by `guest` (no `guest_id` or `guest` param documented)
- [ ] sorting by `open_time` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `close_time` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `guests` count (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `food_cost` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `total` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `service` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `discount` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `cost` (`sort_by`, `sort_order` params not documented)

---

### 20. Ingredient Reports

Endpoint: `GET /api/v1/ingredient-reports`

MISSING:

- [ ] filter by `unit` / `measurement` (no such param documented)
- [ ] sorting by `cost` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `start_qty` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `in` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `out` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `surplus` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `shortage` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `qty_cost` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `end_cost` (`sort_by`, `sort_order` params not documented)

---

### 21. Goods Reports

Endpoint: `GET /api/v1/reports/goods`

MISSING:

- [ ] sorting by `total_qty` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `avg_sell_price` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `total_sell` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `avg_cost` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `total_cost` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `avg_markup` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `total_markup` (`sort_by`, `sort_order` params not documented)

---

### 22. Cashworks Report

Endpoint: `GET /api/v1/transactions/report`

MISSING:

- [ ] filter by `cashier_id` — the endpoint only documents `cash_register_id`, not `cashier_id`

---

### 23. Transactions

Endpoint: `GET /api/v1/transactions`

MISSING:

- [ ] filter by `full_name` (not documented)
- [ ] filter by `pay_type` (not documented)
- [ ] filter by `customer_id` / `customer` (not documented)
- [ ] sorting by `total` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `customer_paid` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `change` (`sort_by`, `sort_order` params not documented)
- [ ] sorting by `date` (`sort_by`, `sort_order` params not documented)

---

### 24. Transaction Groups

Endpoint: `GET /api/v1/group-transactions`

MISSING:

- [ ] sorting by `created_at` (`sort_by`, `sort_order` params not documented on list endpoint)

---

### 25. Cashiers

> No dedicated `/api/v1/cashiers` endpoint exists in the API docs. Cash registers are at `/api/v1/cash-registers`. There is no cashier-specific list endpoint.

Endpoint: not found

MISSING:

- [ ] endpoint for listing cashiers not found — only `/api/v1/users/by-role?role=cashier` exists
- [ ] search by `name` on a dedicated cashier endpoint (not documented)
- [ ] sorting by `created_at` on a dedicated cashier endpoint (not documented)

---

### 26. Devices

> No `/api/v1/devices` endpoint exists anywhere in the API docs.

Endpoint: not found

MISSING:

- [ ] endpoint for listing devices not found
- [ ] search by `ip_address` not found
- [ ] filter by `type` not found
- [ ] filter by `connection_type` not found
- [ ] filter by `category` not found

---

### 27. Halls

Endpoint: `GET /api/v1/halls`

MISSING:

- [ ] search by `name` as a param on the main list endpoint — only `/halls/search?q=` exists as a separate endpoint, not composable with other params

---

### 28. Management

> Not defined in chores. No endpoint check performed.

---

### 29. Store

> No filters or features needed per chores. No missing features.

---
