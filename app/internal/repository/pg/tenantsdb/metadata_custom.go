package pg

import (
	"context"
	"fmt"

	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

func (q *Queries) GetMetadata(ctx context.Context, tableName string) ([]model.MetadataItem, error) {
	sql := fmt.Sprintf("SELECT id::text, name FROM %s WHERE deleted_at = 0 ORDER BY name", tableName)
	rows, err := q.db.Query(ctx, sql)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.MetadataItem
	for rows.Next() {
		var item model.MetadataItem
		if err := rows.Scan(&item.ID, &item.Name); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}
