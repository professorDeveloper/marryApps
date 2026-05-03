# Bulk Metadata Lookup Endpoint

## Overview

The `/api/v1/metadata` endpoint provides a single request to retrieve dropdown and filter options for multiple entities. Returns `{id, name}` records for all requested entity types in one response.

**Endpoint:** `GET /api/v1/metadata`

**Authentication:** Requires Bearer token

**Response Format:** JSON

## Query Parameters

### Optional Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `include` | string | Comma-separated list of entity names to retrieve | `storages,departments,categories` |

### Supported Entities

The `include` parameter accepts the following comma-separated entity names:

| Entity | Table | Description |
|--------|-------|-------------|
| `storages` | `storages` | Storage/warehouse locations |
| `departments` | `departments` | Departments |
| `categories` | `categories` | Item categories |
| `ingredient_groups` | `ingredient_groups` | Ingredient groups |
| `ingredients` | `ingredients` | Ingredients |
| `compounds` | `compounds` | Compounds/recipes |
| `menus` | `goods` | Menu items (dishes) |
| `modifiers` | `modifiers` | Modifiers for menu items |
| `dedication_groups` | `deduction_act_groups` | Deduction/act groups |
| `transaction_groups` | `group_transactions` | Transaction groups |
| `halls` | `halls` | Restaurant halls/areas |
| `users` | `users` | All users |
| `admin` | `users` | Users with admin role |
| `manager` | `users` | Users with manager role |
| `waiter` | `users` | Users with waiter role |
| `cashier` | `users` | Users with cashier role |
| `kitchen` | `users` | Users with kitchen role |
| `user` | `users` | Users with basic user role |
| `superadmin` | `users` | Users with superadmin role |

## Response Structure

### Success Response (200 OK)

```json
{
  "storages": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Main Warehouse"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Kitchen Fridge"
    }
  ],
  "departments": [
    {
      "id": "650e8400-e29b-41d4-a716-446655440000",
      "name": "Sales"
    }
  ],
  "halls": [
    {
      "id": "750e8400-e29b-41d4-a716-446655440000",
      "name": "Main Hall"
    },
    {
      "id": "750e8400-e29b-41d4-a716-446655440001",
      "name": "VIP Hall"
    }
  ],
  "admin": [
    {
      "id": "850e8400-e29b-41d4-a716-446655440000",
      "name": "John Admin"
    }
  ],
  "users": [
    {
      "id": "850e8400-e29b-41d4-a716-446655440000",
      "name": "John Admin"
    },
    {
      "id": "850e8400-e29b-41d4-a716-446655440001",
      "name": "Jane Manager"
    },
    {
      "id": "950e8400-e29b-41d4-a716-446655440000",
      "name": "Alice Waiter"
    },
    {
      "id": "950e8400-e29b-41d4-a716-446655440001",
      "name": "Bob Waiter"
    }
  ],
  "admin": [
    {
      "id": "850e8400-e29b-41d4-a716-446655440000",
      "name": "John Admin"
    }
  ],
  "waiter": [
    {
      "id": "950e8400-e29b-41d4-a716-446655440000",
      "name": "Alice Waiter"
    },
    {
      "id": "950e8400-e29b-41d4-a716-446655440001",
      "name": "Bob Waiter"
    }
  ]
}
```

### Empty Request (200 OK)

If `include` parameter is empty or omitted, returns an empty object:

```json
{}
```

## Example Requests

### Retrieve Multiple Entities

```bash
GET /api/v1/metadata?include=storages,departments,ingredients
```

### Retrieve Single Entity

```bash
GET /api/v1/metadata?include=categories
```

### Retrieve Halls and Specific Role Users

```bash
GET /api/v1/metadata?include=halls,admin,manager,waiter
```

### Retrieve All Users

```bash
GET /api/v1/metadata?include=users
```

### Retrieve All Available Entities

```bash
GET /api/v1/metadata?include=storages,departments,categories,ingredient_groups,ingredients,compounds,menus,modifiers,dedication_groups,transaction_groups,halls,users,admin,manager,waiter,cashier,kitchen,user,superadmin
```

### Empty Include

```bash
GET /api/v1/metadata?include=
```

Returns `{}`.

## Error Responses

### 400 Bad Request — Invalid Entity

```json
{
  "status": "error",
  "message": "Invalid entity: users",
  "code": 400
}
```

Returned when the `include` parameter contains an entity name not in the whitelist.

### 500 Internal Server Error — Database Error

```json
{
  "status": "error",
  "message": "Database error",
  "code": 500
}
```

Returned when a database query fails.

## Technical Details

- **Data Sorting:** All records are sorted by `name` in ascending alphabetical order.
- **Soft Deletes:** Only active records (where `deleted_at = 0`) are returned.
- **No Pagination:** All records for requested entities are returned in a single response — there are no pagination parameters.
- **Performance:** Queries are optimized to select only `id` and `name` columns, minimizing data transfer.
- **Whitelist Security:** Entity names are validated against a whitelist before database access to prevent SQL injection.

## Usage Notes

- The endpoint requires authentication via Bearer token.
- Each comma-separated entity is trimmed of leading/trailing whitespace.
- Empty entity names (e.g., `storages,,departments`) are ignored.
- Results for each entity are keyed by the input entity name (`storages`, `departments`, etc.), not the underlying table name.
