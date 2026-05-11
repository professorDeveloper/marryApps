# Warehouse API

> **Module:** warehouse  
> **Base URL:** https://api.maryai.uz/  
> **Last Updated:** 2026-05-11T03:54:32.007Z

---

## Endpoints

## /api/v1/compound-details

### POST /api/v1/compound-details 🔒

**Summary:** Create compound detail

**Description:** Create a new compound detail (ingredient in a compound)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| request | body | object | Yes | Create compound detail request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateCompoundDetailRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.CompoundDetailResponse"
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


## /api/v1/compound-details/{id}

### GET /api/v1/compound-details/{id} 🔒

**Summary:** Get compound detail

**Description:** Get compound detail by ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Detail ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.CompoundDetailResponse"
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


### PUT /api/v1/compound-details/{id} 🔒

**Summary:** Update compound detail

**Description:** Update compound detail quantity

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Detail ID |
| request | body | object | Yes | Update compound detail request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateCompoundDetailRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.CompoundDetailResponse"
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


### DELETE /api/v1/compound-details/{id} 🔒

**Summary:** Delete compound detail

**Description:** Delete a compound detail (soft delete)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Detail ID |

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


## /api/v1/compound-details/{id}/restore

### POST /api/v1/compound-details/{id}/restore 🔒

**Summary:** Restore compound detail

**Description:** Restore a deleted compound detail

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Detail ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.CompoundDetailResponse"
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


## /api/v1/compound-stock

### GET /api/v1/compound-stock 🔒

**Summary:** Get all compound stock

**Description:** Get all compound stocks with pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
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


### POST /api/v1/compound-stock 🔒

**Summary:** Create compound stock

**Description:** Create a new compound stock entry for a branch

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| request | body | object | Yes | Create compound stock request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateCompoundStockRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.CompoundStockResponse"
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


## /api/v1/compound-stock/search

### GET /api/v1/compound-stock/search 🔒

**Summary:** Get compound stock by compound and branch

**Description:** Get compound stock for a specific compound in a specific branch

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| compound_id | query | string | Yes | Compound ID |
| branch_id | query | string | Yes | Branch ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.CompoundStockResponse"
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


## /api/v1/compound-stock/{id}

### GET /api/v1/compound-stock/{id} 🔒

**Summary:** Get compound stock

**Description:** Get compound stock by ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Stock ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.CompoundStockResponse"
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


### PUT /api/v1/compound-stock/{id} 🔒

**Summary:** Update compound stock

**Description:** Update compound stock quantity

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Stock ID |
| request | body | object | Yes | Update compound stock request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateCompoundStockRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.CompoundStockResponse"
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


### DELETE /api/v1/compound-stock/{id} 🔒

**Summary:** Delete compound stock

**Description:** Delete compound stock (soft delete)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Stock ID |

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


## /api/v1/compound-stock/{id}/add

### POST /api/v1/compound-stock/{id}/add 🔒

**Summary:** Add to compound stock

**Description:** Add quantity to compound stock

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Stock ID |
| request | body | object | Yes | Add to compound stock request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.AddToCompoundStockRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.CompoundStockResponse"
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


## /api/v1/compound-stock/{id}/remove

### POST /api/v1/compound-stock/{id}/remove 🔒

**Summary:** Remove from compound stock

**Description:** Remove quantity from compound stock

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Stock ID |
| request | body | object | Yes | Remove from compound stock request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.RemoveFromCompoundStockRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.CompoundStockResponse"
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


## /api/v1/compound-stock/{id}/restore

### POST /api/v1/compound-stock/{id}/restore 🔒

**Summary:** Restore compound stock

**Description:** Restore deleted compound stock

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Stock ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.CompoundStockResponse"
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


## /api/v1/compounds

### GET /api/v1/compounds 🔒

**Summary:** Get all compounds

**Description:** Retrieve all compounds with pagination, optional search, department filter and sorting

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| search | query | string | No | Search by compound name or description |
| department_id | query | string | No | Filter by department ID |
| sort_by | query | string | No | Sort by field |
| sort_order | query | string | No | Sort order |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.PaginatedCompoundsResponse"
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


### POST /api/v1/compounds 🔒

**Summary:** Create a new compound

**Description:** Create a new compound with ingredients and pricing

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | Compound creation data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateCompoundRequest"
}
```

**Responses:**

- **201**: Compound created successfully
  ```json
{
  "$ref": "#/definitions/model.CompoundResponse"
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


## /api/v1/compounds-lang

### GET /api/v1/compounds-lang 🔒

**Summary:** Get all compounds with language support

**Description:** Retrieve all compounds with names and descriptions translated to specified language, with optional search and sorting

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language code (uz, ru, en - default: uz) |
| search | query | string | No | Search by compound name or description |
| sort_by | query | string | No | Sort by field |
| sort_order | query | string | No | Sort order |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.PaginatedCompoundsResponse"
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


## /api/v1/compounds-lang/{id}

### GET /api/v1/compounds-lang/{id} 🔒

**Summary:** Get compound by ID with language support

**Description:** Retrieve a specific compound by its ID with names and descriptions translated to specified language

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Compound ID |
| lang | query | string | No | Language code (uz, ru, en - default: uz) |

**Responses:**

- **200**: Compound details
  ```json
{
  "$ref": "#/definitions/model.CompoundResponse"
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

- **404**: Compound not found
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


## /api/v1/compounds/calculations

### GET /api/v1/compounds/calculations 🔒

**Summary:** Get calculations by compound ID

**Description:** Retrieve all calculations (ingredients and child compounds) for a specific compound

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| compound_id | query | string | Yes | Compound ID |

**Responses:**

- **200**: List of calculations
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.CalculationResponse"
  }
}
```

- **400**: Bad request
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```

- **401**: Unauthorized
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```


### POST /api/v1/compounds/calculations 🔒

**Summary:** Create compound calculation

**Description:** Add ingredient or child compound to a compound and create a calculation record

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| req | body | object | Yes | Compound ID, ingredient ID or compound ID to add, and quantity |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateCompoundCalculationRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.CalculationResponse"
}
```

- **400**: Bad request
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```

- **401**: Unauthorized
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```


## /api/v1/compounds/calculations/{id}

### GET /api/v1/compounds/calculations/{id} 🔒

**Summary:** Get calculation by ID

**Description:** Retrieve a single calculation record by ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Calculation ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.CalculationResponse"
}
```

- **400**: Bad request
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```

- **401**: Unauthorized
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```

- **404**: Not found
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```


### PUT /api/v1/compounds/calculations/{id} 🔒

**Summary:** Update calculation quantity

**Description:** Update only the quantity of a calculation. Total cost is automatically recalculated as: total_cost = quantity × price_per_unit. To change ingredient/compound, delete and create a new calculation.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Calculation ID |
| req | body | object | Yes | Update request (quantity only) |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateCalculationRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.CalculationResponse"
}
```

- **400**: Bad request
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```

- **401**: Unauthorized
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```

- **404**: Not found
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```


### DELETE /api/v1/compounds/calculations/{id} 🔒

**Summary:** Delete calculation

**Description:** Delete a calculation record

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Calculation ID |

**Responses:**

- **200**: OK
  ```json
{
  "type": "object",
  "additionalProperties": true
}
```

- **400**: Bad request
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```

- **401**: Unauthorized
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```

- **404**: Not found
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```


## /api/v1/compounds/department/{departmentId}

### GET /api/v1/compounds/department/{departmentId} 🔒

**Summary:** Get compounds by department

**Description:** Retrieve all compounds for a specific department

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| departmentId | path | string | Yes | Department ID |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |

**Responses:**

- **200**: Compounds found
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.CompoundResponse"
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


## /api/v1/compounds/with-calculations

### POST /api/v1/compounds/with-calculations 🔒

**Summary:** Create compound with multiple ingredients and child compounds (One Save)

**Description:** Create a new compound with its ingredient/child compound calculations in one atomic transaction.

**How it works:**
- Create the compound first
- Then create all ingredient calculations (price from invoice_detail)
- Then create all child compound calculations (price from child compound's price)
- If any calculation fails, everything is rolled back (compound won't be created)
- Compound price is auto-calculated as sum of all calculation total_costs

**Example Request:**
```json
{
"compound": { "name": "Pizza Dough", "quantity": 1, "measurement": "kg" },
"ingredient_calculations": [
{ "ingredient_id": "flour-uuid", "quantity": "0.5" },
{ "ingredient_id": "water-uuid", "quantity": "0.3" }
],
"compound_calculations": [
{ "compound_id": "yeast-mix-uuid", "quantity": "1" }
]
}
```

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| request | body | object | Yes | Compound + ingredients + child compounds |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateCompoundWithCalculationsRequest"
}
```

**Responses:**

- **201**: Compound and all calculations created successfully
  ```json
{
  "$ref": "#/definitions/model.CompoundWithCalculationsResponse"
}
```

- **400**: Invalid request (missing fields, invalid UUIDs, etc.)
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

- **500**: Internal error (ingredient not found, no invoice, etc.)
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/compounds/{compound_id}/details

### GET /api/v1/compounds/{compound_id}/details 🔒

**Summary:** Get compound details by compound ID

**Description:** Get all compound details for a specific compound

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| compound_id | path | string | Yes | Compound ID |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.CompoundDetailResponse"
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


## /api/v1/compounds/{compound_id}/goods

### GET /api/v1/compounds/{compound_id}/goods 🔒

**Summary:** Get good details by compound ID

**Description:** Get all good details using a specific compound with pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| compound_id | path | string | Yes | Compound ID |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.GoodDetailResponse"
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


## /api/v1/compounds/{compound_id}/stock

### GET /api/v1/compounds/{compound_id}/stock 🔒

**Summary:** Get compound stock by compound

**Description:** Get all stock entries for a specific compound across all branches with pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| compound_id | path | string | Yes | Compound ID |
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


## /api/v1/compounds/{id}

### GET /api/v1/compounds/{id} 🔒

**Summary:** Get a compound by ID

**Description:** Retrieve a specific compound by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Compound ID |

**Responses:**

- **200**: Compound found
  ```json
{
  "$ref": "#/definitions/model.CompoundResponse"
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

- **404**: Compound not found
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


### PUT /api/v1/compounds/{id} 🔒

**Summary:** Update a compound

**Description:** Update an existing compound

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Compound ID |
| input | body | object | Yes | Compound update data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateCompoundRequest"
}
```

**Responses:**

- **200**: Compound updated successfully
  ```json
{
  "$ref": "#/definitions/model.CompoundResponse"
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

- **404**: Compound not found
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


### DELETE /api/v1/compounds/{id} 🔒

**Summary:** Delete a compound

**Description:** Soft delete a compound by ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Compound ID |

**Responses:**

- **204**: Compound deleted successfully
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

- **404**: Compound not found
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


## /api/v1/compounds/{id}/recalculate-price

### POST /api/v1/compounds/{id}/recalculate-price 🔒

**Summary:** Recalculate compound price

**Description:** Manually recalculate the price of a compound based on all ingredient calculations

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Compound ID |

**Responses:**

- **200**: Price recalculated successfully
  ```json
{
  "$ref": "#/definitions/model.CompoundResponse"
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

- **404**: Compound not found
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


## /api/v1/compounds/{id}/restore

### POST /api/v1/compounds/{id}/restore 🔒

**Summary:** Restore a compound

**Description:** Restore a soft-deleted compound by ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Compound ID |

**Responses:**

- **200**: Compound restored successfully
  ```json
{
  "$ref": "#/definitions/model.CompoundResponse"
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

- **404**: Compound not found
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


## /api/v1/compounds/{id}/with-calculations

### GET /api/v1/compounds/{id}/with-calculations 🔒

**Summary:** Get compound with calculations

**Description:** Retrieve a compound with all its calculations and profit information

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Compound ID |
| expand | query | string | No | Comma-separated list of fields to expand (e.g. ingredients,compounds) |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.CompoundCalculationResponse"
}
```

- **400**: Bad request
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```

- **401**: Unauthorized
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```

- **404**: Not found
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```


### PUT /api/v1/compounds/{id}/with-calculations 🔒

**Summary:** Update compound with multiple ingredients and child compounds (One Save)

**Description:** Update a compound and replace all its ingredient/child compound calculations in one atomic transaction.

**How it works:**
- Update the compound first
- Delete all existing calculations for this compound
- Create the new ingredient calculations (price from invoice_detail)
- Create the new child compound calculations (price from child compound's price)
- If any step fails, everything is rolled back
- Compound price is auto-calculated as sum of all calculation total_costs

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Compound ID |
| request | body | object | Yes | Compound update + ingredients + child compounds |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateCompoundWithCalculationsRequest"
}
```

**Responses:**

- **200**: Compound and all calculations updated successfully
  ```json
{
  "$ref": "#/definitions/model.CompoundWithCalculationsResponse"
}
```

- **400**: Invalid request (missing fields, invalid UUIDs, etc.)
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

- **500**: Internal error (ingredient not found, no invoice, etc.)
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/ingredient-groups

### GET /api/v1/ingredient-groups 🔒

**Summary:** Get all ingredient groups

**Description:** Retrieve all ingredient groups with pagination and optional search

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| limit | query | integer | No | Limit results (default: 20) |
| offset | query | integer | No | Offset for pagination (default: 0) |
| search | query | string | No | Search by name |

**Responses:**

- **200**: List of all ingredient groups
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.IngredientGroupResponse"
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


### POST /api/v1/ingredient-groups 🔒

**Summary:** Create a new ingredient group

**Description:** Create a new ingredient group with name and optional translation

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | Ingredient group creation data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateIngredientGroupRequest"
}
```

**Responses:**

- **201**: Ingredient group created successfully
  ```json
{
  "$ref": "#/definitions/model.IngredientGroupResponse"
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


## /api/v1/ingredient-groups-lang

### GET /api/v1/ingredient-groups-lang 🔒

**Summary:** Get all ingredient groups with language support

**Description:** Retrieve all ingredient groups with names translated to specified language

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language code (uz, ru, en - default: uz) |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |

**Responses:**

- **200**: Ingredient groups retrieved successfully
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.IngredientGroupResponse"
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


## /api/v1/ingredient-groups-lang/{id}

### GET /api/v1/ingredient-groups-lang/{id} 🔒

**Summary:** Get ingredient group by ID with language support

**Description:** Retrieve a specific ingredient group by its ID with names translated to specified language

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Ingredient Group ID |
| lang | query | string | No | Language code (uz, ru, en - default: uz) |

**Responses:**

- **200**: Ingredient group details
  ```json
{
  "$ref": "#/definitions/model.IngredientGroupResponse"
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

- **404**: Ingredient group not found
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


## /api/v1/ingredient-groups/{groupId}/ingredients

### GET /api/v1/ingredient-groups/{groupId}/ingredients 🔒

**Summary:** Get ingredients by group ID

**Description:** Retrieve all ingredients belonging to a specific group

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| groupId | path | string | Yes | Ingredient Group ID |
| limit | query | integer | No | Limit results (default: 20) |
| offset | query | integer | No | Offset for pagination (default: 0) |

**Responses:**

- **200**: List of ingredients in the group
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.IngredientResponse"
  }
}
```

- **400**: Invalid group ID
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


## /api/v1/ingredient-groups/{id}

### GET /api/v1/ingredient-groups/{id} 🔒

**Summary:** Get ingredient group by ID

**Description:** Retrieve a specific ingredient group by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Ingredient Group ID |

**Responses:**

- **200**: Ingredient group details
  ```json
{
  "$ref": "#/definitions/model.IngredientGroupResponse"
}
```

- **400**: Invalid group ID
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

- **404**: Ingredient group not found
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


### PUT /api/v1/ingredient-groups/{id} 🔒

**Summary:** Update ingredient group

**Description:** Update an existing ingredient group's information

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Ingredient Group ID |
| input | body | object | Yes | Ingredient group update data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateIngredientGroupRequest"
}
```

**Responses:**

- **200**: Ingredient group updated successfully
  ```json
{
  "$ref": "#/definitions/model.IngredientGroupResponse"
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

- **404**: Ingredient group not found
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


### DELETE /api/v1/ingredient-groups/{id} 🔒

**Summary:** Delete ingredient group

**Description:** Soft delete an ingredient group (mark as deleted without removing from database)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Ingredient Group ID |

**Responses:**

- **200**: Ingredient group deleted successfully
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
}
```

- **400**: Invalid group ID
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


## /api/v1/ingredient-groups/{id}/restore

### POST /api/v1/ingredient-groups/{id}/restore 🔒

**Summary:** Restore ingredient group

**Description:** Restore a previously deleted ingredient group

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Ingredient Group ID |

**Responses:**

- **200**: Ingredient group restored successfully
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
}
```

- **400**: Invalid group ID
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


## /api/v1/ingredient-reports

### GET /api/v1/ingredient-reports 🔒

**Summary:** Get ingredient report

**Description:** Retrieve ingredient report for a storage within a date range. Supports sorting by numeric fields and filtering by measurement and ingredient IDs.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| storage_id | query | string | Yes | Storage ID |
| start | query | string | No | Start datetime (RFC3339) or date (YYYY-MM-DD) |
| end | query | string | No | End datetime (RFC3339) or date (YYYY-MM-DD) |
| ingredient_id | query | string | No | Ingredient ID (optional filter) |
| measurement | query | string | No | Filter by exact measurement/unit |
| ingredient_ids | query | string | No | Comma-separated ingredient UUIDs to filter |
| sort_by | query | string | No | Sort by field |
| sort_order | query | string | No | Sort order |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: Ingredient report retrieved successfully
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.IngredientReportItem"
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


## /api/v1/ingredient-reports/inventory-status

### GET /api/v1/ingredient-reports/inventory-status 🔒

**Summary:** Get ingredient inventory status report

**Description:** Retrieve ingredient report where begin_qty is anchored at the most recent inventory count event. For each ingredient, the report finds the latest inventory_surplus_in or inventory_shortage_out event and uses its stock_after as begin_qty. Subsequent movements are summed normally. If an ingredient has no inventory event, begin_qty defaults to 0 and all movements are included.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| storage_id | query | string | Yes | Storage ID (UUID) |
| end | query | string | No | End datetime (RFC3339 or YYYY-MM-DD format). Defaults to current time |
| ingredient_id | query | string | No | Optional filter: return only this ingredient (UUID) |
| limit | query | integer | No | Pagination: items per page (default: 20) |
| offset | query | integer | No | Pagination: offset from start (default: 0) |
| expand | query | string | No | Expand related fields (comma-separated) |

**Responses:**

- **200**: Inventory status report retrieved successfully
  ```json
{
  "$ref": "#/definitions/model.IngredientReportPaginatedResponse"
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


## /api/v1/ingredient-reports/{ingredientId}

### GET /api/v1/ingredient-reports/{ingredientId} 🔒

**Summary:** Get ingredient report item

**Description:** Retrieve ingredient report for a specific ingredient within a storage and date range

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| ingredientId | path | string | Yes | Ingredient ID |
| storage_id | query | string | Yes | Storage ID |
| start | query | string | No | Start datetime (RFC3339) or date (YYYY-MM-DD) |
| end | query | string | No | End datetime (RFC3339) or date (YYYY-MM-DD) |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: Ingredient report item retrieved successfully
  ```json
{
  "$ref": "#/definitions/model.IngredientReportItem"
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

- **404**: Not found
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


## /api/v1/ingredient-reports/{ingredientId}/movements

### GET /api/v1/ingredient-reports/{ingredientId}/movements 🔒

**Summary:** Get ingredient report movements

**Description:** Retrieve ingredient stock movements for a specific ingredient within a storage and date range

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| ingredientId | path | string | Yes | Ingredient ID |
| storage_id | query | string | Yes | Storage ID |
| start | query | string | No | Start datetime (RFC3339) or date (YYYY-MM-DD) |
| end | query | string | No | End datetime (RFC3339) or date (YYYY-MM-DD) |
| limit | query | integer | No | Limit (default: 50) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: Ingredient report movements retrieved successfully
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.IngredientStockMovementResponse"
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


## /api/v1/ingredient-stock

### GET /api/v1/ingredient-stock 🔒

**Summary:** Get all ingredient stock

**Description:** Retrieve all ingredient stock records with pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| limit | query | integer | No | Limit results (default: 20) |
| offset | query | integer | No | Offset for pagination (default: 0) |
| ingredient_id | query | string | No | Filter by ingredient ID |
| ingredient_name | query | string | No | Search by ingredient name |
| search | query | string | No | Search by ingredient name |
| storage_id | query | string | No | Filter by storage ID |
| measurement | query | string | No | Filter by measurement (kg, l, piece) |
| sort_by | query | string | No | Sort by: created_at, quantity, price_per_unit |
| sort_order | query | string | No | Sort order: asc, desc |

**Responses:**

- **200**: List of all ingredient stock
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.IngredientStockResponse"
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


### POST /api/v1/ingredient-stock 🔒

**Summary:** Create ingredient stock

**Description:** Create a new stock record for an ingredient at a specific branch

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | Ingredient stock creation data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateIngredientStockRequest"
}
```

**Responses:**

- **201**: Ingredient stock created successfully
  ```json
{
  "$ref": "#/definitions/model.IngredientStockResponse"
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


## /api/v1/ingredient-stock/branch/{branchId}

### GET /api/v1/ingredient-stock/branch/{branchId} 🔒

**Summary:** Get stock by branch ID

**Description:** Retrieve all ingredient stock for a specific branch

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| branchId | path | string | Yes | Branch ID |
| limit | query | integer | No | Limit results (default: 20) |
| offset | query | integer | No | Offset for pagination (default: 0) |
| expand | query | string | No | Expand FK relations (comma-separated: ingredient_id, storage_id, branch_id) |

**Responses:**

- **200**: List of ingredient stock for the branch
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.IngredientStockResponse"
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


## /api/v1/ingredient-stock/by-ingredient-branch

### GET /api/v1/ingredient-stock/by-ingredient-branch 🔒

**Summary:** Get stock by ingredient and branch

**Description:** Retrieve stock information for a specific ingredient at a specific branch

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| ingredient_id | query | string | Yes | Ingredient ID |
| branch_id | query | string | Yes | Branch ID |

**Responses:**

- **200**: Ingredient stock details
  ```json
{
  "$ref": "#/definitions/model.IngredientStockResponse"
}
```

- **400**: Invalid parameters
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

- **404**: Ingredient stock not found
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


## /api/v1/ingredient-stock/ingredient/{ingredientId}

### GET /api/v1/ingredient-stock/ingredient/{ingredientId} 🔒

**Summary:** Get stock by ingredient ID

**Description:** Retrieve stock for a specific ingredient across all branches

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| ingredientId | path | string | Yes | Ingredient ID |
| limit | query | integer | No | Limit results (default: 20) |
| offset | query | integer | No | Offset for pagination (default: 0) |
| expand | query | string | No | Expand FK relations (comma-separated: ingredient_id, storage_id, branch_id) |

**Responses:**

- **200**: List of stock for the ingredient
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.IngredientStockResponse"
  }
}
```

- **400**: Invalid ingredient ID
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


## /api/v1/ingredient-stock/{id}

### GET /api/v1/ingredient-stock/{id} 🔒

**Summary:** Get ingredient stock by ID

**Description:** Retrieve a specific ingredient stock record by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Ingredient Stock ID |
| expand | query | string | No | Expand FK relations (comma-separated: ingredient_id, storage_id, branch_id) |

**Responses:**

- **200**: Ingredient stock details
  ```json
{
  "$ref": "#/definitions/model.IngredientStockResponse"
}
```

- **400**: Invalid stock ID
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

- **404**: Ingredient stock not found
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


### PUT /api/v1/ingredient-stock/{id} 🔒

**Summary:** Update ingredient stock

**Description:** Update the quantity of an ingredient stock record

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Ingredient Stock ID |
| input | body | object | Yes | Stock update data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateIngredientStockRequest"
}
```

**Responses:**

- **200**: Ingredient stock updated successfully
  ```json
{
  "$ref": "#/definitions/model.IngredientStockResponse"
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

- **404**: Ingredient stock not found
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


### DELETE /api/v1/ingredient-stock/{id} 🔒

**Summary:** Delete ingredient stock

**Description:** Soft delete an ingredient stock record (mark as deleted without removing from database)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Ingredient Stock ID |

**Responses:**

- **200**: Ingredient stock deleted successfully
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
}
```

- **400**: Invalid stock ID
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


## /api/v1/ingredient-stock/{id}/add

### POST /api/v1/ingredient-stock/{id}/add 🔒

**Summary:** Add to ingredient stock

**Description:** Add a specified quantity to an existing ingredient stock

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Ingredient Stock ID |
| input | body | object | Yes | Quantity to add |

**Request Body:**

```json
{
  "$ref": "#/definitions/handler.stockAdjustRequest"
}
```

**Responses:**

- **200**: Quantity added successfully
  ```json
{
  "$ref": "#/definitions/model.IngredientStockResponse"
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


## /api/v1/ingredient-stock/{id}/remove

### POST /api/v1/ingredient-stock/{id}/remove 🔒

**Summary:** Remove from ingredient stock

**Description:** Remove a specified quantity from an existing ingredient stock

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Ingredient Stock ID |
| input | body | object | Yes | Quantity to remove |

**Request Body:**

```json
{
  "$ref": "#/definitions/handler.stockAdjustRequest"
}
```

**Responses:**

- **200**: Quantity removed successfully
  ```json
{
  "$ref": "#/definitions/model.IngredientStockResponse"
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


## /api/v1/ingredient-stock/{id}/restore

### POST /api/v1/ingredient-stock/{id}/restore 🔒

**Summary:** Restore ingredient stock

**Description:** Restore a previously deleted ingredient stock record

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Ingredient Stock ID |

**Responses:**

- **200**: Ingredient stock restored successfully
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
}
```

- **400**: Invalid stock ID
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


## /api/v1/ingredients

### GET /api/v1/ingredients 🔒

**Summary:** Get all ingredients

**Description:** Retrieve all ingredients with pagination and optional search

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| limit | query | integer | No | Limit results (default: 20) |
| offset | query | integer | No | Offset for pagination (default: 0) |
| search | query | string | No | Search by name |
| expand | query | string | No | Expand FK relations (comma-separated: group_id, name_i18n) |

**Responses:**

- **200**: List of all ingredients
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.IngredientResponse"
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


### POST /api/v1/ingredients 🔒

**Summary:** Create a new ingredient

**Description:** Create a new ingredient with name, group, measurement, and optional fields

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | Ingredient creation data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateIngredientRequest"
}
```

**Responses:**

- **201**: Ingredient created successfully
  ```json
{
  "$ref": "#/definitions/model.IngredientResponse"
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


## /api/v1/ingredients-lang

### GET /api/v1/ingredients-lang 🔒

**Summary:** Get all ingredients with language support

**Description:** Retrieve all ingredients with names translated to specified language

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language code (uz, ru, en - default: uz) |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Expand FK relations (comma-separated: group_id, name_i18n) |

**Responses:**

- **200**: Ingredients retrieved successfully
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.IngredientResponse"
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


## /api/v1/ingredients-lang/{id}

### GET /api/v1/ingredients-lang/{id} 🔒

**Summary:** Get ingredient by ID with language support

**Description:** Retrieve a specific ingredient by its ID with names translated to specified language

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Ingredient ID |
| lang | query | string | No | Language code (uz, ru, en - default: uz) |
| expand | query | string | No | Expand FK relations (comma-separated: group_id, name_i18n) |

**Responses:**

- **200**: Ingredient details
  ```json
{
  "$ref": "#/definitions/model.IngredientResponse"
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

- **404**: Ingredient not found
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


## /api/v1/ingredients/{id}

### GET /api/v1/ingredients/{id} 🔒

**Summary:** Get ingredient by ID

**Description:** Retrieve a specific ingredient by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Ingredient ID |
| expand | query | string | No | Expand FK relations (comma-separated: group_id, name_i18n) |

**Responses:**

- **200**: Ingredient details
  ```json
{
  "$ref": "#/definitions/model.IngredientResponse"
}
```

- **400**: Invalid ingredient ID
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

- **404**: Ingredient not found
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


### PUT /api/v1/ingredients/{id} 🔒

**Summary:** Update ingredient

**Description:** Update an existing ingredient's information

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Ingredient ID |
| input | body | object | Yes | Ingredient update data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateIngredientRequest"
}
```

**Responses:**

- **200**: Ingredient updated successfully
  ```json
{
  "$ref": "#/definitions/model.IngredientResponse"
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

- **404**: Ingredient not found
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


### DELETE /api/v1/ingredients/{id} 🔒

**Summary:** Delete ingredient

**Description:** Soft delete an ingredient (mark as deleted without removing from database)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Ingredient ID |

**Responses:**

- **200**: Ingredient deleted successfully
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
}
```

- **400**: Invalid ingredient ID
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


## /api/v1/ingredients/{id}/restore

### POST /api/v1/ingredients/{id}/restore 🔒

**Summary:** Restore ingredient

**Description:** Restore a previously deleted ingredient

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Ingredient ID |

**Responses:**

- **200**: Ingredient restored successfully
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
}
```

- **400**: Invalid ingredient ID
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


## /api/v1/ingredients/{ingredient_id}/compounds

### GET /api/v1/ingredients/{ingredient_id}/compounds 🔒

**Summary:** Get compound details by ingredient ID

**Description:** Get all compound details using a specific ingredient with pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| ingredient_id | path | string | Yes | Ingredient ID |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.CompoundDetailResponse"
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


## /api/v1/ingredients/{ingredient_id}/goods

### GET /api/v1/ingredients/{ingredient_id}/goods 🔒

**Summary:** Get good details by ingredient ID

**Description:** Get all good details using a specific ingredient with pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| ingredient_id | path | string | Yes | Ingredient ID |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.GoodDetailResponse"
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


## /api/v1/invoice-details/ingredient/{ingredient_id}

### GET /api/v1/invoice-details/ingredient/{ingredient_id} 🔒

**Summary:** Get invoice details by ingredient ID

**Description:** Get all invoice details containing a specific ingredient with pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| ingredient_id | path | string | Yes | Ingredient ID |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.InvoiceDetailResponse"
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


## /api/v1/transfers

### GET /api/v1/transfers 🔒

**Summary:** Get all transfers

**Description:** Get transfers visible to the current branch, with optional filters

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Pass 'items' to include transfer items in each result |
| date_from | query | string | No | Filter from date (YYYY-MM-DD) |
| date_to | query | string | No | Filter to date (YYYY-MM-DD) |
| status | query | string | No | Filter by status (draft/active/deleted) |
| from_branch_id | query | string | No | Filter by sender branch ID |
| to_branch_id | query | string | No | Filter by receiver branch ID |
| from_storage_id | query | string | No | Filter by sender storage ID |
| to_storage_id | query | string | No | Filter by receiver storage ID |
| act_group_id | query | string | No | Filter by act group ID |
| ingredient_id | query | string | No | Filter by ingredient ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.PaginatedTransfersResponse"
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


### POST /api/v1/transfers 🔒

**Summary:** Create transfer (header only)

**Description:** Create a transfer without items. Items can be added later.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | Transfer request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateTransferRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.TransferResponse"
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


## /api/v1/transfers/batch

### POST /api/v1/transfers/batch 🔒

**Summary:** Create transfer with items (batch)

**Description:** Create a transfer and its items in one call. Stock is moved immediately.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | Transfer batch request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateTransferBatchRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.TransferResponse"
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


### DELETE /api/v1/transfers/batch 🔒

**Summary:** Batch delete transfers

**Description:** Soft delete multiple transfers and reverse all their stock changes

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | Transfer IDs to delete |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.DeleteTransfersBatchRequest"
}
```

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


## /api/v1/transfers/items

### POST /api/v1/transfers/items 🔒

**Summary:** Add items to transfer

**Description:** Add items to an existing active transfer. Stock is moved immediately.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | Transfer items request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateTransferItemsRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.TransferResponse"
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


## /api/v1/transfers/items/{id}

### DELETE /api/v1/transfers/items/{id} 🔒

**Summary:** Delete transfer item

**Description:** Delete a single transfer item and reverse its stock change

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Transfer Item ID |

**Responses:**

- **204**: Transfer item deleted successfully
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


## /api/v1/transfers/{id}

### GET /api/v1/transfers/{id} 🔒

**Summary:** Get transfer by ID

**Description:** Get a transfer with all its items

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Transfer ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.TransferResponse"
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

- **404**: Not Found
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


### DELETE /api/v1/transfers/{id} 🔒

**Summary:** Delete transfer

**Description:** Soft delete a transfer and reverse all stock changes

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Transfer ID |

**Responses:**

- **204**: Transfer deleted successfully
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


## /api/v1/transfers/{id}/items/batch

### PUT /api/v1/transfers/{id}/items/batch 🔒

**Summary:** Batch update transfer items

**Description:** Replaces all transfer items. Old stock changes are reversed, then new quantities are applied.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Transfer ID |
| input | body | object | Yes | New transfer items |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpsertTransferItemsRequest"
}
```

**Responses:**

- **200**: Updated transfer with new items
  ```json
{
  "$ref": "#/definitions/model.TransferResponse"
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


