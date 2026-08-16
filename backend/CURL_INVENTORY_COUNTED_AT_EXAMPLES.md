# CURL Examples for Inventory CountedAt Feature

This document provides CURL examples for testing the new `counted_at` field in inventory APIs.

## Base URL
Replace `http://localhost:8080` with your actual API base URL.

## Headers
All requests should include:
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 1. Create Inventory with CountedAt

### Request
```bash
curl -X POST http://localhost:8080/api/v1/inventories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "date": "2024-01-15",
    "counted_at": "2024-01-15T14:30:00+05:00",
    "storage_id": "d1f29b75-8g6d-5536-0525-2c12deeef0e0",
    "description": "Monthly inventory count",
    "status": "draft"
  }'
```

### Response
```json
{
  "id": "c0f18a64-7f5c-4425-9414-1b01cddee9d9",
  "number": 1,
  "date": "2024-01-15T00:00:00Z",
  "counted_at": "2024-01-15T14:30:00+05:00",
  "storage_id": "d1f29b75-8g6d-5536-0525-2c12deeef0e0",
  "description": "Monthly inventory count",
  "description_i18n": null,
  "status": "draft",
  "surplus_amount": "0",
  "shortage_amount": "0",
  "remaining_amount": "0",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

---

## 2. Create Inventory Batch with CountedAt

### Request
```bash
curl -X POST http://localhost:8080/api/v1/inventories/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "date": "2024-01-15",
    "counted_at": "2024-01-15T16:45:30+05:00",
    "storage_id": "d1f29b75-8g6d-5536-0525-2c12deeef0e0",
    "description": "Evening inventory batch",
    "status": "active",
    "items": [
      {
        "ingredient_id": "123e4567-e89b-12d3-a456-426614174000",
        "counted_quantity": "50.5"
      },
      {
        "ingredient_id": "223e4567-e89b-12d3-a456-426614174001",
        "counted_quantity": "25.0"
      }
    ]
  }'
```

### Response
```json
{
  "inventory": {
    "id": "c0f18a64-7f5c-4425-9414-1b01cddee9d9",
    "number": 2,
    "date": "2024-01-15T00:00:00Z",
    "counted_at": "2024-01-15T16:45:30+05:00",
    "storage_id": "d1f29b75-8g6d-5536-0525-2c12deeef0e0",
    "description": "Evening inventory batch",
    "description_i18n": null,
    "status": "active",
    "surplus_amount": "0",
    "shortage_amount": "0",
    "remaining_amount": "0",
    "created_at": "2024-01-15T12:00:00Z",
    "updated_at": "2024-01-15T12:00:00Z"
  }
}
```

---

## 3. Update Inventory with CountedAt

### Request
```bash
curl -X PUT http://localhost:8080/api/v1/inventories/c0f18a64-7f5c-4425-9414-1b01cddee9d9 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "date": "2024-01-16",
    "counted_at": "2024-01-16T09:15:00+05:00",
    "description": "Updated inventory count",
    "status": "active"
  }'
```

### Response
```json
{
  "id": "c0f18a64-7f5c-4425-9414-1b01cddee9d9",
  "number": 1,
  "date": "2024-01-16T00:00:00Z",
  "counted_at": "2024-01-16T09:15:00+05:00",
  "storage_id": "d1f29b75-8g6d-5536-0525-2c12deeef0e0",
  "description": "Updated inventory count",
  "description_i18n": null,
  "status": "active",
  "surplus_amount": "0",
  "shortage_amount": "0",
  "remaining_amount": "0",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-16T09:15:00Z"
}
```

---

## 4. Upsert Inventory Items

### Request
```bash
curl -X POST http://localhost:8080/api/v1/inventories/c0f18a64-7f5c-4425-9414-1b01cddee9d9/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "items": [
      {
        "ingredient_id": "123e4567-e89b-12d3-a456-426614174000",
        "counted_quantity": "100.0"
      },
      {
        "ingredient_id": "223e4567-e89b-12d3-a456-426614174001",
        "counted_quantity": "75.5"
      }
    ]
  }'
```

### Response
```json
{
  "id": "c0f18a64-7f5c-4425-9414-1b01cddee9d9",
  "number": 1,
  "date": "2024-01-15T00:00:00Z",
  "counted_at": "2024-01-15T14:30:00+05:00",
  "storage_id": "d1f29b75-8g6d-5536-0525-2c12deeef0e0",
  "description": "Monthly inventory count",
  "description_i18n": null,
  "status": "active",
  "surplus_amount": "0",
  "shortage_amount": "0",
  "remaining_amount": "0",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T18:00:00Z"
}
```

---

## 5. Get Inventory by ID

### Request
```bash
curl -X GET http://localhost:8080/api/v1/inventories/c0f18a64-7f5c-4425-9414-1b01cddee9d9 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response
```json
{
  "id": "c0f18a64-7f5c-4425-9414-1b01cddee9d9",
  "number": 1,
  "date": "2024-01-15T00:00:00Z",
  "counted_at": "2024-01-15T14:30:00+05:00",
  "storage_id": "d1f29b75-8g6d-5536-0525-2c12deeef0e0",
  "description": "Monthly inventory count",
  "description_i18n": null,
  "status": "active",
  "surplus_amount": "0",
  "shortage_amount": "0",
  "remaining_amount": "0",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T14:30:00Z"
}
```

---

## 6. Error Response - Invalid counted_at Format

### Request
```bash
curl -X POST http://localhost:8080/api/v1/inventories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "date": "2024-01-15",
    "counted_at": "invalid-timestamp",
    "storage_id": "d1f29b75-8g6d-5536-0525-2c12deeef0e0",
    "status": "draft"
  }'
```

### Response (400 Bad Request)
```json
{
  "message": "Invalid request data",
  "error": "invalid counted_at: parsing time \"invalid-timestamp\" as \"2006-01-02T15:04:05Z07:00\": cannot parse \"invalid-timestamp\" as \"2006-01-02\"",
  "code": 400
}
```

---

## Notes

### counted_at Format
- **Required**: `counted_at` is required for new inventory creation requests
- **Format**: RFC3339 timestamp (e.g., `2024-01-15T14:30:00+05:00`)
- **Timezone**: Include timezone offset (e.g., `+05:00` for UTC+5)
- **Precision**: Supports up to nanosecond precision if needed
- **Validation**: Invalid format returns 400 Bad Request

### Backward Compatibility
- The existing `date` column is preserved and not removed
- Existing inventories will have `counted_at` backfilled from `applied_at` or `date::timestamptz`
- All existing APIs continue to work

### Sorting
- Inventories are now sorted by: `date DESC, counted_at DESC, number DESC`
- This ensures precise ordering within the same day based on actual count time

### Freeze Logic
- Stock mutations are now locked by exact `counted_at` timestamp comparison
- No date normalization - direct timestamp comparison for precision
- Affects: invoice, outgoing invoice, shipment, transfer, deduction, order stock consumption

---

## UpdateInventory Business Rules

### counted_at Change Rules
- **Draft inventory**: counted_at can be changed
- **Active inventory**: counted_at is immutable (cannot be changed)
- **Status transition with counted_at change**: Stock movements use the final counted_at consistently

### Validation Errors
- Invalid counted_at format → 400 Bad Request
- Attempting to change counted_at on active inventory → 400 Bad Request

---

## UpdateInventory Test Cases

### Test Case 1: Draft Inventory - Change counted_at Only (ALLOWED)

### Request
```bash
curl -X PUT http://localhost:8080/api/v1/inventories/c0f18a64-7f5c-4425-9414-1b01cddee9d9 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "counted_at": "2024-01-15T18:00:00+05:00"
  }'
```

### Response (200 OK)
```json
{
  "id": "c0f18a64-7f5c-4425-9414-1b01cddee9d9",
  "number": 1,
  "date": "2024-01-15T00:00:00Z",
  "counted_at": "2024-01-15T18:00:00+05:00",
  "storage_id": "d1f29b75-8g6d-5536-0525-2c12deeef0e0",
  "description": "Monthly inventory count",
  "status": "draft",
  "surplus_amount": "0",
  "shortage_amount": "0",
  "remaining_amount": "0",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T18:00:00Z"
}
```

---

### Test Case 2: Draft Inventory - Change counted_at + Status draft→active (ALLOWED)

### Request
```bash
curl -X PUT http://localhost:8080/api/v1/inventories/c0f18a64-7f5c-4425-9414-1b01cddee9d9 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "counted_at": "2024-01-15T20:00:00+05:00",
    "status": "active"
  }'
```

### Response (200 OK)
```json
{
  "id": "c0f18a64-7f5c-4425-9414-1b01cddee9d9",
  "number": 1,
  "date": "2024-01-15T00:00:00Z",
  "counted_at": "2024-01-15T20:00:00+05:00",
  "storage_id": "d1f29b75-8g6d-5536-0525-2c12deeef0e0",
  "description": "Monthly inventory count",
  "status": "active",
  "surplus_amount": "0",
  "shortage_amount": "0",
  "remaining_amount": "0",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T20:00:00Z"
}
```

**Note**: Stock movements are written with effective_at = 2024-01-15T20:00:00+05:00 (the new counted_at)

---

### Test Case 3: Active Inventory - Change counted_at (REJECTED)

### Request
```bash
curl -X PUT http://localhost:8080/api/v1/inventories/c0f18a64-7f5c-4425-9414-1b01cddee9d9 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "counted_at": "2024-01-16T10:00:00+05:00"
  }'
```

### Response (400 Bad Request)
```json
{
  "message": "Invalid request data",
  "error": "cannot change counted_at for active inventory",
  "code": 400
}
```

---

### Test Case 4: Active Inventory - counted_at Unchanged, Other Fields Change (ALLOWED)

### Request
```bash
curl -X PUT http://localhost:8080/api/v1/inventories/c0f18a64-7f5c-4425-9414-1b01cddee9d9 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "description": "Updated description for active inventory"
  }'
```

### Response (200 OK)
```json
{
  "id": "c0f18a64-7f5c-4425-9414-1b01cddee9d9",
  "number": 1,
  "date": "2024-01-15T00:00:00Z",
  "counted_at": "2024-01-15T14:30:00+05:00",
  "storage_id": "d1f29b75-8g6d-5536-0525-2c12deeef0e0",
  "description": "Updated description for active inventory",
  "status": "active",
  "surplus_amount": "0",
  "shortage_amount": "0",
  "remaining_amount": "0",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T21:00:00Z"
}
```

---

### Test Case 5: Draft Inventory - Status Change Without counted_at (ALLOWED)

### Request
```bash
curl -X PUT http://localhost:8080/api/v1/inventories/c0f18a64-7f5c-4425-9414-1b01cddee9d9 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "active"
  }'
```

### Response (200 OK)
```json
{
  "id": "c0f18a64-7f5c-4425-9414-1b01cddee9d9",
  "number": 1,
  "date": "2024-01-15T00:00:00Z",
  "counted_at": "2024-01-15T14:30:00+05:00",
  "storage_id": "d1f29b75-8g6d-5536-0525-2c12deeef0e0",
  "description": "Monthly inventory count",
  "status": "active",
  "surplus_amount": "0",
  "shortage_amount": "0",
  "remaining_amount": "0",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T21:30:00Z"
}
```

**Note**: Stock movements use existing counted_at (2024-01-15T14:30:00+05:00)
