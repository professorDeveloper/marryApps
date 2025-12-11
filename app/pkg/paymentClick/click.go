package paymentClick

import (
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"strconv"

	"gitlab.yurtal.tech/company/blitz/back/internal/model"
)

type Client struct {
	logger         *slog.Logger
	httpClient     *http.Client
	baseUrl        string
	merchantUserId string
	secretKey      string
	merchantId     string
	serviceId      string
	returnUrl      string
}

func NewClient(logger *slog.Logger, httpClient *http.Client, options ...Option) *Client {
	client := &Client{
		logger:     logger,
		httpClient: httpClient,
	}

	for _, opt := range options {
		opt(client)
	}
	return client
}

func (vc *Client) GenerateRedirectURL(orderID string, amount float64) string {
	params := url.Values{}
	params.Set("service_id", vc.serviceId)
	params.Set("merchant_id", vc.merchantId)
	params.Set("amount", fmt.Sprintf("%.2f", amount))
	params.Set("transaction_param", orderID)
	params.Set("merchant_user_id", vc.merchantUserId)
	params.Set("return_url", vc.returnUrl)

	return vc.baseUrl + "?" + params.Encode()
}

func (vc *Client) CreateInvoice(orderID int, amount float64) (*model.CheckoutURL, error) {
	vc.logger.Info("Click: CreateInvoice", "orderID", orderID, "amount", amount)
	redirectURL := vc.GenerateRedirectURL(strconv.Itoa(orderID), amount)

	response := &model.CheckoutURL{
		Error:      0,
		ErrorNote:  "",
		PaymentURL: redirectURL,
		Order:      strconv.Itoa(orderID),
	}

	return response, nil
}
