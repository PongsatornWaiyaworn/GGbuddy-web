package models

type MatchingCriteria struct {
	Username        string   `json:"username" bson:"username"`
	Interests       []string `json:"interests" bson:"interests"`
	PreferredGender string   `json:"preferred_gender" bson:"preferred_gender"`
	PreferredGame   string   `json:"preferred_game" bson:"preferred_game"`
	GroupSize       int      `json:"group_size" bson:"group_size"`
	Mode            string   `json:"mode" bson:"mode"`
}
