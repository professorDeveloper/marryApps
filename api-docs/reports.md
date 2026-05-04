# Reports API

> **Module:** reports  
> **Base URL:** https://api.maryai.uz/  
> **Last Updated:** 2026-05-03T04:40:13.569Z

---

## Endpoints

## /api/v1/reports/goods

### GET /api/v1/reports/goods 🔒

**Summary:** Goods sales report

**Description:** Paginated report: qty sold, selling price, cost price, markup per dish. Only paid orders. Filters by date range, department, category, dish, waiter, hall, table, good IDs. Sortable by total_qty, avg_sell_price, total_sell, avg_cost_price, total_cost, avg_markup, total_markup, name.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| start_date | query | string | Yes | Start date (YYYY-MM-DD) |
| end_date | query | string | Yes | End date (YYYY-MM-DD, inclusive) |
| department_id | query | string | No | Filter by department UUID |
| category_id | query | string | No | Filter by category UUID |
| good_id | query | string | No | Filter by specific good UUID |
| waiter_id | query | string | No | Filter by waiter UUID |
| hall_id | query | string | No | Filter by hall UUID |
| table_id | query | string | No | Filter by table UUID |
| good_ids | query | string | No | Comma-separated good UUIDs to filter |
| sort_by | query | string | No | Sort by field |
| sort_order | query | string | No | Sort order |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.GoodsReportResponse"
}
```

- **400**: Bad Request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```

- **500**: Internal Server Error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/reports/goods/{id}/orders

### GET /api/v1/reports/goods/{id}/orders 🔒

**Summary:** Good orders report

**Description:** Per-order breakdown for a specific good: qty, sell price, cost price, markup per order. Only paid orders.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Good UUID |
| start_date | query | string | Yes | Start date (YYYY-MM-DD) |
| end_date | query | string | Yes | End date (YYYY-MM-DD, inclusive) |
| waiter_id | query | string | No | Filter by waiter UUID |
| hall_id | query | string | No | Filter by hall UUID |
| table_id | query | string | No | Filter by table UUID |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.GoodOrdersReportResponse"
}
```

- **400**: Bad Request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```

- **500**: Internal Server Error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


