package model

import "time"

type TableTimerState string

const (
	TableTimerStateRunning TableTimerState = "running"
	TableTimerStatePaused  TableTimerState = "paused"
	TableTimerStateClosed  TableTimerState = "closed"
	TableTimerStateNone    TableTimerState = "none"
)

type TableTimerResponse struct {
	OrderID              string           `json:"order_id"`
	TableID              string           `json:"table_id"`
	TableType            string           `json:"table_type"`
	State                TableTimerState  `json:"state"`
	StartedAt            *time.Time       `json:"started_at,omitempty"`
	ActiveStartedAt      *time.Time       `json:"active_started_at,omitempty"`
	EndedAt              *time.Time       `json:"ended_at,omitempty"`
	PricePerHour         *string          `json:"price_per_hour,omitempty"`
	AccumulatedActiveSec int64            `json:"accumulated_active_sec"`
	CurrentActiveSec     int64            `json:"current_active_sec"`
	TotalActiveSec       int64            `json:"total_active_sec"`
	CurrentAmount        *string          `json:"current_amount,omitempty"`
	FinalAmount          *string          `json:"final_amount,omitempty"`
	IsRunning            bool             `json:"is_running"`
	IsPaused             bool             `json:"is_paused"`
	IsClosed             bool             `json:"is_closed"`
}