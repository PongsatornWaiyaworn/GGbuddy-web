package handlers

import (
	"encoding/json"
	"ggbuddy/models"
	"ggbuddy/utils"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

var client *mongo.Client

func init() {
	var err error
	client, err = connectToMongoDB()
	if err != nil {
		log.Fatal("Error connecting to MongoDB", err)
	}
}

func connectToMongoDB() (*mongo.Client, error) {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: No .env file found")
	}

	uri := os.Getenv("MONGO_URI")
	if uri == "" {
		log.Fatal("Error: MONGO_URI is not set in .env")
	}

	client, err := mongo.Connect(nil, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}
	err = client.Ping(nil, nil)
	if err != nil {
		return nil, err
	}
	return client, nil
}

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var user models.User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	collection := client.Database("test").Collection("users")
	user.Password = string(hashedPassword)
	_, err = collection.InsertOne(nil, user)
	if err != nil {
		http.Error(w, "Error saving user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User registered successfully"})
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var user models.User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	collection := client.Database("test").Collection("users")
	var dbUser models.User
	err = collection.FindOne(nil, bson.M{"email": user.Email}).Decode(&dbUser)
	if err != nil {
		http.Error(w, "User not found", http.StatusUnauthorized)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(dbUser.Password), []byte(user.Password))
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	tokenString, err := utils.GenerateJWT(dbUser.ID)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
}
