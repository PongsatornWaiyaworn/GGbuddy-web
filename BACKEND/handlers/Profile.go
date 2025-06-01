package handlers

import (
	"context"
	"encoding/json"
	"ggbuddy/database"
	"ggbuddy/models"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
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
	update := bson.M{
		"$set": bson.M{
			"display_name": profile.DisplayName,
			"img":          profile.Img,
			"age":          profile.Age,
			"interests":    profile.Interests,
			"games":        profile.Games,
			"discord_url":  profile.DiscordURL,
			"facebook_url": profile.FacebookURL,
			"line_url":     profile.LineURL,
			"other_url":    profile.OtherURL,
			"bio":          profile.Bio,
			"timestamp":    profile.Timestamp,
		},
	}
	opts := options.Update().SetUpsert(true)

	_, err = collection.UpdateOne(context.TODO(), filter, update, opts)
	if err != nil {
		http.Error(w, "Failed to save profile", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "Profile saved successfully"})
}

func GetProfileHandler(w http.ResponseWriter, r *http.Request) {
	identifier := r.URL.Query().Get("identifier")
	if identifier == "" {
		http.Error(w, "Identifier is required", http.StatusBadRequest)
		return
	}

	usersCollection := database.GetCollection("ggbuddy", "users")
	var user struct {
		ID       primitive.ObjectID `bson:"_id"`
		Username string             `bson:"username"`
		Email    string             `bson:"email"`
	}

	filterUser := bson.M{
		"$or": []bson.M{
			{"username": identifier},
			{"email": identifier},
		},
	}

	err := usersCollection.FindOne(context.TODO(), filterUser).Decode(&user)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	profilesCollection := database.GetCollection("ggbuddy", "profiles")
	var profile models.Profile

	filterProfile := bson.M{
		"user_id": user.ID,
	}

	err = profilesCollection.FindOne(context.TODO(), filterProfile).Decode(&profile)
	if err != nil {
		http.Error(w, "Profile not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
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
	update := bson.M{
		"$set": bson.M{
			"display_name": profile.DisplayName,
			"img":          profile.Img,
			"age":          profile.Age,
			"interests":    profile.Interests,
			"games":        profile.Games,
			"gender":       profile.Gender,
			"discord_url":  profile.DiscordURL,
			"facebook_url": profile.FacebookURL,
			"line_url":     profile.LineURL,
			"other_url":    profile.OtherURL,
			"bio":          profile.Bio,
			"timestamp":    profile.Timestamp,
		},
	}

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
