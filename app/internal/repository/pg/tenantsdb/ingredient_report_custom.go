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

	CostStart pgtype.Numeric `json:"cost_start"`
	CostEnd   pgtype.Numeric `json:"cost_end"`

	BeginAmount pgtype.Numeric `json:"begin_amount"`
	EndAmount   pgtype.Numeric `json:"end_amount"`

	AddedQty       pgtype.Numeric `json:"added_qty"`
	RemovedQty     pgtype.Numeric `json:"removed_qty"`
	AddedAmount    pgtype.Numeric `json:"added_amount"`
	RemovedAmount  pgtype.Numeric `json:"removed_amount"`

	InvoiceInQty    pgtype.Numeric `json:"invoice_in_qty"`
	InvoiceInAmount pgtype.Numeric `json:"invoice_in_amount"`
	InvoiceOutQty   pgtype.Numeric `json:"invoice_out_qty"`
	InvoiceOutAmount pgtype.Numeric `json:"invoice_out_amount"`

	OrderOutQty    pgtype.Numeric `json:"order_out_qty"`
	OrderOutAmount pgtype.Numeric `json:"order_out_amount"`

	DeductionOutQty    pgtype.Numeric `json:"deduction_out_qty"`
	DeductionOutAmount pgtype.Numeric `json:"deduction_out_amount"`

	TransferInQty    pgtype.Numeric `json:"transfer_in_qty"`
	TransferInAmount pgtype.Numeric `json:"transfer_in_amount"`
	TransferOutQty   pgtype.Numeric `json:"transfer_out_qty"`
	TransferOutAmount pgtype.Numeric `json:"transfer_out_amount"`

	OutgoingInvoiceInQty    pgtype.Numeric `json:"outgoing_invoice_in_qty"`
	OutgoingInvoiceInAmount pgtype.Numeric `json:"outgoing_invoice_in_amount"`
	OutgoingInvoiceOutQty   pgtype.Numeric `json:"outgoing_invoice_out_qty"`
	OutgoingInvoiceOutAmount pgtype.Numeric `json:"outgoing_invoice_out_amount"`

	SeparationActInQty    pgtype.Numeric `json:"separation_act_in_qty"`
	SeparationActInAmount pgtype.Numeric `json:"separation_act_in_amount"`
	SeparationActOutQty   pgtype.Numeric `json:"separation_act_out_qty"`
	SeparationActOutAmount pgtype.Numeric `json:"separation_act_out_amount"`

	ShipmentInQty    pgtype.Numeric `json:"shipment_in_qty"`
	ShipmentInAmount pgtype.Numeric `json:"shipment_in_amount"`
	ShipmentOutQty   pgtype.Numeric `json:"shipment_out_qty"`
	ShipmentOutAmount pgtype.Numeric `json:"shipment_out_amount"`

	ManualInQty    pgtype.Numeric `json:"manual_in_qty"`
	ManualInAmount pgtype.Numeric `json:"manual_in_amount"`
	ManualOutQty   pgtype.Numeric `json:"manual_out_qty"`
	ManualOutAmount pgtype.Numeric `json:"manual_out_amount"`

	InventoryInQty    pgtype.Numeric `json:"inventory_in_qty"`
	InventoryInAmount pgtype.Numeric `json:"inventory_in_amount"`
	InventoryOutQty   pgtype.Numeric `json:"inventory_out_qty"`
	InventoryOutAmount pgtype.Numeric `json:"inventory_out_amount"`
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
	TotalCount       int64          `json:"total_count"`
	TotalAddedAmount pgtype.Numeric `json:"total_added_amount"`
	TotalRemovedAmount pgtype.Numeric `json:"total_removed_amount"`
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
		COALESCE(SUM(CASE WHEN m.event_type IN (
			'invoice_in',
			'invoice_update_in',
			'invoice_restore_in',
			'invoice_storage_move_in'
		) THEN m.qty_in ELSE 0 END), 0)::numeric(18,6) AS invoice_in_qty,
		COALESCE(SUM(CASE WHEN m.event_type IN (
			'invoice_update_out',
			'invoice_storage_move_out'
		) THEN m.qty_out ELSE 0 END), 0)::numeric(18,6) AS invoice_out_qty,
		COALESCE(SUM(CASE WHEN m.event_type = 'order_out' THEN m.qty_out ELSE 0 END), 0)::numeric(18,6) AS order_out_qty,
		COALESCE(SUM(CASE WHEN m.event_type = 'deduction_out' THEN m.qty_out ELSE 0 END), 0)::numeric(18,6) AS deduction_out_qty,
		COALESCE(SUM(CASE WHEN m.event_type = 'transfer_in' THEN m.qty_in ELSE 0 END), 0)::numeric(18,6) AS transfer_in_qty,
		COALESCE(SUM(CASE WHEN m.event_type = 'transfer_out' THEN m.qty_out ELSE 0 END), 0)::numeric(18,6) AS transfer_out_qty,
		COALESCE(SUM(CASE WHEN m.event_type = 'outgoing_invoice_deleted_in' THEN m.qty_in ELSE 0 END), 0)::numeric(18,6) AS outgoing_invoice_in_qty,
		COALESCE(SUM(CASE WHEN m.event_type = 'outgoing_invoice_out' THEN m.qty_out ELSE 0 END), 0)::numeric(18,6) AS outgoing_invoice_out_qty,
		COALESCE(SUM(CASE WHEN m.event_type IN (
			'separation_act_in',
			'separation_act_out_reversed'
		) THEN m.qty_in ELSE 0 END), 0)::numeric(18,6) AS separation_act_in_qty,
		COALESCE(SUM(CASE WHEN m.event_type IN (
			'separation_act_out',
			'separation_act_in_reversed'
		) THEN m.qty_out ELSE 0 END), 0)::numeric(18,6) AS separation_act_out_qty,
		COALESCE(SUM(CASE WHEN m.event_type IN (
			'shipment_item_update_reverse',
			'shipment_item_deleted_in',
			'shipment_storage_change_in',
			'shipment_deactivated_in',
			'shipment_deleted_in'
		) THEN m.qty_in ELSE 0 END), 0)::numeric(18,6) AS shipment_in_qty,
		COALESCE(SUM(CASE WHEN m.event_type = 'shipment_out' THEN m.qty_out ELSE 0 END), 0)::numeric(18,6) AS shipment_out_qty,
		COALESCE(SUM(CASE WHEN m.event_type = 'manual_in' THEN m.qty_in ELSE 0 END), 0)::numeric(18,6) AS manual_in_qty,
		COALESCE(SUM(CASE WHEN m.event_type = 'manual_out' THEN m.qty_out ELSE 0 END), 0)::numeric(18,6) AS manual_out_qty,
		COALESCE(SUM(CASE WHEN m.event_type IN ('inventory_in', 'inventory_item_removed', 'inventory_item_deleted', 'manual_adjustment') THEN m.qty_in ELSE 0 END), 0)::numeric(18,6) AS inventory_in_qty,
		COALESCE(SUM(CASE WHEN m.event_type IN ('inventory_out', 'inventory_surplus_in', 'inventory_shortage_out') THEN m.qty_out ELSE 0 END), 0)::numeric(18,6) AS inventory_out_qty,

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
),
cost_start AS (
	SELECT DISTINCT ON (m.ingredient_id)
		m.ingredient_id,
		m.price_per_unit
	FROM ingredient_stock_movements m
	JOIN params p ON p.storage_id = m.storage_id
	WHERE COALESCE(m.effective_at, m.created_at) <= p.start_ts
		AND (p.ingredient_id IS NULL OR m.ingredient_id = p.ingredient_id)
	ORDER BY m.ingredient_id, COALESCE(m.effective_at, m.created_at) DESC, m.id DESC
),
cost_end AS (
	SELECT DISTINCT ON (m.ingredient_id)
		m.ingredient_id,
		m.price_per_unit
	FROM ingredient_stock_movements m
	JOIN params p ON p.storage_id = m.storage_id
	WHERE COALESCE(m.effective_at, m.created_at) <= p.end_ts
		AND (p.ingredient_id IS NULL OR m.ingredient_id = p.ingredient_id)
	ORDER BY m.ingredient_id, COALESCE(m.effective_at, m.created_at) DESC, m.id DESC
)
SELECT
	i.id AS ingredient_id,
	i.name AS ingredient_name,
	NULLIF(i.measurement::text, '') AS measurement,
	i.picture_url,
	i.color_code,

	b.begin_qty,
	e.end_qty,

	COALESCE(cs.price_per_unit, 0)::numeric(18,2) AS cost_start,
	COALESCE(ce.price_per_unit, COALESCE(cs.price_per_unit, 0))::numeric(18,2) AS cost_end,

	(b.begin_qty * COALESCE(cs.price_per_unit, 0))::numeric(18,2) AS begin_amount,
	(e.end_qty * COALESCE(ce.price_per_unit, COALESCE(cs.price_per_unit, 0)))::numeric(18,2) AS end_amount,

	(COALESCE(s.invoice_in_qty, 0) + COALESCE(s.transfer_in_qty, 0) + COALESCE(s.outgoing_invoice_in_qty, 0) + COALESCE(s.separation_act_in_qty, 0) + COALESCE(s.shipment_in_qty, 0) + COALESCE(s.manual_in_qty, 0) + COALESCE(s.inventory_in_qty, 0))::numeric(18,6) AS added_qty,
	(COALESCE(s.invoice_out_qty, 0) + COALESCE(s.order_out_qty, 0) + COALESCE(s.deduction_out_qty, 0) + COALESCE(s.transfer_out_qty, 0) + COALESCE(s.outgoing_invoice_out_qty, 0) + COALESCE(s.separation_act_out_qty, 0) + COALESCE(s.shipment_out_qty, 0) + COALESCE(s.manual_out_qty, 0) + COALESCE(s.inventory_out_qty, 0))::numeric(18,6) AS removed_qty,
	(COALESCE(s.invoice_in_amount, 0) + COALESCE(s.transfer_in_amount, 0) + COALESCE(s.outgoing_invoice_in_amount, 0) + COALESCE(s.separation_act_in_amount, 0) + COALESCE(s.shipment_in_amount, 0) + COALESCE(s.manual_in_amount, 0) + COALESCE(s.inventory_in_amount, 0))::numeric(18,2) AS added_amount,
	(COALESCE(s.invoice_out_amount, 0) + COALESCE(s.order_out_amount, 0) + COALESCE(s.deduction_out_amount, 0) + COALESCE(s.transfer_out_amount, 0) + COALESCE(s.outgoing_invoice_out_amount, 0) + COALESCE(s.separation_act_out_amount, 0) + COALESCE(s.shipment_out_amount, 0) + COALESCE(s.manual_out_amount, 0) + COALESCE(s.inventory_out_amount, 0))::numeric(18,2) AS removed_amount,

	COALESCE(s.invoice_in_qty, 0)::numeric(18,6) AS invoice_in_qty,
	COALESCE(s.invoice_in_amount, 0)::numeric(18,2) AS invoice_in_amount,
	COALESCE(s.invoice_out_qty, 0)::numeric(18,6) AS invoice_out_qty,
	COALESCE(s.invoice_out_amount, 0)::numeric(18,2) AS invoice_out_amount,

	COALESCE(s.order_out_qty, 0)::numeric(18,6) AS order_out_qty,
	COALESCE(s.order_out_amount, 0)::numeric(18,2) AS order_out_amount,

	COALESCE(s.deduction_out_qty, 0)::numeric(18,6) AS deduction_out_qty,
	COALESCE(s.deduction_out_amount, 0)::numeric(18,2) AS deduction_out_amount,

	COALESCE(s.transfer_in_qty, 0)::numeric(18,6) AS transfer_in_qty,
	COALESCE(s.transfer_in_amount, 0)::numeric(18,2) AS transfer_in_amount,
	COALESCE(s.transfer_out_qty, 0)::numeric(18,6) AS transfer_out_qty,
	COALESCE(s.transfer_out_amount, 0)::numeric(18,2) AS transfer_out_amount,

	COALESCE(s.outgoing_invoice_in_qty, 0)::numeric(18,6) AS outgoing_invoice_in_qty,
	COALESCE(s.outgoing_invoice_in_amount, 0)::numeric(18,2) AS outgoing_invoice_in_amount,
	COALESCE(s.outgoing_invoice_out_qty, 0)::numeric(18,6) AS outgoing_invoice_out_qty,
	COALESCE(s.outgoing_invoice_out_amount, 0)::numeric(18,2) AS outgoing_invoice_out_amount,

	COALESCE(s.separation_act_in_qty, 0)::numeric(18,6) AS separation_act_in_qty,
	COALESCE(s.separation_act_in_amount, 0)::numeric(18,2) AS separation_act_in_amount,
	COALESCE(s.separation_act_out_qty, 0)::numeric(18,6) AS separation_act_out_qty,
	COALESCE(s.separation_act_out_amount, 0)::numeric(18,2) AS separation_act_out_amount,

	COALESCE(s.shipment_in_qty, 0)::numeric(18,6) AS shipment_in_qty,
	COALESCE(s.shipment_in_amount, 0)::numeric(18,2) AS shipment_in_amount,
	COALESCE(s.shipment_out_qty, 0)::numeric(18,6) AS shipment_out_qty,
	COALESCE(s.shipment_out_amount, 0)::numeric(18,2) AS shipment_out_amount,

	COALESCE(s.manual_in_qty, 0)::numeric(18,6) AS manual_in_qty,
	COALESCE(s.manual_in_amount, 0)::numeric(18,2) AS manual_in_amount,
	COALESCE(s.manual_out_qty, 0)::numeric(18,6) AS manual_out_qty,
	COALESCE(s.manual_out_amount, 0)::numeric(18,2) AS manual_out_amount,

	COALESCE(s.inventory_in_qty, 0)::numeric(18,6) AS inventory_in_qty,
	COALESCE(s.inventory_in_amount, 0)::numeric(18,2) AS inventory_in_amount,
	COALESCE(s.inventory_out_qty, 0)::numeric(18,6) AS inventory_out_qty,
	COALESCE(s.inventory_out_amount, 0)::numeric(18,2) AS inventory_out_amount
FROM base_ingredients bi
JOIN ingredients i ON i.id = bi.ingredient_id AND i.deleted_at = 0
JOIN begin_qty b ON b.ingredient_id = bi.ingredient_id
JOIN end_qty e ON e.ingredient_id = bi.ingredient_id
LEFT JOIN sums s ON s.ingredient_id = bi.ingredient_id
LEFT JOIN cost_start cs ON cs.ingredient_id = bi.ingredient_id
LEFT JOIN cost_end ce ON ce.ingredient_id = bi.ingredient_id
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

			&r.CostStart,
			&r.CostEnd,

			&r.BeginAmount,
			&r.EndAmount,

			&r.AddedQty,
			&r.RemovedQty,
			&r.AddedAmount,
			&r.RemovedAmount,

			&r.InvoiceInQty,
			&r.InvoiceInAmount,
			&r.InvoiceOutQty,
			&r.InvoiceOutAmount,

			&r.OrderOutQty,
			&r.OrderOutAmount,

			&r.DeductionOutQty,
			&r.DeductionOutAmount,

			&r.TransferInQty,
			&r.TransferInAmount,
			&r.TransferOutQty,
			&r.TransferOutAmount,

			&r.OutgoingInvoiceInQty,
			&r.OutgoingInvoiceInAmount,
			&r.OutgoingInvoiceOutQty,
			&r.OutgoingInvoiceOutAmount,

			&r.SeparationActInQty,
			&r.SeparationActInAmount,
			&r.SeparationActOutQty,
			&r.SeparationActOutAmount,

			&r.ShipmentInQty,
			&r.ShipmentInAmount,
			&r.ShipmentOutQty,
			&r.ShipmentOutAmount,

			&r.ManualInQty,
			&r.ManualInAmount,
			&r.ManualOutQty,
			&r.ManualOutAmount,

			&r.InventoryInQty,
			&r.InventoryInAmount,
			&r.InventoryOutQty,
			&r.InventoryOutAmount,
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
	AND COALESCE(effective_at, created_at) >= $3
	AND COALESCE(effective_at, created_at) <= $4
ORDER BY COALESCE(effective_at, created_at) ASC, id ASC
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
