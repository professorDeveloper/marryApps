# Admin API

> **Module:** admin  
> **Base URL:** https://api.maryai.uz/  
> **Last Updated:** 2026-04-29T15:27:32.827Z

---

## Endpoints

## /api/v1/admin/brands

### GET /api/v1/admin/brands 🔒

**Summary:** List brands

**Description:** Get all brands with pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| limit | query | integer | No | Limit (default: 10, max: 100) |
| offset | query | integer | No | Offset (default: 0) |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.BrandResponse"
  }
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


### POST /api/v1/admin/brands 🔒

**Summary:** Create brand

**Description:** Create a new brand

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | Brand creation request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateBrandRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.BrandResponse"
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


## /api/v1/admin/brands/{id}

### GET /api/v1/admin/brands/{id} 🔒

**Summary:** Get brand

**Description:** Get a brand by ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Brand ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.BrandResponse"
}
```

- **400**: Bad Request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
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


### PUT /api/v1/admin/brands/{id} 🔒

**Summary:** Update brand

**Description:** Update a brand by ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Brand ID |
| request | body | object | Yes | Brand update request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateBrandRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.BrandResponse"
}
```

- **400**: Bad Request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
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


### DELETE /api/v1/admin/brands/{id} 🔒

**Summary:** Delete brand

**Description:** Delete a brand by ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Brand ID |

**Responses:**

- **204**: No Content
- **400**: Bad Request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
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


## /api/v1/admin/brands/{id}/superadmins

### GET /api/v1/admin/brands/{id}/superadmins 🔒

**Summary:** List brand superadmins

**Description:** undefined

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Brand UUID |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.BrandSuperadminResponse"
  }
}
```


### POST /api/v1/admin/brands/{id}/superadmins 🔒

**Summary:** Create brand superadmin

**Description:** undefined

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Brand UUID |
| request | body | object | Yes | Superadmin creation request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateBrandSuperadminRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.BrandSuperadminResponse"
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


## /api/v1/admin/brands/{id}/superadmins/{user_id}

### GET /api/v1/admin/brands/{id}/superadmins/{user_id} 🔒

**Summary:** Get brand superadmin

**Description:** undefined

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Brand UUID |
| user_id | path | string | Yes | User UUID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.BrandSuperadminResponse"
}
```


### PUT /api/v1/admin/brands/{id}/superadmins/{user_id} 🔒

**Summary:** Update brand superadmin

**Description:** undefined

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Brand UUID |
| user_id | path | string | Yes | User UUID |
| request | body | object | Yes | Update request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateBrandSuperadminRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.BrandSuperadminResponse"
}
```


### DELETE /api/v1/admin/brands/{id}/superadmins/{user_id} 🔒

**Summary:** Delete brand superadmin

**Description:** undefined

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Brand UUID |
| user_id | path | string | Yes | User UUID |

**Responses:**

- **200**: OK

