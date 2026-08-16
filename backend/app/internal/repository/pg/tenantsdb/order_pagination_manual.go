package pg

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

const countFilteredOrders = `
SELECT COUNT(*)
FROM orders
WHERE deleted_at = 0
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND (
        $1::text IS NULL
        OR order_type = $1::text
      )
  AND (
        $2::order_status IS NULL
        OR status = $2::order_status
      )
  AND (
        $3::uuid IS NULL
        OR table_id = $3::uuid
      )
  AND (
        $4::timestamptz IS NULL
        OR created_at >= $4::timestamptz
      )
  AND (
        $5::timestamptz IS NULL
        OR created_at < $5::timestamptz
      )
`

func (q *Queries) CountFilteredOrders(ctx context.Context, arg GetAllOrdersParams) (int64, error) {
	row := q.db.QueryRow(ctx, countFilteredOrders,
		arg.OrderType,
		arg.Status,
		arg.TableID,
		arg.PeriodStart,
		arg.PeriodEnd,
	)

	var count int64
	err := row.Scan(&count)
	return count, err
}

const countOrdersByWaiterID = `
SELECT COUNT(*)
FROM orders
WHERE waiter_id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
`

func (q *Queries) CountOrdersByWaiterID(ctx context.Context, waiterID pgtype.UUID) (int64, error) {
	row := q.db.QueryRow(ctx, countOrdersByWaiterID, waiterID)

	var count int64
	err := row.Scan(&count)
	return count, err
}

const countMyWaiterOrders = `
SELECT COUNT(*)
FROM orders o
WHERE o.waiter_id = $1::uuid
  AND o.deleted_at = 0
  AND (
        $2::text = 'all'
        OR (
            $2::text = 'active'
            AND (
                o.status IN ('open', 'cooking', 'ready', 'served')
                OR (o.order_type = 'takeaway' AND o.status = 'paid')
            )
        )
        OR (
            $2::text = 'reservations'
            AND o.status IN ('reserved', 'rescheduled')
        )
        OR (
            $2::text = 'history'
            AND o.status IN ('paid', 'cancelled')
        )
      )
  AND (
        $3::text IS NULL
        OR o.order_type = $3::text
      )
  AND (
        $4::uuid IS NULL
        OR o.table_id = $4::uuid
      )
  AND (
        CASE
            WHEN o.status IN ('reserved', 'rescheduled') AND o.scheduled_at IS NOT NULL
                THEN o.scheduled_at
            ELSE o.created_at
        END
      ) >= $5::timestamptz
  AND (
        CASE
            WHEN o.status IN ('reserved', 'rescheduled') AND o.scheduled_at IS NOT NULL
                THEN o.scheduled_at
            ELSE o.created_at
        END
      ) < $6::timestamptz
`

func (q *Queries) CountMyWaiterOrders(ctx context.Context, arg GetMyWaiterOrdersParams) (int64, error) {
	row := q.db.QueryRow(ctx, countMyWaiterOrders,
		arg.WaiterID,
		arg.Scope,
		arg.OrderType,
		arg.TableID,
		arg.DayStart,
		arg.DayEnd,
	)

	var count int64
	err := row.Scan(&count)
	return count, err
}

const countOrdersByTableID = `
SELECT COUNT(*)
FROM orders
WHERE table_id = $1
  AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
  AND deleted_at = 0
`

func (q *Queries) CountOrdersByTableID(ctx context.Context, tableID uuid.UUID) (int64, error) {
	row := q.db.QueryRow(ctx, countOrdersByTableID, tableID)

	var count int64
	err := row.Scan(&count)
	return count, err
}
