package inventory_report_test

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

func TestAvailableTablesExcludeTablesWithActiveOrders(t *testing.T) {
	ctx := context.Background()

	tx, err := globalEnv.pool.Begin(ctx)
	require.NoError(t, err)
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, "SET LOCAL app.branch_id = $1", globalEnv.branchID.String())
	require.NoError(t, err)

	q := pg.New(tx)

	hallID := uuid.New()
	freeTableID := uuid.New()
	blockedTableID := uuid.New()
	orderID := uuid.New()

	_, err = tx.Exec(ctx, `
		INSERT INTO halls (id, branch_id, name, deleted_at)
		VALUES ($1, $2, 'Test Hall', 0)
	`, hallID, globalEnv.branchID)
	require.NoError(t, err)

	_, err = tx.Exec(ctx, `
		INSERT INTO cafe_tables (id, hall_id, number, capacity, status, deleted_at)
		VALUES
			($1, $2, 1, 4, 'free', 0),
			($3, $2, 2, 6, 'free', 0)
	`, freeTableID, hallID, blockedTableID)
	require.NoError(t, err)

	_, err = tx.Exec(ctx, `
		INSERT INTO orders (id, table_id, branch_id, status, total_amount, order_type, deleted_at)
		VALUES ($1, $2, $3, 'open', 0, 'dine_in', 0)
	`, orderID, blockedTableID, globalEnv.branchID)
	require.NoError(t, err)

	availableByHall, err := q.GetAvailableTablesByHall(ctx, hallID)
	require.NoError(t, err)
	require.Len(t, availableByHall, 1)
	require.Equal(t, freeTableID, availableByHall[0].ID)

	availableByCapacity, err := q.GetAvailableTablesByCapacity(ctx, pg.GetAvailableTablesByCapacityParams{
		Capacity: 4,
		Limit:    10,
		Offset:   0,
	})
	require.NoError(t, err)
	require.Len(t, availableByCapacity, 1)
	require.Equal(t, freeTableID, availableByCapacity[0].ID)

	availableByHallAndCapacity, err := q.GetAvailableTablesByHallAndCapacity(ctx, pg.GetAvailableTablesByHallAndCapacityParams{
		HallID:   hallID,
		Capacity: 4,
	})
	require.NoError(t, err)
	require.Len(t, availableByHallAndCapacity, 1)
	require.Equal(t, freeTableID, availableByHallAndCapacity[0].ID)
}
