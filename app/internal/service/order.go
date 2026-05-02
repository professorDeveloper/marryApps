package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"math"
	"strconv"
	"strings"
	"time"

	"firebase.google.com/go/v4/messaging"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
	"gitlab.yurtal.tech/company/maryai/back/pkg/notification"
)

type OrderS struct {
	repo *repository.Repository
}

var (
	ErrOrderNotFound          = errors.New("order not found")
	ErrOrderAlreadyActive     = errors.New("order already active")
	ErrOrderCannotBeActivated = errors.New("order cannot be activated from current status")
)

func NewOrderS(repo *repository.Repository) *OrderS {
	return &OrderS{repo: repo}
}

type orderStockTx interface {
	GetCalculationsByGoodID(ctx context.Context, goodID pgtype.UUID) ([]pg.Calculation, error)
	GetStorageByGoodID(ctx context.Context, goodID uuid.UUID) (pgtype.UUID, error)
	EnsureIngredientStockByStorage(ctx context.Context, arg pg.EnsureIngredientStockByStorageParams) (uuid.UUID, error)
	GetStockByIngredientAndStorageForUpdate(ctx context.Context, arg pg.GetStockByIngredientAndStorageForUpdateParams) (pg.IngredientStock, error)
	GetIngredientByID(ctx context.Context, id uuid.UUID) (pg.Ingredient, error)
	RemoveFromIngredientStock(ctx context.Context, arg pg.RemoveFromIngredientStockParams) (pg.IngredientStock, error)
	InsertIngredientStockMovement(ctx context.Context, arg pg.InsertIngredientStockMovementParams) error
}

func withOrderBatchSavepoint(ctx context.Context, name string, fn func() error) error {
	tx, ok := repository.TenantTxFromContext(ctx)
	if !ok || tx == nil {
		return fn()
	}

	if _, err := tx.Exec(ctx, "SAVEPOINT "+name); err != nil {
		return err
	}

	if err := fn(); err != nil {
		if _, rbErr := tx.Exec(ctx, "ROLLBACK TO SAVEPOINT "+name); rbErr != nil {
			return fmt.Errorf("%v (rollback savepoint error: %w)", err, rbErr)
		}
		if _, relErr := tx.Exec(ctx, "RELEASE SAVEPOINT "+name); relErr != nil {
			log.Printf("release savepoint after rollback failed: %v", relErr)
		}
		return err
	}

	if _, err := tx.Exec(ctx, "RELEASE SAVEPOINT "+name); err != nil {
		return err
	}

	return nil
}

func (s *OrderS) AddOrderItems(ctx context.Context, orderID string, req model.AddOrderItemsRequest) (*model.AddOrderItemsResponse, error) {
	if orderID == "" {
		return nil, fmt.Errorf("order_id is required")
	}
	if len(req.Items) == 0 {
		return nil, fmt.Errorf("items is required")
	}

	oID, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order_id: %w", err)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	existing, err := q.GetOrderByID(txCtx, oID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("order not found")
		}
		return nil, fmt.Errorf("failed to get order: %w", err)
	}

	if existing.Status.Valid {
		st := string(existing.Status.OrderStatus)
		if st == string(model.OrderStatusPaid) || st == string(model.OrderStatusCancelled) {
			return nil, fmt.Errorf("cannot add items to %s order", st)
		}
	}

	created := make([]model.OrderItemResponse, 0, len(req.Items))

	for i, it := range req.Items {
		goodUUID, err := uuid.Parse(it.GoodID)
		if err != nil {
			return nil, fmt.Errorf("items[%d]: invalid good_id", i)
		}
		if it.Quantity <= 0 {
			return nil, fmt.Errorf("items[%d]: quantity must be greater than 0", i)
		}

		good, err := q.GetGoodByID(txCtx, goodUUID)
		if err != nil {
			if err == pgx.ErrNoRows {
				return nil, fmt.Errorf("items[%d]: good not found", i)
			}
			return nil, fmt.Errorf("items[%d]: failed to fetch good: %w", i, err)
		}

		item, err := q.CreateOrderItem(txCtx, pg.CreateOrderItemParams{
			ID:        uuid.New(),
			GoodID:    goodUUID,
			OrderID:   oID,
			Quantity:  it.Quantity,
			Price:     good.Price,
			CostPrice: good.CostPrice,
			Status: pg.NullOrderItemsStatus{
				OrderItemsStatus: pg.OrderItemsStatus(model.OrderItemStatusPending),
				Valid:            true,
			},
			Comment: it.Comment,
		})
		if err != nil {
			return nil, fmt.Errorf("items[%d]: failed to create order item: %w", i, err)
		}

		if err := s.saveOrderItemModifiers(txCtx, q, item.ID, goodUUID, it.Modifiers); err != nil {
			return nil, fmt.Errorf("items[%d]: %w", i, err)
		}

		if err := s.consumeItemStockWithModifiers(txCtx, q, item.ID); err != nil {
			return nil, fmt.Errorf("items[%d]: failed to deduct stock: %w", i, err)
		}

		if resp := toOrderItemResponse(item); resp != nil {
			created = append(created, *resp)
		}
	}

	if err := q.RecalculateOrderTotalsFromItems(txCtx, oID); err != nil {
		return nil, fmt.Errorf("failed to recalculate order totals: %w", err)
	}

	order, err := q.GetOrderByID(txCtx, oID)
	if err != nil {
		return nil, fmt.Errorf("failed to refetch order: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return &model.AddOrderItemsResponse{
		Order: toOrderResponse(order),
		Items: created,
	}, nil
}

func (s *OrderS) CreateOrder(ctx context.Context, req model.CreateOrderRequest) (*model.OrderResponse, error) {
	orderType := "dine_in"
	if req.OrderType != nil && *req.OrderType == "takeaway" {
		orderType = "takeaway"
	}

	orderUUID := uuid.New()

	if req.ID != nil && *req.ID != "" {
		parsedID, err := uuid.Parse(*req.ID)
		if err != nil {
			return nil, fmt.Errorf("invalid id: %w", err)
		}

		orderUUID = parsedID

		// Check if order already exists - use read path here
		q, txCtx, tx, ownsTx, err := s.getTenantReadQueries(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to get tenant queries: %w", err)
		}
		if ownsTx {
			defer tx.Rollback(ctx)
		}
		_, err = q.GetOrderByID(txCtx, orderUUID)
		if err == nil {
			return s.GetOrderByID(ctx, orderUUID.String())
		}
		if err != nil && err != pgx.ErrNoRows {
			return nil, fmt.Errorf("failed to check existing order by id: %w", err)
		}
	}

	tableUUID := uuid.Nil
	if orderType == "dine_in" {
		if req.TableID == "" {
			return nil, fmt.Errorf("table_id is required for dine_in orders")
		}
		id, err := uuid.Parse(req.TableID)
		if err != nil {
			return nil, fmt.Errorf("invalid table_id: %w", err)
		}
		tableUUID = id
		// Table validation - use read path
		q, txCtx, tx, ownsTx, err := s.getTenantReadQueries(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to get tenant queries: %w", err)
		}
		if ownsTx {
			defer tx.Rollback(ctx)
		}
		_, err = q.GetCafeTableByID(txCtx, tableUUID)
		if err != nil {
			if err == pgx.ErrNoRows {
				return nil, fmt.Errorf("cafe table not found")
			}
			return nil, fmt.Errorf("failed to fetch cafe table: %w", err)
		}
	}

	waiterUUID := pgtype.UUID{}
	if req.WaiterID != nil && *req.WaiterID != "" {
		id, err := uuid.Parse(*req.WaiterID)
		if err != nil {
			return nil, fmt.Errorf("invalid waiter_id: %w", err)
		}
		waiterUUID = pgtype.UUID{Bytes: id, Valid: true}
	}

	cashierUUID := pgtype.UUID{}
	if req.CashierID != nil && *req.CashierID != "" {
		id, err := uuid.Parse(*req.CashierID)
		if err != nil {
			return nil, fmt.Errorf("invalid cashier_id: %w", err)
		}
		cashierUUID = pgtype.UUID{Bytes: id, Valid: true}
	}

	cashRegisterUUID := pgtype.UUID{}
	if req.CashRegisterID != nil && *req.CashRegisterID != "" {
		id, err := uuid.Parse(*req.CashRegisterID)
		if err != nil {
			return nil, fmt.Errorf("invalid cash_register_id: %w", err)
		}
		cashRegisterUUID = pgtype.UUID{Bytes: id, Valid: true}
	}

	status := pg.NullOrderStatus{
		OrderStatus: pg.OrderStatus(model.OrderStatusOpen),
		Valid:       true,
	}

	scheduledAtPg := pgtype.Timestamptz{}
	if req.ScheduledAt != nil && *req.ScheduledAt != "" {
		t, err := time.Parse(time.RFC3339, *req.ScheduledAt)
		if err != nil {
			return nil, fmt.Errorf("invalid scheduled_at: %w", err)
		}
		scheduledAtPg = pgtype.Timestamptz{Time: t, Valid: true}
		status = pg.NullOrderStatus{
			OrderStatus: pg.OrderStatus(model.OrderStatusReserved),
			Valid:       true,
		}
	} else if req.Status != nil && *req.Status != "" {
		status = pg.NullOrderStatus{
			OrderStatus: pg.OrderStatus(*req.Status),
			Valid:       true,
		}
	}

	clientCreatedAtPg := pgtype.Timestamptz{}
	if req.ClientCreatedAt != nil && *req.ClientCreatedAt != "" {
		t, err := time.Parse(time.RFC3339, *req.ClientCreatedAt)
		if err != nil {
			return nil, fmt.Errorf("invalid client_created_at: %w", err)
		}
		clientCreatedAtPg = pgtype.Timestamptz{
			Time:  t,
			Valid: true,
		}
	}

	isDineIn := orderType == "dine_in" && tableUUID != uuid.Nil
	immediateDineIn := isDineIn && !scheduledAtPg.Valid

	if isDineIn {
		if immediateDineIn {
			// Table locking - use write helper
			q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
			if err != nil {
				return nil, fmt.Errorf("failed to get tenant queries for table lock: %w", err)
			}
			if ownsTx {
				defer tx.Rollback(ctx)
			}

			lockedTable, err := q.LockCafeTableByID(txCtx, tableUUID)
			if err != nil {
				if err == pgx.ErrNoRows {
					return nil, fmt.Errorf("cafe table not found")
				}
				return nil, fmt.Errorf("failed to lock cafe table: %w", err)
			}

			if lockedTable.Status == string(model.TableStatusBusy) {
				// Check active order - use read path
				readQ, readCtx, readTx, ownsReadTx, readErr := s.getTenantReadQueries(ctx)
				if readErr != nil {
					return nil, fmt.Errorf("failed to get tenant queries: %w", readErr)
				}
				if ownsReadTx {
					defer readTx.Rollback(ctx)
				}
				_, err = readQ.GetActiveOpenOrderByTableID(readCtx, tableUUID)
				if err == nil {
					return nil, fmt.Errorf("table already has an active order")
				}
				if err != nil && err != pgx.ErrNoRows {
					return nil, fmt.Errorf("failed to check active order by table: %w", err)
				}
				log.Printf("CreateOrder: healing stale busy status for table %s", tableUUID)
				if _, healErr := q.SetTableFree(txCtx, tableUUID); healErr != nil {
					log.Printf("CreateOrder: failed to heal table status: %v", healErr)
				}
			}

			if ownsTx {
				if err := tx.Commit(ctx); err != nil {
					return nil, fmt.Errorf("failed to commit table lock: %w", err)
				}
			}
		}

		// Check active order - use read path
		readQ, readCtx, readTx, ownsReadTx, checkErr := s.getTenantReadQueries(ctx)
		if checkErr != nil {
			return nil, fmt.Errorf("failed to get tenant queries: %w", checkErr)
		}
		if ownsReadTx {
			defer readTx.Rollback(ctx)
		}
		_, checkErr = readQ.GetActiveOpenOrderByTableID(readCtx, tableUUID)
		if checkErr == nil {
			return nil, fmt.Errorf("table already has an active order")
		}
		if checkErr != nil && checkErr != pgx.ErrNoRows {
			return nil, fmt.Errorf("failed to check active order by table: %w", checkErr)
		}
	}

	var totalAmount pgtype.Numeric
	if err := totalAmount.Scan("0"); err != nil {
		return nil, fmt.Errorf("failed to init total_amount: %w", err)
	}

	tableIDPg := pgtype.UUID{}
	if tableUUID != uuid.Nil {
		tableIDPg = pgtype.UUID{Bytes: tableUUID, Valid: true}
	}

	// Main order creation - use write helper
	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	createdOrder, err := q.CreateOrder(txCtx, pg.CreateOrderParams{
		ID:              orderUUID,
		TableID:         tableIDPg,
		WaiterID:        waiterUUID,
		CashierID:       cashierUUID,
		CashRegisterID:  cashRegisterUUID,
		Status:          status,
		GuestCount:      req.GuestCount,
		TotalAmount:     totalAmount,
		Comment:         req.Comment,
		OrderType:       orderType,
		ScheduledAt:     scheduledAtPg,
		ClientCreatedAt: clientCreatedAtPg,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	orderForResponse := any(createdOrder)

	if immediateDineIn {
		if _, err := q.SetTableBusy(txCtx, tableUUID); err != nil {
			return nil, fmt.Errorf("failed to set table busy: %w", err)
		}
	}

	billNo, err := q.NextDailyBillNo(txCtx)
	if err != nil {
		return nil, fmt.Errorf("failed to generate bill number: %w", err)
	}

	var servicePercent pgtype.Numeric
	if isDineIn {
		servicePercent, err = q.GetDefaultServicePercentByTable(txCtx, tableUUID)
		if err != nil {
			return nil, fmt.Errorf("failed to get default service percent: %w", err)
		}
	} else {
		_ = servicePercent.Scan("0")
	}

	if err := q.InitOrderBillFields(txCtx, createdOrder.ID, billNo, servicePercent); err != nil {
		return nil, fmt.Errorf("failed to init bill fields: %w", err)
	}

	if len(req.Items) > 0 {
		for _, it := range req.Items {
			goodUUID, err := uuid.Parse(it.GoodID)
			if err != nil {
				return nil, fmt.Errorf("invalid good_id: %w", err)
			}
			if it.Quantity <= 0 {
				return nil, fmt.Errorf("quantity must be greater than 0")
			}

			good, err := q.GetGoodByID(txCtx, goodUUID)
			if err != nil {
				return nil, fmt.Errorf("failed to fetch good: %w", err)
			}

			createdIt, err := q.CreateOrderItem(txCtx, pg.CreateOrderItemParams{
				ID:        uuid.New(),
				GoodID:    goodUUID,
				OrderID:   createdOrder.ID,
				Quantity:  it.Quantity,
				Price:     good.Price,
				CostPrice: good.CostPrice,
				Status: pg.NullOrderItemsStatus{
					OrderItemsStatus: pg.OrderItemsStatus(model.OrderItemStatusPending),
					Valid:            true,
				},
				Comment: it.Comment,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to create order item: %w", err)
			}
			if err := s.saveOrderItemModifiers(txCtx, q, createdIt.ID, goodUUID, it.Modifiers); err != nil {
				return nil, err
			}
			if err := s.consumeItemStockWithModifiers(txCtx, q, createdIt.ID); err != nil {
				return nil, fmt.Errorf("failed to deduct stock for created order item: %w", err)
			}

		}

		if err := q.RecalculateOrderTotalsFromItems(txCtx, createdOrder.ID); err != nil {
			return nil, fmt.Errorf("failed to recalculate order totals: %w", err)
		}

		refetched, err := q.GetOrderByID(txCtx, createdOrder.ID)
		if err == nil {
			orderForResponse = refetched
		}
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	resp := toOrderResponse(orderForResponse)
	if resp == nil {
		return nil, errors.New("failed to convert order to response")
	}

	return resp, nil
}

func (s *OrderS) CreateOrdersBatch(ctx context.Context, req model.CreateOrderBatchRequest) (*model.CreateOrderBatchResponse, error) {
	if len(req.Orders) == 0 {
		return nil, fmt.Errorf("orders is required")
	}

	resp := &model.CreateOrderBatchResponse{
		Total:   len(req.Orders),
		Results: make([]model.CreateOrderBatchItemResult, 0, len(req.Orders)),
	}

	for i, orderReq := range req.Orders {
		result := model.CreateOrderBatchItemResult{
			Index:  i,
			Status: "created",
		}

		if orderReq.ID != nil && *orderReq.ID != "" {
			result.InputOrderID = orderReq.ID
		}

		var createdOrder *model.OrderResponse

		err := withOrderBatchSavepoint(ctx, fmt.Sprintf("order_batch_%d", i+1), func() error {
			var err error
			createdOrder, err = s.CreateOrder(ctx, orderReq)
			return err
		})

		if err != nil {
			msg := err.Error()
			result.Status = "failed"
			result.Error = &msg
			resp.FailedCount++
			resp.Results = append(resp.Results, result)
			if !req.ContinueOnError {
				return nil, fmt.Errorf("orders[%d]: %w", i, err)
			}

			continue
		}

		result.Order = createdOrder
		resp.SuccessCount++
		resp.Results = append(resp.Results, result)
	}

	return resp, nil
}

func (s *OrderS) GetOrderByID(ctx context.Context, orderID string) (*model.OrderResponse, error) {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}

	var resp *model.OrderResponse
	q, txCtx, tx, ownsTx, err := s.getTenantReadQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	order, err := q.GetOrderByID(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get order: %w", err)
	}

	resp = toOrderResponse(order)
	if resp == nil {
		return nil, nil
	}

	items, err := q.GetOrderItemsByOrderID(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get order items: %w", err)
	}

	resp.Items = make([]model.OrderItemResponse, 0, len(items))
	for _, item := range items {
		if itemResp := toOrderItemResponse(item); itemResp != nil {
			resp.Items = append(resp.Items, *itemResp)
		}
	}

	modRows, err := q.ListOrderItemModifiersByOrderID(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to list order item modifiers: %w", err)
	}
	byItem := make(map[string][]model.OrderItemModifierResponse)
	for _, m := range modRows {
		oid := m.OrderItemID.String()
		byItem[oid] = append(byItem[oid], model.OrderItemModifierResponse{
			ID:         m.ID.String(),
			ModifierID: m.ModifierID.String(),
			Units:      m.Units,
		})
	}
	for i := range resp.Items {
		if mods, ok := byItem[resp.Items[i].ID]; ok {
			resp.Items[i].Modifiers = mods
		}
	}

	if err := s.attachOrderBillSummary(txCtx, q, id, resp); err != nil {
		return nil, fmt.Errorf("failed to attach order bill summary: %w", err)
	}

	if err := s.attachTableAmountPreview(txCtx, q, id, resp); err != nil {
		return nil, fmt.Errorf("failed to attach table amount preview: %w", err)
	}

	return resp, nil
}

func (s *OrderS) attachTableAmountPreview(ctx context.Context, q *pg.Queries, orderID uuid.UUID, resp *model.OrderResponse) error {
	if resp == nil {
		return nil
	}

	ctxRow, err := q.GetOrderTimerContext(ctx, orderID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil
		}
		return fmt.Errorf("failed to get order timer context: %w", err)
	}

	if ctxRow.OrderType != "dine_in" {
		return nil
	}
	if !ctxRow.TableID.Valid {
		return nil
	}
	if ctxRow.TableType != string(model.TableTypeTimeBased) {
		return nil
	}

	tableType := ctxRow.TableType
	resp.TableType = &tableType

	if ctxRow.PricePerHour.Valid {
		v := numericToStr(ctxRow.PricePerHour)
		resp.PricePerHour = &v
	}

	var tableAmount *string
	var startedAt *time.Time

	session, err := q.GetLatestTableTimeSessionByOrderID(ctx, orderID)
	switch {
	case err == nil:
		timer := toTableTimerResponse(ctxRow, &session, time.Now())

		if timer.StartedAt != nil {
			startedAt = timer.StartedAt
		}

		if timer.FinalAmount != nil && *timer.FinalAmount != "" {
			tableAmount = timer.FinalAmount
		} else if timer.CurrentAmount != nil && *timer.CurrentAmount != "" {
			tableAmount = timer.CurrentAmount
		}

	case err == pgx.ErrNoRows:
		startedAt = nil
		zero := "0.00"
		tableAmount = &zero

	default:
		return fmt.Errorf("failed to get latest table timer session: %w", err)
	}

	resp.TableStartedAt = startedAt
	resp.TableAmount = tableAmount

	if tableAmount != nil && *tableAmount != "" {
		isPaid := ctxRow.OrderStatus.Valid &&
			string(ctxRow.OrderStatus.OrderStatus) == string(model.OrderStatusPaid)

		if !isPaid {
			baseTotal := parseAmountString(resp.TotalAmount)
			tableTotal := parseAmountString(*tableAmount)
			resp.TotalAmount = formatAmountString(baseTotal + tableTotal)
		}
	}

	return nil
}

func (s *OrderS) attachOrderBillSummary(ctx context.Context, q *pg.Queries, orderID uuid.UUID, resp *model.OrderResponse) error {
	if resp == nil {
		return nil
	}

	bill, err := q.GetBillDetails(ctx, orderID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil
		}
		return fmt.Errorf("failed to get bill details: %w", err)
	}

	itemsAmount := numericToString(bill.FoodTotal)
	servicePercent := numericToString(bill.ServicePercent)
	serviceAmount := numericToString(bill.ServiceAmount)

	resp.ItemsAmount = &itemsAmount
	resp.ServicePercent = &servicePercent
	resp.ServiceAmount = &serviceAmount

	return nil
}

func parseAmountString(s string) float64 {
	if s == "" {
		return 0
	}

	v, err := strconv.ParseFloat(strings.TrimSpace(s), 64)
	if err != nil {
		return 0
	}

	return v
}

func formatAmountString(v float64) string {
	return strconv.FormatFloat(v, 'f', 2, 64)
}

func (s *OrderS) GetAllOrders(ctx context.Context, req model.GetOrdersRequest) ([]model.OrderResponse, int64, error) {
	// Mixed-flow: activate reserved orders and set tables busy
	// This mutation is idempotent and should not fail the read operation if it errors.
	_ = s.activateDueReservedOrders(ctx)

	limit := req.Limit
	offset := req.Offset
	sortBy := req.SortBy
	sortOrder := req.SortOrder

	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	if sortBy == "" {
		sortBy = "created_at"
	}
	if sortOrder == "" {
		sortOrder = "desc"
	}

	params := pg.GetAllOrdersParams{
		SortBy:     sortBy,
		SortOrder:  sortOrder,
		PageLimit:  limit,
		PageOffset: offset,
	}

	if req.Type != nil && *req.Type != "" {
		orderType := string(*req.Type)
		params.OrderType = &orderType
	}

	if req.Status != nil && *req.Status != "" {
		params.Status = pg.NullOrderStatus{
			OrderStatus: pg.OrderStatus(*req.Status),
			Valid:       true,
		}
	}

	if req.TableID != nil && *req.TableID != "" {
		tableID, err := uuid.Parse(*req.TableID)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid table id: %w", err)
		}
		params.TableID = pgtype.UUID{
			Bytes: tableID,
			Valid: true,
		}
	}

	start, end, err := resolveOrderDateRange(req)
	if err != nil {
		return nil, 0, err
	}

	if start != nil {
		params.PeriodStart = pgtype.Timestamptz{Time: start.UTC(), Valid: true}
	}
	if end != nil {
		params.PeriodEnd = pgtype.Timestamptz{Time: end.UTC(), Valid: true}
	}

	// Read part: use getTenantReadQueries for count and list queries
	var total int64
	var orders []pg.GetAllOrdersRow
	q, txCtx, tx, ownsTx, err := s.getTenantReadQueries(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	total, err = q.CountFilteredOrders(txCtx, params)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count orders: %w", err)
	}

	orders, err = q.GetAllOrders(txCtx, params)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get orders: %w", err)
	}

	responses := make([]model.OrderResponse, 0, len(orders))
	for _, o := range orders {
		responses = append(responses, *toOrderResponse(o))
	}
	return responses, total, nil
}

func resolveOrderDateRange(req model.GetOrdersRequest) (*time.Time, *time.Time, error) {
	loc := time.FixedZone("Asia/Tashkent", 5*60*60)

	var start *time.Time
	var end *time.Time

	if req.From != nil && *req.From != "" {
		t, err := time.ParseInLocation("2006-01-02", *req.From, loc)
		if err != nil {
			return nil, nil, fmt.Errorf("invalid from date: %w", err)
		}
		start = &t
	}

	if req.To != nil && *req.To != "" {
		t, err := time.ParseInLocation("2006-01-02", *req.To, loc)
		if err != nil {
			return nil, nil, fmt.Errorf("invalid to date: %w", err)
		}
		t = t.AddDate(0, 0, 1)
		end = &t
	}

	if start != nil && end != nil && start.After(*end) {
		return nil, nil, fmt.Errorf("from must be less than or equal to to")
	}

	return start, end, nil
}

func (s *OrderS) GetOrdersByStatus(ctx context.Context, status string, limit, offset int32) ([]model.OrderResponse, int64, error) {
	st := pg.NullOrderStatus{OrderStatus: pg.OrderStatus(status), Valid: true}

	var total int64
	var orders []pg.GetOrdersByStatusRow
	q, txCtx, tx, ownsTx, err := s.getTenantReadQueries(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	total, err = q.CountOrdersByStatus(txCtx, st)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count orders by status: %w", err)
	}
	orders, err = q.GetOrdersByStatus(txCtx, pg.GetOrdersByStatusParams{Status: st, Limit: limit, Offset: offset})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get orders by status: %w", err)
	}

	responses := make([]model.OrderResponse, 0, len(orders))
	for _, o := range orders {
		responses = append(responses, *toOrderResponse(o))
	}
	return responses, total, nil
}

func (s *OrderS) GetOrdersByWaiterID(ctx context.Context, waiterID string, limit, offset int32) ([]model.OrderResponse, int64, error) {
	id, err := uuid.Parse(waiterID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid waiter id: %w", err)
	}

	waiterIDPg := pgtype.UUID{Bytes: id, Valid: true}

	var total int64
	var orders []pg.GetOrdersByWaiterIDRow
	q, txCtx, tx, ownsTx, err := s.getTenantReadQueries(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	total, err = q.CountOrdersByWaiterID(txCtx, waiterIDPg)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count orders by waiter: %w", err)
	}

	orders, err = q.GetOrdersByWaiterID(txCtx, pg.GetOrdersByWaiterIDParams{WaiterID: waiterIDPg, Limit: limit, Offset: offset})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get orders by waiter: %w", err)
	}

	responses := make([]model.OrderResponse, 0, len(orders))
	for _, o := range orders {
		responses = append(responses, *toOrderResponse(o))
	}
	return responses, total, nil
}

func (s *OrderS) GetOrdersByTableID(ctx context.Context, tableID string) ([]model.OrderResponse, error) {
	id, err := uuid.Parse(tableID)
	if err != nil {
		return nil, fmt.Errorf("invalid table id: %w", err)
	}

	var orders []pg.GetOrdersByTableIDRow
	q, txCtx, tx, ownsTx, err := s.getTenantReadQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	orders, err = q.GetOrdersByTableID(txCtx, pgtype.UUID{Bytes: id, Valid: true})
	if err != nil {
		return nil, fmt.Errorf("failed to get orders by table: %w", err)
	}

	var responses []model.OrderResponse
	for _, o := range orders {
		responses = append(responses, *toOrderResponse(o))
	}
	return responses, nil
}

func (s *OrderS) UpdateOrder(ctx context.Context, orderID string, req model.UpdateOrderRequest) (*model.OrderResponse, error) {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}

	var existing pg.GetOrderByIDRow
	q, txCtx, tx, ownsTx, err := s.getTenantReadQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	existing, err = q.GetOrderByID(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get order: %w", err)
	}

	statusRequestedServed := req.Status != nil && *req.Status == string(model.OrderStatusServed)
	statusAlreadyServed := existing.Status.Valid && string(existing.Status.OrderStatus) == string(model.OrderStatusServed)

	finalTableID := existing.TableID
	if req.TableID != nil && *req.TableID != "" {
		tID, err := uuid.Parse(*req.TableID)
		if err != nil {
			return nil, fmt.Errorf("invalid table_id: %w", err)
		}
		finalTableID = pgtype.UUID{Bytes: tID, Valid: true}
	}

	finalWaiterID := existing.WaiterID
	if req.WaiterID != nil && *req.WaiterID != "" {
		wID, err := uuid.Parse(*req.WaiterID)
		if err != nil {
			return nil, fmt.Errorf("invalid waiter_id: %w", err)
		}
		finalWaiterID = pgtype.UUID{Bytes: wID, Valid: true}
	}

	finalCashierID := existing.CashierID
	if req.CashierID != nil && *req.CashierID != "" {
		cID, err := uuid.Parse(*req.CashierID)
		if err != nil {
			return nil, fmt.Errorf("invalid cashier_id: %w", err)
		}
		finalCashierID = pgtype.UUID{Bytes: cID, Valid: true}
	}

	finalStatus := existing.Status
	if req.Status != nil && *req.Status != "" {
		finalStatus = pg.NullOrderStatus{OrderStatus: pg.OrderStatus(*req.Status), Valid: true}
	}

	finalTotal := existing.TotalAmount

	finalGuestCount := existing.GuestCount
	if req.GuestCount != nil {
		finalGuestCount = req.GuestCount
	}

	finalComment := existing.Comment
	if req.Comment != nil {
		finalComment = req.Comment
	}

	if statusRequestedServed && !statusAlreadyServed {
		finalStatus = existing.Status
	}

	q, txCtx, tx, ownsTx, err = s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	updatedOrder, err := q.UpdateOrder(txCtx, pg.UpdateOrderParams{
		ID:          id,
		TableID:     finalTableID,
		WaiterID:    finalWaiterID,
		CashierID:   finalCashierID,
		Status:      finalStatus,
		GuestCount:  finalGuestCount,
		TotalAmount: finalTotal,
		Comment:     finalComment,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update order: %w", err)
	}
	orderForResponse := any(updatedOrder)

	_ = q.RecalculateOrderTotalsFromItems(txCtx, updatedOrder.ID)
	if refetched, err := q.GetOrderByID(txCtx, updatedOrder.ID); err == nil {
		orderForResponse = refetched
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	if statusRequestedServed && !statusAlreadyServed {
		return s.MarkOrderServed(ctx, orderID)
	}

	return toOrderResponse(orderForResponse), nil
}

func (s *OrderS) UpdateOrderStatus(ctx context.Context, orderID string, status string) (*model.OrderResponse, error) {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}

	// Block paid — must go through MarkOrderPaid (payment endpoint)
	if status == string(pg.OrderStatusPaid) {
		return nil, fmt.Errorf("use the payment endpoint to mark an order as paid")
	}

	// Block cancelled — must go through CancelOrder endpoint (handles timer and table status)
	if status == string(pg.OrderStatusCancelled) {
		return nil, fmt.Errorf("use the cancel order endpoint to cancel an order")
	}

	// Read existing order - use read path
	var existing pg.GetOrderByIDRow
	q, txCtx, tx, ownsTx, err := s.getTenantReadQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	existing, err = q.GetOrderByID(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get order: %w", err)
	}
	currentStatus := string(existing.Status.OrderStatus)

	// cancelled is always terminal
	if currentStatus == string(pg.OrderStatusCancelled) {
		return nil, fmt.Errorf("cannot change status of a cancelled order")
	}
	// paid is terminal for dine_in; takeaway continues paid → cooking → ready
	if currentStatus == string(pg.OrderStatusPaid) && existing.OrderType != "takeaway" {
		return nil, fmt.Errorf("cannot change status of a paid order")
	}

	// Update order status - use write helper
	q, txCtx, tx, ownsTx, err = s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	st := pg.NullOrderStatus{OrderStatus: pg.OrderStatus(status), Valid: true}
	order, err := q.UpdateOrderStatus(txCtx, pg.UpdateOrderStatusParams{ID: id, Status: st})
	if err != nil {
		return nil, fmt.Errorf("failed to update order status: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toOrderResponse(order), nil
}

func (s *OrderS) MarkOrderPaid(ctx context.Context, orderID string, cashierID string, cashRegisterID *string, paymentType *string, discountPercent *string, discountAmount *string, discountComment *string, customerPaidAmount *string, tableCharge *string, cashAmount *string, cardAmount *string, paidAt *time.Time) (*model.OrderResponse, error) {
	oID, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}
	cID, err := uuid.Parse(cashierID)
	if err != nil {
		return nil, fmt.Errorf("invalid cashier id: %w", err)
	}

	if err := validateMarkOrderPaidInput(paymentType, discountPercent, discountAmount, customerPaidAmount, tableCharge, cashAmount, cardAmount); err != nil {
		return nil, err
	}

	var discPercentNum *pgtype.Numeric
	if discountPercent != nil && strings.TrimSpace(*discountPercent) != "" {
		n := pgtype.Numeric{}
		if err := n.Scan(strings.TrimSpace(*discountPercent)); err != nil {
			return nil, fmt.Errorf("invalid discount_percent: %w", err)
		}
		discPercentNum = &n
	}

	var discAmountNum *pgtype.Numeric
	if discountAmount != nil && strings.TrimSpace(*discountAmount) != "" {
		n := pgtype.Numeric{}
		if err := n.Scan(strings.TrimSpace(*discountAmount)); err != nil {
			return nil, fmt.Errorf("invalid discount_amount: %w", err)
		}
		discAmountNum = &n
	}

	var paidAmountNum *pgtype.Numeric
	if customerPaidAmount != nil && strings.TrimSpace(*customerPaidAmount) != "" {
		n := pgtype.Numeric{}
		if err := n.Scan(strings.TrimSpace(*customerPaidAmount)); err != nil {
			return nil, fmt.Errorf("invalid customer_paid_amount: %w", err)
		}
		paidAmountNum = &n
	}

	var tableChargeNum *pgtype.Numeric
	if tableCharge != nil && strings.TrimSpace(*tableCharge) != "" {
		n := pgtype.Numeric{}
		if err := n.Scan(strings.TrimSpace(*tableCharge)); err != nil {
			return nil, fmt.Errorf("invalid table_charge: %w", err)
		}
		tableChargeNum = &n
	}

	pt := "cash"
	if paymentType != nil && strings.TrimSpace(*paymentType) != "" {
		pt = strings.TrimSpace(*paymentType)
	}

	var cashAmountNum, cardAmountNum *pgtype.Numeric
	switch pt {
	case "split":
		if cashAmount != nil && strings.TrimSpace(*cashAmount) != "" {
			n := pgtype.Numeric{}
			if err := n.Scan(strings.TrimSpace(*cashAmount)); err != nil {
				return nil, fmt.Errorf("invalid cash_amount: %w", err)
			}
			cashAmountNum = &n
		}
		if cardAmount != nil && strings.TrimSpace(*cardAmount) != "" {
			n := pgtype.Numeric{}
			if err := n.Scan(strings.TrimSpace(*cardAmount)); err != nil {
				return nil, fmt.Errorf("invalid card_amount: %w", err)
			}
			cardAmountNum = &n
		}
	case "card":
		cardAmountNum = paidAmountNum
	case "cash":
		cashAmountNum = paidAmountNum
	default:
		return nil, fmt.Errorf("invalid payment_type: must be one of cash, card, split")
	}

	// Get tenant mutation queries for the payment operation
	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	orderBeforePay, err := q.GetOrderByID(txCtx, oID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch order: %w", err)
	}

	crUUID := pgtype.UUID{}
	if cashRegisterID != nil && *cashRegisterID != "" {
		if id, err := uuid.Parse(*cashRegisterID); err == nil {
			crUUID = pgtype.UUID{Bytes: id, Valid: true}
		}
	}
	paidAtPg := pgtype.Timestamptz{}
	if paidAt != nil {
		paidAtPg = pgtype.Timestamptz{
			Time:  *paidAt,
			Valid: true,
		}
	}

	if err := q.PayOrderBill(txCtx, pg.PayOrderBillParams{
		OrderID:            oID,
		CashierID:          cID,
		CashRegisterID:     crUUID,
		PaymentType:        &pt,
		DiscountPercent:    discPercentNum,
		DiscountAmount:     discAmountNum,
		DiscountComment:    discountComment,
		CustomerPaidAmount: paidAmountNum,
		TableCharge:        tableChargeNum,
		CashAmount:         cashAmountNum,
		CardAmount:         cardAmountNum,
		PaidAt:             paidAtPg,
	}); err != nil {
		return nil, fmt.Errorf("failed to mark order paid: %w", err)
	}

	if orderBeforePay.TableID.Valid {
		// SetTableFree is best-effort - log error but don't fail payment
		if _, freeErr := q.SetTableFree(txCtx, orderBeforePay.TableID.Bytes); freeErr != nil {
			log.Printf("MarkOrderPaid: failed to set table free for order %s: %v", orderID, freeErr)
		}
	}

	// CreateTransaction is critical for payment accounting - must succeed
	bill, billErr := q.GetBillDetails(txCtx, oID)
	if billErr != nil {
		return nil, fmt.Errorf("failed to get bill details for transaction: %w", billErr)
	}
	descStr := fmt.Sprintf("Bill payment #%d", bill.BillNo)
	txParams := pg.CreateTransactionParams{
		ID:                 uuid.New(),
		Type:               pg.TransactionTypeBillPayment,
		Amount:             bill.GrandTotal,
		Description:        &descStr,
		Date:               time.Now(),
		UserID:             pgtype.UUID{Bytes: cID, Valid: true},
		CustomerPaidAmount: derefNumeric(bill.CustomerPaidAmount),
		ChangeAmount:       derefNumeric(bill.ChangeAmount),
	}
	if cashRegisterID != nil && *cashRegisterID != "" {
		if crID, parseErr := uuid.Parse(*cashRegisterID); parseErr == nil {
			txParams.CashRegisterID = pgtype.UUID{Bytes: crID, Valid: true}
		}
	}
	txParams.PayType = pg.NullPaymentType{
		PaymentType: pg.PaymentType(pt),
		Valid:       true,
	}
	if _, txErr := q.CreateTransaction(txCtx, txParams); txErr != nil {
		return nil, fmt.Errorf("failed to create payment transaction: %w", txErr)
	}

	order, err := q.GetOrderByID(txCtx, oID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch order: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toOrderResponse(order), nil
}

func validateMarkOrderPaidInput(
	paymentType *string,
	discountPercent *string,
	discountAmount *string,
	customerPaidAmount *string,
	tableCharge *string,
	cashAmount *string,
	cardAmount *string,
) error {
	pt := "cash"
	if paymentType != nil && strings.TrimSpace(*paymentType) != "" {
		pt = strings.TrimSpace(*paymentType)
	}

	switch pt {
	case "cash", "card", "split":
	default:
		return fmt.Errorf("invalid payment_type: must be one of cash, card, split")
	}

	paid, err := parseRequiredMoney(customerPaidAmount, "customer_paid_amount")
	if err != nil {
		return err
	}
	if paid <= 0 {
		return fmt.Errorf("customer_paid_amount must be greater than 0")
	}

	if tableCharge != nil && strings.TrimSpace(*tableCharge) != "" {
		v, err := parseMoney(*tableCharge, "table_charge")
		if err != nil {
			return err
		}
		if v < 0 {
			return fmt.Errorf("table_charge cannot be negative")
		}
	}

	hasDiscountPercent := discountPercent != nil && strings.TrimSpace(*discountPercent) != ""
	hasDiscountAmount := discountAmount != nil && strings.TrimSpace(*discountAmount) != ""

	if hasDiscountPercent && hasDiscountAmount {
		return fmt.Errorf("provide only one of discount_percent or discount_amount")
	}

	if hasDiscountPercent {
		v, err := parseMoney(*discountPercent, "discount_percent")
		if err != nil {
			return err
		}
		if v < 0 || v > 100 {
			return fmt.Errorf("discount_percent must be between 0 and 100")
		}
	}

	if hasDiscountAmount {
		v, err := parseMoney(*discountAmount, "discount_amount")
		if err != nil {
			return err
		}
		if v < 0 {
			return fmt.Errorf("discount_amount cannot be negative")
		}
	}

	switch pt {
	case "cash":
		if cashAmount != nil && strings.TrimSpace(*cashAmount) != "" {
			return fmt.Errorf("cash_amount must not be provided when payment_type is cash")
		}
		if cardAmount != nil && strings.TrimSpace(*cardAmount) != "" {
			return fmt.Errorf("card_amount must not be provided when payment_type is cash")
		}
	case "card":
		if cashAmount != nil && strings.TrimSpace(*cashAmount) != "" {
			return fmt.Errorf("cash_amount must not be provided when payment_type is card")
		}
		if cardAmount != nil && strings.TrimSpace(*cardAmount) != "" {
			return fmt.Errorf("card_amount must not be provided when payment_type is card")
		}
	case "split":
		cash, err := parseRequiredMoney(cashAmount, "cash_amount")
		if err != nil {
			return err
		}
		card, err := parseRequiredMoney(cardAmount, "card_amount")
		if err != nil {
			return err
		}
		if cash < 0 || card < 0 {
			return fmt.Errorf("cash_amount and card_amount cannot be negative")
		}
		if !amountsEqual(cash+card, paid) {
			return fmt.Errorf("for split payment, cash_amount + card_amount must equal customer_paid_amount")
		}
	}

	return nil
}

func parseRequiredMoney(v *string, field string) (float64, error) {
	if v == nil || strings.TrimSpace(*v) == "" {
		return 0, fmt.Errorf("%s is required", field)
	}
	return parseMoney(*v, field)
}

func parseMoney(raw string, field string) (float64, error) {
	val, err := strconv.ParseFloat(strings.TrimSpace(raw), 64)
	if err != nil {
		return 0, fmt.Errorf("invalid %s", field)
	}
	return val, nil
}

func amountsEqual(a, b float64) bool {
	return math.Abs(a-b) < 0.000001
}

func (s *OrderS) DeleteOrder(ctx context.Context, orderID string) error {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return fmt.Errorf("invalid order id: %w", err)
	}

	// Get tenant mutation queries for delete operation
	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	orderBefore, err := q.GetOrderByID(txCtx, id)
	if err == nil {
		if err := s.reverseOrderItemsStockByOrder(txCtx, q, id, "order_deleted_in"); err != nil {
			return fmt.Errorf("failed to restore order stock before delete: %w", err)
		}
	}

	if err := q.DeleteOrder(txCtx, id); err != nil {
		return fmt.Errorf("failed to delete order: %w", err)
	}

	// SetTableFree must be atomic with delete - fail if table free fails
	if err == nil && orderBefore.TableID.Valid {
		if _, freeErr := q.SetTableFree(txCtx, orderBefore.TableID.Bytes); freeErr != nil {
			return fmt.Errorf("failed to set table free for order %s: %w", orderID, freeErr)
		}
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

func (s *OrderS) RestoreOrder(ctx context.Context, orderID string) error {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return fmt.Errorf("invalid order id: %w", err)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	if err := q.RestoreOrder(txCtx, id); err != nil {
		return fmt.Errorf("failed to restore order: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	// Note: Timer auto-start for restored orders is handled at handler level
	// to avoid circular dependency with TableTimer service
	return nil
}

func (s *OrderS) AssignWaiterToOrder(ctx context.Context, orderID string, waiterID string) (*model.OrderResponse, error) {
	oID, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}
	wID, err := uuid.Parse(waiterID)
	if err != nil {
		return nil, fmt.Errorf("invalid waiter id: %w", err)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	order, err := q.AssignWaiterToOrder(txCtx, pg.AssignWaiterToOrderParams{ID: oID, WaiterID: pgtype.UUID{Bytes: wID, Valid: true}})
	if err != nil {
		return nil, fmt.Errorf("failed to assign waiter: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toOrderResponse(order), nil
}

func (s *OrderS) AssignCashierToOrder(ctx context.Context, orderID string, cashierID string) (*model.OrderResponse, error) {
	oID, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}
	cID, err := uuid.Parse(cashierID)
	if err != nil {
		return nil, fmt.Errorf("invalid cashier id: %w", err)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	order, err := q.AssignCashierToOrder(txCtx, pg.AssignCashierToOrderParams{ID: oID, CashierID: pgtype.UUID{Bytes: cID, Valid: true}})
	if err != nil {
		return nil, fmt.Errorf("failed to assign cashier: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toOrderResponse(order), nil
}

func (s *OrderS) CancelOrder(ctx context.Context, orderID string) (*model.OrderResponse, error) {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}

	// Get tenant mutation queries for cancel operation
	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	orderBefore, err := q.GetOrderByID(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("order not found: %w", err)
	}

	// Idempotent: if already cancelled, return success
	if orderBefore.Status.Valid && orderBefore.Status.OrderStatus == pg.OrderStatusCancelled {
		if ownsTx {
			if err := tx.Commit(ctx); err != nil {
				return nil, fmt.Errorf("failed to commit transaction: %w", err)
			}
		}
		return toOrderResponse(orderBefore), nil
	}

	order, err := q.CancelOrder(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to cancel order: %w", err)
	}

	if err := s.reverseOrderItemsStockByOrder(txCtx, q, id, "order_cancelled_in"); err != nil {
		return nil, fmt.Errorf("failed to restore order stock before cancel: %w", err)
	}

	if orderBefore.TableID.Valid {
		if _, freeErr := q.SetTableFree(txCtx, orderBefore.TableID.Bytes); freeErr != nil {
			log.Printf("CancelOrder: failed to set table free for order %s: %v", orderID, freeErr)
		}
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toOrderResponse(order), nil
}

func (s *OrderS) MarkOrderCooking(ctx context.Context, orderID string) (*model.OrderResponse, error) {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}
	// Takeaway orders must be paid before kitchen can start
	var existing pg.GetOrderByIDRow
	readQ, readCtx, readTx, ownsReadTx, err := s.getTenantReadQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsReadTx {
		defer readTx.Rollback(ctx)
	}

	existing, err = readQ.GetOrderByID(readCtx, id)
	if err != nil {
		return nil, fmt.Errorf("order not found: %w", err)
	}
	if existing.OrderType == "takeaway" {
		if !existing.Status.Valid || existing.Status.OrderStatus != pg.OrderStatus(model.OrderStatusPaid) {
			return nil, fmt.Errorf("takeaway orders must be paid before cooking can start")
		}
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	order, err := q.MarkOrderCooking(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to mark order cooking: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toOrderResponse(order), nil
}

func (s *OrderS) MarkOrderReady(ctx context.Context, orderID string) (*model.OrderResponse, error) {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	order, err := q.MarkOrderReady(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to mark order ready: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toOrderResponse(order), nil
}

func (s *OrderS) MarkOrderServed(ctx context.Context, orderID string) (*model.OrderResponse, error) {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	order, err := q.MarkOrderServed(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to mark order served: %w", err)
	}

	if err := q.CloseBillOnServed(txCtx, id); err != nil {
		return nil, fmt.Errorf("failed to close bill: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toOrderResponse(order), nil
}

func (s *OrderS) ActivateOrder(ctx context.Context, orderID string) (*model.OrderResponse, error) {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}

	var existing pg.GetOrderByIDRow
	readQ, readCtx, readTx, ownsReadTx, err := s.getTenantReadQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsReadTx {
		defer readTx.Rollback(ctx)
	}

	existing, err = readQ.GetOrderByID(readCtx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, ErrOrderNotFound
		}
		return nil, fmt.Errorf("failed to get order: %w", err)
	}

	currentStatus := ""
	if existing.Status.Valid {
		currentStatus = string(existing.Status.OrderStatus)
	}

	switch currentStatus {
	case "reserved", "rescheduled":
	case "open", "cooking", "ready", "served":
		return nil, fmt.Errorf("%w: %s", ErrOrderAlreadyActive, currentStatus)
	default:
		return nil, fmt.Errorf("%w: %s", ErrOrderCannotBeActivated, currentStatus)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	order, err := q.ActivateOrder(txCtx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("%w: %s", ErrOrderCannotBeActivated, currentStatus)
		}
		return nil, fmt.Errorf("failed to activate order: %w", err)
	}

	if order.TableID.Valid {
		_, _ = q.SetTableBusy(txCtx, order.TableID.Bytes)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toOrderResponse(order), nil
}

func (s *OrderS) RescheduleOrder(ctx context.Context, orderID string, req model.RescheduleOrderRequest) (*model.OrderResponse, error) {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}
	scheduledAt, err := time.Parse(time.RFC3339, req.ScheduledAt)
	if err != nil {
		return nil, fmt.Errorf("invalid scheduled_at format (use RFC3339): %w", err)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	order, err := q.RescheduleOrder(txCtx, pg.RescheduleOrderParams{
		ID:                id,
		ScheduledAt:       pgtype.Timestamptz{Time: scheduledAt, Valid: true},
		RescheduleComment: req.Comment,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to reschedule order: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toOrderResponse(order), nil
}

func (s *OrderS) GetBills(ctx context.Context, req model.GetBillsRequest) (*model.BillListResponse, error) {
	startEnd := func(t *time.Time) *pgtype.Timestamptz {
		if t == nil {
			return nil
		}
		out := pgtype.Timestamptz{Time: *t, Valid: true}
		return &out
	}

	var waiterUUID *uuid.UUID
	if req.WaiterID != nil && *req.WaiterID != "" {
		u, err := uuid.Parse(*req.WaiterID)
		if err != nil {
			return nil, fmt.Errorf("invalid waiter_id: %w", err)
		}
		waiterUUID = &u
	}
	var hallUUID *uuid.UUID
	if req.HallID != nil && *req.HallID != "" {
		u, err := uuid.Parse(*req.HallID)
		if err != nil {
			return nil, fmt.Errorf("invalid hall_id: %w", err)
		}
		hallUUID = &u
	}
	var tableUUID *uuid.UUID
	if req.TableID != nil && *req.TableID != "" {
		u, err := uuid.Parse(*req.TableID)
		if err != nil {
			return nil, fmt.Errorf("invalid table_id: %w", err)
		}
		tableUUID = &u
	}
	var cashRegisterUUID *uuid.UUID
	if req.CashRegisterID != nil && *req.CashRegisterID != "" {
		u, err := uuid.Parse(*req.CashRegisterID)
		if err != nil {
			return nil, fmt.Errorf("invalid cash_register_id: %w", err)
		}
		cashRegisterUUID = &u
	}
	var cashierUUID *uuid.UUID
	if req.CashierID != nil && *req.CashierID != "" {
		u, err := uuid.Parse(*req.CashierID)
		if err != nil {
			return nil, fmt.Errorf("invalid cashier_id: %w", err)
		}
		cashierUUID = &u
	}

	limit := req.Limit
	if limit <= 0 {
		limit = 20
	}

	params := pg.GetBillsParams{
		Start:          startEnd(req.Start),
		End:            startEnd(req.End),
		BillNo:         req.BillNo,
		BillStatus:     req.BillStatus,
		PaymentType:    req.PaymentType,
		WaiterID:       waiterUUID,
		HallID:         hallUUID,
		TableID:        tableUUID,
		CashRegisterID: cashRegisterUUID,
		CashierID:      cashierUUID,
		Limit:          limit,
		Offset:         req.Offset,
	}

	var resp *model.BillListResponse
	q, txCtx, tx, ownsTx, err := s.getTenantReadQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	total, err := q.CountBills(txCtx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to count bills: %w", err)
	}

	totalsRow, err := q.GetBillsTotals(txCtx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get bills totals: %w", err)
	}

	rows, err := q.GetBills(txCtx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get bills: %w", err)
	}

	items := make([]model.BillListItem, 0, len(rows))
	for _, r := range rows {
		var openedAt *time.Time
		if r.BillOpenedAt.Valid {
			t := r.BillOpenedAt.Time
			openedAt = &t
		}
		var closedAt *time.Time
		if r.BillClosedAt.Valid {
			t := r.BillClosedAt.Time
			closedAt = &t
		}
		var waiterIDStr *string
		if r.WaiterID.Valid {
			s := r.WaiterID.String()
			waiterIDStr = &s
		}
		var cashierIDStr *string
		if r.CashierID.Valid {
			s := r.CashierID.String()
			cashierIDStr = &s
		}
		var cashRegIDStr *string
		if r.CashRegisterID.Valid {
			s := r.CashRegisterID.String()
			cashRegIDStr = &s
		}
		billStatus := r.BillStatus
		if r.DeletedAt > 0 {
			billStatus = "deleted"
		}
		items = append(items, model.BillListItem{
			ID:              r.ID.String(),
			BillNo:          r.BillNo,
			BillStatus:      billStatus,
			OpenedAt:        openedAt,
			ClosedAt:        closedAt,
			WaiterID:        waiterIDStr,
			WaiterName:      r.WaiterName,
			CashierID:       cashierIDStr,
			CashRegisterID:  cashRegIDStr,
			TableNumber:     r.TableNumber,
			HallName:        r.HallName,
			GuestCount:      r.GuestCount,
			FoodCost:        numericToString(r.FoodCost),
			FoodTotal:       numericToString(r.FoodTotal),
			ServicePercent:  numericToString(r.ServicePercent),
			ServiceAmount:   numericToString(r.ServiceAmount),
			DiscountPercent: numericToString(r.DiscountPercent),
			DiscountAmount:  numericToString(r.DiscountAmount),
			GrandTotal:      numericToString(r.GrandTotal),
			PaymentType:     r.PaymentType,
			Quantity:        r.TotalQty,
		})
	}

	resp = &model.BillListResponse{
		Total:  total,
		Limit:  limit,
		Offset: req.Offset,
		Items:  items,
		Totals: model.BillsTotals{
			TotalFoodCost:       numericToString(totalsRow.TotalFoodCost),
			TotalGuestCount:     totalsRow.TotalGuestCount,
			TotalGrandTotal:     numericToString(totalsRow.TotalGrandTotal),
			TotalServiceAmount:  numericToString(totalsRow.TotalServiceAmount),
			AvgServicePercent:   numericToString(totalsRow.AvgServicePercent),
			TotalDiscountAmount: numericToString(totalsRow.TotalDiscountAmount),
			AvgDiscountPercent:  numericToString(totalsRow.AvgDiscountPercent),
		},
	}

	return resp, nil
}

func (s *OrderS) GetBillDetails(ctx context.Context, billID string) (*model.BillDetails, error) {
	id, err := uuid.Parse(billID)
	if err != nil {
		return nil, fmt.Errorf("invalid bill id: %w", err)
	}

	var resp *model.BillDetails
	q, txCtx, tx, ownsTx, err := s.getTenantReadQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	h, err := q.GetBillDetails(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get bill details: %w", err)
	}

	items, err := q.GetBillItems(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get bill items: %w", err)
	}

	var openedAt *time.Time
	if h.BillOpenedAt.Valid {
		t := h.BillOpenedAt.Time
		openedAt = &t
	}
	var closedAt *time.Time
	if h.BillClosedAt.Valid {
		t := h.BillClosedAt.Time
		closedAt = &t
	}
	var paidAt *time.Time
	if h.PaidAt.Valid {
		t := h.PaidAt.Time
		paidAt = &t
	}

	var tableIDStr *string
	if h.TableID.Valid {
		s := h.TableID.String()
		tableIDStr = &s
	}
	var waiterIDStr *string
	if h.WaiterID.Valid {
		s := h.WaiterID.String()
		waiterIDStr = &s
	}
	var cashierIDStr *string
	if h.CashierID.Valid {
		s := h.CashierID.String()
		cashierIDStr = &s
	}
	var cashRegIDStr *string
	if h.CashRegisterID.Valid {
		s := h.CashRegisterID.String()
		cashRegIDStr = &s
	}

	outItems := make([]model.BillItem, 0, len(items))
	for _, it := range items {
		outItems = append(outItems, model.BillItem{
			ID:       it.ID.String(),
			GoodID:   it.GoodID.String(),
			GoodName: it.GoodName,
			Quantity: it.Quantity,
			Price:    numericToString(it.Price),
			Status:   it.Status,
			Comment:  it.Comment,
		})
	}

	resp = &model.BillDetails{
		ID:                 h.ID.String(),
		BillNo:             h.BillNo,
		BillStatus:         h.BillStatus,
		OpenedAt:           openedAt,
		ClosedAt:           closedAt,
		PaidAt:             paidAt,
		PaymentType:        h.PaymentType,
		TableID:            tableIDStr,
		TableNumber:        h.TableNumber,
		HallName:           h.HallName,
		WaiterID:           waiterIDStr,
		WaiterName:         h.WaiterName,
		CashierID:          cashierIDStr,
		CashierName:        h.CashierName,
		CashRegisterID:     cashRegIDStr,
		GuestCount:         h.GuestCount,
		FoodCost:           numericToString(h.FoodCost),
		FoodTotal:          numericToString(h.FoodTotal),
		ServicePercent:     numericToString(h.ServicePercent),
		ServiceAmount:      numericToString(h.ServiceAmount),
		DiscountPercent:    numericToString(h.DiscountPercent),
		DiscountAmount:     numericToString(h.DiscountAmount),
		DiscountComment:    h.DiscountComment,
		GrandTotal:         numericToString(h.GrandTotal),
		TableCharge:        numericToString(h.TableCharge),
		CustomerPaidAmount: numericPtrToStringPtr(h.CustomerPaidAmount),
		CashAmount:         numericPtrToStringPtr(h.CashAmount),
		CardAmount:         numericPtrToStringPtr(h.CardAmount),
		ChangeAmount:       numericPtrToStringPtr(h.ChangeAmount),
		Comment:            h.Comment,
		Items:              outItems,
	}

	if err := s.attachBillTimeBasedDetails(txCtx, q, id, resp); err != nil {
		return nil, fmt.Errorf("failed to attach bill time-based details: %w", err)
	}

	return resp, nil
}

func toBillPausePeriods(rows []pg.ListTableTimeEventsBySessionIDRow) []model.BillPausePeriod {
	if len(rows) == 0 {
		return nil
	}

	out := make([]model.BillPausePeriod, 0)
	var openPauseIndex = -1

	for _, row := range rows {
		if row.EventType == "pause" && openPauseIndex == -1 {
			out = append(out, model.BillPausePeriod{
				PausedAt: &row.CreatedAt,
			})
			openPauseIndex = len(out) - 1
		}

		if row.EventType == "resume" && openPauseIndex != -1 {
			t := row.CreatedAt
			out[openPauseIndex].ResumedAt = &t
			if out[openPauseIndex].PausedAt != nil {
				out[openPauseIndex].DurationMinutes = int32(t.Sub(*out[openPauseIndex].PausedAt) / time.Minute)
			}

			openPauseIndex = -1
		}
	}

	return out
}

func (s *OrderS) activateDueReservedOrders(ctx context.Context) error {
	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return fmt.Errorf("failed to get tenant queries for reservation activation: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	activated, err := q.ActivateReservedOrders(txCtx)
	if err != nil {
		return fmt.Errorf("failed to activate reserved orders: %w", err)
	}

	for _, row := range activated {
		if row.OrderType == "dine_in" && row.TableID.Valid {
			_, _ = q.SetTableBusy(txCtx, row.TableID.Bytes)
		}
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit reservation activation: %w", err)
		}
	}

	return nil
}

func (s *OrderS) attachBillTimeBasedDetails(ctx context.Context, q *pg.Queries, orderID uuid.UUID, resp *model.BillDetails) error {
	if resp == nil {
		return nil
	}

	ctxRow, err := q.GetOrderTimerContext(ctx, orderID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil
		}
		return fmt.Errorf("failed to get order timer context: %w", err)
	}

	if ctxRow.OrderType != "dine_in" {
		return nil
	}
	if !ctxRow.TableID.Valid {
		return nil
	}
	if ctxRow.TableType != string(model.TableTypeTimeBased) {
		return nil
	}

	tableType := ctxRow.TableType
	resp.TableType = &tableType

	if ctxRow.PricePerHour.Valid {
		v := numericToStr(ctxRow.PricePerHour)
		resp.PricePerHour = &v
	}

	session, err := q.GetLatestTableTimeSessionByOrderID(ctx, orderID)
	switch {
	case err == nil:
		timer := toTableTimerResponse(ctxRow, &session, time.Now())

		if timer.StartedAt != nil {
			resp.TableStartedAt = timer.StartedAt
		}

		if timer.FinalAmount != nil && *timer.FinalAmount != "" {
			resp.TableAmount = timer.FinalAmount
		} else if timer.CurrentAmount != nil && *timer.CurrentAmount != "" {
			resp.TableAmount = timer.CurrentAmount
		}

		events, err := q.ListTableTimeEventsBySessionID(ctx, session.ID)
		if err != nil {
			return fmt.Errorf("failed to list table timer events: %w", err)
		}
		resp.PausePeriods = toBillPausePeriods(events)

	case err == pgx.ErrNoRows:
		zero := "0.00"
		resp.TableAmount = &zero
		return nil

	default:
		return fmt.Errorf("failed to get latest table timer session: %w", err)
	}

	return nil
}

func (s *OrderS) consumeItemStockTx(
	ctx context.Context,
	q orderStockTx,
	goodID uuid.UUID,
	quantity int32,
	orderID uuid.UUID,
) error {
	mult := pgtype.Numeric{}
	mult.Valid = true
	if err := mult.Scan(strconv.Itoa(int(quantity))); err != nil {
		return fmt.Errorf("invalid item quantity: %w", err)
	}

	// Type assertion to get *pg.Queries from orderStockTx interface
	queries, ok := q.(*pg.Queries)
	if !ok {
		return fmt.Errorf("orderStockTx does not implement *pg.Queries")
	}
	usages, err := s.expandGoodToIngredientsByCalculations(ctx, queries, goodID, mult)
	if err != nil {
		log.Printf("❌ ERROR: Failed to expand good %s to ingredients: %v", goodID, err)
		return err
	}

	// If no calculations, skip stock deduction silently
	if len(usages) == 0 {
		return nil
	}

	storageID, err := q.GetStorageByGoodID(ctx, goodID)
	if err != nil {
		log.Printf("❌ ERROR: Failed to get storage for good %s: %v", goodID, err)
		return fmt.Errorf("failed to get storage for good: %w", err)
	}
	if !storageID.Valid {
		return fmt.Errorf("no active storage configured for good %s", goodID)
	}

	for _, u := range usages {
		stockID, err := q.EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: u.ingredientID,
			StorageID:    storageID,
		})
		if err != nil {
			return fmt.Errorf("failed to ensure ingredient stock row: %w", err)
		}

		locked, err := q.GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: u.ingredientID,
			StorageID:    storageID,
		})
		if err != nil {
			return fmt.Errorf("failed to lock ingredient stock row: %w", err)
		}

		ing, err := q.GetIngredientByID(ctx, u.ingredientID)
		if err != nil {
			return fmt.Errorf("failed to get ingredient: %w", err)
		}

		price := ing.PricePerUnit
		if !price.Valid {
			_ = price.Scan("0")
		}

		updated, err := q.RemoveFromIngredientStock(ctx, pg.RemoveFromIngredientStockParams{
			ID:       stockID,
			Quantity: u.quantity,
		})
		if err != nil {
			return fmt.Errorf("failed to consume ingredient stock: %w", err)
		}

		zero := pgtype.Numeric{}
		_ = zero.Scan("0")
		sourceType := "order"
		srcID := orderID

		now := pgtype.Timestamptz{
			Time:  time.Now().UTC(),
			Valid: true,
		}

		if shouldSkipStockMovement(zero, u.quantity) {
			continue
		}

		if err := q.InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
			ID:           uuid.New(),
			StorageID:    uuid.UUID(storageID.Bytes),
			IngredientID: u.ingredientID,
			EventType:    "order_out",
			QtyIn:        zero,
			QtyOut:       u.quantity,
			StockBefore:  locked.Quantity,
			StockAfter:   updated.Quantity,
			PricePerUnit: price,
			SourceType:   &sourceType,
			SourceID:     &srcID,
			EffectiveAt:  &now,
		}); err != nil {
			return fmt.Errorf("failed to insert stock movement: %w", err)
		}
	}

	return nil
}

func (s *OrderS) consumeItemStock(ctx context.Context, q *pg.Queries, goodID uuid.UUID, quantity int32, orderID uuid.UUID) error {
	mult := pgtype.Numeric{}
	mult.Valid = true
	if err := mult.Scan(strconv.Itoa(int(quantity))); err != nil {
		return fmt.Errorf("invalid item quantity: %w", err)
	}

	usages, err := s.expandGoodToIngredientsByCalculations(ctx, q, goodID, mult)
	if err != nil {
		return err
	}

	// If no calculations, skip stock deduction silently
	if len(usages) == 0 {
		return nil
	}

	storageID, err := q.GetStorageByGoodID(ctx, goodID)
	if err != nil {
		return fmt.Errorf("failed to get storage for good: %w", err)
	}
	if !storageID.Valid {
		return fmt.Errorf("no active storage configured for good %s", goodID)
	}

	for _, u := range usages {
		log.Printf("\n  📦 Processing ingredient: %s", u.ingredientID.String())
		stockID, err := q.EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: u.ingredientID,
			StorageID:    storageID,
		})
		if err != nil {
			log.Printf("  ❌ ERROR: Failed to ensure ingredient stock row: %v", err)
			return fmt.Errorf("failed to ensure ingredient stock row: %w", err)
		}
		log.Printf("  ✓ Stock row ensured: %s", stockID.String())

		locked, err := q.GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: u.ingredientID,
			StorageID:    storageID,
		})
		if err != nil {
			log.Printf("  ❌ ERROR: Failed to lock ingredient stock row: %v", err)
			return fmt.Errorf("failed to lock ingredient stock row: %w", err)
		}
		log.Printf("  ✓ Stock locked | Before: %v | To Reduce: %v", locked.Quantity, u.quantity)

		ing, err := q.GetIngredientByID(ctx, u.ingredientID)
		if err != nil {
			log.Printf("  ❌ ERROR: Failed to get ingredient: %v", err)
			return fmt.Errorf("failed to get ingredient: %w", err)
		}
		price := ing.PricePerUnit
		if !price.Valid {
			_ = price.Scan("0")
		}

		updated, err := q.RemoveFromIngredientStock(ctx, pg.RemoveFromIngredientStockParams{
			ID:       stockID,
			Quantity: u.quantity,
		})
		if err != nil {
			log.Printf("  ❌ ERROR: Failed to consume ingredient stock: %v", err)
			return fmt.Errorf("failed to consume ingredient stock: %w", err)
		}
		log.Printf("  ✅ REDUCED | Before: %v | After: %v | Reduced By: %v", numericToString(locked.Quantity), numericToString(updated.Quantity), numericToString(u.quantity))

		zero := pgtype.Numeric{}
		_ = zero.Scan("0")
		sourceType := "order"
		srcID := orderID

		now := pgtype.Timestamptz{
			Time:  time.Now().UTC(),
			Valid: true,
		}
		effectiveAt := &now

		if shouldSkipStockMovement(zero, u.quantity) {
			continue
		}

		if err := q.InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
			ID:           uuid.New(),
			StorageID:    uuid.UUID(storageID.Bytes),
			IngredientID: u.ingredientID,
			EventType:    string(pg.OrderOut),
			QtyIn:        zero,
			QtyOut:       u.quantity,
			StockBefore:  locked.Quantity,
			StockAfter:   updated.Quantity,
			PricePerUnit: price,
			SourceType:   &sourceType,
			SourceID:     &srcID,
			EffectiveAt:  effectiveAt,
		}); err != nil {
			log.Printf("  ❌ ERROR: Failed to insert stock movement: %v", err)
			return fmt.Errorf("failed to insert stock movement: %w", err)
		}
		log.Printf("  ✓ Stock movement recorded (order_out event)")
	}
	log.Printf("=== STOCK CONSUMPTION SUCCESS ===\n")
	return nil
}

// consumeItemStock deducts ingredient stock for the base good and for each selected modifier (tech card).
func (s *OrderS) consumeItemStockWithModifiers(ctx context.Context, q *pg.Queries, orderItemID uuid.UUID) error {
	item, err := q.GetOrderItemByID(ctx, orderItemID)
	if err != nil {
		return fmt.Errorf("failed to get order item: %w", err)
	}

	order, err := q.GetOrderByID(ctx, item.OrderID)
	if err != nil {
		return fmt.Errorf("failed to get order: %w", err)
	}

	goodID := item.GoodID
	quantity := item.Quantity
	orderID := item.OrderID

	mult := pgtype.Numeric{}
	mult.Valid = true
	if err := mult.Scan(strconv.Itoa(int(quantity))); err != nil {
		return fmt.Errorf("invalid item quantity: %w", err)
	}

	usages, err := s.expandGoodToIngredientsByCalculations(ctx, q, goodID, mult)
	if err != nil {
		return err
	}

	zero := inventoryZeroNumeric()
	sourceType := "order"
	srcID := orderID

	// Collect all usages from base good and modifiers
	allUsages := make([]ingredientUsage, 0, len(usages))
	allUsages = append(allUsages, usages...)

	// Collect modifier usages
	modRows, err := q.ListOrderItemModifiersByOrderID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to list order item modifiers: %w", err)
	}

	for _, om := range modRows {
		if om.OrderItemID != orderItemID {
			continue
		}

		comb := int64(quantity) * int64(om.Units)
		modMult := pgtype.Numeric{}
		modMult.Valid = true
		if err := modMult.Scan(fmt.Sprintf("%d", comb)); err != nil {
			return fmt.Errorf("invalid modifier multiplier: %w", err)
		}

		modUsages, err := s.expandModifierToIngredientsByCalculations(ctx, q, om.ModifierID, modMult)
		if err != nil {
			return err
		}
		allUsages = append(allUsages, modUsages...)
	}

	// If no calculations at all (base good + modifiers), skip stock deduction silently
	if len(allUsages) == 0 {
		return nil
	}

	storageID, err := q.GetStorageByGoodID(ctx, goodID)
	if err != nil {
		return fmt.Errorf("failed to get storage for good: %w", err)
	}
	if !storageID.Valid {
		return fmt.Errorf("no active storage configured for good %s", goodID)
	}

	if err := assertOrderStorageMutationAllowed(ctx, q, order, storageID.Bytes, "order item"); err != nil {
		return err
	}

	effectiveAt := orderMutationEffectiveAt(order)
	touched := make(map[orderTouchedKey]struct{})

	// Process all usages (base good + modifiers)
	for _, u := range allUsages {
		stockID, err := q.EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: u.ingredientID,
			StorageID:    storageID,
		})
		if err != nil {
			return fmt.Errorf("failed to ensure ingredient stock row: %w", err)
		}

		locked, err := q.GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: u.ingredientID,
			StorageID:    storageID,
		})
		if err != nil {
			return fmt.Errorf("failed to lock ingredient stock row: %w", err)
		}

		ing, err := q.GetIngredientByID(ctx, u.ingredientID)
		if err != nil {
			return fmt.Errorf("failed to get ingredient: %w", err)
		}
		price := ing.PricePerUnit
		if !price.Valid {
			_ = price.Scan("0")
		}

		updated, err := q.RemoveFromIngredientStock(ctx, pg.RemoveFromIngredientStockParams{
			ID:       stockID,
			Quantity: u.quantity,
		})
		if err != nil {
			return fmt.Errorf("failed to consume ingredient stock: %w", err)
		}

		if !shouldSkipStockMovement(zero, u.quantity) {
			if err := q.InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
				ID:           uuid.New(),
				StorageID:    uuid.UUID(storageID.Bytes),
				IngredientID: u.ingredientID,
				EventType:    "order_out",
				QtyIn:        zero,
				QtyOut:       u.quantity,
				StockBefore:  locked.Quantity,
				StockAfter:   updated.Quantity,
				PricePerUnit: price,
				SourceType:   &sourceType,
				SourceID:     &srcID,
				EffectiveAt:  effectiveAt,
			}); err != nil {
				return fmt.Errorf("failed to insert order stock movement: %w", err)
			}
		}

		touched[orderTouchedKey{
			StorageID:    storageID.Bytes,
			IngredientID: u.ingredientID,
		}] = struct{}{}
	}

	for key := range touched {
		if err := s.rebalanceOrderIngredientLedger(ctx, q, pgtype.UUID{Bytes: key.StorageID, Valid: true}, key.IngredientID); err != nil {
			return err
		}
	}

	return nil
}

func (s *OrderS) expandGoodToIngredientsByCalculations(ctx context.Context, q *pg.Queries, goodID uuid.UUID, multiplier pgtype.Numeric) ([]ingredientUsage, error) {
	calcs, err := q.GetCalculationsByGoodID(ctx, pgtype.UUID{Bytes: goodID, Valid: true})
	if err != nil {
		return nil, fmt.Errorf("failed to get good calculations: %w", err)
	}

	visited := map[uuid.UUID]bool{}
	var out []ingredientUsage
	for _, c := range calcs {
		if c.ComponentCompoundID.Valid {
			child := c.ComponentCompoundID.Bytes
			childMultiplier, err := mulNumeric(multiplier, c.Quantity, 6)
			if err != nil {
				return nil, err
			}
			sub, err := s.expandCompoundToIngredientsByCalculations(ctx, q, child, childMultiplier, visited)
			if err != nil {
				return nil, err
			}
			out = append(out, sub...)
			continue
		}
		if !c.IngredientID.Valid {
			continue
		}
		usedQty, err := mulNumeric(multiplier, c.Quantity, 6)
		if err != nil {
			return nil, err
		}
		out = append(out, ingredientUsage{ingredientID: c.IngredientID.Bytes, quantity: usedQty})
	}
	return out, nil
}

func (s *OrderS) expandCompoundToIngredientsByCalculations(ctx context.Context, q *pg.Queries, compoundID uuid.UUID, multiplier pgtype.Numeric, visited map[uuid.UUID]bool) ([]ingredientUsage, error) {
	if visited[compoundID] {
		return nil, fmt.Errorf("compound cycle detected")
	}
	visited[compoundID] = true
	defer func() { visited[compoundID] = false }()

	calcs, err := q.GetCalculationsByCompoundID(ctx, pgtype.UUID{Bytes: compoundID, Valid: true})
	if err != nil {
		return nil, fmt.Errorf("failed to get compound calculations: %w", err)
	}

	var out []ingredientUsage
	for _, c := range calcs {
		if c.ComponentCompoundID.Valid {
			child := c.ComponentCompoundID.Bytes
			childMultiplier, err := mulNumeric(multiplier, c.Quantity, 6)
			if err != nil {
				return nil, err
			}
			sub, err := s.expandCompoundToIngredientsByCalculations(ctx, q, child, childMultiplier, visited)
			if err != nil {
				return nil, err
			}
			out = append(out, sub...)
			continue
		}
		if !c.IngredientID.Valid {
			continue
		}
		usedQty, err := mulNumeric(multiplier, c.Quantity, 6)
		if err != nil {
			return nil, err
		}
		out = append(out, ingredientUsage{ingredientID: c.IngredientID.Bytes, quantity: usedQty})
	}

	return out, nil
}

func (s *OrderS) expandModifierToIngredientsByCalculations(ctx context.Context, q *pg.Queries, modifierID uuid.UUID, multiplier pgtype.Numeric) ([]ingredientUsage, error) {
	calcs, err := q.GetModifierCalculationsByModifierID(ctx, modifierID)
	if err != nil {
		return nil, fmt.Errorf("failed to get modifier calculations: %w", err)
	}

	visited := map[uuid.UUID]bool{}
	var out []ingredientUsage
	for _, c := range calcs {
		if c.ComponentCompoundID.Valid {
			child := c.ComponentCompoundID.Bytes
			childMultiplier, err := mulNumeric(multiplier, c.Quantity, 6)
			if err != nil {
				return nil, err
			}
			sub, err := s.expandCompoundToIngredientsByCalculations(ctx, q, child, childMultiplier, visited)
			if err != nil {
				return nil, err
			}
			out = append(out, sub...)
			continue
		}
		if !c.IngredientID.Valid {
			continue
		}
		usedQty, err := mulNumeric(multiplier, c.Quantity, 6)
		if err != nil {
			return nil, err
		}
		out = append(out, ingredientUsage{ingredientID: c.IngredientID.Bytes, quantity: usedQty})
	}
	return out, nil
}

func (s *OrderS) saveOrderItemModifiers(ctx context.Context, q *pg.Queries, orderItemID, goodID uuid.UUID, inputs []model.OrderItemModifierInput) error {
	if len(inputs) == 0 {
		return nil
	}
	seen := make(map[string]struct{})
	for i, in := range inputs {
		mid := strings.TrimSpace(in.ModifierID)
		if mid == "" {
			return fmt.Errorf("modifiers[%d]: modifier_id is required", i)
		}
		if _, ok := seen[mid]; ok {
			return fmt.Errorf("duplicate modifier_id: %s", mid)
		}
		seen[mid] = struct{}{}

		modUUID, err := uuid.Parse(mid)
		if err != nil {
			return fmt.Errorf("modifiers[%d]: invalid modifier_id: %w", i, err)
		}
		if _, err := q.GetActiveGoodModifierByGoodAndModifierID(ctx, pg.GetActiveGoodModifierByGoodAndModifierIDParams{
			GoodID:     goodID,
			ModifierID: modUUID,
		}); err != nil {
			if err == pgx.ErrNoRows {
				return fmt.Errorf("modifier not attached to this good: %s", mid)
			}
			return fmt.Errorf("modifiers[%d]: %w", i, err)
		}
		mod, err := q.GetModifierByID(ctx, modUUID)
		if err != nil {
			if err == pgx.ErrNoRows {
				return fmt.Errorf("modifier not found: %s", mid)
			}
			return fmt.Errorf("modifiers[%d]: %w", i, err)
		}
		if !mod.IsActive {
			return fmt.Errorf("modifier is inactive: %s", mid)
		}

		units := int32(1)
		if in.Units != nil {
			if *in.Units <= 0 {
				return fmt.Errorf("modifiers[%d]: units must be greater than 0", i)
			}
			units = *in.Units
		}

		if _, err := q.CreateOrderItemModifier(ctx, pg.CreateOrderItemModifierParams{
			ID:          uuid.New(),
			OrderItemID: orderItemID,
			ModifierID:  modUUID,
			Units:       units,
		}); err != nil {
			return fmt.Errorf("failed to save order item modifier: %w", err)
		}
	}
	return nil
}

func (s *OrderS) CreateOrderItems(ctx context.Context, req model.CreateOrderItemRequest) ([]model.OrderItemResponse, error) {
	if req.OrderID == "" {
		return nil, fmt.Errorf("order_id is required")
	}
	if len(req.Items) == 0 {
		return nil, fmt.Errorf("at least one item is required")
	}

	oID, err := uuid.Parse(req.OrderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order_id: %w", err)
	}

	// Get tenant mutation queries for item creation
	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	if _, err := q.GetOrderByID(txCtx, oID); err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("order not found")
		}
		return nil, fmt.Errorf("failed to fetch order: %w", err)
	}

	var responses []model.OrderItemResponse

	for i, entry := range req.Items {
		if entry.GoodID == "" {
			return nil, fmt.Errorf("items[%d]: good_id is required", i)
		}
		if entry.Quantity <= 0 {
			return nil, fmt.Errorf("items[%d]: quantity must be greater than 0", i)
		}

		gID, err := uuid.Parse(entry.GoodID)
		if err != nil {
			return nil, fmt.Errorf("items[%d]: invalid good_id: %w", i, err)
		}

		good, err := q.GetGoodByID(txCtx, gID)
		if err != nil {
			return nil, fmt.Errorf("items[%d]: failed to fetch good: %w", i, err)
		}

		price := good.Price
		if entry.Price != nil && *entry.Price != "" {
			if err := price.Scan(*entry.Price); err != nil {
				return nil, fmt.Errorf("items[%d]: invalid price: %w", i, err)
			}
		}

		status := pg.NullOrderItemsStatus{
			OrderItemsStatus: pg.OrderItemsStatus(model.OrderItemStatusPending),
			Valid:            true,
		}

		item, err := q.CreateOrderItem(txCtx, pg.CreateOrderItemParams{
			ID:        uuid.New(),
			GoodID:    gID,
			OrderID:   oID,
			Quantity:  entry.Quantity,
			Price:     price,
			CostPrice: good.CostPrice,
			Status:    status,
			Comment:   entry.Comment,
		})
		if err != nil {
			return nil, fmt.Errorf("items[%d]: failed to create order item: %w", i, err)
		}

		if err := s.saveOrderItemModifiers(txCtx, q, item.ID, gID, entry.Modifiers); err != nil {
			return nil, fmt.Errorf("items[%d]: %w", i, err)
		}

		if err := s.consumeItemStockWithModifiers(txCtx, q, item.ID); err != nil {
			return nil, fmt.Errorf("items[%d]: failed to deduct stock: %w", i, err)
		}

		responses = append(responses, *toOrderItemResponse(item))
	}

	// Keep opened bills totals up-to-date after all items are added.
	_ = q.RecalculateOrderTotalsFromItems(txCtx, oID)

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return responses, nil
}

func (s *OrderS) GetOrderItemByID(ctx context.Context, itemID string) (*model.OrderItemDetailResponse, error) {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return nil, fmt.Errorf("invalid order item id: %w", err)
	}

	var resp *model.OrderItemDetailResponse
	q, txCtx, tx, ownsTx, err := s.getTenantReadQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	item, err := q.GetOrderItemByID(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get order item: %w", err)
	}

	good, err := q.GetGoodByID(txCtx, item.GoodID)
	if err != nil {
		return nil, fmt.Errorf("failed to get good: %w", err)
	}

	resp = toOrderItemDetailResponse(item, good)
	return resp, nil
}

func (s *OrderS) GetAllOrderItems(ctx context.Context, limit, offset int32) ([]model.OrderItemResponse, int64, error) {
	var total int64
	var responses []model.OrderItemResponse
	q, txCtx, tx, ownsTx, err := s.getTenantReadQueries(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	total, err = q.CountOrderItems(txCtx)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count order items: %w", err)
	}
	items, err := q.GetAllOrderItems(txCtx, pg.GetAllOrderItemsParams{Limit: limit, Offset: offset})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get order items: %w", err)
	}

	responses = make([]model.OrderItemResponse, 0, len(items))
	for _, it := range items {
		responses = append(responses, *toOrderItemResponse(it))
	}

	return responses, total, nil
}

func (s *OrderS) GetOrderItemsByOrderID(
	ctx context.Context,
	orderID string,
	lang string,
) ([]model.OrderItemWithGoodResponse, error) {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}

	if strings.TrimSpace(lang) == "" {
		lang = "uz"
	}

	var responses []model.OrderItemWithGoodResponse
	q, txCtx, tx, ownsTx, err := s.getTenantReadQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	items, err := q.GetOrderItemsByOrderID(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get order items: %w", err)
	}

	responses = make([]model.OrderItemWithGoodResponse, 0, len(items))

	for _, it := range items {
		good, err := q.GetGoodByIDWithLanguage(txCtx, pg.GetGoodByIDWithLanguageParams{
			ID:      it.GoodID,
			Column2: lang,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to get good for item %s: %w", it.ID.String(), err)
		}

		resp := toOrderItemWithGoodResponse(it, good)
		if resp != nil {
			responses = append(responses, *resp)
		}
	}

	return responses, nil
}

func (s *OrderS) GetOrderItemsByStatus(ctx context.Context, status string, limit, offset int32) ([]model.OrderItemResponse, int64, error) {
	st := pg.NullOrderItemsStatus{OrderItemsStatus: pg.OrderItemsStatus(status), Valid: true}

	var total int64
	var responses []model.OrderItemResponse
	q, txCtx, tx, ownsTx, err := s.getTenantReadQueries(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	total, err = q.CountOrderItemsByStatus(txCtx, st)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count order items by status: %w", err)
	}
	items, err := q.GetOrderItemsByStatus(txCtx, pg.GetOrderItemsByStatusParams{Status: st, Limit: limit, Offset: offset})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get order items by status: %w", err)
	}

	responses = make([]model.OrderItemResponse, 0, len(items))
	for _, it := range items {
		responses = append(responses, *toOrderItemResponse(it))
	}

	return responses, total, nil
}

func (s *OrderS) UpdateOrderItem(ctx context.Context, itemID string, req model.UpdateOrderItemRequest) (*model.OrderItemResponse, error) {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return nil, fmt.Errorf("invalid order item id: %w", err)
	}

	// Get tenant mutation queries for item update
	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	existing, err := q.GetOrderItemByID(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get order item: %w", err)
	}

	finalGoodID := existing.GoodID
	if req.GoodID != nil && *req.GoodID != "" {
		gID, err := uuid.Parse(*req.GoodID)
		if err != nil {
			return nil, fmt.Errorf("invalid good_id: %w", err)
		}
		finalGoodID = gID
	}

	finalOrderID := existing.OrderID
	if req.OrderID != nil && *req.OrderID != "" {
		oID, err := uuid.Parse(*req.OrderID)
		if err != nil {
			return nil, fmt.Errorf("invalid order_id: %w", err)
		}
		finalOrderID = oID
	}

	finalQuantity := existing.Quantity
	if req.Quantity != nil {
		finalQuantity = *req.Quantity
	}

	finalPrice := existing.Price
	if req.Price != nil && *req.Price != "" {
		var num pgtype.Numeric
		if err := num.Scan(*req.Price); err != nil {
			return nil, fmt.Errorf("invalid price: %w", err)
		}
		finalPrice = num
	}

	finalStatus := existing.Status
	if req.Status != nil && *req.Status != "" {
		finalStatus = pg.NullOrderItemsStatus{OrderItemsStatus: pg.OrderItemsStatus(*req.Status), Valid: true}
	}

	finalComment := existing.Comment
	if req.Comment != nil {
		finalComment = req.Comment
	}

	item, err := q.UpdateOrderItem(txCtx, pg.UpdateOrderItemParams{
		ID:       id,
		GoodID:   finalGoodID,
		OrderID:  finalOrderID,
		Quantity: finalQuantity,
		Price:    finalPrice,
		Status:   finalStatus,
		Comment:  finalComment,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update order item: %w", err)
	}

	_ = q.RecalculateOrderTotalsFromItems(txCtx, item.OrderID)

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toOrderItemResponse(item), nil
}

func (s *OrderS) UpdateOrderItemQuantity(ctx context.Context, itemID string, quantity int32) (*model.OrderItemResponse, error) {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return nil, fmt.Errorf("invalid order item id: %w", err)
	}
	if quantity <= 0 {
		return nil, fmt.Errorf("quantity must be greater than 0")
	}

	// Get tenant mutation queries for stock restore/deduct operation
	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	existing, err := q.GetOrderItemByID(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get existing order item: %w", err)
	}

	if err := s.reverseOrderItemStockWithModifiers(txCtx, q, existing.ID, "order_item_qty_revert_in"); err != nil {
		return nil, fmt.Errorf("failed to restore previous stock before quantity update: %w", err)
	}

	item, err := q.UpdateOrderItemQuantity(txCtx, pg.UpdateOrderItemQuantityParams{
		ID:       id,
		Quantity: quantity,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update order item quantity: %w", err)
	}

	if err := s.consumeItemStockWithModifiers(txCtx, q, item.ID); err != nil {
		return nil, fmt.Errorf("failed to deduct stock for updated quantity: %w", err)
	}

	_ = q.RecalculateOrderTotalsFromItems(txCtx, item.OrderID)

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toOrderItemResponse(item), nil
}

// helper
func normalizeOrderItemStatus(status string) string {
	return strings.ToLower(strings.TrimSpace(status))
}

func canTransitionOrderItemStatus(from, to string) bool {
	switch model.OrderItemStatus(from) {
	case model.OrderItemStatusPending:
		return to == string(model.OrderItemStatusCooking) || to == string(model.OrderItemStatusCancelled)
	case model.OrderItemStatusCooking:
		return to == string(model.OrderItemStatusReady) || to == string(model.OrderItemStatusCancelled)
	case model.OrderItemStatusReady:
		return false
	case model.OrderItemStatusCancelled:
		return false
	default:
		return false
	}
}

func (s *OrderS) getTenantMutationQueries(ctx context.Context) (*pg.Queries, context.Context, pgx.Tx, bool, error) {
	if existingTx, ok := repository.TenantTxFromContext(ctx); ok && existingTx != nil {
		// Reuse existing transaction - get queries from context or create from tx
		if q, ok := repository.TenantQueriesFromContext(ctx); ok && q != nil {
			return q, ctx, existingTx, false, nil
		}
		q := pg.New(existingTx)
		txCtx := repository.WithTenantQueries(ctx, q)
		return q, txCtx, existingTx, false, nil
	}

	tx, err := s.repo.PgRepo.TenantPool.Begin(ctx)
	if err != nil {
		return nil, nil, nil, false, fmt.Errorf("failed to begin transaction: %w", err)
	}

	brandID, _ := ctx.Value("brand_id").(string)
	brandID = strings.TrimSpace(brandID)
	if brandID == "" {
		tx.Rollback(ctx)
		return nil, nil, nil, false, fmt.Errorf("brand_id is missing in context")
	}

	schemaName := fmt.Sprintf("tenant_%s", brandID)
	if _, err := tx.Exec(ctx, fmt.Sprintf(`SET LOCAL search_path TO "%s", public`, schemaName)); err != nil {
		tx.Rollback(ctx)
		return nil, nil, nil, false, fmt.Errorf("failed to set tenant search_path: %w", err)
	}

	if _, err := tx.Exec(ctx, "SET LOCAL app.brand_id = $1", brandID); err != nil {
		tx.Rollback(ctx)
		return nil, nil, nil, false, fmt.Errorf("failed to set app.brand_id: %w", err)
	}

	if branchID, _ := ctx.Value("branch_id").(string); strings.TrimSpace(branchID) != "" {
		if _, err := tx.Exec(ctx, "SET LOCAL app.branch_id = $1", strings.TrimSpace(branchID)); err != nil {
			tx.Rollback(ctx)
			return nil, nil, nil, false, fmt.Errorf("failed to set app.branch_id: %w", err)
		}
	}

	q := pg.New(tx)
	txCtx := repository.WithTenantTx(ctx, tx)
	txCtx = repository.WithTenantQueries(txCtx, q)

	return q, txCtx, tx, true, nil
}

func (s *OrderS) getTenantReadQueries(ctx context.Context) (*pg.Queries, context.Context, pgx.Tx, bool, error) {
	if existingTx, ok := repository.TenantTxFromContext(ctx); ok && existingTx != nil {
		// Reuse existing transaction - get queries from context or create from tx
		if q, ok := repository.TenantQueriesFromContext(ctx); ok && q != nil {
			return q, ctx, existingTx, false, nil
		}
		q := pg.New(existingTx)
		txCtx := repository.WithTenantQueries(ctx, q)
		return q, txCtx, existingTx, false, nil
	}

	// For read-only operations without an existing transaction, begin a read-only transaction
	// This ensures the connection is not released before queries complete
	tx, err := s.repo.PgRepo.TenantPool.BeginTx(ctx, pgx.TxOptions{AccessMode: pgx.ReadOnly})
	if err != nil {
		return nil, nil, nil, false, fmt.Errorf("failed to begin read-only transaction: %w", err)
	}

	brandID, _ := ctx.Value("brand_id").(string)
	brandID = strings.TrimSpace(brandID)
	if brandID == "" {
		tx.Rollback(ctx)
		return nil, nil, nil, false, fmt.Errorf("brand_id is missing in context")
	}

	schemaName := fmt.Sprintf("tenant_%s", brandID)
	if _, err := tx.Exec(ctx, fmt.Sprintf(`SET LOCAL search_path TO "%s", public`, schemaName)); err != nil {
		tx.Rollback(ctx)
		return nil, nil, nil, false, fmt.Errorf("failed to set tenant search_path: %w", err)
	}

	if _, err := tx.Exec(ctx, "SET LOCAL app.brand_id = $1", brandID); err != nil {
		tx.Rollback(ctx)
		return nil, nil, nil, false, fmt.Errorf("failed to set app.brand_id: %w", err)
	}

	if branchID, _ := ctx.Value("branch_id").(string); strings.TrimSpace(branchID) != "" {
		if _, err := tx.Exec(ctx, "SET LOCAL app.branch_id = $1", strings.TrimSpace(branchID)); err != nil {
			tx.Rollback(ctx)
			return nil, nil, nil, false, fmt.Errorf("failed to set app.branch_id: %w", err)
		}
	}

	q := pg.New(tx)
	txCtx := repository.WithTenantTx(ctx, tx)
	txCtx = repository.WithTenantQueries(txCtx, q)

	return q, txCtx, tx, true, nil
}

func (s *OrderS) UpdateOrderItemStatus(ctx context.Context, itemID string, status string) (*model.OrderItemResponse, error) {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return nil, fmt.Errorf("invalid order item id: %w", err)
	}

	nextStatus := normalizeOrderItemStatus(status)
	if !model.IsValidOrderItemStatus(nextStatus) {
		return nil, fmt.Errorf("invalid order item status: %s", nextStatus)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	existing, err := q.GetOrderItemByIDForUpdate(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get order item: %w", err)
	}

	if !existing.Status.Valid {
		return nil, fmt.Errorf("order item status is empty for item %s", itemID)
	}

	currentStatus := normalizeOrderItemStatus(string(existing.Status.OrderItemsStatus))
	if !model.IsValidOrderItemStatus(currentStatus) {
		return nil, fmt.Errorf("invalid current order item status: %s", currentStatus)
	}

	if currentStatus == nextStatus {
		return toOrderItemResponse(existing), nil
	}

	if !canTransitionOrderItemStatus(currentStatus, nextStatus) {
		return nil, fmt.Errorf("invalid order item status transition: %s -> %s", currentStatus, nextStatus)
	}

	// if currentStatus == string(model.OrderItemStatusPending) && nextStatus == string(model.OrderItemStatusCooking) {
	// 	if err := s.consumeItemStockWithModifiers(txCtx, existing.ID); err != nil {
	// 		return nil, fmt.Errorf("failed to deduct stock for order item: %w", err)
	// 	}
	// }

	st := pg.NullOrderItemsStatus{
		OrderItemsStatus: pg.OrderItemsStatus(nextStatus),
		Valid:            true,
	}

	item, err := q.UpdateOrderItemStatus(txCtx, pg.UpdateOrderItemStatusParams{
		ID:     id,
		Status: st,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update order item status: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toOrderItemResponse(item), nil
}

func (s *OrderS) DeleteOrderItem(ctx context.Context, itemID string) error {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return fmt.Errorf("invalid order item id: %w", err)
	}

	// Get tenant mutation queries for stock restore and delete operation
	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	existing, err := q.GetOrderItemByID(txCtx, id)
	if err != nil {
		return fmt.Errorf("failed to get order item: %w", err)
	}

	if err := s.reverseOrderItemStockWithModifiers(txCtx, q, existing.ID, "order_item_deleted_in"); err != nil {
		return fmt.Errorf("failed to restore order item stock before delete: %w", err)
	}

	if err := q.DeleteOrderItem(txCtx, id); err != nil {
		return fmt.Errorf("failed to delete order item: %w", err)
	}

	_ = q.RecalculateOrderTotalsFromItems(txCtx, existing.OrderID)

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

func (s *OrderS) RestoreOrderItem(ctx context.Context, itemID string) error {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return fmt.Errorf("invalid order item id: %w", err)
	}

	// Get tenant mutation queries for restore operation
	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	if err := q.RestoreOrderItem(txCtx, id); err != nil {
		return fmt.Errorf("failed to restore order item: %w", err)
	}

	if existing, err := q.GetOrderItemByID(txCtx, id); err == nil {
		_ = q.RecalculateOrderTotalsFromItems(txCtx, existing.OrderID)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

func (s *OrderS) CancelOrderItem(ctx context.Context, itemID string) (*model.OrderItemResponse, error) {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return nil, fmt.Errorf("invalid order item id: %w", err)
	}

	// Get tenant mutation queries for stock restore and cancel operation
	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	existing, err := q.GetOrderItemByID(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get order item: %w", err)
	}
	if existing.Status.Valid && string(existing.Status.OrderItemsStatus) == "cancelled" {
		return nil, fmt.Errorf("order item is already cancelled")
	}

	if err := s.reverseOrderItemStockWithModifiers(txCtx, q, existing.ID, "order_item_cancelled_in"); err != nil {
		return nil, fmt.Errorf("failed to restore order item stock before cancel: %w", err)
	}

	item, err := q.CancelOrderItem(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to cancel order item: %w", err)
	}

	_ = q.RecalculateOrderTotalsFromItems(txCtx, item.OrderID)

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toOrderItemResponse(item), nil
}

func (s *OrderS) MarkOrderItemCooking(ctx context.Context, itemID string) (*model.OrderItemResponse, error) {
	return s.UpdateOrderItemStatus(ctx, itemID, string(model.OrderItemStatusCooking))
}

func (s *OrderS) MarkOrderItemReady(ctx context.Context, itemID string) (*model.OrderItemResponse, error) {
	return s.UpdateOrderItemStatus(ctx, itemID, string(model.OrderItemStatusReady))
}

// ==================== KITCHEN QUEUE ====================

type KitchenQueueItem struct {
	ID              string                `json:"id"`
	OrderID         string                `json:"order_id"`
	GoodID          string                `json:"good_id"`
	Quantity        int32                 `json:"quantity"`
	Status          model.OrderItemStatus `json:"status"`
	Comment         *string               `json:"comment"`
	CreatedAt       *time.Time            `json:"created_at"`
	DishName        *string               `json:"dish_name"`
	CookTime        *int32                `json:"cook_time"`
	TableID         *string               `json:"table_id"`
	TableNumber     *int32                `json:"table_number"`
	HallName        *string               `json:"hall_name"`
	GuestCount      *int32                `json:"guest_count"`
	WaitTimeMinutes int32                 `json:"wait_time_minutes"`
}

func (s *OrderS) GetKitchenQueue(ctx context.Context) ([]KitchenQueueItem, error) {
	// Lazy-activate reservations whose scheduled time has arrived, then mark dine-in tables busy.
	// This mutation is idempotent and should not fail the read operation if it errors.
	_ = s.activateDueReservedOrders(ctx)

	var items []KitchenQueueItem
	q, txCtx, tx, ownsTx, err := s.getTenantReadQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	rows, err := q.GetKitchenQueue(txCtx)
	if err != nil {
		return nil, fmt.Errorf("failed to get kitchen queue: %w", err)
	}

	items = make([]KitchenQueueItem, 0, len(rows))
	for _, r := range rows {
		items = append(items, *toKitchenQueueItem(r))
	}

	return items, nil
}

func toOrderResponse(o any) *model.OrderResponse {
	var (
		id                uuid.UUID
		tableID           pgtype.UUID
		waiterIDPg        pgtype.UUID
		cashierIDPg       pgtype.UUID
		cashRegisterIDPg  pgtype.UUID
		statusPg          pg.NullOrderStatus
		guestCount        *int32
		totalAmount       pgtype.Numeric
		comment           *string
		orderType         string
		scheduledAtTs     pgtype.Timestamptz
		rescheduleComment *string
		paidAtPg          pgtype.Timestamptz
		clientCreatedAtPg pgtype.Timestamptz
		createdAtPg       pgtype.Timestamptz
		updatedAtPg       pgtype.Timestamptz
	)

	switch row := o.(type) {
	case pg.Order:
		id = row.ID
		tableID = row.TableID
		waiterIDPg = row.WaiterID
		cashierIDPg = row.CashierID
		cashRegisterIDPg = row.CashRegisterID
		statusPg = row.Status
		guestCount = row.GuestCount
		totalAmount = row.TotalAmount
		comment = row.Comment
		orderType = row.OrderType
		scheduledAtTs = row.ScheduledAt
		rescheduleComment = row.RescheduleComment
		clientCreatedAtPg = row.ClientCreatedAt
		paidAtPg = row.PaidAt
		createdAtPg = row.CreatedAt
		updatedAtPg = row.UpdatedAt

	case pg.CreateOrderRow:
		id = row.ID
		tableID = row.TableID
		waiterIDPg = row.WaiterID
		cashierIDPg = row.CashierID
		cashRegisterIDPg = row.CashRegisterID
		statusPg = pg.NullOrderStatus(row.Status)
		guestCount = row.GuestCount
		totalAmount = row.TotalAmount
		comment = row.Comment
		orderType = row.OrderType
		scheduledAtTs = row.ScheduledAt
		rescheduleComment = row.RescheduleComment
		clientCreatedAtPg = row.ClientCreatedAt
		createdAtPg = row.CreatedAt
		updatedAtPg = row.UpdatedAt

	case pg.GetOrderByIDRow:
		id = row.ID
		tableID = row.TableID
		waiterIDPg = row.WaiterID
		cashierIDPg = row.CashierID
		cashRegisterIDPg = row.CashRegisterID
		statusPg = pg.NullOrderStatus(row.Status)
		guestCount = row.GuestCount
		totalAmount = row.TotalAmount
		comment = row.Comment
		orderType = row.OrderType
		scheduledAtTs = row.ScheduledAt
		rescheduleComment = row.RescheduleComment
		clientCreatedAtPg = row.ClientCreatedAt
		paidAtPg = row.PaidAt
		createdAtPg = row.CreatedAt
		updatedAtPg = row.UpdatedAt

	case pg.GetAllOrdersRow:
		id = row.ID
		tableID = row.TableID
		waiterIDPg = row.WaiterID
		cashierIDPg = row.CashierID
		cashRegisterIDPg = row.CashRegisterID
		statusPg = pg.NullOrderStatus(row.Status)
		guestCount = row.GuestCount
		totalAmount = row.TotalAmount
		comment = row.Comment
		orderType = row.OrderType
		scheduledAtTs = row.ScheduledAt
		rescheduleComment = row.RescheduleComment
		clientCreatedAtPg = row.ClientCreatedAt
		paidAtPg = row.PaidAt
		createdAtPg = row.CreatedAt
		updatedAtPg = row.UpdatedAt

	case pg.GetOrdersByStatusRow:
		id = row.ID
		tableID = row.TableID
		waiterIDPg = row.WaiterID
		cashierIDPg = row.CashierID
		cashRegisterIDPg = row.CashRegisterID
		statusPg = pg.NullOrderStatus(row.Status)
		guestCount = row.GuestCount
		totalAmount = row.TotalAmount
		comment = row.Comment
		orderType = row.OrderType
		scheduledAtTs = row.ScheduledAt
		rescheduleComment = row.RescheduleComment
		clientCreatedAtPg = row.ClientCreatedAt
		paidAtPg = row.PaidAt
		createdAtPg = row.CreatedAt
		updatedAtPg = row.UpdatedAt

	case pg.GetOrdersByWaiterIDRow:
		id = row.ID
		tableID = row.TableID
		waiterIDPg = row.WaiterID
		cashierIDPg = row.CashierID
		cashRegisterIDPg = row.CashRegisterID
		statusPg = pg.NullOrderStatus(row.Status)
		guestCount = row.GuestCount
		totalAmount = row.TotalAmount
		comment = row.Comment
		orderType = row.OrderType
		scheduledAtTs = row.ScheduledAt
		rescheduleComment = row.RescheduleComment
		clientCreatedAtPg = row.ClientCreatedAt
		paidAtPg = row.PaidAt
		createdAtPg = row.CreatedAt
		updatedAtPg = row.UpdatedAt

	case pg.GetOrdersByTableIDRow:
		id = row.ID
		tableID = row.TableID
		waiterIDPg = row.WaiterID
		cashierIDPg = row.CashierID
		cashRegisterIDPg = row.CashRegisterID
		statusPg = pg.NullOrderStatus(row.Status)
		guestCount = row.GuestCount
		totalAmount = row.TotalAmount
		comment = row.Comment
		orderType = row.OrderType
		scheduledAtTs = row.ScheduledAt
		rescheduleComment = row.RescheduleComment
		clientCreatedAtPg = row.ClientCreatedAt
		paidAtPg = row.PaidAt
		createdAtPg = row.CreatedAt
		updatedAtPg = row.UpdatedAt

	case pg.UpdateOrderRow:
		id = row.ID
		tableID = row.TableID
		waiterIDPg = row.WaiterID
		cashierIDPg = row.CashierID
		statusPg = pg.NullOrderStatus(row.Status)
		guestCount = row.GuestCount
		totalAmount = row.TotalAmount
		comment = row.Comment
		orderType = row.OrderType
		scheduledAtTs = row.ScheduledAt
		rescheduleComment = row.RescheduleComment
		clientCreatedAtPg = row.ClientCreatedAt
		paidAtPg = row.PaidAt
		createdAtPg = row.CreatedAt
		updatedAtPg = row.UpdatedAt

	case pg.UpdateOrderStatusRow:
		id = row.ID
		tableID = row.TableID
		waiterIDPg = row.WaiterID
		cashierIDPg = row.CashierID
		statusPg = pg.NullOrderStatus(row.Status)
		guestCount = row.GuestCount
		totalAmount = row.TotalAmount
		comment = row.Comment
		orderType = row.OrderType
		scheduledAtTs = row.ScheduledAt
		rescheduleComment = row.RescheduleComment
		clientCreatedAtPg = row.ClientCreatedAt
		paidAtPg = row.PaidAt
		createdAtPg = row.CreatedAt
		updatedAtPg = row.UpdatedAt

	case pg.AssignWaiterToOrderRow:
		id = row.ID
		tableID = row.TableID
		waiterIDPg = row.WaiterID
		cashierIDPg = row.CashierID
		statusPg = pg.NullOrderStatus(row.Status)
		guestCount = row.GuestCount
		totalAmount = row.TotalAmount
		comment = row.Comment
		orderType = row.OrderType
		scheduledAtTs = row.ScheduledAt
		rescheduleComment = row.RescheduleComment
		clientCreatedAtPg = row.ClientCreatedAt
		createdAtPg = row.CreatedAt
		updatedAtPg = row.UpdatedAt

	case pg.AssignCashierToOrderRow:
		id = row.ID
		tableID = row.TableID
		waiterIDPg = row.WaiterID
		cashierIDPg = row.CashierID
		statusPg = pg.NullOrderStatus(row.Status)
		guestCount = row.GuestCount
		totalAmount = row.TotalAmount
		comment = row.Comment
		orderType = row.OrderType
		scheduledAtTs = row.ScheduledAt
		rescheduleComment = row.RescheduleComment
		clientCreatedAtPg = row.ClientCreatedAt
		createdAtPg = row.CreatedAt
		updatedAtPg = row.UpdatedAt

	case pg.CancelOrderRow:
		id = row.ID
		tableID = row.TableID
		waiterIDPg = row.WaiterID
		cashierIDPg = row.CashierID
		statusPg = pg.NullOrderStatus(row.Status)
		guestCount = row.GuestCount
		totalAmount = row.TotalAmount
		comment = row.Comment
		orderType = row.OrderType
		scheduledAtTs = row.ScheduledAt
		rescheduleComment = row.RescheduleComment
		clientCreatedAtPg = row.ClientCreatedAt
		paidAtPg = row.PaidAt
		createdAtPg = row.CreatedAt
		updatedAtPg = row.UpdatedAt

	case pg.MarkOrderCookingRow:
		id = row.ID
		tableID = row.TableID
		waiterIDPg = row.WaiterID
		cashierIDPg = row.CashierID
		statusPg = pg.NullOrderStatus(row.Status)
		guestCount = row.GuestCount
		totalAmount = row.TotalAmount
		comment = row.Comment
		orderType = row.OrderType
		scheduledAtTs = row.ScheduledAt
		rescheduleComment = row.RescheduleComment
		clientCreatedAtPg = row.ClientCreatedAt
		createdAtPg = row.CreatedAt
		updatedAtPg = row.UpdatedAt

	case pg.MarkOrderReadyRow:
		id = row.ID
		tableID = row.TableID
		waiterIDPg = row.WaiterID
		cashierIDPg = row.CashierID
		statusPg = pg.NullOrderStatus(row.Status)
		guestCount = row.GuestCount
		totalAmount = row.TotalAmount
		comment = row.Comment
		orderType = row.OrderType
		scheduledAtTs = row.ScheduledAt
		rescheduleComment = row.RescheduleComment
		clientCreatedAtPg = row.ClientCreatedAt
		createdAtPg = row.CreatedAt
		updatedAtPg = row.UpdatedAt

	case pg.MarkOrderServedRow:
		id = row.ID
		tableID = row.TableID
		waiterIDPg = row.WaiterID
		cashierIDPg = row.CashierID
		statusPg = pg.NullOrderStatus(row.Status)
		guestCount = row.GuestCount
		totalAmount = row.TotalAmount
		comment = row.Comment
		orderType = row.OrderType
		scheduledAtTs = row.ScheduledAt
		rescheduleComment = row.RescheduleComment
		clientCreatedAtPg = row.ClientCreatedAt
		createdAtPg = row.CreatedAt
		updatedAtPg = row.UpdatedAt

	case pg.MarkOrderPaidRow:
		id = row.ID
		tableID = row.TableID
		waiterIDPg = row.WaiterID
		cashierIDPg = row.CashierID
		statusPg = pg.NullOrderStatus(row.Status)
		guestCount = row.GuestCount
		totalAmount = row.TotalAmount
		comment = row.Comment
		orderType = row.OrderType
		scheduledAtTs = row.ScheduledAt
		rescheduleComment = row.RescheduleComment
		clientCreatedAtPg = row.ClientCreatedAt
		paidAtPg = row.PaidAt
		createdAtPg = row.CreatedAt
		updatedAtPg = row.UpdatedAt

	case pg.ActivateOrderRow:
		id = row.ID
		tableID = row.TableID
		waiterIDPg = row.WaiterID
		cashierIDPg = row.CashierID
		statusPg = pg.NullOrderStatus(row.Status)
		guestCount = row.GuestCount
		totalAmount = row.TotalAmount
		comment = row.Comment
		orderType = row.OrderType
		scheduledAtTs = row.ScheduledAt
		rescheduleComment = row.RescheduleComment
		clientCreatedAtPg = row.ClientCreatedAt
		paidAtPg = row.PaidAt
		createdAtPg = row.CreatedAt
		updatedAtPg = row.UpdatedAt

	case pg.RescheduleOrderRow:
		id = row.ID
		tableID = row.TableID
		waiterIDPg = row.WaiterID
		cashierIDPg = row.CashierID
		statusPg = pg.NullOrderStatus(row.Status)
		guestCount = row.GuestCount
		totalAmount = row.TotalAmount
		comment = row.Comment
		orderType = row.OrderType
		scheduledAtTs = row.ScheduledAt
		rescheduleComment = row.RescheduleComment
		clientCreatedAtPg = row.ClientCreatedAt
		paidAtPg = row.PaidAt
		createdAtPg = row.CreatedAt
		updatedAtPg = row.UpdatedAt

	default:
		return nil
	}

	if id == uuid.Nil {
		return nil
	}

	var waiterID *string
	if waiterIDPg.Valid {
		s := waiterIDPg.String()
		waiterID = &s
	}

	var cashierID *string
	if cashierIDPg.Valid {
		s := cashierIDPg.String()
		cashierID = &s
	}

	var cashRegisterID *string
	if cashRegisterIDPg.Valid {
		s := cashRegisterIDPg.String()
		cashRegisterID = &s
	}

	var clientCreatedAt *time.Time
	if clientCreatedAtPg.Valid {
		t := clientCreatedAtPg.Time
		clientCreatedAt = &t
	}
	var paidAt *time.Time
	if paidAtPg.Valid {
		t := paidAtPg.Time
		paidAt = &t
	}

	var createdAt *time.Time
	if createdAtPg.Valid {
		t := createdAtPg.Time
		createdAt = &t
	}

	var updatedAt *time.Time
	if updatedAtPg.Valid {
		t := updatedAtPg.Time
		updatedAt = &t
	}

	var scheduledAt *time.Time
	if scheduledAtTs.Valid {
		t := scheduledAtTs.Time
		scheduledAt = &t
	}

	status := model.OrderStatusOpen
	if statusPg.Valid {
		status = model.OrderStatus(statusPg.OrderStatus)
	}

	return &model.OrderResponse{
		ID:                id.String(),
		TableID:           tableID.String(),
		WaiterID:          waiterID,
		CashierID:         cashierID,
		CashRegisterID:    cashRegisterID,
		Status:            status,
		GuestCount:        guestCount,
		TotalAmount:       numericToString(totalAmount),
		Comment:           comment,
		OrderType:         orderType,
		ScheduledAt:       scheduledAt,
		RescheduleComment: rescheduleComment,
		ClientCreatedAt:   clientCreatedAt,
		PaidAt:            paidAt,
		CreatedAt:         createdAt,
		UpdatedAt:         updatedAt,
	}
}

func toWaiterOrderListItem(row pg.GetMyWaiterOrdersRow) *model.WaiterOrderListItem {
	if row.ID == uuid.Nil {
		return nil
	}

	var tableID *string
	if row.TableID.Valid {
		s := row.TableID.String()
		tableID = &s
	}

	var waiterID *string
	if row.WaiterID.Valid {
		s := row.WaiterID.String()
		waiterID = &s
	}

	var cashierID *string
	if row.CashierID.Valid {
		s := row.CashierID.String()
		cashierID = &s
	}

	var cashRegisterID *string
	if row.CashRegisterID.Valid {
		s := row.CashRegisterID.String()
		cashRegisterID = &s
	}

	var createdAt *time.Time
	if row.CreatedAt.Valid {
		t := row.CreatedAt.Time
		createdAt = &t
	}

	var updatedAt *time.Time
	if row.UpdatedAt.Valid {
		t := row.UpdatedAt.Time
		updatedAt = &t
	}

	var scheduledAt *time.Time
	if row.ScheduledAt.Valid {
		t := row.ScheduledAt.Time
		scheduledAt = &t
	}

	status := model.OrderStatusOpen
	if row.Status.Valid {
		status = model.OrderStatus(row.Status.OrderStatus)
	}

	return &model.WaiterOrderListItem{
		ID:                row.ID.String(),
		TableID:           tableID,
		TableNumber:       row.TableNumber,
		HallName:          row.HallName,
		WaiterID:          waiterID,
		CashierID:         cashierID,
		CashRegisterID:    cashRegisterID,
		Status:            status,
		GuestCount:        row.GuestCount,
		TotalAmount:       numericToString(row.TotalAmount),
		Comment:           row.Comment,
		OrderType:         model.OrderType(row.OrderType),
		ScheduledAt:       scheduledAt,
		RescheduleComment: row.RescheduleComment,
		ItemCount:         row.ItemCount,
		TotalItems:        row.TotalItems,
		CreatedAt:         createdAt,
		UpdatedAt:         updatedAt,
	}
}

func toOrderItemResponse(oi pg.OrderItem) *model.OrderItemResponse {
	if oi.ID == uuid.Nil {
		return nil
	}

	var createdAt *time.Time
	if oi.CreatedAt.Valid {
		t := oi.CreatedAt.Time
		createdAt = &t
	}

	var updatedAt *time.Time
	if oi.UpdatedAt.Valid {
		t := oi.UpdatedAt.Time
		updatedAt = &t
	}

	status := model.OrderItemStatusPending
	if oi.Status.Valid {
		status = model.OrderItemStatus(oi.Status.OrderItemsStatus)
	}

	return &model.OrderItemResponse{
		ID:        oi.ID.String(),
		OrderID:   oi.OrderID.String(),
		GoodID:    oi.GoodID.String(),
		Quantity:  oi.Quantity,
		Price:     numericToString(oi.Price),
		Status:    status,
		Comment:   oi.Comment,
		CreatedAt: createdAt,
		UpdatedAt: updatedAt,
	}
}

func toOrderItemWithGoodResponse(
	oi pg.OrderItem,
	good pg.GetGoodByIDWithLanguageRow,
) *model.OrderItemWithGoodResponse {
	if oi.ID == uuid.Nil {
		return nil
	}

	var createdAt *time.Time
	if oi.CreatedAt.Valid {
		t := oi.CreatedAt.Time
		createdAt = &t
	}

	var updatedAt *time.Time
	if oi.UpdatedAt.Valid {
		t := oi.UpdatedAt.Time
		updatedAt = &t
	}

	status := model.OrderItemStatusPending
	if oi.Status.Valid {
		status = model.OrderItemStatus(oi.Status.OrderItemsStatus)
	}

	return &model.OrderItemWithGoodResponse{
		ID:         oi.ID.String(),
		OrderID:    oi.OrderID.String(),
		GoodID:     oi.GoodID.String(),
		GoodName:   good.Name,
		PictureUrl: good.PictureUrl,
		Quantity:   oi.Quantity,
		Price:      numericToString(oi.Price),
		Status:     status,
		Comment:    oi.Comment,
		CreatedAt:  createdAt,
		UpdatedAt:  updatedAt,
	}
}

func toOrderItemDetailResponse(oi pg.OrderItem, good pg.GetGoodByIDRow) *model.OrderItemDetailResponse {
	if oi.ID == uuid.Nil {
		return nil
	}

	var createdAt *time.Time
	if oi.CreatedAt.Valid {
		t := oi.CreatedAt.Time
		createdAt = &t
	}

	var updatedAt *time.Time
	if oi.UpdatedAt.Valid {
		t := oi.UpdatedAt.Time
		updatedAt = &t
	}

	status := model.OrderItemStatusPending
	if oi.Status.Valid {
		status = model.OrderItemStatus(oi.Status.OrderItemsStatus)
	}

	return &model.OrderItemDetailResponse{
		ID:         oi.ID.String(),
		GoodID:     oi.GoodID.String(),
		GoodName:   good.Name,
		PictureUrl: good.PictureUrl,
		Quantity:   oi.Quantity,
		Price:      numericToString(oi.Price),
		Status:     status,
		Comment:    oi.Comment,
		CreatedAt:  createdAt,
		UpdatedAt:  updatedAt,
	}
}

func toKitchenQueueItem(r pg.GetKitchenQueueRow) *KitchenQueueItem {
	var createdAt *time.Time
	if r.CreatedAt.Valid {
		t := r.CreatedAt.Time
		createdAt = &t
	}

	var tableID *string
	if r.TableID.Valid {
		s := r.TableID.String()
		tableID = &s
	}

	status := model.OrderItemStatusPending
	if r.Status.Valid {
		status = model.OrderItemStatus(r.Status.OrderItemsStatus)
	}

	return &KitchenQueueItem{
		ID:              r.ID.String(),
		OrderID:         r.OrderID.String(),
		GoodID:          r.GoodID.String(),
		Quantity:        r.Quantity,
		Status:          status,
		Comment:         r.Comment,
		CreatedAt:       createdAt,
		DishName:        r.DishName,
		CookTime:        r.CookTime,
		TableID:         tableID,
		TableNumber:     r.TableNumber,
		HallName:        r.HallName,
		GuestCount:      r.GuestCount,
		WaitTimeMinutes: r.WaitTimeMinutes,
	}
}

// SendNotificationByStatus sends notification based on order or order_item status
// Status can be: 'open', 'cooking', 'ready', 'served', 'paid', 'cancelled' (order)
// or: 'pending', 'cooking', 'ready', 'cancelled' (order_item)
func (s *OrderS) SendNotificationByStatus(ctx context.Context, fcmClient *notification.FCMClient, customerToken string, orderID string, status string, tableNumber string) error {
	if fcmClient == nil || fcmClient.Client == nil || customerToken == "" {
		return nil
	}

	var title, body string

	switch status {
	case "ready":
		title = "🍽️ Your Food is Ready!"
		body = fmt.Sprintf("Your order is ready - Table %s", tableNumber)
	case "cooking":
		title = "👨‍🍳 Preparing Your Order"
		body = fmt.Sprintf("Your order is being prepared - Table %s", tableNumber)
	case "served":
		title = "✅ Your Order is Served"
		body = fmt.Sprintf("Please enjoy your meal - Table %s", tableNumber)
	case "paid":
		title = "💳 Payment Received"
		body = "Thank you for your purchase!"
	case "cancelled":
		title = "❌ Order Cancelled"
		body = "Your order has been cancelled"
	default:
		return nil
	}

	msg := &messaging.Message{
		Notification: &messaging.Notification{
			Title: title,
			Body:  body,
		},
		Data: map[string]string{
			"order_id": orderID,
			"status":   status,
			"table":    tableNumber,
		},
		Token: customerToken,
	}

	_, err := fcmClient.Client.Send(ctx, msg)
	if err != nil {
		log.Printf("Failed to send notification for status %s: %v", status, err)
		return err
	}

	log.Printf("Notification sent for order %s with status %s", orderID, status)
	return nil
}

func (s *OrderS) GetMyOrders(ctx context.Context, waiterID string, req model.GetMyOrdersRequest) ([]model.WaiterOrderListItem, int64, error) {
	id, err := uuid.Parse(waiterID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid waiter id: %w", err)
	}

	scope := model.WaiterOrderScopeActive
	if req.Scope != nil && *req.Scope != "" {
		scope = *req.Scope
	}

	switch scope {
	case model.WaiterOrderScopeActive,
		model.WaiterOrderScopeReservations,
		model.WaiterOrderScopeHistory,
		model.WaiterOrderScopeAll:
	default:
		return nil, 0, fmt.Errorf("invalid scope: %s", scope)
	}

	limit := req.Limit
	offset := req.Offset

	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	loc := time.FixedZone("Asia/Tashkent", 5*60*60)
	now := time.Now().In(loc)

	dayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	dayEnd := dayStart.Add(24 * time.Hour)

	params := pg.GetMyWaiterOrdersParams{
		WaiterID:   id,
		Scope:      string(scope),
		DayStart:   dayStart.UTC(),
		DayEnd:     dayEnd.UTC(),
		PageLimit:  limit,
		PageOffset: offset,
	}

	if req.OrderType != nil && *req.OrderType != "" {
		orderType := string(*req.OrderType)
		params.OrderType = &orderType
	}

	if req.TableID != nil && *req.TableID != "" {
		tableUUID, err := uuid.Parse(*req.TableID)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid table id: %w", err)
		}

		params.TableID = pgtype.UUID{
			Bytes: tableUUID,
			Valid: true,
		}
	}
	var total int64
	var rows []pg.GetMyWaiterOrdersRow
	q, txCtx, tx, ownsTx, err := s.getTenantReadQueries(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	total, err = q.CountMyWaiterOrders(txCtx, params)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count my orders: %w", err)
	}

	rows, err = q.GetMyWaiterOrders(txCtx, params)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get my orders: %w", err)
	}

	resp := make([]model.WaiterOrderListItem, 0, len(rows))
	for _, row := range rows {
		item := toWaiterOrderListItem(row)
		if item != nil {
			resp = append(resp, *item)
		}
	}

	return resp, total, nil
}

// TransferOrder transfers an order from its current table to a target table
// Implements two-phase transfer: Phase A (close current session) + Phase B (open new session)
func (s *OrderS) TransferOrder(ctx context.Context, orderID string, targetTableID string) (*model.OrderResponse, error) {
	orderUUID, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order_id: %w", err)
	}

	targetTableUUID, err := uuid.Parse(targetTableID)
	if err != nil {
		return nil, fmt.Errorf("invalid target_table_id: %w", err)
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	// ============ VALIDATION ============
	order, err := q.GetOrderByID(txCtx, orderUUID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("order not found")
		}
		return nil, fmt.Errorf("failed to get order: %w", err)
	}

	// Lock source session with FOR UPDATE
	currentSession, err := q.GetTableTimeSessionForOrderExclusive(txCtx, orderUUID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("no active session for order")
		}
		return nil, fmt.Errorf("failed to get session: %w", err)
	}

	if currentSession.EndedAt.Valid {
		return nil, fmt.Errorf("cannot transfer completed order")
	}

	targetTable, err := q.GetCafeTableByID(txCtx, targetTableUUID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("target table not found")
		}
		return nil, fmt.Errorf("failed to get target table: %w", err)
	}

	if string(targetTable.Status) != "free" {
		return nil, fmt.Errorf("target table is not available")
	}

	// ============ PHASE A: CLOSE CURRENT SESSION ============

	sourceTableType := currentSession.TableType
	now := pgtype.Timestamptz{Time: time.Now(), Valid: true}

	// Close any open segments in source session
	if sourceTableType == string(model.TableTypeTimeBased) {
		openSegments, err := q.GetOpenSegmentsForSession(txCtx, currentSession.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch segments: %w", err)
		}

		for _, seg := range openSegments {
			// For now, assume segment active_seconds are already calculated
			// In a real scenario, you'd calculate durations here
			_, err := q.UpdateTableTimeSessionSegment(txCtx, pg.UpdateTableTimeSessionSegmentParams{
				ID:           seg.ID,
				EndedAt:      now,
				ActiveSeconds: seg.ActiveSeconds,
				MoveOutReason: pgtype.Text{String: "transfer", Valid: true},
				MovedToTableID: pgtype.UUID{Bytes: targetTableUUID, Valid: true},
			})
			if err != nil {
				return nil, fmt.Errorf("failed to close segment: %w", err)
			}
		}
	}

	// Mark source session as ended
	_, err = q.UpdateTableTimeSession(txCtx, pg.UpdateTableTimeSessionParams{
		ID:      currentSession.ID,
		EndedAt: now,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to close source session: %w", err)
	}

	// ============ PHASE B: OPEN NEW SESSION ============

	targetTableType := string(targetTable.TableType)

	newSessionID, err := s.createSessionForOrder(txCtx, q, orderUUID, targetTableUUID, targetTableType)
	if err != nil {
		return nil, fmt.Errorf("failed to create new session: %w", err)
	}

	// For time-based tables transitioning from another type, create initial segment
	if targetTableType == string(model.TableTypeTimeBased) && sourceTableType != targetTableType {
		sourceTableID := uuid.MustParse(order.TableID)
		_, err := q.CreateTableTimeSessionSegment(txCtx, pg.CreateTableTimeSessionSegmentParams{
			ID:               uuid.New(),
			SessionID:        newSessionID,
			OrderID:          orderUUID,
			TableID:          targetTableUUID,
			MoveInReason:     "transfer",
			MovedFromTableID: pgtype.UUID{Bytes: sourceTableID, Valid: true},
			StartedAt:        now,
			ActiveSeconds:    0,
			PausedSeconds:    0,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to create transfer segment: %w", err)
		}
	}

	// ============ UPDATE ORDER AND TABLES ============

	// Update order with new table
	_, err = q.UpdateOrderTable(txCtx, pg.UpdateOrderTableParams{
		ID:      orderUUID,
		TableID: targetTableUUID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update order table: %w", err)
	}

	// Update table statuses
	sourceTableID := uuid.MustParse(order.TableID)

	// Source table → free
	_, err = q.UpdateCafeTableStatus(txCtx, pg.UpdateCafeTableStatusParams{
		ID:     sourceTableID,
		Status: pg.TableStatusFree,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to free source table: %w", err)
	}

	// Target table → busy
	_, err = q.UpdateCafeTableStatus(txCtx, pg.UpdateCafeTableStatusParams{
		ID:     targetTableUUID,
		Status: pg.TableStatusBusy,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to occupy target table: %w", err)
	}

	// ============ COMMIT AND RETURN ============

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transfer: %w", err)
		}
	}

	// Fetch updated order
	updated, err := s.GetOrderByID(ctx, orderID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch updated order: %w", err)
	}

	// Set active session ID in response
	if updated != nil {
		sessionID := newSessionID.String()
		updated.ActiveSessionID = &sessionID
	}

	return updated, nil
}

// createSessionForOrder creates a new session for an order
// For time-based tables, also creates the initial segment
func (s *OrderS) createSessionForOrder(
	ctx context.Context,
	q *pg.Queries,
	orderID uuid.UUID,
	tableID uuid.UUID,
	tableType string,
) (uuid.UUID, error) {
	now := pgtype.Timestamptz{Time: time.Now(), Valid: true}

	// Create session record
	session, err := q.CreateTableTimeSession(ctx, pg.CreateTableTimeSessionParams{
		ID:        uuid.New(),
		OrderID:   orderID,
		TableID:   tableID,
		TableType: tableType,
		StartedAt: now,
	})
	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to create session: %w", err)
	}

	// If time-based, create opening segment
	if tableType == string(model.TableTypeTimeBased) {
		_, err := q.CreateTableTimeSessionSegment(ctx, pg.CreateTableTimeSessionSegmentParams{
			ID:            uuid.New(),
			SessionID:     session.ID,
			OrderID:       orderID,
			TableID:       tableID,
			MoveInReason:  "start",
			StartedAt:     now,
			ActiveSeconds: 0,
			PausedSeconds: 0,
		})
		if err != nil {
			return uuid.Nil, fmt.Errorf("failed to create opening segment: %w", err)
		}
	}

	return session.ID, nil
}
