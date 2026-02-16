package utils

import (
	"fmt"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/google/uuid"
)

type JWTClaims struct {
	UserID   uuid.UUID `json:"user_id"`
	BrandID  *string   `json:"brand_id,omitempty"`
	BranchID *string   `json:"branch_id,omitempty"`
	Role     string    `json:"role"`
	IsGlobal bool      `json:"is_global"`
	jwt.StandardClaims
}

func CreateJWTWithClaims(ttl time.Duration, userID uuid.UUID, brandID *string, branchID *string, role string, isGlobal bool, secretKey string) (string, error) {
	now := time.Now().UTC()
	expiresAt := now.Add(ttl)

	claims := JWTClaims{
		UserID:   userID,
		BrandID:  brandID,
		BranchID: branchID,
		Role:     role,
		IsGlobal: isGlobal,
		StandardClaims: jwt.StandardClaims{
			Subject:   userID.String(),
			ExpiresAt: expiresAt.Unix(),
			IssuedAt:  now.Unix(),
			NotBefore: now.Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

func ValidateJWTWithClaims(tokenString string, secretKey string) (*JWTClaims, error) {
	claims := &JWTClaims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secretKey), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid claims format")
}

func ParseUUID(s string) (uuid.UUID, error) {
	id, err := uuid.Parse(s)
	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid UUID format: %w", err)
	}
	return id, nil
}
