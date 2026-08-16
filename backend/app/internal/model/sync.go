package model

type SyncPullRequest struct {
	LastSyncCursor int64 `json:"last_sync_cursor"`
	Limit          int32 `json:"limit,omitempty"`
}

type EntityChanges struct {
	Created []map[string]interface{} `json:"created"`
	Updated []map[string]interface{} `json:"updated"`
	Deleted []string                 `json:"deleted"`
}

type SyncPullResponse struct {
	NextSyncCursor int64                    `json:"next_sync_cursor"`
	Changes        map[string]EntityChanges `json:"changes"`
}

type SyncPushChange struct {
	Entity   string                 `json:"entity"`
	Action   string                 `json:"action"`
	EntityID string                 `json:"entity_id,omitempty"`
	Payload  map[string]interface{} `json:"payload,omitempty"`
}

type SyncPushRequest struct {
	Changes []SyncPushChange `json:"changes"`
}

type SyncPushError struct {
	Index  int    `json:"index"`
	Entity string `json:"entity"`
	Action string `json:"action"`
	Error  string `json:"error"`
}

type SyncPushResult struct {
	Applied int             `json:"applied"`
	Errors  []SyncPushError `json:"errors,omitempty"`
}
