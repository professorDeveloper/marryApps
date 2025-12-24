package model

import "time"

// QRSession represents a QR code scanning session for a cafe table
type QRSession struct {
	ID        string     `json:"id" example:"d5e6f7a8-b9c0-4d1e-8f2g-h3i4j5k6l7m8"`
	TableID   string     `json:"table_id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	DeviceID  *string    `json:"device_id,omitempty" example:"device-12345"`
	StartTime *time.Time `json:"start_time,omitempty"`
	EndTime   *time.Time `json:"end_time,omitempty"`
	IsActive  bool       `json:"is_active" example:"true"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
}

// CreateQRSessionRequest is the request to create a new QR session
// When user scans a QR code, this session is created
type CreateQRSessionRequest struct {
	TableID  string  `json:"table_id" validate:"required" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	DeviceID *string `json:"device_id,omitempty" example:"device-12345"`
}

// UpdateQRSessionRequest is the request to update a QR session
type UpdateQRSessionRequest struct {
	DeviceID *string `json:"device_id,omitempty" example:"device-12345"`
}

// EndQRSessionRequest is the request to end a QR session
type EndQRSessionRequest struct {
	SessionID string `json:"session_id" validate:"required" example:"d5e6f7a8-b9c0-4d1e-8f2g-h3i4j5k6l7m8"`
}

// QRSessionResponse is the response for a QR session
type QRSessionResponse struct {
	ID        string     `json:"id" example:"d5e6f7a8-b9c0-4d1e-8f2g-h3i4j5k6l7m8"`
	TableID   string     `json:"table_id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	DeviceID  *string    `json:"device_id,omitempty" example:"device-12345"`
	StartTime *time.Time `json:"start_time,omitempty"`
	EndTime   *time.Time `json:"end_time,omitempty"`
	IsActive  bool       `json:"is_active" example:"true"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
}
