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

	BeginQty    pgtype.Numeric `json:"begin_quantity"`
	EndQty      pgtype.Numeric `json:"end_quantity"`
	InQty       pgtype.Numeric `json:"in"`
	OutQty      pgtype.Numeric `json:"out"`
	ShortageQty pgtype.Numeric `json:"shortage"`
	SurplusQty  pgtype.Numeric `json:"surplus"`
}

type GetIngredientReportParams struct {
	StorageID    uuid.UUID
	Start        pgtype.Timestamptz
	End          pgtype.Timestamptz
	IngredientID *uuid.UUID
	Limit        int32
	Offset       int32
}

type IngredientReportTotalsRow struct {
	TotalCount         int64          `json:"total_count"`
	TotalAddedAmount   pgtype.Numeric `json:"total_added_amount"`
	TotalRemovedAmount pgtype.Numeric `json:"total_removed_amount"`
}

type GetIngredientInventoryStatusReportParams struct {
	StorageID    uuid.UUID
	End          pgtype.Timestamptz
	IngredientID *uuid.UUID
	Limit        int32
	Offset       int32
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
	WHERE COALESCE(m.effective_at, m.created_at) <= p.end_ts
		AND (p.ingredient_id IS NULL OR m.ingredient_id = p.ingredient_id)
),
begin_qty AS (
	SELECT
		bi.ingredient_id,
		COALESCE(SUM(m.qty_in - m.qty_out), 0)::numeric(18,6) AS begin_qty
	FROM base_ingredients bi
	CROSS JOIN params p
	LEFT JOIN ingredient_stock_movements m
		ON m.ingredient_id = bi.ingredient_id
		AND m.storage_id = p.storage_id
		AND COALESCE(m.effective_at, m.created_at) < p.start_ts
	GROUP BY bi.ingredient_id
),
end_qty AS (
	SELECT
		bi.ingredient_id,
		COALESCE(SUM(m.qty_in - m.qty_out), 0)::numeric(18,6) AS end_qty
	FROM base_ingredients bi
	CROSS JOIN params p
	LEFT JOIN ingredient_stock_movements m
		ON m.ingredient_id = bi.ingredient_id
		AND m.storage_id = p.storage_id
		AND COALESCE(m.effective_at, m.created_at) < p.end_ts
	GROUP BY bi.ingredient_id
),
sums AS (
	SELECT
		m.ingredient_id,
		COALESCE(SUM(m.qty_in), 0)::numeric(18,6) AS in_qty,
		COALESCE(SUM(m.qty_out), 0)::numeric(18,6) AS out_qty,
		COALESCE(SUM(CASE WHEN m.event_type = 'inventory_shortage_out' THEN m.qty_out ELSE 0 END), 0)::numeric(18,6) AS shortage_qty,
		COALESCE(SUM(CASE WHEN m.event_type = 'inventory_surplus_in' THEN m.qty_in ELSE 0 END), 0)::numeric(18,6) AS surplus_qty
	FROM ingredient_stock_movements m
	JOIN params p ON p.storage_id = m.storage_id
	WHERE COALESCE(m.effective_at, m.created_at) >= p.start_ts AND COALESCE(m.effective_at, m.created_at) < p.end_ts
		AND (p.ingredient_id IS NULL OR m.ingredient_id = p.ingredient_id)
	GROUP BY m.ingredient_id
)
SELECT
	i.id AS ingredient_id,
	i.name AS ingredient_name,
	NULLIF(i.measurement::text, '') AS measurement,
	i.picture_url,
	i.color_code,
	b.begin_qty,
	e.end_qty,
	COALESCE(s.in_qty, 0)::numeric(18,6) AS in_qty,
	COALESCE(s.out_qty, 0)::numeric(18,6) AS out_qty,
	COALESCE(s.shortage_qty, 0)::numeric(18,6) AS shortage_qty,
	COALESCE(s.surplus_qty, 0)::numeric(18,6) AS surplus_qty
FROM base_ingredients bi
JOIN ingredients i ON i.id = bi.ingredient_id AND i.deleted_at = 0
JOIN begin_qty b ON b.ingredient_id = bi.ingredient_id
JOIN end_qty e ON e.ingredient_id = bi.ingredient_id
LEFT JOIN sums s ON s.ingredient_id = bi.ingredient_id
ORDER BY i.name ASC
LIMIT $5 OFFSET $6
`

	var ingredientID any
	if arg.IngredientID != nil {
		ingredientID = *arg.IngredientID
	}
	limit := arg.Limit
	if limit <= 0 {
		limit = 20
	}

	rows, err := q.db.Query(ctx, sql, arg.StorageID, arg.Start, arg.End, ingredientID, limit, arg.Offset)
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
			&r.InQty,
			&r.OutQty,
			&r.ShortageQty,
			&r.SurplusQty,
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

func (q *Queries) GetIngredientReportTotals(ctx context.Context, arg GetIngredientReportParams) (IngredientReportTotalsRow, error) {
	const sql = `
WITH params AS (
	SELECT $1::uuid AS storage_id, $2::timestamptz AS start_ts, $3::timestamptz AS end_ts, $4::uuid AS ingredient_id
),
base_ingredients AS (
	SELECT DISTINCT m.ingredient_id
	FROM ingredient_stock_movements m
	JOIN params p ON p.storage_id = m.storage_id
	WHERE COALESCE(m.effective_at, m.created_at) <= p.end_ts
		AND (p.ingredient_id IS NULL OR m.ingredient_id = p.ingredient_id)
),
sums AS (
	SELECT
		m.ingredient_id,
		COALESCE(SUM(CASE WHEN m.event_type IN (
			'invoice_in',
			'invoice_update_in',
			'invoice_restore_in',
			'invoice_storage_move_in'
		) THEN (m.qty_in * m.price_per_unit) ELSE 0 END), 0)::numeric(18,2) AS invoice_in_amount,
		COALESCE(SUM(CASE WHEN m.event_type IN (
			'invoice_update_out',
			'invoice_storage_move_out'
		) THEN (m.qty_out * m.price_per_unit) ELSE 0 END), 0)::numeric(18,2) AS invoice_out_amount,
		COALESCE(SUM(CASE WHEN m.event_type = 'order_out' THEN (m.qty_out * m.price_per_unit) ELSE 0 END), 0)::numeric(18,2) AS order_out_amount,
		COALESCE(SUM(CASE WHEN m.event_type = 'deduction_out' THEN (m.qty_out * m.price_per_unit) ELSE 0 END), 0)::numeric(18,2) AS deduction_out_amount,
		COALESCE(SUM(CASE WHEN m.event_type = 'transfer_in' THEN (m.qty_in * m.price_per_unit) ELSE 0 END), 0)::numeric(18,2) AS transfer_in_amount,
		COALESCE(SUM(CASE WHEN m.event_type = 'transfer_out' THEN (m.qty_out * m.price_per_unit) ELSE 0 END), 0)::numeric(18,2) AS transfer_out_amount,
		COALESCE(SUM(CASE WHEN m.event_type = 'outgoing_invoice_deleted_in' THEN (m.qty_in * m.price_per_unit) ELSE 0 END), 0)::numeric(18,2) AS outgoing_invoice_in_amount,
		COALESCE(SUM(CASE WHEN m.event_type = 'outgoing_invoice_out' THEN (m.qty_out * m.price_per_unit) ELSE 0 END), 0)::numeric(18,2) AS outgoing_invoice_out_amount,
		COALESCE(SUM(CASE WHEN m.event_type IN (
			'separation_act_in',
			'separation_act_out_reversed'
		) THEN (m.qty_in * m.price_per_unit) ELSE 0 END), 0)::numeric(18,2) AS separation_act_in_amount,
		COALESCE(SUM(CASE WHEN m.event_type IN (
			'separation_act_out',
			'separation_act_in_reversed'
		) THEN (m.qty_out * m.price_per_unit) ELSE 0 END), 0)::numeric(18,2) AS separation_act_out_amount,
		COALESCE(SUM(CASE WHEN m.event_type IN (
			'shipment_item_update_reverse',
			'shipment_item_deleted_in',
			'shipment_storage_change_in',
			'shipment_deactivated_in',
			'shipment_deleted_in'
		) THEN (m.qty_in * m.price_per_unit) ELSE 0 END), 0)::numeric(18,2) AS shipment_in_amount,
		COALESCE(SUM(CASE WHEN m.event_type = 'shipment_out' THEN (m.qty_out * m.price_per_unit) ELSE 0 END), 0)::numeric(18,2) AS shipment_out_amount,
		COALESCE(SUM(CASE WHEN m.event_type = 'manual_in' THEN (m.qty_in * m.price_per_unit) ELSE 0 END), 0)::numeric(18,2) AS manual_in_amount,
		COALESCE(SUM(CASE WHEN m.event_type = 'manual_out' THEN (m.qty_out * m.price_per_unit) ELSE 0 END), 0)::numeric(18,2) AS manual_out_amount,
		COALESCE(SUM(CASE WHEN m.event_type IN ('inventory_in', 'inventory_item_removed', 'inventory_item_deleted', 'manual_adjustment') THEN (m.qty_in * m.price_per_unit) ELSE 0 END), 0)::numeric(18,2) AS inventory_in_amount,
		COALESCE(SUM(CASE WHEN m.event_type IN ('inventory_out', 'inventory_surplus_in', 'inventory_shortage_out') THEN (m.qty_out * m.price_per_unit) ELSE 0 END), 0)::numeric(18,2) AS inventory_out_amount
	FROM ingredient_stock_movements m
	JOIN params p ON p.storage_id = m.storage_id
	WHERE COALESCE(m.effective_at, m.created_at) >= p.start_ts AND COALESCE(m.effective_at, m.created_at) < p.end_ts
		AND (p.ingredient_id IS NULL OR m.ingredient_id = p.ingredient_id)
	GROUP BY m.ingredient_id
)
SELECT
	COUNT(DISTINCT bi.ingredient_id)::bigint AS total_count,
	COALESCE(SUM(s.invoice_in_amount + s.transfer_in_amount + s.outgoing_invoice_in_amount + s.separation_act_in_amount + s.shipment_in_amount + s.manual_in_amount + s.inventory_in_amount), 0)::numeric(18,2) AS total_added_amount,
	COALESCE(SUM(s.invoice_out_amount + s.order_out_amount + s.deduction_out_amount + s.transfer_out_amount + s.outgoing_invoice_out_amount + s.separation_act_out_amount + s.shipment_out_amount + s.manual_out_amount + s.inventory_out_amount), 0)::numeric(18,2) AS total_removed_amount
FROM base_ingredients bi
JOIN ingredients i ON i.id = bi.ingredient_id AND i.deleted_at = 0
LEFT JOIN sums s ON s.ingredient_id = bi.ingredient_id
`
	var ingredientID any
	if arg.IngredientID != nil {
		ingredientID = *arg.IngredientID
	}
	row := q.db.QueryRow(ctx, sql, arg.StorageID, arg.Start, arg.End, ingredientID)
	var out IngredientReportTotalsRow
	if err := row.Scan(&out.TotalCount, &out.TotalAddedAmount, &out.TotalRemovedAmount); err != nil {
		return IngredientReportTotalsRow{}, err
	}
	return out, nil
}

func (q *Queries) GetIngredientInventoryStatusReport(ctx context.Context, arg GetIngredientInventoryStatusReportParams) ([]IngredientReportRow, error) {
	const sql = `
WITH params AS (
	SELECT $1::uuid AS storage_id, $2::timestamptz AS end_ts, $3::uuid AS ingredient_id
),
base_ingredients AS (
	SELECT DISTINCT m.ingredient_id
	FROM ingredient_stock_movements m
	JOIN params p ON p.storage_id = m.storage_id
	WHERE COALESCE(m.effective_at, m.created_at) <= p.end_ts
		AND (p.ingredient_id IS NULL OR m.ingredient_id = p.ingredient_id)
),
last_inventory_event AS (
	SELECT DISTINCT ON (m.ingredient_id)
		m.ingredient_id,
		m.stock_after                           AS begin_qty,
		COALESCE(m.effective_at, m.created_at)  AS anchor_ts
	FROM ingredient_stock_movements m
	JOIN params p ON p.storage_id = m.storage_id
	WHERE m.event_type IN ('inventory_surplus_in', 'inventory_shortage_out')
		AND COALESCE(m.effective_at, m.created_at) <= p.end_ts
		AND (p.ingredient_id IS NULL OR m.ingredient_id = p.ingredient_id)
	ORDER BY m.ingredient_id, COALESCE(m.effective_at, m.created_at) DESC, m.id DESC
),
anchors AS (
	SELECT
		bi.ingredient_id,
		COALESCE(lie.begin_qty, 0::numeric)                 AS begin_qty,
		COALESCE(lie.anchor_ts, '-infinity'::timestamptz)   AS anchor_ts
	FROM base_ingredients bi
	LEFT JOIN last_inventory_event lie ON lie.ingredient_id = bi.ingredient_id
),
sums AS (
	SELECT
		m.ingredient_id,
		COALESCE(SUM(m.qty_in),  0)::numeric(18,6) AS in_qty,
		COALESCE(SUM(m.qty_out), 0)::numeric(18,6) AS out_qty,
		COALESCE(SUM(CASE WHEN m.event_type = 'inventory_shortage_out' THEN m.qty_out ELSE 0 END), 0)::numeric(18,6) AS shortage_qty,
		COALESCE(SUM(CASE WHEN m.event_type = 'inventory_surplus_in'  THEN m.qty_in  ELSE 0 END), 0)::numeric(18,6) AS surplus_qty
	FROM ingredient_stock_movements m
	JOIN params  p ON p.storage_id = m.storage_id
	JOIN anchors a ON a.ingredient_id = m.ingredient_id
	WHERE COALESCE(m.effective_at, m.created_at) > a.anchor_ts
		AND COALESCE(m.effective_at, m.created_at) <= p.end_ts
		AND (p.ingredient_id IS NULL OR m.ingredient_id = p.ingredient_id)
	GROUP BY m.ingredient_id
)
SELECT
	i.id                                   AS ingredient_id,
	i.name                                 AS ingredient_name,
	NULLIF(i.measurement::text, '')        AS measurement,
	i.picture_url,
	i.color_code,
	a.begin_qty::numeric(18,6)             AS begin_qty,
	(a.begin_qty + COALESCE(s.in_qty,0) - COALESCE(s.out_qty,0))::numeric(18,6) AS end_qty,
	COALESCE(s.in_qty,       0)::numeric(18,6) AS in_qty,
	COALESCE(s.out_qty,      0)::numeric(18,6) AS out_qty,
	COALESCE(s.shortage_qty, 0)::numeric(18,6) AS shortage_qty,
	COALESCE(s.surplus_qty,  0)::numeric(18,6) AS surplus_qty
FROM base_ingredients bi
JOIN ingredients i ON i.id = bi.ingredient_id AND i.deleted_at = 0
JOIN anchors     a ON a.ingredient_id = bi.ingredient_id
LEFT JOIN sums   s ON s.ingredient_id = bi.ingredient_id
ORDER BY i.name ASC
LIMIT $4 OFFSET $5
`

	var ingredientID any
	if arg.IngredientID != nil {
		ingredientID = *arg.IngredientID
	}
	limit := arg.Limit
	if limit <= 0 {
		limit = 20
	}

	rows, err := q.db.Query(ctx, sql, arg.StorageID, arg.End, ingredientID, limit, arg.Offset)
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
			&r.InQty,
			&r.OutQty,
			&r.ShortageQty,
			&r.SurplusQty,
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

func (q *Queries) GetIngredientInventoryStatusReportTotals(ctx context.Context, arg GetIngredientInventoryStatusReportParams) (IngredientReportTotalsRow, error) {
	const sql = `
WITH params AS (
	SELECT $1::uuid AS storage_id, $2::timestamptz AS end_ts, $3::uuid AS ingredient_id
),
base_ingredients AS (
	SELECT DISTINCT m.ingredient_id
	FROM ingredient_stock_movements m
	JOIN params p ON p.storage_id = m.storage_id
	WHERE COALESCE(m.effective_at, m.created_at) <= p.end_ts
		AND (p.ingredient_id IS NULL OR m.ingredient_id = p.ingredient_id)
),
last_inventory_event AS (
	SELECT DISTINCT ON (m.ingredient_id)
		m.ingredient_id,
		COALESCE(m.effective_at, m.created_at) AS anchor_ts
	FROM ingredient_stock_movements m
	JOIN params p ON p.storage_id = m.storage_id
	WHERE m.event_type IN ('inventory_surplus_in', 'inventory_shortage_out')
		AND COALESCE(m.effective_at, m.created_at) <= p.end_ts
		AND (p.ingredient_id IS NULL OR m.ingredient_id = p.ingredient_id)
	ORDER BY m.ingredient_id, COALESCE(m.effective_at, m.created_at) DESC, m.id DESC
),
anchors AS (
	SELECT
		bi.ingredient_id,
		COALESCE(lie.anchor_ts, '-infinity'::timestamptz) AS anchor_ts
	FROM base_ingredients bi
	LEFT JOIN last_inventory_event lie ON lie.ingredient_id = bi.ingredient_id
),
sums AS (
	SELECT
		m.ingredient_id,
		COALESCE(SUM(m.qty_in * m.price_per_unit),  0)::numeric(18,2) AS total_in_amount,
		COALESCE(SUM(m.qty_out * m.price_per_unit), 0)::numeric(18,2) AS total_out_amount
	FROM ingredient_stock_movements m
	JOIN params  p ON p.storage_id = m.storage_id
	JOIN anchors a ON a.ingredient_id = m.ingredient_id
	WHERE COALESCE(m.effective_at, m.created_at) > a.anchor_ts
		AND COALESCE(m.effective_at, m.created_at) <= p.end_ts
		AND (p.ingredient_id IS NULL OR m.ingredient_id = p.ingredient_id)
	GROUP BY m.ingredient_id
)
SELECT
	COUNT(DISTINCT bi.ingredient_id)::bigint        AS total_count,
	COALESCE(SUM(s.total_in_amount),  0)::numeric(18,2) AS total_added_amount,
	COALESCE(SUM(s.total_out_amount), 0)::numeric(18,2) AS total_removed_amount
FROM base_ingredients bi
JOIN ingredients i ON i.id = bi.ingredient_id AND i.deleted_at = 0
LEFT JOIN sums s ON s.ingredient_id = bi.ingredient_id
`
	var ingredientID any
	if arg.IngredientID != nil {
		ingredientID = *arg.IngredientID
	}
	row := q.db.QueryRow(ctx, sql, arg.StorageID, arg.End, ingredientID)
	var out IngredientReportTotalsRow
	if err := row.Scan(&out.TotalCount, &out.TotalAddedAmount, &out.TotalRemovedAmount); err != nil {
		return IngredientReportTotalsRow{}, err
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
	EffectiveAt  pgtype.Timestamptz
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
		effective_at,
		created_at
	FROM ingredient_stock_movements
	WHERE storage_id = $1
		AND ingredient_id = $2
		AND COALESCE(effective_at, created_at) >= $3
		AND COALESCE(effective_at, created_at) <= $4
	ORDER BY COALESCE(effective_at, created_at) ASC, created_at ASC, id ASC
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
			&r.EffectiveAt,
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
