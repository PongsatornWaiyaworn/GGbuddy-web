package utils

import (
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// GenerateJWT สร้าง JWT Token
func GenerateJWT(userID string) (string, error) {
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey == "" {
		return "", errors.New("missing JWT_SECRET in environment variables")
	}

	expirationTime := time.Now().Add(24 * time.Hour)

	claims := &jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(expirationTime),
		Subject:   userID, // ใช้ Subject เก็บ userID
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

var jwtKey = []byte(os.Getenv("JWT_SECRET_KEY"))

// ตรวจสอบว่า request มี token ที่ถูกต้องหรือไม่
func ValidateToken(r *http.Request) (string, error) {
	// ตรวจสอบว่า authorization header มีข้อมูลหรือไม่
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return "", errors.New("Authorization header is missing")
	}

	// เอาแค่ token ออกจาก header
	tokenString := strings.Split(authHeader, " ")[1]

	// พยายามตรวจสอบและถอดรหัส token
	claims := jwt.MapClaims{}
	token, err := jwt.ParseWithClaims(tokenString, &claims, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})

	// หากไม่สามารถถอดรหัสหรือ token ผิดพลาด
	if err != nil || !token.Valid {
		return "", errors.New("Invalid token")
	}

	// ดึง userID จาก claims โดยตรง
	userID, ok := claims["sub"].(string) // ใช้ "sub" ใน claims
	if !ok {
		return "", errors.New("Invalid token structure")
	}
	return userID, nil
}
