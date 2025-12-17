package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/blitz/back/internal/model"
	"gitlab.yurtal.tech/company/blitz/back/internal/repository/pg"
)

type PaymeClient interface {
	CreateInvoice(orderNumber int32, amount float64) (*model.CheckoutURL, error)
}

func (s *PaymentS) CreatePaymeInvoice(c echo.Context, ctx context.Context) (*model.CheckoutURL, error) {
	userID := c.Get("user_id").(string)
	if userID == "" {
		return nil, fmt.Errorf("user not authenticated")
	}
	user ,err := s.repo.PgRepo.Repo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("error finding user: %w", err)
	}
	priceForLevel, err := s.repo.PgRepo.Repo.GetPaymentPriceForLevelByLevel(ctx, user.Group)
	if err != nil {
		return nil, fmt.Errorf("error finding price for level: %w", err)
	}

	membershipType, err := s.repo.PgRepo.Repo.GetPaymentPriceForLevel(ctx, priceForLevel.ID)
	if err != nil {
		return nil, fmt.Errorf("error finding membership type: %w", err)
	}

	if membershipType.Amount == nil || *membershipType.Amount <= 0 {
		return nil, fmt.Errorf("invalid amount: %v", membershipType.Amount)
	}

	payments, err := s.repo.PgRepo.Repo.GetPayments(ctx)
	var orderNumber int32 = 1000000
	if err == nil && len(payments) > 0 {
		for _, payment := range payments {
			if payment.OrderNumber != nil && *payment.OrderNumber >= orderNumber {
				orderNumber = *payment.OrderNumber + 1
			}
		}
	}

	paymentID := uuid.NewString()
	provider := "payme"
	amount := *membershipType.Amount

	createPaymentParams := pg.CreatePaymentParams{
		ID:             paymentID,
		Student:        userID,
		PriceForLevel: priceForLevel.ID,
		Amount:         &amount,
		Provider:       &provider,
		OrderNumber:    &orderNumber,
	}

	_, err = s.repo.PgRepo.Repo.CreatePayment(ctx, createPaymentParams)
	if err != nil {
		return nil, fmt.Errorf("failed to save payment record: %w", err)
	}

	invoice, err := s.paymeClient.CreateInvoice(int(orderNumber), float64(amount)*100)
	if err != nil {
		return nil, fmt.Errorf("failed to create invoice: %w", err)
	}

	return invoice, nil
}
