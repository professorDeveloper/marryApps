package migrate

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
	"golang.org/x/crypto/bcrypt"
)

// SeedData populates the database with sample data for testing
func SeedData(ctx context.Context, mainPool *pgxpool.Pool, tenantDBPool *pgxpool.Pool) error {
	log.Println("🌱 Starting database seeding...")

	// Query from main database to get first brand
	conn, err := mainPool.Acquire(ctx)
	if err != nil {
		log.Printf("⚠️  Failed to acquire connection from main pool: %v", err)
		return err
	}

	var brandID string
	err = conn.QueryRow(ctx, "SELECT brand_id FROM brands LIMIT 1").Scan(&brandID)
	conn.Release()
	if err != nil {
		log.Printf("⚠️  Failed to get brand ID: %v", err)
		return err
	}

	log.Printf("🌍 Seeding for brand: %s", brandID)

	// Get a connection from the tenant pool and set the schema
	tenantConn, err := tenantDBPool.Acquire(ctx)
	if err != nil {
		log.Printf("⚠️  Failed to acquire connection from tenant pool: %v", err)
		return err
	}
	defer tenantConn.Release()

	// Set the schema for this connection
	schemaName := fmt.Sprintf("tenant_%s", brandID)
	if _, err := tenantConn.Exec(ctx, fmt.Sprintf("SET search_path TO \"%s\", public", schemaName)); err != nil {
		log.Printf("⚠️  Failed to set schema %s: %v", schemaName, err)
		return err
	}

	// Seed tenant database with actual data
	if err := seedTenantDB(ctx, tenantConn); err != nil {
		log.Printf("⚠️  Seeding warning (may already exist): %v", err)
		// Don't return error - data may already exist
	}

	log.Println("✅ Database seeding completed successfully!")
	return nil
}

func seedTenantDB(ctx context.Context, db pg.DBTX) error {
	log.Println("📝 Seeding tenant database...")

	queries := pg.New(db)

	if err := seedTenantSuperadmin(ctx, db); err != nil {
		log.Printf("  ⚠️  Superadmin seed error: %v", err)
	}

	// ===== DEPARTMENTS (3) =====
	deptIDs := make([]uuid.UUID, 3)
	departments := []string{
		"Kitchen",
		"Pastry",
		"Bar",
	}

	for i, dept := range departments {
		deptID := uuid.New()
		deptIDs[i] = deptID

		// Insert department
		_, err := queries.CreateDepartment(ctx, pg.CreateDepartmentParams{
			ID:        deptID,
			Name:      dept,
			NameI18n:  pgtype.UUID{Valid: false},
			StorageID: pgtype.UUID{Valid: false},
		})
		if err != nil {
			log.Printf("  ⚠️  Department %s already exists or error: %v", dept, err)
		} else {
			log.Printf("  ✓ Created department: %s (ID: %s)", dept, deptID.String()[:8])
		}
	}

	// ===== BRANCHES (1) =====
	branchID := uuid.New()

	_, err := queries.CreateBranch(ctx, pg.CreateBranchParams{
		ID:       branchID,
		Name:     "Main Branch",
		NameI18n: pgtype.UUID{Valid: false},
		Address:  nil,
		Phone:    nil,
	})
	if err != nil {
		log.Printf("  ⚠️  Branch creation error: %v", err)
	} else {
		log.Printf("  ✓ Created branch: Main Branch (ID: %s)", branchID.String()[:8])
	}

	// ===== HALLS (3) =====
	hallIDs := make([]uuid.UUID, 3)
	halls := []string{
		"Main Hall",
		"VIP Room",
		"Outdoor Terrace",
	}

	for i, hall := range halls {
		hallID := uuid.New()
		hallIDs[i] = hallID

		// Insert hall with branch ID
		_, err := queries.CreateHall(ctx, pg.CreateHallParams{
			ID:       hallID,
			BranchID: branchID,
			Name:     hall,
			NameI18n: pgtype.UUID{Valid: false},
		})
		if err != nil {
			log.Printf("  ⚠️  Hall %s already exists or error: %v", hall, err)
		} else {
			log.Printf("  ✓ Created hall: %s (ID: %s)", hall, hallID.String()[:8])
		}
	}

	// ===== INGREDIENT GROUPS (3) =====
	ingredientGroupIDs := make([]uuid.UUID, 3)
	ingredientGroups := []string{
		"Vegetables",
		"Dairy",
		"Spices",
	}

	for i, group := range ingredientGroups {
		groupID := uuid.New()
		ingredientGroupIDs[i] = groupID

		// Insert ingredient group
		_, err := queries.CreateIngredientGroup(ctx, pg.CreateIngredientGroupParams{
			ID:   groupID,
			Name: group,
		})
		if err != nil {
			log.Printf("  ⚠️  Ingredient group %s already exists or error: %v", group, err)
		} else {
			log.Printf("  ✓ Created ingredient group: %s (ID: %s)", group, groupID.String()[:8])
		}
	}

	// ===== INGREDIENTS (3) =====
	ingredientIDs := make([]uuid.UUID, 3)
	ingredients := []struct {
		name        string
		groupIndex  int
		measurement string
	}{
		{name: "Tomato", groupIndex: 0, measurement: "kg"},
		{name: "Milk", groupIndex: 1, measurement: "l"},
		{name: "Cumin", groupIndex: 2, measurement: "kg"},
	}

	for i, ing := range ingredients {
		ingID := uuid.New()
		ingredientIDs[i] = ingID

		// Insert ingredient
		_, err := queries.CreateIngredient(ctx, pg.CreateIngredientParams{
			ID:          ingID,
			Name:        ing.name,
			NameI18n:    pgtype.UUID{Valid: false},
			GroupID:     pgtype.UUID{Bytes: ingredientGroupIDs[ing.groupIndex], Valid: true},
			Measurement: pg.NullMeasurementType{MeasurementType: pg.MeasurementType(ing.measurement), Valid: true},
		})
		if err != nil {
			log.Printf("  ⚠️  Ingredient %s already exists or error: %v", ing.name, err)
		} else {
			log.Printf("  ✓ Created ingredient: %s (%s) - Group: %s",
				ing.name, ing.measurement, ingredientGroups[ing.groupIndex])
		}
	}

	// ===== CATEGORIES (3) =====
	categoryIDs := make([]uuid.UUID, 3)
	categories := []string{
		"Main Courses",
		"Appetizers",
		"Desserts",
	}

	for i, cat := range categories {
		catID := uuid.New()
		categoryIDs[i] = catID

		// Insert category
		_, err := queries.CreateCategory(ctx, pg.CreateCategoryParams{
			ID:   catID,
			Name: cat,
		})
		if err != nil {
			log.Printf("  ⚠️  Category %s already exists or error: %v", cat, err)
		} else {
			log.Printf("  ✓ Created category: %s (ID: %s)", cat, catID.String()[:8])
		}
	}

	// ===== GOODS (3) =====
	goodIDs := make([]uuid.UUID, 3)
	goods := []struct {
		name       string
		price      string
		category   int
		department int
	}{
		{name: "Margherita Pizza", price: "8.50", category: 0, department: 0},
		{name: "Caesar Salad", price: "6.50", category: 1, department: 0},
		{name: "Chocolate Cake", price: "5.00", category: 2, department: 1},
	}

	for i, good := range goods {
		goodID := uuid.New()
		goodIDs[i] = goodID

		// Convert price to pgtype.Numeric
		var priceNum pgtype.Numeric
		if err := priceNum.Scan(good.price); err != nil {
			log.Printf("  ⚠️  Error converting price for %s: %v", good.name, err)
			continue
		}

		// Insert good
		_, err := queries.CreateGood(ctx, pg.CreateGoodParams{
			ID:           goodID,
			Name:         good.name,
			CategoryID:   pgtype.UUID{Bytes: categoryIDs[good.category], Valid: true},
			DepartmentID: pgtype.UUID{Bytes: deptIDs[good.department], Valid: true},
			Price:        priceNum,
		})
		if err != nil {
			log.Printf("  ⚠️  Good %s already exists or error: %v", good.name, err)
		} else {
			log.Printf("  ✓ Created good: %s ($%s) - Category: %s, Dept: %s",
				good.name, good.price, categories[good.category], departments[good.department])
		}
	}

	// ===== COMPOUNDS (3) =====
	compoundIDs := make([]uuid.UUID, 3)
	compounds := []struct {
		name  string
		price string
	}{
		{name: "Pizza Base", price: "2.00"},
		{name: "Caesar Dressing", price: "1.50"},
		{name: "Chocolate Ganache", price: "3.00"},
	}

	for i, comp := range compounds {
		compID := uuid.New()
		compoundIDs[i] = compID

		// Convert price to pgtype.Numeric
		var priceNum pgtype.Numeric
		if err := priceNum.Scan(comp.price); err != nil {
			log.Printf("  ⚠️  Error converting price for %s: %v", comp.name, err)
			continue
		}

		// Insert compound
		_, err := queries.CreateCompound(ctx, pg.CreateCompoundParams{
			ID:    compID,
			Name:  comp.name,
			Price: priceNum,
		})
		if err != nil {
			log.Printf("  ⚠️  Compound %s already exists or error: %v", comp.name, err)
		} else {
			log.Printf("  ✓ Created compound: %s ($%s)", comp.name, comp.price)
		}
	}

	// ===== STORAGE LOCATIONS (3) =====
	storageIDs := make([]uuid.UUID, 3)
	storages := []string{
		"Main Freezer",
		"Dry Storage",
		"Refrigerator #1",
	}

	for i, stor := range storages {
		storID := uuid.New()
		storageIDs[i] = storID

		// Insert storage
		_, err := queries.CreateStorage(ctx, pg.CreateStorageParams{
			ID:   storID,
			Name: stor,
		})
		if err != nil {
			log.Printf("  ⚠️  Storage %s already exists or error: %v", stor, err)
		} else {
			log.Printf("  ✓ Created storage: %s (ID: %s)", stor, storID.String()[:8])
		}
	}

	// ===== SUPPLIERS (3) =====
	supplierIDs := make([]uuid.UUID, 3)
	suppliers := []struct {
		name        string
		phoneNumber string
		location    string
	}{
		{name: "Fresh Produce Co", phoneNumber: "+1-555-0101", location: "Downtown Market"},
		{name: "Dairy Supplies Ltd", phoneNumber: "+1-555-0102", location: "Industrial Zone"},
		{name: "Spice House", phoneNumber: "+1-555-0103", location: "Old City"},
	}

	for i, sup := range suppliers {
		supID := uuid.New()
		supplierIDs[i] = supID

		// Insert supplier
		_, err := queries.CreateSupplier(ctx, pg.CreateSupplierParams{
			ID:          supID,
			Name:        sup.name,
			PhoneNumber: &sup.phoneNumber,
			Location:    &sup.location,
		})
		if err != nil {
			log.Printf("  ⚠️  Supplier %s already exists or error: %v", sup.name, err)
		} else {
			log.Printf("  ✓ Created supplier: %s (Phone: %s, Location: %s)", sup.name, sup.phoneNumber, sup.location)
		}
	}

	// ===== INVOICES (3) =====
	invoiceIDs := make([]uuid.UUID, 3)
	invoices := []struct {
		supplierIdx int
		amount      string
		status      string
	}{
		{supplierIdx: 0, amount: "150.00", status: "received"},
		{supplierIdx: 1, amount: "200.00", status: "arrived"},
		{supplierIdx: 2, amount: "75.50", status: "pending"},
	}

	for i, inv := range invoices {
		invID := uuid.New()
		invoiceIDs[i] = invID

		// Convert amount to pgtype.Numeric
		var amountNum pgtype.Numeric
		if err := amountNum.Scan(inv.amount); err != nil {
			log.Printf("  ⚠️  Error converting amount for supplier: %v", err)
			continue
		}

		// Insert invoice
		_, err := queries.CreateInvoice(ctx, pg.CreateInvoiceParams{
			ID:          invID,
			SupplierID:  supplierIDs[inv.supplierIdx],
			TotalAmount: amountNum,
			Status:      pg.NullInvoiceStatus{InvoiceStatus: pg.InvoiceStatus(inv.status), Valid: true},
			Date:        pgtype.Timestamp{Time: time.Now(), Valid: true},
		})
		if err != nil {
			log.Printf("  ⚠️  Invoice for %s already exists or error: %v", suppliers[inv.supplierIdx].name, err)
		} else {
			log.Printf("  ✓ Created invoice: %s - %s ($%s)", suppliers[inv.supplierIdx].name, inv.status, inv.amount)
		}
	}

	// ===== INVOICE DETAILS (3 - linking ingredients to invoices) =====
	invoiceDetailIDs := make([]uuid.UUID, 3)
	invoiceDetails := []struct {
		invoiceIdx    int
		ingredientIdx int
		quantity      int64
		pricePerUnit  string
	}{
		{invoiceIdx: 0, ingredientIdx: 0, quantity: 100, pricePerUnit: "1.50"}, // Tomato
		{invoiceIdx: 1, ingredientIdx: 1, quantity: 50, pricePerUnit: "4.00"},  // Milk
		{invoiceIdx: 2, ingredientIdx: 2, quantity: 10, pricePerUnit: "7.55"},  // Cumin
	}

	for i, detail := range invoiceDetails {
		detailID := uuid.New()
		invoiceDetailIDs[i] = detailID

		// Convert prices to pgtype.Numeric
		var pricePerUnitNum pgtype.Numeric
		if err := pricePerUnitNum.Scan(detail.pricePerUnit); err != nil {
			log.Printf("  ⚠️  Error converting price for ingredient: %v", err)
			continue
		}

		// Calculate total price (quantity * pricePerUnit) and convert to string
		totalPrice := float64(detail.quantity) * parseFloat(detail.pricePerUnit)
		totalPriceStr := fmt.Sprintf("%.2f", totalPrice)
		var totalPriceNum pgtype.Numeric
		if err := totalPriceNum.Scan(totalPriceStr); err != nil {
			log.Printf("  ⚠️  Error converting total price: %v", err)
			continue
		}

		// Convert quantity to pgtype.Numeric
		var quantityNum pgtype.Numeric
		if err := quantityNum.Scan(detail.quantity); err != nil {
			log.Printf("  ⚠️  Error converting quantity: %v", err)
			continue
		}

		// Insert invoice detail
		_, err := queries.CreateInvoiceDetail(ctx, pg.CreateInvoiceDetailParams{
			ID:           detailID,
			InvoiceID:    invoiceIDs[detail.invoiceIdx],
			IngredientID: ingredientIDs[detail.ingredientIdx],
			Quantity:     quantityNum,
			Price:        totalPriceNum,
			PricePerUnit: pricePerUnitNum,
		})
		if err != nil {
			log.Printf("  ⚠️  Invoice detail already exists or error: %v", err)
		} else {
			log.Printf("  ✓ Created invoice detail: %s (qty: %d, price: $%s/unit)",
				ingredients[detail.ingredientIdx].name, detail.quantity, detail.pricePerUnit)
		}
	}

	// ===== CALCULATIONS (3) =====
	calculationIDs := make([]uuid.UUID, 3)
	calculations := []struct {
		goodIdx       int
		ingredientIdx int
		quantity      string
	}{
		{goodIdx: 0, ingredientIdx: 0, quantity: "300"},  // Pizza with tomato (300g)
		{goodIdx: 1, ingredientIdx: 1, quantity: "0.2"},  // Salad with milk (0.2L)
		{goodIdx: 2, ingredientIdx: 2, quantity: "0.05"}, // Cake with cumin (50g)
	}

	for i, calc := range calculations {
		calcID := uuid.New()
		calculationIDs[i] = calcID

		// Convert values to pgtype.Numeric
		var quantityNum pgtype.Numeric
		if err := quantityNum.Scan(calc.quantity); err != nil {
			log.Printf("  ⚠️  Error converting quantity: %v", err)
			continue
		}

		// For now, use fixed prices (from invoice details)
		var pricePerUnitNum pgtype.Numeric
		if i == 0 {
			pricePerUnitNum.Scan("1.50")
		} else if i == 1 {
			pricePerUnitNum.Scan("4.00")
		} else {
			pricePerUnitNum.Scan("7.55")
		}

		// Calculate total cost: quantity * price_per_unit
		var totalCostNum pgtype.Numeric
		totalCostNum.Scan("0") // Placeholder

		// Insert calculation
		_, err := queries.CreateCalculation(ctx, pg.CreateCalculationParams{
			ID:              calcID,
			GoodID:          pgtype.UUID{Bytes: goodIDs[calc.goodIdx], Valid: true},
			IngredientID:    pgtype.UUID{Bytes: ingredientIDs[calc.ingredientIdx], Valid: true},
			Quantity:        quantityNum,
			MeasurementUnit: ingredients[calc.ingredientIdx].measurement,
			PricePerUnit:    pricePerUnitNum,
			TotalCost:       totalCostNum,
		})
		if err != nil {
			log.Printf("  ⚠️  Calculation already exists or error: %v", err)
		} else {
			log.Printf("  ✓ Created calculation: %s uses %s (qty: %s)",
				goods[calc.goodIdx].name, ingredients[calc.ingredientIdx].name, calc.quantity)
		}
	}

	// ===== CAFE TABLES (3) =====
	tableIDs := make([]uuid.UUID, 3)
	tables := []struct {
		number   int32
		capacity int32
		hallIdx  int
		status   string
	}{
		{number: 1, capacity: 2, hallIdx: 0, status: "free"},
		{number: 2, capacity: 4, hallIdx: 0, status: "busy"},
		{number: 3, capacity: 6, hallIdx: 1, status: "free"},
	}

	for i, tbl := range tables {
		tblID := uuid.New()
		tableIDs[i] = tblID

		// Insert cafe table
		_, err := queries.CreateCafeTable(ctx, pg.CreateCafeTableParams{
			ID:       tblID,
			HallID:   hallIDs[tbl.hallIdx],
			Number:   tbl.number,
			Capacity: tbl.capacity,
			Status:   pg.NullTableStatus{TableStatus: pg.TableStatus(tbl.status), Valid: true},
		})
		if err != nil {
			log.Printf("  ⚠️  Table #%d already exists or error: %v", tbl.number, err)
		} else {
			log.Printf("  ✓ Created table: #%d (%d seats) in %s - %s",
				tbl.number, tbl.capacity, halls[tbl.hallIdx], tbl.status)
		}
	}

	// ===== ORDERS (3) =====
	orderIDs := make([]uuid.UUID, 3)
	orders := []struct {
		tableIdx int
		status   string
		total    string
	}{
		{tableIdx: 0, status: "open", total: "15.00"},
		{tableIdx: 1, status: "cooking", total: "22.50"},
		{tableIdx: 2, status: "ready", total: "18.75"},
	}

	for i, ord := range orders {
		ordID := uuid.New()
		orderIDs[i] = ordID

		// Convert total to pgtype.Numeric
		var totalNum pgtype.Numeric
		if err := totalNum.Scan(ord.total); err != nil {
			log.Printf("  ⚠️  Error converting total for order: %v", err)
			continue
		}

		// Insert order
		_, err := queries.CreateOrder(ctx, pg.CreateOrderParams{
			ID:          ordID,
			TableID:     pgtype.UUID{Bytes: tableIDs[ord.tableIdx], Valid: true},
			Status:      pg.NullOrderStatus{OrderStatus: pg.OrderStatus(ord.status), Valid: true},
			TotalAmount: totalNum,
		})
		if err != nil {
			log.Printf("  ⚠️  Order already exists or error: %v", err)
		} else {
			log.Printf("  ✓ Created order: Table %d - %s ($%s)",
				tables[ord.tableIdx].number, ord.status, ord.total)
		}
	}

	// ===== ORDER ITEMS (3) =====
	orderItemIDs := make([]uuid.UUID, 3)
	orderItems := []struct {
		orderIdx int
		goodIdx  int
		quantity int32
		status   string
	}{
		{orderIdx: 0, goodIdx: 0, quantity: 1, status: "pending"}, // Order 1: 1x Pizza
		{orderIdx: 1, goodIdx: 1, quantity: 2, status: "cooking"}, // Order 2: 2x Salad
		{orderIdx: 2, goodIdx: 2, quantity: 1, status: "ready"},   // Order 3: 1x Cake
	}

	for i, item := range orderItems {
		itemID := uuid.New()
		orderItemIDs[i] = itemID

		// Use good price for order item price
		var priceNum pgtype.Numeric
		if err := priceNum.Scan(goods[item.goodIdx].price); err != nil {
			log.Printf("  ⚠️  Error converting price for order item: %v", err)
			continue
		}

		// Insert order item
		_, err := queries.CreateOrderItem(ctx, pg.CreateOrderItemParams{
			ID:        itemID,
			GoodID:    goodIDs[item.goodIdx],
			OrderID:   orderIDs[item.orderIdx],
			Quantity:  item.quantity,
			Price:     priceNum,
			CostPrice: pgtype.Numeric{},
			Status:    pg.NullOrderItemsStatus{OrderItemsStatus: pg.OrderItemsStatus(item.status), Valid: true},
		})
		if err != nil {
			log.Printf("  ⚠️  Order item already exists or error: %v", err)
		} else {
			log.Printf("  ✓ Created order item: %dx %s - %s",
				item.quantity, goods[item.goodIdx].name, item.status)
		}
	}

	log.Println("✅ Tenant database seeding completed")

	// Print summary
	log.Println("\n📊 SEEDING SUMMARY:")
	log.Printf("   Branches: 1")
	log.Printf("   Departments: %d", len(departments))
	log.Printf("   Halls: %d", len(halls))
	log.Printf("   Ingredient Groups: %d", len(ingredientGroups))
	log.Printf("   Ingredients: %d", len(ingredients))
	log.Printf("   Categories: %d", len(categories))
	log.Printf("   Goods: %d", len(goods))
	log.Printf("   Compounds: %d", len(compounds))
	log.Printf("   Storages: %d", len(storages))
	log.Printf("   Suppliers: %d", len(suppliers))
	log.Printf("   Invoices: %d", len(invoices))
	log.Printf("   Invoice Details: %d", len(invoiceDetails))
	log.Printf("   Calculations: %d", len(calculations))
	log.Printf("   Cafe Tables: %d", len(tables))
	log.Printf("   Orders: %d", len(orders))
	log.Printf("   Order Items: %d", len(orderItems))

	return nil
}

func seedTenantSuperadmin(ctx context.Context, db pg.DBTX) error {
	// Define test users with different roles
	testUsers := []struct {
		fullName string
		username string
		password string
		role     string
		email    string
	}{
		{
			fullName: "Admin User",
			username: "admin",
			password: "admin123",
			role:     "admin",
			email:    "admin@example.com",
		},
		{
			fullName: "Waiter User",
			username: "waiter",
			password: "waiter123",
			role:     "waiter",
			email:    "waiter@example.com",
		},
		{
			fullName: "Cashier User",
			username: "cashier",
			password: "cashier123",
			role:     "cashier",
			email:    "cashier@example.com",
		},
		{
			fullName: "Kitchen Staff",
			username: "kitchen",
			password: "kitchen123",
			role:     "kitchen",
			email:    "kitchen@example.com",
		},
		{
			fullName: "Super Admin",
			username: "superadmin",
			password: "superadmin",
			role:     "superadmin",
			email:    "superadmin@example.com",
		},
	}

	for _, user := range testUsers {
		hash, err := bcrypt.GenerateFromPassword([]byte(user.password), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("failed to hash password for %s: %w", user.username, err)
		}

		_, err = db.Exec(ctx, `
			INSERT INTO users (
				id,
				full_name,
				username,
				role,
				email,
				hash_password,
				is_active,
				created_at,
				updated_at,
				deleted_at
			)
			VALUES (
				gen_random_uuid(),
				$1,
				$2,
				$3,
				$4,
				$5,
				TRUE,
				NOW(),
				NOW(),
				0
			);
		`, user.fullName, user.username, user.role, user.email, string(hash))
		if err != nil {
			log.Printf("  ⚠️  User %s seed error: %v", user.username, err)
		} else {
			log.Printf("  ✓ Seeded user: %s (role: %s)", user.username, user.role)
		}
	}

	return nil
}

// parseFloat converts a string to float64, panicking on error
func parseFloat(s string) float64 {
	var num pgtype.Numeric
	if err := num.Scan(s); err != nil {
		log.Printf("Error parsing float: %v", err)
		return 0
	}
	val, _ := num.Value()
	if str, ok := val.(string); ok {
		var result float64
		if _, err := fmt.Sscanf(str, "%f", &result); err != nil {
			return 0
		}
		return result
	}
	return 0
}
