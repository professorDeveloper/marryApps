package service

import (
	"context"
	"fmt"
	"math/big"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

func isZeroNumeric(n pgtype.Numeric) bool {
	if !n.Valid {
		return true
	}

	r, err := ratFromNumeric(n)
	if err != nil {
		return false
	}

	return r.Cmp(big.NewRat(0, 1)) == 0
}

func shouldSkipStockMovement(qtyIn, qtyOut pgtype.Numeric) bool {
	return isZeroNumeric(qtyIn) && isZeroNumeric(qtyOut)
}

func validateNonZeroStockMovement(qtyIn, qtyOut pgtype.Numeric, eventType string) error {
	if shouldSkipStockMovement(qtyIn, qtyOut) {
		return fmt.Errorf("skip empty stock movement for event_type=%s", eventType)
	}
	return nil
}

func inventoryZeroNumeric() pgtype.Numeric {
	n := pgtype.Numeric{}
	_ = n.Scan("0")
	return n
}

func ratFromNumeric(n pgtype.Numeric) (*big.Rat, error) {
	s := numericToString(n)
	r := new(big.Rat)
	if _, ok := r.SetString(s); !ok {
		return nil, fmt.Errorf("invalid numeric: %s", s)
	}
	return r, nil
}

func numericToString(n pgtype.Numeric) string {
	if !n.Valid {
		return "0"
	}
	if n.NaN {
		return "NaN"
	}
	if n.InfinityModifier > 0 {
		return "Infinity"
	}
	if n.InfinityModifier < 0 {
		return "-Infinity"
	}

	if n.Int == nil {
		return "0"
	}

	isNegative := n.Int.Sign() < 0
	var absStr string
	if isNegative {
		absStr = new(big.Int).Abs(new(big.Int).Set(n.Int)).String()
	} else {
		absStr = n.Int.String()
	}

	str := absStr
	if n.Exp < 0 {
		exp := -int(n.Exp)
		if exp >= len(str) {
			str = "0." + strings.Repeat("0", exp-len(str)) + str
		} else {
			str = str[:len(str)-exp] + "." + str[len(str)-exp:]
		}
	} else if n.Exp > 0 {
		str = str + strings.Repeat("0", int(n.Exp))
	}
	if strings.Contains(str, ".") {
		str = strings.TrimRight(strings.TrimRight(str, "0"), ".")
	}
	if str == "" || str == "-0" {
		return "0"
	}

	if isNegative && str != "0" {
		str = "-" + str
	}
	return str
}

func numericFromRat(r *big.Rat, scale int) (pgtype.Numeric, error) {
	n := pgtype.Numeric{}
	if err := n.Scan(r.FloatString(scale)); err != nil {
		return pgtype.Numeric{}, err
	}
	return n, nil
}

func addNumericSafe(a, b pgtype.Numeric, scale int) (pgtype.Numeric, error) {
	ra, err := ratFromNumeric(a)
	if err != nil {
		return pgtype.Numeric{}, err
	}
	rb, err := ratFromNumeric(b)
	if err != nil {
		return pgtype.Numeric{}, err
	}

	out := new(big.Rat).Add(ra, rb)
	return numericFromRat(out, scale)
}

func subNumeric(a, b pgtype.Numeric, scale int) (pgtype.Numeric, error) {
	ra, err := ratFromNumeric(a)
	if err != nil {
		return pgtype.Numeric{}, err
	}
	rb, err := ratFromNumeric(b)
	if err != nil {
		return pgtype.Numeric{}, err
	}

	out := new(big.Rat).Sub(ra, rb)
	return numericFromRat(out, scale)
}

func applyMovementDelta(balance, qtyIn, qtyOut pgtype.Numeric, scale int) (pgtype.Numeric, error) {
	withIn, err := addNumericSafe(balance, qtyIn, scale)
	if err != nil {
		return pgtype.Numeric{}, err
	}
	return subNumeric(withIn, qtyOut, scale)
}

// rebalanceIngredientStockLedger is a shared helper for rebalancing stock ledger across all entity types.
// It recalculates stock_before/stock_after for all movements and syncs the final stock quantity.
// This helper is tenant-safe and tx-safe - it accepts q *pg.Queries and works within the caller's transaction.
func rebalanceIngredientStockLedger(
	ctx context.Context,
	q *pg.Queries,
	storageID pgtype.UUID,
	ingredientID uuid.UUID,
	entityName string,
) error {
	if !storageID.Valid {
		return fmt.Errorf("storage_id is required for %s ledger rebalance", entityName)
	}

	_, _ = q.EnsureIngredientStockByStorage(ctx, pg.EnsureIngredientStockByStorageParams{
		ID:           uuid.New(),
		IngredientID: ingredientID,
		StorageID:    storageID,
	})

	rows, err := q.ListIngredientStockMovementsForRebalance(ctx, storageID.Bytes, ingredientID)
	if err != nil {
		return fmt.Errorf("failed to list %s stock movements for rebalance: %w", entityName, err)
	}

	running := inventoryZeroNumeric()

	for _, row := range rows {
		before := running

		after, err := applyMovementDelta(before, row.QtyIn, row.QtyOut, 6)
		if err != nil {
			return fmt.Errorf("failed to calculate %s balance for movement %s: %w", entityName, row.ID, err)
		}

		if err := q.UpdateIngredientStockMovementBalances(ctx, pg.UpdateIngredientStockMovementBalancesParams{
			ID:          row.ID,
			StockBefore: before,
			StockAfter:  after,
		}); err != nil {
			return fmt.Errorf("failed to update %s balances for movement %s: %w", entityName, row.ID, err)
		}

		running = after
	}

	stockRow, err := q.GetStockByIngredientAndStorageForUpdate(ctx, pg.GetStockByIngredientAndStorageForUpdateParams{
		IngredientID: ingredientID,
		StorageID:    storageID,
	})
	if err != nil {
		return fmt.Errorf("failed to lock ingredient stock for %s final sync: %w", entityName, err)
	}

	if _, err := q.UpdateIngredientStock(ctx, pg.UpdateIngredientStockParams{
		ID:       stockRow.ID,
		Quantity: running,
	}); err != nil {
		return fmt.Errorf("failed to sync ingredient_stock quantity after %s rebalance: %w", entityName, err)
	}

	return nil
}
