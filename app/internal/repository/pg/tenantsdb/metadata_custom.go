package pg

import (
	"context"
	"fmt"
	"strings"

	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

func (q *Queries) GetMetadata(ctx context.Context, tableName string) ([]model.MetadataItem, error) {
	// Handle role-based user queries
	if strings.HasPrefix(tableName, "role_") {
		role := strings.TrimPrefix(tableName, "role_")
		return q.getUsersByRoleForMetadata(ctx, role)
	}

	// Handle standard table queries
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

// getUsersByRoleForMetadata returns users with a specific role in metadata format
func (q *Queries) getUsersByRoleForMetadata(ctx context.Context, role string) ([]model.MetadataItem, error) {
	sql := `SELECT id::text, full_name FROM users 
			WHERE role = $1 AND deleted_at = 0 
			AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
			ORDER BY full_name ASC`

	rows, err := q.db.Query(ctx, sql, role)
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
