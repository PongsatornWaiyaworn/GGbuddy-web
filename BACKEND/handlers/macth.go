package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"ggbuddy/database"
	"ggbuddy/models"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateMatchingCriteriaHandler(w http.ResponseWriter, r *http.Request) {
	var criteria models.MatchingCriteria

	err := json.NewDecoder(r.Body).Decode(&criteria)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	collection := database.GetCollection("test", "waiting_match")
	groupCollection := database.GetCollection("test", "groups")

	filter := bson.M{"preferred_game": criteria.PreferredGame}
	cursor, err := collection.Find(context.Background(), filter)
	if err != nil {
		http.Error(w, "Error finding matching players", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var waitingPlayers []models.MatchingCriteria
	for cursor.Next(context.Background()) {
		var player models.MatchingCriteria
		if err := cursor.Decode(&player); err == nil {
			waitingPlayers = append(waitingPlayers, player)
		}
	}

	if len(waitingPlayers)+1 >= criteria.GroupSize {
		var members []string
		for _, player := range waitingPlayers {
			members = append(members, player.Username)
		}
		members = append(members, criteria.Username)

		now := time.Now()
		groupName := fmt.Sprintf("%s-%04d%02d%02d-%02d%02d%02d",
			criteria.PreferredGame,
			now.Year(), now.Month(), now.Day(),
			now.Hour(), now.Minute(), now.Second())

		newGroup := bson.M{
			"_id":        primitive.NewObjectID(),
			"name":       groupName,
			"members":    members,
			"created_at": now.Format(time.RFC3339),
		}

		_, err = groupCollection.InsertOne(context.Background(), newGroup)
		if err != nil {
			http.Error(w, "Error creating group", http.StatusInternalServerError)
			return
		}

		_, err = collection.DeleteMany(context.Background(), filter)
		if err != nil {
			http.Error(w, "Error removing matched criteria", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message": "Match found! Group created successfully"})
		return
	}

	newCriteria := bson.M{
		"_id":              primitive.NewObjectID(),
		"username":         criteria.Username,
		"interests":        criteria.Interests,
		"preferred_gender": criteria.PreferredGender,
		"preferred_game":   criteria.PreferredGame,
		"group_size":       criteria.GroupSize,
		"created_at":       time.Now().Format(time.RFC3339),
	}

	_, err = collection.InsertOne(context.Background(), newCriteria)
	if err != nil {
		http.Error(w, "Error saving matching criteria", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "No match found, added to waiting list"})
}
