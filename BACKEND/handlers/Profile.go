package handlers

import (
	"context"
	"encoding/json"
	"ggbuddy/database"
	"ggbuddy/models"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func CreateOrUpdateProfileHandler(w http.ResponseWriter, r *http.Request) {
	var profile models.Profile
	err := json.NewDecoder(r.Body).Decode(&profile)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if profile.Username == "" {
		http.Error(w, "Username is required", http.StatusBadRequest)
		return
	}

	profile.Timestamp = time.Now()

	collection := database.GetCollection("ggbuddy", "profiles")

	filter := bson.M{"username": profile.Username}
	update := bson.M{"$set": profile}
	opts := options.Update().SetUpsert(true)

	_, err = collection.UpdateOne(context.TODO(), filter, update, opts)
	if err != nil {
		http.Error(w, "Failed to save profile", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "Profile saved successfully"})
}

func GetProfileHandler(w http.ResponseWriter, r *http.Request) {
	username := r.URL.Query().Get("username")
	if username == "" {
		http.Error(w, "Username is required", http.StatusBadRequest)
		return
	}

	collection := database.GetCollection("ggbuddy", "profiles")
	var profile models.Profile
	err := collection.FindOne(context.TODO(), bson.M{"username": username}).Decode(&profile)
	if err != nil {
		http.Error(w, "Profile not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(profile)
}

func UpdateProfileHandler(w http.ResponseWriter, r *http.Request) {
	var profile models.Profile
	err := json.NewDecoder(r.Body).Decode(&profile)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if profile.Username == "" {
		http.Error(w, "Username is required", http.StatusBadRequest)
		return
	}

	profile.Timestamp = time.Now()

	collection := database.GetCollection("ggbuddy", "profiles")
	filter := bson.M{"username": profile.Username}
	update := bson.M{"$set": profile}

	result, err := collection.UpdateOne(context.TODO(), filter, update)
	if err != nil {
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}
	if result.MatchedCount == 0 {
		http.Error(w, "Profile not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "Profile updated successfully"})
}
