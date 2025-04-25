package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"ggbuddy/database"
	"ggbuddy/models"
	"ggbuddy/utils"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func SendOTPHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	code := fmt.Sprintf("%06d", time.Now().UnixNano()%1000000)

	expiration := time.Now().Add(5 * time.Minute)

	collection := database.GetCollection("test", "otps")

	_, err := collection.DeleteMany(context.Background(), bson.M{"email": req.Email})
	if err != nil {
		http.Error(w, "Failed to delete old OTP", http.StatusInternalServerError)
		return
	}

	otp := models.OTP{
		ID:        primitive.NewObjectID(),
		Email:     req.Email,
		Code:      code,
		ExpiresAt: expiration.Format(time.RFC3339),
	}

	_, err = collection.InsertOne(context.Background(), otp)
	if err != nil {
		http.Error(w, "Failed to store OTP", http.StatusInternalServerError)
		return
	}

	err = utils.SendEmail(req.Email, otp.Code)
	if err != nil {
		http.Error(w, "Failed to send email", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "OTP sent successfully"})
}

func VerifyOTPHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
		Code  string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" || req.Code == "" {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	collection := database.GetCollection("test", "otps")

	var stored models.OTP
	err := collection.FindOne(context.Background(), bson.M{"email": req.Email, "code": req.Code}).Decode(&stored)
	if err != nil {
		http.Error(w, "OTP not found or invalid", http.StatusUnauthorized)
		return
	}

	exp, err := time.Parse(time.RFC3339, stored.ExpiresAt)
	if err != nil || time.Now().After(exp) {
		http.Error(w, "OTP expired", http.StatusUnauthorized)
		return
	}

	// ถ้าสำเร็จ ลบ OTP ทิ้ง
	collection.DeleteOne(context.Background(), bson.M{"_id": stored.ID})

	json.NewEncoder(w).Encode(map[string]string{"message": "OTP verified successfully"})
}
