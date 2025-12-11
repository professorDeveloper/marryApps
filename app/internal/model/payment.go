package model

type ClickCompleteRequest struct {
	ClickTransID      int64   `json:"click_trans_id"`
	ServiceID         int     `json:"service_id"`
	ClickPaydocID     int64   `json:"click_paydoc_id"`
	MerchantTransID   string  `json:"merchant_trans_id"`
	MerchantPrepareID int64   `json:"merchant_prepare_id"`
	Amount            float64 `json:"amount"`
	Action            int     `json:"action"`
	Error             int     `json:"error"`
	ErrorNote         string  `json:"error_note"`
	SignTime          string  `json:"sign_time"`
	SignString        string  `json:"sign_string"`
}

type ClickPrepareResponse struct {
	ClickTransID      int64  `json:"click_trans_id"`
	MerchantTransID   string `json:"merchant_trans_id"`
	MerchantPrepareID int64  `json:"merchant_prepare_id"`
	Error             int    `json:"error"`
	ErrorNote         string `json:"error_note"`
}
type ClickConfirmResponse struct {
	ClickTransID      int64  `json:"click_trans_id"`
	MerchantTransID   string `json:"merchant_trans_id"`
	MerchantConfirmID int64  `json:"merchant_confirm_id"`
	Error             int    `json:"error"`
	ErrorNote         string `json:"error_note"`
}
type IndexCreation struct {
	Provider string `json:"provider"`
}

type CreateInvoiceResponse struct {
	Error     int    `json:"error"`
	ErrorNote string `json:"error_note"`
	Data      struct {
		PaymentURL string `json:"payment_url"`
		ID         string `json:"id"`
	}
}

type PaymeErrorResponse struct {
	ID     string `json:"id"`
	Result any    `json:"result,omitempty"`
	Error  *struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

type CheckoutURL struct {
	Error      int    `json:"error"`
	ErrorNote  string `json:"error_note"`
	PaymentURL string `json:"payment_url"`
	Order      string `json:"order"`
}

type ErrorResponseForPayme struct {
	Error ErrorDetails `json:"error"`
	ID    int          `json:"id"`
}

type ErrorDetails struct {
	Code    int               `json:"code"`
	Message map[string]string `json:"message"`
	Data    string            `json:"data"`
}

func CreateError(requestID int, errorCode int, messages map[string]string, errorData string) ErrorResponseForPayme {
	return ErrorResponseForPayme{
		Error: ErrorDetails{
			Code:    errorCode,
			Message: messages,
			Data:    errorData,
		},
		ID: requestID,
	}
}

type PaymeRPCRequest struct {
	Method string `json:"method"`
	Params struct {
		ID      string `json:"id"`
		From    *int64 `json:"from,omitempty"`
		To      *int64 `json:"to,omitempty"`
		Time    *int64 `json:"time,omitempty"`
		Amount  *int64 `json:"amount,omitempty"`
		Reason  *int   `json:"reason,omitempty"`
		Account *struct {
			Order string `json:"order"`
		} `json:"account,omitempty"`
	} `json:"params"`
	ID int `json:"id"`
}

type CreatePriceForLevelRequest struct {
	Level  string `json:"level"`
	Amount *int32 `json:"amount"`
}

type CreatePriceForLevelResponse struct {
	Error     int                   `json:"error"`
	ErrorNote string                `json:"error_note"`
	Data      PriceForLevelResponse `json:"data,omitempty"`
}

type PriceForLevelResponse struct {
	ID     string `json:"id"`
	Level  string `json:"level"`
	Amount int32  `json:"amount"`
}
