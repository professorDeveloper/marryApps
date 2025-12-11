package paymentPayme

type Option func(client *Client)

func BaseUrl(baseUrl string) Option {
	return func(c *Client) {
		c.baseUrl = baseUrl
	}
}

func ClientKey(clientKey string) Option {
	return func(c *Client) {
		c.clientKey = clientKey
	}
}

func MerchantId(merchantId string) Option {
	return func(c *Client) {
		c.merchantId = merchantId
	}
}

func Login(login string) Option {
	return func(c *Client) {
		c.login = login
	}
}

func Password(password string) Option {
	return func(c *Client) {
		c.password = password
	}
}

func ReturnUrl(returnUrl string) Option {
	return func(c *Client) {
		c.returnUrl = returnUrl
	}
}