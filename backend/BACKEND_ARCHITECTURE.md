# MARY_AI Backend Architecture Documentation

**Version**: 1.0  
**Date**: 2026-05-02  
**Language**: Go 1.25  
**System**: MARY_AI - Multi-Tenant Restaurant Management & Inventory System

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture & Design Patterns](#architecture--design-patterns)
3. [Core Domain Model](#core-domain-model)
4. [Inventory Management System](#inventory-management-system)
5. [Stock Management & Tracking](#stock-management--tracking)
6. [Invoice & Supplier System](#invoice--supplier-system)
7. [Order System & Stock Consumption](#order-system--stock-consumption)
8. [Multi-Tenancy Architecture](#multi-tenancy-architecture)
9. [Data Persistence Layer](#data-persistence-layer)
10. [Feature Flags](#feature-flags)
11. [Key Services](#key-services)
12. [API Layer](#api-layer)
13. [Stock Movement Tracking](#stock-movement-tracking)
14. [Time-Aware Inventory](#time-aware-inventory)

---

## System Overview

MARY_AI is a **comprehensive Go-based backend system** for multi-tenant restaurant inventory and point-of-sale management. It provides:

- **Inventory Tracking**: Real-time stock levels, batch tracking, expiry management
- **Supplier Management**: Invoice processing, stock receiving, cost tracking
- **Order Management**: Creating orders, stock consumption, modifiers
- **Financial**: Payment processing, bill management, profitability analysis
- **Analytics**: Dashboard, ingredient reports, trend analysis
- **Multi-Tenant**: Isolated data per restaurant/branch with shared infrastructure

### Tech Stack

| Component | Technology | Details |
|-----------|------------|---------|
| Language | Go 1.25 | High-performance, concurrent |
| Web Framework | Echo v4.14 | Fast, lightweight HTTP framework |
| Database | PostgreSQL 14+ | Primary data store |
| Connection Pool | pgx/v5 | Fast PostgreSQL driver |
| SQL Generation | SQLC | Type-safe SQL queries |
| Caching | Redis v8 | Session, cache, temporary data |
| File Storage | MinIO v7 | S3-compatible object storage |
| Authentication | Firebase + JWT | User auth & validation |
| Logging | zerolog | Structured logging |
| Migration | golang-migrate | Database schema versioning |
| Testing | testcontainers | Integration tests with real DB |

### Project Structure

```
app/
├── cmd/
│   └── main.go                    # Entry point
├── internal/
│   ├── app/                       # Application startup & config
│   ├── config/                    # Configuration management
│   ├── middleware/                # HTTP middleware
│   ├── handler/                   # HTTP request handlers
│   ├── service/                   # Business logic & services
│   ├── repository/                # Data access layer
│   │   ├── pg/                    # PostgreSQL queries (SQLC generated)
│   │   └── minio/                 # MinIO object storage
│   ├── model/                     # Data models & DTOs
│   ├── migrate/                   # Database migrations
│   └── api/                       # API documentation (Swagger)
├── migrations/
│   ├── main/                      # Main database migrations
│   └── tenants/                   # Tenant-specific migrations
├── sqlc/
│   ├── main/                      # Main database SQLC config
│   └── tenants/                   # Tenant database SQLC config
└── tests/                         # Test files
```

---

## Architecture & Design Patterns

### Layered Architecture

```
┌─────────────────────────────────┐
│   HTTP Handlers (Echo)          │ <- User requests
│   (handler/*.go)                │
├─────────────────────────────────┤
│   Business Logic (Services)     │ <- Domain logic, validation
│   (service/*.go)                │
├─────────────────────────────────┤
│   Data Access (Repositories)    │ <- Database operations
│   (repository/*.go)             │
├─────────────────────────────────┤
│   PostgreSQL Database           │ <- Persistent storage
└─────────────────────────────────┘
```

### Service Injection

```go
type InvoiceHandler struct {
    invoiceService *service.InvoiceS
    ingredientSvc  *service.IngredientS
}

// All services injected via constructor
func NewInvoiceHandler(
    invoiceService *service.InvoiceS,
    ingredientSvc *service.IngredientS,
) *InvoiceHandler { ... }
```

### Transaction Management

**Pattern**: Function parameters with implicit transaction context

```go
// Service methods receive transaction context
func (s *InvoiceS) CreateInvoice(ctx context.Context, req *model.CreateInvoiceRequest) {
    // Get tenant queries (auto-handles transaction)
    q, txCtx, tx, shouldCommit, err := s.getTenantMutationQueries(ctx)
    
    // Use queries within transaction
    invoice, err := q.CreateInvoice(txCtx, params)
    
    // Commit if needed
    if shouldCommit {
        tx.Commit(ctx)
    }
}
```

**Benefits**:
- ✅ ACID compliance for multi-step operations
- ✅ Automatic rollback on error
- ✅ Nested transaction support via savepoints
- ✅ Per-operation transaction isolation

---

## Core Domain Model

### Entities Overview

```
Restaurant/Branch
├── Storage (Warehouse)
│   ├── Inventory Items
│   ├── Goods (Products)
│   └── Stock Movements
├── Categories & Departments
│   └── Goods (Products)
├── Suppliers
│   └── Invoices
├── Employees/Users
│   └── Shifts
└── Orders
    └── Order Items
```

### Key Models

#### Good (Product)

```go
type Good struct {
    ID              string      // UUID
    Name            string      // "Pizza Margherita"
    Description     *string     // Optional description
    NameI18n        *string     // I18N key
    DescriptionI18n *string     // I18N key
    CategoryID      *string     // Links to category
    BranchID        *string     // Multi-branch support
    PictureUrl      *string     // Product image
    ColorCode       *string     // #RRGGBB color
    Price           string      // Selling price (decimal)
    CookTime        *int32      // Preparation time in minutes
    
    // Auto-calculated from recipe
    CostPrice       string      // Total ingredient cost
    Profit          string      // Price - CostPrice
    ProfitMargin    string      // (Profit/CostPrice)*100%
}
```

**Key Features**:
- Multi-language support via i18n IDs
- Margin & profitability auto-calculation
- Multi-branch awareness
- Recipe-based cost calculation

#### GoodDetail (Recipe Item)

```go
type GoodDetail struct {
    ID           string  // UUID
    GoodID       string  // Parent product
    IngredientID *string // Raw ingredient (if ingredient-based)
    CompoundID   *string // Semi-finished product (if compound-based)
    Measurement  string  // "kg", "L", "piece"
    Quantity     int64   // Amount needed (in smallest unit)
}
```

**Relationships**:
- `Good` → `GoodDetail` (1:M)
- `GoodDetail` → `Ingredient` (M:1, optional)
- `GoodDetail` → `Compound` (M:1, optional)

#### Ingredient (Raw Material)

```go
type Ingredient struct {
    ID           string  // UUID
    Name         string  // "Tomato", "Mozzarella"
    NameI18n     *string
    Unit         string  // "kg", "L", "piece"
    PricePerUnit string  // Cost basis
    ImageUrl     *string
    Description  *string
}
```

#### Storage/Warehouse

```go
type Storage struct {
    ID           string // UUID
    Name         string // "Main Kitchen", "Cold Room"
    Department   string // Assigned department
    Description  *string
    CountedAt    *time.Time // Last inventory count time
}
```

#### Inventory

```go
type Inventory struct {
    ID              string    // UUID
    StorageID       string    // Which warehouse
    Number          int32     // Sequential number
    Date            time.Time // Inventory date
    CountedAt       time.Time // When count was taken
    Description     *string   // Notes
    Status          string    // "draft", "active", "closed"
    
    // Calculated fields
    SurplusAmount   string    // Extra stock found
    ShortageAmount  string    // Missing stock
    RemainingAmount string    // Adjustments made
}
```

#### Invoice (Supplier Invoice)

```go
type Invoice struct {
    ID          string        // UUID
    SupplierID  string        // Which supplier
    StorageID   *string       // Receiving warehouse
    TotalAmount string        // Invoice total
    Status      InvoiceStatus // pending, arrived, received
    Date        time.Time     // Invoice date
    
    // Relationships
    Details []InvoiceDetail  // Line items
}
```

**Enum: InvoiceStatus**
```
pending  - Invoice created, not yet arrived
arrived  - Goods received at warehouse
received - Verified and added to inventory
```

#### InvoiceDetail (Invoice Line Item)

```go
type InvoiceDetail struct {
    ID           string  // UUID
    InvoiceID    string  // Parent invoice
    IngredientID string  // What ingredient
    Measurement  string  // Unit (kg, L)
    Quantity     int64   // Amount (in smallest unit)
    Price        string  // Line item total
}
```

#### Order

```go
type Order struct {
    ID          string     // UUID
    OrderNumber int32      // Sequential #
    Status      OrderStatus // open, ready, completed, cancelled
    TotalPrice  string     // Order total
    
    // Relationships
    Items []OrderItem   // What was ordered
    
    // Timestamps
    CreatedAt   time.Time
    CompletedAt *time.Time
}
```

**Enum: OrderStatus**
```
open       - Accepting items
ready      - Prepared, waiting pickup
completed  - Delivered
cancelled  - Aborted
```

#### OrderItem (Order Line)

```go
type OrderItem struct {
    ID         string  // UUID
    OrderID    string  // Parent order
    GoodID     string  // Which product
    Quantity   int32   // How many
    UnitPrice  string  // Price at order time
    Modifiers  []Modifier // Add-ons
}
```

---

## Inventory Management System

### Two-System Approach

Like the Java POS, this system has:

#### System 1: Inventory (Primary)

**Purpose**: Track physical stock in storage

**Key Tables**:
- `inventories` - Inventory records (physical counts)
- `inventory_items` - Individual item counts in an inventory
- `inventory_movements` - Stock in/out transactions

**Features**:
- ✅ Point-in-time counting
- ✅ Counted timestamp tracking
- ✅ Shortage/surplus detection
- ✅ Time-aware stock reconstruction

#### System 2: Goods & Calculations

**Purpose**: Recipe costing, product definitions

**Key Tables**:
- `goods` - Products/menu items
- `goods_details` - Recipe composition
- `goods_calculations` - Cost calculation detail
- `goods_modifiers` - Add-ons/customizations

**Features**:
- ✅ Multi-ingredient recipes
- ✅ Automatic cost calculation
- ✅ Profit margin tracking
- ✅ Modifier support

### Inventory Workflow

```
┌──────────────────────────────────┐
│ 1. PLAN PHYSICAL COUNT           │
├──────────────────────────────────┤
│ Create Inventory record          │
│ Status = "draft"                 │
│ Specify: storage, date, notes    │
└──────────────────────────────────┘
              │
              ↓
┌──────────────────────────────────┐
│ 2. PERFORM COUNT                 │
├──────────────────────────────────┤
│ For each item in storage:        │
│ - Physical count                 │
│ - Record in InventoryItem        │
│ - Compare vs system qty          │
└──────────────────────────────────┘
              │
              ↓
┌──────────────────────────────────┐
│ 3. CALCULATE VARIANCE            │
├──────────────────────────────────┤
│ Expected = stock at count_date   │
│ Actual = counted quantity        │
│ Variance = actual - expected     │
│           │
│           ├─ Surplus (actual > expected)
│           ├─ Shortage (actual < expected)
│           └─ Match (actual = expected)
└──────────────────────────────────┘
              │
              ↓
┌──────────────────────────────────┐
│ 4. ACTIVATE (Post to Ledger)     │
├──────────────────────────────────┤
│ IF variance != 0:                │
│   Create adjustment movement     │
│   Update live stock              │
│   Log discrepancy                │
│                                  │
│ Status = "active"                │
└──────────────────────────────────┘
```

### Time-Aware Inventory

**Key Feature**: Inventory compares stock **as of the inventory date**, not current stock

```
Timeline:
Monday 10:00    → Invoice adds 30 eggs
Wednesday 12:00 → Inventory count = 20 eggs (counted_at)
Friday 10:00    → Invoice adds 50 eggs

Expected Stock (Wed 12:00) = 30 eggs (before Friday invoice)
Counted Stock = 20 eggs
Shortage = 10 eggs

Result: Friday invoice correctly ignored
```

**Implementation** (with `USE_NEW_INVENTORY_FLOW=true`):

```go
// Stock calculation filters by timestamp
stock := calculateStockAsOf(ctx, ingredientID, inventory.CountedAt)

// Movements included if:
// - effective_at <= inventory.CountedAt, OR
// - created_at <= inventory.CountedAt (fallback)

// Movements excluded if:
// - Both timestamps > inventory.CountedAt (future movements)
```

**Benefit**: Allows accurate historical inventory reconciliation even with retroactive entries

---

## Stock Management & Tracking

### Stock Movement Types

#### 1. Invoice Received (Stock In)

```go
// In invoice.go
func (s *InvoiceS) ReceiveInvoice(ctx context.Context, invoiceID string) {
    // 1. Get invoice & details
    invoice := getInvoice(invoiceID)
    
    // 2. For each detail:
    for _, detail := range invoice.Details {
        // Add to inventory_movements
        movement := StockMovement{
            IngredientID: detail.IngredientID,
            Quantity:     detail.Quantity,
            Type:        "invoice_received",
            Reference:   invoiceID,
            EffectiveAt:  invoice.Date,  // Business date
            CreatedAt:    time.Now(),    // Wall time
        }
        createMovement(ctx, movement)
    }
    
    // 3. Update inventory_items (if tracked separately)
    for _, detail := range invoice.Details {
        updateInventoryQuantity(detail.IngredientID, +detail.Quantity)
    }
    
    // 4. Mark invoice as "received"
    invoice.Status = "received"
    updateInvoice(ctx, invoice)
}
```

#### 2. Order Fulfillment (Stock Out)

```go
// In order_stock_helper.go
func (s *OrderS) consumeItemStock(ctx context.Context, orderItem *OrderItem) {
    // 1. Get recipe for product
    goodDetail := getGoodDetails(orderItem.GoodID)
    
    // 2. For each ingredient in recipe:
    for _, detail := range goodDetail {
        ingredient := getIngredient(detail.IngredientID)
        qty := detail.Quantity * orderItem.Quantity  // Recipe qty × order qty
        
        // 3. Create stock movement (out)
        movement := StockMovement{
            IngredientID: ingredient.ID,
            Quantity:    -qty,  // Negative = consumption
            Type:        "order_consumed",
            Reference:   orderItem.OrderID,
            EffectiveAt: time.Now(),
        }
        createMovement(ctx, movement)
        
        // 4. Update inventory_items
        updateInventoryQuantity(ingredient.ID, -qty)
    }
}
```

**Called from**:
```go
// CreateOrderItems - creates items AND consumes stock
func (s *OrderS) CreateOrderItems(...) {
    for _, item := range items {
        // Create order item
        createOrderItem(ctx, item)
        
        // [NEW] Consume stock
        consumeItemStock(ctx, item)
    }
}
```

#### 3. Deduction/Adjustment (Stock Out)

```go
// In deduction.go
// Manual stock reduction for waste, spoilage, etc.

func (s *DeductionS) CreateDeduction(ctx context.Context, req *CreateDeductionRequest) {
    deduction := Deduction{
        ID:           uuid.New(),
        IngredientID: req.IngredientID,
        Quantity:    req.Quantity,
        Reason:      req.Reason,  // "waste", "spoilage", "theft"
        Date:        req.Date,
    }
    
    // Create deduction record
    d, err := createDeduction(ctx, deduction)
    
    // Create stock movement
    movement := StockMovement{
        IngredientID: req.IngredientID,
        Quantity:    -req.Quantity,  // Negative = removal
        Type:        "deduction",
        Reference:   d.ID,
        EffectiveAt: deduction.Date,
    }
    createMovement(ctx, movement)
    
    // Update inventory
    updateInventoryQuantity(req.IngredientID, -req.Quantity)
}
```

#### 4. Inventory Adjustment (Variance)

```go
// When inventory is activated and has variance
func (s *InventoryS) ActivateInventory(ctx context.Context, inventoryID string) {
    inventory := getInventory(inventoryID)
    
    for _, item := range inventory.Items {
        expected := calculateStockAsOf(item.IngredientID, inventory.CountedAt)
        actual := item.CountedQuantity
        variance := actual - expected
        
        if variance != 0 {
            // Create adjustment movement
            adjustment := StockMovement{
                IngredientID: item.IngredientID,
                Quantity:    variance,  // Positive = surplus, Negative = shortage
                Type:        "inventory_adjustment",
                Reference:   inventoryID,
                EffectiveAt: inventory.CountedAt,
                Reason:      "Physical count variance",
            }
            createMovement(ctx, adjustment)
            
            // Update inventory
            updateInventoryQuantity(item.IngredientID, variance)
        }
    }
    
    inventory.Status = "active"
    updateInventory(ctx, inventory)
}
```

### Stock Calculation (Time-Aware)

```go
// calculateStockAsOf - key method for point-in-time stock
func calculateStockAsOf(
    ctx context.Context,
    ingredientID string,
    asOfTime time.Time,
) Decimal {
    // Get all movements up to asOfTime
    movements := getMovementsBefore(ctx, ingredientID, asOfTime)
    
    // Sum quantities
    totalStock := Decimal(0)
    for _, movement := range movements {
        totalStock += movement.Quantity
    }
    
    return totalStock
}

// When USE_NEW_INVENTORY_FLOW=true:
// - Movements use effective_at (business date)
// - Fallback to created_at if effective_at null
//
// When USE_NEW_INVENTORY_FLOW=false:
// - Movements use created_at only
// - Simpler but less accurate for retroactive entries
```

---

## Invoice & Supplier System

### Invoice Lifecycle

```
┌──────────────────────────────────┐
│ 1. CREATE (DRAFT)                │
├──────────────────────────────────┤
│ Create invoice header            │
│ Add detail items                 │
│ No stock impact yet              │
│ Status = "pending"               │
└──────────────────────────────────┘
              │
              ↓
┌──────────────────────────────────┐
│ 2. RECEIVE GOODS (ARRIVED)       │
├──────────────────────────────────┤
│ Mark: "Goods received at door"   │
│ Status = "arrived"               │
│ Still not added to inventory     │
└──────────────────────────────────┘
              │
              ↓
┌──────────────────────────────────┐
│ 3. POST TO LEDGER (RECEIVED)     │
├──────────────────────────────────┤
│ Add items to inventory           │
│ Create stock movements           │
│ Status = "received"              │
│ Now affects available stock      │
└──────────────────────────────────┘
```

### Invoice with Details (Batch Create)

```go
// Model: CreateInvoiceWithDetailsRequest
type CreateInvoiceWithDetailsRequest struct {
    Invoice CreateInvoiceRequest       `json:"invoice"`
    Details []CreateInvoiceDetailRequest `json:"details"`
}

// Response includes summary
type CreateInvoiceWithDetailsResponse struct {
    Invoice Invoice               `json:"invoice"`
    Details []InvoiceDetail       `json:"details"`
    Summary InvoiceDetailsBatchSummary `json:"summary"`
}

// Service: Atomic transaction
func (s *InvoiceS) CreateInvoiceWithDetails(ctx context.Context, req *CreateInvoiceWithDetailsRequest) {
    // Begin transaction
    tx := beginTx(ctx)
    defer tx.Rollback()
    
    // 1. Create invoice
    invoice, err := q.CreateInvoice(txCtx, invoiceParams)
    if err != nil { return err }
    
    // 2. Create all details
    var details []InvoiceDetail
    for _, detailReq := range req.Details {
        detail, err := q.CreateInvoiceDetail(txCtx, pgParams{
            InvoiceID:    invoice.ID,
            IngredientID: detailReq.IngredientID,
            Quantity:     detailReq.Quantity,
            Price:        detailReq.Price,
        })
        if err != nil { return err }  // Entire tx rolls back
        details = append(details, detail)
    }
    
    // Commit once
    tx.Commit(ctx)
    
    return CreateInvoiceWithDetailsResponse{
        Invoice: invoice,
        Details: details,
        Summary: calcSummary(details),
    }
}
```

**Benefits**:
- ✅ All-or-nothing consistency
- ✅ No partially-created invoices
- ✅ Cleaner client code

---

## Order System & Stock Consumption

### Order Creation Flow

```
CreateOrder(request) 
  ↓
1. Validate request
   - Customer exists
   - All goods are active
   ↓
2. Create Order record
   ↓
3. For each OrderItem:
   - Create OrderItem record
   - Save modifiers
   - [KEY] Consume stock
     ├─ Get good's recipe
     ├─ For each ingredient:
     │   ├─ Calculate qty needed
     │   ├─ Create stock movement
     │   └─ Update inventory_items
     └─ Log consumption
   ↓
4. Commit transaction
   ↓
Response: OrderResponse with items
```

### Stock Consumption Logic

**Location**: `service/order_stock_helper.go`

```go
// consumeItemStock - reduces stock for an order item
func (s *OrderS) consumeItemStock(
    ctx context.Context,
    orderItem *OrderItem,
) error {
    // 1. Get storage for good
    good, err := repo.GetGood(ctx, orderItem.GoodID)
    if err != nil { return err }
    
    // Get storage from good's category → department
    storage, err := getStorageForGood(ctx, good)
    if err != nil { return err }
    
    // 2. Expand good to ingredients (via calculations)
    ingredients, err := repo.GetGoodCalculations(ctx, good.ID)
    if err != nil { return err }
    
    if len(ingredients) == 0 {
        log.Warn("Good has no ingredient calculations", "good_id", good.ID)
        return nil  // Continue without consuming
    }
    
    // 3. For each ingredient, reduce stock
    for _, calc := range ingredients {
        // Qty = recipe qty × order quantity
        qtyToConsume := calc.Quantity * int64(orderItem.Quantity)
        
        // Create stock movement
        movement := StockMovement{
            ID:           uuid.New(),
            IngredientID: calc.IngredientID,
            StorageID:    storage.ID,
            Quantity:    -qtyToConsume,  // Negative!
            Type:        "order_consumed",
            Reference:   orderItem.ID,
            EffectiveAt: time.Now(),
            CreatedAt:   time.Now(),
        }
        
        err := repo.CreateStockMovement(ctx, movement)
        if err != nil { return err }
        
        // Update inventory item
        err = repo.UpdateInventoryQuantity(ctx, UpdateRequest{
            IngredientID: calc.IngredientID,
            StorageID:    storage.ID,
            Delta:       -qtyToConsume,
        })
        if err != nil { return err }
    }
    
    return nil
}
```

**Key Points**:
- ✅ Only called if good has ingredient calculations configured
- ✅ All-or-nothing: one failure = entire order fails
- ✅ Movements timestamped with order creation time
- ✅ Automatic storage detection via good's category/department

### Order Modifiers (Add-ons)

```go
// OrderItem can have modifiers
type OrderItem struct {
    ID          string
    OrderID     string
    GoodID      string
    Quantity    int32
    UnitPrice   string
    Modifiers   []Modifier  // Add-ons like "extra cheese"
}

// Modifiers don't typically affect stock
// (Can be configured per system)
```

---

## Multi-Tenancy Architecture

### Tenant Isolation Strategy

**Key Principle**: Separate database per tenant with shared application code

### Database Structure

```
┌─────────────────┐
│   postgres      │  Main database (shared infra)
├─────────────────┤
│  - users        │  Shared users table
│  - brands       │  Restaurant brands (tenants)
│  - auth         │  Auth records
└─────────────────┘

┌─────────────────┐
│  tenant_001_db  │  Tenant 1 schema
├─────────────────┤
│ - inventories   │  Isolated
│ - goods         │  Isolated
│ - orders        │  Isolated
│ - invoices      │  Isolated
└─────────────────┘

┌─────────────────┐
│  tenant_002_db  │  Tenant 2 schema
├─────────────────┤  (Same tables, different data)
└─────────────────┘
```

### Tenant Context

```go
// context.go - Tenant extraction
func getTenantID(ctx context.Context) (string, error) {
    claims := ctx.Value("claims")  // From JWT
    return claims["tenant_id"], nil
}

// Service method
func (s *OrderS) CreateOrder(ctx context.Context, req *CreateOrderRequest) {
    tenantID := getTenantID(ctx)
    
    // Connect to tenant's database
    conn := getConnectionForTenant(tenantID)
    queries := pg.New(conn)
    
    // All operations scoped to this tenant
    order, err := queries.CreateOrder(ctx, params)
}
```

### Query Scoping

**Automatic Isolation**:
```go
// Every query implicitly scoped to tenant
WHERE tenant_id = $1

// When listing:
SELECT * FROM orders 
WHERE tenant_id = $1  // Automatic from context
ORDER BY created_at DESC
```

### Tenant Mutations vs Reads

```go
// Read operations (safe)
func (s *Service) withTenantRead(ctx context.Context, cb func(*pg.Queries) error) {
    q := getTenantQueries(ctx)
    return cb(q)  // Read-only
}

// Mutation operations (need tx)
func (s *Service) getTenantMutationQueries(ctx context.Context) (
    *pg.Queries,      // Queries within tx
    context.Context,  // Tx context
    pgx.Tx,           // The tx itself
    bool,             // shouldCommit flag
    error,
) {
    conn := getTenantConnection(ctx)
    tx := beginTx(conn)
    return pg.New(tx), ctx, tx, true, nil
}
```

---

## Data Persistence Layer

### SQLC Code Generation

```
sqlc/main/
├── sqlc.yml          # Configuration
└── queries/
    ├── brands.sql    # Brand queries
    ├── users.sql     # User queries
    └── ... (auto-generated .sql files)
```

**Benefits**:
- ✅ Type-safe queries
- ✅ Auto-generated from .sql files
- ✅ No string concatenation
- ✅ Compile-time checking

### Repository Pattern

```go
// internal/repository/repository.go
type Repository struct {
    // DB connections per operation type
    db      *pgx.Conn  // Main connection
    tenantQ *pg.Queries
    
    // MinIO client for file storage
    minio   *minio.Client
}

// Methods delegate to generated code
func (r *Repository) GetGood(ctx context.Context, id string) (*Good, error) {
    return r.tenantQ.GetGood(ctx, uuid.MustParse(id))
}

func (r *Repository) CreateInvoice(ctx context.Context, ...) (*Invoice, error) {
    return r.tenantQ.CreateInvoice(ctx, params)
}
```

### Transaction Savepoints

```go
// Nested transaction support
type SavepointHelper struct {
    tx pgx.Tx
}

func (s *SavepointHelper) Release() error {
    return s.tx.Commit(context.Background())
}

// Usage in service
tx := beginSavepoint(ctx)
if err := someOperation(ctx, tx); err != nil {
    tx.Rollback()  // Nested rollback
}
tx.Release()  // Commit all
```

---

## Feature Flags

### USE_NEW_INVENTORY_FLOW

**Purpose**: Control stock accounting behavior during transition

**Location**: Environment variable or config file

```bash
export USE_NEW_INVENTORY_FLOW=true   # Enable new behavior
export USE_NEW_INVENTORY_FLOW=false  # Use legacy behavior (default)
```

**What Changes**:

| Feature | OFF (Legacy) | ON (New) |
|---------|------------|---------|
| Stock Calculation | Snapshot at entry time | Reconstructed from movements |
| Movement Timestamp | `created_at` (entry time) | `effective_at` (business date) + fallback |
| Inventory Comparison | Stock now | Stock at inventory.counted_at |
| Report Filtering | By `created_at` | By `COALESCE(effective_at, created_at)` |

**Affected Services**:
```go
InventoryS      - applyStockForItems, reverseStockForItems
InvoiceS        - applyInvoiceStockMovement
IngredientS     - GetIngredientReport
DeductionS      - reverseAllDeductionStock
```

**Implementation**:
```go
func (s *InvoiceS) applyInvoiceStockMovement(ctx context.Context, invoice *Invoice) {
    useNew := config.Get().Features.UseNewInventoryFlow  // Read flag
    
    for _, detail := range invoice.Details {
        if useNew {
            // Use effective_at from invoice date
            movement.EffectiveAt = invoice.Date
        } else {
            // Use created_at
            movement.EffectiveAt = time.Now()
        }
        
        createMovement(ctx, movement)
    }
}
```

**Migration Path**:
1. Deploy with flag OFF (legacy)
2. Run in parallel with flag ON
3. Validate results match
4. Flip to flag ON in production
5. Eventually remove old code

---

## Key Services

### InvoiceService

**Location**: `service/invoice.go`

**Responsibilities**:
- Invoice CRUD operations
- Receive/post status transitions
- Stock impact application
- Validation & authorization

**Key Methods**:
```go
CreateInvoice(ctx, req)              // Create draft
GetInvoiceByID(ctx, id)              // Fetch single
GetAllInvoices(ctx, filter, limit)   // List with filters
UpdateInvoice(ctx, id, req)          // Update draft
ReceiveInvoice(ctx, id)              // Mark arrived
PostInvoice(ctx, id)                 // Apply stock
CreateInvoiceWithDetails(ctx, req)   // Batch create
```

### OrderService

**Location**: `service/order.go`

**Responsibilities**:
- Order lifecycle management
- Stock consumption
- Order item handling
- Modifier management

**Key Methods**:
```go
CreateOrder(ctx, req)                // Create & consume stock
GetOrderByID(ctx, id)                // Fetch single
GetAllOrders(ctx, filter, limit)     // List
UpdateOrderStatus(ctx, id, status)   // Change status
CreateOrderItems(ctx, items)         // Add items + consume
CancelOrder(ctx, id)                 // Reverse consumption
```

### InventoryService

**Location**: `service/inventory.go`

**Responsibilities**:
- Inventory record management
- Item counting
- Variance calculation
- Activation/posting

**Key Methods**:
```go
CreateInventory(ctx, req)            // New inventory
GetInventoryByID(ctx, id)            // Fetch
AddInventoryItem(ctx, inv, item)     // Record count
CalculateVariance(ctx, inv)          // Detect discrepancies
ActivateInventory(ctx, id)           // Post & adjust stock
```

### IngredientService

**Location**: `service/ingredient.go`

**Responsibilities**:
- Ingredient definitions
- Stock level queries
- Report generation
- Price management

**Key Methods**:
```go
CreateIngredient(ctx, req)           // Define new ingredient
GetIngredient(ctx, id)               // Fetch definition
GetIngredientStock(ctx, id)          // Current qty
GetIngredientReport(ctx, filter)     // Movement history
GetLowStockItems(ctx)                // Alert items
```

### GoodsService

**Location**: `service/goods.go`

**Responsibilities**:
- Product/menu item management
- Recipe composition
- Cost calculation
- Profitability analysis

**Key Methods**:
```go
CreateGood(ctx, req)                 // New menu item
UpdateGood(ctx, id, req)             // Edit item
AddGoodDetail(ctx, goodID, detail)   // Add recipe ingredient
CalculateGoodCost(ctx, goodID)       // Recompute cost/margin
GetGoodWithMargin(ctx, id)           // Fetch + calculated fields
```

---

## API Layer

### Handler Structure

```go
// handler/invoice.go
type InvoiceHandler struct {
    invoiceSvc     *service.InvoiceS
    ingredientSvc  *service.IngredientS
    // ... other services
}

// Register routes
func (h *InvoiceHandler) RegisterRoutes(e *echo.Echo) {
    g := e.Group("/api/v1/invoices")
    
    g.POST("", h.CreateInvoice)           // POST /api/v1/invoices
    g.GET("/:id", h.GetInvoice)           // GET /api/v1/invoices/:id
    g.GET("", h.GetAllInvoices)           // GET /api/v1/invoices
    g.PATCH("/:id", h.UpdateInvoice)      // PATCH /api/v1/invoices/:id
    g.POST("/:id/receive", h.ReceiveInvoice)  // POST /api/v1/invoices/:id/receive
    g.POST("/:id/post", h.PostInvoice)    // POST /api/v1/invoices/:id/post
}
```

### Request/Response Flow

```go
// HTTP Handler
func (h *InvoiceHandler) CreateInvoice(c echo.Context) error {
    // 1. Parse request
    var req model.CreateInvoiceRequest
    if err := c.BindJSON(&req); err != nil {
        return c.JSON(400, ErrorResponse{...})
    }
    
    // 2. Validate
    if err := validator.Struct(&req); err != nil {
        return c.JSON(422, ErrorResponse{...})
    }
    
    // 3. Call service
    invoice, err := h.invoiceSvc.CreateInvoice(c.Request().Context(), &req)
    if err != nil {
        return c.JSON(500, ErrorResponse{...})
    }
    
    // 4. Return response
    return c.JSON(201, SuccessResponse{
        Status:  "success",
        Message: "Invoice created",
        Data:    invoice,
    })
}
```

### Pagination

```go
type PaginationMeta struct {
    Page      int   `json:"page"`
    PageSize  int   `json:"page_size"`
    Total     int64 `json:"total"`
    TotalPage int   `json:"total_page"`
}

type PaginatedResponse struct {
    Status     string         `json:"status"`
    Message    string         `json:"message"`
    Data       []any          `json:"data"`
    Pagination PaginationMeta `json:"pagination"`
    Code       int            `json:"code"`
}
```

**Usage**:
```
GET /api/v1/invoices?page=1&page_size=20&sort_by=date&sort_order=desc
```

---

## Stock Movement Tracking

### Movement Types

```go
type StockMovement struct {
    ID           string    // UUID
    IngredientID string    // What ingredient
    StorageID    string    // Which warehouse
    Quantity     int64     // Amount (positive=in, negative=out)
    Type         string    // "invoice_received", "order_consumed", "deduction", "inventory_adjustment"
    Reference    string    // Document ID (invoice_id, order_id, deduction_id, etc)
    EffectiveAt  time.Time // Business date
    CreatedAt    time.Time // When recorded
    Reason       *string   // Optional explanation
}
```

### Movement Query

```go
// Get all movements for an ingredient
SELECT * FROM stock_movements
WHERE ingredient_id = $1
  AND created_at BETWEEN $2 AND $3
ORDER BY created_at ASC

// For reporting/audit
SELECT 
    sm.id,
    sm.ingredient_id,
    i.name as ingredient_name,
    sm.quantity,
    sm.type,
    sm.reference,
    COALESCE(sm.effective_at, sm.created_at) as effective_date,
    sm.created_at,
    sm.reason
FROM stock_movements sm
JOIN ingredients i ON sm.ingredient_id = i.id
WHERE i.id = $1
ORDER BY sm.effective_at ASC, sm.created_at ASC
```

---

## Time-Aware Inventory

### Problem Solved

**Scenario**: Goods arrive late or invoices created retroactively

```
Timeline:
Monday:   Invoice says "200kg flour arrived"
Tuesday:  Inventory count performed
Wednesday: Invoice created in system for Monday delivery

Legacy system: Counts Tuesday stock as "now", misses Monday addition
New system: Reconstructs Tuesday stock including Monday invoice
```

### Solution

**Step 1: Capture Business Date**
```go
type Invoice struct {
    Date time.Time  // Business date (when goods arrived)
    CreatedAt time.Time  // System date (when entered)
}

type StockMovement struct {
    EffectiveAt time.Time  // Business date (from source doc)
    CreatedAt   time.Time  // System date
}
```

**Step 2: Reconstruct Stock at Point-in-Time**
```go
func calculateStockAsOf(
    ctx context.Context,
    ingredientID string,
    asOfTime time.Time,
) (int64, error) {
    // Get movements:
    // WHERE effective_at <= asOfTime
    //    OR (effective_at IS NULL AND created_at <= asOfTime)
    
    movements, err := repo.GetMovementsBefore(ctx, ingredientID, asOfTime)
    if err != nil { return 0, err }
    
    var total int64
    for _, m := range movements {
        total += m.Quantity
    }
    return total, nil
}
```

**Step 3: Compare at Inventory Date**
```go
func (s *InventoryS) ActivateInventory(ctx context.Context, invID string) {
    inv := getInventory(ctx, invID)
    
    for _, item := range inv.Items {
        // Expected = stock AT inventory count time
        expected := calculateStockAsOf(ctx, item.IngredientID, inv.CountedAt)
        actual := item.CountedQuantity
        variance := actual - expected
        
        // Adjust if needed
        if variance != 0 {
            createAdjustment(ctx, StockMovement{
                IngredientID: item.IngredientID,
                Quantity: variance,
                EffectiveAt: inv.CountedAt,
                Type: "inventory_adjustment",
                Reference: invID,
            })
        }
    }
}
```

**Benefit**: Historical accuracy without rewriting past movements

---

## Configuration Management

```go
// config/config.go
type Config struct {
    Server ServerConfig
    Database DatabaseConfig
    Redis RedisConfig
    MinIO MinIOConfig
    Firebase FirebaseConfig
    Features FeatureConfig
}

type FeatureConfig struct {
    UseNewInventoryFlow bool  // Feature flag
}

// Usage
cfg := config.New()  // Reads from env + config file
if cfg.Features.UseNewInventoryFlow {
    // Use new logic
}
```

### Environment Variables

```bash
DATABASE_URL=postgres://user:pass@localhost/mydb
REDIS_URL=redis://localhost:6379
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
FIREBASE_CONFIG=/path/to/firebase.json
USE_NEW_INVENTORY_FLOW=true
LOG_LEVEL=debug
```

---

## Logging & Observability

### Structured Logging

```go
import "github.com/rs/zerolog"

log.Info().
    Str("operation", "invoice_created").
    Str("invoice_id", invoiceID).
    Str("supplier_id", supplierID).
    Int("detail_count", len(details)).
    Msg("Invoice created successfully")

// Output:
// {"level":"info","operation":"invoice_created","invoice_id":"...",
//  "supplier_id":"...","detail_count":5,"message":"Invoice created successfully"}
```

### Error Handling

```go
if err != nil {
    log.Error().
        Err(err).
        Str("operation", "create_invoice").
        Str("supplier_id", supplierID).
        Msg("Failed to create invoice")
    
    return fmt.Errorf("failed to create invoice: %w", err)
}
```

---

## Testing Strategy

### Test Structure

```
tests/
├── integration/
│   ├── invoice_test.go       # Invoice API tests
│   ├── order_test.go         # Order API tests
│   └── inventory_test.go     # Inventory API tests
└── unit/
    ├── service/
    │   └── invoice_service_test.go
    └── repository/
        └── postgres_test.go
```

### Integration Testing

```go
// Using testcontainers for real PostgreSQL
func TestCreateInvoice(t *testing.T) {
    // 1. Start real database container
    container := setupPostgres(t)
    defer container.Terminate(context.Background())
    
    // 2. Create handler with real service/repo
    handler := setupHandler(container.Conn())
    
    // 3. Make HTTP request
    req := CreateInvoiceRequest{...}
    resp, err := handler.CreateInvoice(ctx, req)
    
    // 4. Verify
    assert.NoError(t, err)
    assert.NotEmpty(t, resp.ID)
    assert.Equal(t, "pending", resp.Status)
}
```

---

## Summary

| Aspect | Implementation |
|--------|---|
| **Language** | Go 1.25 (concurrent, fast) |
| **Architecture** | Layered (handler→service→repo) |
| **Inventory** | Time-aware point-in-time accounting |
| **Stock** | Event-sourced via movements |
| **Multi-Tenant** | Per-tenant database isolation |
| **Transactions** | ACID with savepoints |
| **Type Safety** | SQLC-generated queries |
| **API** | RESTful with JSON |
| **Data** | PostgreSQL with migrations |
| **Feature Flags** | Controlled rollout capability |
| **Testing** | Real database (testcontainers) |

---

## Key Takeaways

### Stock Consumption Flow
```
Invoice Received → Stock Movement Created → Inventory Updated
Order Created    → Recipe Expanded         → Stock Consumed
Deduction Made   → Movement Recorded       → Adjustment Applied
Inventory Count  → Variance Calculated     → Stock Adjusted
```

### Time-Aware Accuracy
```
movements.EffectiveAt (business date)
          + movements.CreatedAt (fallback)
          = Stock at any point in time
```

### Multi-Tenancy Pattern
```
Context → Extract Tenant ID → Get Tenant DB Connection → Scoped Queries
```

### Transaction Safety
```
Transaction Start → Service Operations → Commit/Rollback → Response
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-05-02  
**Tech Stack**: Go 1.25, Echo, PostgreSQL, SQLC, Redis, MinIO, Firebase  
**Project**: MARY_AI Multi-Tenant Restaurant Management System
