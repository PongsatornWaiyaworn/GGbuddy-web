package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Group struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name      string             `bson:"name" json:"name"`
	Members   []string           `bson:"members" json:"members"`
	CreatedAt string             `bson:"created_at" json:"created_at"`
}

type Message struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	GroupID   primitive.ObjectID `bson:"group_id" json:"group_id"`
	SenderID  string             `bson:"sender_id" json:"sender_id"`
	Content   string             `bson:"content" json:"content"`
	Timestamp string             `bson:"timestamp" json:"timestamp"`
}
