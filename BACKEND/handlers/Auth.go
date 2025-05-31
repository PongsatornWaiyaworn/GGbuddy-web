package handlers

import (
	"context"
	"encoding/json"
	"ggbuddy/database"
	"ggbuddy/models"
	"ggbuddy/utils"
	"net/http"
	"strings"
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

	// hash password
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

	if profile.Bio == "" {
		profile.Bio = ""
	}
	if profile.Games == nil {
		profile.Games = []string{}
	}
	if profile.Interests == nil {
		profile.Interests = []string{}
	}
	if profile.DiscordURL == "" {
		profile.DiscordURL = ""
	}
	if profile.FacebookURL == "" {
		profile.FacebookURL = ""
	}
	if profile.LineURL == "" {
		profile.LineURL = ""
	}
	if profile.OtherURL == "" {
		profile.OtherURL = ""
	}
	if profile.Gender == "" {
		profile.Gender = "Not specified"
	}
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

	json.NewEncoder(w).Encode(map[string]string{
		"token":    tokenString,
		"username": dbUser.Username,
		"email":    dbUser.Email,
	})
}

type ChangePasswordRequest struct {
	Identifier  string `json:"identifier"`
	NewPassword string `json:"new_password"`
}

func ChangePasswordHandler(w http.ResponseWriter, r *http.Request) {
	var req ChangePasswordRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Identifier == "" || req.NewPassword == "" {
		http.Error(w, "Identifier and new password are required", http.StatusBadRequest)
		return
	}

	collection := database.GetCollection("ggbuddy", "users")

	filter := bson.M{}
	if strings.Contains(req.Identifier, "@") {
		filter = bson.M{"email": req.Identifier}
	} else {
		filter = bson.M{"username": req.Identifier}
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash new password", http.StatusInternalServerError)
		return
	}

	update := bson.M{"$set": bson.M{"password": string(hashedPassword)}}
	result, err := collection.UpdateOne(context.Background(), filter, update)
	if err != nil {
		http.Error(w, "Failed to update password", http.StatusInternalServerError)
		return
	}

	if result.MatchedCount == 0 {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "Password updated successfully"})
}

type CheckPasswordRequest struct {
	Identifier string `json:"identifier"`
	Password   string `json:"password"`
}

func CheckPasswordHandler(w http.ResponseWriter, r *http.Request) {
	var req CheckPasswordRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Invalid request",
			"error":   err.Error(),
		})
		return
	}

	if req.Identifier == "" || req.Password == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Identifier and password are required",
		})
		return
	}

	collection := database.GetCollection("ggbuddy", "users")

	filter := bson.M{}
	if strings.Contains(req.Identifier, "@") {
		filter = bson.M{"email": req.Identifier}
	} else {
		filter = bson.M{"username": req.Identifier}
	}

	var user struct {
		Password string `bson:"password"`
	}

	err := collection.FindOne(context.Background(), filter).Decode(&user)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "User not found",
		})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"match":   false,
			"message": "Password does not match",
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"match":   true,
		"message": "Password matches",
	})
}
