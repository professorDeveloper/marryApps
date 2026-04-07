package service

import (
	"context"
	"fmt"
	"log"
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

func NewOrderS(repo *repository.Repository) *OrderS {
	return &OrderS{repo: repo}
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

	existing, err := s.repo.Tenant(ctx).GetOrderByID(ctx, oID)
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

		good, err := s.repo.Tenant(ctx).GetGoodByID(ctx, goodUUID)
		if err != nil {
			if err == pgx.ErrNoRows {
				return nil, fmt.Errorf("items[%d]: good not found", i)
			}
			return nil, fmt.Errorf("items[%d]: failed to fetch good: %w", i, err)
		}

		item, err := s.repo.Tenant(ctx).CreateOrderItem(ctx, pg.CreateOrderItemParams{
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

		if err := s.consumeItemStock(ctx, goodUUID, it.Quantity, oID); err != nil {
			return nil, fmt.Errorf("items[%d]: failed to deduct stock for item: %w", i, err)
		}

		if resp := toOrderItemResponse(item); resp != nil {
			created = append(created, *resp)
		}
	}

	if err := s.repo.Tenant(ctx).RecalculateOrderTotalsFromItems(ctx, oID); err != nil {
		return nil, fmt.Errorf("failed to recalculate order totals: %w", err)
	}

	order, err := s.repo.Tenant(ctx).GetOrderByID(ctx, oID)
	if err != nil {
		return nil, fmt.Errorf("failed to refetch order: %w", err)
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
		if _, err := s.repo.Tenant(ctx).GetCafeTableByID(ctx, tableUUID); err != nil {
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

	isDineIn := orderType == "dine_in" && tableUUID != uuid.Nil
	immediateDineIn := isDineIn && !scheduledAtPg.Valid

	if isDineIn {
		if immediateDineIn {
			lockedTable, err := s.repo.Tenant(ctx).LockCafeTableByID(ctx, tableUUID)
			if err != nil {
				if err == pgx.ErrNoRows {
					return nil, fmt.Errorf("cafe table not found")
				}
				return nil, fmt.Errorf("failed to lock cafe table: %w", err)
			}

			if lockedTable.Status == string(model.TableStatusBusy) {
				existing, activeErr := s.repo.Tenant(ctx).GetActiveOpenOrderByTableID(ctx, tableUUID)
				if activeErr == nil {
					return nil, fmt.Errorf("table already has an active order: %s", existing.ID.String())
				}
				if activeErr != nil && activeErr != pgx.ErrNoRows {
					return nil, fmt.Errorf("failed to check active order by table: %w", activeErr)
				}
				return nil, fmt.Errorf("table is busy")
			}
		}

		existing, err := s.repo.Tenant(ctx).GetActiveOpenOrderByTableID(ctx, tableUUID)
		if err == nil {
			return nil, fmt.Errorf("table already has an active order: %s", existing.ID.String())
		}
		if err != nil && err != pgx.ErrNoRows {
			return nil, fmt.Errorf("failed to check active order by table: %w", err)
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

	createdOrder, err := s.repo.Tenant(ctx).CreateOrder(ctx, pg.CreateOrderParams{
		ID:             uuid.New(),
		TableID:        tableIDPg,
		WaiterID:       waiterUUID,
		CashierID:      cashierUUID,
		CashRegisterID: cashRegisterUUID,
		Status:         status,
		GuestCount:     req.GuestCount,
		TotalAmount:    totalAmount,
		Comment:        req.Comment,
		OrderType:      orderType,
		ScheduledAt:    scheduledAtPg,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	orderForResponse := any(createdOrder)

	if immediateDineIn {
		if _, err := s.repo.Tenant(ctx).SetTableBusy(ctx, tableUUID); err != nil {
			return nil, fmt.Errorf("failed to set table busy: %w", err)
		}
	}

	billNo, err := s.repo.Tenant(ctx).NextDailyBillNo(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to generate bill number: %w", err)
	}

	var servicePercent pgtype.Numeric
	if isDineIn {
		servicePercent, err = s.repo.Tenant(ctx).GetDefaultServicePercentByTable(ctx, tableUUID)
		if err != nil {
			return nil, fmt.Errorf("failed to get default service percent: %w", err)
		}
	} else {
		_ = servicePercent.Scan("0")
	}

	if err := s.repo.Tenant(ctx).InitOrderBillFields(ctx, createdOrder.ID, billNo, servicePercent); err != nil {
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

			good, err := s.repo.Tenant(ctx).GetGoodByID(ctx, goodUUID)
			if err != nil {
				return nil, fmt.Errorf("failed to fetch good: %w", err)
			}

			if _, err := s.repo.Tenant(ctx).CreateOrderItem(ctx, pg.CreateOrderItemParams{
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
			}); err != nil {
				return nil, fmt.Errorf("failed to create order item: %w", err)
			}

			if err := s.consumeItemStock(ctx, goodUUID, it.Quantity, createdOrder.ID); err != nil {
				return nil, fmt.Errorf("failed to deduct stock for item: %w", err)
			}
		}

		if err := s.repo.Tenant(ctx).RecalculateOrderTotalsFromItems(ctx, createdOrder.ID); err != nil {
			return nil, fmt.Errorf("failed to recalculate order totals: %w", err)
		}

		refetched, err := s.repo.Tenant(ctx).GetOrderByID(ctx, createdOrder.ID)
		if err == nil {
			orderForResponse = refetched
		}
	}

	resp := toOrderResponse(orderForResponse)
	if resp == nil {
		return nil, nil
	}

	if err := s.attachOrderBillSummary(ctx, createdOrder.ID, resp); err != nil {
		return nil, fmt.Errorf("failed to attach order bill summary: %w", err)
	}

	if err := s.attachTableAmountPreview(ctx, createdOrder.ID, resp); err != nil {
		return nil, fmt.Errorf("failed to attach table amount preview: %w", err)
	}

	return resp, nil
}
func (s *OrderS) GetOrderByID(ctx context.Context, orderID string) (*model.OrderResponse, error) {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}

	order, err := s.repo.Tenant(ctx).GetOrderByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get order: %w", err)
	}

	resp := toOrderResponse(order)
	if resp == nil {
		return nil, nil
	}

	items, err := s.repo.Tenant(ctx).GetOrderItemsByOrderID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get order items: %w", err)
	}

	resp.Items = make([]model.OrderItemResponse, 0, len(items))
	for _, item := range items {
		if itemResp := toOrderItemResponse(item); itemResp != nil {
			resp.Items = append(resp.Items, *itemResp)
		}
	}

	if err := s.attachOrderBillSummary(ctx, id, resp); err != nil {
		return nil, fmt.Errorf("failed to attach order bill summary: %w", err)
	}

	if err := s.attachTableAmountPreview(ctx, id, resp); err != nil {
		return nil, fmt.Errorf("failed to attach table amount preview: %w", err)
	}

	return resp, nil
}

func (s *OrderS) attachTableAmountPreview(ctx context.Context, orderID uuid.UUID, resp *model.OrderResponse) error {
	if resp == nil {
		return nil
	}

	ctxRow, err := s.repo.Tenant(ctx).GetOrderTimerContext(ctx, orderID)
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

	session, err := s.repo.Tenant(ctx).GetLatestTableTimeSessionByOrderID(ctx, orderID)
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
		baseTotal := parseAmountString(resp.TotalAmount)
		tableTotal := parseAmountString(*tableAmount)
		resp.TotalAmount = formatAmountString(baseTotal + tableTotal)
	}

	return nil
}

func (s *OrderS) attachOrderBillSummary(ctx context.Context, orderID uuid.UUID, resp *model.OrderResponse) error {
	if resp == nil {
		return nil
	}

	bill, err := s.repo.Tenant(ctx).GetBillDetails(ctx, orderID)
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

func (s *OrderS) GetAllOrders(ctx context.Context, limit, offset int32) ([]model.OrderResponse, error) {
	// Lazy-activate reservations whose scheduled time has arrived, then mark dine-in tables busy.
	if activated, err := s.repo.Tenant(ctx).ActivateReservedOrders(ctx); err == nil {
		for _, row := range activated {
			if row.OrderType == "dine_in" && row.TableID.Valid {
				_, _ = s.repo.Tenant(ctx).SetTableBusy(ctx, row.TableID.Bytes)
			}
		}
	}

	orders, err := s.repo.Tenant(ctx).GetAllOrders(ctx, pg.GetAllOrdersParams{Limit: limit, Offset: offset})
	if err != nil {
		return nil, fmt.Errorf("failed to get orders: %w", err)
	}

	var responses []model.OrderResponse
	for _, o := range orders {
		responses = append(responses, *toOrderResponse(o))
	}
	return responses, nil
}

func (s *OrderS) GetOrdersByStatus(ctx context.Context, status string, limit, offset int32) ([]model.OrderResponse, error) {
	st := pg.NullOrderStatus{OrderStatus: pg.OrderStatus(status), Valid: true}
	orders, err := s.repo.Tenant(ctx).GetOrdersByStatus(ctx, pg.GetOrdersByStatusParams{Status: st, Limit: limit, Offset: offset})
	if err != nil {
		return nil, fmt.Errorf("failed to get orders by status: %w", err)
	}

	var responses []model.OrderResponse
	for _, o := range orders {
		responses = append(responses, *toOrderResponse(o))
	}
	return responses, nil
}

func (s *OrderS) GetOrdersByWaiterID(ctx context.Context, waiterID string, limit, offset int32) ([]model.OrderResponse, error) {
	id, err := uuid.Parse(waiterID)
	if err != nil {
		return nil, fmt.Errorf("invalid waiter id: %w", err)
	}

	orders, err := s.repo.Tenant(ctx).GetOrdersByWaiterID(ctx, pg.GetOrdersByWaiterIDParams{WaiterID: pgtype.UUID{Bytes: id, Valid: true}, Limit: limit, Offset: offset})
	if err != nil {
		return nil, fmt.Errorf("failed to get orders by waiter: %w", err)
	}

	var responses []model.OrderResponse
	for _, o := range orders {
		responses = append(responses, *toOrderResponse(o))
	}
	return responses, nil
}

func (s *OrderS) GetOrdersByTableID(ctx context.Context, tableID string) ([]model.OrderResponse, error) {
	id, err := uuid.Parse(tableID)
	if err != nil {
		return nil, fmt.Errorf("invalid table id: %w", err)
	}

	orders, err := s.repo.Tenant(ctx).GetOrdersByTableID(ctx, pgtype.UUID{Bytes: id, Valid: true})
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

	existing, err := s.repo.Tenant(ctx).GetOrderByID(ctx, id)
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

	updatedOrder, err := s.repo.Tenant(ctx).UpdateOrder(ctx, pg.UpdateOrderParams{
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

	_ = s.repo.Tenant(ctx).RecalculateOrderTotalsFromItems(ctx, updatedOrder.ID)
	if refetched, err := s.repo.Tenant(ctx).GetOrderByID(ctx, updatedOrder.ID); err == nil {
		orderForResponse = refetched
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

	existing, err := s.repo.Tenant(ctx).GetOrderByID(ctx, id)
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

	st := pg.NullOrderStatus{OrderStatus: pg.OrderStatus(status), Valid: true}
	order, err := s.repo.Tenant(ctx).UpdateOrderStatus(ctx, pg.UpdateOrderStatusParams{ID: id, Status: st})
	if err != nil {
		return nil, fmt.Errorf("failed to update order status: %w", err)
	}

	return toOrderResponse(order), nil
}

func (s *OrderS) MarkOrderPaid(ctx context.Context, orderID string, cashierID string, cashRegisterID *string, paymentType *string, discountPercent *string, discountAmount *string, discountComment *string, customerPaidAmount *string, tableCharge *string, cashAmount *string, cardAmount *string) (*model.OrderResponse, error) {
	oID, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}
	cID, err := uuid.Parse(cashierID)
	if err != nil {
		return nil, fmt.Errorf("invalid cashier id: %w", err)
	}

	var discPercentNum *pgtype.Numeric
	if discountPercent != nil && *discountPercent != "" {
		n := pgtype.Numeric{}
		if err := n.Scan(*discountPercent); err != nil {
			return nil, fmt.Errorf("invalid discount_percent: %w", err)
		}
		discPercentNum = &n
	}

	var discAmountNum *pgtype.Numeric
	if discountAmount != nil && *discountAmount != "" {
		n := pgtype.Numeric{}
		if err := n.Scan(*discountAmount); err != nil {
			return nil, fmt.Errorf("invalid discount_amount: %w", err)
		}
		discAmountNum = &n
	}

	var paidAmountNum *pgtype.Numeric
	if customerPaidAmount != nil && *customerPaidAmount != "" {
		n := pgtype.Numeric{}
		if err := n.Scan(*customerPaidAmount); err != nil {
			return nil, fmt.Errorf("invalid customer_paid_amount: %w", err)
		}
		paidAmountNum = &n
	}

	var tableChargeNum *pgtype.Numeric
	if tableCharge != nil && *tableCharge != "" {
		n := pgtype.Numeric{}
		if err := n.Scan(*tableCharge); err != nil {
			return nil, fmt.Errorf("invalid table_charge: %w", err)
		}
		tableChargeNum = &n
	}

	// Normalize cash/card amounts based on payment_type.
	// SQL uses cash_amount + card_amount as total_paid for validation and change calculation.
	pt := ""
	if paymentType != nil {
		pt = *paymentType
	}
	var cashAmountNum, cardAmountNum *pgtype.Numeric
	switch pt {
	case "split":
		// Both must be provided; total_paid = cash + card
		if cashAmount != nil && *cashAmount != "" {
			n := pgtype.Numeric{}
			if err := n.Scan(*cashAmount); err != nil {
				return nil, fmt.Errorf("invalid cash_amount: %w", err)
			}
			cashAmountNum = &n
		}
		if cardAmount != nil && *cardAmount != "" {
			n := pgtype.Numeric{}
			if err := n.Scan(*cardAmount); err != nil {
				return nil, fmt.Errorf("invalid card_amount: %w", err)
			}
			cardAmountNum = &n
		}
	case "card":
		// card_amount = customer_paid_amount; cash_amount = 0
		cardAmountNum = paidAmountNum
	default: // "cash" or unset
		// cash_amount = customer_paid_amount; card_amount = 0
		cashAmountNum = paidAmountNum
	}

	// Fetch the order before paying so we have the table_id
	orderBeforePay, err := s.repo.Tenant(ctx).GetOrderByID(ctx, oID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch order: %w", err)
	}

	crUUID := pgtype.UUID{}
	if cashRegisterID != nil && *cashRegisterID != "" {
		if id, err := uuid.Parse(*cashRegisterID); err == nil {
			crUUID = pgtype.UUID{Bytes: id, Valid: true}
		}
	}

	if err := s.repo.Tenant(ctx).PayOrderBill(ctx, pg.PayOrderBillParams{
		OrderID:            oID,
		CashierID:          cID,
		CashRegisterID:     crUUID,
		PaymentType:        paymentType,
		DiscountPercent:    discPercentNum,
		DiscountAmount:     discAmountNum,
		DiscountComment:    discountComment,
		CustomerPaidAmount: paidAmountNum,
		TableCharge:        tableChargeNum,
		CashAmount:         cashAmountNum,
		CardAmount:         cardAmountNum,
	}); err != nil {
		return nil, fmt.Errorf("failed to mark order paid: %w", err)
	}

	// Free the table — best-effort, must not abort the main transaction on failure
	if orderBeforePay.TableID.Valid {
		withSavepoint(ctx, "sp_set_table_free", func() error {
			_, err := s.repo.Tenant(ctx).SetTableFree(ctx, orderBeforePay.TableID.Bytes)
			return err
		})
	}

	// Auto-create income transaction — best-effort, must not abort the main transaction
	withSavepoint(ctx, "sp_create_tx", func() error {
		bill, billErr := s.repo.Tenant(ctx).GetBillDetails(ctx, oID)
		if billErr != nil {
			return billErr
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
		if paymentType != nil && *paymentType != "" {
			txParams.PayType = pg.NullPaymentType{
				PaymentType: pg.PaymentType(*paymentType),
				Valid:       true,
			}
		}
		_, err := s.repo.Tenant(ctx).CreateTransaction(ctx, txParams)
		return err
	})

	order, err := s.repo.Tenant(ctx).GetOrderByID(ctx, oID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch order: %w", err)
	}
	return toOrderResponse(order), nil
}

func (s *OrderS) DeleteOrder(ctx context.Context, orderID string) error {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return fmt.Errorf("invalid order id: %w", err)
	}

	if err := s.repo.Tenant(ctx).DeleteOrder(ctx, id); err != nil {
		return fmt.Errorf("failed to delete order: %w", err)
	}
	return nil
}

func (s *OrderS) RestoreOrder(ctx context.Context, orderID string) error {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return fmt.Errorf("invalid order id: %w", err)
	}

	if err := s.repo.Tenant(ctx).RestoreOrder(ctx, id); err != nil {
		return fmt.Errorf("failed to restore order: %w", err)
	}
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

	order, err := s.repo.Tenant(ctx).AssignWaiterToOrder(ctx, pg.AssignWaiterToOrderParams{ID: oID, WaiterID: pgtype.UUID{Bytes: wID, Valid: true}})
	if err != nil {
		return nil, fmt.Errorf("failed to assign waiter: %w", err)
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

	order, err := s.repo.Tenant(ctx).AssignCashierToOrder(ctx, pg.AssignCashierToOrderParams{ID: oID, CashierID: pgtype.UUID{Bytes: cID, Valid: true}})
	if err != nil {
		return nil, fmt.Errorf("failed to assign cashier: %w", err)
	}
	return toOrderResponse(order), nil
}

func (s *OrderS) CancelOrder(ctx context.Context, orderID string) (*model.OrderResponse, error) {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}

	order, err := s.repo.Tenant(ctx).CancelOrder(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to cancel order: %w", err)
	}
	return toOrderResponse(order), nil
}

func (s *OrderS) MarkOrderCooking(ctx context.Context, orderID string) (*model.OrderResponse, error) {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}
	// Takeaway orders must be paid before kitchen can start
	existing, err := s.repo.Tenant(ctx).GetOrderByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("order not found: %w", err)
	}
	if existing.OrderType == "takeaway" {
		if !existing.Status.Valid || existing.Status.OrderStatus != pg.OrderStatus(model.OrderStatusPaid) {
			return nil, fmt.Errorf("takeaway orders must be paid before cooking can start")
		}
	}
	order, err := s.repo.Tenant(ctx).MarkOrderCooking(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to mark order cooking: %w", err)
	}
	return toOrderResponse(order), nil
}

func (s *OrderS) MarkOrderReady(ctx context.Context, orderID string) (*model.OrderResponse, error) {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}
	order, err := s.repo.Tenant(ctx).MarkOrderReady(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to mark order ready: %w", err)
	}
	return toOrderResponse(order), nil
}

func (s *OrderS) MarkOrderServed(ctx context.Context, orderID string) (*model.OrderResponse, error) {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}
	order, err := s.repo.Tenant(ctx).MarkOrderServed(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to mark order served: %w", err)
	}

	if err := s.repo.Tenant(ctx).CloseBillOnServed(ctx, id); err != nil {
		return nil, fmt.Errorf("failed to close bill: %w", err)
	}

	return toOrderResponse(order), nil
}

func (s *OrderS) ActivateOrder(ctx context.Context, orderID string) (*model.OrderResponse, error) {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}
	order, err := s.repo.Tenant(ctx).ActivateOrder(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to activate order: %w", err)
	}
	// Mark the table busy now that the dine-in reservation has activated.
	if order.OrderType == "dine_in" && order.TableID.Valid {
		_, _ = s.repo.Tenant(ctx).SetTableBusy(ctx, order.TableID.Bytes)
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
	order, err := s.repo.Tenant(ctx).RescheduleOrder(ctx, pg.RescheduleOrderParams{
		ID:                id,
		ScheduledAt:       pgtype.Timestamptz{Time: scheduledAt, Valid: true},
		RescheduleComment: req.Comment,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to reschedule order: %w", err)
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

	total, err := s.repo.Tenant(ctx).CountBills(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to count bills: %w", err)
	}

	totalsRow, err := s.repo.Tenant(ctx).GetBillsTotals(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get bills totals: %w", err)
	}

	rows, err := s.repo.Tenant(ctx).GetBills(ctx, params)
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
	return &model.BillListResponse{
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
	}, nil
}

func (s *OrderS) GetBillDetails(ctx context.Context, billID string) (*model.BillDetails, error) {
	id, err := uuid.Parse(billID)
	if err != nil {
		return nil, fmt.Errorf("invalid bill id: %w", err)
	}

	h, err := s.repo.Tenant(ctx).GetBillDetails(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get bill details: %w", err)
	}

	items, err := s.repo.Tenant(ctx).GetBillItems(ctx, id)
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

	return &model.BillDetails{
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
	}, nil
}

func (s *OrderS) consumeItemStock(ctx context.Context, goodID uuid.UUID, quantity int32, orderID uuid.UUID) error {
	storageID, err := s.repo.Tenant(ctx).GetStorageByGoodID(ctx, goodID)
	if err != nil {
		return fmt.Errorf("failed to get storage for good: %w", err)
	}
	if !storageID.Valid {
		// No storage configured for this good's department — skip stock deduction
		return nil
	}

	mult := pgtype.Numeric{}
	mult.Valid = true
	if err := mult.Scan(strconv.Itoa(int(quantity))); err != nil {
		return fmt.Errorf("invalid item quantity: %w", err)
	}

	usages, err := s.expandGoodToIngredientsByCalculations(ctx, goodID, mult)
	if err != nil {
		return err
	}

	for _, u := range usages {
		stockID, err := s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: u.ingredientID,
			StorageID:    storageID,
		})
		if err != nil {
			return fmt.Errorf("failed to ensure ingredient stock row: %w", err)
		}

		locked, err := s.repo.Tenant(ctx).GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
			IngredientID: u.ingredientID,
			StorageID:    storageID,
		})
		if err != nil {
			return fmt.Errorf("failed to lock ingredient stock row: %w", err)
		}

		ing, err := s.repo.Tenant(ctx).GetIngredientByID(ctx, u.ingredientID)
		if err != nil {
			return fmt.Errorf("failed to get ingredient: %w", err)
		}
		price := ing.PricePerUnit
		if !price.Valid {
			_ = price.Scan("0")
		}

		updated, err := s.repo.Tenant(ctx).RemoveFromIngredientStock(ctx, pg.RemoveFromIngredientStockParams{
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
		if err := s.repo.Tenant(ctx).InsertIngredientStockMovement(ctx, pg.InsertIngredientStockMovementParams{
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
		}); err != nil {
			return fmt.Errorf("failed to insert stock movement: %w", err)
		}
	}

	return nil
}

func (s *OrderS) expandGoodToIngredientsByCalculations(ctx context.Context, goodID uuid.UUID, multiplier pgtype.Numeric) ([]ingredientUsage, error) {
	calcs, err := s.repo.Tenant(ctx).GetCalculationsByGoodID(ctx, pgtype.UUID{Bytes: goodID, Valid: true})
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
			sub, err := s.expandCompoundToIngredientsByCalculations(ctx, child, childMultiplier, visited)
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

func (s *OrderS) expandCompoundToIngredientsByCalculations(ctx context.Context, compoundID uuid.UUID, multiplier pgtype.Numeric, visited map[uuid.UUID]bool) ([]ingredientUsage, error) {
	if visited[compoundID] {
		return nil, fmt.Errorf("compound cycle detected")
	}
	visited[compoundID] = true
	defer func() { visited[compoundID] = false }()

	calcs, err := s.repo.Tenant(ctx).GetCalculationsByCompoundID(ctx, pgtype.UUID{Bytes: compoundID, Valid: true})
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
			sub, err := s.expandCompoundToIngredientsByCalculations(ctx, child, childMultiplier, visited)
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

		good, err := s.repo.Tenant(ctx).GetGoodByID(ctx, gID)
		if err != nil {
			return nil, fmt.Errorf("items[%d]: failed to fetch good: %w", i, err)
		}

		price := good.Price
		if entry.Price != nil && *entry.Price != "" {
			if err := price.Scan(*entry.Price); err != nil {
				return nil, fmt.Errorf("items[%d]: invalid price: %w", i, err)
			}
		}

		status := pg.NullOrderItemsStatus{OrderItemsStatus: pg.OrderItemsStatus(model.OrderItemStatusPending), Valid: true}
		if entry.Status != nil && *entry.Status != "" {
			status = pg.NullOrderItemsStatus{OrderItemsStatus: pg.OrderItemsStatus(*entry.Status), Valid: true}
		}

		item, err := s.repo.Tenant(ctx).CreateOrderItem(ctx, pg.CreateOrderItemParams{
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
		if err := s.consumeItemStock(ctx, gID, entry.Quantity, oID); err != nil {
			return nil, fmt.Errorf("items[%d]: failed to deduct stock: %w", i, err)
		}

		responses = append(responses, *toOrderItemResponse(item))
	}

	// Keep opened bills totals up-to-date after all items are added.
	_ = s.repo.Tenant(ctx).RecalculateOrderTotalsFromItems(ctx, oID)

	return responses, nil
}

func (s *OrderS) GetOrderItemByID(ctx context.Context, itemID string) (*model.OrderItemDetailResponse, error) {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return nil, fmt.Errorf("invalid order item id: %w", err)
	}

	item, err := s.repo.Tenant(ctx).GetOrderItemByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get order item: %w", err)
	}

	good, err := s.repo.Tenant(ctx).GetGoodByID(ctx, item.GoodID)
	if err != nil {
		return nil, fmt.Errorf("failed to get good: %w", err)
	}

	return toOrderItemDetailResponse(item, good), nil
}

func (s *OrderS) GetAllOrderItems(ctx context.Context, limit, offset int32) ([]model.OrderItemResponse, error) {
	items, err := s.repo.Tenant(ctx).GetAllOrderItems(ctx, pg.GetAllOrderItemsParams{Limit: limit, Offset: offset})
	if err != nil {
		return nil, fmt.Errorf("failed to get order items: %w", err)
	}

	var responses []model.OrderItemResponse
	for _, it := range items {
		responses = append(responses, *toOrderItemResponse(it))
	}
	return responses, nil
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

	items, err := s.repo.Tenant(ctx).GetOrderItemsByOrderID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get order items: %w", err)
	}

	responses := make([]model.OrderItemWithGoodResponse, 0, len(items))

	for _, it := range items {
		good, err := s.repo.Tenant(ctx).GetGoodByIDWithLanguage(ctx, pg.GetGoodByIDWithLanguageParams{
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

func (s *OrderS) GetOrderItemsByStatus(ctx context.Context, status string, limit, offset int32) ([]model.OrderItemResponse, error) {
	st := pg.NullOrderItemsStatus{OrderItemsStatus: pg.OrderItemsStatus(status), Valid: true}
	items, err := s.repo.Tenant(ctx).GetOrderItemsByStatus(ctx, pg.GetOrderItemsByStatusParams{Status: st, Limit: limit, Offset: offset})
	if err != nil {
		return nil, fmt.Errorf("failed to get order items by status: %w", err)
	}

	var responses []model.OrderItemResponse
	for _, it := range items {
		responses = append(responses, *toOrderItemResponse(it))
	}
	return responses, nil
}

func (s *OrderS) UpdateOrderItem(ctx context.Context, itemID string, req model.UpdateOrderItemRequest) (*model.OrderItemResponse, error) {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return nil, fmt.Errorf("invalid order item id: %w", err)
	}

	existing, err := s.repo.Tenant(ctx).GetOrderItemByID(ctx, id)
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

	item, err := s.repo.Tenant(ctx).UpdateOrderItem(ctx, pg.UpdateOrderItemParams{
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

	_ = s.repo.Tenant(ctx).RecalculateOrderTotalsFromItems(ctx, item.OrderID)

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

	item, err := s.repo.Tenant(ctx).UpdateOrderItemQuantity(ctx, pg.UpdateOrderItemQuantityParams{ID: id, Quantity: quantity})
	if err != nil {
		return nil, fmt.Errorf("failed to update order item quantity: %w", err)
	}

	_ = s.repo.Tenant(ctx).RecalculateOrderTotalsFromItems(ctx, item.OrderID)
	return toOrderItemResponse(item), nil
}

func (s *OrderS) UpdateOrderItemStatus(ctx context.Context, itemID string, status string) (*model.OrderItemResponse, error) {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return nil, fmt.Errorf("invalid order item id: %w", err)
	}

	existing, err := s.repo.Tenant(ctx).GetOrderItemByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get order item: %w", err)
	}
	currentStatus := string(existing.Status.OrderItemsStatus)

	// Terminal status — cannot change
	if currentStatus == string(pg.OrderItemsStatusCancelled) {
		return nil, fmt.Errorf("cannot change status of a cancelled order item")
	}

	st := pg.NullOrderItemsStatus{OrderItemsStatus: pg.OrderItemsStatus(status), Valid: true}
	item, err := s.repo.Tenant(ctx).UpdateOrderItemStatus(ctx, pg.UpdateOrderItemStatusParams{ID: id, Status: st})
	if err != nil {
		return nil, fmt.Errorf("failed to update order item status: %w", err)
	}

	// Deduct stock when kitchen starts cooking
	if currentStatus == string(pg.OrderItemsStatusPending) && status == string(pg.OrderItemsStatusCooking) {
		if err := s.deductStockForOrderItem(ctx, existing.GoodID, existing.Quantity); err != nil {
			log.Printf("UpdateOrderItemStatus: stock deduction failed for item %s: %v", itemID, err)
		}
	}

	return toOrderItemResponse(item), nil
}

// deductStockForOrderItem resolves the storage from good→category→department,
// then recursively collects all ingredients and deducts from ingredient_stock.
func (s *OrderS) deductStockForOrderItem(ctx context.Context, goodID uuid.UUID, qty int32) error {
	storageID, err := s.repo.Tenant(ctx).GetStorageIDByGoodID(ctx, goodID)
	if err != nil {
		return fmt.Errorf("failed to resolve storage for good %s: %w", goodID, err)
	}
	if !storageID.Valid {
		return fmt.Errorf("good %s has no storage (check category→department→storage chain)", goodID)
	}

	ingredients := map[uuid.UUID]float64{}
	s.collectIngredients(ctx, goodID, float64(qty), true, ingredients)

	for ingID, amount := range ingredients {
		stockID, err := s.repo.Tenant(ctx).EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
			ID:           uuid.New(),
			IngredientID: ingID,
			StorageID:    storageID,
		})
		if err != nil {
			log.Printf("deductStock: EnsureIngredientStockByStorage failed for ingredient %s: %v", ingID, err)
			continue
		}

		amountNum := stringToNumeric(strconv.FormatFloat(amount, 'f', -1, 64))
		if _, err := s.repo.Tenant(ctx).RemoveFromIngredientStock(ctx, pg.RemoveFromIngredientStockParams{
			ID:       stockID,
			Quantity: amountNum,
		}); err != nil {
			log.Printf("deductStock: RemoveFromIngredientStock failed for ingredient %s: %v", ingID, err)
		}
	}
	return nil
}

// collectIngredients recursively resolves all leaf ingredients from a good or compound,
// multiplying quantities down the tree. Results accumulated in `out` map (ingredientID → total qty).
func (s *OrderS) collectIngredients(ctx context.Context, id uuid.UUID, multiplier float64, isGood bool, out map[uuid.UUID]float64) {
	idUUID := pgtype.UUID{Bytes: id, Valid: true}
	var rows []pg.Calculation
	var err error
	if isGood {
		rows, err = s.repo.Tenant(ctx).GetCalculationsByGoodID(ctx, idUUID)
	} else {
		rows, err = s.repo.Tenant(ctx).GetCalculationsByCompoundID(ctx, idUUID)
	}
	if err != nil {
		log.Printf("collectIngredients: failed to get calculations: %v", err)
		return
	}

	for _, row := range rows {
		rowQty, _ := strconv.ParseFloat(numericToStr(row.Quantity), 64)
		effectiveQty := rowQty * multiplier

		if row.IngredientID.Valid {
			out[row.IngredientID.Bytes] += effectiveQty
		} else if row.ComponentCompoundID.Valid {
			compID := row.ComponentCompoundID.Bytes
			s.collectIngredients(ctx, compID, effectiveQty, false, out)
		}
	}
}

func (s *OrderS) DeleteOrderItem(ctx context.Context, itemID string) error {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return fmt.Errorf("invalid order item id: %w", err)
	}

	existing, err := s.repo.Tenant(ctx).GetOrderItemByID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to get order item: %w", err)
	}

	if err := s.repo.Tenant(ctx).DeleteOrderItem(ctx, id); err != nil {
		return fmt.Errorf("failed to delete order item: %w", err)
	}

	_ = s.repo.Tenant(ctx).RecalculateOrderTotalsFromItems(ctx, existing.OrderID)
	return nil
}

func (s *OrderS) RestoreOrderItem(ctx context.Context, itemID string) error {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return fmt.Errorf("invalid order item id: %w", err)
	}
	if err := s.repo.Tenant(ctx).RestoreOrderItem(ctx, id); err != nil {
		return fmt.Errorf("failed to restore order item: %w", err)
	}

	if existing, err := s.repo.Tenant(ctx).GetOrderItemByID(ctx, id); err == nil {
		_ = s.repo.Tenant(ctx).RecalculateOrderTotalsFromItems(ctx, existing.OrderID)
	}
	return nil
}

func (s *OrderS) CancelOrderItem(ctx context.Context, itemID string) (*model.OrderItemResponse, error) {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return nil, fmt.Errorf("invalid order item id: %w", err)
	}
	item, err := s.repo.Tenant(ctx).CancelOrderItem(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to cancel order item: %w", err)
	}

	_ = s.repo.Tenant(ctx).RecalculateOrderTotalsFromItems(ctx, item.OrderID)
	return toOrderItemResponse(item), nil
}

func (s *OrderS) MarkOrderItemCooking(ctx context.Context, itemID string) (*model.OrderItemResponse, error) {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return nil, fmt.Errorf("invalid order item id: %w", err)
	}
	item, err := s.repo.Tenant(ctx).MarkOrderItemCooking(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to mark order item cooking: %w", err)
	}
	return toOrderItemResponse(item), nil
}

func (s *OrderS) MarkOrderItemReady(ctx context.Context, itemID string) (*model.OrderItemResponse, error) {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return nil, fmt.Errorf("invalid order item id: %w", err)
	}
	item, err := s.repo.Tenant(ctx).MarkOrderItemReady(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to mark order item ready: %w", err)
	}
	return toOrderItemResponse(item), nil
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
	if activated, err := s.repo.Tenant(ctx).ActivateReservedOrders(ctx); err == nil {
		for _, row := range activated {
			if row.OrderType == "dine_in" && row.TableID.Valid {
				_, _ = s.repo.Tenant(ctx).SetTableBusy(ctx, row.TableID.Bytes)
			}
		}
	}

	rows, err := s.repo.Tenant(ctx).GetKitchenQueue(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get kitchen queue: %w", err)
	}

	var items []KitchenQueueItem
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

func (s *OrderS) GetMyOrders(ctx context.Context, waiterID string, req model.GetMyOrdersRequest) ([]model.WaiterOrderListItem, error) {
	id, err := uuid.Parse(waiterID)
	if err != nil {
		return nil, fmt.Errorf("invalid waiter id: %w", err)
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
		return nil, fmt.Errorf("invalid scope: %s", scope)
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
			return nil, fmt.Errorf("invalid table id: %w", err)
		}

		params.TableID = pgtype.UUID{
			Bytes: tableUUID,
			Valid: true,
		}
	}

	rows, err := s.repo.Tenant(ctx).GetMyWaiterOrders(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get my orders: %w", err)
	}

	resp := make([]model.WaiterOrderListItem, 0, len(rows))
	for _, row := range rows {
		item := toWaiterOrderListItem(row)
		if item != nil {
			resp = append(resp, *item)
		}
	}

	return resp, nil
}
