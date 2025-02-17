package models

import "time"

type Profile struct {
	Username    string    `json:"username"`
	DisplayName string    `json:"display_name"`
	Age         int       `json:"age"`
	Interests   []string  `json:"interests"`
	Gender      string    `json:"gender"`
	Games       []string  `json:"games"`
	DiscordURL  string    `json:"discord_url"`
	FacebookURL string    `json:"facebook_url"`
	LineURL     string    `json:"line_url"`
	OtherURL    string    `json:"other_url"`
	Bio         string    `json:"bio"`
	Timestamp   time.Time `json:"timestamp"`
}
