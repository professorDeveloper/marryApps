package service

import (
	"context"
	"fmt"
	"strconv"
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
	row, err := s.repo.Tenant(ctx).GetOrderTimerContext(ctx, orderID)
	if err != nil {
		return row, err
	}

	if row.OrderType != "dine_in" {
		return row, fmt.Errorf("table timer is only available for dine_in orders")
	}
	if !row.TableID.Valid {
		return row, fmt.Errorf("order has no table")
	}
	if row.TableType != string(model.TableTypeTimeBased) {
		return row, fmt.Errorf("table timer is only available for time_based tables")
	}

	return row, nil
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

	existing, err := s.repo.Tenant(ctx).GetOpenTableTimeSessionByOrderID(ctx, oID)
	if err == nil {
		return toTableTimerResponse(ctxRow, &existing, time.Now()), nil
	}
	if err != pgx.ErrNoRows {
		return nil, fmt.Errorf("failed to get open timer session: %w", err)
	}

	openByTable, err := s.repo.Tenant(ctx).GetOpenTableTimeSessionByTableID(ctx, uuid.UUID(ctxRow.TableID.Bytes))
	if err == nil {
		if openByTable.OrderID == oID {
			return toTableTimerResponse(ctxRow, &openByTable, time.Now()), nil
		}
		return nil, fmt.Errorf("table already has active timer session")
	}
	if err != nil && err != pgx.ErrNoRows {
		return nil, fmt.Errorf("failed to check active table timer by table: %w", err)
	}

	now := time.Now()
	activeStartedAt := pgtype.Timestamptz{Time: now, Valid: true}
	session, err := s.repo.Tenant(ctx).CreateTableTimeSession(ctx, pg.CreateTableTimeSessionParams{
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
		return nil, fmt.Errorf("failed to create timer session: %w", err)
	}

	if err := s.repo.Tenant(ctx).CreateTableTimeEvent(ctx, pg.CreateTableTimeEventParams{
		ID:          uuid.New(),
		SessionID:   session.ID,
		OrderID:     session.OrderID,
		TableID:     session.TableID,
		EventType:   "started",
		ActorUserID: actorUUID,
		ActorRole:   &actorRole,
	}); err != nil {
		return nil, fmt.Errorf("failed to write timer event: %w", err)
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

	session, err := s.repo.Tenant(ctx).GetLatestTableTimeSessionByOrderID(ctx, oID)
	if err == pgx.ErrNoRows {
		return toTableTimerResponse(ctxRow, nil, time.Now()), nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get latest timer session: %w", err)
	}

	return toTableTimerResponse(ctxRow, &session, time.Now()), nil
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

	session, err := s.repo.Tenant(ctx).GetOpenTableTimeSessionByOrderIDForUpdate(ctx, oID)
	if err != nil {
		return nil, fmt.Errorf("failed to lock timer session: %w", err)
	}
	if session.State != string(model.TableTimerStateRunning) {
		return nil, fmt.Errorf("timer is not running")
	}
	if !session.ActiveStartedAt.Valid {
		return nil, fmt.Errorf("timer has no active_started_at")
	}

	now := time.Now()
	total := calcTotalActiveSec(session, now)

	updated, err := s.repo.Tenant(ctx).UpdateTableTimeSessionPause(ctx, pg.UpdateTableTimeSessionPauseParams{
		ID:                   session.ID,
		AccumulatedActiveSec: total,
		UpdatedBy:            actorUUID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to pause timer session: %w", err)
	}

	if err := s.repo.Tenant(ctx).CreateTableTimeEvent(ctx, pg.CreateTableTimeEventParams{
		ID:          uuid.New(),
		SessionID:   updated.ID,
		OrderID:     updated.OrderID,
		TableID:     updated.TableID,
		EventType:   "paused",
		ActorUserID: actorUUID,
		ActorRole:   &actorRole,
	}); err != nil {
		return nil, fmt.Errorf("failed to write timer pause event: %w", err)
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

	session, err := s.repo.Tenant(ctx).GetOpenTableTimeSessionByOrderIDForUpdate(ctx, oID)
	if err != nil {
		return nil, fmt.Errorf("failed to lock timer session: %w", err)
	}
	if session.State != string(model.TableTimerStatePaused) {
		return nil, fmt.Errorf("timer is not paused")
	}

	now := time.Now()
	updated, err := s.repo.Tenant(ctx).UpdateTableTimeSessionResume(ctx, pg.UpdateTableTimeSessionResumeParams{
		ID:              session.ID,
		ActiveStartedAt: pgtype.Timestamptz{Time: now, Valid: true},
		UpdatedBy:       actorUUID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to resume timer session: %w", err)
	}

	if err := s.repo.Tenant(ctx).CreateTableTimeEvent(ctx, pg.CreateTableTimeEventParams{
		ID:          uuid.New(),
		SessionID:   updated.ID,
		OrderID:     updated.OrderID,
		TableID:     updated.TableID,
		EventType:   "resumed",
		ActorUserID: actorUUID,
		ActorRole:   &actorRole,
	}); err != nil {
		return nil, fmt.Errorf("failed to write timer resume event: %w", err)
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

	session, err := s.repo.Tenant(ctx).GetOpenTableTimeSessionByOrderIDForUpdate(ctx, oID)
	if err != nil {
		return nil, fmt.Errorf("failed to lock timer session: %w", err)
	}
	if session.State == string(model.TableTimerStateClosed) {
		return toTableTimerResponse(ctxRow, &session, time.Now()), nil
	}

	now := time.Now()
	total := calcTotalActiveSec(session, now)

	finalAmount := pgtype.Numeric{}
	if amount := calcAmount(total, ctxRow.PricePerHour); amount != nil {
		_ = finalAmount.Scan(*amount)
	}

	updated, err := s.repo.Tenant(ctx).UpdateTableTimeSessionClose(ctx, pg.UpdateTableTimeSessionCloseParams{
		ID:                   session.ID,
		AccumulatedActiveSec: total,
		EndedAt:              pgtype.Timestamptz{Time: now, Valid: true},
		FinalAmount:          finalAmount,
		UpdatedBy:            actorUUID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to close timer session: %w", err)
	}

	if err := s.repo.Tenant(ctx).CreateTableTimeEvent(ctx, pg.CreateTableTimeEventParams{
		ID:          uuid.New(),
		SessionID:   updated.ID,
		OrderID:     updated.OrderID,
		TableID:     updated.TableID,
		EventType:   "closed",
		ActorUserID: actorUUID,
		ActorRole:   &actorRole,
	}); err != nil {
		return nil, fmt.Errorf("failed to write timer close event: %w", err)
	}

	return toTableTimerResponse(ctxRow, &updated, now), nil
}
