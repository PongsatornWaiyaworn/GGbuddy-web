package models

type MatchingCriteria struct {
	Username        string   `json:"username"`
	Interests       []string `json:"interests"`
	PreferredGender string   `json:"preferred_gender"` // เพศที่ต้องการแมตช์ ("any" คือไม่สนใจ)
	PreferredGame   string   `json:"preferred_game"`
	GroupSize       int      `json:"group_size"`
}
