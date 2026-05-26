# Cash API

> **Module:** cash  
> **Base URL:** https://api.maryai.uz/  
> **Last Updated:** 2026-05-23T03:18:48.641Z

---

## Endpoints

## /api/v1/cash-register-shifts

### GET /api/v1/cash-register-shifts 🔒

**Summary:** List cash register shifts

**Description:** Returns a paginated list of cash register shifts. Filter by cash_register_id, cashier_id, or status (open/closed).

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| cash_register_id | query | string | No | Filter by cash register ID |
| cashier_id | query | string | No | Filter by cashier ID |
| status | query | string | No | Filter by status: open or closed |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.CashRegisterShiftResponse"
  }
}
```

- **500**: Internal Server Error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


### POST /api/v1/cash-register-shifts 🔒

**Summary:** Open cash register shift

**Description:** Opens a new shift for a cash register. Only one active shift per cash register is allowed.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | Open shift request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.OpenCashRegisterShiftRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.CashRegisterShiftResponse"
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


## /api/v1/cash-register-shifts/active

### GET /api/v1/cash-register-shifts/active 🔒

**Summary:** Get active shift

**Description:** Returns the currently open shift for the given cash register.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| cash_register_id | query | string | Yes | Cash Register ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.CashRegisterShiftResponse"
}
```

- **404**: Not Found
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


## /api/v1/cash-register-shifts/{id}

### GET /api/v1/cash-register-shifts/{id} 🔒

**Summary:** Get cash register shift

**Description:** Returns a single cash register shift by its ID.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Shift ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.CashRegisterShiftResponse"
}
```

- **404**: Not Found
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


### DELETE /api/v1/cash-register-shifts/{id} 🔒

**Summary:** Delete cash register shift

**Description:** Soft-deletes a cash register shift by ID.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Shift ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
}
```

- **500**: Internal Server Error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/cash-register-shifts/{id}/close

### POST /api/v1/cash-register-shifts/{id}/close 🔒

**Summary:** Close cash register shift

**Description:** Closes an open shift by recording closing cash and card amounts.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Shift ID |
| request | body | object | Yes | Close shift request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CloseCashRegisterShiftRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.CashRegisterShiftResponse"
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


## /api/v1/cash-registers

### GET /api/v1/cash-registers 🔒

**Summary:** Get all cash registers

**Description:** Retrieve all cash registers for the current branch with optional search filter

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| search | query | string | No | Filter by name |
| limit | query | integer | No | Limit results (default: 20) |
| offset | query | integer | No | Offset for pagination (default: 0) |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: Cash registers retrieved successfully
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.CashRegisterResponse"
  }
}
```

- **401**: Unauthorized
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


### POST /api/v1/cash-registers 🔒

**Summary:** Create a new cash register

**Description:** Create a new cash register for the current branch

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | Cash register data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CashRegisterRequest"
}
```

**Responses:**

- **201**: Cash register created successfully
  ```json
{
  "$ref": "#/definitions/model.CashRegisterResponse"
}
```

- **400**: Invalid request format
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

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/cash-registers/branch/{branchId}

### GET /api/v1/cash-registers/branch/{branchId} 🔒

**Summary:** Get cash registers by branch ID

**Description:** Retrieve all cash registers for a specific branch

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| branchId | path | string | Yes | Branch ID |
| limit | query | integer | No | Limit results (default: 20) |
| offset | query | integer | No | Offset for pagination (default: 0) |

**Responses:**

- **200**: Cash registers retrieved successfully
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.CashRegisterResponse"
  }
}
```

- **400**: Invalid branch ID
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

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/cash-registers/{id}

### GET /api/v1/cash-registers/{id} 🔒

**Summary:** Get cash register by ID

**Description:** Retrieve a cash register by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Cash register ID |

**Responses:**

- **200**: Cash register retrieved successfully
  ```json
{
  "$ref": "#/definitions/model.CashRegisterResponse"
}
```

- **401**: Unauthorized
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```

- **404**: Cash register not found
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


### PUT /api/v1/cash-registers/{id} 🔒

**Summary:** Update cash register

**Description:** Update a cash register

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Cash register ID |
| request | body | object | Yes | Cash register update data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CashRegisterRequest"
}
```

**Responses:**

- **200**: Cash register updated successfully
  ```json
{
  "$ref": "#/definitions/model.CashRegisterResponse"
}
```

- **400**: Invalid request format
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

- **404**: Cash register not found
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


### DELETE /api/v1/cash-registers/{id} 🔒

**Summary:** Delete cash register

**Description:** Soft delete a cash register

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Cash register ID |

**Responses:**

- **200**: Cash register deleted successfully
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
}
```

- **400**: Invalid ID
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

- **404**: Cash register not found
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/cash-registers/{id}/restore

### POST /api/v1/cash-registers/{id}/restore 🔒

**Summary:** Restore cash register

**Description:** Restore a soft-deleted cash register

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Cash register ID |

**Responses:**

- **200**: Cash register restored successfully
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
}
```

- **400**: Invalid ID
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

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


