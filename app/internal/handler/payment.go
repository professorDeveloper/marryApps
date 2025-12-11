package handler

import (
	"crypto/md5"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/blitz/back/internal/model"
)

func ClickResponsePrepare(req *model.ClickCompleteRequest, prepareID int64, code int, note string) model.ClickPrepareResponse {
	return model.ClickPrepareResponse{
		ClickTransID:      req.ClickTransID,
		MerchantTransID:   req.MerchantTransID,
		MerchantPrepareID: prepareID,
		Error:             code,
		ErrorNote:         note,
	}
}

func ClickResponseConfirm(req *model.ClickCompleteRequest, confirmID int64, code int, note string) model.ClickConfirmResponse {
	return model.ClickConfirmResponse{
		ClickTransID:      req.ClickTransID,
		MerchantTransID:   req.MerchantTransID,
		MerchantConfirmID: confirmID,
		Error:             code,
		ErrorNote:         note,
	}
}

func GenerateClickSignForPrepare(clickTransID, serviceID, secretKey, merchantTransID string, amount float64, action int, signTime string) string {
	amountInt := int64(amount)

	str := fmt.Sprintf("%s%s%s%s%d%d%s",
		clickTransID,
		serviceID,
		secretKey,
		merchantTransID,
		amountInt,
		action,
		signTime,
	)

	hash := md5.Sum([]byte(str))
	sign := hex.EncodeToString(hash[:])
	log.Printf("Sign String: %s", str)
	log.Printf("Generated Sign: %s", sign)
	return sign
}

func GenerateClickSignForComplete(clickTransID, serviceID, secretKey, merchantTransID, merchantPrepareID string, amount float64, action int, signTime string) string {
	amountInt := int64(amount)

	str := fmt.Sprintf("%s%s%s%s%s%d%d%s",
		clickTransID,
		serviceID,
		secretKey,
		merchantTransID,
		merchantPrepareID,
		amountInt,
		action,
		signTime,
	)

	hash := md5.Sum([]byte(str))
	sign := hex.EncodeToString(hash[:])
	log.Printf("Complete Sign String: %s", str)
	log.Printf("Complete Generated Sign: %s", sign)
	return sign
}

// CreateInvoice godoc
// @Summary Create a new payment invoice
// @Description Creates a new payment invoice for the authenticated user
// @Tags payments
// @Accept json
// @Produce json
// @Param Authorization header string true "Bearer token" default(Bearer <your_token>)
// @Param request body model.IndexCreation true "Invoice creation request"
// @Success 200 {object} model.CreateInvoiceResponse "Successfully created invoice"
// @Failure 400 {object} model.CreateInvoiceResponse "Invalid request or missing required fields"
// @Failure 401 {object} model.CreateInvoiceResponse "Unauthorized - User not authenticated"
// @Failure 500 {object} model.CreateInvoiceResponse "Internal server error"
// @Router /payments/create [post]
func (h *Handler) CreateInvoice(c echo.Context) error {
	userID := c.Get("user_id").(string)
	if userID == "" {
		return c.JSON(http.StatusUnauthorized, model.CreateInvoiceResponse{
			Error:     -2,
			ErrorNote: "User not authenticated",
		})
	}

	var req model.IndexCreation
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to decode request body: %v", err)
		return c.JSON(http.StatusBadRequest, model.CreateInvoiceResponse{
			Error:     -1,
			ErrorNote: "Invalid request format",
		})
	}

	if req.Provider == "" {
		return c.JSON(http.StatusBadRequest, model.CreateInvoiceResponse{
			Error:     -5,
			ErrorNote: "Provider is required",
		})
	}

	var invoice *model.CheckoutURL
	var err error

	switch req.Provider {
	case "click":
		invoice, err = h.service.Payment().CreateInvoice(c, c.Request().Context())
	case "payme":
		invoice, err = h.service.Payment().CreatePaymeInvoice(c, c.Request().Context())
	default:
		return c.JSON(http.StatusBadRequest, model.CreateInvoiceResponse{
			Error:     -5,
			ErrorNote: "Invalid provider. Must be 'click' or 'payme'",
		})
	}

	if err != nil {
		log.Printf("Failed to create %s invoice: %v", req.Provider, err)

		errorNote := "Failed to create payment"
		errorCode := -9

		switch {
		case errors.Is(err, fmt.Errorf("user not found")):
			errorCode = -2
			errorNote = "User not authenticated"
		case errors.Is(err, fmt.Errorf("payment not found")):
			errorCode = -5
			errorNote = "Order not found"
		case errors.Is(err, fmt.Errorf("membership not found")):
			errorCode = -6
			errorNote = "Membership not found"
		case errors.Is(err, fmt.Errorf("invalid amount")):
			errorCode = -2
			errorNote = "Invalid amount"
		}

		return c.JSON(http.StatusOK, model.CreateInvoiceResponse{
			Error:     errorCode,
			ErrorNote: errorNote,
		})
	}

	return c.JSON(http.StatusOK, model.CreateInvoiceResponse{
		Error:     0,
		ErrorNote: "Success",
		Data: struct {
			PaymentURL string `json:"payment_url"`
			ID         string `json:"id"`
		}{
			PaymentURL: invoice.PaymentURL,
			ID:         invoice.Order,
		},
	})
}
