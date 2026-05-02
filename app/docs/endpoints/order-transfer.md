# Transfer Order Endpoint

## Overview

The `/api/v1/orders/{id}/transfer` endpoint transfers an order from one table to another. This operation moves the entire order (including all items, pricing, and session state) to a target table while maintaining billing accuracy and session type tracking.

**Endpoint:** `POST /api/v1/orders/{id}/transfer`

**Authentication:** Requires Bearer token with role that can control table timers

**Response Format:** JSON

## Request

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Order ID to transfer |

### Request Body

```json
{
  "target_table_id": "c0f18a64-7f5c-4425-9414-1b01cddee9d9"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target_table_id` | string (UUID) | Yes | UUID of the target table where order will be moved |

## Success Response

**HTTP Status:** 200 OK

```json
{
  "status": "ok",
  "message": "Order transferred successfully",
  "data": {
    "id": "c0f18a64-7f5c-4425-9414-1b01cddee9d9",
    "table_id": "c0f18a64-7f5c-4425-9414-1b01cddee9d9",
    "waiter_id": "a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5",
    "cashier_id": null,
    "cash_register_id": null,
    "status": "open",
    "guest_count": 2,
    "total_amount": "100000",
    "comment": null,
    "order_type": "dine_in",
    "scheduled_at": null,
    "reschedule_comment": null,
    "table_type": "time_based",
    "price_per_hour": "50000",
    "table_started_at": "2026-05-02T10:00:00Z",
    "table_amount": "12500.00",
    "items_amount": "50000",
    "service_percent": "20",
    "service_amount": "10000",
    "items": [
      {
        "id": "c0f18a64-7f5c-4425-9414-1b01cddee9d9",
        "order_id": "a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5",
        "good_id": "d4e5f6a7-b8c9-4a5b-8c9d-e0f1a2b3c4d5",
        "quantity": 2,
        "price": "50000",
        "status": "pending",
        "comment": null,
        "modifiers": [],
        "created_at": "2026-05-02T10:00:00Z",
        "updated_at": "2026-05-02T10:00:00Z"
      }
    ],
    "client_created_at": null,
    "paid_at": null,
    "active_session_id": "d5e6f7a8-b9c0-4d1e-8f2g-h3i4j5k6l7m8",
    "created_at": "2026-05-02T10:00:00Z",
    "updated_at": "2026-05-02T10:00:00Z"
  }
}
```

## Error Responses

### 400 Bad Request

**Missing order ID:**
```json
{
  "status": "error",
  "message": "transfer failed",
  "details": "order_id must be provided in URL path",
  "code": 400
}
```

**Missing target table ID:**
```json
{
  "status": "error",
  "message": "transfer failed",
  "details": "target_table_id is required",
  "code": 400
}
```

**Invalid request body:**
```json
{
  "status": "error",
  "message": "transfer failed",
  "details": "invalid JSON in request body",
  "code": 400
}
```

**Order completed or other invalid state:**
```json
{
  "status": "error",
  "message": "transfer failed",
  "details": "order is completed",
  "code": 400
}
```

**No active session:**
```json
{
  "status": "error",
  "message": "transfer failed",
  "details": "no active session on source table",
  "code": 400
}
```

### 404 Not Found

**Order not found:**
```json
{
  "status": "error",
  "message": "transfer failed",
  "details": "order not found",
  "code": 404
}
```

**Target table not found:**
```json
{
  "status": "error",
  "message": "transfer failed",
  "details": "target table not found",
  "code": 404
}
```

### 409 Conflict

**Target table occupied or not available:**
```json
{
  "status": "error",
  "message": "transfer failed",
  "details": "target table is occupied",
  "code": 409
}
```

### 500 Internal Server Error

**System error:**
```json
{
  "status": "error",
  "message": "transfer failed",
  "details": "database connection error",
  "code": 500
}
```

## Key Features

### Session Type Tracking

The transfer operation respects session type boundaries:
- **Time-based sessions:** Table time tracking is maintained when transferring to another time-based table
- **Item-based sessions:** Operates normally without time considerations
- **Mixed session types:** Transfer validates session type compatibility

### Billing Accuracy

When transferring an order:
1. Existing table amount on source table is preserved
2. Session timer is transferred to target table
3. All items and pricing remain intact
4. Service charges and discounts are maintained

### Stock and Ledger Tracking

- No stock adjustments occur during order transfer (stock tracking is based on order items, not transfers)
- All financial records remain associated with the order

## Example Request

```bash
curl -X POST http://localhost:8080/api/v1/orders/c0f18a64-7f5c-4425-9414-1b01cddee9d9/transfer \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "target_table_id": "550e8400-e29b-41d4-a716-446655440001"
  }'
```

## Usage Notes

1. **Authorization:** Only users with roles that can control table timers (`waiter`, `manager`, `admin`, etc.) can transfer orders

2. **Table Validation:** The target table must:
   - Exist in the system
   - Be available (not occupied with an active order)
   - Be of compatible session type if applicable

3. **Order State:** The order must:
   - Not be in `completed` status
   - Have an active session
   - Be in `open` or `preparing` state for transfer

4. **Session Continuity:** The active session from the source table is transferred to the target table, maintaining timing information

5. **Financial Reconciliation:** All amounts (`table_amount`, `items_amount`, `service_amount`, `total_amount`) are preserved and remain accurate

## Response Fields

### Order Response Structure

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Order UUID |
| `table_id` | string | Current table UUID (updated after transfer) |
| `waiter_id` | string | Assigned waiter UUID (if any) |
| `cashier_id` | string | Assigned cashier UUID (if any) |
| `cash_register_id` | string | Cash register UUID (if applicable) |
| `status` | string | Order status (`open`, `preparing`, `ready`, `serving`, `completed`) |
| `guest_count` | integer | Number of guests |
| `total_amount` | string | Total order amount (items + service + table time) |
| `comment` | string | Order comment |
| `order_type` | string | Type of order (`dine_in`, `takeaway`) |
| `scheduled_at` | timestamp | Scheduled service time (if any) |
| `table_type` | string | Table session type (`time_based`, `item_based`, null) |
| `price_per_hour` | string | Hourly rate for time-based tables |
| `table_started_at` | timestamp | When the session started |
| `table_amount` | string | Charge accumulated from table time |
| `items_amount` | string | Total amount from items |
| `service_percent` | string | Service charge percentage |
| `service_amount` | string | Calculated service charge |
| `items` | array | Order items with details |
| `active_session_id` | string | UUID of active session (transferred to target table) |
| `created_at` | timestamp | Order creation time |
| `updated_at` | timestamp | Order last update time |

## Common Workflows

### Transfer Dine-In Order to Another Table

```bash
POST /api/v1/orders/{order_id}/transfer
Content-Type: application/json

{
  "target_table_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

Response includes updated `table_id` and `active_session_id`.

### Verify Transfer Success

After a successful transfer:
1. Check the returned `table_id` equals the requested `target_table_id`
2. Verify `active_session_id` is set and valid
3. Confirm all items and amounts are preserved

## Technical Details

- **Idempotency:** The endpoint is not idempotent. Calling it twice will move the order twice (to the final destination).
- **Soft Deletes:** No data is deleted during transfer; the order is simply reassigned.
- **Transaction Safety:** The entire transfer operation is atomic.
- **Audit Trail:** The operation creates an update timestamp on the order for audit purposes.

## Related Endpoints

- `GET /api/v1/orders/{id}` — Retrieve current order details
- `GET /api/v1/tables/{id}` — Check table availability
- `POST /api/v1/orders/{id}/table-timer/transfer` — Transfer only the table timer without moving the entire order
