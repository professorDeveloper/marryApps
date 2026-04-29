package model

import "time"

type TableTimerState string

const (
	TableTimerStateRunning TableTimerState = "running"
	TableTimerStatePaused  TableTimerState = "paused"
	TableTimerStateClosed  TableTimerState = "closed"
	TableTimerStateNone    TableTimerState = "none"
)

type PauseInterval struct {
	ID        string     `json:"id"`
	PausedAt  time.Time  `json:"paused_at"`
	ResumedAt *time.Time `json:"resumed_at,omitempty"`
	Seconds   int64      `json:"seconds"`
}

type TableSegment struct {
	SegmentID        string          `json:"segment_id"`
	TableID          string          `json:"table_id"`
	EnteredAt        time.Time       `json:"entered_at"`
	LeftAt           *time.Time      `json:"left_at,omitempty"`
	ActiveSeconds    int64           `json:"active_seconds"`
	PausedSeconds    int64           `json:"paused_seconds"`
	MoveInReason     string          `json:"move_in_reason"`
	MoveOutReason    *string         `json:"move_out_reason,omitempty"`
	MovedFromTableID *string         `json:"moved_from_table_id,omitempty"`
	MovedToTableID   *string         `json:"moved_to_table_id,omitempty"`
	PauseIntervals   []PauseInterval `json:"pause_intervals"`
}

type TableTimerResponse struct {
	SessionID            string          `json:"session_id,omitempty"`
	OrderID              string          `json:"order_id"`
	TableID              string          `json:"table_id"`
	CurrentTableID       string          `json:"current_table_id,omitempty"`
	TableType            string          `json:"table_type"`
	State                TableTimerState `json:"state"`
	StartedAt            *time.Time      `json:"started_at,omitempty"`
	ActiveStartedAt      *time.Time      `json:"active_started_at,omitempty"`
	EndedAt              *time.Time      `json:"ended_at,omitempty"`
	PricePerHour         *string         `json:"price_per_hour,omitempty"`
	AccumulatedActiveSec int64           `json:"accumulated_active_sec"`
	CurrentActiveSec     int64           `json:"current_active_sec"`
	TotalActiveSec       int64           `json:"total_active_sec"`
	CurrentAmount        *string         `json:"current_amount,omitempty"`
	FinalAmount          *string         `json:"final_amount,omitempty"`
	IsRunning            bool            `json:"is_running"`
	IsPaused             bool            `json:"is_paused"`
	IsClosed             bool            `json:"is_closed"`
	TableHistory         []TableSegment  `json:"table_history"`
}
