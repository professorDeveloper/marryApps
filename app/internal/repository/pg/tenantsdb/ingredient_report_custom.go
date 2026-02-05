package pg

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type IngredientReportRow struct {
	IngredientID   uuid.UUID `json:"ingredient_id"`
	IngredientName string    `json:"ingredient_name"`
	Measurement    *string   `json:"measurement"`
	PictureUrl     *string   `json:"picture_url"`
	ColorCode      *string   `json:"color_code"`

	BeginQty pgtype.Numeric `json:"begin_qty"`
	EndQty   pgtype.Numeric `json:"end_qty"`

	InvoiceInQty    pgtype.Numeric `json:"invoice_in_qty"`
	OrderOutQty     pgtype.Numeric `json:"order_out_qty"`
	DeductionOutQty pgtype.Numeric `json:"deduction_out_qty"`
	SurplusQty      pgtype.Numeric `json:"surplus_qty"`
	ShortageQty     pgtype.Numeric `json:"shortage_qty"`

	CostStart pgtype.Numeric `json:"cost_start"`
	CostEnd   pgtype.Numeric `json:"cost_end"`

	BeginAmount pgtype.Numeric `json:"begin_amount"`
	EndAmount   pgtype.Numeric `json:"end_amount"`

	InvoiceInAmount    pgtype.Numeric `json:"invoice_in_amount"`
	OrderOutAmount     pgtype.Numeric `json:"order_out_amount"`
	DeductionOutAmount pgtype.Numeric `json:"deduction_out_amount"`
	SurplusAmount      pgtype.Numeric `json:"surplus_amount"`
	ShortageAmount     pgtype.Numeric `json:"shortage_amount"`
}

type GetIngredientReportParams struct {
	StorageID    uuid.UUID
	Start        pgtype.Timestamptz
	End          pgtype.Timestamptz
	IngredientID *uuid.UUID
}

func (q *Queries) GetIngredientReport(ctx context.Context, arg GetIngredientReportParams) ([]IngredientReportRow, error) {
	const sql = `
WITH params AS (
	SELECT $1::uuid AS storage_id, $2::timestamptz AS start_ts, $3::timestamptz AS end_ts, $4::uuid AS ingredient_id
),
base_ingredients AS (
	SELECT DISTINCT m.ingredient_id
	FROM ingredient_stock_movements m
	JOIN params p ON p.storage_id = m.storage_id
	WHERE m.created_at <= p.end_ts
		AND (p.ingredient_id IS NULL OR m.ingredient_id = p.ingredient_id)
),
first_in_range AS (
	SELECT DISTINCT ON (m.ingredient_id)
		m.ingredient_id,
		m.stock_before AS begin_qty
	FROM ingredient_stock_movements m
	JOIN params p ON p.storage_id = m.storage_id
	WHERE m.created_at >= p.start_ts AND m.created_at <= p.end_ts
		AND (p.ingredient_id IS NULL OR m.ingredient_id = p.ingredient_id)
	ORDER BY m.ingredient_id, m.created_at ASC, m.id ASC
),
last_before_range AS (
	SELECT DISTINCT ON (m.ingredient_id)
		m.ingredient_id,
		m.stock_after AS begin_qty
	FROM ingredient_stock_movements m
	JOIN params p ON p.storage_id = m.storage_id
	WHERE m.created_at < p.start_ts
		AND (p.ingredient_id IS NULL OR m.ingredient_id = p.ingredient_id)
	ORDER BY m.ingredient_id, m.created_at DESC, m.id DESC
),
begin_qty AS (
	SELECT bi.ingredient_id,
		COALESCE(f.begin_qty, l.begin_qty, 0::numeric) AS begin_qty
	FROM base_ingredients bi
	LEFT JOIN first_in_range f USING (ingredient_id)
	LEFT JOIN last_before_range l USING (ingredient_id)
),
last_in_range AS (
	SELECT DISTINCT ON (m.ingredient_id)
		m.ingredient_id,
		m.stock_after AS end_qty
	FROM ingredient_stock_movements m
	JOIN params p ON p.storage_id = m.storage_id
	WHERE m.created_at >= p.start_ts AND m.created_at <= p.end_ts
		AND (p.ingredient_id IS NULL OR m.ingredient_id = p.ingredient_id)
	ORDER BY m.ingredient_id, m.created_at DESC, m.id DESC
),
end_qty AS (
	SELECT b.ingredient_id,
		COALESCE(l.end_qty, b.begin_qty) AS end_qty
	FROM begin_qty b
	LEFT JOIN last_in_range l USING (ingredient_id)
),
sums AS (
	SELECT
		m.ingredient_id,
		COALESCE(SUM(CASE WHEN m.event_type IN (
			'invoice_in',
			'invoice_update_in',
			'invoice_restore_in',
			'invoice_storage_move_in'
		) THEN m.qty_in ELSE 0 END), 0)::numeric(18,6) AS invoice_in_qty,
		COALESCE(SUM(CASE WHEN m.event_type = 'order_out' THEN m.qty_out ELSE 0 END), 0)::numeric(18,6) AS order_out_qty,
		COALESCE(SUM(CASE WHEN m.event_type = 'deduction_out' THEN m.qty_out ELSE 0 END), 0)::numeric(18,6) AS deduction_out_qty,
		COALESCE(SUM(CASE WHEN m.event_type = 'inventory_surplus_in' THEN m.qty_in ELSE 0 END), 0)::numeric(18,6) AS surplus_qty,
		COALESCE(SUM(CASE WHEN m.event_type = 'inventory_shortage_out' THEN m.qty_out ELSE 0 END), 0)::numeric(18,6) AS shortage_qty,

		COALESCE(SUM(CASE WHEN m.event_type IN (
			'invoice_in',
			'invoice_update_in',
			'invoice_restore_in',
			'invoice_storage_move_in'
		) THEN (m.qty_in * m.price_per_unit) ELSE 0 END), 0)::numeric(18,2) AS invoice_in_amount,
		COALESCE(SUM(CASE WHEN m.event_type = 'order_out' THEN (m.qty_out * m.price_per_unit) ELSE 0 END), 0)::numeric(18,2) AS order_out_amount,
		COALESCE(SUM(CASE WHEN m.event_type = 'deduction_out' THEN (m.qty_out * m.price_per_unit) ELSE 0 END), 0)::numeric(18,2) AS deduction_out_amount,
		COALESCE(SUM(CASE WHEN m.event_type = 'inventory_surplus_in' THEN (m.qty_in * m.price_per_unit) ELSE 0 END), 0)::numeric(18,2) AS surplus_amount,
		COALESCE(SUM(CASE WHEN m.event_type = 'inventory_shortage_out' THEN (m.qty_out * m.price_per_unit) ELSE 0 END), 0)::numeric(18,2) AS shortage_amount
	FROM ingredient_stock_movements m
	JOIN params p ON p.storage_id = m.storage_id
	WHERE m.created_at >= p.start_ts AND m.created_at <= p.end_ts
		AND (p.ingredient_id IS NULL OR m.ingredient_id = p.ingredient_id)
	GROUP BY m.ingredient_id
),
cost_start AS (
	SELECT DISTINCT ON (m.ingredient_id)
		m.ingredient_id,
		m.price_per_unit
	FROM ingredient_stock_movements m
	JOIN params p ON p.storage_id = m.storage_id
	WHERE m.created_at <= p.start_ts
		AND (p.ingredient_id IS NULL OR m.ingredient_id = p.ingredient_id)
	ORDER BY m.ingredient_id, m.created_at DESC, m.id DESC
),
cost_end AS (
	SELECT DISTINCT ON (m.ingredient_id)
		m.ingredient_id,
		m.price_per_unit
	FROM ingredient_stock_movements m
	JOIN params p ON p.storage_id = m.storage_id
	WHERE m.created_at <= p.end_ts
		AND (p.ingredient_id IS NULL OR m.ingredient_id = p.ingredient_id)
	ORDER BY m.ingredient_id, m.created_at DESC, m.id DESC
)
SELECT
	i.id AS ingredient_id,
	i.name AS ingredient_name,
	NULLIF(i.measurement::text, '') AS measurement,
	i.picture_url,
	i.color_code,

	b.begin_qty,
	e.end_qty,

	COALESCE(s.invoice_in_qty, 0)::numeric(18,6) AS invoice_in_qty,
	COALESCE(s.order_out_qty, 0)::numeric(18,6) AS order_out_qty,
	COALESCE(s.deduction_out_qty, 0)::numeric(18,6) AS deduction_out_qty,
	COALESCE(s.surplus_qty, 0)::numeric(18,6) AS surplus_qty,
	COALESCE(s.shortage_qty, 0)::numeric(18,6) AS shortage_qty,

	COALESCE(cs.price_per_unit, 0)::numeric(18,2) AS cost_start,
	COALESCE(ce.price_per_unit, COALESCE(cs.price_per_unit, 0))::numeric(18,2) AS cost_end,

	(b.begin_qty * COALESCE(cs.price_per_unit, 0))::numeric(18,2) AS begin_amount,
	(e.end_qty * COALESCE(ce.price_per_unit, COALESCE(cs.price_per_unit, 0)))::numeric(18,2) AS end_amount,

	COALESCE(s.invoice_in_amount, 0)::numeric(18,2) AS invoice_in_amount,
	COALESCE(s.order_out_amount, 0)::numeric(18,2) AS order_out_amount,
	COALESCE(s.deduction_out_amount, 0)::numeric(18,2) AS deduction_out_amount,
	COALESCE(s.surplus_amount, 0)::numeric(18,2) AS surplus_amount,
	COALESCE(s.shortage_amount, 0)::numeric(18,2) AS shortage_amount
FROM base_ingredients bi
JOIN ingredients i ON i.id = bi.ingredient_id AND i.deleted_at = 0
JOIN begin_qty b ON b.ingredient_id = bi.ingredient_id
JOIN end_qty e ON e.ingredient_id = bi.ingredient_id
LEFT JOIN sums s ON s.ingredient_id = bi.ingredient_id
LEFT JOIN cost_start cs ON cs.ingredient_id = bi.ingredient_id
LEFT JOIN cost_end ce ON ce.ingredient_id = bi.ingredient_id
ORDER BY i.name ASC
`

	var ingredientID any
	if arg.IngredientID != nil {
		ingredientID = *arg.IngredientID
	}

	rows, err := q.db.Query(ctx, sql, arg.StorageID, arg.Start, arg.End, ingredientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []IngredientReportRow
	for rows.Next() {
		var r IngredientReportRow
		if err := rows.Scan(
			&r.IngredientID,
			&r.IngredientName,
			&r.Measurement,
			&r.PictureUrl,
			&r.ColorCode,

			&r.BeginQty,
			&r.EndQty,

			&r.InvoiceInQty,
			&r.OrderOutQty,
			&r.DeductionOutQty,
			&r.SurplusQty,
			&r.ShortageQty,

			&r.CostStart,
			&r.CostEnd,

			&r.BeginAmount,
			&r.EndAmount,

			&r.InvoiceInAmount,
			&r.OrderOutAmount,
			&r.DeductionOutAmount,
			&r.SurplusAmount,
			&r.ShortageAmount,
		); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

type IngredientStockMovementRow struct {
	ID           uuid.UUID
	EventType    string
	QtyIn        pgtype.Numeric
	QtyOut       pgtype.Numeric
	StockBefore  pgtype.Numeric
	StockAfter   pgtype.Numeric
	PricePerUnit pgtype.Numeric
	SourceType   *string
	SourceID     *uuid.UUID
	CreatedAt    pgtype.Timestamptz
}

type GetIngredientStockMovementsParams struct {
	StorageID    uuid.UUID
	IngredientID uuid.UUID
	Start        pgtype.Timestamptz
	End          pgtype.Timestamptz
	Limit        int32
	Offset       int32
}

func (q *Queries) GetIngredientStockMovements(ctx context.Context, arg GetIngredientStockMovementsParams) ([]IngredientStockMovementRow, error) {
	const sql = `
SELECT
	id,
	event_type,
	qty_in,
	qty_out,
	stock_before,
	stock_after,
	price_per_unit,
	source_type,
	source_id,
	created_at
FROM ingredient_stock_movements
WHERE storage_id = $1
	AND ingredient_id = $2
	AND created_at >= $3
	AND created_at <= $4
ORDER BY created_at ASC, id ASC
LIMIT $5 OFFSET $6
`

	rows, err := q.db.Query(ctx, sql, arg.StorageID, arg.IngredientID, arg.Start, arg.End, arg.Limit, arg.Offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []IngredientStockMovementRow
	for rows.Next() {
		var r IngredientStockMovementRow
		if err := rows.Scan(
			&r.ID,
			&r.EventType,
			&r.QtyIn,
			&r.QtyOut,
			&r.StockBefore,
			&r.StockAfter,
			&r.PricePerUnit,
			&r.SourceType,
			&r.SourceID,
			&r.CreatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}
