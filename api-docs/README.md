# MaryAI API Documentation

> **Version:** 1.0  
> **Base URL:** https://api.maryai.uz/  
> **Description:** MaryAI API server with multi-language support (uz, ru, en)  
> **Last Updated:** 2026-06-11T11:28:03.568Z

---

## 📚 API Modules

This documentation is organized by functional modules for easier navigation:

### [ADMIN](./admin/) - 👑 Administrative functions and brand management
*4 endpoints*

- [`/api/v1/admin/brands`](./admin/api_v1_admin_brands.md)
- [`/api/v1/admin/brands/{id}`](./admin/api_v1_admin_brands_id.md)
- [`/api/v1/admin/brands/{id}/superadmins`](./admin/api_v1_admin_brands_id_superadmins.md)
- [`/api/v1/admin/brands/{id}/superadmins/{user_id}`](./admin/api_v1_admin_brands_id_superadmins_user_id.md)

### [AUTH](./auth/) - 🔐 Authentication & authorization endpoints
*7 endpoints*

- [`/api/v1/auth/global/login`](./auth/api_v1_auth_global_login.md)
- [`/api/v1/auth/login`](./auth/api_v1_auth_login.md)
- [`/api/v1/auth/login-pincode`](./auth/api_v1_auth_login-pincode.md)
- [`/api/v1/auth/refresh`](./auth/api_v1_auth_refresh.md)
- [`/api/v1/auth/register`](./auth/api_v1_auth_register.md)
- [`/api/v1/auth/terminal/branches`](./auth/api_v1_auth_terminal_branches.md)
- [`/api/v1/auth/terminal/token`](./auth/api_v1_auth_terminal_token.md)

### [BILLING](./billing/) - 💳 Bills, payments, and financial operations
*2 endpoints*

- [`/api/v1/bills`](./billing/api_v1_bills.md)
- [`/api/v1/bills/{id}`](./billing/api_v1_bills_id.md)

### [BRANCHES](./branches/) - 🏪 Branch management and operations
*8 endpoints*

- [`/api/v1/branches`](./branches/api_v1_branches.md)
- [`/api/v1/branches-lang`](./branches/api_v1_branches-lang.md)
- [`/api/v1/branches-lang/{id}`](./branches/api_v1_branches-lang_id.md)
- [`/api/v1/branches/{branch_id}/compound-stock`](./branches/api_v1_branches_branch_id_compound-stock.md)
- [`/api/v1/branches/{branch_id}/employee-shifts`](./branches/api_v1_branches_branch_id_employee-shifts.md)
- [`/api/v1/branches/{id}`](./branches/api_v1_branches_id.md)
- [`/api/v1/branches/{id}/restore`](./branches/api_v1_branches_id_restore.md)
- [`/api/v1/reports/branches`](./branches/api_v1_reports_branches.md)

### [CORE](./core/) - ⚙️ Core system endpoints
*168 endpoints*

- [`/api/v1/brand/info`](./core/api_v1_brand_info.md)
- [`/api/v1/calculations/preview`](./core/api_v1_calculations_preview.md)
- [`/api/v1/dashboard/kpis`](./core/api_v1_dashboard_kpis.md)
- [`/api/v1/dashboard/overview`](./core/api_v1_dashboard_overview.md)
- [`/api/v1/dashboard/sales-dynamics`](./core/api_v1_dashboard_sales-dynamics.md)
- [`/api/v1/deductions`](./core/api_v1_deductions.md)
- [`/api/v1/deductions/batch`](./core/api_v1_deductions_batch.md)
- [`/api/v1/deductions/group`](./core/api_v1_deductions_group.md)
- [`/api/v1/deductions/group/{id}`](./core/api_v1_deductions_group_id.md)
- [`/api/v1/deductions/group/{id}/restore`](./core/api_v1_deductions_group_id_restore.md)
- [`/api/v1/deductions/{id}`](./core/api_v1_deductions_id.md)
- [`/api/v1/deductions/{id}/items/batch`](./core/api_v1_deductions_id_items_batch.md)
- [`/api/v1/deductions/{id}/items/{itemId}`](./core/api_v1_deductions_id_items_itemId.md)
- [`/api/v1/deductions/{id}/restore`](./core/api_v1_deductions_id_restore.md)
- [`/api/v1/departments`](./core/api_v1_departments.md)
- [`/api/v1/departments-lang`](./core/api_v1_departments-lang.md)
- [`/api/v1/departments-lang/{id}`](./core/api_v1_departments-lang_id.md)
- [`/api/v1/departments/storage/{storageId}`](./core/api_v1_departments_storage_storageId.md)
- [`/api/v1/departments/{department_id}/goods`](./core/api_v1_departments_department_id_goods.md)
- [`/api/v1/departments/{id}`](./core/api_v1_departments_id.md)
- [`/api/v1/departments/{id}/restore`](./core/api_v1_departments_id_restore.md)
- [`/api/v1/employee-shift-templates`](./core/api_v1_employee-shift-templates.md)
- [`/api/v1/employee-shift-templates/{id}`](./core/api_v1_employee-shift-templates_id.md)
- [`/api/v1/employee-shifts`](./core/api_v1_employee-shifts.md)
- [`/api/v1/employee-shifts/my-active`](./core/api_v1_employee-shifts_my-active.md)
- [`/api/v1/employee-shifts/vacation`](./core/api_v1_employee-shifts_vacation.md)
- [`/api/v1/employee-shifts/vacations`](./core/api_v1_employee-shifts_vacations.md)
- [`/api/v1/employee-shifts/{id}`](./core/api_v1_employee-shifts_id.md)
- [`/api/v1/employee-shifts/{id}/approve`](./core/api_v1_employee-shifts_id_approve.md)
- [`/api/v1/employee-shifts/{id}/end`](./core/api_v1_employee-shifts_id_end.md)
- [`/api/v1/employee-shifts/{id}/reject`](./core/api_v1_employee-shifts_id_reject.md)
- [`/api/v1/employee-shifts/{id}/start`](./core/api_v1_employee-shifts_id_start.md)
- [`/api/v1/employees/{id}/active-shift`](./core/api_v1_employees_id_active-shift.md)
- [`/api/v1/employees/{id}/salary-report`](./core/api_v1_employees_id_salary-report.md)
- [`/api/v1/good-details`](./core/api_v1_good-details.md)
- [`/api/v1/good-details/{id}`](./core/api_v1_good-details_id.md)
- [`/api/v1/good-details/{id}/quantity`](./core/api_v1_good-details_id_quantity.md)
- [`/api/v1/good-details/{id}/restore`](./core/api_v1_good-details_id_restore.md)
- [`/api/v1/goods`](./core/api_v1_goods.md)
- [`/api/v1/goods-lang`](./core/api_v1_goods-lang.md)
- [`/api/v1/goods-lang/{id}`](./core/api_v1_goods-lang_id.md)
- [`/api/v1/goods/calculations`](./core/api_v1_goods_calculations.md)
- [`/api/v1/goods/calculations/history`](./core/api_v1_goods_calculations_history.md)
- [`/api/v1/goods/calculations/{id}`](./core/api_v1_goods_calculations_id.md)
- [`/api/v1/goods/with-calculations`](./core/api_v1_goods_with-calculations.md)
- [`/api/v1/goods/{good_id}/details`](./core/api_v1_goods_good_id_details.md)
- [`/api/v1/goods/{id}`](./core/api_v1_goods_id.md)
- [`/api/v1/goods/{id}/markup`](./core/api_v1_goods_id_markup.md)
- [`/api/v1/goods/{id}/price`](./core/api_v1_goods_id_price.md)
- [`/api/v1/goods/{id}/restore`](./core/api_v1_goods_id_restore.md)
- [`/api/v1/goods/{id}/with-calculations`](./core/api_v1_goods_id_with-calculations.md)
- [`/api/v1/group-transactions`](./core/api_v1_group-transactions.md)
- [`/api/v1/group-transactions/{id}`](./core/api_v1_group-transactions_id.md)
- [`/api/v1/group-transactions/{id}/restore`](./core/api_v1_group-transactions_id_restore.md)
- [`/api/v1/halls`](./core/api_v1_halls.md)
- [`/api/v1/halls-lang`](./core/api_v1_halls-lang.md)
- [`/api/v1/halls-lang/branch/{branchId}`](./core/api_v1_halls-lang_branch_branchId.md)
- [`/api/v1/halls/branch/{branchId}`](./core/api_v1_halls_branch_branchId.md)
- [`/api/v1/halls/{id}`](./core/api_v1_halls_id.md)
- [`/api/v1/halls/{id}/restore`](./core/api_v1_halls_id_restore.md)
- [`/api/v1/inventories`](./core/api_v1_inventories.md)
- [`/api/v1/inventories/batch`](./core/api_v1_inventories_batch.md)
- [`/api/v1/inventories/{id}`](./core/api_v1_inventories_id.md)
- [`/api/v1/inventories/{id}/calculate`](./core/api_v1_inventories_id_calculate.md)
- [`/api/v1/inventories/{id}/items`](./core/api_v1_inventories_id_items.md)
- [`/api/v1/inventories/{id}/items/batch`](./core/api_v1_inventories_id_items_batch.md)
- [`/api/v1/inventories/{id}/restore`](./core/api_v1_inventories_id_restore.md)
- [`/api/v1/inventory-items`](./core/api_v1_inventory-items.md)
- [`/api/v1/inventory-items/{id}`](./core/api_v1_inventory-items_id.md)
- [`/api/v1/invoice-details`](./core/api_v1_invoice-details.md)
- [`/api/v1/invoice-details/batch`](./core/api_v1_invoice-details_batch.md)
- [`/api/v1/invoice-details/invoice/{invoice_id}`](./core/api_v1_invoice-details_invoice_invoice_id.md)
- [`/api/v1/invoice-details/{id}`](./core/api_v1_invoice-details_id.md)
- [`/api/v1/invoice-details/{id}/quantity`](./core/api_v1_invoice-details_id_quantity.md)
- [`/api/v1/invoice-details/{id}/restore`](./core/api_v1_invoice-details_id_restore.md)
- [`/api/v1/invoice-details/{id}/with-ingredient`](./core/api_v1_invoice-details_id_with-ingredient.md)
- [`/api/v1/invoices`](./core/api_v1_invoices.md)
- [`/api/v1/invoices/batch`](./core/api_v1_invoices_batch.md)
- [`/api/v1/invoices/{id}`](./core/api_v1_invoices_id.md)
- [`/api/v1/invoices/{id}/details`](./core/api_v1_invoices_id_details.md)
- [`/api/v1/invoices/{id}/details/batch`](./core/api_v1_invoices_id_details_batch.md)
- [`/api/v1/invoices/{id}/restore`](./core/api_v1_invoices_id_restore.md)
- [`/api/v1/invoices/{id}/status`](./core/api_v1_invoices_id_status.md)
- [`/api/v1/media/image`](./core/api_v1_media_image.md)
- [`/api/v1/media/image/download`](./core/api_v1_media_image_download.md)
- [`/api/v1/media/video`](./core/api_v1_media_video.md)
- [`/api/v1/media/video/download`](./core/api_v1_media_video_download.md)
- [`/api/v1/order-items`](./core/api_v1_order-items.md)
- [`/api/v1/order-items/order/{orderId}`](./core/api_v1_order-items_order_orderId.md)
- [`/api/v1/order-items/status/{status}`](./core/api_v1_order-items_status_status.md)
- [`/api/v1/order-items/{id}`](./core/api_v1_order-items_id.md)
- [`/api/v1/order-items/{id}/cancel`](./core/api_v1_order-items_id_cancel.md)
- [`/api/v1/order-items/{id}/cooking`](./core/api_v1_order-items_id_cooking.md)
- [`/api/v1/order-items/{id}/quantity`](./core/api_v1_order-items_id_quantity.md)
- [`/api/v1/order-items/{id}/ready`](./core/api_v1_order-items_id_ready.md)
- [`/api/v1/order-items/{id}/restore`](./core/api_v1_order-items_id_restore.md)
- [`/api/v1/order-items/{id}/status`](./core/api_v1_order-items_id_status.md)
- [`/api/v1/orders`](./core/api_v1_orders.md)
- [`/api/v1/orders/batch`](./core/api_v1_orders_batch.md)
- [`/api/v1/orders/my`](./core/api_v1_orders_my.md)
- [`/api/v1/orders/status/{status}`](./core/api_v1_orders_status_status.md)
- [`/api/v1/orders/table/{tableId}`](./core/api_v1_orders_table_tableId.md)
- [`/api/v1/orders/{id}`](./core/api_v1_orders_id.md)
- [`/api/v1/orders/{id}/activate`](./core/api_v1_orders_id_activate.md)
- [`/api/v1/orders/{id}/assign-cashier/{cashierId}`](./core/api_v1_orders_id_assign-cashier_cashierId.md)
- [`/api/v1/orders/{id}/assign-waiter/{waiterId}`](./core/api_v1_orders_id_assign-waiter_waiterId.md)
- [`/api/v1/orders/{id}/cancel`](./core/api_v1_orders_id_cancel.md)
- [`/api/v1/orders/{id}/cooking`](./core/api_v1_orders_id_cooking.md)
- [`/api/v1/orders/{id}/items`](./core/api_v1_orders_id_items.md)
- [`/api/v1/orders/{id}/pay`](./core/api_v1_orders_id_pay.md)
- [`/api/v1/orders/{id}/ready`](./core/api_v1_orders_id_ready.md)
- [`/api/v1/orders/{id}/reschedule`](./core/api_v1_orders_id_reschedule.md)
- [`/api/v1/orders/{id}/restore`](./core/api_v1_orders_id_restore.md)
- [`/api/v1/orders/{id}/served`](./core/api_v1_orders_id_served.md)
- [`/api/v1/orders/{id}/status`](./core/api_v1_orders_id_status.md)
- [`/api/v1/orders/{id}/table-price`](./core/api_v1_orders_id_table-price.md)
- [`/api/v1/orders/{id}/table-timer`](./core/api_v1_orders_id_table-timer.md)
- [`/api/v1/orders/{id}/table-timer/pause`](./core/api_v1_orders_id_table-timer_pause.md)
- [`/api/v1/orders/{id}/table-timer/resume`](./core/api_v1_orders_id_table-timer_resume.md)
- [`/api/v1/orders/{id}/table-timer/start`](./core/api_v1_orders_id_table-timer_start.md)
- [`/api/v1/orders/{id}/transfer`](./core/api_v1_orders_id_transfer.md)
- [`/api/v1/outgoing-invoices`](./core/api_v1_outgoing-invoices.md)
- [`/api/v1/outgoing-invoices/batch`](./core/api_v1_outgoing-invoices_batch.md)
- [`/api/v1/outgoing-invoices/{id}`](./core/api_v1_outgoing-invoices_id.md)
- [`/api/v1/outgoing-invoices/{id}/cancel`](./core/api_v1_outgoing-invoices_id_cancel.md)
- [`/api/v1/outgoing-invoices/{id}/confirm`](./core/api_v1_outgoing-invoices_id_confirm.md)
- [`/api/v1/outgoing-invoices/{id}/items`](./core/api_v1_outgoing-invoices_id_items.md)
- [`/api/v1/outgoing-invoices/{id}/items/{item_id}`](./core/api_v1_outgoing-invoices_id_items_item_id.md)
- [`/api/v1/payments/create`](./core/api_v1_payments_create.md)
- [`/api/v1/separation-acts`](./core/api_v1_separation-acts.md)
- [`/api/v1/separation-acts/batch`](./core/api_v1_separation-acts_batch.md)
- [`/api/v1/separation-acts/{id}`](./core/api_v1_separation-acts_id.md)
- [`/api/v1/separation-acts/{id}/cancel`](./core/api_v1_separation-acts_id_cancel.md)
- [`/api/v1/separation-acts/{id}/confirm`](./core/api_v1_separation-acts_id_confirm.md)
- [`/api/v1/separation-acts/{id}/items`](./core/api_v1_separation-acts_id_items.md)
- [`/api/v1/separation-acts/{id}/items/{item_id}`](./core/api_v1_separation-acts_id_items_item_id.md)
- [`/api/v1/settings/printer-settings`](./core/api_v1_settings_printer-settings.md)
- [`/api/v1/settings/printer-settings/{id}`](./core/api_v1_settings_printer-settings_id.md)
- [`/api/v1/shipments`](./core/api_v1_shipments.md)
- [`/api/v1/shipments/batch`](./core/api_v1_shipments_batch.md)
- [`/api/v1/shipments/{id}`](./core/api_v1_shipments_id.md)
- [`/api/v1/shipments/{id}/batch`](./core/api_v1_shipments_id_batch.md)
- [`/api/v1/shipments/{id}/items`](./core/api_v1_shipments_id_items.md)
- [`/api/v1/shipments/{id}/items/{item_id}`](./core/api_v1_shipments_id_items_item_id.md)
- [`/api/v1/stop-list`](./core/api_v1_stop-list.md)
- [`/api/v1/stop-list/logs`](./core/api_v1_stop-list_logs.md)
- [`/api/v1/stop-list/{id}`](./core/api_v1_stop-list_id.md)
- [`/api/v1/storages`](./core/api_v1_storages.md)
- [`/api/v1/storages-lang`](./core/api_v1_storages-lang.md)
- [`/api/v1/storages-lang/{id}`](./core/api_v1_storages-lang_id.md)
- [`/api/v1/storages/branch/{branchId}`](./core/api_v1_storages_branch_branchId.md)
- [`/api/v1/storages/{id}`](./core/api_v1_storages_id.md)
- [`/api/v1/storages/{id}/restore`](./core/api_v1_storages_id_restore.md)
- [`/api/v1/suppliers`](./core/api_v1_suppliers.md)
- [`/api/v1/suppliers/{id}`](./core/api_v1_suppliers_id.md)
- [`/api/v1/suppliers/{id}/restore`](./core/api_v1_suppliers_id_restore.md)
- [`/api/v1/sync/change-logs`](./core/api_v1_sync_change-logs.md)
- [`/api/v1/sync/pull`](./core/api_v1_sync_pull.md)
- [`/api/v1/sync/push`](./core/api_v1_sync_push.md)
- [`/api/v1/transactions`](./core/api_v1_transactions.md)
- [`/api/v1/transactions/income-expense`](./core/api_v1_transactions_income-expense.md)
- [`/api/v1/transactions/report`](./core/api_v1_transactions_report.md)
- [`/api/v1/transactions/transfer`](./core/api_v1_transactions_transfer.md)
- [`/api/v1/transactions/{id}`](./core/api_v1_transactions_id.md)
- [`/api/v1/user/me`](./core/api_v1_user_me.md)
- [`/api/v1/user/password-update`](./core/api_v1_user_password-update.md)
- [`/api/v1/user/update`](./core/api_v1_user_update.md)
- [`/metadata`](./core/metadata.md)

### [CAFE](./cafe/) - ☕ Cafe table management and reservations
*13 endpoints*

- [`/api/v1/cafe-tables`](./cafe/api_v1_cafe-tables.md)
- [`/api/v1/cafe-tables/available/capacity`](./cafe/api_v1_cafe-tables_available_capacity.md)
- [`/api/v1/cafe-tables/available/hall/{hall_id}`](./cafe/api_v1_cafe-tables_available_hall_hall_id.md)
- [`/api/v1/cafe-tables/available/hall/{hall_id}/capacity`](./cafe/api_v1_cafe-tables_available_hall_hall_id_capacity.md)
- [`/api/v1/cafe-tables/hall-status`](./cafe/api_v1_cafe-tables_hall-status.md)
- [`/api/v1/cafe-tables/hall/{hall_id}`](./cafe/api_v1_cafe-tables_hall_hall_id.md)
- [`/api/v1/cafe-tables/stats/occupancy`](./cafe/api_v1_cafe-tables_stats_occupancy.md)
- [`/api/v1/cafe-tables/status/{status}`](./cafe/api_v1_cafe-tables_status_status.md)
- [`/api/v1/cafe-tables/{id}`](./cafe/api_v1_cafe-tables_id.md)
- [`/api/v1/cafe-tables/{id}/restore`](./cafe/api_v1_cafe-tables_id_restore.md)
- [`/api/v1/cafe-tables/{id}/set-busy`](./cafe/api_v1_cafe-tables_id_set-busy.md)
- [`/api/v1/cafe-tables/{id}/set-free`](./cafe/api_v1_cafe-tables_id_set-free.md)
- [`/api/v1/cafe-tables/{id}/status`](./cafe/api_v1_cafe-tables_id_status.md)

### [CASH](./cash/) - 💰 Cash register and shift management
*8 endpoints*

- [`/api/v1/cash-register-shifts`](./cash/api_v1_cash-register-shifts.md)
- [`/api/v1/cash-register-shifts/active`](./cash/api_v1_cash-register-shifts_active.md)
- [`/api/v1/cash-register-shifts/{id}`](./cash/api_v1_cash-register-shifts_id.md)
- [`/api/v1/cash-register-shifts/{id}/close`](./cash/api_v1_cash-register-shifts_id_close.md)
- [`/api/v1/cash-registers`](./cash/api_v1_cash-registers.md)
- [`/api/v1/cash-registers/branch/{branchId}`](./cash/api_v1_cash-registers_branch_branchId.md)
- [`/api/v1/cash-registers/{id}`](./cash/api_v1_cash-registers_id.md)
- [`/api/v1/cash-registers/{id}/restore`](./cash/api_v1_cash-registers_id_restore.md)

### [MENU](./menu/) - 📋 Menu items, categories, and modifiers
*18 endpoints*

- [`/api/v1/categories`](./menu/api_v1_categories.md)
- [`/api/v1/categories-lang`](./menu/api_v1_categories-lang.md)
- [`/api/v1/categories-lang/{id}`](./menu/api_v1_categories-lang_id.md)
- [`/api/v1/categories/department/{departmentId}`](./menu/api_v1_categories_department_departmentId.md)
- [`/api/v1/categories/parent/{parentId}`](./menu/api_v1_categories_parent_parentId.md)
- [`/api/v1/categories/root`](./menu/api_v1_categories_root.md)
- [`/api/v1/categories/storage/{storageId}`](./menu/api_v1_categories_storage_storageId.md)
- [`/api/v1/categories/{category_id}/goods`](./menu/api_v1_categories_category_id_goods.md)
- [`/api/v1/categories/{id}`](./menu/api_v1_categories_id.md)
- [`/api/v1/categories/{id}/restore`](./menu/api_v1_categories_id_restore.md)
- [`/api/v1/goods/{id}/modifiers`](./menu/api_v1_goods_id_modifiers.md)
- [`/api/v1/goods/{id}/modifiers/{modifierId}`](./menu/api_v1_goods_id_modifiers_modifierId.md)
- [`/api/v1/modifiers`](./menu/api_v1_modifiers.md)
- [`/api/v1/modifiers/calculations`](./menu/api_v1_modifiers_calculations.md)
- [`/api/v1/modifiers/calculations/{id}`](./menu/api_v1_modifiers_calculations_id.md)
- [`/api/v1/modifiers/with-calculations`](./menu/api_v1_modifiers_with-calculations.md)
- [`/api/v1/modifiers/{id}`](./menu/api_v1_modifiers_id.md)
- [`/api/v1/modifiers/{id}/restore`](./menu/api_v1_modifiers_id_restore.md)

### [WAREHOUSE](./warehouse/) - 📦 Inventory, stock, and warehouse management
*55 endpoints*

- [`/api/v1/compound-details`](./warehouse/api_v1_compound-details.md)
- [`/api/v1/compound-details/{id}`](./warehouse/api_v1_compound-details_id.md)
- [`/api/v1/compound-details/{id}/restore`](./warehouse/api_v1_compound-details_id_restore.md)
- [`/api/v1/compound-stock`](./warehouse/api_v1_compound-stock.md)
- [`/api/v1/compound-stock/search`](./warehouse/api_v1_compound-stock_search.md)
- [`/api/v1/compound-stock/{id}`](./warehouse/api_v1_compound-stock_id.md)
- [`/api/v1/compound-stock/{id}/add`](./warehouse/api_v1_compound-stock_id_add.md)
- [`/api/v1/compound-stock/{id}/remove`](./warehouse/api_v1_compound-stock_id_remove.md)
- [`/api/v1/compound-stock/{id}/restore`](./warehouse/api_v1_compound-stock_id_restore.md)
- [`/api/v1/compounds`](./warehouse/api_v1_compounds.md)
- [`/api/v1/compounds-lang`](./warehouse/api_v1_compounds-lang.md)
- [`/api/v1/compounds-lang/{id}`](./warehouse/api_v1_compounds-lang_id.md)
- [`/api/v1/compounds/calculations`](./warehouse/api_v1_compounds_calculations.md)
- [`/api/v1/compounds/calculations/{id}`](./warehouse/api_v1_compounds_calculations_id.md)
- [`/api/v1/compounds/department/{departmentId}`](./warehouse/api_v1_compounds_department_departmentId.md)
- [`/api/v1/compounds/with-calculations`](./warehouse/api_v1_compounds_with-calculations.md)
- [`/api/v1/compounds/{compound_id}/details`](./warehouse/api_v1_compounds_compound_id_details.md)
- [`/api/v1/compounds/{compound_id}/goods`](./warehouse/api_v1_compounds_compound_id_goods.md)
- [`/api/v1/compounds/{compound_id}/stock`](./warehouse/api_v1_compounds_compound_id_stock.md)
- [`/api/v1/compounds/{id}`](./warehouse/api_v1_compounds_id.md)
- [`/api/v1/compounds/{id}/recalculate-price`](./warehouse/api_v1_compounds_id_recalculate-price.md)
- [`/api/v1/compounds/{id}/restore`](./warehouse/api_v1_compounds_id_restore.md)
- [`/api/v1/compounds/{id}/with-calculations`](./warehouse/api_v1_compounds_id_with-calculations.md)
- [`/api/v1/ingredient-groups`](./warehouse/api_v1_ingredient-groups.md)
- [`/api/v1/ingredient-groups-lang`](./warehouse/api_v1_ingredient-groups-lang.md)
- [`/api/v1/ingredient-groups-lang/{id}`](./warehouse/api_v1_ingredient-groups-lang_id.md)
- [`/api/v1/ingredient-groups/{groupId}/ingredients`](./warehouse/api_v1_ingredient-groups_groupId_ingredients.md)
- [`/api/v1/ingredient-groups/{id}`](./warehouse/api_v1_ingredient-groups_id.md)
- [`/api/v1/ingredient-groups/{id}/restore`](./warehouse/api_v1_ingredient-groups_id_restore.md)
- [`/api/v1/ingredient-reports`](./warehouse/api_v1_ingredient-reports.md)
- [`/api/v1/ingredient-reports/inventory-status`](./warehouse/api_v1_ingredient-reports_inventory-status.md)
- [`/api/v1/ingredient-reports/{ingredientId}`](./warehouse/api_v1_ingredient-reports_ingredientId.md)
- [`/api/v1/ingredient-reports/{ingredientId}/movements`](./warehouse/api_v1_ingredient-reports_ingredientId_movements.md)
- [`/api/v1/ingredient-stock`](./warehouse/api_v1_ingredient-stock.md)
- [`/api/v1/ingredient-stock/branch/{branchId}`](./warehouse/api_v1_ingredient-stock_branch_branchId.md)
- [`/api/v1/ingredient-stock/by-ingredient-branch`](./warehouse/api_v1_ingredient-stock_by-ingredient-branch.md)
- [`/api/v1/ingredient-stock/ingredient/{ingredientId}`](./warehouse/api_v1_ingredient-stock_ingredient_ingredientId.md)
- [`/api/v1/ingredient-stock/{id}`](./warehouse/api_v1_ingredient-stock_id.md)
- [`/api/v1/ingredient-stock/{id}/add`](./warehouse/api_v1_ingredient-stock_id_add.md)
- [`/api/v1/ingredient-stock/{id}/remove`](./warehouse/api_v1_ingredient-stock_id_remove.md)
- [`/api/v1/ingredient-stock/{id}/restore`](./warehouse/api_v1_ingredient-stock_id_restore.md)
- [`/api/v1/ingredients`](./warehouse/api_v1_ingredients.md)
- [`/api/v1/ingredients-lang`](./warehouse/api_v1_ingredients-lang.md)
- [`/api/v1/ingredients-lang/{id}`](./warehouse/api_v1_ingredients-lang_id.md)
- [`/api/v1/ingredients/{id}`](./warehouse/api_v1_ingredients_id.md)
- [`/api/v1/ingredients/{id}/restore`](./warehouse/api_v1_ingredients_id_restore.md)
- [`/api/v1/ingredients/{ingredient_id}/compounds`](./warehouse/api_v1_ingredients_ingredient_id_compounds.md)
- [`/api/v1/ingredients/{ingredient_id}/goods`](./warehouse/api_v1_ingredients_ingredient_id_goods.md)
- [`/api/v1/invoice-details/ingredient/{ingredient_id}`](./warehouse/api_v1_invoice-details_ingredient_ingredient_id.md)
- [`/api/v1/transfers`](./warehouse/api_v1_transfers.md)
- [`/api/v1/transfers/batch`](./warehouse/api_v1_transfers_batch.md)
- [`/api/v1/transfers/items`](./warehouse/api_v1_transfers_items.md)
- [`/api/v1/transfers/items/{id}`](./warehouse/api_v1_transfers_items_id.md)
- [`/api/v1/transfers/{id}`](./warehouse/api_v1_transfers_id.md)
- [`/api/v1/transfers/{id}/items/batch`](./warehouse/api_v1_transfers_id_items_batch.md)

### [STAFF](./staff/) - 👥 Staff management and operations
*1 endpoints*

- [`/api/v1/orders/waiter/{waiterId}`](./staff/api_v1_orders_waiter_waiterId.md)

### [REPORTS](./reports/) - 📊 Reporting and analytics
*2 endpoints*

- [`/api/v1/reports/goods`](./reports/api_v1_reports_goods.md)
- [`/api/v1/reports/goods/{id}/orders`](./reports/api_v1_reports_goods_id_orders.md)

### [I18N](./i18n/) - 🌍 Internationalization and translations
*3 endpoints*

- [`/api/v1/translations`](./i18n/api_v1_translations.md)
- [`/api/v1/translations/{id}`](./i18n/api_v1_translations_id.md)
- [`/api/v1/translations/{id}/restore`](./i18n/api_v1_translations_id_restore.md)

### [USERS](./users/) - 👤 User management and profiles
*7 endpoints*

- [`/api/v1/users`](./users/api_v1_users.md)
- [`/api/v1/users/by-role`](./users/api_v1_users_by-role.md)
- [`/api/v1/users/ratings`](./users/api_v1_users_ratings.md)
- [`/api/v1/users/search`](./users/api_v1_users_search.md)
- [`/api/v1/users/staff`](./users/api_v1_users_staff.md)
- [`/api/v1/users/{id}`](./users/api_v1_users_id.md)
- [`/api/v1/users/{id}/restore`](./users/api_v1_users_id_restore.md)

---

## 🔐 Authentication

Most endpoints require Bearer token authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

---

## 📊 Quick Stats

- **Total Modules**: 13
- **Total Endpoints**: 296

---

## 🚀 How to Update

Run the update script to refresh all documentation:

```bash
./update-api-docs.sh
```

---

## 📋 Data Models

Common data models are shared across modules. Refer to individual module documentation for specific model usage.

---

*This documentation is automatically generated from the Swagger/OpenAPI specification*  
*Last updated: 2026-06-11T11:28:03.569Z*
