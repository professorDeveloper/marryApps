# Goods Report Endpoint

## Overview

The `/api/v1/reports/goods` endpoint provides a paginated report of dish sales grouped by good (menu item). It includes metrics such as quantity sold, average selling price, total sales revenue, average cost price, total cost, average markup, and total markup for each good.

**Endpoint:** `GET /api/v1/reports/goods`

**Authentication:** Requires Bearer token

**Response Format:** JSON

## Query Parameters

### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `start_date` | string | Start date in YYYY-MM-DD format | `2026-01-01` |
| `end_date` | string | End date in YYYY-MM-DD format (inclusive) | `2026-01-31` |

### Optional Filter Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `department_id` | string | Filter by department UUID | `550e8400-e29b-41d4-a716-446655440000` |
| `category_id` | string | Filter by category UUID | `550e8400-e29b-41d4-a716-446655440001` |
| `good_id` | string | Filter by a specific good UUID | `550e8400-e29b-41d4-a716-446655440002` |
| `waiter_id` | string | Filter by waiter UUID | `550e8400-e29b-41d4-a716-446655440003` |
| `hall_id` | string | Filter by hall UUID | `550e8400-e29b-41d4-a716-446655440004` |
| `table_id` | string | Filter by table UUID | `550e8400-e29b-41d4-a716-446655440005` |
| `good_ids` | string | Comma-separated list of good UUIDs to filter | `550e8400-e29b-41d4-a716-446655440002,550e8400-e29b-41d4-a716-446655440003` |

### Sorting Parameters

| Parameter | Type | Description | Values |
|-----------|------|-------------|--------|
| `sort_by` | string | Field to sort results by | `name`, `total_qty`, `avg_sell_price`, `total_sell`, `avg_cost_price`, `total_cost`, `avg_markup`, `total_markup` |
| `sort_order` | string | Sort order direction | `asc`, `desc` |

### Pagination Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | integer | Maximum number of results to return | `20` |
| `offset` | integer | Number of results to skip | `0` |

### Other Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `expand` | string | Comma-separated relations to expand | `goods,category` |

## Sorting Fields

The endpoint supports sorting by the following fields:

- **`name`**: Good name (alphabetical)
- **`total_qty`**: Total quantity sold
- **`avg_sell_price`**: Average selling price per unit
- **`total_sell`**: Total sales revenue
- **`avg_cost_price`**: Average cost price per unit
- **`total_cost`**: Total cost
- **`avg_markup`**: Average markup per unit
- **`total_markup`**: Total markup

### Default Behavior

If no `sort_by` parameter is provided, results are sorted by `name` in ascending order (alphabetical).

## Response Structure

```json
{
  "status": "ok",
  "message": "success",
  "data": [
    {
      "good_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Burger",
      "total_qty": 150,
      "avg_sell_price": "12.50",
      "total_sell": "1875.00",
      "avg_cost_price": "8.00",
      "total_cost": "1200.00",
      "avg_markup": "4.50",
      "total_markup": "675.00",
      "avg_markup_pct": "56.25"
    }
  ],
  "totals": {
    "total_qty": 150,
    "total_sell": "1875.00",
    "total_cost": "1200.00",
    "total_markup": "675.00",
    "avg_markup_pct": "56.25",
    "total_count": 1
  },
  "pagination": {
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

## Example Requests

### Basic Request

```bash
GET /api/v1/reports/goods?start_date=2026-01-01&end_date=2026-01-31
```

### Sort by Total Quantity (Descending)

```bash
GET /api/v1/reports/goods?start_date=2026-01-01&end_date=2026-01-31&sort_by=total_qty&sort_order=desc
```

### Sort by Average Sell Price (Ascending)

```bash
GET /api/v1/reports/goods?start_date=2026-01-01&end_date=2026-01-31&sort_by=avg_sell_price&sort_order=asc
```

### Filter by Good IDs

```bash
GET /api/v1/reports/goods?start_date=2026-01-01&end_date=2026-01-31&good_ids=550e8400-e29b-41d4-a716-446655440000,550e8400-e29b-41d4-a716-446655440001
```

### Combined Filter and Sort

```bash
GET /api/v1/reports/goods?start_date=2026-01-01&end_date=2026-01-31&good_ids=550e8400-e29b-41d4-a716-446655440000,550e8400-e29b-41d4-a716-446655440001&sort_by=total_markup&sort_order=desc
```

### With Pagination

```bash
GET /api/v1/reports/goods?start_date=2026-01-01&end_date=2026-01-31&limit=50&offset=0
```

## Error Responses

### 400 Bad Request

```json
{
  "status": "error",
  "message": "start_date and end_date are required",
  "details": "",
  "code": 400
}
```

```json
{
  "status": "error",
  "message": "invalid sort_by",
  "details": "allowed values: name, total_qty, avg_sell_price, total_sell, avg_cost_price, total_cost, avg_markup, total_markup",
  "code": 400
}
```

```json
{
  "status": "error",
  "message": "invalid sort_order",
  "details": "allowed values: asc, desc",
  "code": 400
}
```

### 500 Internal Server Error

```json
{
  "status": "error",
  "message": "failed to get goods report",
  "details": "error details here",
  "code": 500
}
```

## Notes

- Only paid orders (`bill_status = 'paid'`) are included in the report
- The `end_date` is inclusive when provided as a plain date (YYYY-MM-DD)
- The `good_ids` parameter filters results to only include goods with IDs in the comma-separated list. If not provided, all goods are returned.
- Sorting is performed at the database level for optimal performance
- The `avg_markup_pct` is calculated as `(avg_markup / avg_cost_price) * 100` and returns 0 when cost price is 0
