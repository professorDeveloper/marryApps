# Staff API

> **Module:** staff  
> **Base URL:** https://api.maryai.uz/  
> **Last Updated:** 2026-04-25T01:35:03.605Z

---

## Endpoints

## /api/v1/orders/waiter/{waiterId}

### GET /api/v1/orders/waiter/{waiterId} 🔒

**Summary:** Get orders by waiter

**Description:** Get orders filtered by waiter ID with pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| waiterId | path | string | Yes | Waiter ID |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.OrderResponse"
  }
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


## /api/v1/shifts

### GET /api/v1/shifts 🔒

**Summary:** Get all shifts

**Description:** Retrieve all shifts in the system

**Responses:**

- **200**: List of all shifts
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.ShiftResponse"
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


### POST /api/v1/shifts 🔒

**Summary:** Create a new shift

**Description:** Create a new shift for staff scheduling

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | Shift creation data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateShiftRequest"
}
```

**Responses:**

- **201**: Shift created successfully
  ```json
{
  "$ref": "#/definitions/model.ShiftResponse"
}
```

- **400**: Invalid request data
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


## /api/v1/shifts/branch/{branchId}

### GET /api/v1/shifts/branch/{branchId} 🔒

**Summary:** Get shifts by branch

**Description:** Retrieve all shifts for a specific branch

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| branchId | path | string | Yes | Branch ID |

**Responses:**

- **200**: List of shifts for the branch
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.ShiftResponse"
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


## /api/v1/shifts/{id}

### GET /api/v1/shifts/{id} 🔒

**Summary:** Get shift by ID

**Description:** Retrieve a specific shift by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Shift ID |

**Responses:**

- **200**: Shift details
  ```json
{
  "$ref": "#/definitions/model.ShiftResponse"
}
```

- **400**: Invalid shift ID
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

- **404**: Shift not found
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


### PUT /api/v1/shifts/{id} 🔒

**Summary:** Update shift

**Description:** Update an existing shift details

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Shift ID |
| input | body | object | Yes | Shift update data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateShiftRequest"
}
```

**Responses:**

- **200**: Shift updated successfully
  ```json
{
  "$ref": "#/definitions/model.ShiftResponse"
}
```

- **400**: Invalid request data
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

- **404**: Shift not found
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


### DELETE /api/v1/shifts/{id} 🔒

**Summary:** Delete shift

**Description:** Delete a shift from the system

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Shift ID |

**Responses:**

- **200**: Shift deleted successfully
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
}
```

- **400**: Invalid shift ID
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


