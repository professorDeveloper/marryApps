package pg

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ErrInvalidExpandField is returned when the expand field name has no FK relation.
var ErrInvalidExpandField = errors.New("invalid expand field")

// Expander is the common interface returned by repository helpers.
type Expander interface {
	ExpandRows(ctx context.Context, table string, rows []map[string]any, fields []string) error
}

// querier is satisfied by both *pgxpool.Pool and pgx.Tx.
type querier interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
}

// ForeignKeyRelation represents a FK relationship.
type ForeignKeyRelation struct {
	Name             string // Field name to expand (same as Column)
	Column           string // Local FK column (e.g., "user_id")
	ReferencedTable  string // Target table (e.g., "users")
	ReferencedColumn string // Target column (e.g., "id")
}

// ExpandManager handles expand operations.
type ExpandManager struct {
	pool *pgxpool.Pool
}

func NewExpandManager(pool *pgxpool.Pool) *ExpandManager {
	return &ExpandManager{pool: pool}
}

// WithTx returns an ExpandManager that uses the given transaction (which already
// has the correct search_path set by the tenant middleware).
func (em *ExpandManager) WithTx(tx pgx.Tx) *txExpandManager {
	return &txExpandManager{q: tx}
}

// txExpandManager is the transaction-scoped variant.
type txExpandManager struct {
	q querier
}

// ParseExpandFields parses a comma-separated expand query param, deduplicates.
// Input: "user_id,hall_id,user_id" → ["user_id", "hall_id"]
func ParseExpandFields(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	fields := make([]string, 0, len(parts))
	seen := make(map[string]struct{}, len(parts))
	for _, part := range parts {
		f := strings.TrimSpace(part)
		if f == "" {
			continue
		}
		if _, ok := seen[f]; !ok {
			seen[f] = struct{}{}
			fields = append(fields, f)
		}
	}
	return fields
}

// getForeignKeyRelations fetches FK metadata for a table from the currently active schema.
// The query uses current_schema() so it picks up the search_path set by the tenant tx.
func getForeignKeyRelations(ctx context.Context, q querier, table string) ([]ForeignKeyRelation, error) {
	const query = `
SELECT
    a.attname         AS column_name,
    c2.relname        AS referenced_table,
    a2.attname        AS referenced_column
FROM pg_constraint con
JOIN pg_class c  ON c.oid  = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a  ON a.attrelid = con.conrelid
    AND a.attnum = ANY(con.conkey) AND NOT a.attisdropped
JOIN pg_class c2 ON c2.oid = con.confrelid
JOIN pg_attribute a2 ON a2.attrelid = con.confrelid
    AND a2.attnum = ANY(con.confkey) AND NOT a2.attisdropped
WHERE con.contype = 'f'
  AND n.nspname = current_schema()
  AND c.relname = $1
ORDER BY a.attnum
`
	rows, err := q.Query(ctx, query, table)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rels []ForeignKeyRelation
	for rows.Next() {
		var rel ForeignKeyRelation
		if err := rows.Scan(&rel.Column, &rel.ReferencedTable, &rel.ReferencedColumn); err != nil {
			return nil, err
		}
		rel.Name = rel.Column
		rels = append(rels, rel)
	}
	return rels, rows.Err()
}

// fetchRelatedRows fetches related records by UUID/string IDs.
func fetchRelatedRows(ctx context.Context, q querier, table, idColumn string, ids []string) (map[string]map[string]any, error) {
	if len(ids) == 0 {
		return make(map[string]map[string]any), nil
	}

	query := fmt.Sprintf(
		"SELECT * FROM %s WHERE %s = ANY($1::uuid[])",
		quoteIdentifier(table),
		quoteIdentifier(idColumn),
	)

	rows, err := q.Query(ctx, query, ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	colDescs := rows.FieldDescriptions()
	result := make(map[string]map[string]any)
	for rows.Next() {
		vals, err := rows.Values()
		if err != nil {
			return nil, err
		}
		entry := make(map[string]any, len(colDescs))
		for i, col := range colDescs {
			entry[col.Name] = normalizeValue(vals[i])
		}
		key := anyToString(entry[idColumn])
		if key != "" {
			result[key] = entry
		}
	}
	return result, rows.Err()
}

// expandRows enriches rows with related data, adding an "_expand" key.
func expandRows(ctx context.Context, q querier, table string, rows []map[string]any, fields []string) error {
	rels, err := getForeignKeyRelations(ctx, q, table)
	if err != nil {
		return err
	}

	relsByName := make(map[string]ForeignKeyRelation, len(rels))
	for _, r := range rels {
		relsByName[r.Name] = r
	}

	for _, field := range fields {
		rel, ok := relsByName[field]
		if !ok {
			return fmt.Errorf("%w: %s", ErrInvalidExpandField, field)
		}

		// Collect unique FK values from all rows
		unique := make(map[string]struct{})
		for _, row := range rows {
			if id := anyToString(row[rel.Column]); id != "" {
				unique[id] = struct{}{}
			}
		}
		ids := make([]string, 0, len(unique))
		for id := range unique {
			ids = append(ids, id)
		}
		if len(ids) == 0 {
			continue
		}

		related, err := fetchRelatedRows(ctx, q, rel.ReferencedTable, rel.ReferencedColumn, ids)
		if err != nil {
			return err
		}

		for _, row := range rows {
			id := anyToString(row[rel.Column])
			if id == "" {
				continue
			}
			expanded, ok := related[id]
			if !ok {
				continue
			}
			ensureExpandMap(row)[field] = expanded
		}
	}
	return nil
}

// ExpandRows is the public method on txExpandManager.
func (em *txExpandManager) ExpandRows(ctx context.Context, table string, rows []map[string]any, fields []string) error {
	return expandRows(ctx, em.q, table, rows, fields)
}

// ExpandRows falls back to pool if no tx is available (should not happen in normal flow).
func (em *ExpandManager) ExpandRows(ctx context.Context, table string, rows []map[string]any, fields []string) error {
	return expandRows(ctx, em.pool, table, rows, fields)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func ensureExpandMap(row map[string]any) map[string]any {
	if v, ok := row["_expand"]; ok {
		if m, ok := v.(map[string]any); ok {
			return m
		}
	}
	m := make(map[string]any)
	row["_expand"] = m
	return m
}

// normalizeValue converts pgx raw types to JSON-friendly Go types.
// Mainly: [16]byte (UUID) → "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" string.
func normalizeValue(v any) any {
	if v == nil {
		return nil
	}
	if b, ok := v.([16]byte); ok {
		return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
			b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
	}
	return v
}

// anyToString converts common UUID representations to a canonical string.
func anyToString(v any) string {
	if v == nil {
		return ""
	}
	switch val := v.(type) {
	case string:
		return val
	case [16]byte:
		return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
			val[0:4], val[4:6], val[6:8], val[8:10], val[10:16])
	case fmt.Stringer:
		return val.String()
	default:
		return fmt.Sprintf("%v", val)
	}
}

func quoteIdentifier(name string) string {
	return `"` + strings.ReplaceAll(name, `"`, `""`) + `"`
}
