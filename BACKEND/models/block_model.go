package models

import (
	"context"
	"time"

	"ggbuddy/database"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Block struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	BlockerID string             `bson:"blocker_id" json:"blocker_id"`
	BlockedID string             `bson:"blocked_id" json:"blocked_id"`
	Timestamp time.Time          `bson:"timestamp" json:"timestamp"`
}

func (b *Block) Save(ctx context.Context) error {
	collection := database.GetCollection("ggbuddy", "blocked_users")
	_, err := collection.InsertOne(ctx, b)
	return err
}

func IsBlocked(ctx context.Context, user1 string, user2 string) (bool, error) {
	collection := database.GetCollection("ggbuddy", "blocked_users")
	filter := bson.M{
		"$or": []bson.M{
			{"blocker_id": user1, "blocked_id": user2},
			{"blocker_id": user2, "blocked_id": user1},
		},
	}
	count, err := collection.CountDocuments(ctx, filter)
	return count > 0, err
}

func GetBlockedUsersByBlocker(ctx context.Context, blockerID string) ([]Block, error) {
	collection := database.GetCollection("ggbuddy", "blocked_users")

	filter := bson.M{"blocker_id": blockerID}
	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []Block
	for cursor.Next(ctx) {
		var b Block
		if err := cursor.Decode(&b); err != nil {
			return nil, err
		}
		results = append(results, b)
	}
	return results, nil
}
