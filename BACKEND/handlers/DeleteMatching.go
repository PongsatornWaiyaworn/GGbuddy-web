package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"ggbuddy/database"

	"go.mongodb.org/mongo-driver/bson"
)

func DeleteMatchingCriteriaHandler(w http.ResponseWriter, r *http.Request) {
	username := r.URL.Query().Get("username")
	if username == "" {
		http.Error(w, "Username is required", http.StatusBadRequest)
		return
	}

	collection := database.GetCollection("ggbuddy", "waiting_match")

	filter := bson.M{"username": username}

	result, err := collection.DeleteOne(context.Background(), filter)
	if err != nil {
		http.Error(w, "Error deleting user", http.StatusInternalServerError)
		return
	}

	if result.DeletedCount == 0 {
		http.Error(w, "User not found in waiting list", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "User removed from waiting list"})
}
