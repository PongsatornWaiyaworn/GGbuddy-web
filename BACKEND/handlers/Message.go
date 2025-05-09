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
)

func CreateGroupHandler(w http.ResponseWriter, r *http.Request) {
	var group models.Group
	err := json.NewDecoder(r.Body).Decode(&group)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if len(group.Members) == 0 {
		http.Error(w, "Group must have at least one member", http.StatusBadRequest)
		return
	}

	group.CreatedAt = time.Now().Format(time.RFC3339)

	collection := database.GetCollection("ggbuddy", "groups")
	_, err = collection.InsertOne(context.Background(), group)
	if err != nil {
		http.Error(w, "Error saving group", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Group created successfully"})
}

func GetUserChatsHandler(w http.ResponseWriter, r *http.Request) {
	username := r.URL.Query().Get("user")
	if username == "" {
		http.Error(w, "Username is required", http.StatusBadRequest)
		return
	}

	groupCollection := database.GetCollection("ggbuddy", "groups")
	cursor, err := groupCollection.Find(context.Background(), bson.M{"members": username})
	if err != nil {
		http.Error(w, "Error fetching chat groups", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var groups []models.Group
	for cursor.Next(context.Background()) {
		var group models.Group
		if err := cursor.Decode(&group); err != nil {
			http.Error(w, "Error decoding group", http.StatusInternalServerError)
			return
		}
		groups = append(groups, group)
	}

	if err := cursor.Err(); err != nil {
		http.Error(w, "Error reading groups", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(groups)
}

func SendMessageHandler(w http.ResponseWriter, r *http.Request) {
	var msg models.Message
	err := json.NewDecoder(r.Body).Decode(&msg)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	msg.Timestamp = time.Now().Format(time.RFC3339)

	collection := database.GetCollection("ggbuddy", "groups")
	var group models.Group
	err = collection.FindOne(context.Background(), bson.M{"_id": msg.GroupID}).Decode(&group)
	if err != nil {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	messageCollection := database.GetCollection("ggbuddy", "messages")
	_, err = messageCollection.InsertOne(context.Background(), msg)
	if err != nil {
		http.Error(w, "Error saving message", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Message sent successfully"})
}

func GetMessagesHandler(w http.ResponseWriter, r *http.Request) {
	groupID := r.URL.Query().Get("group_id")

	collection := database.GetCollection("ggbuddy", "groups")
	var group models.Group
	groupIDObj, err := primitive.ObjectIDFromHex(groupID)
	if err != nil {
		http.Error(w, "Invalid Group ID", http.StatusBadRequest)
		return
	}
	err = collection.FindOne(context.Background(), bson.M{"_id": groupIDObj}).Decode(&group)
	if err != nil {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	messageCollection := database.GetCollection("ggbuddy", "messages")
	cursor, err := messageCollection.Find(context.Background(), bson.M{"group_id": groupIDObj})
	if err != nil {
		http.Error(w, "Error retrieving messages", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var messages []models.Message
	for cursor.Next(context.Background()) {
		var msg models.Message
		err := cursor.Decode(&msg)
		if err != nil {
			http.Error(w, "Error decoding message", http.StatusInternalServerError)
			return
		}
		messages = append(messages, msg)
	}

	if err := cursor.Err(); err != nil {
		http.Error(w, "Error reading messages", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}
