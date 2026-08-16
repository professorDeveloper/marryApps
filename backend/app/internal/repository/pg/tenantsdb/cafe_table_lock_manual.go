package pg

import (
	"context"

	"github.com/google/uuid"
)

type LockedCafeTableRow struct {
	ID        uuid.UUID `json:"id"`
	Status    string    `json:"status"`
	TableType string    `json:"table_type"`
}

const lockCafeTableByID = `
SELECT id, COALESCE(status::text, ''), table_type
FROM cafe_tables
WHERE cafe_tables.id = $1
  AND cafe_tables.deleted_at = 0
  AND EXISTS (
    SELECT 1 FROM halls h
    WHERE h.id = cafe_tables.hall_id
      AND h.branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  )
FOR UPDATE
`

func (q *Queries) LockCafeTableByID(ctx context.Context, id uuid.UUID) (LockedCafeTableRow, error) {
	row := q.db.QueryRow(ctx, lockCafeTableByID, id)
	var i LockedCafeTableRow
	err := row.Scan(&i.ID, &i.Status, &i.TableType)
	return i, err
}