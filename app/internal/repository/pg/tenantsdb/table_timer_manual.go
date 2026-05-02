package pg

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type OrderTimerContextRow struct {
	OrderID      uuid.UUID       `json:"order_id"`
	OrderType    string          `json:"order_type"`
	OrderStatus  NullOrderStatus `json:"order_status"`
	TableID      pgtype.UUID     `json:"table_id"`
	TableType    string          `json:"table_type"`
	PricePerHour pgtype.Numeric  `json:"price_per_hour"`
}

const getOrderTimerContext = `
SELECT
    o.id,
    o.order_type,
    o.status,
    o.table_id,
    COALESCE(ct.table_type, 'simple') AS table_type,
    ct.price_per_hour
FROM orders o
LEFT JOIN cafe_tables ct
  ON ct.id = o.table_id
 AND COALESCE(ct.deleted_at, 0) = 0
WHERE o.id = $1
  AND COALESCE(o.deleted_at, 0) = 0
LIMIT 1
`

func (q *Queries) GetOrderTimerContext(ctx context.Context, orderID uuid.UUID) (OrderTimerContextRow, error) {
	row := q.db.QueryRow(ctx, getOrderTimerContext, orderID)
	var i OrderTimerContextRow
	err := row.Scan(
		&i.OrderID,
		&i.OrderType,
		&i.OrderStatus,
		&i.TableID,
		&i.TableType,
		&i.PricePerHour,
	)
	return i, err
}

type TableTimeSessionRow struct {
	ID                   uuid.UUID          `json:"id"`
	OrderID              uuid.UUID          `json:"order_id"`
	TableID              uuid.UUID          `json:"table_id"`
	State                string             `json:"state"`
	TableType            string             `json:"table_type"`
	StartedAt            time.Time          `json:"started_at"`
	ActiveStartedAt      pgtype.Timestamptz `json:"active_started_at"`
	AccumulatedActiveSec int64              `json:"accumulated_active_sec"`
	EndedAt              pgtype.Timestamptz `json:"ended_at"`
	FinalAmount          pgtype.Numeric     `json:"final_amount"`
	CreatedBy            pgtype.UUID        `json:"created_by"`
	UpdatedBy            pgtype.UUID        `json:"updated_by"`
	CreatedAt            time.Time          `json:"created_at"`
	UpdatedAt            time.Time          `json:"updated_at"`
}

const getOpenTableTimeSessionByOrderID = `
SELECT
    id,
    order_id,
    table_id,
    state,
    started_at,
    active_started_at,
    accumulated_active_sec,
    ended_at,
    final_amount,
    created_by,
    updated_by,
    created_at,
    updated_at
FROM table_time_sessions
WHERE order_id = $1
  AND COALESCE(deleted_at, 0) = 0
  AND ended_at IS NULL
LIMIT 1
`

func (q *Queries) GetOpenTableTimeSessionByOrderID(ctx context.Context, orderID uuid.UUID) (TableTimeSessionRow, error) {
	row := q.db.QueryRow(ctx, getOpenTableTimeSessionByOrderID, orderID)
	var i TableTimeSessionRow
	err := row.Scan(
		&i.ID,
		&i.OrderID,
		&i.TableID,
		&i.State,
		&i.StartedAt,
		&i.ActiveStartedAt,
		&i.AccumulatedActiveSec,
		&i.EndedAt,
		&i.FinalAmount,
		&i.CreatedBy,
		&i.UpdatedBy,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const getOpenTableTimeSessionByOrderIDForUpdate = `
SELECT
    id,
    order_id,
    table_id,
    state,
    started_at,
    active_started_at,
    accumulated_active_sec,
    ended_at,
    final_amount,
    created_by,
    updated_by,
    created_at,
    updated_at
FROM table_time_sessions
WHERE order_id = $1
  AND COALESCE(deleted_at, 0) = 0
  AND ended_at IS NULL
LIMIT 1
FOR UPDATE
`

func (q *Queries) GetOpenTableTimeSessionByOrderIDForUpdate(ctx context.Context, orderID uuid.UUID) (TableTimeSessionRow, error) {
	row := q.db.QueryRow(ctx, getOpenTableTimeSessionByOrderIDForUpdate, orderID)
	var i TableTimeSessionRow
	err := row.Scan(
		&i.ID,
		&i.OrderID,
		&i.TableID,
		&i.State,
		&i.StartedAt,
		&i.ActiveStartedAt,
		&i.AccumulatedActiveSec,
		&i.EndedAt,
		&i.FinalAmount,
		&i.CreatedBy,
		&i.UpdatedBy,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

type CreateTableTimeSessionParams struct {
	ID                   uuid.UUID
	OrderID              uuid.UUID
	TableID              uuid.UUID
	State                string
	TableType            string
	StartedAt            time.Time
	ActiveStartedAt      pgtype.Timestamptz
	AccumulatedActiveSec int64
	CreatedBy            pgtype.UUID
	UpdatedBy            pgtype.UUID
}

const createTableTimeSession = `
INSERT INTO table_time_sessions (
    id,
    order_id,
    table_id,
    state,
    table_type,
    started_at,
    active_started_at,
    accumulated_active_sec,
    created_by,
    updated_by
)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
RETURNING
    id,
    order_id,
    table_id,
    state,
    table_type,
    started_at,
    active_started_at,
    accumulated_active_sec,
    ended_at,
    final_amount,
    created_by,
    updated_by,
    created_at,
    updated_at
`

func (q *Queries) CreateTableTimeSession(ctx context.Context, arg CreateTableTimeSessionParams) (TableTimeSessionRow, error) {
	row := q.db.QueryRow(ctx, createTableTimeSession,
		arg.ID,
		arg.OrderID,
		arg.TableID,
		arg.State,
		arg.TableType,
		arg.StartedAt,
		arg.ActiveStartedAt,
		arg.AccumulatedActiveSec,
		arg.CreatedBy,
		arg.UpdatedBy,
	)
	var i TableTimeSessionRow
	err := row.Scan(
		&i.ID,
		&i.OrderID,
		&i.TableID,
		&i.State,
		&i.TableType,
		&i.StartedAt,
		&i.ActiveStartedAt,
		&i.AccumulatedActiveSec,
		&i.EndedAt,
		&i.FinalAmount,
		&i.CreatedBy,
		&i.UpdatedBy,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

type UpdateTableTimeSessionPauseParams struct {
	ID                   uuid.UUID
	AccumulatedActiveSec int64
	UpdatedBy            pgtype.UUID
}

const updateTableTimeSessionPause = `
UPDATE table_time_sessions
SET
    state = 'paused',
    active_started_at = NULL,
    accumulated_active_sec = $2,
    updated_by = $3
WHERE id = $1
RETURNING
    id,
    order_id,
    table_id,
    state,
    started_at,
    active_started_at,
    accumulated_active_sec,
    ended_at,
    final_amount,
    created_by,
    updated_by,
    created_at,
    updated_at
`

func (q *Queries) UpdateTableTimeSessionPause(ctx context.Context, arg UpdateTableTimeSessionPauseParams) (TableTimeSessionRow, error) {
	row := q.db.QueryRow(ctx, updateTableTimeSessionPause, arg.ID, arg.AccumulatedActiveSec, arg.UpdatedBy)
	var i TableTimeSessionRow
	err := row.Scan(
		&i.ID,
		&i.OrderID,
		&i.TableID,
		&i.State,
		&i.StartedAt,
		&i.ActiveStartedAt,
		&i.AccumulatedActiveSec,
		&i.EndedAt,
		&i.FinalAmount,
		&i.CreatedBy,
		&i.UpdatedBy,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

type UpdateTableTimeSessionResumeParams struct {
	ID              uuid.UUID
	ActiveStartedAt pgtype.Timestamptz
	UpdatedBy       pgtype.UUID
}

const updateTableTimeSessionResume = `
UPDATE table_time_sessions
SET
    state = 'running',
    active_started_at = $2,
    updated_by = $3
WHERE id = $1
RETURNING
    id,
    order_id,
    table_id,
    state,
    started_at,
    active_started_at,
    accumulated_active_sec,
    ended_at,
    final_amount,
    created_by,
    updated_by,
    created_at,
    updated_at
`

func (q *Queries) UpdateTableTimeSessionResume(ctx context.Context, arg UpdateTableTimeSessionResumeParams) (TableTimeSessionRow, error) {
	row := q.db.QueryRow(ctx, updateTableTimeSessionResume, arg.ID, arg.ActiveStartedAt, arg.UpdatedBy)
	var i TableTimeSessionRow
	err := row.Scan(
		&i.ID,
		&i.OrderID,
		&i.TableID,
		&i.State,
		&i.StartedAt,
		&i.ActiveStartedAt,
		&i.AccumulatedActiveSec,
		&i.EndedAt,
		&i.FinalAmount,
		&i.CreatedBy,
		&i.UpdatedBy,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

type UpdateTableTimeSessionCloseParams struct {
	ID                   uuid.UUID
	AccumulatedActiveSec int64
	EndedAt              pgtype.Timestamptz
	FinalAmount          pgtype.Numeric
	UpdatedBy            pgtype.UUID
}

const updateTableTimeSessionClose = `
UPDATE table_time_sessions
SET
    state = 'closed',
    active_started_at = NULL,
    accumulated_active_sec = $2,
    ended_at = $3,
    final_amount = $4,
    updated_by = $5
WHERE id = $1
RETURNING
    id,
    order_id,
    table_id,
    state,
    started_at,
    active_started_at,
    accumulated_active_sec,
    ended_at,
    final_amount,
    created_by,
    updated_by,
    created_at,
    updated_at
`

func (q *Queries) UpdateTableTimeSessionClose(ctx context.Context, arg UpdateTableTimeSessionCloseParams) (TableTimeSessionRow, error) {
	row := q.db.QueryRow(ctx, updateTableTimeSessionClose, arg.ID, arg.AccumulatedActiveSec, arg.EndedAt, arg.FinalAmount, arg.UpdatedBy)
	var i TableTimeSessionRow
	err := row.Scan(
		&i.ID,
		&i.OrderID,
		&i.TableID,
		&i.State,
		&i.StartedAt,
		&i.ActiveStartedAt,
		&i.AccumulatedActiveSec,
		&i.EndedAt,
		&i.FinalAmount,
		&i.CreatedBy,
		&i.UpdatedBy,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

type CreateTableTimeEventParams struct {
	ID          uuid.UUID
	SessionID   uuid.UUID
	OrderID     uuid.UUID
	TableID     uuid.UUID
	EventType   string
	ActorUserID pgtype.UUID
	ActorRole   *string
	Comment     *string
}

const createTableTimeEvent = `
INSERT INTO table_time_events (
    id,
    session_id,
    order_id,
    table_id,
    event_type,
    actor_user_id,
    actor_role,
    comment
)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
`

func (q *Queries) CreateTableTimeEvent(ctx context.Context, arg CreateTableTimeEventParams) error {
	_, err := q.db.Exec(ctx, createTableTimeEvent,
		arg.ID,
		arg.SessionID,
		arg.OrderID,
		arg.TableID,
		arg.EventType,
		arg.ActorUserID,
		arg.ActorRole,
		arg.Comment,
	)
	return err
}

const getOpenTableTimeSessionByTableID = `
SELECT
    id,
    order_id,
    table_id,
    state,
    started_at,
    active_started_at,
    accumulated_active_sec,
    ended_at,
    final_amount,
    created_by,
    updated_by,
    created_at,
    updated_at
FROM table_time_sessions
WHERE table_id = $1
  AND COALESCE(deleted_at, 0) = 0
  AND ended_at IS NULL
LIMIT 1
`

type ListTableTimeEventsBySessionIDRow struct {
	ID          uuid.UUID   `json:"id"`
	SessionID   uuid.UUID   `json:"session_id"`
	OrderID     uuid.UUID   `json:"order_id"`
	TableID     uuid.UUID   `json:"table_id"`
	EventType   string      `json:"event_type"`
	ActorUserID pgtype.UUID `json:"actor_user_id"`
	ActorRole   *string     `json:"actor_role"`
	Comment     *string     `json:"comment"`
	CreatedAt   time.Time   `json:"created_at"`
}

const listTableTimeEventsBySessionID = `
SELECT
    id,
    session_id,
    order_id,
    table_id,
    event_type,
    actor_user_id,
    actor_role,
    comment,
    created_at
FROM table_time_events
WHERE session_id = $1
  AND COALESCE(deleted_at, 0) = 0
ORDER BY created_at ASC
`

func (q *Queries) ListTableTimeEventsBySessionID(ctx context.Context, sessionID uuid.UUID) ([]ListTableTimeEventsBySessionIDRow, error) {
	rows, err := q.db.Query(ctx, listTableTimeEventsBySessionID, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []ListTableTimeEventsBySessionIDRow
	for rows.Next() {
		var i ListTableTimeEventsBySessionIDRow
		if err := rows.Scan(
			&i.ID,
			&i.SessionID,
			&i.OrderID,
			&i.TableID,
			&i.EventType,
			&i.ActorUserID,
			&i.ActorRole,
			&i.Comment,
			&i.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func (q *Queries) GetOpenTableTimeSessionByTableID(ctx context.Context, tableID uuid.UUID) (TableTimeSessionRow, error) {
	row := q.db.QueryRow(ctx, getOpenTableTimeSessionByTableID, tableID)
	var i TableTimeSessionRow
	err := row.Scan(
		&i.ID,
		&i.OrderID,
		&i.TableID,
		&i.State,
		&i.StartedAt,
		&i.ActiveStartedAt,
		&i.AccumulatedActiveSec,
		&i.EndedAt,
		&i.FinalAmount,
		&i.CreatedBy,
		&i.UpdatedBy,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const getLatestTableTimeSessionByOrderID = `
SELECT
    id,
    order_id,
    table_id,
    state,
    started_at,
    active_started_at,
    accumulated_active_sec,
    ended_at,
    final_amount,
    created_by,
    updated_by,
    created_at,
    updated_at
FROM table_time_sessions
WHERE order_id = $1
  AND COALESCE(deleted_at, 0) = 0
ORDER BY created_at DESC
LIMIT 1
`

func (q *Queries) GetLatestTableTimeSessionByOrderID(ctx context.Context, orderID uuid.UUID) (TableTimeSessionRow, error) {
	row := q.db.QueryRow(ctx, getLatestTableTimeSessionByOrderID, orderID)
	var i TableTimeSessionRow
	err := row.Scan(
		&i.ID,
		&i.OrderID,
		&i.TableID,
		&i.State,
		&i.StartedAt,
		&i.ActiveStartedAt,
		&i.AccumulatedActiveSec,
		&i.EndedAt,
		&i.FinalAmount,
		&i.CreatedBy,
		&i.UpdatedBy,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

// Session Segment queries

type TableTimeSessionSegmentRow struct {
	ID               uuid.UUID          `json:"id"`
	SessionID        uuid.UUID          `json:"session_id"`
	OrderID          uuid.UUID          `json:"order_id"`
	TableID          uuid.UUID          `json:"table_id"`
	StartedAt        time.Time          `json:"started_at"`
	EndedAt          pgtype.Timestamptz `json:"ended_at"`
	ActiveSeconds    int64              `json:"active_seconds"`
	PausedSeconds    int64              `json:"paused_seconds"`
	MoveInReason     string             `json:"move_in_reason"`
	MoveOutReason    *string            `json:"move_out_reason"`
	MovedFromTableID pgtype.UUID        `json:"moved_from_table_id"`
	MovedToTableID   pgtype.UUID        `json:"moved_to_table_id"`
	CreatedAt        time.Time          `json:"created_at"`
}

type CreateTableTimeSessionSegmentParams struct {
	ID               uuid.UUID
	SessionID        uuid.UUID
	OrderID          uuid.UUID
	TableID          uuid.UUID
	StartedAt        time.Time
	MoveInReason     string
	MovedFromTableID pgtype.UUID
}

const createTableTimeSessionSegment = `
INSERT INTO table_time_session_segments (
    id,
    session_id,
    order_id,
    table_id,
    started_at,
    move_in_reason,
    moved_from_table_id
)
VALUES ($1,$2,$3,$4,$5,$6,$7)
RETURNING
    id,
    session_id,
    order_id,
    table_id,
    started_at,
    ended_at,
    active_seconds,
    paused_seconds,
    move_in_reason,
    move_out_reason,
    moved_from_table_id,
    moved_to_table_id,
    created_at
`

func (q *Queries) CreateTableTimeSessionSegment(ctx context.Context, arg CreateTableTimeSessionSegmentParams) (TableTimeSessionSegmentRow, error) {
	row := q.db.QueryRow(ctx, createTableTimeSessionSegment,
		arg.ID,
		arg.SessionID,
		arg.OrderID,
		arg.TableID,
		arg.StartedAt,
		arg.MoveInReason,
		arg.MovedFromTableID,
	)
	var i TableTimeSessionSegmentRow
	err := row.Scan(
		&i.ID,
		&i.SessionID,
		&i.OrderID,
		&i.TableID,
		&i.StartedAt,
		&i.EndedAt,
		&i.ActiveSeconds,
		&i.PausedSeconds,
		&i.MoveInReason,
		&i.MoveOutReason,
		&i.MovedFromTableID,
		&i.MovedToTableID,
		&i.CreatedAt,
	)
	return i, err
}

const getActiveSegmentBySessionID = `
SELECT
    id,
    session_id,
    order_id,
    table_id,
    started_at,
    ended_at,
    active_seconds,
    paused_seconds,
    move_in_reason,
    move_out_reason,
    moved_from_table_id,
    moved_to_table_id,
    created_at
FROM table_time_session_segments
WHERE session_id = $1
  AND COALESCE(deleted_at, 0) = 0
  AND ended_at IS NULL
LIMIT 1
FOR UPDATE
`

func (q *Queries) GetActiveSegmentBySessionID(ctx context.Context, sessionID uuid.UUID) (TableTimeSessionSegmentRow, error) {
	row := q.db.QueryRow(ctx, getActiveSegmentBySessionID, sessionID)
	var i TableTimeSessionSegmentRow
	err := row.Scan(
		&i.ID,
		&i.SessionID,
		&i.OrderID,
		&i.TableID,
		&i.StartedAt,
		&i.EndedAt,
		&i.ActiveSeconds,
		&i.PausedSeconds,
		&i.MoveInReason,
		&i.MoveOutReason,
		&i.MovedFromTableID,
		&i.MovedToTableID,
		&i.CreatedAt,
	)
	return i, err
}

type UpdateTableTimeSessionSegmentCloseParams struct {
	ID             uuid.UUID
	EndedAt        pgtype.Timestamptz
	ActiveSeconds  int64
	PausedSeconds  int64
	MoveOutReason  string
	MovedToTableID pgtype.UUID
}

const updateTableTimeSessionSegmentClose = `
UPDATE table_time_session_segments
SET
    ended_at = $2,
    active_seconds = $3,
    paused_seconds = $4,
    move_out_reason = $5,
    moved_to_table_id = $6
WHERE id = $1
RETURNING
    id,
    session_id,
    order_id,
    table_id,
    started_at,
    ended_at,
    active_seconds,
    paused_seconds,
    move_in_reason,
    move_out_reason,
    moved_from_table_id,
    moved_to_table_id,
    created_at
`

func (q *Queries) UpdateTableTimeSessionSegmentClose(ctx context.Context, arg UpdateTableTimeSessionSegmentCloseParams) (TableTimeSessionSegmentRow, error) {
	row := q.db.QueryRow(ctx, updateTableTimeSessionSegmentClose,
		arg.ID,
		arg.EndedAt,
		arg.ActiveSeconds,
		arg.PausedSeconds,
		arg.MoveOutReason,
		arg.MovedToTableID,
	)
	var i TableTimeSessionSegmentRow
	err := row.Scan(
		&i.ID,
		&i.SessionID,
		&i.OrderID,
		&i.TableID,
		&i.StartedAt,
		&i.EndedAt,
		&i.ActiveSeconds,
		&i.PausedSeconds,
		&i.MoveInReason,
		&i.MoveOutReason,
		&i.MovedFromTableID,
		&i.MovedToTableID,
		&i.CreatedAt,
	)
	return i, err
}

const listSegmentsBySessionID = `
SELECT
    id,
    session_id,
    order_id,
    table_id,
    started_at,
    ended_at,
    active_seconds,
    paused_seconds,
    move_in_reason,
    move_out_reason,
    moved_from_table_id,
    moved_to_table_id,
    created_at
FROM table_time_session_segments
WHERE session_id = $1
  AND COALESCE(deleted_at, 0) = 0
ORDER BY started_at ASC
`

func (q *Queries) ListSegmentsBySessionID(ctx context.Context, sessionID uuid.UUID) ([]TableTimeSessionSegmentRow, error) {
	rows, err := q.db.Query(ctx, listSegmentsBySessionID, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []TableTimeSessionSegmentRow
	for rows.Next() {
		var i TableTimeSessionSegmentRow
		if err := rows.Scan(
			&i.ID,
			&i.SessionID,
			&i.OrderID,
			&i.TableID,
			&i.StartedAt,
			&i.EndedAt,
			&i.ActiveSeconds,
			&i.PausedSeconds,
			&i.MoveInReason,
			&i.MoveOutReason,
			&i.MovedFromTableID,
			&i.MovedToTableID,
			&i.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

const getOpenTableTimeSessionByIDForUpdate = `
SELECT
    id,
    order_id,
    table_id,
    state,
    started_at,
    active_started_at,
    accumulated_active_sec,
    ended_at,
    final_amount,
    created_by,
    updated_by,
    created_at,
    updated_at
FROM table_time_sessions
WHERE id = $1
  AND COALESCE(deleted_at, 0) = 0
  AND ended_at IS NULL
LIMIT 1
FOR UPDATE
`

func (q *Queries) GetOpenTableTimeSessionByIDForUpdate(ctx context.Context, sessionID uuid.UUID) (TableTimeSessionRow, error) {
	row := q.db.QueryRow(ctx, getOpenTableTimeSessionByIDForUpdate, sessionID)
	var i TableTimeSessionRow
	err := row.Scan(
		&i.ID,
		&i.OrderID,
		&i.TableID,
		&i.State,
		&i.StartedAt,
		&i.ActiveStartedAt,
		&i.AccumulatedActiveSec,
		&i.EndedAt,
		&i.FinalAmount,
		&i.CreatedBy,
		&i.UpdatedBy,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

type UpdateTableTimeSessionTableIDForTransferParams struct {
	ID        uuid.UUID
	TableID   uuid.UUID
	UpdatedBy pgtype.UUID
}

const updateTableTimeSessionTableIDForTransfer = `
UPDATE table_time_sessions
SET
    table_id = $2,
    updated_by = $3,
    updated_at = NOW()
WHERE id = $1
  AND COALESCE(deleted_at, 0) = 0
  AND ended_at IS NULL
RETURNING
    id,
    order_id,
    table_id,
    state,
    started_at,
    active_started_at,
    accumulated_active_sec,
    ended_at,
    final_amount,
    created_by,
    updated_by,
    created_at,
    updated_at
`

func (q *Queries) UpdateTableTimeSessionTableIDForTransfer(ctx context.Context, arg UpdateTableTimeSessionTableIDForTransferParams) (TableTimeSessionRow, error) {
	row := q.db.QueryRow(ctx, updateTableTimeSessionTableIDForTransfer, arg.ID, arg.TableID, arg.UpdatedBy)
	var i TableTimeSessionRow
	err := row.Scan(
		&i.ID,
		&i.OrderID,
		&i.TableID,
		&i.State,
		&i.StartedAt,
		&i.ActiveStartedAt,
		&i.AccumulatedActiveSec,
		&i.EndedAt,
		&i.FinalAmount,
		&i.CreatedBy,
		&i.UpdatedBy,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const updateOrderTableIDForTimerTransfer = `
UPDATE orders
SET
    table_id = $2,
    updated_at = NOW()
WHERE id = $1
  AND COALESCE(deleted_at, 0) = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
RETURNING id
`

func (q *Queries) UpdateOrderTableIDForTimerTransfer(ctx context.Context, orderID uuid.UUID, tableID uuid.UUID) (uuid.UUID, error) {
	row := q.db.QueryRow(ctx, updateOrderTableIDForTimerTransfer, orderID, tableID)
	var id uuid.UUID
	err := row.Scan(&id)
	return id, err
}
