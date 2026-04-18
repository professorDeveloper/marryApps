# Menu API

> **Module:** menu  
> **Base URL:** https://api.maryai.uz/  
> **Last Updated:** 2026-04-17T11:19:13.215Z

---

## Endpoints

## /api/v1/categories

### GET /api/v1/categories 🔒

**Summary:** Get all categories

**Description:** Retrieve all categories with pagination, optional search, filters and sorting

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| search | query | string | No | Search by category name |
| department_id | query | string | No | Filter by department ID |
| storage_id | query | string | No | Filter by storage ID |
| sort_by | query | string | No | Sort by field |
| sort_order | query | string | No | Sort order |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.PaginatedCategoriesResponse"
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


### POST /api/v1/categories 🔒

**Summary:** Create a new category

**Description:** Create a new category with name and optional relationships (department, storage, parent)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | Category creation data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateCategoryRequest"
}
```

**Responses:**

- **201**: Category created successfully
  ```json
{
  "$ref": "#/definitions/model.CategoryResponse"
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


## /api/v1/categories-lang

### GET /api/v1/categories-lang 🔒

**Summary:** Get all categories with language support

**Description:** Retrieve all categories with names translated to specified language

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| search | query | string | No | Search by category name |
| department_id | query | string | No | Filter by department ID |
| storage_id | query | string | No | Filter by storage ID |
| sort_by | query | string | No | Sort by field |
| sort_order | query | string | No | Sort order |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.PaginatedCategoriesResponse"
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


## /api/v1/categories-lang/{id}

### GET /api/v1/categories-lang/{id} 🔒

**Summary:** Get category by ID with language support

**Description:** Retrieve a specific category by its ID with names translated to specified language

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Category ID |
| lang | query | string | No | Language code (uz, ru, en - default: uz) |

**Responses:**

- **200**: Category details
  ```json
{
  "$ref": "#/definitions/model.CategoryResponse"
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

- **404**: Category not found
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


## /api/v1/categories/department/{departmentId}

### GET /api/v1/categories/department/{departmentId} 🔒

**Summary:** Get categories by department

**Description:** Retrieve all categories for a specific department

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| departmentId | path | string | Yes | Department ID |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: Categories found
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.CategoryResponse"
  }
}
```

- **400**: Invalid ID format
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


## /api/v1/categories/parent/{parentId}

### GET /api/v1/categories/parent/{parentId} 🔒

**Summary:** Get subcategories by parent

**Description:** Retrieve all subcategories for a specific parent category

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| parentId | path | string | Yes | Parent Category ID |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: Subcategories found
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.CategoryResponse"
  }
}
```

- **400**: Invalid ID format
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


## /api/v1/categories/root

### GET /api/v1/categories/root 🔒

**Summary:** Get root categories

**Description:** Retrieve all root categories (categories without parent)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: Root categories found
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.CategoryResponse"
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


## /api/v1/categories/storage/{storageId}

### GET /api/v1/categories/storage/{storageId} 🔒

**Summary:** Get categories by storage

**Description:** Retrieve all categories for a specific storage

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| storageId | path | string | Yes | Storage ID |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: Categories found
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.CategoryResponse"
  }
}
```

- **400**: Invalid ID format
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


## /api/v1/categories/{category_id}/goods

### GET /api/v1/categories/{category_id}/goods 🔒

**Summary:** Get goods by category

**Description:** Get goods by category with pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| category_id | path | string | Yes | Category ID |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.GoodResponse"
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


## /api/v1/categories/{id}

### GET /api/v1/categories/{id} 🔒

**Summary:** Get a category by ID

**Description:** Retrieve a specific category by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Category ID |

**Responses:**

- **200**: Category found
  ```json
{
  "$ref": "#/definitions/model.CategoryResponse"
}
```

- **400**: Invalid ID format
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

- **404**: Category not found
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


### PUT /api/v1/categories/{id} 🔒

**Summary:** Update a category

**Description:** Update an existing category

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Category ID |
| input | body | object | Yes | Category update data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateCategoryRequest"
}
```

**Responses:**

- **200**: Category updated successfully
  ```json
{
  "$ref": "#/definitions/model.CategoryResponse"
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

- **404**: Category not found
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


### DELETE /api/v1/categories/{id} 🔒

**Summary:** Delete a category

**Description:** Soft delete a category by ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Category ID |

**Responses:**

- **204**: Category deleted successfully
- **400**: Invalid ID format
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

- **404**: Category not found
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


## /api/v1/categories/{id}/restore

### POST /api/v1/categories/{id}/restore 🔒

**Summary:** Restore a category

**Description:** Restore a soft-deleted category by ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Category ID |

**Responses:**

- **200**: Category restored successfully
  ```json
{
  "$ref": "#/definitions/model.CategoryResponse"
}
```

- **400**: Invalid ID format
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

- **404**: Category not found
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


## /api/v1/goods/{id}/modifiers

### GET /api/v1/goods/{id}/modifiers 🔒

**Summary:** Get modifiers by good ID

**Description:** Retrieve all modifiers attached to a good

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Good ID |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.GoodModifierResponse"
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


### POST /api/v1/goods/{id}/modifiers 🔒

**Summary:** Attach modifier to good

**Description:** Attach a modifier to a good

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Good ID |
| request | body | object | Yes | Attach modifiers request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.AttachModifiersToGoodRequest"
}
```

**Responses:**

- **201**: Created
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

- **500**: Internal Server Error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/goods/{id}/modifiers/{modifierId}

### DELETE /api/v1/goods/{id}/modifiers/{modifierId} 🔒

**Summary:** Detach modifier from good

**Description:** Detach a modifier from a good

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Good ID |
| modifierId | path | string | Yes | Modifier ID |

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

- **500**: Internal Server Error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/modifiers

### GET /api/v1/modifiers 🔒

**Summary:** Get modifiers

**Description:** Retrieve modifiers with optional search by name, description, or code

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| q | query | string | No | Search query |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.PaginatedModifiersResponse"
}
```

- **500**: Internal Server Error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/modifiers/calculations

### GET /api/v1/modifiers/calculations 🔒

**Summary:** List modifier calculations

**Description:** Returns all ingredient/child-compound calculation rows for a modifier.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| modifier_id | query | string | Yes | Modifier ID |
| lang | query | string | No | Language (uz, ru, en) |

**Responses:**

- **200**: Modifier calculations retrieved successfully
  ```json
{
  "allOf": [
    {
      "$ref": "#/definitions/model.SuccessResponse"
    },
    {
      "type": "object",
      "properties": {
        "data": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/model.ModifierCalculationResponse"
          }
        }
      }
    }
  ]
}
```

- **400**: modifier_id is required / invalid
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

- **404**: Modifier not found
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


### POST /api/v1/modifiers/calculations 🔒

**Summary:** Create modifier calculation

**Description:** Add an ingredient or child compound to a modifier tech-card.

**Use this API when a modifier itself consumes stock.**

Examples:
- Extra cheese -> ingredient cheese, quantity 0.05
- Salad set -> child compound salad-base, quantity 1

Provide exactly one of:
- ingredient_id
- compound_to_add_id

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| request | body | object | Yes | Modifier calculation request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateModifierCalculationRequest"
}
```

**Responses:**

- **201**: Modifier calculation created successfully
  ```json
{
  "allOf": [
    {
      "$ref": "#/definitions/model.SuccessResponse"
    },
    {
      "type": "object",
      "properties": {
        "data": {
          "$ref": "#/definitions/model.ModifierCalculationResponse"
        }
      }
    }
  ]
}
```

- **400**: Invalid request
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

- **404**: Modifier / ingredient / compound not found
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```

- **409**: Conflict
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


## /api/v1/modifiers/calculations/{id}

### GET /api/v1/modifiers/calculations/{id} 🔒

**Summary:** Get modifier calculation by ID

**Description:** Returns a single modifier calculation row.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Modifier Calculation ID |
| lang | query | string | No | Language (uz, ru, en) |

**Responses:**

- **200**: Modifier calculation retrieved successfully
  ```json
{
  "allOf": [
    {
      "$ref": "#/definitions/model.SuccessResponse"
    },
    {
      "type": "object",
      "properties": {
        "data": {
          "$ref": "#/definitions/model.ModifierCalculationResponse"
        }
      }
    }
  ]
}
```

- **400**: Invalid id
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

- **404**: Modifier calculation not found
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


### PUT /api/v1/modifiers/calculations/{id} 🔒

**Summary:** Update modifier calculation

**Description:** Update quantity for a modifier calculation row.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Modifier Calculation ID |
| lang | query | string | No | Language (uz, ru, en) |
| request | body | object | Yes | Update modifier calculation request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateModifierCalculationRequest"
}
```

**Responses:**

- **200**: Modifier calculation updated successfully
  ```json
{
  "allOf": [
    {
      "$ref": "#/definitions/model.SuccessResponse"
    },
    {
      "type": "object",
      "properties": {
        "data": {
          "$ref": "#/definitions/model.ModifierCalculationResponse"
        }
      }
    }
  ]
}
```

- **400**: Invalid request
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

- **404**: Modifier calculation not found
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


### DELETE /api/v1/modifiers/calculations/{id} 🔒

**Summary:** Delete modifier calculation

**Description:** Soft-delete a modifier calculation row.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Modifier Calculation ID |
| lang | query | string | No | Language (uz, ru, en) |

**Responses:**

- **200**: Modifier calculation deleted successfully
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
}
```

- **400**: Invalid id
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

- **404**: Modifier calculation not found
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


## /api/v1/modifiers/with-calculations

### POST /api/v1/modifiers/with-calculations 🔒

**Summary:** Create modifier with calculations

**Description:** Create a new modifier and its ingredient/compound calculations in one atomic transaction.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | Modifier + calculations |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateModifierWithCalculationsRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "allOf": [
    {
      "$ref": "#/definitions/model.SuccessResponse"
    },
    {
      "type": "object",
      "properties": {
        "data": {
          "$ref": "#/definitions/model.ModifierWithCalculationsResponse"
        }
      }
    }
  ]
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


## /api/v1/modifiers/{id}

### GET /api/v1/modifiers/{id} 🔒

**Summary:** Get modifier by ID

**Description:** Retrieve a modifier by ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Modifier ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.ModifierResponse"
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


### PUT /api/v1/modifiers/{id} 🔒

**Summary:** Update modifier

**Description:** Update a modifier by ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Modifier ID |
| request | body | object | Yes | Modifier update request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateModifierRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.ModifierResponse"
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


### DELETE /api/v1/modifiers/{id} 🔒

**Summary:** Delete modifier

**Description:** Soft delete a modifier by ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Modifier ID |

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

- **500**: Internal Server Error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/modifiers/{id}/restore

### POST /api/v1/modifiers/{id}/restore 🔒

**Summary:** Restore modifier

**Description:** Restore a soft deleted modifier by ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Modifier ID |

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

- **500**: Internal Server Error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


