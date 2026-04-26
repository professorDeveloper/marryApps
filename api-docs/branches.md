# Branches API

> **Module:** branches  
> **Base URL:** https://api.maryai.uz/  
> **Last Updated:** 2026-04-25T01:35:03.601Z

---

## Endpoints

## /api/v1/branches

### GET /api/v1/branches 🔒

**Summary:** Get all branches

**Description:** Retrieve all branches with pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| limit | query | integer | No | Limit results (default: 20) |
| offset | query | integer | No | Offset for pagination (default: 0) |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: List of all branches
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.BranchResponse"
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


### POST /api/v1/branches 🔒

**Summary:** Create a new branch

**Description:** Create a new branch with name, address, and phone

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | Branch creation data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateBranchRequest"
}
```

**Responses:**

- **201**: Branch created successfully
  ```json
{
  "$ref": "#/definitions/model.BranchResponse"
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


## /api/v1/branches-lang

### GET /api/v1/branches-lang 🔒

**Summary:** Get all branches with language support

**Description:** Retrieve all branches with names translated to specified language

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language code (uz, ru, en - default: uz) |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: Branches retrieved successfully
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.BranchResponse"
  }
}
```

- **400**: Invalid request parameters
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


## /api/v1/branches-lang/{id}

### GET /api/v1/branches-lang/{id} 🔒

**Summary:** Get branch by ID with language support

**Description:** Retrieve a specific branch by its ID with names translated to specified language

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Branch ID |
| lang | query | string | No | Language code (uz, ru, en - default: uz) |

**Responses:**

- **200**: Branch details
  ```json
{
  "$ref": "#/definitions/model.BranchResponse"
}
```

- **400**: Invalid request parameters
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

- **404**: Branch not found
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


## /api/v1/branches/{branch_id}/compound-stock

### GET /api/v1/branches/{branch_id}/compound-stock 🔒

**Summary:** Get compound stock by branch

**Description:** Get all compound stocks for a specific branch with pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| branch_id | path | string | Yes | Branch ID |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.CompoundStockResponse"
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


## /api/v1/branches/{id}

### GET /api/v1/branches/{id} 🔒

**Summary:** Get branch by ID

**Description:** Retrieve a specific branch by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Branch ID |

**Responses:**

- **200**: Branch details
  ```json
{
  "$ref": "#/definitions/model.BranchResponse"
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

- **404**: Branch not found
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


### PUT /api/v1/branches/{id} 🔒

**Summary:** Update branch

**Description:** Update a branch's name, name_i18n, or phone

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Branch ID |
| input | body | object | Yes | Branch update data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateBranchRequest"
}
```

**Responses:**

- **200**: Branch updated successfully
  ```json
{
  "$ref": "#/definitions/model.BranchResponse"
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


### DELETE /api/v1/branches/{id} 🔒

**Summary:** Delete branch

**Description:** Soft delete a branch (mark as deleted without removing from database)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Branch ID |

**Responses:**

- **200**: Branch deleted successfully
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
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


## /api/v1/branches/{id}/restore

### POST /api/v1/branches/{id}/restore 🔒

**Summary:** Restore branch

**Description:** Restore a previously deleted branch

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Branch ID |

**Responses:**

- **200**: Branch restored successfully
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
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


