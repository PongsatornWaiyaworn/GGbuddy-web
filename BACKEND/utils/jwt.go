package utils

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
)

func GenerateJWT(userID string) (string, error) {
	if err := godotenv.Load("../.env"); err != nil {
		fmt.Println("Warning: .env file not loaded, using system env")
	}
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey == "" {
		return "", errors.New("missing JWT_SECRET in environment variables")
	}

	expirationTime := time.Now().Add(24 * time.Hour)

	claims := &jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(expirationTime),
		Subject:   userID,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}
