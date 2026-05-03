# Order Transfer Endpoint - Complete API Documentation

## Overview

The `POST /api/v1/orders/{session_id}/transfer` endpoint enables seamless transfer of orders from one table to another within a café system. This operation is designed for scenarios where customers need to be moved between tables (e.g., for better seating, combining tables, or separating parties). The endpoint ensures data integrity, billing accuracy, and proper session lifecycle management through atomic transactions.

**Base URL:** `http://localhost:8080/api/v1`

**Endpoint:** `POST /orders/{session_id}/transfer`

**Protocol:** HTTP/REST

**Content-Type:** `application/json`

**Response Format:** JSON

---

## Authentication & Authorization

### Required Authentication
- **Type:** Bearer Token (JWT)
- **Header:** `Authorization: Bearer <token>`
- **Scope:** Must include user context (user_id, role)

### Required Permissions
Users must have one of the following roles:
- `waiter` - Standard waiter account
- `manager` - Restaurant manager
- `admin` - System administrator
- Any role with the `can_control_table_timer` permission

**Note:** If authorization fails or token is missing, the endpoint returns `401 Unauthorized`.

---

## Request Specification

### Path Parameters

| Parameter | Type | Required | Format | Description |
|-----------|------|----------|--------|-------------|
| `session_id` | string | Yes | UUID v4 | Unique identifier of the order/session to be transferred. Must be a valid UUID format (e.g., `c0f18a64-7f5c-4425-9414-1b01cddee9d9`). |

**Validation Rules:**
- Must not be empty
- Must be valid UUID v4 format
- Order must exist in the database
- Order must have an active session

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `lang` | string | No | `uz` | Language preference for response messages. Supported: `uz` (Uzbek), `ru` (Russian), `en` (English) |

### Request Body

```json
{
  "target_table_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

#### Body Schema

| Field | Type | Required | Format | Constraints | Description |
|-------|------|----------|--------|-------------|-------------|
| `target_table_id` | string | Yes | UUID v4 | Must be valid UUID | The UUID of the target table where the order will be moved. Must exist and be available for transfer. |

**Validation Rules:**
- `target_table_id` is mandatory
- Must be a valid UUID v4 format
- Cannot be the same as the current order's table_id
- Target table must exist in the database
- Target table status must be `free` (not occupied)

### Request Headers

```http
POST /api/v1/orders/c0f18a64-7f5c-4425-9414-1b01cddee9d9/transfer HTTP/1.1
Host: localhost:8080
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Accept: application/json
```

---

## Request Examples

### Example 1: Basic Transfer with CURL

```bash
curl -X POST http://localhost:8080/api/v1/orders/c0f18a64-7f5c-4425-9414-1b01cddee9d9/transfer \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "target_table_id": "550e8400-e29b-41d4-a716-446655440001"
  }'
```

### Example 2: Transfer with Language Parameter

```bash
curl -X POST "http://localhost:8080/api/v1/orders/c0f18a64-7f5c-4425-9414-1b01cddee9d9/transfer?lang=ru" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "target_table_id": "550e8400-e29b-41d4-a716-446655440001"
  }'
```

### Example 3: Using JavaScript/Axios

```javascript
const axios = require('axios');

const config = {
  method: 'post',
  url: 'http://localhost:8080/api/v1/orders/c0f18a64-7f5c-4425-9414-1b01cddee9d9/transfer',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  data: {
    target_table_id: '550e8400-e29b-41d4-a716-446655440001'
  }
};

axios(config)
  .then(function(response) {
    console.log(JSON.stringify(response.data, null, 2));
  })
  .catch(function(error) {
    console.log(error);
  });
```

### Example 4: Using Python/Requests

```python
import requests
import json

url = "http://localhost:8080/api/v1/orders/c0f18a64-7f5c-4425-9414-1b01cddee9d9/transfer"
headers = {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
}
payload = {
    "target_table_id": "550e8400-e29b-41d4-a716-446655440001"
}

response = requests.post(url, headers=headers, json=payload)
print(json.dumps(response.json(), indent=2))
```

---

## Success Response

### HTTP Status: 200 OK

```json
{
  "status": "ok",
  "message": "Order transferred successfully",
  "data": {
    "id": "c0f18a64-7f5c-4425-9414-1b01cddee9d9",
    "table_id": "550e8400-e29b-41d4-a716-446655440001",
    "waiter_id": "a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5",
    "cashier_id": null,
    "cash_register_id": null,
    "status": "open",
    "guest_count": 4,
    "total_amount": "250000.00",
    "comment": "VIP customer - prefer quiet corner",
    "order_type": "dine_in",
    "scheduled_at": null,
    "reschedule_comment": null,
    "table_type": "time_based",
    "price_per_hour": "50000.00",
    "table_started_at": "2026-05-02T10:00:00Z",
    "table_amount": "12500.00",
    "items_amount": "200000.00",
    "service_percent": "10",
    "service_amount": "20000.00",
    "items": [
      {
        "id": "item-uuid-1",
        "order_id": "c0f18a64-7f5c-4425-9414-1b01cddee9d9",
        "good_id": "good-uuid-1",
        "quantity": 2,
        "price": "100000.00",
        "status": "pending",
        "comment": null,
        "modifiers": [
          {
            "id": "modifier-uuid-1",
            "name": "Extra sauce",
            "price": "5000.00"
          }
        ],
        "created_at": "2026-05-02T10:00:00Z",
        "updated_at": "2026-05-02T10:00:00Z"
      },
      {
        "id": "item-uuid-2",
        "order_id": "c0f18a64-7f5c-4425-9414-1b01cddee9d9",
        "good_id": "good-uuid-2",
        "quantity": 1,
        "price": "100000.00",
        "status": "pending",
        "comment": "No onions",
        "modifiers": [],
        "created_at": "2026-05-02T10:00:00Z",
        "updated_at": "2026-05-02T10:00:00Z"
      }
    ],
    "client_created_at": "2026-05-02T10:00:00Z",
    "paid_at": null,
    "active_session_id": "session-uuid-new",
    "created_at": "2026-05-02T10:00:00Z",
    "updated_at": "2026-05-02T10:15:30Z"
  }
}
```

### Response Fields Explanation

#### Root Level
| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Response status: `ok` (success) or `error` (failure) |
| `message` | string | Human-readable message about the operation result |
| `data` | object | Complete order details after transfer (null if error) |

#### Order Data Fields

**Core Identifiers:**
| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `id` | string (UUID) | `c0f18a64-7f5c-4425-9414-1b01cddee9d9` | Unique order identifier (immutable, doesn't change after transfer) |
| `table_id` | string (UUID) | `550e8400-e29b-41d4-a716-446655440001` | **Updated** to target table UUID |
| `active_session_id` | string (UUID) | `session-uuid-new` | **New** session ID created on target table |

**User & Staff Assignment:**
| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `waiter_id` | string (UUID) / null | `a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5` | Assigned waiter (transferred with order) |
| `cashier_id` | string (UUID) / null | null | Assigned cashier (if any) |
| `cash_register_id` | string (UUID) / null | null | Associated cash register (if any) |

**Order Status & Type:**
| Field | Type | Allowed Values | Description |
|-------|------|-----------------|-------------|
| `status` | string | `open`, `preparing`, `ready`, `serving`, `completed`, `cancelled` | Current order status |
| `order_type` | string | `dine_in`, `takeaway` | Type of order (remains unchanged) |

**Guest Information:**
| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `guest_count` | integer | 4 | Number of guests assigned to this order |
| `comment` | string / null | `VIP customer...` | Order notes or special instructions |

**Table Configuration:**
| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `table_type` | string | `time_based` | Session type: `time_based` (hourly charge), `item_based` (per-item only), or null (no timed session) |
| `price_per_hour` | string | `50000.00` | Hourly rate if table_type is time_based |
| `table_started_at` | timestamp | `2026-05-02T10:00:00Z` | When the session started on source table |

**Billing & Amounts** (All as strings for precision):
| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `items_amount` | string | `200000.00` | Total cost of all order items |
| `table_amount` | string | `12500.00` | Accumulated time-based charge (transferred from source table) |
| `service_percent` | string | `10` | Service charge percentage |
| `service_amount` | string | `20000.00` | Calculated service charge = (items_amount + table_amount) × service_percent / 100 |
| `total_amount` | string | `250000.00` | Total = items_amount + table_amount + service_amount |

**Scheduling** (for reservations):
| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `scheduled_at` | timestamp / null | null | Scheduled service time (null for immediate orders) |
| `reschedule_comment` | string / null | null | Comment if order was rescheduled |

**Timestamps:**
| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `client_created_at` | timestamp / null | `2026-05-02T10:00:00Z` | When order was created from client side |
| `created_at` | timestamp | `2026-05-02T10:00:00Z` | Server creation timestamp (immutable) |
| `updated_at` | timestamp | `2026-05-02T10:15:30Z` | Last update timestamp (updated after transfer) |

#### Items Array Details

Each item in the `items` array contains:

```json
{
  "id": "item-uuid-1",
  "order_id": "c0f18a64-7f5c-4425-9414-1b01cddee9d9",
  "good_id": "good-uuid-1",
  "quantity": 2,
  "price": "100000.00",
  "status": "pending",
  "comment": "Special instructions",
  "modifiers": [
    {
      "id": "modifier-uuid-1",
      "name": "Extra sauce",
      "price": "5000.00"
    }
  ],
  "created_at": "2026-05-02T10:00:00Z",
  "updated_at": "2026-05-02T10:00:00Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique item identifier |
| `order_id` | string | Parent order UUID |
| `good_id` | string | Product/good UUID |
| `quantity` | integer | Number of items ordered |
| `price` | string | Unit price per item |
| `status` | string | Item status: `pending`, `cooking`, `ready`, `served`, `cancelled` |
| `comment` | string / null | Special instructions for this item |
| `modifiers` | array | Additional modifiers (toppings, sides, etc.) |
| `created_at` | timestamp | When item was added |
| `updated_at` | timestamp | Last modification time |

---

## Error Responses

### 400 Bad Request

**Scenario 1: Missing order ID in path**
```json
{
  "status": "error",
  "message": "order_id is required",
  "details": "order_id must be provided in URL path",
  "code": 400
}
```

**Scenario 2: Invalid order ID format**
```json
{
  "status": "error",
  "message": "invalid order id format",
  "details": "invalid UUID format",
  "code": 400
}
```

**Scenario 3: Missing target_table_id in request body**
```json
{
  "status": "error",
  "message": "invalid request body",
  "details": "target_table_id is required",
  "code": 400
}
```

**Scenario 4: Invalid target_table_id format**
```json
{
  "status": "error",
  "message": "invalid request body",
  "details": "invalid target_table_id format: not a valid UUID",
  "code": 400
}
```

**Scenario 5: Malformed JSON**
```json
{
  "status": "error",
  "message": "invalid request body",
  "details": "unexpected character in JSON body",
  "code": 400
}
```

**Scenario 6: Order in completed state**
```json
{
  "status": "error",
  "message": "transfer failed",
  "details": "cannot transfer completed order",
  "code": 400
}
```

**Scenario 7: No active session on order**
```json
{
  "status": "error",
  "message": "transfer failed",
  "details": "no active session for order",
  "code": 400
}
```

### 401 Unauthorized

**Scenario 1: Missing authorization header**
```json
{
  "status": "error",
  "message": "unauthorized",
  "details": "missing authorization header",
  "code": 401
}
```

**Scenario 2: Invalid token**
```json
{
  "status": "error",
  "message": "unauthorized",
  "details": "invalid token",
  "code": 401
}
```

**Scenario 3: Insufficient permissions**
```json
{
  "status": "error",
  "message": "unauthorized",
  "details": "user role cannot control table timers",
  "code": 401
}
```

### 404 Not Found

**Scenario 1: Order not found**
```json
{
  "status": "error",
  "message": "transfer failed",
  "details": "order not found",
  "code": 404
}
```

**Scenario 2: Target table not found**
```json
{
  "status": "error",
  "message": "transfer failed",
  "details": "target table not found",
  "code": 404
}
```

### 409 Conflict

**Scenario 1: Target table occupied or not available**
```json
{
  "status": "error",
  "message": "transfer failed",
  "details": "target table is not available",
  "code": 409
}
```

**Scenario 2: Target table status is not "free"**
```json
{
  "status": "error",
  "message": "transfer failed",
  "details": "target table status is occupied - cannot accept transfer",
  "code": 409
}
```

### 500 Internal Server Error

**Scenario 1: Database connection error**
```json
{
  "status": "error",
  "message": "transfer failed",
  "details": "failed to get order: database connection error",
  "code": 500
}
```

**Scenario 2: Transaction failure**
```json
{
  "status": "error",
  "message": "transfer failed",
  "details": "failed to update order table: transaction rolled back",
  "code": 500
}
```

**Scenario 3: Unexpected server error**
```json
{
  "status": "error",
  "message": "transfer failed",
  "details": "internal server error",
  "code": 500
}
```

---

## Transfer Operation Details

### Two-Phase Transfer Logic

The transfer operation executes in two distinct phases to ensure data consistency:

#### Phase A: Close Current Session

1. **Retrieve current session** with row-level lock (`FOR UPDATE`)
2. **Validate order state:**
   - Order must exist
   - Must have an active session
   - Session must not be already ended
3. **Close active segments** (for time-based tables):
   - Iterate through all segments of the current session
   - Mark each open segment with `ended_at` timestamp
   - Record `move_out_reason: "transfer"`
   - Track `moved_to_table_id` for audit
4. **Calculate accumulated time:**
   - Sum all `active_seconds` from closed segments
   - Calculate final billing amount based on `price_per_hour`
5. **Close source session:**
   - Set `ended_at` to current timestamp
   - Store final calculated amount
   - Record closing user ID from JWT context

#### Phase B: Open New Session

1. **Validate target table:**
   - Must exist in database
   - Must have status = `free` (not occupied)
   - Must be in same tenant scope
2. **Create new session** on target table:
   - Generate new `session_id`
   - Set `started_at` to current timestamp
   - Inherit table type and pricing from target table
   - Create initial "transfer" segment with `move_in_reason`
3. **Update order references:**
   - Update `orders.table_id` to target table UUID
   - Update `orders.active_session_id` to new session UUID
4. **Update table statuses:**
   - Set source table status to `free`
   - Set target table status to `occupied`
5. **Commit transaction:**
   - All changes committed atomically
   - If any step fails, entire transaction rolls back

### Session Type Preservation

| Source Table Type | Target Table Type | Behavior | Result |
|-------------------|-------------------|----------|--------|
| `time_based` | `time_based` | Session transferred with timing preserved | New timer starts on target table |
| `time_based` | `item_based` | Session converted | Time tracking stops, items-only billing continues |
| `item_based` | `time_based` | Session upgraded | New time-based session created |
| `item_based` | `item_based` | Session transferred as-is | Items-only billing continues |
| `null` | Any | No active session | Cannot transfer (requires active session) |

### Billing Preservation

**What is preserved:**
- ✅ All order items remain unchanged
- ✅ Item prices and quantities unchanged
- ✅ Modifiers attached to items unchanged
- ✅ Accumulated table amount from source table transferred
- ✅ Service percentage and service amount recalculated on total
- ✅ All timestamps remain intact

**What changes:**
- 🔄 `table_id` updated to target table
- 🔄 `active_session_id` updated to new session UUID
- 🔄 `updated_at` timestamp set to transfer time
- 🔄 Source table segments closed and marked with transfer reason

---

## Pre-Transfer Validation Checklist

Before calling the endpoint, ensure:

| Check | Requirement | Error If Failed |
|-------|-------------|-----------------|
| User authenticated | JWT token valid and not expired | 401 Unauthorized |
| User authorized | User has `can_control_table_timer` permission | 401 Unauthorized |
| Order exists | Order ID must exist in database | 404 Not Found |
| Order format valid | Order ID must be valid UUID | 400 Bad Request |
| Order state | Order must not be in `completed` or `cancelled` state | 400 Bad Request |
| Active session | Order must have active session (not ended) | 400 Bad Request |
| Target table exists | Target table UUID must exist | 404 Not Found |
| Target table format | Target table ID must be valid UUID | 400 Bad Request |
| Target table available | Target table status must be `free` | 409 Conflict |
| Target table accessible | Target table must be in same tenant | 400 Bad Request |

---

## Usage Workflows

### Workflow 1: Move Dissatisfied Customer to Better Table

**Scenario:** Customer complains about current seating, manager moves them to a quieter corner table.

```bash
# Step 1: Get current order details (verify order exists and table number)
curl -X GET http://localhost:8080/api/v1/orders/ORDER_ID \
  -H "Authorization: Bearer <token>"

# Step 2: Check target table availability
curl -X GET http://localhost:8080/api/v1/cafe-tables/TARGET_TABLE_ID \
  -H "Authorization: Bearer <token>"

# Step 3: Transfer order if target table is free
curl -X POST http://localhost:8080/api/v1/orders/ORDER_ID/transfer \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "target_table_id": "TARGET_TABLE_ID"
  }'

# Step 4: Verify transfer success - order should show new table_id
curl -X GET http://localhost:8080/api/v1/orders/ORDER_ID \
  -H "Authorization: Bearer <token>"
```

### Workflow 2: Combine Multiple Tables into One

**Scenario:** Two parties join together; move both orders to a larger consolidated table.

```bash
# Move first order to combined table
curl -X POST http://localhost:8080/api/v1/orders/ORDER_1/transfer \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"target_table_id": "COMBINED_TABLE_ID"}'

# Move second order to same combined table
curl -X POST http://localhost:8080/api/v1/orders/ORDER_2/transfer \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"target_table_id": "COMBINED_TABLE_ID"}'
```

### Workflow 3: Split Large Party

**Scenario:** Large party split into two separate tables due to capacity.

```bash
# First, create a new order for the second group on new table
POST /api/v1/orders (create new order on NEW_TABLE_B)

# Then optionally transfer some items from original order to the new order
# (This would be an item-level operation, not handled by this endpoint)

# Or transfer entire existing order if group naturally separates
curl -X POST http://localhost:8080/api/v1/orders/ORDER_SUBSET/transfer \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"target_table_id": "NEW_TABLE_B"}'
```

### Workflow 4: Handling Time-Based Table Transfer

**Scenario:** Customer on hourly-rate table transfers to another hourly-rate table (e.g., moving from dining area to lounge).

```bash
# Source table: time_based with price_per_hour: 50000, accumulated: 15 min = 12500
# Target table: time_based with price_per_hour: 75000

curl -X POST http://localhost:8080/api/v1/orders/ORDER_ID/transfer \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"target_table_id": "LOUNGE_TABLE_ID"}'

# Response will show:
# - Previous table_amount: 12500 (from 15 min on first table)
# - New active_session_id with fresh timer on target table
# - New timer starts from 0 on target table
```

---

## Important Business Rules

1. **No Duplicate Transfers:** Each call to the endpoint moves the order. Calling twice will result in two separate transfers (not idempotent).

2. **Source Table Freed:** After successful transfer, the source table automatically becomes `free` and available for new customers.

3. **Session Continuity:** 
   - The old session is closed and marked with `move_out_reason: "transfer"`
   - A new session is created on target table with `move_in_reason: "transfer"`
   - All segments are properly closed with end timestamps

4. **Billing Accuracy:**
   - Table time accumulated on source table is preserved in final billing
   - New table time starts fresh on target table
   - Customer never loses accumulated charges; they're carried forward

5. **Waiter Assignment:** The waiter assigned to the order travels with the order to the new table.

6. **Constraints:**
   - Cannot transfer to same table (validation should occur on client)
   - Cannot transfer if source table has no session (returns 400)
   - Cannot transfer to occupied target table (returns 409)
   - Cannot transfer completed/paid orders (returns 400)

---

## Performance Considerations

### Response Time
- Typical response time: **50-200ms** depending on server load
- Network latency not included in above estimates
- Includes database transaction, segment processing, and response serialization

### Transaction Duration
- Lock held on source order session during transfer
- Typical lock duration: **10-50ms**
- Lock released after all updates committed

### Database Operations
1. **Reads:** 3-4 queries
   - Get order (with lock)
   - Get current session (with lock)
   - Get target table
   - List segments for closed sessions

2. **Writes:** 5-7 queries
   - Update source session (end)
   - Update segments (close each one)
   - Create new session
   - Create initial transfer segment
   - Update order (new table_id)
   - Update source table status
   - Update target table status

### Scaling Notes
- Transfer operation creates one historical segment per prior segment
- No direct impact on subsequent operations
- Archive old segments periodically for performance

---

## Idempotency & Retry Logic

⚠️ **Warning:** This endpoint is **NOT idempotent**.

- **First call:** Order moves to target table ✅
- **Second call (same request):** Order moves again to target table
- **Third call:** Order moves again

**Recommended retry strategy:**
```javascript
async function transferOrderWithRetry(orderId, targetTableId, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(
        `/api/v1/orders/${orderId}/transfer`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ target_table_id: targetTableId })
        }
      );
      
      if (response.status === 200) return response.json();
      if (response.status >= 400 && response.status < 500) throw new Error('Client error - do not retry');
      
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
      }
    }
  }
  
  throw lastError;
}
```

---

## Rate Limiting

Currently **no rate limiting** is enforced on this endpoint. However:
- Consider implementing client-side rate limiting (max 1 transfer per second per order)
- Server may implement rate limiting in future versions
- Excessive rapid transfers may degrade performance

---

## Related Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/orders/{id}` | GET | Retrieve current order details |
| `/api/v1/orders/{id}` | PUT | Update order (comment, guest_count, etc.) |
| `/api/v1/cafe-tables/{id}` | GET | Check table availability and details |
| `/api/v1/orders/{id}/table-price` | GET | Calculate current table time charge |
| `/api/v1/orders/{id}/pay` | POST | Mark order as paid |
| `/api/v1/orders/{id}/cancel` | POST | Cancel order (closes timer first) |

---

## Testing the Endpoint

### Unit Test Example (Go)

```go
func TestTransferOrder(t *testing.T) {
  // Setup
  handler := setupTestHandler()
  orderId := "c0f18a64-7f5c-4425-9414-1b01cddee9d9"
  targetTableId := "550e8400-e29b-41d4-a716-446655440001"
  
  // Create test context with mock auth
  c := echo.New().NewContext(
    httptest.NewRequest("POST", "/orders/"+orderId+"/transfer", nil),
    httptest.NewResponseWriter(),
  )
  c.SetPath("/orders/:id/transfer")
  c.SetParamNames("id")
  c.SetParamValues(orderId)
  
  // Perform request
  err := handler.TransferOrder(c)
  
  // Assert
  assert.NoError(t, err)
  assert.Equal(t, http.StatusOK, c.Response().StatusCode)
}
```

### Integration Test Example (Postman)

```javascript
// Test: Transfer Order - Success Case
pm.test("Transfer order successfully", function() {
  pm.response.to.have.status(200);
  pm.response.to.have.jsonBody();
  
  var responseData = pm.response.json();
  pm.expect(responseData.status).to.equal("ok");
  pm.expect(responseData.data.table_id).to.equal(pm.environment.get("target_table_id"));
  pm.expect(responseData.data.id).to.equal(pm.environment.get("order_id"));
});
```

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| 404 Order not found | Order ID doesn't exist or wrong format | Verify order ID exists; check format is valid UUID |
| 409 Target table not available | Table is occupied or doesn't exist | Check target table status is `free` |
| 400 No active session | Order has no timer or session ended | Cannot transfer orders without active session |
| 401 Unauthorized | Token missing or user lacks permission | Verify JWT token and user role has transfer permission |
| 500 Transaction failed | Database error during transfer | Check database connectivity; retry after delay |
| Response shows old table_id | Caching issue | Clear browser/API cache; fetch fresh data |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-05-02 | Initial release with two-phase transfer logic |

---

## Support & Contact

For issues or questions regarding this endpoint:
- **API Team:** api-support@company.com
- **Documentation:** https://docs.company.com/api
- **GitHub Issues:** https://github.com/company/api/issues
