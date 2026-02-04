package pg

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type BillListRow struct {
	ID              uuid.UUID          `json:"id"`
	BillNo          int32              `json:"bill_no"`
	BillStatus      string             `json:"bill_status"`
	BillOpenedAt    pgtype.Timestamptz `json:"bill_opened_at"`
	BillClosedAt    pgtype.Timestamptz `json:"bill_closed_at"`
	WaiterID        pgtype.UUID        `json:"waiter_id"`
	WaiterName      *string            `json:"waiter_name"`
	TableNumber     *int32             `json:"table_number"`
	HallName        *string            `json:"hall_name"`
	GuestCount      *int32             `json:"guest_count"`
	FoodCost        pgtype.Numeric     `json:"food_cost"`
	FoodTotal       pgtype.Numeric     `json:"food_total"`
	ServicePercent  pgtype.Numeric     `json:"service_percent"`
	ServiceAmount   pgtype.Numeric     `json:"service_amount"`
	DiscountPercent pgtype.Numeric     `json:"discount_percent"`
	DiscountAmount  pgtype.Numeric     `json:"discount_amount"`
	GrandTotal      pgtype.Numeric     `json:"grand_total"`
	PaymentType     *string            `json:"payment_type"`
}

type GetBillsParams struct {
	Start *pgtype.Timestamptz
	End   *pgtype.Timestamptz

	BillStatus  *string
	PaymentType *string
	WaiterID    *uuid.UUID
	HallID      *uuid.UUID
	TableID     *uuid.UUID

	Limit  int32
	Offset int32
}

type BillDetailsRow struct {
	ID              uuid.UUID          `json:"id"`
	BillNo          int32              `json:"bill_no"`
	BillStatus      string             `json:"bill_status"`
	BillOpenedAt    pgtype.Timestamptz `json:"bill_opened_at"`
	BillClosedAt    pgtype.Timestamptz `json:"bill_closed_at"`
	PaidAt          pgtype.Timestamptz `json:"paid_at"`
	PaymentType     *string            `json:"payment_type"`
	TableID         pgtype.UUID        `json:"table_id"`
	TableNumber     *int32             `json:"table_number"`
	HallName        *string            `json:"hall_name"`
	WaiterID        pgtype.UUID        `json:"waiter_id"`
	WaiterName      *string            `json:"waiter_name"`
	CashierID       pgtype.UUID        `json:"cashier_id"`
	CashierName     *string            `json:"cashier_name"`
	GuestCount      *int32             `json:"guest_count"`
	FoodCost        pgtype.Numeric     `json:"food_cost"`
	FoodTotal       pgtype.Numeric     `json:"food_total"`
	ServicePercent  pgtype.Numeric     `json:"service_percent"`
	ServiceAmount   pgtype.Numeric     `json:"service_amount"`
	DiscountPercent pgtype.Numeric     `json:"discount_percent"`
	DiscountAmount  pgtype.Numeric     `json:"discount_amount"`
	DiscountComment *string            `json:"discount_comment"`
	GrandTotal      pgtype.Numeric     `json:"grand_total"`
	Comment         *string            `json:"comment"`
}

type BillItemRow struct {
	ID       uuid.UUID      `json:"id"`
	OrderID  uuid.UUID      `json:"order_id"`
	GoodID   uuid.UUID      `json:"good_id"`
	GoodName *string        `json:"good_name"`
	Quantity int32          `json:"quantity"`
	Price    pgtype.Numeric `json:"price"`
	Status   string         `json:"status"`
	Comment  *string        `json:"comment"`
}

type OrderItemWithStorageRow struct {
	GoodID    uuid.UUID   `json:"good_id"`
	Quantity  int32       `json:"quantity"`
	StorageID pgtype.UUID `json:"storage_id"`
}

func (q *Queries) NextDailyBillNo(ctx context.Context) (int32, error) {
	const sql = `
		INSERT INTO bill_daily_counters(day, last_no)
		VALUES (CURRENT_DATE, 1)
		ON CONFLICT(day)
		DO UPDATE SET last_no = bill_daily_counters.last_no + 1
		RETURNING last_no
	`
	row := q.db.QueryRow(ctx, sql)
	var out int32
	if err := row.Scan(&out); err != nil {
		return 0, err
	}
	return out, nil
}

func (q *Queries) InitOrderBillFields(ctx context.Context, orderID uuid.UUID, billNo int32, servicePercent pgtype.Numeric) error {
	const sql = `
		UPDATE orders
		SET bill_no = $2,
			bill_status = 'opened',
			bill_opened_at = NOW(),
			service_percent = $3
		WHERE id = $1 AND deleted_at = 0
	`
	_, err := q.db.Exec(ctx, sql, orderID, billNo, servicePercent)
	return err
}

func (q *Queries) CloseBillOnServed(ctx context.Context, orderID uuid.UUID) error {
	const sql = `
		WITH totals AS (
			SELECT
				COALESCE(SUM(oi.quantity * oi.price), 0)::numeric(15,2) AS food_total,
				COALESCE(SUM(oi.quantity * g.cost_price), 0)::numeric(15,2) AS food_cost
			FROM order_items oi
			JOIN goods g ON oi.good_id = g.id AND g.deleted_at = 0
			WHERE oi.order_id = $1 AND oi.deleted_at = 0 AND oi.status <> 'cancelled'::order_items_status
		)
		UPDATE orders o
		SET
			food_total = t.food_total,
			food_cost = t.food_cost,
			service_amount = ROUND((t.food_total * o.service_percent / 100.0), 2),
			discount_amount = COALESCE(o.discount_amount, 0),
			grand_total = GREATEST(ROUND((t.food_total + ROUND((t.food_total * o.service_percent / 100.0), 2) - COALESCE(o.discount_amount, 0)), 2), 0),
			total_amount = GREATEST(ROUND((t.food_total + ROUND((t.food_total * o.service_percent / 100.0), 2) - COALESCE(o.discount_amount, 0)), 2), 0),
			bill_status = 'closed',
			bill_closed_at = NOW()
		FROM totals t
		WHERE o.id = $1 AND o.deleted_at = 0
	`
	_, err := q.db.Exec(ctx, sql, orderID)
	return err
}

func (q *Queries) RecalculateOrderTotalsFromItems(ctx context.Context, orderID uuid.UUID) error {
	const sql = `
		WITH totals AS (
			SELECT
				COALESCE(SUM(oi.quantity * oi.price), 0)::numeric(15,2) AS food_total,
				COALESCE(SUM(oi.quantity * g.cost_price), 0)::numeric(15,2) AS food_cost
			FROM order_items oi
			JOIN goods g ON oi.good_id = g.id AND g.deleted_at = 0
			WHERE oi.order_id = $1 AND oi.deleted_at = 0 AND oi.status <> 'cancelled'::order_items_status
		)
		UPDATE orders o
		SET
			food_total = t.food_total,
			food_cost = t.food_cost,
			service_amount = ROUND((t.food_total * o.service_percent / 100.0), 2),
			grand_total = GREATEST(ROUND((t.food_total + ROUND((t.food_total * o.service_percent / 100.0), 2) - COALESCE(o.discount_amount, 0)), 2), 0),
			total_amount = GREATEST(ROUND((t.food_total + ROUND((t.food_total * o.service_percent / 100.0), 2) - COALESCE(o.discount_amount, 0)), 2), 0),
			updated_at = NOW()
		FROM totals t
		WHERE o.id = $1 AND o.deleted_at = 0
	`
	_, err := q.db.Exec(ctx, sql, orderID)
	return err
}

type PayOrderBillParams struct {
	OrderID         uuid.UUID
	CashierID       uuid.UUID
	PaymentType     *string
	DiscountPercent *pgtype.Numeric
	DiscountAmount  *pgtype.Numeric
	DiscountComment *string
}

func (q *Queries) PayOrderBill(ctx context.Context, arg PayOrderBillParams) error {
	const sql = `
		WITH totals AS (
			SELECT
				COALESCE(SUM(oi.quantity * oi.price), 0)::numeric(15,2) AS food_total,
				COALESCE(SUM(oi.quantity * g.cost_price), 0)::numeric(15,2) AS food_cost
			FROM order_items oi
			JOIN goods g ON oi.good_id = g.id AND g.deleted_at = 0
			WHERE oi.order_id = $1 AND oi.deleted_at = 0 AND oi.status <> 'cancelled'::order_items_status
		),
		service_calc AS (
			SELECT
				t.food_total,
				t.food_cost,
				ROUND((t.food_total * o.service_percent / 100.0), 2) AS service_amount,
				(o.service_percent) AS service_percent
			FROM totals t
			JOIN orders o ON o.id = $1 AND o.deleted_at = 0
		),
		base_calc AS (
			SELECT
				food_total,
				food_cost,
				service_percent,
				service_amount,
				(food_total + service_amount)::numeric(15,2) AS base_total
			FROM service_calc
		),
		disc_calc AS (
			SELECT
				base_total,
				CASE
					WHEN $5::numeric IS NOT NULL THEN ROUND($5::numeric, 2)
					WHEN $4::numeric IS NOT NULL THEN ROUND((base_total * $4::numeric / 100.0), 2)
					ELSE 0::numeric(15,2)
				END AS discount_amount
			FROM base_calc
		)
		UPDATE orders o
		SET
			food_total = b.food_total,
			food_cost = b.food_cost,
			service_amount = b.service_amount,
			payment_type = CASE WHEN $3::text IS NULL OR $3::text = '' THEN o.payment_type ELSE $3::payment_type END,
			discount_percent = $4,
			discount_amount = d.discount_amount,
			discount_comment = $6,
			grand_total = GREATEST(ROUND((b.base_total - d.discount_amount), 2), 0),
			total_amount = GREATEST(ROUND((b.base_total - d.discount_amount), 2), 0),
			bill_status = 'paid',
			bill_closed_at = COALESCE(o.bill_closed_at, NOW()),
			paid_at = NOW(),
			cashier_id = $2,
			status = 'paid'
		FROM base_calc b, disc_calc d
		WHERE o.id = $1 AND o.deleted_at = 0
	`
	_, err := q.db.Exec(ctx, sql, arg.OrderID, arg.CashierID, arg.PaymentType, arg.DiscountPercent, arg.DiscountAmount, arg.DiscountComment)
	return err
}

func (q *Queries) GetDefaultServicePercentByTable(ctx context.Context, tableID uuid.UUID) (pgtype.Numeric, error) {
	const sql = `
		SELECT b.default_service_percent
		FROM cafe_tables ct
		JOIN halls h ON ct.hall_id = h.id AND h.deleted_at = 0
		JOIN branches b ON h.branch_id = b.id AND b.deleted_at = 0
		WHERE ct.id = $1 AND ct.deleted_at = 0
	`
	row := q.db.QueryRow(ctx, sql, tableID)
	var out pgtype.Numeric
	if err := row.Scan(&out); err != nil {
		return pgtype.Numeric{}, err
	}
	return out, nil
}

func (q *Queries) GetBills(ctx context.Context, arg GetBillsParams) ([]BillListRow, error) {
	const sql = `
		SELECT
			o.id,
			o.bill_no,
			o.bill_status::text,
			o.bill_opened_at,
			o.bill_closed_at,
			o.waiter_id,
			w.full_name AS waiter_name,
			ct.number AS table_number,
			h.name AS hall_name,
			o.guest_count,
			o.food_cost,
			o.food_total,
			o.service_percent,
			o.service_amount,
			COALESCE(o.discount_percent, 0) AS discount_percent,
			COALESCE(o.discount_amount, 0) AS discount_amount,
			o.grand_total,
			o.payment_type::text AS payment_type
		FROM orders o
		LEFT JOIN cafe_tables ct ON o.table_id = ct.id AND ct.deleted_at = 0
		LEFT JOIN halls h ON ct.hall_id = h.id AND h.deleted_at = 0
		LEFT JOIN users w ON o.waiter_id = w.id AND w.deleted_at = 0
		WHERE o.deleted_at = 0
			AND ($1::timestamptz IS NULL OR o.bill_opened_at >= $1)
			AND ($2::timestamptz IS NULL OR o.bill_opened_at <= $2)
			AND ($3::text IS NULL OR o.bill_status::text = $3)
			AND ($4::text IS NULL OR o.payment_type::text = $4)
			AND ($5::uuid IS NULL OR o.waiter_id = $5)
			AND ($6::uuid IS NULL OR ct.hall_id = $6)
			AND ($7::uuid IS NULL OR o.table_id = $7)
		ORDER BY o.bill_opened_at DESC
		LIMIT $8 OFFSET $9
	`

	var start any
	if arg.Start != nil {
		start = *arg.Start
	}
	var end any
	if arg.End != nil {
		end = *arg.End
	}
	var waiter any
	if arg.WaiterID != nil {
		waiter = *arg.WaiterID
	}
	var hall any
	if arg.HallID != nil {
		hall = *arg.HallID
	}
	var table any
	if arg.TableID != nil {
		table = *arg.TableID
	}

	rows, err := q.db.Query(ctx, sql, start, end, arg.BillStatus, arg.PaymentType, waiter, hall, table, arg.Limit, arg.Offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]BillListRow, 0)
	for rows.Next() {
		var r BillListRow
		if err := rows.Scan(
			&r.ID,
			&r.BillNo,
			&r.BillStatus,
			&r.BillOpenedAt,
			&r.BillClosedAt,
			&r.WaiterID,
			&r.WaiterName,
			&r.TableNumber,
			&r.HallName,
			&r.GuestCount,
			&r.FoodCost,
			&r.FoodTotal,
			&r.ServicePercent,
			&r.ServiceAmount,
			&r.DiscountPercent,
			&r.DiscountAmount,
			&r.GrandTotal,
			&r.PaymentType,
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

func (q *Queries) GetBillDetails(ctx context.Context, orderID uuid.UUID) (BillDetailsRow, error) {
	const sql = `
		SELECT
			o.id,
			o.bill_no,
			o.bill_status::text,
			o.bill_opened_at,
			o.bill_closed_at,
			o.paid_at,
			o.payment_type::text AS payment_type,
			o.table_id,
			ct.number AS table_number,
			h.name AS hall_name,
			o.waiter_id,
			w.full_name AS waiter_name,
			o.cashier_id,
			c.full_name AS cashier_name,
			o.guest_count,
			o.food_cost,
			o.food_total,
			o.service_percent,
			o.service_amount,
			COALESCE(o.discount_percent, 0) AS discount_percent,
			COALESCE(o.discount_amount, 0) AS discount_amount,
			o.discount_comment,
			o.grand_total,
			o.comment
		FROM orders o
		LEFT JOIN cafe_tables ct ON o.table_id = ct.id AND ct.deleted_at = 0
		LEFT JOIN halls h ON ct.hall_id = h.id AND h.deleted_at = 0
		LEFT JOIN users w ON o.waiter_id = w.id AND w.deleted_at = 0
		LEFT JOIN users c ON o.cashier_id = c.id AND c.deleted_at = 0
		WHERE o.id = $1 AND o.deleted_at = 0
	`
	row := q.db.QueryRow(ctx, sql, orderID)
	var out BillDetailsRow
	var paymentType pgtype.Text
	if err := row.Scan(
		&out.ID,
		&out.BillNo,
		&out.BillStatus,
		&out.BillOpenedAt,
		&out.BillClosedAt,
		&out.PaidAt,
		&paymentType,
		&out.TableID,
		&out.TableNumber,
		&out.HallName,
		&out.WaiterID,
		&out.WaiterName,
		&out.CashierID,
		&out.CashierName,
		&out.GuestCount,
		&out.FoodCost,
		&out.FoodTotal,
		&out.ServicePercent,
		&out.ServiceAmount,
		&out.DiscountPercent,
		&out.DiscountAmount,
		&out.DiscountComment,
		&out.GrandTotal,
		&out.Comment,
	); err != nil {
		return BillDetailsRow{}, err
	}
	if paymentType.Valid {
		s := paymentType.String
		out.PaymentType = &s
	}
	return out, nil
}

func (q *Queries) GetBillItems(ctx context.Context, orderID uuid.UUID) ([]BillItemRow, error) {
	const sql = `
		SELECT
			oi.id,
			oi.order_id,
			oi.good_id,
			g.name AS good_name,
			oi.quantity,
			oi.price,
			oi.status::text,
			oi.comment
		FROM order_items oi
		LEFT JOIN goods g ON oi.good_id = g.id AND g.deleted_at = 0
		WHERE oi.order_id = $1 AND oi.deleted_at = 0
		ORDER BY oi.created_at ASC
	`
	rows, err := q.db.Query(ctx, sql, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]BillItemRow, 0)
	for rows.Next() {
		var r BillItemRow
		if err := rows.Scan(
			&r.ID,
			&r.OrderID,
			&r.GoodID,
			&r.GoodName,
			&r.Quantity,
			&r.Price,
			&r.Status,
			&r.Comment,
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

func (q *Queries) GetOrderStockConsumedAt(ctx context.Context, orderID uuid.UUID) (pgtype.Timestamptz, error) {
	const sql = `SELECT stock_consumed_at FROM orders WHERE id = $1 AND deleted_at = 0`
	row := q.db.QueryRow(ctx, sql, orderID)
	var t pgtype.Timestamptz
	if err := row.Scan(&t); err != nil {
		return pgtype.Timestamptz{}, err
	}
	return t, nil
}

func (q *Queries) GetOrderStockConsumedAtForUpdate(ctx context.Context, orderID uuid.UUID) (pgtype.Timestamptz, error) {
	const sql = `SELECT stock_consumed_at FROM orders WHERE id = $1 AND deleted_at = 0 FOR UPDATE`
	row := q.db.QueryRow(ctx, sql, orderID)
	var t pgtype.Timestamptz
	if err := row.Scan(&t); err != nil {
		return pgtype.Timestamptz{}, err
	}
	return t, nil
}

func (q *Queries) MarkOrderStockConsumed(ctx context.Context, orderID uuid.UUID) error {
	const sql = `UPDATE orders SET stock_consumed_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at = 0`
	_, err := q.db.Exec(ctx, sql, orderID)
	return err
}

func (q *Queries) GetOrderItemsWithStorage(ctx context.Context, orderID uuid.UUID) ([]OrderItemWithStorageRow, error) {
	const sql = `
		SELECT
			oi.good_id,
			oi.quantity,
			d.storage_id
		FROM order_items oi
		JOIN goods g ON oi.good_id = g.id AND g.deleted_at = 0
		LEFT JOIN departments d ON g.department_id = d.id AND d.deleted_at = 0
		WHERE oi.order_id = $1 AND oi.deleted_at = 0
		ORDER BY oi.created_at ASC
	`
	rows, err := q.db.Query(ctx, sql, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]OrderItemWithStorageRow, 0)
	for rows.Next() {
		var r OrderItemWithStorageRow
		if err := rows.Scan(&r.GoodID, &r.Quantity, &r.StorageID); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}
