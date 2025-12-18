package model

import (
	"strings"
	"time"
)

type User struct {
	ID       string  `json:"id"`
	FullName *string `json:"fullName,omitempty"`
	Email    *string `json:"email,omitempty"`
	Role     *string `json:"role,omitempty"`
	Gender   *string `json:"gender,omitempty"`
	Status   *string `json:"status,omitempty"`
	Photo    *string `json:"photo,omitempty"`
}

type RegisterResponse struct {
	Message string `json:"message"`
}
type LoginRequest struct {
	PhoneNumber string `json:"phoneNumber" example:"+998934722002"`
	Password    string `json:"password" example:"20021220"`
}
type GoogleAuthRequest struct {
	IDToken string `json:"id_token"`
	AppType string `json:"app_type"`
}
type LoginEmailRequest struct {
	Email    string `json:"email" example:"user@example.com"`
	IdToken  string `json:"id_token"`
	FullName string `json:"full_name"`
}

type LoginResponse struct {
	AccessToken  string       `json:"accessToken" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	RefreshToken string       `json:"refreshToken" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	User         UserResponse `json:"user"`
}

type ErrorResponse struct {
	Message string `json:"message" example:"error message"`
}

// Date is a custom type for handling dates in YYYY-MM-DD format
type Date struct {
	time.Time
}

// UnmarshalJSON implements the json.Unmarshaler interface for the Date type
func (d *Date) UnmarshalJSON(b []byte) error {
	// Remove the surrounding quotes
	s := strings.Trim(string(b), "\"")
	// Parse the date in YYYY-MM-DD format
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return err
	}
	d.Time = t
	return nil
}

type RegisterRequest struct {
	FullName    string `json:"fullName" example:"Muslimbek Yarashev"`
	PhoneNumber string `json:"phoneNumber" example:"+998934722002"`
	Role        string `json:"role" example:"student"`
	DateOfBirth Date   `json:"dateOfBirth" example:"2002-04-06"`
}

type UserResponse struct {
	ID          string    `json:"id" example:"1234567890"`
	OverAll     *int32    `json:"overAll,omitempty" example:"1"`
	FullName    *string   `json:"fullName,omitempty" example:"John Doe"`
	Email       *string   `json:"email,omitempty" example:"user@example.com"`
	Role        *string   `json:"role,omitempty" example:"user"`
	Gender      *string   `json:"gender,omitempty" example:"male"`
	Status      *string   `json:"status,omitempty" example:"active"`
	Photo       *string   `json:"photo,omitempty" example:"https://example.com/photo.jpg"`
	PhoneNumber *string   `json:"phoneNumber,omitempty" example:"+998901234567"`
	Level       *string   `json:"level,omitempty" example:"level_1"`
	XP          *int32    `json:"xp,omitempty" example:"100"`
	Balance     *int64    `json:"balance,omitempty" example:"1000"`
	Group       *string   `json:"group,omitempty" example:"group_1"`
	IsVerified  *bool     `json:"isVerified,omitempty" example:"true"`
	DateOfBirth time.Time `json:"dateOfBirth,omitempty" example:"2022-01-01T00:00:00Z"`
}

type UpdateUserRequest struct {
	FullName    *string `json:"fullName"`
	Email       *string `json:"email"`
	PhoneNumber *string `json:"phoneNumber"`
	Gender      *string `json:"gender"`
	Photo       *string `json:"photo"`
	DateOfBirth *string `json:"dateOfBirth"`
	Level       *string `json:"level,omitempty"`
	XP          *int32  `json:"xp,omitempty"`
	Balance     *int64  `json:"balance,omitempty"`
	OverAll     *int32  `json:"overAll,omitempty"`
}

type UpdatePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" example:"password123"`
	NewPassword     string `json:"newPassword" example:"newPassword123"`
}

type SuccessResponse struct {
	Message string `json:"message" example:"Password updated successfully"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refreshToken" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
}

type LogoutRequest struct {
	AccessToken string `json:"accessToken" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
}

type RefreshResponse struct {
	AccessToken  string `json:"accessToken" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	RefreshToken string `json:"refreshToken" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
}
type LogoutResponse struct {
	Message string `json:"message" example:"User logged out successfully"`
}
