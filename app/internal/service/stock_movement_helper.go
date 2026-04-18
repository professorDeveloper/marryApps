package service

import (
	"fmt"
	"math/big"

	"github.com/jackc/pgx/v5/pgtype"
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