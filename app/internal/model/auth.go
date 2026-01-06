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
	Status   *string `json:"status,omitempty"`
}

type RegisterResponse struct {
	Message string `json:"message"`
}
type LoginRequest struct {
	Username string  `json:"username" example:"admin"`
	Password string  `json:"password,omitempty" example:"Password:Javohir"`
	BrandID  *string `json:"brand_id,omitempty" example:"my_restaurant"`
}

type PincodeLoginRequest struct {
	Pincode string `json:"pincode" example:"1234"`
	BrandID string `json:"brand_id" example:"my_restaurant"`
}

type GlobalLoginRequest struct {
	Username string `json:"username" example:"superadmin"`
	Password string `json:"password" example:"superadmin"`
}

type LoginResponse struct {
	AccessToken  string       `json:"accessToken" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	RefreshToken string       `json:"refreshToken" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	User         UserResponse `json:"user"`
}

type RegisterRequest struct {
	FullName    string  `json:"fullName" example:"Javohir Khasanov"`
	PhoneNumber string  `json:"phoneNumber" example:"+998957749110"`
	Username    string  `json:"username" example:"admin"`
	Password    string  `json:"password,omitempty" example:"Password:Javohir"`
	Pincode     string  `json:"pincode,omitempty" example:"1234"`
	Role        string  `json:"role" example:"user"`
	BrandID     *string `json:"brand_id,omitempty" example:"my_restaurant"`
}

type ErrorResponse struct {
	Message string `json:"message" example:"error message"`
}

type Date struct {
	time.Time
}

func (d *Date) UnmarshalJSON(b []byte) error {
	s := strings.Trim(string(b), "\"")
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return err
	}
	d.Time = t
	return nil
}

type UserResponse struct {
	ID          string     `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	FullName    *string    `json:"full_name,omitempty" example:"John Doe"`
	Username    *string    `json:"username,omitempty" example:"admin"`
	Role        *string    `json:"role,omitempty" example:"user"`
	Email       *string    `json:"email,omitempty" example:"user@example.com"`
	PhoneNumber *string    `json:"phone_number,omitempty" example:"+998901234567"`
	ShiftID     *string    `json:"shift_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	BrandID     *string    `json:"brand_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440000"`
	CreatedAt   *time.Time `json:"created_at,omitempty" example:"2022-01-01T00:00:00Z"`
	UpdatedAt   *time.Time `json:"updated_at,omitempty" example:"2022-01-01T00:00:00Z"`
}

type UpdateUserRequest struct {
	FullName    *string `json:"full_name"`
	Username    *string `json:"username"`
	Email       *string `json:"email"`
	PhoneNumber *string `json:"phone_number"`
}

type UpdatePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" example:"password123"`
	NewPassword     string `json:"newPassword" example:"newPassword123"`
}

// Simple SuccessResponse for basic operations
type SuccessResponse struct {
	Status  string `json:"status" example:"success"`
	Message string `json:"message" example:"Operation completed successfully"`
}

// Generic SuccessResponse with data
type SuccessResponseWithData[T any] struct {
	Status  string `json:"status" example:"success"`
	Message string `json:"message,omitempty" example:"Operation completed successfully"`
	Data    T      `json:"data"`
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

type ShiftResponse struct {
	ID          string     `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Name        *string    `json:"name,omitempty" example:"Morning Shift"`
	Role        *string    `json:"role,omitempty" example:"waiter"`
	WorkingDays *string    `json:"working_days,omitempty" example:"Mon,Tue,Wed,Thu,Fri"`
	OpenTime    *string    `json:"open_time,omitempty" example:"09:00:00"`
	CloseTime   *string    `json:"close_time,omitempty" example:"17:00:00"`
	BranchID    *string    `json:"branch_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CreatedAt   *time.Time `json:"created_at,omitempty" example:"2022-01-01T00:00:00Z"`
	UpdatedAt   *time.Time `json:"updated_at,omitempty" example:"2022-01-01T00:00:00Z"`
}

type CreateShiftRequest struct {
	Name        string  `json:"name" example:"Morning Shift"`
	Role        *string `json:"role,omitempty" example:"waiter"`
	WorkingDays *string `json:"working_days,omitempty" example:"Mon,Tue,Wed,Thu,Fri"`
	OpenTime    *string `json:"open_time,omitempty" example:"09:00:00"`
	CloseTime   *string `json:"close_time,omitempty" example:"17:00:00"`
	BranchID    string  `json:"branch_id" example:"123e4567-e89b-12d3-a456-426614174000"`
}

type UpdateShiftRequest struct {
	Name        *string `json:"name,omitempty" example:"Morning Shift"`
	Role        *string `json:"role,omitempty" example:"waiter"`
	WorkingDays *string `json:"working_days,omitempty" example:"Mon,Tue,Wed,Thu,Fri"`
	OpenTime    *string `json:"open_time,omitempty" example:"09:00:00"`
	CloseTime   *string `json:"close_time,omitempty" example:"17:00:00"`
}
