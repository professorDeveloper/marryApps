package service

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type TableTimerS struct {
	repo *repository.Repository
}

func NewTableTimerS(repo *repository.Repository) *TableTimerS {
	return &TableTimerS{repo: repo}
}

// getTenantMutationQueries returns tenant queries within a transaction for mutation operations.
// If a transaction already exists in context, it reuses it. Otherwise, it creates a new one.
// Returns: queries, enriched context, transaction, ownsTx (whether we created the tx), error
func (s *TableTimerS) getTenantMutationQueries(ctx context.Context) (*pg.Queries, context.Context, pgx.Tx, bool, error) {
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
	txCtx := repository.WithTenantQueries(ctx, q)

	return q, txCtx, tx, true, nil
}

func parseActorUUID(userID string) (pgtype.UUID, error) {
	if userID == "" {
		return pgtype.UUID{}, fmt.Errorf("actor user id is required")
	}
	id, err := uuid.Parse(userID)
	if err != nil {
		return pgtype.UUID{}, fmt.Errorf("invalid actor user id: %w", err)
	}
	return pgtype.UUID{Bytes: id, Valid: true}, nil
}

func (s *TableTimerS) getTimerContext(ctx context.Context, orderID uuid.UUID) (pg.OrderTimerContextRow, error) {
	var result pg.OrderTimerContextRow
	err := withTenantRead(ctx, s.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		row, err := q.GetOrderTimerContext(tenantCtx, orderID)
		if err != nil {
			return err
		}
		result = row
		return nil
	})
	if err != nil {
		return result, err
	}

	if result.OrderType != "dine_in" {
		return result, fmt.Errorf("table timer is only available for dine_in orders")
	}
	if !result.TableID.Valid {
		return result, fmt.Errorf("order has no table")
	}
	if result.TableType != string(model.TableTypeTimeBased) {
		return result, fmt.Errorf("table timer is only available for time_based tables")
	}

	return result, nil
}

func (s *TableTimerS) ensureTimerMutable(ctx context.Context, orderID uuid.UUID) (pg.OrderTimerContextRow, error) {
	row, err := s.getTimerContext(ctx, orderID)
	if err != nil {
		return row, err
	}

	if row.OrderStatus.Valid {
		st := string(row.OrderStatus.OrderStatus)
		if st == string(model.OrderStatusPaid) || st == string(model.OrderStatusCancelled) {
			return row, fmt.Errorf("cannot manage timer for %s order", st)
		}
	}

	return row, nil
}

func calcTotalActiveSec(session pg.TableTimeSessionRow, now time.Time) int64 {
	total := session.AccumulatedActiveSec
	if session.State == string(model.TableTimerStateRunning) && session.ActiveStartedAt.Valid {
		delta := now.Unix() - session.ActiveStartedAt.Time.Unix()
		if delta > 0 {
			total += delta
		}
	}
	return total
}

func calcAmount(totalSec int64, pricePerHour pgtype.Numeric) *string {
	if !pricePerHour.Valid {
		return nil
	}
	pricePerHourF, _ := strconv.ParseFloat(numericToStr(pricePerHour), 64)
	if pricePerHourF <= 0 {
		return nil
	}
	total := (float64(totalSec) / 3600.0) * pricePerHourF
	v := strconv.FormatFloat(total, 'f', 2, 64)
	return &v
}

func toTableTimerResponse(ctxRow pg.OrderTimerContextRow, session *pg.TableTimeSessionRow, now time.Time) *model.TableTimerResponse {
	resp := &model.TableTimerResponse{
		OrderID:   ctxRow.OrderID.String(),
		TableType: ctxRow.TableType,
		State:     model.TableTimerStateNone,
	}
	if ctxRow.TableID.Valid {
		resp.TableID = uuid.UUID(ctxRow.TableID.Bytes).String()
	}
	if ctxRow.PricePerHour.Valid {
		v := numericToStr(ctxRow.PricePerHour)
		resp.PricePerHour = &v
	}

	if session == nil {
		return resp
	}

	resp.State = model.TableTimerState(session.State)
	resp.StartedAt = &session.StartedAt
	if session.ActiveStartedAt.Valid {
		t := session.ActiveStartedAt.Time
		resp.ActiveStartedAt = &t
	}
	if session.EndedAt.Valid {
		t := session.EndedAt.Time
		resp.EndedAt = &t
	}
	resp.AccumulatedActiveSec = session.AccumulatedActiveSec
	resp.TotalActiveSec = calcTotalActiveSec(*session, now)
	resp.CurrentActiveSec = resp.TotalActiveSec - resp.AccumulatedActiveSec
	if resp.CurrentActiveSec < 0 {
		resp.CurrentActiveSec = 0
	}
	resp.CurrentAmount = calcAmount(resp.TotalActiveSec, ctxRow.PricePerHour)
	if session.FinalAmount.Valid {
		v := numericToStr(session.FinalAmount)
		resp.FinalAmount = &v
	}

	resp.IsRunning = session.State == string(model.TableTimerStateRunning)
	resp.IsPaused = session.State == string(model.TableTimerStatePaused)
	resp.IsClosed = session.State == string(model.TableTimerStateClosed)
	return resp
}

func (s *TableTimerS) StartTableTimerIfNeeded(ctx context.Context, orderID string, actorUserID string, actorRole string) (*model.TableTimerResponse, error) {
	oID, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}
	actorUUID, err := parseActorUUID(actorUserID)
	if err != nil {
		return nil, err
	}
	ctxRow, err := s.ensureTimerMutable(ctx, oID)
	if err != nil {
		return nil, err
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	existing, err := q.GetOpenTableTimeSessionByOrderID(txCtx, oID)
	if err == nil {
		if ownsTx {
			tx.Commit(ctx)
		}
		return toTableTimerResponse(ctxRow, &existing, time.Now()), nil
	}
	if err != pgx.ErrNoRows {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to get open timer session: %w", err)
	}

	openByTable, err := q.GetOpenTableTimeSessionByTableID(txCtx, uuid.UUID(ctxRow.TableID.Bytes))
	if err == nil {
		if ownsTx {
			tx.Commit(ctx)
		}
		if openByTable.OrderID == oID {
			return toTableTimerResponse(ctxRow, &openByTable, time.Now()), nil
		}
		// Idempotent: if table has active timer for different order, return success with that timer
		return toTableTimerResponse(ctxRow, &openByTable, time.Now()), nil
	}
	if err != nil && err != pgx.ErrNoRows {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to check active table timer by table: %w", err)
	}

	now := time.Now()
	activeStartedAt := pgtype.Timestamptz{Time: now, Valid: true}
	session, err := q.CreateTableTimeSession(txCtx, pg.CreateTableTimeSessionParams{
		ID:                   uuid.New(),
		OrderID:              oID,
		TableID:              uuid.UUID(ctxRow.TableID.Bytes),
		State:                string(model.TableTimerStateRunning),
		StartedAt:            now,
		ActiveStartedAt:      activeStartedAt,
		AccumulatedActiveSec: 0,
		CreatedBy:            actorUUID,
		UpdatedBy:            actorUUID,
	})
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to create timer session: %w", err)
	}

	if err := q.CreateTableTimeEvent(txCtx, pg.CreateTableTimeEventParams{
		ID:          uuid.New(),
		SessionID:   session.ID,
		OrderID:     session.OrderID,
		TableID:     session.TableID,
		EventType:   "started",
		ActorUserID: actorUUID,
		ActorRole:   &actorRole,
	}); err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to write timer event: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toTableTimerResponse(ctxRow, &session, now), nil
}

func (s *TableTimerS) GetTableTimerState(ctx context.Context, orderID string) (*model.TableTimerResponse, error) {
	oID, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}

	ctxRow, err := s.getTimerContext(ctx, oID)
	if err != nil {
		return nil, err
	}

	var session *pg.TableTimeSessionRow
	var sessionErr error
	err = withTenantRead(ctx, s.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		s, err := q.GetOpenTableTimeSessionByOrderID(tenantCtx, oID)
		if err == nil {
			session = &s
			return nil
		}
		if err != pgx.ErrNoRows {
			sessionErr = fmt.Errorf("failed to get open timer session: %w", err)
			return sessionErr
		}

		// No session found by order, check by table
		openByTable, err := q.GetOpenTableTimeSessionByTableID(tenantCtx, uuid.UUID(ctxRow.TableID.Bytes))
		if err == nil {
			session = &openByTable
			return nil
		}
		if err != pgx.ErrNoRows {
			sessionErr = fmt.Errorf("failed to check active table timer by table: %w", err)
			return sessionErr
		}
		return nil
	})
	if sessionErr != nil {
		return nil, sessionErr
	}
	if err != nil {
		return nil, err
	}

	// No session exists, return empty state
	return toTableTimerResponse(ctxRow, session, time.Now()), nil
}

func (s *TableTimerS) PauseTableTimer(ctx context.Context, orderID string, actorUserID string, actorRole string) (*model.TableTimerResponse, error) {
	oID, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}
	actorUUID, err := parseActorUUID(actorUserID)
	if err != nil {
		return nil, err
	}
	ctxRow, err := s.ensureTimerMutable(ctx, oID)
	if err != nil {
		return nil, err
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	session, err := q.GetOpenTableTimeSessionByOrderIDForUpdate(txCtx, oID)
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to lock timer session: %w", err)
	}
	if session.State != string(model.TableTimerStateRunning) {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("timer is not running")
	}
	if !session.ActiveStartedAt.Valid {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("timer has no active_started_at")
	}

	now := time.Now()
	total := calcTotalActiveSec(session, now)

	updated, err := q.UpdateTableTimeSessionPause(txCtx, pg.UpdateTableTimeSessionPauseParams{
		ID:                   session.ID,
		AccumulatedActiveSec: total,
		UpdatedBy:            actorUUID,
	})
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to pause timer session: %w", err)
	}

	if err := q.CreateTableTimeEvent(txCtx, pg.CreateTableTimeEventParams{
		ID:          uuid.New(),
		SessionID:   updated.ID,
		OrderID:     updated.OrderID,
		TableID:     updated.TableID,
		EventType:   "paused",
		ActorUserID: actorUUID,
		ActorRole:   &actorRole,
	}); err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to write timer pause event: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toTableTimerResponse(ctxRow, &updated, now), nil
}

func (s *TableTimerS) ResumeTableTimer(ctx context.Context, orderID string, actorUserID string, actorRole string) (*model.TableTimerResponse, error) {
	oID, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}
	actorUUID, err := parseActorUUID(actorUserID)
	if err != nil {
		return nil, err
	}
	ctxRow, err := s.ensureTimerMutable(ctx, oID)
	if err != nil {
		return nil, err
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	session, err := q.GetOpenTableTimeSessionByOrderIDForUpdate(txCtx, oID)
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to lock timer session: %w", err)
	}
	if session.State != string(model.TableTimerStatePaused) {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("timer is not paused")
	}

	now := time.Now()
	updated, err := q.UpdateTableTimeSessionResume(txCtx, pg.UpdateTableTimeSessionResumeParams{
		ID:              session.ID,
		ActiveStartedAt: pgtype.Timestamptz{Time: now, Valid: true},
		UpdatedBy:       actorUUID,
	})
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to resume timer session: %w", err)
	}

	if err := q.CreateTableTimeEvent(txCtx, pg.CreateTableTimeEventParams{
		ID:          uuid.New(),
		SessionID:   updated.ID,
		OrderID:     updated.OrderID,
		TableID:     updated.TableID,
		EventType:   "resumed",
		ActorUserID: actorUUID,
		ActorRole:   &actorRole,
	}); err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to write timer resume event: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toTableTimerResponse(ctxRow, &updated, now), nil
}

func (s *TableTimerS) CloseTableTimer(ctx context.Context, orderID string, actorUserID string, actorRole string) (*model.TableTimerResponse, error) {
	oID, err := uuid.Parse(orderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order id: %w", err)
	}
	actorUUID, err := parseActorUUID(actorUserID)
	if err != nil {
		return nil, err
	}
	ctxRow, err := s.ensureTimerMutable(ctx, oID)
	if err != nil {
		return nil, err
	}

	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant queries: %w", err)
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	session, err := q.GetOpenTableTimeSessionByOrderIDForUpdate(txCtx, oID)
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to lock timer session: %w", err)
	}
	if session.State == string(model.TableTimerStateClosed) {
		if ownsTx {
			tx.Commit(ctx)
		}
		return toTableTimerResponse(ctxRow, &session, time.Now()), nil
	}

	now := time.Now()
	total := calcTotalActiveSec(session, now)

	finalAmount := pgtype.Numeric{}
	if amount := calcAmount(total, ctxRow.PricePerHour); amount != nil {
		_ = finalAmount.Scan(*amount)
	}

	updated, err := q.UpdateTableTimeSessionClose(txCtx, pg.UpdateTableTimeSessionCloseParams{
		ID:                   session.ID,
		AccumulatedActiveSec: total,
		EndedAt:              pgtype.Timestamptz{Time: now, Valid: true},
		FinalAmount:          finalAmount,
		UpdatedBy:            actorUUID,
	})
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to close timer session: %w", err)
	}

	if err := q.CreateTableTimeEvent(txCtx, pg.CreateTableTimeEventParams{
		ID:          uuid.New(),
		SessionID:   updated.ID,
		OrderID:     updated.OrderID,
		TableID:     updated.TableID,
		EventType:   "closed",
		ActorUserID: actorUUID,
		ActorRole:   &actorRole,
	}); err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to write timer close event: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toTableTimerResponse(ctxRow, &updated, now), nil
}

func (s *TableTimerS) GetTableTimerByTableID(ctx context.Context, tableID string) (*model.TableTimerResponse, error) {
	tID, err := uuid.Parse(tableID)
	if err != nil {
		return nil, fmt.Errorf("invalid table id: %w", err)
	}

	var session *pg.TableTimeSessionRow
	var sessionErr error
	err = withTenantRead(ctx, s.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		s, err := q.GetOpenTableTimeSessionByTableID(tenantCtx, tID)
		if err == pgx.ErrNoRows {
			return nil
		}
		if err != nil {
			sessionErr = fmt.Errorf("failed to get open timer session by table: %w", err)
			return sessionErr
		}
		session = &s
		return nil
	})
	if sessionErr != nil {
		return nil, sessionErr
	}
	if err != nil {
		return nil, err
	}
	if session == nil {
		return nil, nil
	}

	var ctxRow pg.OrderTimerContextRow
	err = withTenantRead(ctx, s.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		row, err := q.GetOrderTimerContext(tenantCtx, session.OrderID)
		if err != nil {
			return fmt.Errorf("failed to get order timer context: %w", err)
		}
		ctxRow = row
		return nil
	})
	if err != nil {
		return nil, err
	}

	return toTableTimerResponse(ctxRow, session, time.Now()), nil
}
