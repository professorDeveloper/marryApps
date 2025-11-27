package model

// LoginRequest represents login request body
type LoginRequest struct {
	Username string `json:"username" example:"user@example.com"`
	Password string `json:"password" example:"password123"`
}

// LoginResponse represents successful login response
type LoginResponse struct {
	Token string `json:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Message string `json:"message" example:"error message"`
}
