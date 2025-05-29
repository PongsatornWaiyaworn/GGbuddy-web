package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Profile struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID      primitive.ObjectID `bson:"user_id,omitempty" json:"user_id,omitempty"`
	Username    string             `bson:"username" json:"username"`
	DisplayName string             `bson:"display_name" json:"display_name"`
	Age         int                `bson:"age" json:"age"`
	Gender      string             `bson:"gender" json:"gender"`
	Bio         string             `bson:"bio" json:"bio"`
	Games       []string           `bson:"games" json:"games"`
	Interests   []string           `bson:"interests" json:"interests"`
	DiscordURL  string             `bson:"discord_url" json:"discord_url"`
	FacebookURL string             `bson:"facebook_url" json:"facebook_url"`
	LineURL     string             `bson:"line_url" json:"line_url"`
	OtherURL    string             `bson:"other_url" json:"other_url"`
	Img         string             `bson:"img" json:"img"`
	Timestamp   time.Time          `bson:"timestamp" json:"timestamp"`
}
