# Cafe API

> **Module:** cafe  
> **Base URL:** https://api.maryai.uz/  
> **Last Updated:** 2026-05-11T03:54:32.003Z

---

## Endpoints

## /api/v1/cafe-tables

### GET /api/v1/cafe-tables 🔒

**Summary:** Get all cafe tables

**Description:** Retrieve all cafe tables with pagination, optional search, hall filter, status filter and sorting

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| search | query | string | No | Search by table number |
| hall_id | query | string | No | Filter by hall ID |
| status | query | string | No | Filter by table status |
| table_type | query | string | No | Filter by table type |
| sort_by | query | string | No | Sort by field |
| sort_order | query | string | No | Sort order |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.PaginatedCafeTablesResponse"
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


### POST /api/v1/cafe-tables 🔒

**Summary:** Create a new cafe table

**Description:** Create a new cafe table in a specific hall

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | Create Cafe Table Request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateCafeTableRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.CafeTableResponse"
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


## /api/v1/cafe-tables/available/capacity

### GET /api/v1/cafe-tables/available/capacity 🔒

**Summary:** Get available tables by capacity

**Description:** Get available tables that can accommodate a minimum number of guests

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| capacity | query | integer | Yes | Minimum capacity |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.CafeTableResponse"
  }
}
```

- **400**: Bad Request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/cafe-tables/available/hall/{hall_id}

### GET /api/v1/cafe-tables/available/hall/{hall_id} 🔒

**Summary:** Get available tables by hall

**Description:** Get all available (free) tables in a specific hall

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| hall_id | path | string | Yes | Hall ID |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.CafeTableResponse"
  }
}
```

- **400**: Bad Request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/cafe-tables/available/hall/{hall_id}/capacity

### GET /api/v1/cafe-tables/available/hall/{hall_id}/capacity 🔒

**Summary:** Get available tables by hall and capacity

**Description:** Get available tables in a specific hall that can accommodate a minimum number of guests

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| hall_id | path | string | Yes | Hall ID |
| capacity | query | integer | Yes | Minimum capacity |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.CafeTableResponse"
  }
}
```

- **400**: Bad Request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/cafe-tables/hall-status

### GET /api/v1/cafe-tables/hall-status 🔒

**Summary:** Get cafe tables by hall and status

**Description:** Get tables in a specific hall with a specific status

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| hall_id | query | string | No | Hall ID |
| status | query | string | No | Status |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.CafeTableResponse"
  }
}
```

- **400**: Bad Request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/cafe-tables/hall/{hall_id}

### GET /api/v1/cafe-tables/hall/{hall_id} 🔒

**Summary:** Get cafe tables by hall ID

**Description:** Get all tables in a specific hall

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| hall_id | path | string | Yes | Hall ID |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.CafeTableResponse"
  }
}
```

- **400**: Bad Request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/cafe-tables/stats/occupancy

### GET /api/v1/cafe-tables/stats/occupancy 🔒

**Summary:** Get table occupancy statistics

**Description:** Get overall cafe table occupancy statistics

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.TableOccupancyStats"
}
```

- **400**: Bad Request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/cafe-tables/status/{status}

### GET /api/v1/cafe-tables/status/{status} 🔒

**Summary:** Get cafe tables by status

**Description:** Get tables with a specific status

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| status | path | string | Yes | Status |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.CafeTableResponse"
  }
}
```

- **400**: Bad Request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/cafe-tables/{id}

### GET /api/v1/cafe-tables/{id} 🔒

**Summary:** Get cafe table by ID

**Description:** Get a specific cafe table by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Cafe Table ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.CafeTableResponse"
}
```

- **404**: Not Found
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


### PUT /api/v1/cafe-tables/{id} 🔒

**Summary:** Update a cafe table

**Description:** Update a cafe table details

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Cafe Table ID |
| request | body | object | Yes | Update Cafe Table Request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateCafeTableRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.CafeTableResponse"
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


### DELETE /api/v1/cafe-tables/{id} 🔒

**Summary:** Delete a cafe table

**Description:** Soft delete a cafe table

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Cafe Table ID |

**Responses:**

- **204**: No Content
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


## /api/v1/cafe-tables/{id}/restore

### POST /api/v1/cafe-tables/{id}/restore 🔒

**Summary:** Restore a cafe table

**Description:** Restore a soft deleted cafe table

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Cafe Table ID |

**Responses:**

- **204**: No Content
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


## /api/v1/cafe-tables/{id}/set-busy

### POST /api/v1/cafe-tables/{id}/set-busy 🔒

**Summary:** Set table as busy

**Description:** Mark a cafe table as busy (occupied)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Cafe Table ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.CafeTableResponse"
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


## /api/v1/cafe-tables/{id}/set-free

### POST /api/v1/cafe-tables/{id}/set-free 🔒

**Summary:** Set table as free

**Description:** Mark a cafe table as free (available)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Cafe Table ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.CafeTableResponse"
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


## /api/v1/cafe-tables/{id}/status

### PATCH /api/v1/cafe-tables/{id}/status 🔒

**Summary:** Update cafe table status

**Description:** Update the status of a cafe table

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Cafe Table ID |
| request | body | object | Yes | Update Cafe Table Status Request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateCafeTableStatusRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.CafeTableResponse"
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


