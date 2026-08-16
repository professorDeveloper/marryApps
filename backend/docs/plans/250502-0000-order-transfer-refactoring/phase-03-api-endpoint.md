# Phase 3: Transfer API Endpoint Implementation

**Complexity**: M (Medium)  
**Risk**: M (Medium)  
**Duration**: 2-3 hours  
**Owner**: Backend Engineer

---

## Objective

Implement the HTTP endpoint for transferring orders between tables:

```
POST /api/v1/orders/{id}/transfer
Content-Type: application/json

{
  "target_table_id": "c0f18a64-7f5c-4425-9414-1b01cddee9d9"
}

Response (200 OK):
{
  "status": "success",
  "data": {
    "id": "...",
    "table_id": "c0f18a64-7f5c-4425-9414-1b01cddee9d9",
    "active_session_id": "d5e6f7a8-b9c0-4d1e-8f2g-h3i4j5k6l7m8",
    ...
  }
}
```

---

## Current State

✅ HTTP handler pattern established in `handler/order.go`  
✅ Request validation middleware exists  
✅ Error handling framework in place  
❌ Transfer endpoint does not exist  
❌ No handler for POST /orders/:id/transfer

---

## Implementation Details

### 3.1 Create Transfer Request Model

**File**: `internal/model/order.go`

**Add request model**:

```go
// OrderTransferRequest is the request to transfer an order to a different table
type OrderTransferRequest struct {
    TargetTableID string `json:"target_table_id" validate:"required" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
}
```

**Rationale**: Follows REST convention for resource operations; simple and focused request

---

### 3.2 Implement Handler

**File**: `internal/handler/order.go`

**Add method to OrderHandler**:

```go
// TransferOrder handles POST /orders/:id/transfer
func (h *OrderHandler) TransferOrder(c echo.Context) error {
    // 1. Extract order ID from URL
    orderID := c.Param("id")
    if orderID == "" {
        return c.JSON(http.StatusBadRequest, map[string]interface{}{
            "status":  "error",
            "message": "order_id is required",
            "code":    http.StatusBadRequest,
        })
    }
    
    // 2. Parse request body
    var req model.OrderTransferRequest
    if err := c.BindJSON(&req); err != nil {
        return c.JSON(http.StatusBadRequest, map[string]interface{}{
            "status":  "error",
            "message": "invalid request body",
            "code":    http.StatusBadRequest,
        })
    }
    
    // 3. Validate request
    if err := h.validator.Struct(&req); err != nil {
        return c.JSON(http.StatusUnprocessableEntity, map[string]interface{}{
            "status":  "error",
            "message": fmt.Sprintf("validation error: %v", err),
            "code":    http.StatusUnprocessableEntity,
        })
    }
    
    // 4. Call service
    ctx := c.Request().Context()
    order, err := h.orderSvc.TransferOrder(ctx, orderID, req.TargetTableID)
    if err != nil {
        // Determine error type and respond accordingly
        if strings.Contains(err.Error(), "not found") {
            return c.JSON(http.StatusNotFound, map[string]interface{}{
                "status":  "error",
                "message": err.Error(),
                "code":    http.StatusNotFound,
            })
        }
        if strings.Contains(err.Error(), "not available") || strings.Contains(err.Error(), "occupied") {
            return c.JSON(http.StatusConflict, map[string]interface{}{
                "status":  "error",
                "message": err.Error(),
                "code":    http.StatusConflict,
            })
        }
        if strings.Contains(err.Error(), "completed") || strings.Contains(err.Error(), "no active session") {
            return c.JSON(http.StatusBadRequest, map[string]interface{}{
                "status":  "error",
                "message": err.Error(),
                "code":    http.StatusBadRequest,
            })
        }
        // Generic server error
        h.logger.Error("transfer order failed", "order_id", orderID, "error", err)
        return c.JSON(http.StatusInternalServerError, map[string]interface{}{
            "status":  "error",
            "message": "transfer failed",
            "code":    http.StatusInternalServerError,
        })
    }
    
    // 5. Return success response
    return c.JSON(http.StatusOK, map[string]interface{}{
        "status":  "success",
        "message": "Order transferred successfully",
        "data":    order,
        "code":    http.StatusOK,
    })
}
```

**Rationale**:
- Follows existing handler pattern in the codebase
- Validates request with struct validator
- Maps service errors to appropriate HTTP status codes
- Returns order response with active_session_id

---

### 3.3 Register Route

**File**: `internal/handler/order.go`

**In the `RegisterRoutes` method** (or equivalent in `internal/app/app.go`):

```go
func (h *OrderHandler) RegisterRoutes(e *echo.Echo) {
    // ... existing routes ...
    
    // Transfer endpoint
    ordersGroup := e.Group("/api/v1/orders")
    ordersGroup.POST("/:id/transfer", h.TransferOrder)
    
    // Alternative: if routes are registered in app.go
    // e.POST("/api/v1/orders/:id/transfer", h.TransferOrder)
}
```

**Or if using centralized routing** in `internal/app/app.go`:

```go
func (app *App) setupRoutes() {
    // ... existing routes ...
    
    e.POST("/api/v1/orders/:id/transfer", app.orderHandler.TransferOrder)
}
```

---

### 3.4 Error Handling Strategy

**Map service errors to HTTP status**:

| Service Error | HTTP Status | Reason |
|---|---|---|
| `order not found` | 404 Not Found | Resource doesn't exist |
| `target table not found` | 404 Not Found | Resource doesn't exist |
| `no active session` | 400 Bad Request | Invalid operation state |
| `cannot transfer completed order` | 400 Bad Request | Invalid operation state |
| `target table is not available` | 409 Conflict | Resource conflict (occupied) |
| `database transaction failed` | 500 Internal Server Error | Server error |

**Rationale**: RESTful error semantics; client can react appropriately

---

## Verification Steps

### Task 1: Add handler method

**Check**:
```bash
grep -n "func (h \*OrderHandler) TransferOrder" internal/handler/order.go
# Expected: Method exists
```

### Task 2: Register route

**Check**:
```bash
grep -n "POST.*:id/transfer" internal/handler/order.go internal/app/app.go
# Expected: Route registered
```

### Task 3: Verify compilation

**Command**:
```bash
cd app
go build ./cmd/main.go
# Expected: No compilation errors
```

### Task 4: Integration test

**Test file**: `tests/integration/order_transfer_test.go` (create new)

```go
func TestTransferOrderEndpoint(t *testing.T) {
    // Setup: Create test database, tables, order
    
    // Test 1: Valid transfer Simple → Time-Based
    // POST /api/v1/orders/{id}/transfer
    // Expected: 200 OK, active_session_id returned
    
    // Test 2: Transfer to occupied table
    // Expected: 409 Conflict
    
    // Test 3: Transfer non-existent order
    // Expected: 404 Not Found
    
    // Test 4: Transfer completed order
    // Expected: 400 Bad Request
    
    // Test 5: Invalid target_table_id format
    // Expected: 422 Unprocessable Entity
}
```

### Task 5: Test with curl

**Command**:
```bash
# Start dev server
make run-dev

# In another terminal
# Create order first
ORDER_ID="11111111-1111-1111-1111-111111111111"
TABLE_ID="c0f18a64-7f5c-4425-9414-1b01cddee9d9"

# Test transfer endpoint
curl -X POST http://localhost:8080/api/v1/orders/$ORDER_ID/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d "{\"target_table_id\": \"$TABLE_ID\"}"

# Expected response (200 OK):
# {
#   "status": "success",
#   "message": "Order transferred successfully",
#   "data": {
#     "id": "...",
#     "table_id": "c0f18a64-7f5c-4425-9414-1b01cddee9d9",
#     "active_session_id": "d5e6f7a8-b9c0-4d1e-8f2g-h3i4j5k6l7m8",
#     ...
#   }
# }
```

---

### Task 6: Swagger Documentation

**File**: `internal/api/swagger.yaml` (or if using code generation)

**Add endpoint documentation**:

```yaml
/api/v1/orders/{id}/transfer:
  post:
    summary: Transfer order to a different table
    tags:
      - Orders
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
          format: uuid
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              target_table_id:
                type: string
                format: uuid
                example: "c0f18a64-7f5c-4425-9414-1b01cddee9d9"
            required:
              - target_table_id
    responses:
      '200':
        description: Order transferred successfully
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/OrderResponse'
      '400':
        description: Invalid order state (completed, no session)
      '404':
        description: Order or table not found
      '409':
        description: Target table not available (occupied)
```

---

## Exit Criteria

✅ `TransferOrder` handler implemented in `OrderHandler`  
✅ Route registered at `POST /api/v1/orders/:id/transfer`  
✅ Handler validates request and parses target_table_id  
✅ Error mapping to HTTP status codes correct  
✅ Handler calls service method and returns OrderResponse with active_session_id  
✅ Compilation successful  
✅ Integration tests pass (all 5 scenarios)  
✅ curl test successful with real token  
✅ Swagger documentation updated

---

## Files to Create/Modify

| File | Type | Change |
|------|------|--------|
| `internal/model/order.go` | Modify | Add OrderTransferRequest |
| `internal/handler/order.go` | Modify | Add TransferOrder method, register route |
| `internal/api/swagger.yaml` | Modify | Add endpoint documentation |
| `tests/integration/order_transfer_test.go` | Create | Integration tests |

---

## Notes & Gotchas

- ⚠️ **Authentication required**: Endpoint needs auth middleware (inherited from group)
- ⚠️ **Tenant context**: Request context must include brand_id from JWT
- 📌 **Error messages**: Use descriptive but non-technical messages for 4xx errors
- 📌 **HTTP semantics**: 409 Conflict is appropriate for resource state issues
- 🚀 **Response format**: Consistent with existing API responses in codebase

---

## Rollback Plan

If issues arise:
1. Remove route registration
2. Remove handler method
3. Remove request model
4. Verify compilation

---

**Next Phase**: Phase 4 - Billing Engine Updates
