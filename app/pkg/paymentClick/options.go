package paymentClick

type Option func(client *Client)

func BaseUrl(baseUrl string) Option {
	return func(c *Client) {
		c.baseUrl = baseUrl
	}
}

func MerchantUserId(merchantUserId string) Option {
	return func(c *Client) {
		c.merchantUserId = merchantUserId
	}
}

func SecretKey(secretKey string) Option {
	return func(c *Client) {
		c.secretKey = secretKey
	}
}

func ServiceId(serviceId string) Option {
	return func(c *Client) {
		c.serviceId = serviceId
	}
}

func MerchantId(merchantId string) Option {
	return func(c *Client) {
		c.merchantId = merchantId
	}
}

func ReturnUrl(returnUrl string) Option {
	return func(c *Client) {
		c.returnUrl = returnUrl
	}
}
