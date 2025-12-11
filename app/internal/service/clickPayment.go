package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/blitz/back/internal/config"
	"gitlab.yurtal.tech/company/blitz/back/internal/model"
	"gitlab.yurtal.tech/company/blitz/back/internal/repository"
	"gitlab.yurtal.tech/company/blitz/back/internal/repository/pg"
	"gitlab.yurtal.tech/company/blitz/back/pkg/paymentClick"
	"gitlab.yurtal.tech/company/blitz/back/pkg/paymentPayme"
)

type PaymentS struct {
	cfg         *config.Config
	repo        *repository.Repository
	clickClient *paymentClick.Client
	paymeClient *paymentPayme.Client
}

func NewPaymentS(cfg *config.Config, repo *repository.Repository, clickClient *paymentClick.Client, paymeClient *paymentPayme.Client) *PaymentS {
	return &PaymentS{
		cfg:         cfg,
		repo:        repo,
		clickClient: clickClient,
		paymeClient: paymeClient,
	}
}

func (s *PaymentS) CreateInvoice(c echo.Context, ctx context.Context) (*model.CheckoutURL, error) {
	userID := c.Get("user_id").(string)
	if userID == "" {
		return nil, fmt.Errorf("user not authenticated")
	}
	user ,err := s.repo.PgRepo.Repo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("error finding user: %w", err)
	}
	priceForLevel, err := s.repo.PgRepo.Repo.GetPaymentPriceForLevelByLevel(ctx, user.Level)
	if err != nil {
		return nil, fmt.Errorf("error finding price for level: %w", err)
	}

	priceLevel, err := s.repo.PgRepo.Repo.GetPaymentPriceForLevel(ctx, priceForLevel.ID)
	if err != nil {
		return nil, fmt.Errorf("membership type not found: %w", err)
	}

	if priceLevel.Amount == nil || *priceLevel.Amount <= 0 {
		return nil, fmt.Errorf("invalid amount: %v", priceLevel.Amount)
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
	provider := "click"
	amount := *priceLevel.Amount

	createPaymentParams := pg.CreatePaymentParams{
		ID:             paymentID,
		Student:        userID,
		PriceForLevel: priceLevel.ID,
		Amount:         &amount,
		Provider:       &provider,
		OrderNumber:    &orderNumber,
	}

	_, err = s.repo.PgRepo.Repo.CreatePayment(ctx, createPaymentParams)
	if err != nil {
		return nil, fmt.Errorf("failed to save payment record: %w", err)
	}

	invoice, err := s.clickClient.CreateInvoice(int(orderNumber), float64(amount))
	if err != nil {
		return nil, fmt.Errorf("failed to create invoice: %w", err)
	}

	return invoice, nil
}
