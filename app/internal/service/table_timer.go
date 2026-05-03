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

// calcAmountWithTableType calculates the charge for an order session,
// respecting the table type. Simple tables are never charged; only Time-Based
// tables with a valid price_per_hour are charged.
// This ensures billing accuracy after order transfers between table types.
func calcAmountWithTableType(totalSec int64, pricePerHour pgtype.Numeric, tableType string) *string {
	// Simple tables are never charged, regardless of price_per_hour setting
	if tableType == string(model.TableTypeSimple) {
		return nil
	}
	// Only charge time-based tables
	if tableType != string(model.TableTypeTimeBased) {
		return nil
	}
	return calcAmount(totalSec, pricePerHour)
}

func toTableTimerResponse(ctxRow pg.OrderTimerContextRow, session *pg.TableTimeSessionRow, now time.Time) *model.TableTimerResponse {
	return toTableTimerResponseWithHistory(ctxRow, session, now, nil)
}

func toTableTimerResponseWithHistory(ctxRow pg.OrderTimerContextRow, session *pg.TableTimeSessionRow, now time.Time, tableHistory []model.TableSegment) *model.TableTimerResponse {
	resp := &model.TableTimerResponse{
		OrderID:      ctxRow.OrderID.String(),
		TableType:    ctxRow.TableType,
		State:        model.TableTimerStateNone,
		TableHistory: []model.TableSegment{},
	}

	if ctxRow.TableID.Valid {
		tableID := uuid.UUID(ctxRow.TableID.Bytes).String()
		resp.TableID = tableID
		resp.CurrentTableID = tableID
	}

	if ctxRow.PricePerHour.Valid {
		v := numericToStr(ctxRow.PricePerHour)
		resp.PricePerHour = &v
	}

	if session == nil {
		return resp
	}

	resp.SessionID = session.ID.String()
	resp.TableID = session.TableID.String()
	resp.CurrentTableID = session.TableID.String()

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

	resp.CurrentAmount = calcAmountWithTableType(resp.TotalActiveSec, ctxRow.PricePerHour, ctxRow.TableType)

	if session.FinalAmount.Valid {
		v := numericToStr(session.FinalAmount)
		resp.FinalAmount = &v
	}

	resp.IsRunning = session.State == string(model.TableTimerStateRunning)
	resp.IsPaused = session.State == string(model.TableTimerStatePaused)
	resp.IsClosed = session.State == string(model.TableTimerStateClosed)

	if tableHistory != nil {
		resp.TableHistory = tableHistory
	}

	return resp
}

func maxTime(a, b time.Time) time.Time {
	if a.After(b) {
		return a
	}
	return b
}

func minTime(a, b time.Time) time.Time {
	if a.Before(b) {
		return a
	}
	return b
}

func derivePauseIntervalsFromEventRows(
	events []pg.ListTableTimeEventsBySessionIDRow,
	segmentStart time.Time,
	segmentEnd time.Time,
) []model.PauseInterval {
	if !segmentEnd.After(segmentStart) {
		return []model.PauseInterval{}
	}

	var intervals []model.PauseInterval

	var pauseID string
	var pauseStart *time.Time

	for _, event := range events {
		switch event.EventType {
		case "paused":
			if pauseStart == nil {
				t := event.CreatedAt
				pauseStart = &t
				pauseID = event.ID.String()
			}

		case "resumed":
			if pauseStart == nil {
				continue
			}

			start := maxTime(*pauseStart, segmentStart)
			end := minTime(event.CreatedAt, segmentEnd)

			if end.After(start) {
				resumedAt := event.CreatedAt
				intervals = append(intervals, model.PauseInterval{
					ID:        pauseID,
					PausedAt:  start,
					ResumedAt: &resumedAt,
					Seconds:   end.Unix() - start.Unix(),
				})
			}

			pauseStart = nil
			pauseID = ""
		}
	}

	if pauseStart != nil {
		start := maxTime(*pauseStart, segmentStart)
		end := segmentEnd

		if end.After(start) {
			intervals = append(intervals, model.PauseInterval{
				ID:        pauseID,
				PausedAt:  start,
				ResumedAt: nil,
				Seconds:   end.Unix() - start.Unix(),
			})
		}
	}

	return intervals
}

func sumPauseIntervalSeconds(intervals []model.PauseInterval) int64 {
	var total int64
	for _, interval := range intervals {
		if interval.Seconds > 0 {
			total += interval.Seconds
		}
	}
	return total
}

func (s *TableTimerS) calculatePausedSecondsFromEvents(
	ctx context.Context,
	q *pg.Queries,
	sessionID uuid.UUID,
	segmentStart time.Time,
	segmentEnd time.Time,
) (int64, error) {
	events, err := q.ListTableTimeEventsBySessionID(ctx, sessionID)
	if err != nil {
		return 0, fmt.Errorf("failed to list timer events: %w", err)
	}

	intervals := derivePauseIntervalsFromEventRows(events, segmentStart, segmentEnd)
	return sumPauseIntervalSeconds(intervals), nil
}

func buildTableHistory(ctx context.Context, q *pg.Queries, sessionID uuid.UUID, now time.Time) ([]model.TableSegment, error) {
	segments, err := q.ListSegmentsBySessionID(ctx, sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to list session segments: %w", err)
	}

	if len(segments) == 0 {
		return []model.TableSegment{}, nil
	}

	events, err := q.ListTableTimeEventsBySessionID(ctx, sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to list timer events: %w", err)
	}

	history := make([]model.TableSegment, 0, len(segments))

	for _, seg := range segments {
		effectiveEnd := now
		var leftAt *time.Time

		if seg.EndedAt.Valid {
			effectiveEnd = seg.EndedAt.Time
			t := seg.EndedAt.Time
			leftAt = &t
		}

		pauseIntervals := derivePauseIntervalsFromEventRows(events, seg.StartedAt, effectiveEnd)
		if pauseIntervals == nil {
			pauseIntervals = []model.PauseInterval{}
		}
		activeSeconds := seg.ActiveSeconds
		pausedSeconds := seg.PausedSeconds

		if !seg.EndedAt.Valid {
			pausedSeconds = sumPauseIntervalSeconds(pauseIntervals)

			duration := effectiveEnd.Unix() - seg.StartedAt.Unix()
			activeSeconds = duration - pausedSeconds
			if activeSeconds < 0 {
				activeSeconds = 0
			}
		}

		var movedFromTableID *string
		if seg.MovedFromTableID.Valid {
			v := uuid.UUID(seg.MovedFromTableID.Bytes).String()
			movedFromTableID = &v
		}

		var movedToTableID *string
		if seg.MovedToTableID.Valid {
			v := uuid.UUID(seg.MovedToTableID.Bytes).String()
			movedToTableID = &v
		}

		history = append(history, model.TableSegment{
			SegmentID:        seg.ID.String(),
			TableID:          seg.TableID.String(),
			EnteredAt:        seg.StartedAt,
			LeftAt:           leftAt,
			ActiveSeconds:    activeSeconds,
			PausedSeconds:    pausedSeconds,
			MoveInReason:     seg.MoveInReason,
			MoveOutReason:    seg.MoveOutReason,
			MovedFromTableID: movedFromTableID,
			MovedToTableID:   movedToTableID,
			PauseIntervals:   pauseIntervals,
		})
	}

	return history, nil
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
		TableType:            ctxRow.TableType,
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

	// Create initial segment for the session
	_, err = q.CreateTableTimeSessionSegment(txCtx, pg.CreateTableTimeSessionSegmentParams{
		ID:               uuid.New(),
		SessionID:        session.ID,
		OrderID:          session.OrderID,
		TableID:          session.TableID,
		StartedAt:        now,
		MoveInReason:     "start",
		MovedFromTableID: pgtype.UUID{Valid: false},
	})
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to create initial session segment: %w", err)
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
	var tableHistory []model.TableSegment
	err = withTenantRead(ctx, s.repo, func(tenantCtx context.Context, q *pg.Queries) error {
		s, err := q.GetOpenTableTimeSessionByOrderID(tenantCtx, oID)
		if err == nil {
			session = &s
			// Build table history for the session
			history, err := buildTableHistory(tenantCtx, q, session.ID, time.Now())
			if err != nil {
				return fmt.Errorf("failed to build table history: %w", err)
			}
			tableHistory = history
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
			// Build table history for the session
			history, err := buildTableHistory(tenantCtx, q, session.ID, time.Now())
			if err != nil {
				return fmt.Errorf("failed to build table history: %w", err)
			}
			tableHistory = history
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
	return toTableTimerResponseWithHistory(ctxRow, session, time.Now(), tableHistory), nil
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

	historyNow := time.Now()

	tableHistory, err := buildTableHistory(txCtx, q, updated.ID, historyNow)
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to build table history: %w", err)
	}

	resp := toTableTimerResponseWithHistory(ctxRow, &updated, historyNow, tableHistory)

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return resp, nil
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

	historyNow := time.Now()

	tableHistory, err := buildTableHistory(txCtx, q, updated.ID, historyNow)
	if err != nil {
		if ownsTx {
			tx.Rollback(ctx)
		}
		return nil, fmt.Errorf("failed to build table history: %w", err)
	}

	resp := toTableTimerResponseWithHistory(ctxRow, &updated, historyNow, tableHistory)

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return resp, nil
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

	// Get active segment to close it
	activeSegment, err := q.GetActiveSegmentBySessionID(txCtx, session.ID)
	if err == nil {
		// Calculate paused seconds from pause/resume events in segment time range
		pausedSeconds, err := s.calculatePausedSecondsFromEvents(txCtx, q, session.ID, activeSegment.StartedAt, now)
		if err != nil {
			if ownsTx {
				tx.Rollback(ctx)
			}
			return nil, fmt.Errorf("failed to calculate paused seconds from events: %w", err)
		}

		// Calculate active seconds for the segment
		segmentDuration := now.Unix() - activeSegment.StartedAt.Unix()
		activeSeconds := segmentDuration - pausedSeconds
		if activeSeconds < 0 {
			activeSeconds = 0
		}

		// Close the segment
		_, err = q.UpdateTableTimeSessionSegmentClose(txCtx, pg.UpdateTableTimeSessionSegmentCloseParams{
			ID:             activeSegment.ID,
			EndedAt:        pgtype.Timestamptz{Time: now, Valid: true},
			ActiveSeconds:  activeSeconds,
			PausedSeconds:  pausedSeconds,
			MoveOutReason:  "close",
			MovedToTableID: pgtype.UUID{Valid: false},
		})
		if err != nil {
			if ownsTx {
				tx.Rollback(ctx)
			}
			return nil, fmt.Errorf("failed to close segment: %w", err)
		}
	}
	// If no segment exists (backward compatibility), just close the session

	finalAmount := pgtype.Numeric{}
	if amount := calcAmountWithTableType(total, ctxRow.PricePerHour, ctxRow.TableType); amount != nil {
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

func (s *TableTimerS) TransferTableTimer(ctx context.Context, sessionID string, toTableID string, reason string, actorUserID string, actorRole string) (*model.TableTimerResponse, error) {
	sID, err := uuid.Parse(sessionID)
	if err != nil {
		return nil, fmt.Errorf("invalid session id: %w", err)
	}

	tID, err := uuid.Parse(toTableID)
	if err != nil {
		return nil, fmt.Errorf("invalid target table id: %w", err)
	}

	actorUUID, err := parseActorUUID(actorUserID)
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

	session, err := q.GetOpenTableTimeSessionByIDForUpdate(txCtx, sID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("active timer session not found")
		}
		return nil, fmt.Errorf("failed to lock timer session: %w", err)
	}

	if session.State != string(model.TableTimerStateRunning) {
		return nil, fmt.Errorf("session must be running to transfer")
	}

	activeSegment, err := q.GetActiveSegmentBySessionID(txCtx, session.ID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("active segment not found")
		}
		return nil, fmt.Errorf("failed to lock active segment: %w", err)
	}

	oldTableID := activeSegment.TableID

	if oldTableID == tID {
		return nil, fmt.Errorf("target table is the same as current table")
	}

	targetTable, err := q.GetCafeTableByID(txCtx, tID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("target table not found")
		}
		return nil, fmt.Errorf("failed to get target table: %w", err)
	}

	if targetTable.TableType != string(model.TableTypeTimeBased) {
		return nil, fmt.Errorf("target table must be time_based")
	}

	if string(targetTable.Status) != "free" {
		return nil, fmt.Errorf("target table is already busy")
	}

	targetBusySession, err := q.GetOpenTableTimeSessionByTableID(txCtx, tID)
	if err == nil && targetBusySession.ID != session.ID {
		return nil, fmt.Errorf("target table is already busy")
	}
	if err != nil && err != pgx.ErrNoRows {
		return nil, fmt.Errorf("failed to check target table session: %w", err)
	}

	now := time.Now()

	pausedSeconds, err := s.calculatePausedSecondsFromEvents(txCtx, q, session.ID, activeSegment.StartedAt, now)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate paused seconds: %w", err)
	}

	segmentDuration := now.Unix() - activeSegment.StartedAt.Unix()
	activeSeconds := segmentDuration - pausedSeconds
	if activeSeconds < 0 {
		activeSeconds = 0
	}

	_, err = q.UpdateTableTimeSessionSegmentClose(txCtx, pg.UpdateTableTimeSessionSegmentCloseParams{
		ID:             activeSegment.ID,
		EndedAt:        pgtype.Timestamptz{Time: now, Valid: true},
		ActiveSeconds:  activeSeconds,
		PausedSeconds:  pausedSeconds,
		MoveOutReason:  "transfer",
		MovedToTableID: pgtype.UUID{Bytes: tID, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to close current segment: %w", err)
	}

	_, err = q.CreateTableTimeSessionSegment(txCtx, pg.CreateTableTimeSessionSegmentParams{
		ID:               uuid.New(),
		SessionID:        session.ID,
		OrderID:          session.OrderID,
		TableID:          tID,
		StartedAt:        now,
		MoveInReason:     "transfer",
		MovedFromTableID: pgtype.UUID{Bytes: oldTableID, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create new segment: %w", err)
	}

	updatedSession, err := q.UpdateTableTimeSessionTableIDForTransfer(txCtx, pg.UpdateTableTimeSessionTableIDForTransferParams{
		ID:        session.ID,
		TableID:   tID,
		UpdatedBy: actorUUID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update session table_id: %w", err)
	}

	if _, err := q.UpdateOrderTableIDForTimerTransfer(txCtx, session.OrderID, tID); err != nil {
		return nil, fmt.Errorf("failed to update order table_id: %w", err)
	}

	if _, err := q.SetTableFree(txCtx, oldTableID); err != nil {
		return nil, fmt.Errorf("failed to set old table free: %w", err)
	}

	if _, err := q.SetTableBusy(txCtx, tID); err != nil {
		return nil, fmt.Errorf("failed to set new table busy: %w", err)
	}

	ctxRow, err := q.GetOrderTimerContext(txCtx, updatedSession.OrderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get updated timer context: %w", err)
	}

	tableHistory, err := buildTableHistory(txCtx, q, updatedSession.ID, now)
	if err != nil {
		return nil, fmt.Errorf("failed to build table history: %w", err)
	}

	resp := toTableTimerResponseWithHistory(ctxRow, &updatedSession, now, tableHistory)

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	_ = reason

	return resp, nil
}

func (s *TableTimerS) GetTableTimerByTableID(ctx context.Context, tableID string) (*model.TableTimerResponse, error) {
	tID, err := uuid.Parse(tableID)
	if err != nil {
		return nil, fmt.Errorf("invalid table id: %w", err)
	}

	var session *pg.TableTimeSessionRow
	var sessionErr error
	var tableHistory []model.TableSegment
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
		// Build table history for the session
		history, err := buildTableHistory(tenantCtx, q, session.ID, time.Now())
		if err != nil {
			return fmt.Errorf("failed to build table history: %w", err)
		}
		tableHistory = history
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

	return toTableTimerResponseWithHistory(ctxRow, session, time.Now(), tableHistory), nil
}
