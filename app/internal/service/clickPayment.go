package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/config"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
	"gitlab.yurtal.tech/company/maryai/back/pkg/paymentClick"
	"gitlab.yurtal.tech/company/maryai/back/pkg/paymentPayme"
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

func (s *PaymentS) CreateInvoice(c echo.Context, ctx context.Context, planID string) (*model.CheckoutURL, error) {
	userIDStr, _ := c.Get("user_id").(string)
	if userIDStr == "" {
		return nil, fmt.Errorf("user not authenticated")
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid user id: %w", err)
	}

	planUUID, err := uuid.Parse(planID)
	if err != nil {
		return nil, fmt.Errorf("invalid plan_id: %w", err)
	}

	plan, err := s.repo.Tenant(ctx).GetPriceForPlan(ctx, planUUID)
	if err != nil {
		return nil, fmt.Errorf("plan not found: %w", err)
	}
	if plan.Amount <= 0 {
		return nil, fmt.Errorf("invalid amount: %v", plan.Amount)
	}

	payments, err := s.repo.Tenant(ctx).GetUserPayments(ctx)
	var orderNumber int32 = 1000000
	if err == nil && len(payments) > 0 {
		for _, payment := range payments {
			if payment.OrderNumber >= orderNumber {
				orderNumber = payment.OrderNumber + 1
			}
		}
	}

	createPaymentParams := pg.CreateUserPaymentParams{
		ID:             uuid.New(),
		UserID:         userID,
		PriceForPlanID: plan.ID,
		Provider:       "click",
		OrderNumber:    orderNumber,
		Amount:         plan.Amount,
	}

	_, err = s.repo.Tenant(ctx).CreateUserPayment(ctx, createPaymentParams)
	if err != nil {
		return nil, fmt.Errorf("failed to save payment record: %w", err)
	}

	invoice, err := s.clickClient.CreateInvoice(int(orderNumber), float64(plan.Amount))
	if err != nil {
		return nil, fmt.Errorf("failed to create invoice: %w", err)
	}

	return invoice, nil
}
