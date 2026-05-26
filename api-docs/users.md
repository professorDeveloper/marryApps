# Users API

> **Module:** users  
> **Base URL:** https://api.maryai.uz/  
> **Last Updated:** 2026-05-23T03:18:48.643Z

---

## Endpoints

## /api/v1/users

### GET /api/v1/users 🔒

**Summary:** Get users

**Description:** Get users with query, role, staff and branch_id filters

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| query | query | string | No | Search by full_name, username, phone_number |
| role | query | string | No | Role filter |
| staff | query | boolean | No | Only staff users (exclude admin and superadmin) |
| branch_id | query | string | No | Branch ID filter (superadmin only) |
| limit | query | integer | No | Limit results (default: 20) |
| offset | query | integer | No | Offset for pagination (default: 0) |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.UserResponse"
  }
}
```

- **400**: Bad Request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```

- **403**: Forbidden
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


## /api/v1/users/by-role

### GET /api/v1/users/by-role 🔒

**Summary:** Get users by role

**Description:** Retrieve all users with a specific role with pagination and optional expand

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| role | query | string | Yes | User role (admin, manager, cashier, waiter, kitchen, user, superadmin) |
| limit | query | integer | No | Limit results (default: 20) |
| offset | query | integer | No | Offset for pagination (default: 0) |
| expand | query | string | No | Expand related fields (e.g. shift,branch) |

**Responses:**

- **200**: Paginated list of users
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.UserResponse"
  }
}
```

- **400**: Invalid role parameter
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


## /api/v1/users/ratings

### GET /api/v1/users/ratings 🔒

**Summary:** Get user ratings

**Description:** undefined

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| period | query | string | No | Period: weekly|monthly|all_time (default: monthly) |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.EmployeeRatingSwaggerResponse"
}
```

- **500**: Internal Server Error
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```


## /api/v1/users/search

### GET /api/v1/users/search 🔒

**Summary:** Search users

**Description:** Search users by name, phone, or username with pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| query | query | string | Yes | Search query (name, phone, or username) |
| limit | query | integer | No | Limit results (default: 20) |
| offset | query | integer | No | Offset for pagination (default: 0) |

**Responses:**

- **200**: List of matching users
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.UserResponse"
  }
}
```

- **400**: Invalid query parameter
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


## /api/v1/users/staff

### GET /api/v1/users/staff 🔒

**Summary:** Get staff users

**Description:** Retrieve all staff members (excluding admin/superadmin) with pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| limit | query | integer | No | Limit results (default: 20) |
| offset | query | integer | No | Offset for pagination (default: 0) |
| expand | query | string | No | Expand related fields (e.g. shift,branch) |

**Responses:**

- **200**: Paginated list of staff
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.UserResponse"
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


## /api/v1/users/{id}

### GET /api/v1/users/{id} 🔒

**Summary:** Get user by ID

**Description:** Retrieve a single user by their UUID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | User ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.UserResponse"
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


### PUT /api/v1/users/{id} 🔒

**Summary:** Update user profile by ID

**Description:** Update the profile information for the specified user (admin/superadmin use)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | User ID |
| request | body | object | Yes | User update data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateUserRequest"
}
```

**Responses:**

- **200**: User profile updated successfully
  ```json
{
  "$ref": "#/definitions/model.UserResponse"
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

- **500**: Failed to update user
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


### DELETE /api/v1/users/{id} 🔒

**Summary:** Delete user

**Description:** Soft delete a user (mark as deleted without removing from database)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | User ID |

**Responses:**

- **200**: User deleted successfully
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
}
```

- **400**: Invalid user ID
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


## /api/v1/users/{id}/restore

### POST /api/v1/users/{id}/restore 🔒

**Summary:** Restore user

**Description:** Restore a previously deleted user

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | User ID |

**Responses:**

- **200**: User restored successfully
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
}
```

- **400**: Invalid user ID
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


