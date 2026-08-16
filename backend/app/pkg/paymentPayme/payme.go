package paymentPayme

import (
	"encoding/base64"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

type Client struct {
	logger     *slog.Logger
	httpClient *http.Client
	baseUrl    string
	clientKey  string
	merchantId string
	returnUrl  string
	login      string
	password   string
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

func (c *Client) GenerateCheckoutURL(order string, amount int64) string {
	var params []string

	params = append(params, fmt.Sprintf("m=%s", c.merchantId))
	params = append(params, fmt.Sprintf("ac.order=%s", order))
	params = append(params, fmt.Sprintf("a=%d", amount))

	if c.returnUrl != "" {
		params = append(params, fmt.Sprintf("c=%s", c.returnUrl))
	}
	paramsStr := strings.Join(params, ";")
	fmt.Println("param:", paramsStr)
	encodedParams := base64.StdEncoding.EncodeToString([]byte(paramsStr))
	return fmt.Sprintf("%s/%s", c.baseUrl, encodedParams)
}

func (c *Client) CreateInvoice(order int, amount float64) (*model.CheckoutURL, error) {
	c.logger.Info("Payme: CreateInvoice", "order", order, "amount", amount)

	amountInTiyin := int64(amount * 100)

	checkoutURL := c.GenerateCheckoutURL(strconv.Itoa(order), amountInTiyin)

	c.logger.Info("Payme: Generated checkout URL", "url", checkoutURL)

	response := &model.CheckoutURL{
		Error:      0,
		ErrorNote:  "",
		PaymentURL: checkoutURL,
		Order:      strconv.Itoa(order),
	}

	return response, nil
}
