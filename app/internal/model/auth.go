package model

type User struct {
	ID       string  `json:"id"`
	FullName *string `json:"fullName,omitempty"`
	Email    *string `json:"email,omitempty"`
	Role     *string `json:"role,omitempty"`
	Gender   *string `json:"gender,omitempty"`
	Status   *string `json:"status,omitempty"`
	Photo    *string `json:"photo,omitempty"`
}
// LoginRequest represents login request body
	type LoginRequest struct {
		PhoneNumber string `json:"phoneNumber" example:"1234567890"`
		Password string `json:"password" example:"password123"`
	}
type GoogleAuthRequest struct {
	IDToken string `json:"id_token"`
	AppType string `json:"app_type"`
}
type LoginEmailRequest struct {
	Email string `json:"email" example:"user@example.com"`
	IdToken string `json:"id_token"`
	FullName string `json:"full_name"`
}

// LoginResponse represents successful login response
type LoginResponse struct {
	AccessToken string       `json:"accessToken" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	RefreshToken string       `json:"refreshToken" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	User  UserResponse `json:"user"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Message string `json:"message" example:"error message"`
}

// RegisterRequest represents registration request body
type RegisterRequest struct {
	FullName string `json:"fullName"`
	PhoneNumber   string `json:"phoneNumber"`
	Password string `json:"password"`
}

// UserResponse represents a safe subset of user data returned to clients
type UserResponse struct {
	ID       string  `json:"id"`
	FullName *string `json:"fullName,omitempty"`
	Email    *string `json:"email,omitempty"`
	Role     *string `json:"role,omitempty"`
	Gender   *string `json:"gender,omitempty"`
	Status   *string `json:"status,omitempty"`
	Photo    *string `json:"photo,omitempty"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refreshToken"`
}

type LogoutRequest struct {
	AccessToken string `json:"accessToken"`
}

type RefreshResponse struct {
	AccessToken string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}
type LogoutResponse struct {
	Message string `json:"message"`
}