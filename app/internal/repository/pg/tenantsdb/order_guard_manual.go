package pg

import (
	"context"

	"github.com/google/uuid"
)

type ActiveOrderByTableRow struct {
	ID     uuid.UUID `json:"id"`
	Status string    `json:"status"`
}

const getActiveOpenOrderByTableID = `
SELECT id, status
FROM orders
WHERE table_id = $1
  AND order_type = 'dine_in'
  AND status IN ('open', 'cooking', 'ready', 'served')
  AND COALESCE(deleted_at, 0) = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
ORDER BY created_at DESC
LIMIT 1
`

func (q *Queries) GetActiveOpenOrderByTableID(ctx context.Context, tableID uuid.UUID) (ActiveOrderByTableRow, error) {
	row := q.db.QueryRow(ctx, getActiveOpenOrderByTableID, tableID)
	var i ActiveOrderByTableRow
	err := row.Scan(&i.ID, &i.Status)
	return i, err
}
