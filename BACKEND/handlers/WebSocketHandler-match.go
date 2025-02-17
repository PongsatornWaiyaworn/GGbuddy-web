package handlers

import (
	"context"
	"fmt"
	"ggbuddy/database"
	"ggbuddy/models"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var clients_match = make(map[*websocket.Conn]string)     // เก็บ WebSocket Clients
var broadcast_match = make(chan models.MatchingCriteria) // Channel สำหรับกระจายข้อมูล

var upgrader_match = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func WebSocketHandler_match(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader_match.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, "Failed to upgrade connection", http.StatusInternalServerError)
		return
	}
	defer conn.Close()

	username := r.URL.Query().Get("username")
	clients_match[conn] = username

	fmt.Println(username, "connected")

	for {
		var criteria models.MatchingCriteria
		err := conn.ReadJSON(&criteria)
		if err != nil {
			fmt.Println("Error reading json:", err)
			delete(clients_match, conn)
			break
		}

		matchedGroupID, err := checkMatchingCriteria(criteria)
		if err != nil {
			conn.WriteJSON(map[string]string{"message": "Error finding match"})
			continue
		}

		if matchedGroupID != nil {
			conn.WriteJSON(map[string]interface{}{"message": "Match found!", "group_id": matchedGroupID})
		} else {
			conn.WriteJSON(map[string]string{"message": "No match found, added to waiting list"})
		}
	}
}

func checkMatchingCriteria(criteria models.MatchingCriteria) (*primitive.ObjectID, error) {
	collection := database.GetCollection("test", "waiting_match")
	groupCollection := database.GetCollection("test", "groups")

	filter := bson.M{"preferred_game": criteria.PreferredGame}
	cursor, err := collection.Find(context.Background(), filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	membersMap := make(map[string]bool)

	var waitingPlayers []models.MatchingCriteria
	for cursor.Next(context.Background()) {
		var player models.MatchingCriteria
		if err := cursor.Decode(&player); err == nil {
			if _, exists := membersMap[player.Username]; !exists {
				membersMap[player.Username] = true
				waitingPlayers = append(waitingPlayers, player)
			}
		}
	}

	if len(waitingPlayers)-1 >= criteria.GroupSize {
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

		groupResult, err := groupCollection.InsertOne(context.Background(), newGroup)
		if err != nil {
			return nil, err
		}

		_, err = collection.DeleteMany(context.Background(), filter)
		if err != nil {
			return nil, err
		}

		groupID := groupResult.InsertedID.(primitive.ObjectID)

		for conn, user := range clients_match {
			if user == criteria.Username || contains(members, user) {
				conn.WriteJSON(map[string]interface{}{
					"message":  "Match found and group created",
					"group_id": groupID,
				})
			}
		}

		return &groupID, nil
	}

	newCriteria := bson.M{
		"_id":              primitive.NewObjectID(),
		"username":         criteria.Username,
		"preferred_game":   criteria.PreferredGame,
		"preferred_gender": criteria.PreferredGender,
		"interests":        criteria.Interests,
		"group_size":       criteria.GroupSize,
		"created_at":       time.Now().Format(time.RFC3339),
	}

	_, err = collection.InsertOne(context.Background(), newCriteria)
	if err != nil {
		return nil, err
	}

	go cancelIfTimeout(criteria.Username)

	return nil, nil
}

func cancelIfTimeout(username string) {
	// รอ 5 นาที
	time.Sleep(5 * time.Minute)

	collection := database.GetCollection("test", "waiting_match")
	_, err := collection.DeleteOne(context.Background(), bson.M{"username": username})
	if err != nil {
		fmt.Println("Error cancelling match:", err)
	}

	for conn, user := range clients_match {
		if user == username {
			conn.WriteJSON(map[string]string{"message": "Your match request has been cancelled due to timeout"})
			conn.Close()
			delete(clients_match, conn)
		}
	}
}

func contains(slice []string, item string) bool {
	for _, a := range slice {
		if a == item {
			return true
		}
	}
	return false
}

func Broadcaster_match() {
	for {
		criteria := <-broadcast_match

		for conn := range clients_match {
			err := conn.WriteJSON(criteria)
			if err != nil {
				fmt.Println("Error broadcasting:", err)
				conn.Close()
				delete(clients_match, conn)
			}
		}
	}
}
