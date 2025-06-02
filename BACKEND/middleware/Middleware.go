package middleware

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
)

var jwtSecret []byte

func init() {
	if err := godotenv.Load("../.env"); err != nil {
		fmt.Println("Warning: .env file not loaded, using system env")
	}
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		fmt.Println("ERROR: JWT_SECRET is not set")
	}
	jwtSecret = []byte(secret)
}

func validateJWTToken(tokenString string) (*jwt.Token, error) {
	claims := &jwt.RegisteredClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return jwtSecret, nil
	})
	return token, err
}

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("AuthMiddleware: Path =", r.URL.Path)

		noAuthPaths := map[string]bool{
			"/login":      true,
			"/register":   true,
			"/send-otp":   true,
			"/verify-otp": true,
			"/upload-s3":  true,
			"/ws-match":   true,
			"/ws":         true,
		}

		if noAuthPaths[r.URL.Path] {
			next.ServeHTTP(w, r)
			return
		}

		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Missing Authorization header", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			http.Error(w, "Invalid Authorization header format", http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]
		token, err := validateJWTToken(tokenString)
		if err != nil || !token.Valid {
			fmt.Println("JWT validation failed:", err)
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		if claims, ok := token.Claims.(*jwt.RegisteredClaims); ok {
			if claims.Subject == "" {
				http.Error(w, "Invalid token claims: missing subject", http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), "userID", claims.Subject)
			r = r.WithContext(ctx)
		} else {
			http.Error(w, "Invalid token claims", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}
