package handlers

import (
	"context"
	"encoding/json"
	"ggbuddy/database"
	"ggbuddy/models"
	"ggbuddy/utils"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		User    models.User    `json:"user"`
		Profile models.Profile `json:"profile"`
	}

	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	user := payload.User
	profile := payload.Profile

	if user.Username == "" || user.Email == "" || user.Password == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}
	user.Password = string(hashedPassword)

	usersCol := database.GetCollection("ggbuddy", "users")
	profileCol := database.GetCollection("ggbuddy", "profiles")

	var existing models.User
	if err := usersCol.FindOne(context.TODO(), bson.M{"username": user.Username}).Decode(&existing); err == nil {
		http.Error(w, "Username already taken", http.StatusConflict)
		return
	}
	if err := usersCol.FindOne(context.TODO(), bson.M{"email": user.Email}).Decode(&existing); err == nil {
		http.Error(w, "Email already registered", http.StatusConflict)
		return
	}

	user.ID = primitive.NewObjectID()

	profile.ID = primitive.NewObjectID()
	profile.UserID = user.ID
	profile.Username = user.Username
	profile.Timestamp = time.Now()

	if profile.Img == "" {
		http.Error(w, "Missing profile image URL", http.StatusBadRequest)
		return
	}

	_, err = profileCol.InsertOne(context.TODO(), profile)
	if err != nil {
		http.Error(w, "Error saving profile", http.StatusInternalServerError)
		return
	}

	user.ProfileID = &profile.ID
	_, err = usersCol.InsertOne(context.TODO(), user)
	if err != nil {
		http.Error(w, "Error saving user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "User and profile created successfully",
	})
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var credentials struct {
		Identifier string `json:"identifier"`
		Password   string `json:"password"`
	}

	err := json.NewDecoder(r.Body).Decode(&credentials)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if credentials.Identifier == "" || credentials.Password == "" {
		http.Error(w, "Identifier and Password required", http.StatusBadRequest)
		return
	}

	collection := database.GetCollection("ggbuddy", "users")
	var dbUser models.User

	filter := bson.M{
		"$or": []bson.M{
			{"email": credentials.Identifier},
			{"username": credentials.Identifier},
		},
	}

	err = collection.FindOne(nil, filter).Decode(&dbUser)
	if err != nil {
		http.Error(w, "User not found", http.StatusUnauthorized)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(dbUser.Password), []byte(credentials.Password))
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
