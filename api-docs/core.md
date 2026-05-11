# Core API

> **Module:** core  
> **Base URL:** https://api.maryai.uz/  
> **Last Updated:** 2026-05-11T03:54:32.004Z

---

## Endpoints

## /api/v1/calculations/preview

### POST /api/v1/calculations/preview 🔒

**Summary:** Preview calculations (no DB writes)

**Description:** Calculate ingredient + compound costs for UI preview. Does not create any DB records.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | Preview calculations request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.PreviewCalculationsRequest"
}
```

**Responses:**

- **200**: Preview generated successfully
  ```json
{
  "$ref": "#/definitions/model.PreviewCalculationsResponse"
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

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/dashboard/overview

### GET /api/v1/dashboard/overview 🔒

**Summary:** Get dashboard overview

**Description:** Returns aggregated dashboard data including KPIs, sales dynamics, revenue by payment types, revenue by categories, and dish sales

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| start | query | string | Yes | Start date (RFC3339 format) |
| end | query | string | Yes | End date (RFC3339 format) |
| group_by | query | string | No | Group by (day, week, month) |
| dish_metric | query | string | No | Dish metric (revenue, quantity) |
| dish_sort | query | string | No | Dish sort (asc, desc) |
| limit | query | integer | No | Limit for dish sales |
| lang | query | string | No | Language (uz, ru, en) |

**Responses:**

- **200**: OK
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
          "$ref": "#/definitions/model.DashboardOverviewResponse"
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


## /api/v1/deductions

### GET /api/v1/deductions 🔒

**Summary:** Get deductions

**Description:** Retrieve deductions with filters and pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| limit | query | integer | No | Limit results (default: 20) |
| offset | query | integer | No | Offset for pagination (default: 0) |
| date_from | query | string | No | Filter from date (YYYY-MM-DD) |
| date_to | query | string | No | Filter to date (YYYY-MM-DD) |
| status | query | string | No | Filter by status (draft, active) |
| storage_id | query | string | No | Filter by storage UUID |
| act_group_id | query | string | No | Filter by act group UUID |
| ingredient_id | query | string | No | Filter by ingredient UUID (matches deduction items) |
| expand | query | string | No | Comma-separated relations to expand (e.g. storage_id) |

**Responses:**

- **200**: Deductions
  ```json
{
  "$ref": "#/definitions/model.PaginatedDeductionsResponse"
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


### POST /api/v1/deductions 🔒

**Summary:** Create deduction

**Description:** Create a new deduction with items, expand into ingredient usage, subtract from stock and compute balance

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | Deduction create data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateDeductionRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.DeductionResponse"
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

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/deductions/batch

### DELETE /api/v1/deductions/batch 🔒

**Summary:** Batch delete deductions

**Description:** Soft-delete multiple deductions; if active, stock is reversed for each

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | IDs to delete |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.DeleteDeductionsBatchRequest"
}
```

**Responses:**

- **200**: Deleted
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
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

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/deductions/group

### GET /api/v1/deductions/group 🔒

**Summary:** Get deduction act groups

**Description:** Retrieve deduction act groups with pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| limit | query | integer | No | Limit results (default: 20) |
| offset | query | integer | No | Offset for pagination (default: 0) |

**Responses:**

- **200**: Deduction act groups
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.DeductionActGroupResponse"
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


### POST /api/v1/deductions/group 🔒

**Summary:** Create deduction act group

**Description:** Create a new deduction act group

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | Deduction act group data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateDeductionActGroupRequest"
}
```

**Responses:**

- **201**: Deduction act group created
  ```json
{
  "$ref": "#/definitions/model.DeductionActGroupResponse"
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

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/deductions/group/{id}

### GET /api/v1/deductions/group/{id} 🔒

**Summary:** Get deduction act group by ID

**Description:** Retrieve a specific deduction act group by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Deduction Act Group ID |

**Responses:**

- **200**: Deduction act group details
  ```json
{
  "$ref": "#/definitions/model.DeductionActGroupResponse"
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


### PUT /api/v1/deductions/group/{id} 🔒

**Summary:** Update deduction act group

**Description:** Update an existing deduction act group's information

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Deduction Act Group ID |
| input | body | object | Yes | Deduction act group update data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateDeductionActGroupRequest"
}
```

**Responses:**

- **200**: Updated
  ```json
{
  "$ref": "#/definitions/model.DeductionActGroupResponse"
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


### DELETE /api/v1/deductions/group/{id} 🔒

**Summary:** Delete deduction act group

**Description:** Soft delete a deduction act group

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Deduction Act Group ID |

**Responses:**

- **200**: Deleted
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
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

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/deductions/group/{id}/restore

### POST /api/v1/deductions/group/{id}/restore 🔒

**Summary:** Restore deduction act group

**Description:** Restore a previously deleted deduction act group

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Deduction Act Group ID |

**Responses:**

- **200**: Restored
  ```json
{
  "$ref": "#/definitions/model.DeductionActGroupResponse"
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

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/deductions/{id}

### GET /api/v1/deductions/{id} 🔒

**Summary:** Get deduction by ID

**Description:** Retrieve a deduction with items and ingredient breakdown

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Deduction ID |
| expand | query | string | No | Comma-separated relations to expand (e.g. storage_id) |

**Responses:**

- **200**: Deduction
  ```json
{
  "$ref": "#/definitions/model.DeductionResponse"
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


### PUT /api/v1/deductions/{id} 🔒

**Summary:** Update deduction

**Description:** Update deduction fields (date, group, storage, descriptions, status). Items are not changed.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Deduction ID |
| input | body | object | Yes | Deduction update data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateDeductionRequest"
}
```

**Responses:**

- **200**: Updated
  ```json
{
  "$ref": "#/definitions/model.DeductionResponse"
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


### DELETE /api/v1/deductions/{id} 🔒

**Summary:** Delete deduction

**Description:** Soft delete a deduction

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Deduction ID |

**Responses:**

- **200**: Deleted
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
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

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/deductions/{id}/items/batch

### PUT /api/v1/deductions/{id}/items/batch 🔒

**Summary:** Batch update deduction items

**Description:** Full replace of deduction items. Optionally update deduction fields (date, status, storage_id, etc.) in the same call. Stock adjusted on status transition.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Deduction ID |
| input | body | object | Yes | Deduction items (required) + optional deduction fields |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpsertDeductionItemsRequest"
}
```

**Responses:**

- **200**: Updated deduction with new items
  ```json
{
  "$ref": "#/definitions/model.DeductionResponse"
}
```

- **400**: Invalid request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```

- **404**: Deduction not found
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


### DELETE /api/v1/deductions/{id}/items/batch 🔒

**Summary:** Batch delete deduction items

**Description:** Remove multiple items from a deduction; if active, stock is reversed for each

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Deduction ID |
| input | body | object | Yes | Item IDs to delete |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.DeleteDeductionItemsBatchRequest"
}
```

**Responses:**

- **200**: Updated deduction
  ```json
{
  "$ref": "#/definitions/model.DeductionResponse"
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

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/deductions/{id}/items/{itemId}

### DELETE /api/v1/deductions/{id}/items/{itemId} 🔒

**Summary:** Delete deduction item

**Description:** Removes a single item from a deduction and adds its deducted quantities back to stock

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Deduction ID |
| itemId | path | string | Yes | Deduction Item ID |

**Responses:**

- **200**: Updated deduction
  ```json
{
  "$ref": "#/definitions/model.DeductionResponse"
}
```

- **400**: Invalid request
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


## /api/v1/deductions/{id}/restore

### POST /api/v1/deductions/{id}/restore 🔒

**Summary:** Restore deduction

**Description:** Restore a previously deleted deduction

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Deduction ID |

**Responses:**

- **200**: Restored
  ```json
{
  "$ref": "#/definitions/model.DeductionResponse"
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

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/departments

### GET /api/v1/departments 🔒

**Summary:** Get all departments

**Description:** Retrieve all departments with pagination, optional search, storage filter and sorting

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| search | query | string | No | Search by department name |
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
  "$ref": "#/definitions/model.PaginatedDepartmentsResponse"
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


### POST /api/v1/departments 🔒

**Summary:** Create a new department

**Description:** Create a new department with name, optional translation ID, and storage ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | Department creation data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateDepartmentRequest"
}
```

**Responses:**

- **201**: Department created successfully
  ```json
{
  "$ref": "#/definitions/model.DepartmentResponse"
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


## /api/v1/departments-lang

### GET /api/v1/departments-lang 🔒

**Summary:** Get all departments with language support

**Description:** Retrieve all departments with names translated to specified language

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language code (uz, ru, en - default: uz) |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Expand FK relations (comma-separated: storage_id, name_i18n) |

**Responses:**

- **200**: Departments retrieved successfully
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.DepartmentResponse"
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


## /api/v1/departments-lang/{id}

### GET /api/v1/departments-lang/{id} 🔒

**Summary:** Get department by ID with language support

**Description:** Retrieve a specific department by its ID with names translated to specified language

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Department ID |
| lang | query | string | No | Language code (uz, ru, en - default: uz) |
| expand | query | string | No | Expand FK relations (comma-separated: storage_id, name_i18n) |

**Responses:**

- **200**: Department details
  ```json
{
  "$ref": "#/definitions/model.DepartmentResponse"
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

- **404**: Department not found
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


## /api/v1/departments/storage/{storageId}

### GET /api/v1/departments/storage/{storageId} 🔒

**Summary:** Get departments by storage ID

**Description:** Retrieve all departments for a specific storage

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| storageId | path | string | Yes | Storage ID |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Expand FK relations (comma-separated: storage_id, name_i18n) |

**Responses:**

- **200**: Departments found
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.DepartmentResponse"
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


## /api/v1/departments/{department_id}/goods

### GET /api/v1/departments/{department_id}/goods 🔒

**Summary:** Get goods by department

**Description:** Get goods by department with pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| department_id | path | string | Yes | Department ID |
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


## /api/v1/departments/{id}

### GET /api/v1/departments/{id} 🔒

**Summary:** Get a department by ID

**Description:** Retrieve a specific department by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Department ID |
| expand | query | string | No | Expand FK relations (comma-separated: storage_id, name_i18n) |

**Responses:**

- **200**: Department found
  ```json
{
  "$ref": "#/definitions/model.DepartmentResponse"
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

- **404**: Department not found
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


### PUT /api/v1/departments/{id} 🔒

**Summary:** Update a department

**Description:** Update an existing department

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Department ID |
| input | body | object | Yes | Department update data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateDepartmentRequest"
}
```

**Responses:**

- **200**: Department updated successfully
  ```json
{
  "$ref": "#/definitions/model.DepartmentResponse"
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

- **404**: Department not found
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


### DELETE /api/v1/departments/{id} 🔒

**Summary:** Delete a department

**Description:** Soft delete a department by ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Department ID |

**Responses:**

- **204**: Department deleted successfully
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

- **404**: Department not found
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


## /api/v1/departments/{id}/restore

### POST /api/v1/departments/{id}/restore 🔒

**Summary:** Restore a department

**Description:** Restore a soft-deleted department by ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Department ID |

**Responses:**

- **200**: Department restored successfully
  ```json
{
  "$ref": "#/definitions/model.DepartmentResponse"
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

- **404**: Department not found
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


## /api/v1/good-details

### POST /api/v1/good-details 🔒

**Summary:** Create good detail

**Description:** Create a new good detail (ingredient or compound in a good)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| request | body | object | Yes | Create good detail request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateGoodDetailRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.GoodDetailResponse"
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


## /api/v1/good-details/{id}

### GET /api/v1/good-details/{id} 🔒

**Summary:** Get good detail

**Description:** Get good detail by ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Detail ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.GoodDetailResponse"
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


### PUT /api/v1/good-details/{id} 🔒

**Summary:** Update good detail

**Description:** Update good detail

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Detail ID |
| request | body | object | Yes | Update good detail request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateGoodDetailRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.GoodDetailResponse"
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


### DELETE /api/v1/good-details/{id} 🔒

**Summary:** Delete good detail

**Description:** Delete a good detail (soft delete)

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


## /api/v1/good-details/{id}/quantity

### PUT /api/v1/good-details/{id}/quantity 🔒

**Summary:** Update good detail quantity

**Description:** Update good detail quantity

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Detail ID |
| request | body | object | Yes | Update quantity request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateGoodDetailQuantityRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.GoodDetailResponse"
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


## /api/v1/good-details/{id}/restore

### POST /api/v1/good-details/{id}/restore 🔒

**Summary:** Restore good detail

**Description:** Restore a deleted good detail

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Detail ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.GoodDetailResponse"
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


## /api/v1/goods

### GET /api/v1/goods 🔒

**Summary:** Get all goods

**Description:** Get all goods with pagination, search, filters and sorting

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |
| expand | query | string | No | Expand related fields |
| category_id | query | string | No | Filter by category ID |
| department_id | query | string | No | Filter by department ID |
| storage_id | query | string | No | Filter by storage ID |
| search | query | string | No | Search by name or description |
| min_price | query | string | No | Minimum price |
| max_price | query | string | No | Maximum price |
| sort_by | query | string | No | Sort by field |
| sort_order | query | string | No | Sort order |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.PaginatedGoodsResponse"
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


### POST /api/v1/goods 🔒

**Summary:** Create good

**Description:** Create a new good/menu item

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| request | body | object | Yes | Create good request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateGoodRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.GoodResponse"
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


## /api/v1/goods-lang

### GET /api/v1/goods-lang 🔒

**Summary:** Get all goods with language support

**Description:** Retrieve all goods/menu items with names and descriptions translated to specified language, including search, filters and sorting

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language code (uz, ru, en - default: uz) |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Expand related fields |
| category_id | query | string | No | Filter by category ID |
| department_id | query | string | No | Filter by department ID |
| storage_id | query | string | No | Filter by storage ID |
| search | query | string | No | Search by name or description |
| min_price | query | string | No | Minimum price |
| max_price | query | string | No | Maximum price |
| sort_by | query | string | No | Sort by field |
| sort_order | query | string | No | Sort order |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.PaginatedGoodsResponse"
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


## /api/v1/goods-lang/{id}

### GET /api/v1/goods-lang/{id} 🔒

**Summary:** Get good by ID with language support

**Description:** Retrieve a specific good/menu item by its ID with names and descriptions translated to specified language

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Good ID |
| lang | query | string | No | Language code (uz, ru, en - default: uz) |

**Responses:**

- **200**: Good details
  ```json
{
  "$ref": "#/definitions/model.GoodResponse"
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

- **404**: Good not found
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


## /api/v1/goods/calculations

### GET /api/v1/goods/calculations 🔒

**Summary:** Get calculations by good ID

**Description:** Retrieve all calculations (ingredients and compounds) for a specific good

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| good_id | query | string | Yes | Good ID |

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


### POST /api/v1/goods/calculations 🔒

**Summary:** Create good calculation

**Description:** Add ingredient or compound to a good and create a calculation record

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| req | body | object | Yes | Good ID, ingredient ID or compound ID to add, and quantity |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateGoodCalculationRequest"
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


## /api/v1/goods/calculations/{id}

### GET /api/v1/goods/calculations/{id} 🔒

**Summary:** Get calculation by ID

**Description:** Retrieve a single calculation record by ID. Used by both /goods/calculations/{id} and /compounds/calculations/{id}

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


### PUT /api/v1/goods/calculations/{id} 🔒

**Summary:** Update calculation quantity (auto-recalculates total_cost)

**Description:** Update only the quantity of a calculation. Total cost is automatically recalculated as: total_cost = quantity × price_per_unit. To change ingredient/compound, delete and create a new calculation. Used by both /goods/calculations/{id} and /compounds/calculations/{id}

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


### DELETE /api/v1/goods/calculations/{id} 🔒

**Summary:** Delete calculation

**Description:** Delete a calculation record. Used by both /goods/calculations/{id} and /compounds/calculations/{id}

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


## /api/v1/goods/with-calculations

### POST /api/v1/goods/with-calculations 🔒

**Summary:** Create good with multiple ingredients and compounds (One Save)

**Description:** Create a new good/menu item with its ingredient/compound calculations in one atomic transaction.

**How it works:**
- Create the good first
- Then create all ingredient calculations (price from invoice_detail)
- Then create all compound calculations (price from compound.price)
- If any calculation fails, everything is rolled back (good won't be created)

**Example Request:**
```json
{
"good": { "name": "Osh", "price": "85000.00" },
"ingredient_calculations": [
{ "ingredient_id": "sabzi-uuid", "quantity": "2.5" },
{ "ingredient_id": "guruch-uuid", "quantity": "0.5" }
],
"compound_calculations": [
{ "compound_id": "salad-uuid", "quantity": "3" },
{ "compound_id": "xamir-uuid", "quantity": "1" }
],
"modifiers": [
{ "modifier_id": "modifier-uuid-1", "is_required": false, "sort_order": 1 },
{ "modifier_id": "modifier-uuid-2", "is_required": true, "sort_order": 2 }
]
}
```

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| request | body | object | Yes | Good + ingredient calculations + compound calculations + modifiers |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateGoodWithCalculationsRequest"
}
```

**Responses:**

- **201**: Good, calculations, and modifiers created successfully
  ```json
{
  "$ref": "#/definitions/model.GoodWithCalculationsResponse"
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

- **500**: Internal error (ingredient not found, no invoice for ingredient, etc.)
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/goods/{good_id}/details

### GET /api/v1/goods/{good_id}/details 🔒

**Summary:** Get good details by good ID

**Description:** Get all good details for a specific good

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| good_id | path | string | Yes | Good ID |

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


## /api/v1/goods/{id}

### GET /api/v1/goods/{id} 🔒

**Summary:** Get good

**Description:** Get good by ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Good ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.GoodResponse"
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


### PUT /api/v1/goods/{id} 🔒

**Summary:** Update good

**Description:** Update good details

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Good ID |
| request | body | object | Yes | Update good request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateGoodRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.GoodResponse"
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


### DELETE /api/v1/goods/{id} 🔒

**Summary:** Delete good

**Description:** Delete a good (soft delete)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Good ID |

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


## /api/v1/goods/{id}/price

### PUT /api/v1/goods/{id}/price 🔒

**Summary:** Update good price

**Description:** Update good price

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Good ID |
| request | body | object | Yes | Update good price request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateGoodPriceRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.GoodResponse"
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


## /api/v1/goods/{id}/restore

### POST /api/v1/goods/{id}/restore 🔒

**Summary:** Restore good

**Description:** Restore a deleted good

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Good ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.GoodResponse"
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


## /api/v1/goods/{id}/with-calculations

### GET /api/v1/goods/{id}/with-calculations 🔒

**Summary:** Get good with calculations

**Description:** Retrieve a good with all its ingredient calculations and profit information

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Good ID |
| expand | query | string | No | Comma-separated list of fields to expand (e.g. ingredients,compounds) |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.GoodCalculationResponse"
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


### PUT /api/v1/goods/{id}/with-calculations 🔓

**Summary:** Update good with calculations and modifiers (One Save)

**Description:** Update a good/menu item and replace all its ingredient calculations, compound calculations, and modifiers in one atomic transaction.

**How it works:**
- Update the good first
- Delete all existing calculations for this good
- Create the new ingredient calculations (price from invoice_detail)
- Create the new compound calculations (price from compound.price)
- Replace all good modifiers
- If any step fails, everything is rolled back

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | Good update + ingredient calculations + compound calculations + modifiers |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateGoodWithCalculationsRequest"
}
```

**Responses:**

- **200**: Good and all calculations updated successfully
  ```json
{
  "$ref": "#/definitions/model.GoodWithCalculationsResponse"
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

- **500**: Internal error (ingredient not found, no invoice for ingredient, etc.)
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/group-transactions

### GET /api/v1/group-transactions 🔒

**Summary:** Get all group transactions

**Description:** Retrieve all group transactions with pagination, optional search and sorting

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| search | query | string | No | Search by group transaction name |
| sort_by | query | string | No | Sort by field |
| sort_order | query | string | No | Sort order |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.PaginatedGroupTransactionsResponse"
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


### POST /api/v1/group-transactions 🔒

**Summary:** Create group transaction

**Description:** Create a new group transaction

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | Create group transaction request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateGroupTransactionRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.GroupTransactionResponse"
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


## /api/v1/group-transactions/{id}

### GET /api/v1/group-transactions/{id} 🔒

**Summary:** Get group transaction by ID

**Description:** Retrieve a group transaction by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Group Transaction ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.GroupTransactionResponse"
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


### PUT /api/v1/group-transactions/{id} 🔒

**Summary:** Update group transaction

**Description:** Update a group transaction by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Group Transaction ID |
| request | body | object | Yes | Update group transaction request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateGroupTransactionRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.GroupTransactionResponse"
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


### DELETE /api/v1/group-transactions/{id} 🔒

**Summary:** Delete group transaction

**Description:** Soft delete a group transaction by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Group Transaction ID |

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


## /api/v1/group-transactions/{id}/restore

### POST /api/v1/group-transactions/{id}/restore 🔒

**Summary:** Restore group transaction

**Description:** Restore a previously deleted group transaction

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Group Transaction ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.GroupTransactionResponse"
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


## /api/v1/halls

### GET /api/v1/halls 🔒

**Summary:** Get all halls

**Description:** Retrieve all halls with pagination, optional search and sorting

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| search | query | string | No | Search by hall name |
| sort_by | query | string | No | Sort by field |
| sort_order | query | string | No | Sort order |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.PaginatedHallsResponse"
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


### POST /api/v1/halls 🔒

**Summary:** Create a new hall

**Description:** Create a new hall with name, branch ID, and optional translation ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | Hall creation data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateHallRequest"
}
```

**Responses:**

- **201**: Hall created successfully
  ```json
{
  "$ref": "#/definitions/model.HallResponse"
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


## /api/v1/halls-lang

### GET /api/v1/halls-lang 🔒

**Summary:** Get all halls with language support

**Description:** Retrieve all halls with names translated to specified language, with optional search and sorting

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language code (uz, ru, en - default: uz) |
| search | query | string | No | Search by hall name |
| sort_by | query | string | No | Sort by field |
| sort_order | query | string | No | Sort order |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.PaginatedHallsResponse"
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


## /api/v1/halls-lang/branch/{branchId}

### GET /api/v1/halls-lang/branch/{branchId} 🔒

**Summary:** Get halls by branch ID with language support

**Description:** Retrieve all halls for a specific branch with names translated to specified language

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| branchId | path | string | Yes | Branch ID |
| lang | query | string | No | Language code (uz, ru, en - default: uz) |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: Halls retrieved successfully
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.HallResponse"
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


## /api/v1/halls/branch/{branchId}

### GET /api/v1/halls/branch/{branchId} 🔒

**Summary:** Get all halls with branch  ID -  language support

**Description:** Retrieve all halls with names translated to specified language (uz, ru, en)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language code (uz, ru, en - default: uz) |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Expand related fields |

**Responses:**

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


## /api/v1/halls/{id}

### GET /api/v1/halls/{id} 🔒

**Summary:** Get a hall by ID

**Description:** Retrieve a specific hall by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Hall ID |

**Responses:**

- **200**: Hall found
  ```json
{
  "$ref": "#/definitions/model.HallResponse"
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

- **404**: Hall not found
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


### PUT /api/v1/halls/{id} 🔒

**Summary:** Update a hall

**Description:** Update an existing hall

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Hall ID |
| input | body | object | Yes | Hall update data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateHallRequest"
}
```

**Responses:**

- **200**: Hall updated successfully
  ```json
{
  "$ref": "#/definitions/model.HallResponse"
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

- **404**: Hall not found
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


### DELETE /api/v1/halls/{id} 🔒

**Summary:** Delete a hall

**Description:** Soft delete a hall by ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Hall ID |

**Responses:**

- **204**: Hall deleted successfully
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

- **404**: Hall not found
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


## /api/v1/halls/{id}/restore

### POST /api/v1/halls/{id}/restore 🔒

**Summary:** Restore a hall

**Description:** Restore a soft-deleted hall by ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Hall ID |

**Responses:**

- **200**: Hall restored successfully
  ```json
{
  "$ref": "#/definitions/model.HallResponse"
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

- **404**: Hall not found
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


## /api/v1/inventories

### GET /api/v1/inventories 🔒

**Summary:** Get inventories

**Description:** Retrieve inventories with pagination, filters, search and sorting

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| date_from | query | string | No | Start date (YYYY-MM-DD) |
| date_to | query | string | No | End date (YYYY-MM-DD) |
| storage_id | query | string | No | Storage ID |
| ingredient_id | query | string | No | Ingredient ID |
| status | query | string | No | Inventory status (draft, active, deleted) |
| search | query | string | No | Search by description or number |
| sort_by | query | string | No | Sort by field |
| sort_order | query | string | No | Sort order |
| limit | query | integer | No | Limit results (default: 20) |
| offset | query | integer | No | Offset for pagination (default: 0) |
| expand | query | string | No | Comma-separated relations to expand (e.g. storage_id) |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.PaginatedInventoriesResponse"
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


### POST /api/v1/inventories 🔒

**Summary:** Create a new inventory

**Description:** Create a new inventory with date, storage_id, optional description fields and status

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | Inventory creation data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateInventoryRequest"
}
```

**Responses:**

- **201**: Inventory created successfully
  ```json
{
  "$ref": "#/definitions/model.InventoryResponse"
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


## /api/v1/inventories/batch

### POST /api/v1/inventories/batch 🔒

**Summary:** Create inventory with items

**Description:** Creates an inventory and upserts its items in a single request

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | Inventory batch creation data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateInventoryBatchRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.CreateInventoryBatchResponse"
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


### DELETE /api/v1/inventories/batch 🔒

**Summary:** Batch delete inventories

**Description:** Soft delete multiple inventories. Reverses stock changes for any that are active.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | List of inventory IDs to delete |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.DeleteInventoriesBatchRequest"
}
```

**Responses:**

- **200**: Inventories deleted successfully
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
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

- **404**: Inventory not found
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```

- **409**: Inventory already deleted or not the latest
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


## /api/v1/inventories/{id}

### GET /api/v1/inventories/{id} 🔒

**Summary:** Get inventory by ID

**Description:** Retrieve a specific inventory by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Inventory ID |
| expand | query | string | No | Comma-separated relations to expand (e.g. storage_id) |

**Responses:**

- **200**: Inventory retrieved successfully
  ```json
{
  "$ref": "#/definitions/model.InventoryResponse"
}
```

- **400**: Invalid inventory ID
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

- **404**: Inventory not found
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


### PUT /api/v1/inventories/{id} 🔒

**Summary:** Update inventory

**Description:** Update an inventory fields (date, storage_id, descriptions, status)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Inventory ID |
| input | body | object | Yes | Inventory update data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateInventoryRequest"
}
```

**Responses:**

- **200**: Inventory updated successfully
  ```json
{
  "$ref": "#/definitions/model.InventoryResponse"
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


### DELETE /api/v1/inventories/{id} 🔒

**Summary:** Delete inventory

**Description:** Soft delete an inventory

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Inventory ID |

**Responses:**

- **204**: Inventory deleted successfully
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
}
```

- **400**: Invalid inventory ID
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

- **404**: Inventory not found
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```

- **409**: Inventory already deleted or not the latest
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


## /api/v1/inventories/{id}/calculate

### POST /api/v1/inventories/{id}/calculate 🔒

**Summary:** Calculate inventory totals

**Description:** Calculate and persist inventory totals (surplus_amount, shortage_amount, remaining_amount) into the inventory

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Inventory ID |

**Responses:**

- **200**: Inventory calculated successfully
  ```json
{
  "$ref": "#/definitions/model.InventoryResponse"
}
```

- **400**: Invalid inventory ID
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


## /api/v1/inventories/{id}/items

### GET /api/v1/inventories/{id}/items 🔒

**Summary:** Get inventory items

**Description:** Retrieve computed inventory items for an inventory (system qty from stock, counted qty, difference, amounts)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Inventory ID |
| expand | query | string | No | Comma-separated relations to expand (e.g. ingredient_id) |

**Responses:**

- **200**: Inventory items retrieved successfully
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.InventoryItemComputedResponse"
  }
}
```

- **400**: Invalid inventory ID
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


### POST /api/v1/inventories/{id}/items 🔒

**Summary:** Upsert inventory items

**Description:** Upsert (create/update) counted quantities for ingredients in an inventory and return computed rows

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Inventory ID |
| input | body | object | Yes | Inventory items upsert data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpsertInventoryItemsRequest"
}
```

**Responses:**

- **200**: Inventory items updated successfully
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
          "$ref": "#/definitions/model.InventoryResponse"
        }
      }
    }
  ]
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


## /api/v1/inventories/{id}/items/batch

### PUT /api/v1/inventories/{id}/items/batch 🔒

**Summary:** Replace inventory items batch

**Description:** Full replace of inventory items. Optionally update inventory fields (date, storage_id, status, description) in the same call. Stock adjusted on status transition.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Inventory ID |
| input | body | object | Yes | Inventory items batch data (items required; inventory fields optional) |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpsertInventoryItemsRequest"
}
```

**Responses:**

- **200**: Inventory items updated successfully
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
          "$ref": "#/definitions/model.InventoryResponse"
        }
      }
    }
  ]
}
```

- **400**: Invalid request or inventory is deleted
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


### DELETE /api/v1/inventories/{id}/items/batch 🔒

**Summary:** Batch delete inventory items

**Description:** Remove specific inventory items by ID. Reverses stock if the inventory is active.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Inventory ID |
| input | body | object | Yes | List of inventory item IDs to delete |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.DeleteInventoryItemsBatchRequest"
}
```

**Responses:**

- **200**: Inventory items deleted successfully
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
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

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/inventories/{id}/restore

### POST /api/v1/inventories/{id}/restore 🔒

**Summary:** Restore inventory

**Description:** Restore a previously deleted inventory

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Inventory ID |

**Responses:**

- **200**: Inventory restored successfully
  ```json
{
  "$ref": "#/definitions/model.InventoryResponse"
}
```

- **400**: Invalid inventory ID
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


## /api/v1/inventory-items

### GET /api/v1/inventory-items 🔒

**Summary:** Get inventory items

**Description:** Retrieve inventory items with pagination (limit/offset). Optionally filter by inventory_id.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| inventory_id | query | string | No | Inventory ID to filter items |
| limit | query | integer | No | Limit results (default: 20) |
| offset | query | integer | No | Offset for pagination (default: 0) |

**Responses:**

- **200**: Inventory items retrieved successfully
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.InventoryItemResponse"
  }
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

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/inventory-items/{id}

### PUT /api/v1/inventory-items/{id} 🔒

**Summary:** Update inventory item

**Description:** Update inventory item counted_quantity by inventory item ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Inventory Item ID |
| input | body | object | Yes | Inventory item update data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateInventoryItemRequest"
}
```

**Responses:**

- **200**: Inventory item updated successfully
  ```json
{
  "$ref": "#/definitions/model.InventoryItemResponse"
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


### DELETE /api/v1/inventory-items/{id} 🔒

**Summary:** Delete inventory item

**Description:** Soft delete an inventory item by inventory item ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Inventory Item ID |

**Responses:**

- **204**: Inventory item deleted successfully
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
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

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/invoice-details

### GET /api/v1/invoice-details 🔒

**Summary:** Get all invoice details

**Description:** Get all invoice details with pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
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


### POST /api/v1/invoice-details 🔒

**Summary:** Create invoice detail

**Description:** Create a new line item in an invoice

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| request | body | object | Yes | Create invoice detail request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateInvoiceDetailRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.InvoiceDetailResponse"
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


## /api/v1/invoice-details/batch

### POST /api/v1/invoice-details/batch 🔒

**Summary:** Create multiple invoice details in batch

**Description:** Create multiple line items in an invoice with a single API call

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| request | body | array | Yes | Array of invoice detail requests |

**Request Body:**

```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.CreateInvoiceDetailRequest"
  }
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.InvoiceDetailBatchResponse"
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


## /api/v1/invoice-details/invoice/{invoice_id}

### GET /api/v1/invoice-details/invoice/{invoice_id} 🔒

**Summary:** Get invoice details by invoice ID

**Description:** Get all line items for a specific invoice with pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| invoice_id | path | string | Yes | Invoice ID |
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


## /api/v1/invoice-details/{id}

### GET /api/v1/invoice-details/{id} 🔒

**Summary:** Get invoice detail by ID

**Description:** Get a single invoice detail by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Invoice Detail ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.InvoiceDetailResponse"
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


### PUT /api/v1/invoice-details/{id} 🔒

**Summary:** Update invoice detail

**Description:** Update an existing invoice detail (line item)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Invoice Detail ID |
| request | body | object | Yes | Update invoice detail request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateInvoiceDetailRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.InvoiceDetailResponse"
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


### DELETE /api/v1/invoice-details/{id} 🔒

**Summary:** Delete invoice detail

**Description:** Delete (soft delete) an invoice detail

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Invoice Detail ID |

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


## /api/v1/invoice-details/{id}/quantity

### PUT /api/v1/invoice-details/{id}/quantity 🔒

**Summary:** Update invoice detail quantity

**Description:** Update the quantity of a line item in an invoice

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Invoice Detail ID |
| request | body | object | Yes | Quantity update request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateInvoiceDetailQuantityRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.InvoiceDetailResponse"
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


## /api/v1/invoice-details/{id}/restore

### POST /api/v1/invoice-details/{id}/restore 🔒

**Summary:** Restore invoice detail

**Description:** Restore a soft-deleted invoice detail

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Invoice Detail ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.InvoiceDetailResponse"
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


## /api/v1/invoice-details/{id}/with-ingredient

### GET /api/v1/invoice-details/{id}/with-ingredient 🔒

**Summary:** Get invoice detail with ingredient

**Description:** Get invoice detail including the associated ingredient information

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Invoice Detail ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.InvoiceDetailWithIngredientResponse"
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


## /api/v1/invoices

### GET /api/v1/invoices 🔒

**Summary:** Get all invoices

**Description:** Get all invoices with optional filters: date range, storage, supplier, ingredient, status, search and sorting

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |
| date_from | query | string | No | Filter from date (YYYY-MM-DD or RFC3339) |
| date_to | query | string | No | Filter to date (YYYY-MM-DD or RFC3339) |
| storage_id | query | string | No | Filter by storage ID |
| supplier_id | query | string | No | Filter by supplier ID |
| ingredient_id | query | string | No | Filter by ingredient ID (invoices containing this ingredient) |
| status | query | string | No | Filter by status (pending, arrived, received, cancelled) |
| search | query | string | No | Search by supplier name, phone or total amount |
| sort_by | query | string | No | Sort by field |
| sort_order | query | string | No | Sort order |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.PaginatedInvoicesResponse"
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


### POST /api/v1/invoices 🔒

**Summary:** Create supplier invoice

**Description:** Create a new supplier invoice

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| request | body | object | Yes | Create invoice request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateInvoiceRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.InvoiceResponse"
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


## /api/v1/invoices/batch

### POST /api/v1/invoices/batch 🔒

**Summary:** Create invoice with details in batch

**Description:** Create a new invoice and all its line items in one atomic call

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| request | body | object | Yes | Create invoice with details request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateInvoiceWithDetailsRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.CreateInvoiceWithDetailsResponse"
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


### DELETE /api/v1/invoices/batch 🔒

**Summary:** Batch delete invoices

**Description:** Delete multiple invoices at once. Arrived → stock reversed + deleted. Pending → cancelled.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | IDs to delete |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.DeleteInvoicesBatchRequest"
}
```

**Responses:**

- **200**: Deleted
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
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

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/invoices/{id}

### GET /api/v1/invoices/{id} 🔒

**Summary:** Get invoice by ID

**Description:** Get a single invoice by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Invoice ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.InvoiceResponse"
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


### PUT /api/v1/invoices/{id} 🔒

**Summary:** Update invoice

**Description:** Update an existing invoice

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Invoice ID |
| request | body | object | Yes | Update invoice request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateInvoiceRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.InvoiceResponse"
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


### DELETE /api/v1/invoices/{id} 🔒

**Summary:** Delete invoice

**Description:** Delete (soft delete) an invoice

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Invoice ID |

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


## /api/v1/invoices/{id}/details

### GET /api/v1/invoices/{id}/details 🔒

**Summary:** Get invoice with details

**Description:** Get a complete invoice including all line items and ingredient details

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Invoice ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.InvoiceGetWithDetailsResponse"
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


## /api/v1/invoices/{id}/details/batch

### PUT /api/v1/invoices/{id}/details/batch 🔒

**Summary:** Batch update invoice details

**Description:** Replace all details of an invoice. Optionally update invoice-level fields (status, supplier_id, storage_id, total_amount, date). Stock is applied only when invoice status is or becomes 'arrived'. Setting status to 'arrived' applies stock; it was already 'arrived', old stock is reversed and new stock applied.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Invoice ID |
| request | body | object | Yes | Invoice fields (optional) + new details |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpsertInvoiceDetailsRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.UpsertInvoiceDetailsResponse"
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


### DELETE /api/v1/invoices/{id}/details/batch 🔒

**Summary:** Batch delete invoice details

**Description:** Delete multiple invoice detail line items at once, reversing stock for each

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Invoice ID |
| input | body | object | Yes | Detail IDs to delete |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.DeleteInvoiceDetailsBatchRequest"
}
```

**Responses:**

- **200**: Deleted
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
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

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/invoices/{id}/restore

### POST /api/v1/invoices/{id}/restore 🔒

**Summary:** Restore invoice

**Description:** Restore a soft-deleted invoice

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Invoice ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.InvoiceResponse"
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


## /api/v1/invoices/{id}/status

### PATCH /api/v1/invoices/{id}/status 🔒

**Summary:** Update invoice status

**Description:** Update the status of an invoice

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Invoice ID |
| request | body | object | Yes | Status update request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateInvoiceStatusRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.InvoiceResponse"
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


## /api/v1/media/image

### POST /api/v1/media/image 🔒

**Summary:** Rasm yuklash

**Description:** undefined

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| file | formData | file | Yes | Rasm fayli |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.DownloadSuccessResponse"
}
```


## /api/v1/media/image/download

### POST /api/v1/media/image/download 🔒

**Summary:** Rasmni yuklab olish

**Description:** undefined

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | Rasm obyekt nomi |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.DownloadRequest"
}
```

**Responses:**

- **200**: Rasm fayli
  ```json
{
  "type": "file"
}
```

- **404**: Rasm topilmadi
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/media/video

### POST /api/v1/media/video 🔒

**Summary:** Video yuklash

**Description:** undefined

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| file | formData | file | Yes | Video fayli |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.DownloadSuccessResponse"
}
```


## /api/v1/media/video/download

### POST /api/v1/media/video/download 🔒

**Summary:** Videoni yuklab olish

**Description:** undefined

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | Video obyekt nomi |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.DownloadRequest"
}
```

**Responses:**

- **200**: Video fayli
  ```json
{
  "type": "file"
}
```


## /api/v1/order-items

### GET /api/v1/order-items 🔒

**Summary:** Get all order items

**Description:** Get all order items with pagination

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
    "$ref": "#/definitions/model.OrderItemResponse"
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


### POST /api/v1/order-items 🔒

**Summary:** Create order items

**Description:** Create one or more order items for the same order. price can be omitted; it will be auto-filled from goods.price.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| request | body | object | Yes | Create order items request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateOrderItemRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.OrderItemResponse"
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


## /api/v1/order-items/order/{orderId}

### GET /api/v1/order-items/order/{orderId} 🔒

**Summary:** Get order items by order

**Description:** Get all order items for a given order

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| orderId | path | string | Yes | Order ID |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.OrderItemResponse"
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


## /api/v1/order-items/status/{status}

### GET /api/v1/order-items/status/{status} 🔒

**Summary:** Get order items by status

**Description:** Get order items filtered by status with pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| status | path | string | Yes | Order item status |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.OrderItemResponse"
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


## /api/v1/order-items/{id}

### GET /api/v1/order-items/{id} 🔒

**Summary:** Get order item by ID

**Description:** Get a single order item by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order Item ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OrderItemDetailResponse"
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


### PUT /api/v1/order-items/{id} 🔒

**Summary:** Update order item

**Description:** Update an existing order item

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order Item ID |
| request | body | object | Yes | Update order item request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateOrderItemRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OrderItemResponse"
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


### DELETE /api/v1/order-items/{id} 🔒

**Summary:** Delete order item

**Description:** Delete (soft delete) an order item

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order Item ID |

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


## /api/v1/order-items/{id}/cancel

### POST /api/v1/order-items/{id}/cancel 🔒

**Summary:** Cancel order item

**Description:** Cancel an order item

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order Item ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OrderItemResponse"
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


## /api/v1/order-items/{id}/cooking

### POST /api/v1/order-items/{id}/cooking 🔒

**Summary:** Mark order item cooking

**Description:** Mark an order item as cooking

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order Item ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OrderItemResponse"
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


## /api/v1/order-items/{id}/quantity

### PUT /api/v1/order-items/{id}/quantity 🔒

**Summary:** Update order item quantity

**Description:** Update the quantity of an order item

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order Item ID |
| request | body | object | Yes | Update order item quantity request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateOrderItemQuantityRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OrderItemResponse"
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


## /api/v1/order-items/{id}/ready

### POST /api/v1/order-items/{id}/ready 🔒

**Summary:** Mark order item ready

**Description:** Mark an order item as ready

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order Item ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OrderItemResponse"
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


## /api/v1/order-items/{id}/restore

### POST /api/v1/order-items/{id}/restore 🔒

**Summary:** Restore order item

**Description:** Restore a soft-deleted order item

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order Item ID |

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


## /api/v1/order-items/{id}/status

### PUT /api/v1/order-items/{id}/status 🔒

**Summary:** Update order item status

**Description:** Update the status of an order item

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order Item ID |
| request | body | object | Yes | Update order item status request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateOrderItemStatusRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OrderItemResponse"
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


## /api/v1/orders

### GET /api/v1/orders 🔒

**Summary:** Get all orders

**Description:** Get all orders with type, status, period/from-to, table filters and created/updated date sorting

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| type | query | string | No | Order type |
| status | query | string | No | Order status |
| from | query | string | No | Start date (YYYY-MM-DD) |
| to | query | string | No | End date (YYYY-MM-DD) |
| table_id | query | string | No | Table ID |
| sort_by | query | string | No | Sort field |
| sort_order | query | string | No | Sort order |
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


### POST /api/v1/orders 🔒

**Summary:** Create order

**Description:** Create a new order. You can optionally create multiple order items in the same request via the items array. total_amount is computed server-side from items and service/discount fields.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| request | body | object | Yes | Create order request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateOrderRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.OrderResponse"
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


## /api/v1/orders/batch

### POST /api/v1/orders/batch 🔒

**Summary:** Create orders batch

**Description:** Create multiple orders in one request. Useful for offline sync.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| request | body | object | Yes | Create orders batch request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateOrderBatchRequest"
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


## /api/v1/orders/my

### GET /api/v1/orders/my 🔒

**Summary:** Get my orders

**Description:** Get current authenticated waiter's own orders with optional filters

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| scope | query | string | No | Scope filter: active, reservations, history, all |
| order_type | query | string | No | Order type filter: dine_in, takeaway |
| table_id | query | string | No | Table ID |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.WaiterOrderListResponse"
}
```

- **400**: Bad Request
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

- **500**: Internal Server Error
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```


## /api/v1/orders/status/{status}

### GET /api/v1/orders/status/{status} 🔒

**Summary:** Get orders by status

**Description:** Get orders filtered by status with pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| status | path | string | Yes | Order status |
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


## /api/v1/orders/table/{tableId}

### GET /api/v1/orders/table/{tableId} 🔒

**Summary:** Get orders by table

**Description:** Get orders filtered by table ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| tableId | path | string | Yes | Table ID |

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


## /api/v1/orders/{id}

### GET /api/v1/orders/{id} 🔒

**Summary:** Get order by ID

**Description:** Get a single order by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OrderResponse"
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


### PUT /api/v1/orders/{id} 🔒

**Summary:** Update order

**Description:** Update an existing order

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order ID |
| request | body | object | Yes | Update order request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateOrderRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OrderResponse"
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


### DELETE /api/v1/orders/{id} 🔒

**Summary:** Delete order

**Description:** Delete (soft delete) an order

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order ID |

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


## /api/v1/orders/{id}/activate

### POST /api/v1/orders/{id}/activate 🔒

**Summary:** Activate reserved order

**Description:** Manually activate a reserved or rescheduled order (sets status to open)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order ID |

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


## /api/v1/orders/{id}/assign-cashier/{cashierId}

### POST /api/v1/orders/{id}/assign-cashier/{cashierId} 🔒

**Summary:** Assign cashier to order

**Description:** Assign a cashier to an order

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order ID |
| cashierId | path | string | Yes | Cashier ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OrderResponse"
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


## /api/v1/orders/{id}/assign-waiter/{waiterId}

### POST /api/v1/orders/{id}/assign-waiter/{waiterId} 🔒

**Summary:** Assign waiter to order

**Description:** Assign a waiter to an order

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order ID |
| waiterId | path | string | Yes | Waiter ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OrderResponse"
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


## /api/v1/orders/{id}/cancel

### POST /api/v1/orders/{id}/cancel 🔒

**Summary:** Cancel order

**Description:** Cancel an order

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OrderResponse"
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


## /api/v1/orders/{id}/cooking

### POST /api/v1/orders/{id}/cooking 🔒

**Summary:** Mark order cooking

**Description:** Mark an order as cooking

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OrderResponse"
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


## /api/v1/orders/{id}/items

### POST /api/v1/orders/{id}/items 🔒

**Summary:** Add order items

**Description:** Append multiple order items to an existing order (e.g. dessert after meal). Item price is auto-filled from goods.price and order totals are recalculated server-side.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order ID |
| request | body | object | Yes | Add order items request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.AddOrderItemsRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.AddOrderItemsResponse"
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


## /api/v1/orders/{id}/pay

### POST /api/v1/orders/{id}/pay 🔒

**Summary:** Mark order paid

**Description:** Mark an order as paid

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order ID |
| request | body | object | Yes | Mark order paid request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.MarkOrderPaidRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OrderResponse"
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


## /api/v1/orders/{id}/ready

### POST /api/v1/orders/{id}/ready 🔒

**Summary:** Mark order ready

**Description:** Mark an order as ready

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OrderResponse"
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


## /api/v1/orders/{id}/reschedule

### POST /api/v1/orders/{id}/reschedule 🔒

**Summary:** Reschedule order

**Description:** Move a reservation to a new scheduled time with an optional comment

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order ID |
| body | body | object | Yes | Reschedule request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.RescheduleOrderRequest"
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


## /api/v1/orders/{id}/restore

### POST /api/v1/orders/{id}/restore 🔒

**Summary:** Restore order

**Description:** Restore a soft-deleted order

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order ID |

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


## /api/v1/orders/{id}/served

### POST /api/v1/orders/{id}/served 🔒

**Summary:** Mark order served

**Description:** Mark an order as served

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OrderResponse"
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


## /api/v1/orders/{id}/status

### PUT /api/v1/orders/{id}/status 🔒

**Summary:** Update order status

**Description:** Update status of an existing order

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Order ID |
| request | body | object | Yes | Update order status request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateOrderStatusRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OrderResponse"
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


## /api/v1/orders/{id}/table-price

### GET /api/v1/orders/{id}/table-price 🔒

**Summary:** Get table price for order

**Description:** Calculates price based on table's price_per_hour and time elapsed. Uses scheduled_at if set, otherwise created_at. Returns error if table has no hourly price.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Order ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.TablePriceResponse"
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


## /api/v1/orders/{id}/table-timer

### GET /api/v1/orders/{id}/table-timer 🔒

**Summary:** Get order table timer

**Description:** Returns current table timer state for the order

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Order ID |

**Responses:**

- **200**: OK
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
          "$ref": "#/definitions/model.TableTimerResponse"
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

- **401**: Unauthorized
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


## /api/v1/orders/{id}/table-timer/pause

### POST /api/v1/orders/{id}/table-timer/pause 🔒

**Summary:** Pause order table timer

**Description:** Pauses the active table timer for the given order

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Order ID |

**Responses:**

- **200**: OK
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
          "$ref": "#/definitions/model.TableTimerResponse"
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

- **401**: Unauthorized
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


## /api/v1/orders/{id}/table-timer/resume

### POST /api/v1/orders/{id}/table-timer/resume 🔒

**Summary:** Resume order table timer

**Description:** Resumes a paused table timer for the given order

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Order ID |

**Responses:**

- **200**: OK
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
          "$ref": "#/definitions/model.TableTimerResponse"
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

- **401**: Unauthorized
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


## /api/v1/orders/{id}/table-timer/start

### POST /api/v1/orders/{id}/table-timer/start 🔒

**Summary:** Start order table timer

**Description:** Starts table timer for a time-based table if needed

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Order ID |

**Responses:**

- **200**: OK
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
          "$ref": "#/definitions/model.TableTimerResponse"
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

- **401**: Unauthorized
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


## /api/v1/orders/{id}/table-timer/transfer

### POST /api/v1/orders/{id}/table-timer/transfer 🔒

**Summary:** Transfer order table timer to another table

**Description:** Transfers the active table timer session to a different table

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Session ID |
| request | body | object | Yes | Transfer request |

**Request Body:**

```json
{
  "type": "object",
  "properties": {
    "reason": {
      "type": "string"
    },
    "to_table_id": {
      "type": "string"
    }
  }
}
```

**Responses:**

- **200**: OK
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
          "$ref": "#/definitions/model.TableTimerResponse"
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

- **401**: Unauthorized
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

- **409**: Conflict
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/orders/{id}/transfer

### POST /api/v1/orders/{id}/transfer 🔒

**Summary:** Transfer order to different table

**Description:** Transfer an order from its current table to a target table

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Order ID |
| request | body | object | Yes | Transfer request with target_table_id |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.OrderTransferRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OrderResponse"
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

- **409**: Conflict
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


## /api/v1/outgoing-invoices

### GET /api/v1/outgoing-invoices 🔒

**Summary:** List outgoing invoices

**Description:** List invoices filtered by storage, group, status, date range. Returns total count and total sum.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| storage_id | query | string | No | Filter by storage UUID |
| group_id | query | string | No | Filter by deduction act group UUID |
| status | query | string | No | Filter by status (active/cancelled) |
| start_date | query | string | No | Start date (RFC3339) |
| end_date | query | string | No | End date (RFC3339) |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OutgoingInvoiceListResponse"
}
```

- **500**: Internal Server Error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


### POST /api/v1/outgoing-invoices 🔒

**Summary:** Create outgoing invoice

**Description:** Create a new outgoing invoice. Add items, then confirm to deduct stock.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| request | body | object | Yes | Create outgoing invoice |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateOutgoingInvoiceRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.OutgoingInvoiceResponse"
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


## /api/v1/outgoing-invoices/batch

### POST /api/v1/outgoing-invoices/batch 🔒

**Summary:** Create outgoing invoice with items (batch)

**Description:** Creates invoice header and upserts all items in one request. Returns full invoice with stock preview.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| request | body | object | Yes | Batch create |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateOutgoingInvoiceBatchRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.OutgoingInvoiceWithItemsResponse"
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


## /api/v1/outgoing-invoices/{id}

### GET /api/v1/outgoing-invoices/{id} 🔒

**Summary:** Get outgoing invoice by ID

**Description:** Returns invoice header + all items with stock_before/stock_after

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Invoice ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OutgoingInvoiceWithItemsResponse"
}
```

- **404**: Not Found
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


### PUT /api/v1/outgoing-invoices/{id} 🔒

**Summary:** Update outgoing invoice

**Description:** Update storage, group, date, description. Only works on active invoices.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Invoice ID |
| request | body | object | Yes | Update invoice |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateOutgoingInvoiceRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OutgoingInvoiceResponse"
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


### DELETE /api/v1/outgoing-invoices/{id} 🔒

**Summary:** Delete outgoing invoice

**Description:** Soft-deletes an invoice. Only active invoices can be deleted.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Invoice ID |

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


## /api/v1/outgoing-invoices/{id}/cancel

### POST /api/v1/outgoing-invoices/{id}/cancel 🔒

**Summary:** Cancel outgoing invoice

**Description:** Cancels an invoice (no stock change)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Invoice ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OutgoingInvoiceResponse"
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


## /api/v1/outgoing-invoices/{id}/confirm

### POST /api/v1/outgoing-invoices/{id}/confirm 🔒

**Summary:** Confirm outgoing invoice

**Description:** Confirms invoice. Deducts each item's quantity from ingredient_stock and saves stock snapshots.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Invoice ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.OutgoingInvoiceResponse"
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


## /api/v1/outgoing-invoices/{id}/items

### POST /api/v1/outgoing-invoices/{id}/items 🔒

**Summary:** Upsert outgoing invoice items

**Description:** Add/update multiple ingredient items. Returns items with live stock preview.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Invoice ID |
| request | body | object | Yes | Items to upsert |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpsertOutgoingInvoiceItemsRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.OutgoingInvoiceItemResponse"
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


## /api/v1/outgoing-invoices/{id}/items/{item_id}

### DELETE /api/v1/outgoing-invoices/{id}/items/{item_id} 🔒

**Summary:** Delete outgoing invoice item

**Description:** Remove an ingredient item from an active invoice

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Invoice ID |
| item_id | path | string | Yes | Item ID |

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


## /api/v1/payments/create

### POST /api/v1/payments/create 🔓

**Summary:** Create a new payment invoice

**Description:** Creates a new payment invoice for the authenticated user

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| Authorization | header | string | Yes | Bearer token |
| request | body | object | Yes | Invoice creation request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.IndexCreation"
}
```

**Responses:**

- **200**: Successfully created invoice
  ```json
{
  "$ref": "#/definitions/model.CreateInvoiceResponse"
}
```

- **400**: Invalid request or missing required fields
  ```json
{
  "$ref": "#/definitions/model.CreateInvoiceResponse"
}
```

- **401**: Unauthorized - User not authenticated
  ```json
{
  "$ref": "#/definitions/model.CreateInvoiceResponse"
}
```

- **500**: Internal server error
  ```json
{
  "$ref": "#/definitions/model.CreateInvoiceResponse"
}
```


## /api/v1/separation-acts

### GET /api/v1/separation-acts 🔒

**Summary:** List separation acts

**Description:** List acts filtered by storage, group, ingredient, status, date range. Returns total count and sums.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| storage_id | query | string | No | Filter by storage UUID |
| group_id | query | string | No | Filter by group UUID |
| ingredient_id | query | string | No | Filter by source ingredient UUID |
| status | query | string | No | Filter by status (draft/active/cancelled) |
| start_date | query | string | No | Start date (RFC3339) |
| end_date | query | string | No | End date (RFC3339) |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.SeparationActListResponse"
}
```

- **500**: Internal Server Error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


### POST /api/v1/separation-acts 🔒

**Summary:** Create separation act

**Description:** Create a new separation act in draft status. Add items, then confirm to apply stock changes.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| request | body | object | Yes | Create separation act |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateSeparationActRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.SeparationActResponse"
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


## /api/v1/separation-acts/batch

### POST /api/v1/separation-acts/batch 🔒

**Summary:** Create separation act with items (batch)

**Description:** Creates act header and upserts all output items in one request. Returns full act with stock preview.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| request | body | object | Yes | Batch create |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateSeparationActBatchRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.SeparationActWithItemsResponse"
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


## /api/v1/separation-acts/{id}

### GET /api/v1/separation-acts/{id} 🔒

**Summary:** Get separation act by ID

**Description:** Returns act header + all items with stock_before/stock_after

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Separation Act ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.SeparationActWithItemsResponse"
}
```

- **404**: Not Found
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


### PUT /api/v1/separation-acts/{id} 🔒

**Summary:** Update separation act

**Description:** Update storage, group, date, description. Only works on draft acts.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Separation Act ID |
| request | body | object | Yes | Update act |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateSeparationActRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.SeparationActResponse"
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


### DELETE /api/v1/separation-acts/{id} 🔒

**Summary:** Delete separation act

**Description:** Soft-deletes a separation act. If confirmed (active), reverses all stock changes first.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Separation Act ID |

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


## /api/v1/separation-acts/{id}/cancel

### POST /api/v1/separation-acts/{id}/cancel 🔒

**Summary:** Cancel separation act

**Description:** Cancels a draft act (no stock change)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Separation Act ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.SeparationActResponse"
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


## /api/v1/separation-acts/{id}/confirm

### POST /api/v1/separation-acts/{id}/confirm 🔒

**Summary:** Confirm separation act

**Description:** Confirms act: removes source ingredient qty from source storage, adds output items to their storages, saves stock snapshots.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Separation Act ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.SeparationActResponse"
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


## /api/v1/separation-acts/{id}/items

### POST /api/v1/separation-acts/{id}/items 🔒

**Summary:** Upsert separation act items

**Description:** Add/update multiple output ingredient items. Returns items with live stock preview.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Separation Act ID |
| request | body | object | Yes | Items to upsert |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpsertSeparationActItemsRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.SeparationActItemResponse"
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


## /api/v1/separation-acts/{id}/items/{item_id}

### DELETE /api/v1/separation-acts/{id}/items/{item_id} 🔒

**Summary:** Delete separation act item

**Description:** Remove an output ingredient item from a draft act

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Separation Act ID |
| item_id | path | string | Yes | Item ID |

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


## /api/v1/settings/printer-settings

### GET /api/v1/settings/printer-settings 🔒

**Summary:** List printer settings

**Description:** Get printer settings list for current tenant

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/handler.PrinterSettingListSuccessResponse"
}
```

- **400**: Bad Request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


### POST /api/v1/settings/printer-settings 🔒

**Summary:** Create printer setting

**Description:** Create new printer setting for current tenant

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | Create printer setting request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreatePrinterSettingRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/handler.PrinterSettingCreateSuccessResponse"
}
```

- **400**: Bad Request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/settings/printer-settings/{id}

### GET /api/v1/settings/printer-settings/{id} 🔒

**Summary:** Get printer setting by id

**Description:** Get one printer setting by id for current tenant

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Printer setting ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/handler.PrinterSettingGetSuccessResponse"
}
```

- **400**: Bad Request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


### PUT /api/v1/settings/printer-settings/{id} 🔒

**Summary:** Update printer setting

**Description:** Update printer setting by id for current tenant

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Printer setting ID |
| request | body | object | Yes | Update printer setting request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdatePrinterSettingRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/handler.PrinterSettingUpdateSuccessResponse"
}
```

- **400**: Bad Request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


### DELETE /api/v1/settings/printer-settings/{id} 🔒

**Summary:** Delete printer setting

**Description:** Soft delete printer setting by id for current tenant

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Printer setting ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/handler.PrinterSettingDeleteSuccessResponse"
}
```

- **400**: Bad Request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/shipments

### GET /api/v1/shipments 🔒

**Summary:** List shipments

**Description:** List shipments filtered by storage, supplier, status, date range. Returns pagination info and total_amount_sum for the filtered range.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| storage_id | query | string | No | Filter by storage UUID |
| supplier_id | query | string | No | Filter by supplier UUID |
| status | query | string | No | Filter by status (draft/active/cancelled) |
| start_date | query | string | No | Start date (RFC3339) |
| end_date | query | string | No | End date (RFC3339) |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.ShipmentResponse"
  }
}
```

- **500**: Internal Server Error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


### POST /api/v1/shipments 🔒

**Summary:** Create shipment

**Description:** Create a new shipment. Use status="draft" (default) or status="active". If active, stock is deducted immediately.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | Create shipment |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateShipmentRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.ShipmentResponse"
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


## /api/v1/shipments/batch

### POST /api/v1/shipments/batch 🔒

**Summary:** Create shipment with items (batch)

**Description:** Creates a shipment header and upserts all provided items in a single request. Use status="draft" (default) or status="active" to immediately deduct stock.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | Batch create |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateShipmentBatchRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.ShipmentWithItemsResponse"
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


## /api/v1/shipments/{id}

### GET /api/v1/shipments/{id} 🔒

**Summary:** Get shipment by ID

**Description:** Returns shipment header + all items with stock_before/stock_after snapshots

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Shipment ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.ShipmentWithItemsResponse"
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


### PUT /api/v1/shipments/{id} 🔒

**Summary:** Update shipment

**Description:** Update storage, supplier, date, description, and/or status. Setting status="active" deducts stock (draft→active). Setting status="draft" reverses stock (active→draft).

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Shipment ID |
| request | body | object | Yes | Update shipment |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateShipmentRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.ShipmentResponse"
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


### DELETE /api/v1/shipments/{id} 🔒

**Summary:** Delete shipment

**Description:** Soft-deletes a shipment. If the shipment was active, ingredient stock is reversed.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Shipment ID |

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


## /api/v1/shipments/{id}/batch

### PUT /api/v1/shipments/{id}/batch 🔒

**Summary:** Update shipment with items (batch)

**Description:** Updates a shipment header and upserts all provided items in a single request.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Shipment ID |
| request | body | object | Yes | Batch update |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateShipmentBatchRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.ShipmentWithItemsResponse"
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


## /api/v1/shipments/{id}/items

### POST /api/v1/shipments/{id}/items 🔒

**Summary:** Upsert shipment items

**Description:** Add/update multiple ingredient items. Each item is upserted (insert or update by ingredient_id). Returns items with live stock preview.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Shipment ID |
| request | body | object | Yes | Items to upsert |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpsertShipmentItemsRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.ShipmentItemResponse"
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


## /api/v1/shipments/{id}/items/{item_id}

### DELETE /api/v1/shipments/{id}/items/{item_id} 🔒

**Summary:** Delete shipment item

**Description:** Remove an ingredient item from a shipment

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Shipment ID |
| item_id | path | string | Yes | Item ID |

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


## /api/v1/storages

### GET /api/v1/storages 🔒

**Summary:** Get all storages

**Description:** Retrieve all storages with pagination, optional search and sorting

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| search | query | string | No | Search by storage name |
| sort_by | query | string | No | Sort by field |
| sort_order | query | string | No | Sort order |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.PaginatedStoragesResponse"
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


### POST /api/v1/storages 🔒

**Summary:** Create a new storage

**Description:** Create a new storage with name, branch ID, and optional translation ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | Storage creation data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateStorageRequest"
}
```

**Responses:**

- **201**: Storage created successfully
  ```json
{
  "$ref": "#/definitions/model.StorageResponse"
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


## /api/v1/storages-lang

### GET /api/v1/storages-lang 🔒

**Summary:** Get all storages with language support

**Description:** Retrieve all storages with names translated to specified language

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language code (uz, ru, en - default: uz) |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Comma-separated relations to expand (e.g. name_i18n) |

**Responses:**

- **200**: Storages retrieved successfully
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.StorageResponse"
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


## /api/v1/storages-lang/{id}

### GET /api/v1/storages-lang/{id} 🔒

**Summary:** Get storage by ID with language support

**Description:** Retrieve a specific storage by its ID with names translated to specified language

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Storage ID |
| lang | query | string | No | Language code (uz, ru, en - default: uz) |
| expand | query | string | No | Comma-separated relations to expand (e.g. name_i18n) |

**Responses:**

- **200**: Storage details
  ```json
{
  "$ref": "#/definitions/model.StorageResponse"
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

- **404**: Storage not found
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


## /api/v1/storages/branch/{branchId}

### GET /api/v1/storages/branch/{branchId} 🔒

**Summary:** Get storages by branch ID

**Description:** Retrieve all storages for a specific branch

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| branchId | path | string | Yes | Branch ID |
| limit | query | integer | No | Limit results (default: 20) |
| offset | query | integer | No | Offset for pagination (default: 0) |
| expand | query | string | No | Comma-separated relations to expand (e.g. name_i18n) |

**Responses:**

- **200**: List of storages for the branch
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.StorageResponse"
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


## /api/v1/storages/{id}

### GET /api/v1/storages/{id} 🔒

**Summary:** Get storage by ID

**Description:** Retrieve a specific storage by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Storage ID |
| expand | query | string | No | Comma-separated relations to expand (e.g. name_i18n) |

**Responses:**

- **200**: Storage details
  ```json
{
  "$ref": "#/definitions/model.StorageResponse"
}
```

- **400**: Invalid storage ID
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

- **404**: Storage not found
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


### PUT /api/v1/storages/{id} 🔒

**Summary:** Update storage

**Description:** Update a storage's information

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Storage ID |
| input | body | object | Yes | Storage update data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateStorageRequest"
}
```

**Responses:**

- **200**: Storage updated successfully
  ```json
{
  "$ref": "#/definitions/model.StorageResponse"
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


### DELETE /api/v1/storages/{id} 🔒

**Summary:** Delete storage

**Description:** Soft delete a storage (mark as deleted without removing from database)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Storage ID |

**Responses:**

- **200**: Storage deleted successfully
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
}
```

- **400**: Invalid storage ID
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


## /api/v1/storages/{id}/restore

### POST /api/v1/storages/{id}/restore 🔒

**Summary:** Restore storage

**Description:** Restore a previously deleted storage

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Storage ID |

**Responses:**

- **200**: Storage restored successfully
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
}
```

- **400**: Invalid storage ID
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


## /api/v1/suppliers

### GET /api/v1/suppliers 🔒

**Summary:** Get all suppliers

**Description:** Retrieve all suppliers with pagination, optional search and sorting

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| search | query | string | No | Search by supplier name |
| sort_by | query | string | No | Sort by field |
| sort_order | query | string | No | Sort order |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |
| expand | query | string | No | Expand related fields |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.PaginatedSuppliersResponse"
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


### POST /api/v1/suppliers 🔒

**Summary:** Create supplier

**Description:** Create a new supplier

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| request | body | object | Yes | Create supplier request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateSupplierRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.SupplierResponse"
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


## /api/v1/suppliers/{id}

### GET /api/v1/suppliers/{id} 🔒

**Summary:** Get supplier by ID

**Description:** Get a single supplier by its ID

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Supplier ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.SupplierResponse"
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


### PUT /api/v1/suppliers/{id} 🔒

**Summary:** Update supplier

**Description:** Update a supplier

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Supplier ID |
| request | body | object | Yes | Update supplier request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateSupplierRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.SupplierResponse"
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


### DELETE /api/v1/suppliers/{id} 🔒

**Summary:** Delete supplier

**Description:** Soft delete a supplier

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Supplier ID |

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


## /api/v1/suppliers/{id}/restore

### POST /api/v1/suppliers/{id}/restore 🔒

**Summary:** Restore supplier

**Description:** Restore a soft-deleted supplier

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| id | path | string | Yes | Supplier ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.SupplierResponse"
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


## /api/v1/sync/change-logs

### GET /api/v1/sync/change-logs 🔒

**Summary:** Get change logs

**Description:** Get change_log entries with filters

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| entity | query | string | No | Entity name (table) |
| action | query | string | No | Action (create/update/delete) |
| from_id | query | integer | No | Start ID (inclusive) |
| to_id | query | integer | No | End ID (inclusive) |
| from_time | query | string | No | Start time (RFC3339) |
| to_time | query | string | No | End time (RFC3339) |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |
| order | query | string | No | asc or desc |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.ChangeLogListResponse"
}
```


## /api/v1/sync/pull

### POST /api/v1/sync/pull 🔒

**Summary:** Sync pull

**Description:** Get changes since last_sync_cursor

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | Sync pull request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.SyncPullRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.SyncPullResponse"
}
```


## /api/v1/sync/push

### POST /api/v1/sync/push 🔒

**Summary:** Sync push

**Description:** Apply changes from offline server

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | Sync push request |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.SyncPushRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.SyncPushResult"
}
```


## /api/v1/transactions

### GET /api/v1/transactions 🔒

**Summary:** Get all transactions

**Description:** Retrieve all transactions with pagination, filters, search and sorting

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| search | query | string | No | Search by comment or description |
| type | query | string | No | Filter by transaction type |
| pay_type | query | string | No | Filter by pay type (cash, card) |
| cash_register_id | query | string | No | Filter by cash register ID |
| group_transaction_id | query | string | No | Filter by group transaction ID |
| date_from | query | string | No | Start date (YYYY-MM-DD) |
| date_to | query | string | No | End date (YYYY-MM-DD) |
| sort_by | query | string | No | Sort by field |
| sort_order | query | string | No | Sort order |
| limit | query | integer | No | Limit (default: 20) |
| offset | query | integer | No | Offset (default: 0) |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.PaginatedTransactionsResponse"
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


## /api/v1/transactions/income-expense

### POST /api/v1/transactions/income-expense 🔒

**Summary:** Create income or expense transaction

**Description:** Create a new income or expense transaction. Type must be "income" or "expense".

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | Transaction data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateIncomeExpenseRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.TransactionResponse"
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


## /api/v1/transactions/report

### GET /api/v1/transactions/report 🔒

**Summary:** Cash register report

**Description:** Returns summary by transaction type, income/expense grouped by category, and day balance totals.

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| from | query | string | No | Start datetime (RFC3339) |
| to | query | string | No | End datetime (RFC3339) |
| cash_register_id | query | string | No | Filter by cash register UUID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.CashReportResponse"
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


## /api/v1/transactions/transfer

### POST /api/v1/transactions/transfer 🔒

**Summary:** Transfer between cash registers

**Description:** Transfer an amount between two cash registers (optionally across branches)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| input | body | object | Yes | Transfer data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.CreateCashTransferRequest"
}
```

**Responses:**

- **201**: Created
  ```json
{
  "$ref": "#/definitions/model.TransactionResponse"
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


## /api/v1/transactions/{id}

### GET /api/v1/transactions/{id} 🔒

**Summary:** Get transaction by ID

**Description:** undefined

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Transaction ID |

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.TransactionResponse"
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


### PUT /api/v1/transactions/{id} 🔒

**Summary:** Update transaction

**Description:** undefined

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Transaction ID |
| input | body | object | Yes | Update data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdateTransactionRequest"
}
```

**Responses:**

- **200**: OK
  ```json
{
  "$ref": "#/definitions/model.TransactionResponse"
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


### DELETE /api/v1/transactions/{id} 🔒

**Summary:** Delete transaction

**Description:** undefined

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| id | path | string | Yes | Transaction ID |

**Responses:**

- **204**: No Content
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


## /api/v1/user/me

### GET /api/v1/user/me 🔒

**Summary:** Get current user profile

**Description:** Get the profile of the currently authenticated user

**Responses:**

- **200**: User profile retrieved successfully
  ```json
{
  "$ref": "#/definitions/model.UserResponse"
}
```

- **401**: Unauthorized
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```

- **404**: User not found
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/user/password-update

### PUT /api/v1/user/password-update 🔒

**Summary:** Update user password

**Description:** Update the password of the currently authenticated user

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| request | body | object | Yes | Password update data |

**Request Body:**

```json
{
  "$ref": "#/definitions/model.UpdatePasswordRequest"
}
```

**Responses:**

- **200**: Password updated successfully
  ```json
{
  "$ref": "#/definitions/model.SuccessResponse"
}
```

- **400**: Invalid request format or user ID
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

- **500**: Failed to update password
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


## /api/v1/user/update

### PUT /api/v1/user/update 🔒

**Summary:** Update current user profile

**Description:** Update the profile information of the currently authenticated user

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
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


## /metadata

### GET /metadata 🔒

**Summary:** Get bulk metadata for dropdown options

**Description:** Retrieves {id, name} pairs for multiple entity types in a single request

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| include | query | string | No | Comma-separated entity names (e.g., storages,departments,categories) |

**Responses:**

- **200**: OK
  ```json
{
  "type": "object",
  "additionalProperties": {
    "type": "array",
    "items": {
      "$ref": "#/definitions/model.MetadataItem"
    }
  }
}
```

- **400**: Invalid entity in whitelist
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```

- **500**: Database error
  ```json
{
  "$ref": "#/definitions/model.ErrorData"
}
```


