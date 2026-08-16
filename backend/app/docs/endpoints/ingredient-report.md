# Ingredient Report Endpoint

## Overview

The `/api/v1/ingredient-reports` endpoint provides a paginated report of ingredient stock movements grouped by ingredient. It includes metrics such as begin quantity, end quantity, total IN, total OUT, shortage, and surplus for each ingredient within a specified storage and date range.

**Endpoint:** `GET /api/v1/ingredient-reports`

**Authentication:** Requires Bearer token

**Response Format:** JSON

## Query Parameters

### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `storage_id` | string | Storage UUID | `550e8400-e29b-41d4-a716-446655440000` |

### Optional Filter Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `start` | string | Start datetime (RFC3339) or date (YYYY-MM-DD) | `2026-01-01` |
| `end` | string | End datetime (RFC3339) or date (YYYY-MM-DD, inclusive) | `2026-01-31` |
| `ingredient_id` | string | Filter by a specific ingredient UUID | `550e8400-e29b-41d4-a716-446655440001` |
| `measurement` | string | Filter by exact measurement/unit (exact match) | `kg` |
| `ingredient_ids` | string | Comma-separated list of ingredient UUIDs to filter | `550e8400-e29b-41d4-a716-446655440002,550e8400-e29b-41d4-a716-446655440003` |

### Sorting Parameters

| Parameter | Type | Description | Values |
|-----------|------|-------------|--------|
| `sort_by` | string | Field to sort results by | `begin_quantity`, `end_quantity`, `in`, `out`, `shortage`, `surplus`, `ingredient_name` |
| `sort_order` | string | Sort order direction | `asc`, `desc` |

### Pagination Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | integer | Maximum number of results to return | `20` |
| `offset` | integer | Number of results to skip | `0` |

### Other Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `expand` | string | Comma-separated relations to expand | `ingredients` |

## Sorting Fields

The endpoint supports sorting by the following fields:

- **`begin_quantity`**: Quantity at the beginning of the period
- **`end_quantity`**: Quantity at the end of the period
- **`in`**: Total quantity added (IN) during the period
- **`out`**: Total quantity removed (OUT) during the period
- **`shortage`**: Total shortage quantity during the period
- **`surplus`**: Total surplus quantity during the period
- **`ingredient_name`**: Ingredient name (alphabetical)

### Default Behavior

If no `sort_by` parameter is provided, results are sorted by `ingredient_name` in ascending order (alphabetical).

## Response Structure

```json
{
  "status": "ok",
  "message": "Ingredient report retrieved successfully",
  "data": [
    {
      "ingredient_id": "550e8400-e29b-41d4-a716-446655440000",
      "ingredient_name": "Flour",
      "measurement": "kg",
      "picture_url": null,
      "color_code": null,
      "begin_quantity": "100.000000",
      "end_quantity": "80.000000",
      "in": "50.000000",
      "out": "70.000000",
      "shortage": "5.000000",
      "surplus": "0.000000",
      "begin_price": "10000.00",
      "end_price": "12000.00"
    }
  ],
  "totals": {
    "total_count": 1,
    "total_added_amount": "150.00",
    "total_removed_amount": "210.00"
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
GET /api/v1/ingredient-reports?storage_id=550e8400-e29b-41d4-a716-446655440000
```

### Sort by IN Quantity (Descending)

```bash
GET /api/v1/ingredient-reports?storage_id=550e8400-e29b-41d4-a716-446655440000&sort_by=in&sort_order=desc
```

### Sort by OUT Quantity (Ascending)

```bash
GET /api/v1/ingredient-reports?storage_id=550e8400-e29b-41d4-a716-446655440000&sort_by=out&sort_order=asc
```

### Filter by Measurement

```bash
GET /api/v1/ingredient-reports?storage_id=550e8400-e29b-41d4-a716-446655440000&measurement=kg
```

### Filter by Ingredient IDs

```bash
GET /api/v1/ingredient-reports?storage_id=550e8400-e29b-41d4-a716-446655440000&ingredient_ids=550e8400-e29b-41d4-a716-446655440000,550e8400-e29b-41d4-a716-446655440001
```

### Combined Filter and Sort

```bash
GET /api/v1/ingredient-reports?storage_id=550e8400-e29b-41d4-a716-446655440000&measurement=kg&sort_by=end_quantity&sort_order=desc
```

### With Date Range and Pagination

```bash
GET /api/v1/ingredient-reports?storage_id=550e8400-e29b-41d4-a716-446655440000&start=2026-01-01&end=2026-01-31&limit=50&offset=0
```

## Error Responses

### 400 Bad Request

```json
{
  "status": "error",
  "message": "storage_id is required",
  "details": "missing query parameter: storage_id",
  "code": 400
}
```

```json
{
  "status": "error",
  "message": "invalid sort_by",
  "details": "allowed values: begin_quantity, end_quantity, in, out, shortage, surplus, ingredient_name",
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

### 401 Unauthorized

```json
{
  "status": "error",
  "message": "Unauthorized",
  "details": "",
  "code": 401
}
```

### 500 Internal Server Error

```json
{
  "status": "error",
  "message": "failed to get ingredient report",
  "details": "error details here",
  "code": 500
}
```

## Notes

- The `measurement` filter uses exact string matching
- The `ingredient_ids` parameter filters results to only include ingredients with IDs in the comma-separated list. If not provided, all ingredients are returned.
- Sorting is performed at the database level for optimal performance
- The `end` date is inclusive when provided as a plain date (YYYY-MM-DD)
- Only ingredients with stock movements in the specified date range are included in the report
- Shortage and surplus quantities are calculated from inventory adjustment events
