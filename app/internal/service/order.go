package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"firebase.google.com/go/v4/messaging"
	"github.com/google/uuid"
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

func (s *OrderS) CreateOrder(ctx context.Context, req model.CreateOrderRequest) (*model.OrderResponse, error) {
	if req.TableID == "" {
		return nil, fmt.Errorf("table_id is required")
	}

	tableUUID, err := uuid.Parse(req.TableID)
	if err != nil {
		return nil, fmt.Errorf("invalid table_id: %w", err)
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

	status := pg.NullOrderStatus{}
	if req.Status != nil && *req.Status != "" {
		status = pg.NullOrderStatus{OrderStatus: pg.OrderStatus(*req.Status), Valid: true}
	} else {
		status = pg.NullOrderStatus{OrderStatus: pg.OrderStatus(model.OrderStatusOpen), Valid: true}
	}

	totalAmount := pgtype.Numeric{}
	if req.TotalAmount != nil && *req.TotalAmount != "" {
		if err := totalAmount.Scan(*req.TotalAmount); err != nil {
			return nil, fmt.Errorf("invalid total_amount: %w", err)
		}
	} else {
		totalAmount.Valid = false
	}

	order, err := s.repo.Tenant(ctx).CreateOrder(ctx, pg.CreateOrderParams{
		ID:          uuid.New(),
		TableID:     pgtype.UUID{Bytes: tableUUID, Valid: true},
		WaiterID:    waiterUUID,
		CashierID:   cashierUUID,
		Status:      status,
		GuestCount:  req.GuestCount,
		TotalAmount: totalAmount,
		Comment:     req.Comment,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	return toOrderResponse(order), nil
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

	return toOrderResponse(order), nil
}

func (s *OrderS) GetAllOrders(ctx context.Context, limit, offset int32) ([]model.OrderResponse, error) {
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
	if req.TotalAmount != nil && *req.TotalAmount != "" {
		var num pgtype.Numeric
		if err := num.Scan(*req.TotalAmount); err != nil {
			return nil, fmt.Errorf("invalid total_amount: %w", err)
		}
		finalTotal = num
	}

	finalGuestCount := existing.GuestCount
	if req.GuestCount != nil {
		finalGuestCount = req.GuestCount
	}

	finalComment := existing.Comment
	if req.Comment != nil {
		finalComment = req.Comment
	}

	order, err := s.repo.Tenant(ctx).UpdateOrder(ctx, pg.UpdateOrderParams{
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

	return toOrderResponse(order), nil
}

func (s *OrderS) UpdateOrderStatus(ctx context.Context, orderID string, status string) (*model.OrderResponse, error) {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}

	st := pg.NullOrderStatus{OrderStatus: pg.OrderStatus(status), Valid: true}
	order, err := s.repo.Tenant(ctx).UpdateOrderStatus(ctx, pg.UpdateOrderStatusParams{ID: id, Status: st})
	if err != nil {
		return nil, fmt.Errorf("failed to update order status: %w", err)
	}

	return toOrderResponse(order), nil
}

func (s *OrderS) MarkOrderPaid(ctx context.Context, orderID string, cashierID string) (*model.OrderResponse, error) {
	oID, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}
	cID, err := uuid.Parse(cashierID)
	if err != nil {
		return nil, fmt.Errorf("invalid cashier id: %w", err)
	}

	order, err := s.repo.Tenant(ctx).MarkOrderPaid(ctx, pg.MarkOrderPaidParams{ID: oID, CashierID: pgtype.UUID{Bytes: cID, Valid: true}})
	if err != nil {
		return nil, fmt.Errorf("failed to mark order paid: %w", err)
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
	return toOrderResponse(order), nil
}

func (s *OrderS) CreateOrderItem(ctx context.Context, req model.CreateOrderItemRequest) (*model.OrderItemResponse, error) {
	if req.OrderID == "" {
		return nil, fmt.Errorf("order_id is required")
	}
	if req.GoodID == "" {
		return nil, fmt.Errorf("good_id is required")
	}
	if req.Quantity <= 0 {
		return nil, fmt.Errorf("quantity must be greater than 0")
	}
	if req.Price == "" {
		return nil, fmt.Errorf("price is required")
	}

	oID, err := uuid.Parse(req.OrderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order_id: %w", err)
	}
	gID, err := uuid.Parse(req.GoodID)
	if err != nil {
		return nil, fmt.Errorf("invalid good_id: %w", err)
	}

	price := pgtype.Numeric{}
	if err := price.Scan(req.Price); err != nil {
		return nil, fmt.Errorf("invalid price: %w", err)
	}

	status := pg.NullOrderItemsStatus{OrderItemsStatus: pg.OrderItemsStatus(model.OrderItemStatusPending), Valid: true}
	if req.Status != nil && *req.Status != "" {
		status = pg.NullOrderItemsStatus{OrderItemsStatus: pg.OrderItemsStatus(*req.Status), Valid: true}
	}

	item, err := s.repo.Tenant(ctx).CreateOrderItem(ctx, pg.CreateOrderItemParams{
		ID:       uuid.New(),
		GoodID:   gID,
		OrderID:  oID,
		Quantity: req.Quantity,
		Price:    price,
		Status:   status,
		Comment:  req.Comment,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create order item: %w", err)
	}

	return toOrderItemResponse(item), nil
}

func (s *OrderS) GetOrderItemByID(ctx context.Context, itemID string) (*model.OrderItemResponse, error) {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return nil, fmt.Errorf("invalid order item id: %w", err)
	}

	item, err := s.repo.Tenant(ctx).GetOrderItemByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get order item: %w", err)
	}

	return toOrderItemResponse(item), nil
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

func (s *OrderS) GetOrderItemsByOrderID(ctx context.Context, orderID string) ([]model.OrderItemResponse, error) {
	id, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}

	items, err := s.repo.Tenant(ctx).GetOrderItemsByOrderID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get order items: %w", err)
	}

	var responses []model.OrderItemResponse
	for _, it := range items {
		responses = append(responses, *toOrderItemResponse(it))
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
	return toOrderItemResponse(item), nil
}

func (s *OrderS) UpdateOrderItemStatus(ctx context.Context, itemID string, status string) (*model.OrderItemResponse, error) {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return nil, fmt.Errorf("invalid order item id: %w", err)
	}

	st := pg.NullOrderItemsStatus{OrderItemsStatus: pg.OrderItemsStatus(status), Valid: true}
	item, err := s.repo.Tenant(ctx).UpdateOrderItemStatus(ctx, pg.UpdateOrderItemStatusParams{ID: id, Status: st})
	if err != nil {
		return nil, fmt.Errorf("failed to update order item status: %w", err)
	}
	return toOrderItemResponse(item), nil
}

func (s *OrderS) DeleteOrderItem(ctx context.Context, itemID string) error {
	id, err := uuid.Parse(itemID)
	if err != nil {
		return fmt.Errorf("invalid order item id: %w", err)
	}
	if err := s.repo.Tenant(ctx).DeleteOrderItem(ctx, id); err != nil {
		return fmt.Errorf("failed to delete order item: %w", err)
	}
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

func toOrderResponse(o pg.Order) *model.OrderResponse {
	if o.ID == uuid.Nil {
		return nil
	}

	var waiterID *string
	if o.WaiterID.Valid {
		s := o.WaiterID.String()
		waiterID = &s
	}

	var cashierID *string
	if o.CashierID.Valid {
		s := o.CashierID.String()
		cashierID = &s
	}

	var createdAt *time.Time
	if o.CreatedAt.Valid {
		t := o.CreatedAt.Time
		createdAt = &t
	}

	var updatedAt *time.Time
	if o.UpdatedAt.Valid {
		t := o.UpdatedAt.Time
		updatedAt = &t
	}

	status := model.OrderStatusOpen
	if o.Status.Valid {
		status = model.OrderStatus(o.Status.OrderStatus)
	}

	return &model.OrderResponse{
		ID:          o.ID.String(),
		TableID:     o.TableID.String(),
		WaiterID:    waiterID,
		CashierID:   cashierID,
		Status:      status,
		GuestCount:  o.GuestCount,
		TotalAmount: numericToString(o.TotalAmount),
		Comment:     o.Comment,
		CreatedAt:   createdAt,
		UpdatedAt:   updatedAt,
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
