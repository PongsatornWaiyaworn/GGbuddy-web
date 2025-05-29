package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Profile struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"`
	UserID      primitive.ObjectID `bson:"user_id"`
	Username    string             `bson:"username"`
	DisplayName string             `bson:"display_name"`
	Img         string             `bson:"img"`
	Age         int                `bson:"age"`
	Interests   *[]string          `bson:"interests,omitempty"`    // nullable
	Games       *[]string          `bson:"games,omitempty"`        // nullable
	DiscordURL  *string            `bson:"discord_url,omitempty"`  // nullable
	FacebookURL *string            `bson:"facebook_url,omitempty"` // nullable
	LineURL     *string            `bson:"line_url,omitempty"`     // nullable
	OtherURL    *string            `bson:"other_url,omitempty"`    // nullable
	Bio         *string            `bson:"bio,omitempty"`          // nullable
	Timestamp   time.Time          `bson:"timestamp"`
}
