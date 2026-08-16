package model

import "time"

type ChangeLogEntry struct {
	ID        int64                  `json:"id"`
	BrandID   *string                `json:"brand_id,omitempty"`
	Entity    string                 `json:"entity"`
	Action    string                 `json:"action"`
	EntityID  string                 `json:"entity_id"`
	Payload   map[string]interface{} `json:"payload"`
	ChangedAt time.Time              `json:"changed_at"`
}

type ChangeLogListResponse struct {
	Items []ChangeLogEntry `json:"items"`
	Total int64            `json:"total"`
}
