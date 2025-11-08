package minio

type Option func(*Minio)

func Endpoint(endpoint string) Option {
	return func(c *Minio) {
		c.endpoint = endpoint
	}
}

func AccessKeyID(accessKeyID string) Option {
	return func(c *Minio) {
		c.accessKeyID = accessKeyID
	}
}

func SecretAccessKey(secretAccessKey string) Option {
	return func(c *Minio) {
		c.secretAccessKey = secretAccessKey
	}
}

func UseSSL(useSSL bool) Option {
	return func(c *Minio) {
		c.useSSL = useSSL
	}
}
