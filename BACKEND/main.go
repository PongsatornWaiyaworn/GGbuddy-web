package main

import (
	"fmt"
	"log"
	"net/http"

	"ggbuddy/database"
	"ggbuddy/handlers"
	"ggbuddy/middleware"

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
	go handlers.Broadcaster_match()

	r := mux.NewRouter()

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
	r.HandleFunc("/send-otp", handlers.SendOTPHandler).Methods("POST")
	r.HandleFunc("/verify-otp", handlers.VerifyOTPHandler).Methods("POST")
	r.HandleFunc("/block", handlers.BlockUserHandler).Methods("POST")
	r.HandleFunc("/blocked-list/{blocker_id}", handlers.GetBlockedUsersHandler).Methods("GET")
	r.HandleFunc("/change-password", handlers.ChangePasswordHandler).Methods("POST")
	r.HandleFunc("/profile", handlers.CreateOrUpdateProfileHandler).Methods("POST")
	r.HandleFunc("/profile", handlers.GetProfileHandler).Methods("GET")
	r.HandleFunc("/profile", handlers.UpdateProfileHandler).Methods("PUT")
	r.HandleFunc("/upload-s3", handlers.UploadFileHandler).Methods("POST")

	authMiddleware := middleware.AuthMiddleware

	handlerWithAuth := authMiddleware(r)

	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	handler := corsMiddleware.Handler(handlerWithAuth)

	fmt.Println("Server started at http://localhost:3000")
	err = http.ListenAndServe(":3000", handler)
	if err != nil {
		log.Fatal(err)
	}
}
