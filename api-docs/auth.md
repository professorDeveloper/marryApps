# Auth API

> **Module:** auth  
> **Base URL:** https://api.maryai.uz/  
> **Last Updated:** 2026-05-23T03:18:48.639Z

---

## Endpoints

## /api/v1/auth/global/login

### POST /api/v1/auth/global/login 🔓

**Summary:** Global superadmin login

**Description:** Authenticate global superadmin (main DB) and return access and refresh tokens

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | Login credentials |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.GlobalLoginRequest"
}
```

**Responses:**

- **200**: Successfully logged in
  ```json
{
  "$ref": "#/definitions/model.LoginResponse"
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


## /api/v1/auth/login

### POST /api/v1/auth/login 🔓

**Summary:** User login

**Description:** Authenticate user using username, password, and brand_id (slug) and return access token

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | Login credentials |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.LoginRequest"
}
```

**Responses:**

- **200**: Successfully logged in
  ```json
{
  "$ref": "#/definitions/model.LoginResponse"
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


## /api/v1/auth/login-pincode

### POST /api/v1/auth/login-pincode 🔓

**Summary:** POS staff login with pincode

**Description:** Authenticate POS staff using brand_id, a role password (superadmin/admin/manager), and pincode

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | POS login credentials |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.PincodeLoginRequest"
}
```

**Responses:**

- **200**: Successfully logged in
  ```json
{
  "$ref": "#/definitions/model.LoginResponse"
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


## /api/v1/auth/refresh

### POST /api/v1/auth/refresh 🔒

**Summary:** Token refresh

**Description:** Refresh access token using refresh token

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | Refresh token |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.RefreshRequest"
}
```

**Responses:**

- **200**: Token refreshed successfully
  ```json
{
  "$ref": "#/definitions/model.RefreshResponse"
}
```

- **400**: Invalid request format
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```

- **401**: Invalid or expired refresh token
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/auth/register

### POST /api/v1/auth/register 🔓

**Summary:** Register a new user account

**Description:** Register a new user. User role defaults to 'user' if not provided.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | User registration data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.RegisterRequest"
}
```

**Responses:**

- **201**: User successfully registered
  ```json
{
  "$ref": "#/definitions/model.RegisterResponse"
}
```

- **400**: Bad request - invalid input, missing required fields, or user already exists with phone number
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


## /api/v1/auth/terminal/branches

### POST /api/v1/auth/terminal/branches 🔓

**Summary:** Get branches for terminal

**Description:** Verify brand admin password and return list of branches

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | Brand credentials |

**Request Body:**

```json
{
  "$ref": "#/definitions/handler.getTerminalBranchesRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.BranchResponse"
  }
}
```


## /api/v1/auth/terminal/token

### POST /api/v1/auth/terminal/token 🔓

**Summary:** Generate terminal token

**Description:** Verify brand admin password + branch_id and issue a permanent terminal JWT

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | Terminal token request |

**Request Body:**

```json
{
  "$ref": "#/definitions/handler.generateTerminalTokenRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/handler.generateTerminalTokenResponse"
}
```


