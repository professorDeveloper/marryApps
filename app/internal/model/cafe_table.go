package model

import "time"

type TableStatus string

const (
	TableStatusFree TableStatus = "free"
	TableStatusBusy TableStatus = "busy"
)

type CafeTable struct {
	ID        string      `json:"id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	HallID    string      `json:"hall_id" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	Number    int32       `json:"number" example:"5"`
	Capacity  int32       `json:"capacity" example:"4"`
	Status    TableStatus `json:"status" example:"free"`
	CreatedAt *time.Time  `json:"created_at,omitempty"`
	UpdatedAt *time.Time  `json:"updated_at,omitempty"`
}

type CreateCafeTableRequest struct {
	HallID   string `json:"hall_id" validate:"required" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	Number   int32  `json:"number" validate:"required,min=1" example:"5"`
	Capacity int32  `json:"capacity" validate:"required,min=1" example:"4"`
	Status   string `json:"status" example:"free"`
}

// UpdateCafeTableRequest is the request to update a cafe table
type UpdateCafeTableRequest struct {
	HallID   *string `json:"hall_id,omitempty" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	Number   *int32  `json:"number,omitempty" example:"5"`
	Capacity *int32  `json:"capacity,omitempty" example:"4"`
	Status   *string `json:"status,omitempty" example:"available"`
}

// UpdateCafeTableStatusRequest is the request to update only the status
type UpdateCafeTableStatusRequest struct {
	Status string `json:"status" validate:"required" example:"busy"`
}

// CafeTableResponse is the response for a cafe table
type CafeTableResponse struct {
	ID        string      `json:"id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	HallID    string      `json:"hall_id" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	Number    int32       `json:"number" example:"5"`
	Capacity  int32       `json:"capacity" example:"4"`
	Status    TableStatus `json:"status" example:"free"`
	CreatedAt *time.Time  `json:"created_at,omitempty"`
	UpdatedAt *time.Time  `json:"updated_at,omitempty"`
}

// TableOccupancyStats represents occupancy statistics for all tables
type TableOccupancyStats struct {
	TotalTables    int64 `json:"total_tables" example:"50"`
	FreeTables     int64 `json:"free_tables" example:"30"`
	BusyTables     int64 `json:"busy_tables" example:"20"`
	FreePercentage int32 `json:"free_percentage" example:"60"`
	BusyPercentage int32 `json:"busy_percentage" example:"40"`
	TotalCapacity  int64 `json:"total_capacity" example:"200"`
	AvailableSeats int64 `json:"available_seats" example:"120"`
}
