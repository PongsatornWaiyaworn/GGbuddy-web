package handlers

import (
	"context"
	"fmt"
	"ggbuddy/database"
	"ggbuddy/models"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var clients = make(map[*websocket.Conn]string) // เก็บ WebSocket Clients
var broadcast = make(chan models.Message)      // Channel สำหรับกระจายข้อความ

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, "Failed to upgrade connection", http.StatusInternalServerError)
		return
	}
	defer conn.Close()

	username := r.URL.Query().Get("username")
	groupIDStr := r.URL.Query().Get("group_id")
	clients[conn] = username

	fmt.Println(username, "connected")

	groupID, err := primitive.ObjectIDFromHex(groupIDStr)
	if err != nil {
		fmt.Println("Invalid GroupID:", err)
		http.Error(w, "Invalid GroupID", http.StatusBadRequest)
		return
	}

	for {
		var msg models.Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			fmt.Println("Error reading json:", err)
			delete(clients, conn)
			break
		}

		msg.GroupID = groupID
		msg.Timestamp = time.Now().Format(time.RFC3339)

		messageCollection := database.GetCollection("test", "messages")
		_, err = messageCollection.InsertOne(context.Background(), msg)
		if err != nil {
			fmt.Println("Error saving message:", err)
			continue
		}

		broadcast <- msg
	}
}

func Broadcaster() {
	for {
		msg := <-broadcast
		for conn := range clients {
			err := conn.WriteJSON(msg)
			if err != nil {
				fmt.Println("Error broadcasting:", err)
				conn.Close()
				delete(clients, conn)
			}
		}
	}
}
