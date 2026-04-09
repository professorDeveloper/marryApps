package pg

import (
	"context"

	"github.com/google/uuid"
)

const softDeleteAllModifiersByGoodID = `
UPDATE goods_modifiers
SET deleted_at = EXTRACT(EPOCH FROM NOW())::BIGINT
WHERE good_id = $1
  AND deleted_at = 0
`

func (q *Queries) SoftDeleteAllModifiersByGoodID(ctx context.Context, goodID uuid.UUID) error {
	_, err := q.db.Exec(ctx, softDeleteAllModifiersByGoodID, goodID)
	return err
}