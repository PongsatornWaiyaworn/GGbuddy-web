package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"ggbuddy/database"

	"go.mongodb.org/mongo-driver/bson"
)

func DeleteUserHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	username := req.Username
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 1. ลบจาก blocked_users ที่มี blocker_username ตรงกับ username
	blockedCol := database.GetCollection("ggbuddy", "blocked_users")
	_, err := blockedCol.DeleteMany(ctx, bson.M{"blocker_username": username})
	if err != nil {
		http.Error(w, "Error deleting from blocked_users", http.StatusInternalServerError)
		return
	}

	// 2. ลบจาก users
	usersCol := database.GetCollection("ggbuddy", "users")
	_, err = usersCol.DeleteOne(ctx, bson.M{"username": username})
	if err != nil {
		http.Error(w, "Error deleting from users", http.StatusInternalServerError)
		return
	}

	// 3. ลบจาก profiles
	profilesCol := database.GetCollection("ggbuddy", "profiles")
	_, err = profilesCol.DeleteOne(ctx, bson.M{"username": username})
	if err != nil {
		http.Error(w, "Error deleting from profiles", http.StatusInternalServerError)
		return
	}

	// 4. อัปเดต groups ให้ลบสมาชิกจาก members
	groupsCol := database.GetCollection("ggbuddy", "groups")
	_, err = groupsCol.UpdateMany(
		ctx,
		bson.M{"members": username},
		bson.M{"$pull": bson.M{"members": username}},
	)
	if err != nil {
		http.Error(w, "Error updating groups", http.StatusInternalServerError)
		return
	}

	// 5. อัปเดต messages ให้ sender_id เป็น "ไม่มี user นี้แล้ว"
	messagesCol := database.GetCollection("ggbuddy", "messages")
	_, err = messagesCol.UpdateMany(
		ctx,
		bson.M{"sender_id": username},
		bson.M{"$set": bson.M{"sender_id": "ไม่มี user นี้แล้ว"}},
	)
	if err != nil {
		http.Error(w, "Error updating messages", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "User '%s' deleted successfully", username)
}
