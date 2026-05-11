# Billing API

> **Module:** billing  
> **Base URL:** https://api.maryai.uz/  
> **Last Updated:** 2026-05-11T03:54:32.003Z

---

## Endpoints

## /api/v1/bills

### GET /api/v1/bills 🔒

**Summary:** Get bills

**Description:** List bills (orders) with bill snapshots and filters, supports expand

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| start | query | string | No | Start date/time (RFC3339 or YYYY-MM-DD) |
| end | query | string | No | End date/time (RFC3339 or YYYY-MM-DD) |
| bill_no | query | integer | No | Bill number to search within the date range |
| bill_status | query | string | No | Bill status (opened, closed, paid) |
| payment_type | query | string | No | Payment type (cash, card) |
| waiter_id | query | string | No | Waiter ID (UUID) |
| hall_id | query | string | No | Hall ID (UUID) |
| table_id | query | string | No | Table ID (UUID) |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |
| expand | query | string | No | Expand relations (comma-separated: user_id, hall_id, table_id, etc) |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
}
```

- **400**: Bad Request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```

- **401**: Unauthorized
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


## /api/v1/bills/{id}

### GET /api/v1/bills/{id} 🔒

**Summary:** Get bill details

**Description:** Get full bill details including items, supports expand

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Bill ID (UUID) |
| expand | query | string | No | Expand relations (comma-separated: user_id, hall_id, etc) |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
}
```

- **400**: Bad Request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```

- **401**: Unauthorized
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


