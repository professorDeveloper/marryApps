package utils

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/dgrijalva/jwt-go"
	"golang.org/x/crypto/bcrypt"
)

const dbNamePrefix = "db_"   // starts with letter and makes it identifiable
const maxDBNameLength = 63   // PostgreSQL max name length
const maxUsernameLength = 10 // PostgreSQL max name length
const randomSuffixLength = 8 // length of random alphanumeric suffix

// generateRandomAlphanumeric returns a random alphanumeric string of given length
func generateRandomAlphanumeric(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, length)
	_, err := rand.Read(b)
	if err != nil {
		panic(err)
	}
	for i := range b {
		b[i] = charset[int(b[i])%len(charset)]
	}
	return string(b)
}

// GenerateUniqueDBName returns a PostgreSQL-compatible unique database name
func GenerateUniqueDBName() string {
	timestamp := time.Now().UnixNano()
	suffix := generateRandomAlphanumeric(randomSuffixLength)
	name := fmt.Sprintf("%s%s_%x", dbNamePrefix, suffix, timestamp)
	if len(name) > maxDBNameLength {
		name = name[:maxDBNameLength]
	}
	return name
}

func GenerateUniqueUsername() string {
	timestamp := time.Now().UnixNano()
	suffix := generateRandomAlphanumeric(randomSuffixLength)
	name := fmt.Sprintf("%s%x", suffix, timestamp)
	if len(name) > maxUsernameLength {
		name = name[:maxUsernameLength]
	}
	return name
}

func HashPassword(password string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	if err != nil {
		return "", fmt.Errorf("could not hash password %w", err)
	}
	return string(hashedPassword), nil
}

func VerifyPassword(hashedPassword string, candidatePassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(candidatePassword))
}

// GenerateRandomChars generates a cryptographically secure random string.
func GenerateRandomChars(length int) (string, error) {
	bytes := make([]byte, length)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", fmt.Errorf("failed to generate random bytes: %w", err)
	}
	return base64.URLEncoding.EncodeToString(bytes)[:length], nil
}

func CreateJWT(ttl time.Duration, payload interface{}, secretKey string) (string, error) {
    
    now := time.Now().UTC()

    claims := make(jwt.MapClaims)
    claims["sub"] = payload
    claims["exp"] = now.Add(ttl).Unix()
    claims["iat"] = now.Unix()
    claims["nbf"] = now.Unix()

    token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secretKey))

    if err != nil {
        return "", fmt.Errorf("create: sign token: %w", err)
    }

    return token, nil
}

func ValidateJWT(token string, secretKey string) (interface{}, error) {
    signingKey := []byte(secretKey)

    parsedToken, err := jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
        if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected method: %s", t.Header["alg"])
        }
        return signingKey, nil
    })

    if err != nil {
        return nil, fmt.Errorf("validate: %w", err)
    }

    claims, ok := parsedToken.Claims.(jwt.MapClaims)
    if !ok || !parsedToken.Valid {
        return nil, fmt.Errorf("validate: invalid token")
    }

    return claims["sub"], nil
}
