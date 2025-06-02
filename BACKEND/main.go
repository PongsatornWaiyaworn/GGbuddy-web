package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"ggbuddy/database"
	"ggbuddy/handlers"
	"ggbuddy/middleware"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using system env variables")
	}

	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	if allowedOrigin == "" {
		log.Fatal("ALLOWED_ORIGIN not set in environment")
	}

	_, err = database.ConnectToMongoDB()
	if err != nil {
		log.Fatal("Error connecting to MongoDB:", err)
		return
	}

	go handlers.Broadcaster()

	r := mux.NewRouter()

	r.HandleFunc("/ws", handlers.WebSocketHandler_chat)
	r.HandleFunc("/ws-match", handlers.WebSocketHandler_match)
	r.HandleFunc("/login", handlers.LoginHandler)
	r.HandleFunc("/register", handlers.RegisterHandler)
	r.HandleFunc("/groups", handlers.CreateGroupHandler).Methods("POST")
	r.HandleFunc("/api/chats", handlers.GetUserChatsHandler).Methods("GET")
	r.HandleFunc("/messages/send", handlers.SendMessageHandler).Methods("POST")
	r.HandleFunc("/messages", handlers.GetMessagesHandler).Methods("GET")
	r.HandleFunc("/matching/delete", handlers.DeleteMatchingCriteriaHandler).Methods("DELETE")
	r.HandleFunc("/send-otp", handlers.SendOTPHandler).Methods("POST")
	r.HandleFunc("/verify-otp", handlers.VerifyOTPHandler).Methods("POST")
	r.HandleFunc("/block/{blockedUsername}", handlers.BlockUserHandler).Methods("POST")
	r.HandleFunc("/blocked-list/{blockerUsername}", handlers.GetBlockedUsersHandler).Methods("GET")
	r.HandleFunc("/unblock/{blockedUsername}", handlers.UnblockUserHandler).Methods("POST")
	r.HandleFunc("/change-password", handlers.ChangePasswordHandler).Methods("POST")
	r.HandleFunc("/check-password", handlers.CheckPasswordHandler).Methods("POST")
	r.HandleFunc("/profile", handlers.CreateOrUpdateProfileHandler).Methods("POST")
	r.HandleFunc("/profile", handlers.GetProfileHandler).Methods("GET")
	r.HandleFunc("/profile", handlers.UpdateProfileHandler).Methods("PUT")
	r.HandleFunc("/upload-s3", handlers.UploadFileHandler).Methods("POST")
	r.HandleFunc("/delete-user", handlers.DeleteUserHandler).Methods("POST")

	authMiddleware := middleware.AuthMiddleware
	handlerWithAuth := authMiddleware(r)

	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins:   []string{allowedOrigin},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	handler := corsMiddleware.Handler(handlerWithAuth)

	port := os.Getenv("PORT")
	if port == "" {
		port = "10000"
		log.Fatal("PORT not set in environment")
	}
	fmt.Println("Server started at port:" + port)
	err = http.ListenAndServe(":"+port, handler)
}
