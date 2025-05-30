package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"ggbuddy/database"
	"ggbuddy/models"
	"ggbuddy/utils"
	"net/http"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func SendOTPHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Identifier string `json:"email"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Identifier == "" {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	email := req.Identifier

	if !strings.Contains(email, "@") {
		userCollection := database.GetCollection("ggbuddy", "users")
		var user models.User

		filter := bson.M{
			"$or": []bson.M{
				{"username": req.Identifier},
			},
		}

		err := userCollection.FindOne(context.Background(), filter).Decode(&user)
		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		email = user.Email
	}

	code := fmt.Sprintf("%06d", time.Now().UnixNano()%1000000)
	expiration := time.Now().Add(5 * time.Minute)

	otpCollection := database.GetCollection("ggbuddy", "otps")

	_, err := otpCollection.DeleteMany(context.Background(), bson.M{"email": email})
	if err != nil {
		http.Error(w, "Failed to delete old OTP", http.StatusInternalServerError)
		return
	}

	otp := models.OTP{
		ID:        primitive.NewObjectID(),
		Email:     email,
		Code:      code,
		ExpiresAt: expiration.Format(time.RFC3339),
	}

	_, err = otpCollection.InsertOne(context.Background(), otp)
	if err != nil {
		http.Error(w, "Failed to store OTP", http.StatusInternalServerError)
		return
	}

	err = utils.SendEmail(email, otp.Code)
	if err != nil {
		http.Error(w, "Failed to send email", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "OTP sent successfully"})
}

func VerifyOTPHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Identifier string `json:"email"`
		Code       string `json:"code"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Identifier == "" || req.Code == "" {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	email := req.Identifier

	if !strings.Contains(email, "@") {
		userCollection := database.GetCollection("ggbuddy", "users")
		var user models.User

		err := userCollection.FindOne(context.Background(), bson.M{
			"$or": []bson.M{
				{"username": req.Identifier},
				{"email": req.Identifier},
			},
		}).Decode(&user)

		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		email = user.Email
	}

	otpCollection := database.GetCollection("ggbuddy", "otps")

	var stored models.OTP
	err := otpCollection.FindOne(context.Background(), bson.M{"email": email, "code": req.Code}).Decode(&stored)
	if err != nil {
		http.Error(w, "OTP not found or invalid", http.StatusUnauthorized)
		return
	}

	exp, err := time.Parse(time.RFC3339, stored.ExpiresAt)
	if err != nil || time.Now().After(exp) {
		http.Error(w, "OTP expired", http.StatusUnauthorized)
		return
	}

	otpCollection.DeleteOne(context.Background(), bson.M{"_id": stored.ID})

	json.NewEncoder(w).Encode(map[string]string{"message": "OTP verified successfully"})
}
