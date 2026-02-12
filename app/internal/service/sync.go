package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type SyncS struct {
	repo *repository.Repository
}

type ChangeLogFilter struct {
	Entity   string
	Action   string
	FromID   *int64
	ToID     *int64
	FromTime *time.Time
	ToTime   *time.Time
	Limit    int32
	Offset   int32
	Order    string
}

func NewSyncS(repo *repository.Repository) *SyncS {
	return &SyncS{
		repo: repo,
	}
}

func (s *SyncS) Pull(ctx context.Context, lastCursor int64, limit int32) (model.SyncPullResponse, error) {
	if lastCursor < 0 {
		lastCursor = 0
	}
	if limit <= 0 {
		limit = 10000
	}
	if limit > 50000 {
		limit = 50000
	}

	tx, ok := repository.TenantTxFromContext(ctx)
	if !ok || tx == nil {
		return model.SyncPullResponse{}, fmt.Errorf("tenant transaction not found in context")
	}

	rows, err := tx.Query(ctx, `
		SELECT id, brand_id, entity, action, entity_id, payload
		FROM change_log
		WHERE id > $1
		ORDER BY id ASC
		LIMIT $2
	`, lastCursor, limit)
	if err != nil {
		return model.SyncPullResponse{}, fmt.Errorf("failed to query change_log: %w", err)
	}
	defer rows.Close()

	changes := map[string]model.EntityChanges{}
	nextCursor := lastCursor

	for rows.Next() {
		var (
			id       int64
			brandID  *string
			entity   string
			action   string
			entityID string
			payload  []byte
		)
		if err := rows.Scan(&id, &brandID, &entity, &action, &entityID, &payload); err != nil {
			return model.SyncPullResponse{}, fmt.Errorf("failed to scan change_log row: %w", err)
		}

		nextCursor = id
		ec, exists := changes[entity]
		if !exists {
			ec = model.EntityChanges{
				Created: []map[string]interface{}{},
				Updated: []map[string]interface{}{},
				Deleted: []string{},
			}
		}

		switch action {
		case "create":
			if len(payload) > 0 {
				var obj map[string]interface{}
				if err := json.Unmarshal(payload, &obj); err != nil {
					return model.SyncPullResponse{}, fmt.Errorf("invalid payload json for create: %w", err)
				}
				ec.Created = append(ec.Created, obj)
			}
		case "update":
			if len(payload) > 0 {
				var obj map[string]interface{}
				if err := json.Unmarshal(payload, &obj); err != nil {
					return model.SyncPullResponse{}, fmt.Errorf("invalid payload json for update: %w", err)
				}
				ec.Updated = append(ec.Updated, obj)
			}
		case "delete":
			if entityID != "" {
				ec.Deleted = append(ec.Deleted, entityID)
			} else if len(payload) > 0 {
				var obj map[string]interface{}
				if err := json.Unmarshal(payload, &obj); err == nil {
					if v, ok := obj["id"]; ok {
						ec.Deleted = append(ec.Deleted, fmt.Sprintf("%v", v))
					}
				}
			}
		}

		changes[entity] = ec
	}
	if err := rows.Err(); err != nil {
		return model.SyncPullResponse{}, fmt.Errorf("change_log rows error: %w", err)
	}

	return model.SyncPullResponse{
		NextSyncCursor: nextCursor,
		Changes:        changes,
	}, nil
}

func (s *SyncS) Push(ctx context.Context, req model.SyncPushRequest) (model.SyncPushResult, error) {
	if tx, ok := repository.TenantTxFromContext(ctx); !ok || tx == nil {
		return model.SyncPushResult{}, fmt.Errorf("tenant transaction not found in context")
	}

	result := model.SyncPushResult{
		Applied: 0,
		Errors:  []model.SyncPushError{},
	}

	orderSvc := NewOrderS(s.repo)

	for i, ch := range req.Changes {
		entity := strings.TrimSpace(ch.Entity)
		action := strings.ToLower(strings.TrimSpace(ch.Action))
		if action != "create" && action != "update" && action != "delete" {
			result.Errors = append(result.Errors, model.SyncPushError{
				Index:  i,
				Entity: ch.Entity,
				Action: ch.Action,
				Error:  "invalid action",
			})
			continue
		}

		payload := ch.Payload
		if payload == nil {
			payload = map[string]interface{}{}
		}

		if ch.EntityID != "" {
			if _, ok := payload["id"]; !ok {
				payload["id"] = ch.EntityID
			}
		}

		var err error
		switch entity {
		case "orders":
			err = s.applyOrderChange(ctx, orderSvc, action, payload)
		case "order_items":
			err = s.applyOrderItemChange(ctx, orderSvc, action, payload)
		case "shifts":
			err = s.applyShiftChange(ctx, action, payload)
		case "attendances":
			err = s.applyAttendanceChange(ctx, action, payload)
		default:
			err = fmt.Errorf("entity not allowed for push")
		}

		if err != nil {
			result.Errors = append(result.Errors, model.SyncPushError{
				Index:  i,
				Entity: ch.Entity,
				Action: ch.Action,
				Error:  err.Error(),
			})
			continue
		}
		result.Applied++
	}

	return result, nil
}

func (s *SyncS) ListChangeLogs(ctx context.Context, filter ChangeLogFilter) (model.ChangeLogListResponse, error) {
	tx, ok := repository.TenantTxFromContext(ctx)
	if !ok || tx == nil {
		return model.ChangeLogListResponse{}, fmt.Errorf("tenant transaction not found in context")
	}

	if filter.Limit <= 0 {
		filter.Limit = 1000
	}
	if filter.Limit > 50000 {
		filter.Limit = 50000
	}
	if filter.Offset < 0 {
		filter.Offset = 0
	}

	order := "ASC"
	if strings.EqualFold(filter.Order, "desc") {
		order = "DESC"
	}

	where, args := buildChangeLogWhere(filter)

	countQuery := "SELECT COUNT(*) FROM change_log " + where
	var total int64
	if err := tx.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return model.ChangeLogListResponse{}, fmt.Errorf("failed to count change_log: %w", err)
	}

	args = append(args, filter.Limit, filter.Offset)
	listQuery := fmt.Sprintf(`
		SELECT id, brand_id, entity, action, entity_id, payload, changed_at
		FROM change_log
		%s
		ORDER BY id %s
		LIMIT $%d OFFSET $%d
	`, where, order, len(args)-1, len(args))

	rows, err := tx.Query(ctx, listQuery, args...)
	if err != nil {
		return model.ChangeLogListResponse{}, fmt.Errorf("failed to query change_log: %w", err)
	}
	defer rows.Close()

	items := make([]model.ChangeLogEntry, 0)
	for rows.Next() {
		var (
			id       int64
			brandID  *string
			entity   string
			action   string
			entityID string
			payload  []byte
			changed  time.Time
		)
		if err := rows.Scan(&id, &brandID, &entity, &action, &entityID, &payload, &changed); err != nil {
			return model.ChangeLogListResponse{}, fmt.Errorf("failed to scan change_log row: %w", err)
		}

		var obj map[string]interface{}
		if len(payload) > 0 {
			if err := json.Unmarshal(payload, &obj); err != nil {
				return model.ChangeLogListResponse{}, fmt.Errorf("invalid payload json: %w", err)
			}
		} else {
			obj = map[string]interface{}{}
		}

		items = append(items, model.ChangeLogEntry{
			ID:        id,
			BrandID:   brandID,
			Entity:    entity,
			Action:    action,
			EntityID:  entityID,
			Payload:   obj,
			ChangedAt: changed,
		})
	}
	if err := rows.Err(); err != nil {
		return model.ChangeLogListResponse{}, fmt.Errorf("change_log rows error: %w", err)
	}

	return model.ChangeLogListResponse{
		Items: items,
		Total: total,
	}, nil
}

func buildChangeLogWhere(filter ChangeLogFilter) (string, []interface{}) {
	clauses := make([]string, 0)
	args := make([]interface{}, 0)

	if filter.Entity != "" {
		args = append(args, filter.Entity)
		clauses = append(clauses, fmt.Sprintf("entity = $%d", len(args)))
	}
	if filter.Action != "" {
		args = append(args, filter.Action)
		clauses = append(clauses, fmt.Sprintf("action = $%d", len(args)))
	}
	if filter.FromID != nil {
		args = append(args, *filter.FromID)
		clauses = append(clauses, fmt.Sprintf("id >= $%d", len(args)))
	}
	if filter.ToID != nil {
		args = append(args, *filter.ToID)
		clauses = append(clauses, fmt.Sprintf("id <= $%d", len(args)))
	}
	if filter.FromTime != nil {
		args = append(args, *filter.FromTime)
		clauses = append(clauses, fmt.Sprintf("changed_at >= $%d", len(args)))
	}
	if filter.ToTime != nil {
		args = append(args, *filter.ToTime)
		clauses = append(clauses, fmt.Sprintf("changed_at <= $%d", len(args)))
	}

	if len(clauses) == 0 {
		return "", args
	}
	return "WHERE " + strings.Join(clauses, " AND "), args
}

func (s *SyncS) applyOrderChange(ctx context.Context, orderSvc *OrderS, action string, payload map[string]interface{}) error {
	id, err := getUUID(payload, "id")
	if err != nil {
		return err
	}

	switch action {
	case "create":
		return s.createOrderFromPayload(ctx, id, payload)
	case "update":
		return s.updateOrderFromPayload(ctx, orderSvc, id, payload)
	case "delete":
		return s.repo.Tenant(ctx).DeleteOrder(ctx, id)
	default:
		return fmt.Errorf("invalid action for orders")
	}
}

func (s *SyncS) createOrderFromPayload(ctx context.Context, id uuid.UUID, payload map[string]interface{}) error {
	if _, err := s.repo.Tenant(ctx).GetOrderByID(ctx, id); err == nil {
		return nil
	}

	tableID, err := getUUID(payload, "table_id")
	if err != nil {
		return fmt.Errorf("table_id: %w", err)
	}
	if _, err := s.repo.Tenant(ctx).GetCafeTableByID(ctx, tableID); err != nil {
		return fmt.Errorf("cafe table not found: %w", err)
	}

	waiterID := pgtype.UUID{}
	if v, ok := getOptionalUUID(payload, "waiter_id"); ok {
		waiterID = pgtype.UUID{Bytes: v, Valid: true}
	}
	cashierID := pgtype.UUID{}
	if v, ok := getOptionalUUID(payload, "cashier_id"); ok {
		cashierID = pgtype.UUID{Bytes: v, Valid: true}
	}

	status := pg.NullOrderStatus{OrderStatus: pg.OrderStatus(model.OrderStatusOpen), Valid: true}
	if st, ok := getOptionalString(payload, "status"); ok {
		status = pg.NullOrderStatus{OrderStatus: pg.OrderStatus(st), Valid: true}
	}

	var guestCount *int32
	if v, ok := getOptionalInt32(payload, "guest_count"); ok {
		guestCount = &v
	}

	var comment *string
	if v, ok := getOptionalString(payload, "comment"); ok {
		comment = &v
	}

	var totalAmount pgtype.Numeric
	_ = totalAmount.Scan("0")

	order, err := s.repo.Tenant(ctx).CreateOrder(ctx, pg.CreateOrderParams{
		ID:          id,
		TableID:     pgtype.UUID{Bytes: tableID, Valid: true},
		WaiterID:    waiterID,
		CashierID:   cashierID,
		Status:      status,
		GuestCount:  guestCount,
		TotalAmount: totalAmount,
		Comment:     comment,
	})
	if err != nil {
		return fmt.Errorf("failed to create order: %w", err)
	}

	billNo, err := s.repo.Tenant(ctx).NextDailyBillNo(ctx)
	if err != nil {
		return fmt.Errorf("failed to generate bill number: %w", err)
	}
	servicePercent, err := s.repo.Tenant(ctx).GetDefaultServicePercentByTable(ctx, tableID)
	if err != nil {
		return fmt.Errorf("failed to get default service percent: %w", err)
	}
	if err := s.repo.Tenant(ctx).InitOrderBillFields(ctx, order.ID, billNo, servicePercent); err != nil {
		return fmt.Errorf("failed to init bill fields: %w", err)
	}

	return nil
}

func (s *SyncS) updateOrderFromPayload(ctx context.Context, orderSvc *OrderS, id uuid.UUID, payload map[string]interface{}) error {
	if _, err := s.repo.Tenant(ctx).GetOrderByID(ctx, id); err != nil {
		return fmt.Errorf("order not found: %w", err)
	}

	req := model.UpdateOrderRequest{}
	if v, ok := getOptionalString(payload, "table_id"); ok {
		req.TableID = &v
	}
	if v, ok := getOptionalString(payload, "waiter_id"); ok {
		req.WaiterID = &v
	}
	if v, ok := getOptionalString(payload, "cashier_id"); ok {
		req.CashierID = &v
	}
	if v, ok := getOptionalString(payload, "status"); ok {
		req.Status = &v
	}
	if v, ok := getOptionalInt32(payload, "guest_count"); ok {
		req.GuestCount = &v
	}
	if v, ok := getOptionalString(payload, "comment"); ok {
		req.Comment = &v
	}

	if req.Status != nil && *req.Status == string(model.OrderStatusPaid) {
		cashierID := ""
		if req.CashierID != nil {
			cashierID = *req.CashierID
		}
		paymentType, _ := getOptionalString(payload, "payment_type")
		discountPercent, _ := getOptionalString(payload, "discount_percent")
		discountAmount, _ := getOptionalString(payload, "discount_amount")
		discountComment, _ := getOptionalString(payload, "discount_comment")

		if cashierID != "" {
			if _, err := orderSvc.MarkOrderPaid(ctx, id.String(), cashierID, stringPtrOrNil(paymentType), stringPtrOrNil(discountPercent), stringPtrOrNil(discountAmount), stringPtrOrNil(discountComment)); err != nil {
				return err
			}
		} else {
			if _, err := orderSvc.UpdateOrderStatus(ctx, id.String(), *req.Status); err != nil {
				return err
			}
		}
		req.Status = nil
	}

	if req.Status != nil && *req.Status == string(model.OrderStatusCancelled) {
		if _, err := orderSvc.CancelOrder(ctx, id.String()); err != nil {
			return err
		}
		req.Status = nil
	}

	if req.TableID == nil && req.WaiterID == nil && req.CashierID == nil && req.Status == nil && req.GuestCount == nil && req.Comment == nil {
		return nil
	}

	_, err := orderSvc.UpdateOrder(ctx, id.String(), req)
	return err
}

func (s *SyncS) applyOrderItemChange(ctx context.Context, orderSvc *OrderS, action string, payload map[string]interface{}) error {
	id, err := getUUID(payload, "id")
	if err != nil {
		return err
	}

	switch action {
	case "create":
		return s.createOrderItemFromPayload(ctx, id, payload)
	case "update":
		return s.updateOrderItemFromPayload(ctx, orderSvc, id, payload)
	case "delete":
		return orderSvc.DeleteOrderItem(ctx, id.String())
	default:
		return fmt.Errorf("invalid action for order_items")
	}
}

func (s *SyncS) createOrderItemFromPayload(ctx context.Context, id uuid.UUID, payload map[string]interface{}) error {
	if _, err := s.repo.Tenant(ctx).GetOrderItemByID(ctx, id); err == nil {
		return nil
	}

	orderID, err := getUUID(payload, "order_id")
	if err != nil {
		return fmt.Errorf("order_id: %w", err)
	}
	if _, err := s.repo.Tenant(ctx).GetOrderByID(ctx, orderID); err != nil {
		return fmt.Errorf("order not found: %w", err)
	}

	goodID, err := getUUID(payload, "good_id")
	if err != nil {
		return fmt.Errorf("good_id: %w", err)
	}
	if _, err := s.repo.Tenant(ctx).GetGoodByID(ctx, goodID); err != nil {
		return fmt.Errorf("good not found: %w", err)
	}

	quantity, ok := getOptionalInt32(payload, "quantity")
	if !ok || quantity <= 0 {
		return fmt.Errorf("quantity is required and must be > 0")
	}

	price, err := getNumeric(payload, "price")
	if err != nil {
		return fmt.Errorf("price: %w", err)
	}

	status := pg.NullOrderItemsStatus{OrderItemsStatus: pg.OrderItemsStatus(model.OrderItemStatusPending), Valid: true}
	if st, ok := getOptionalString(payload, "status"); ok {
		status = pg.NullOrderItemsStatus{OrderItemsStatus: pg.OrderItemsStatus(st), Valid: true}
	}
	var comment *string
	if v, ok := getOptionalString(payload, "comment"); ok {
		comment = &v
	}

	if _, err := s.repo.Tenant(ctx).CreateOrderItem(ctx, pg.CreateOrderItemParams{
		ID:       id,
		GoodID:   goodID,
		OrderID:  orderID,
		Quantity: quantity,
		Price:    price,
		Status:   status,
		Comment:  comment,
	}); err != nil {
		return fmt.Errorf("failed to create order item: %w", err)
	}

	_ = s.repo.Tenant(ctx).RecalculateOrderTotalsFromItems(ctx, orderID)
	return nil
}

func (s *SyncS) updateOrderItemFromPayload(ctx context.Context, orderSvc *OrderS, id uuid.UUID, payload map[string]interface{}) error {
	req := model.UpdateOrderItemRequest{}
	if v, ok := getOptionalString(payload, "good_id"); ok {
		req.GoodID = &v
	}
	if v, ok := getOptionalString(payload, "order_id"); ok {
		req.OrderID = &v
	}
	if v, ok := getOptionalInt32(payload, "quantity"); ok {
		req.Quantity = &v
	}
	if v, ok := getOptionalString(payload, "price"); ok {
		req.Price = &v
	}
	if v, ok := getOptionalString(payload, "status"); ok {
		req.Status = &v
	}
	if v, ok := getOptionalString(payload, "comment"); ok {
		req.Comment = &v
	}

	_, err := orderSvc.UpdateOrderItem(ctx, id.String(), req)
	return err
}

func (s *SyncS) applyShiftChange(ctx context.Context, action string, payload map[string]interface{}) error {
	id, err := getUUID(payload, "id")
	if err != nil {
		return err
	}

	switch action {
	case "create":
		return s.createShiftFromPayload(ctx, id, payload)
	case "update":
		return s.updateShiftFromPayload(ctx, id, payload)
	case "delete":
		_, err := s.repo.Tenant(ctx).SoftDeleteShift(ctx, id)
		return err
	default:
		return fmt.Errorf("invalid action for shifts")
	}
}

func (s *SyncS) createShiftFromPayload(ctx context.Context, id uuid.UUID, payload map[string]interface{}) error {
	if _, err := s.repo.Tenant(ctx).GetShiftByID(ctx, id); err == nil {
		return nil
	}

	name, ok := getOptionalString(payload, "name")
	if !ok || name == "" {
		return fmt.Errorf("name is required")
	}
	role, _ := getOptionalString(payload, "role")
	workingDays, _ := getOptionalString(payload, "working_days")
	openTime, _ := getOptionalInt64(payload, "open_time")
	closeTime, _ := getOptionalInt64(payload, "close_time")
	branchID, err := getUUID(payload, "branch_id")
	if err != nil {
		return fmt.Errorf("branch_id: %w", err)
	}

	_, err = s.repo.Tenant(ctx).CreateShift(ctx, pg.CreateShiftParams{
		ID:          id,
		Name:        name,
		Role:        stringPtrOrNil(role),
		WorkingDays: stringPtrOrNil(workingDays),
		OpenTime:    int64PtrOrNil(openTime),
		CloseTime:   int64PtrOrNil(closeTime),
		BranchID:    pgtype.UUID{Bytes: branchID, Valid: true},
	})
	return err
}

func (s *SyncS) updateShiftFromPayload(ctx context.Context, id uuid.UUID, payload map[string]interface{}) error {
	existing, err := s.repo.Tenant(ctx).GetShiftByID(ctx, id)
	if err != nil {
		return fmt.Errorf("shift not found: %w", err)
	}

	name := existing.Name
	if v, ok := getOptionalString(payload, "name"); ok && v != "" {
		name = v
	}

	role := existing.Role
	if v, ok := getOptionalString(payload, "role"); ok {
		role = stringPtrOrNil(v)
	}

	workingDays := existing.WorkingDays
	if v, ok := getOptionalString(payload, "working_days"); ok {
		workingDays = stringPtrOrNil(v)
	}

	openTime := existing.OpenTime
	if v, ok := getOptionalInt64(payload, "open_time"); ok {
		openTime = int64PtrOrNil(v)
	}

	closeTime := existing.CloseTime
	if v, ok := getOptionalInt64(payload, "close_time"); ok {
		closeTime = int64PtrOrNil(v)
	}

	branchID := existing.BranchID
	if v, ok := getOptionalString(payload, "branch_id"); ok {
		if b, err := uuid.Parse(v); err == nil {
			branchID = pgtype.UUID{Bytes: b, Valid: true}
		}
	}

	_, err = s.repo.Tenant(ctx).UpdateShift(ctx, pg.UpdateShiftParams{
		ID:          id,
		Name:        name,
		Role:        role,
		WorkingDays: workingDays,
		OpenTime:    openTime,
		CloseTime:   closeTime,
		BranchID:    branchID,
	})
	return err
}

func (s *SyncS) applyAttendanceChange(ctx context.Context, action string, payload map[string]interface{}) error {
	id, err := getUUID(payload, "id")
	if err != nil {
		return err
	}

	switch action {
	case "create":
		return s.createAttendanceFromPayload(ctx, id, payload)
	case "update":
		return s.updateAttendanceFromPayload(ctx, id, payload)
	case "delete":
		_, err := s.repo.Tenant(ctx).SoftDeleteAttendance(ctx, id)
		return err
	default:
		return fmt.Errorf("invalid action for attendances")
	}
}

func (s *SyncS) createAttendanceFromPayload(ctx context.Context, id uuid.UUID, payload map[string]interface{}) error {
	if _, err := s.repo.Tenant(ctx).GetAttendanceByID(ctx, id); err == nil {
		return nil
	}

	userID, err := getUUID(payload, "user_id")
	if err != nil {
		return fmt.Errorf("user_id: %w", err)
	}

	openDate, ok := getOptionalDate(payload, "open_date")
	if !ok {
		return fmt.Errorf("open_date is required")
	}

	closeDate, _ := getOptionalDate(payload, "close_date")
	diff, okDiff := getOptionalInt32(payload, "difference")
	wh, okWh := getOptionalInt32(payload, "working_hours")

	var diffPtr *int32
	if okDiff {
		diffPtr = &diff
	}
	var whPtr *int32
	if okWh {
		whPtr = &wh
	}

	_, err = s.repo.Tenant(ctx).CreateAttendance(ctx, pg.CreateAttendanceParams{
		ID:           id,
		UserID:       userID,
		OpenDate:     openDate,
		CloseDate:    closeDate,
		Difference:   diffPtr,
		WorkingHours: whPtr,
	})
	return err
}

func (s *SyncS) updateAttendanceFromPayload(ctx context.Context, id uuid.UUID, payload map[string]interface{}) error {
	openDate, okOpen := getOptionalDate(payload, "open_date")
	closeDate, okClose := getOptionalDate(payload, "close_date")
	diff, okDiff := getOptionalInt32(payload, "difference")
	wh, okWh := getOptionalInt32(payload, "working_hours")

	if !okOpen {
		openDate = pgtype.Date{}
	}
	if !okClose {
		closeDate = pgtype.Date{}
	}

	var diffPtr *int32
	if okDiff {
		diffPtr = &diff
	}
	var whPtr *int32
	if okWh {
		whPtr = &wh
	}

	_, err := s.repo.Tenant(ctx).UpdateAttendance(ctx, pg.UpdateAttendanceParams{
		ID:           id,
		OpenDate:     openDate,
		CloseDate:    closeDate,
		Difference:   diffPtr,
		WorkingHours: whPtr,
	})
	return err
}

func getUUID(payload map[string]interface{}, key string) (uuid.UUID, error) {
	v, ok := getOptionalString(payload, key)
	if !ok || v == "" {
		return uuid.Nil, fmt.Errorf("%s is required", key)
	}
	id, err := uuid.Parse(v)
	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid %s: %w", key, err)
	}
	return id, nil
}

func getOptionalUUID(payload map[string]interface{}, key string) (uuid.UUID, bool) {
	v, ok := getOptionalString(payload, key)
	if !ok || v == "" {
		return uuid.Nil, false
	}
	id, err := uuid.Parse(v)
	if err != nil {
		return uuid.Nil, false
	}
	return id, true
}

func getOptionalString(payload map[string]interface{}, key string) (string, bool) {
	v, ok := payload[key]
	if !ok || v == nil {
		return "", false
	}
	switch t := v.(type) {
	case string:
		return t, true
	case []byte:
		return string(t), true
	case fmt.Stringer:
		return t.String(), true
	default:
		return fmt.Sprintf("%v", t), true
	}
}

func getOptionalInt32(payload map[string]interface{}, key string) (int32, bool) {
	v, ok := payload[key]
	if !ok || v == nil {
		return 0, false
	}
	switch t := v.(type) {
	case float64:
		return int32(t), true
	case float32:
		return int32(t), true
	case int:
		return int32(t), true
	case int64:
		return int32(t), true
	case json.Number:
		i, err := t.Int64()
		if err != nil {
			return 0, false
		}
		return int32(i), true
	case string:
		i, err := strconv.ParseInt(t, 10, 32)
		if err != nil {
			return 0, false
		}
		return int32(i), true
	default:
		return 0, false
	}
}

func getOptionalInt64(payload map[string]interface{}, key string) (int64, bool) {
	v, ok := payload[key]
	if !ok || v == nil {
		return 0, false
	}
	switch t := v.(type) {
	case float64:
		return int64(t), true
	case float32:
		return int64(t), true
	case int:
		return int64(t), true
	case int64:
		return t, true
	case json.Number:
		i, err := t.Int64()
		if err != nil {
			return 0, false
		}
		return i, true
	case string:
		i, err := strconv.ParseInt(t, 10, 64)
		if err != nil {
			return 0, false
		}
		return i, true
	default:
		return 0, false
	}
}

func getOptionalDate(payload map[string]interface{}, key string) (pgtype.Date, bool) {
	v, ok := getOptionalString(payload, key)
	if !ok || v == "" {
		return pgtype.Date{}, false
	}
	var t time.Time
	var err error
	if len(v) == len("2006-01-02") {
		t, err = time.Parse("2006-01-02", v)
	} else {
		t, err = time.Parse(time.RFC3339, v)
	}
	if err != nil {
		return pgtype.Date{}, false
	}
	return pgtype.Date{Time: t, Valid: true}, true
}

func getNumeric(payload map[string]interface{}, key string) (pgtype.Numeric, error) {
	var num pgtype.Numeric
	v, ok := payload[key]
	if !ok || v == nil {
		return num, fmt.Errorf("%s is required", key)
	}
	switch t := v.(type) {
	case float64:
		return num, num.Scan(strconv.FormatFloat(t, 'f', -1, 64))
	case float32:
		return num, num.Scan(strconv.FormatFloat(float64(t), 'f', -1, 64))
	case int:
		return num, num.Scan(strconv.Itoa(t))
	case int64:
		return num, num.Scan(strconv.FormatInt(t, 10))
	case string:
		return num, num.Scan(t)
	default:
		return num, num.Scan(fmt.Sprintf("%v", t))
	}
}

func stringPtrOrNil(s string) *string {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return &s
}

func int64PtrOrNil(v int64) *int64 {
	if v == 0 {
		return nil
	}
	return &v
}
