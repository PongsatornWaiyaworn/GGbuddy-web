package handlers

import (
	"context"
	"fmt"
	"ggbuddy/database"
	"ggbuddy/models"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Client struct {
	Conn     *websocket.Conn
	Username string
	GroupID  primitive.ObjectID
}

type BroadcastMessage struct {
	Message    models.Message
	SenderConn *websocket.Conn
}

var clients = make(map[*websocket.Conn]Client)
var clientsMutex_chat = sync.RWMutex{}
var broadcast = make(chan BroadcastMessage)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func WebSocketHandler_chat(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("WebSocket upgrade error:", err)
		http.Error(w, "Failed to upgrade connection", http.StatusInternalServerError)
		return
	}

	username := r.URL.Query().Get("username")
	groupIDStr := r.URL.Query().Get("group_id")

	groupID, err := primitive.ObjectIDFromHex(groupIDStr)
	if err != nil {
		fmt.Println("Invalid GroupID:", err)
		http.Error(w, "Invalid GroupID", http.StatusBadRequest)
		conn.Close()
		return
	}

	client := Client{
		Conn:     conn,
		Username: username,
		GroupID:  groupID,
	}

	clientsMutex_chat.Lock()
	clients[conn] = client
	fmt.Println("Client connected:", username, "in group", groupID.Hex())
	clientsMutex_chat.Unlock()

	defer func() {
		clientsMutex_chat.Lock()
		delete(clients, conn)
		clientsMutex_chat.Unlock()
		conn.Close()
		fmt.Println("Client disconnected:", username)
	}()

	for {
		var msg models.Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			fmt.Println("Error reading json from", username, ":", err)
			break
		}

		msg.GroupID = groupID
		msg.Timestamp = time.Now().Format(time.RFC3339)

		fmt.Println("Received message from", username, ":", msg.Content)

		collection := database.GetCollection("ggbuddy", "messages")
		_, err = collection.InsertOne(context.Background(), msg)
		if err != nil {
			fmt.Println("Error saving message to DB:", err)
		} else {
			fmt.Println("Message saved to DB:", msg.Content)
		}

		broadcast <- BroadcastMessage{
			Message:    msg,
			SenderConn: conn,
		}
		fmt.Println("Message sent to broadcast channel")
	}
}

func Broadcaster() {
	for {
		b := <-broadcast
		msg := b.Message
		sender := b.SenderConn

		fmt.Println("Broadcasting message:", msg.Content)

		clientsMutex_chat.RLock()
		for conn, client := range clients {
			if conn == sender {
				continue
			}
			if client.GroupID == msg.GroupID {
				fmt.Println("Sending to", client.Username)
				err := conn.WriteJSON(msg)
				if err != nil {
					fmt.Println("Error sending to", client.Username, ":", err)
					conn.Close()
					clientsMutex_chat.RUnlock()
					clientsMutex_chat.Lock()
					delete(clients, conn)
					clientsMutex_chat.Unlock()
					clientsMutex_chat.RLock()
				} else {
					fmt.Println("Message sent to", client.Username)
				}
			}
		}
		clientsMutex_chat.RUnlock()
	}
}
