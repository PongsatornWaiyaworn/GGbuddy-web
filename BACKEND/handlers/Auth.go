package handlers

import (
	"context"
	"encoding/json"
	"ggbuddy/database"
	"ggbuddy/models"
	"ggbuddy/utils"
	"net/http"

	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var user models.User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if user.Username == "" || user.Email == "" || user.Password == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	collection := database.GetCollection("ggbuddy", "users")
	user.Password = string(hashedPassword)

	var existingUser models.User
	err = collection.FindOne(context.TODO(), bson.M{"username": user.Username}).Decode(&existingUser)
	if err == nil {
		http.Error(w, "Username already taken", http.StatusConflict)
		return
	}

	err = collection.FindOne(context.TODO(), bson.M{"email": user.Email}).Decode(&existingUser)
	if err == nil {
		http.Error(w, "Email already registered", http.StatusConflict)
		return
	}

	_, err = collection.InsertOne(context.TODO(), user)
	if err != nil {
		http.Error(w, "Error saving user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User registered successfully"})
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var user models.User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	collection := database.GetCollection("ggbuddy", "users")
	var dbUser models.User
	var filter bson.M

	if user.Email != "" {
		filter = bson.M{"email": user.Email}
	} else if user.Username != "" {
		filter = bson.M{"username": user.Username}
	} else {
		http.Error(w, "Email or Username is required", http.StatusBadRequest)
		return
	}

	err = collection.FindOne(nil, filter).Decode(&dbUser)
	if err != nil {
		http.Error(w, "User not found", http.StatusUnauthorized)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(dbUser.Password), []byte(user.Password))
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	tokenString, err := utils.GenerateJWT(dbUser.ID.Hex())
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
}

type ChangePasswordRequest struct {
	Username    string `json:"username"`
	NewPassword string `json:"new_password"`
}

func ChangePasswordHandler(w http.ResponseWriter, r *http.Request) {
	var req ChangePasswordRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Username == "" || req.NewPassword == "" {
		http.Error(w, "Username and new password are required", http.StatusBadRequest)
		return
	}

	collection := database.GetCollection("ggbuddy", "users")

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash new password", http.StatusInternalServerError)
		return
	}

	_, err = collection.UpdateOne(
		context.Background(),
		bson.M{"username": req.Username},
		bson.M{"$set": bson.M{"password": string(hashedPassword)}},
	)
	if err != nil {
		http.Error(w, "Failed to update password", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "Password updated successfully"})
}
