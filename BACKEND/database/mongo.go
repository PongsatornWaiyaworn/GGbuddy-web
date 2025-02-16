package database

import (
	"context"
	"log"
	"os"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Global MongoDB client
var Client *mongo.Client

// ConnectToMongoDB ทำการเชื่อมต่อไปยัง MongoDB
func ConnectToMongoDB() (*mongo.Client, error) {
	// โหลด .env
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: No .env file found")
	}

	// อ่านค่าจาก .env
	uri := os.Getenv("MONGO_URI")
	println(uri)
	if uri == "" {
		log.Fatal("Error: MONGO_URI is not set in .env")
	}

	// เชื่อมต่อกับ MongoDB
	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}

	// ตรวจสอบการเชื่อมต่อ
	err = client.Ping(context.TODO(), nil)
	if err != nil {
		return nil, err
	}

	Client = client
	log.Println("Connected to MongoDB")
	return client, nil
}

// GetCollection ช่วยดึงข้อมูล collection จาก MongoDB
func GetCollection(dbName, colName string) *mongo.Collection {
	if Client == nil {
		log.Fatal("MongoDB client is not connected")
	}
	return Client.Database(dbName).Collection(colName)
}
