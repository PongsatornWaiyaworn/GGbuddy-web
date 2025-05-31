package models

import (
	"context"
	"time"

	"ggbuddy/database"

	"go.mongodb.org/mongo-driver/bson"
)

type Block struct {
	BlockerUsername    string    `bson:"blocker_username"`
	BlockedUsername    string    `bson:"blocked_username"`
	BlockedDisplayName string    `bson:"blocked_display_name"`
	Timestamp          time.Time `bson:"timestamp"`
}

func (b *Block) Save(ctx context.Context) error {
	collection := database.GetCollection("ggbuddy", "blocked_users")
	_, err := collection.InsertOne(ctx, b)
	return err
}

func IsBlockedOneway(ctx context.Context, user1 string, user2 string) (bool, error) {
	collection := database.GetCollection("ggbuddy", "blocked_users")
	filter := bson.M{
		"$or": []bson.M{
			{"blocker_username": user1, "blocked_username": user2},
		},
	}
	count, err := collection.CountDocuments(ctx, filter)
	return count > 0, err
}

func IsBlocked(ctx context.Context, user1 string, user2 string) (bool, error) {
	collection := database.GetCollection("ggbuddy", "blocked_users")
	filter := bson.M{
		"$or": []bson.M{
			{"blocker_username": user1, "blocked_username": user2},
			{"blocker_username": user2, "blocked_username": user1},
		},
	}
	count, err := collection.CountDocuments(ctx, filter)
	return count > 0, err
}

func GetBlockedUsersByBlocker(ctx context.Context, blockerUsername string) ([]Block, error) {
	collection := database.GetCollection("ggbuddy", "blocked_users")

	filter := bson.M{"blocker_username": blockerUsername}
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

func UnblockUser(ctx context.Context, blocker string, blocked string) error {
	collection := database.GetCollection("ggbuddy", "blocked_users")
	filter := bson.M{
		"blocker_username": blocker,
		"blocked_username": blocked,
	}
	_, err := collection.DeleteOne(ctx, filter)
	return err
}
