package database

import (
	"context"
	"log"
	"os"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client

func ConnectToMongoDB() (*mongo.Client, error) {
	err := godotenv.Load("../.env")
	if err != nil {
		log.Println("Warning: No .env file found")
	}

	uri := os.Getenv("MONGO_URI")

	if uri == "" {
		log.Fatal("Error: MONGO_URI is not set in .env")
	}

	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}

	err = client.Ping(context.TODO(), nil)
	if err != nil {
		return nil, err
	}

	Client = client
	log.Println("Connected to MongoDB")
	return client, nil
}

func GetCollection(dbName, colName string) *mongo.Collection {
	if Client == nil {
		log.Fatal("MongoDB client is not connected")
	}
	return Client.Database(dbName).Collection(colName)
}
