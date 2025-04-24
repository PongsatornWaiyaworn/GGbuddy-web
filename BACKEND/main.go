package main

import (
	"fmt"
	"log"
	"net/http"

	"ggbuddy/database"
	"ggbuddy/handlers"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {
	// เชื่อมต่อ MongoDB
	_, err := database.ConnectToMongoDB()
	if err != nil {
		log.Fatal("Error connecting to MongoDB:", err)
		return
	}

	go handlers.Broadcaster()

	r := mux.NewRouter()

	// ตั้งค่า CORS ให้อนุญาตทุกพอร์ต
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	r.HandleFunc("/ws", handlers.WebSocketHandler_chat)
	r.HandleFunc("/ws-match", handlers.WebSocketHandler_match)
	r.HandleFunc("/login", handlers.LoginHandler)
	r.HandleFunc("/register", handlers.RegisterHandler)
	r.HandleFunc("/groups", handlers.CreateGroupHandler).Methods("POST")
	r.HandleFunc("/api/chats", handlers.GetUserChatsHandler).Methods("GET")
	r.HandleFunc("/messages/send", handlers.SendMessageHandler).Methods("POST")
	r.HandleFunc("/messages", handlers.GetMessagesHandler).Methods("GET")
	r.HandleFunc("/match", handlers.CreateMatchingCriteriaHandler).Methods("POST")
	r.HandleFunc("/matching/delete", handlers.DeleteMatchingCriteriaHandler).Methods("DELETE")

	r.HandleFunc("/api/test", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"message": "CORS enabled for all ports!"}`))
	}).Methods("GET")

	go handlers.Broadcaster()
	go handlers.Broadcaster_match()

	handler := c.Handler(r)

	fmt.Println("Server started at http://localhost:8080")
	err = http.ListenAndServe(":8080", handler)
	if err != nil {
		log.Fatal(err)
	}
}
