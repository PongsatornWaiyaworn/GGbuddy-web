package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type OTP struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	Email     string             `bson:"email"`
	Code      string             `bson:"code"`
	ExpiresAt string             `bson:"expires_at"`
}
