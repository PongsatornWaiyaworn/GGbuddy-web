package handlers

import (
	"context"
	"fmt"
	"ggbuddy/database"
	"ggbuddy/models"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var (
	clientsMatch   = make(map[*websocket.Conn]string)
	clientsMutex   sync.Mutex
	broadcastMatch = make(chan models.MatchingCriteria)
	upgraderMatch  = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
)

func WebSocketHandler_match(w http.ResponseWriter, r *http.Request) {
	conn, err := upgraderMatch.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, "Failed to upgrade connection", http.StatusInternalServerError)
		return
	}

	username := r.URL.Query().Get("username")
	if username == "" {
		conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, "Username required"))
		conn.Close()
		return
	}

	clientsMutex.Lock()
	clientsMatch[conn] = username
	clientsMutex.Unlock()

	fmt.Println(username, "connected")

	defer func() {
		clientsMutex.Lock()
		delete(clientsMatch, conn)
		clientsMutex.Unlock()
		conn.Close()
		fmt.Println(username, "disconnected")
	}()

	for {
		var criteria models.MatchingCriteria
		err := conn.ReadJSON(&criteria)
		if err != nil {
			fmt.Println("Error reading json:", err)
			break
		}

		criteria.Username = username

		groupID, err := handleMatchingLogic(criteria)
		if err != nil {
			conn.WriteJSON(map[string]string{"message": "Error finding match: " + err.Error()})
			continue
		}

		if groupID != nil {
			conn.WriteJSON(map[string]interface{}{"message": "Match found!", "group_id": groupID.Hex()})
		} else {
			conn.WriteJSON(map[string]string{"message": "No match found, added to waiting list"})
		}
	}
}

func handleMatchingLogic(criteria models.MatchingCriteria) (*primitive.ObjectID, error) {
	collection := database.GetCollection("ggbuddy", "waiting_match")
	groupCollection := database.GetCollection("ggbuddy", "groups")
	blockCollection := database.GetCollection("ggbuddy", "blocked_users")

	ctx := context.Background()

	count, err := collection.CountDocuments(ctx, bson.M{"username": criteria.Username})
	if err != nil {
		fmt.Println("Error counting documents:", err)
		return nil, err
	}

	if count == 0 {
		newCriteria := bson.M{
			"_id":              primitive.NewObjectID(),
			"username":         criteria.Username,
			"gender":           criteria.Gender,
			"interests":        criteria.Interests,
			"preferred_gender": criteria.PreferredGender,
			"preferred_game":   criteria.PreferredGame,
			"group_size":       criteria.GroupSize,
			"mode":             criteria.Mode,
			"created_at":       time.Now().Format(time.RFC3339),
		}

		_, err = collection.InsertOne(ctx, newCriteria)
		if err != nil {
			fmt.Println("Error inserting new criteria:", err)
			return nil, err
		}
		fmt.Println("Inserted new waiting criteria:", newCriteria)

		go cancelIfTimeout(criteria.Username)
	}

	blockedUsersMap := make(map[string]bool)
	blockFilter := bson.M{
		"$or": []bson.M{
			{"blocker_username": criteria.Username},
			{"blocked_username": criteria.Username},
		},
	}
	blockCursor, err := blockCollection.Find(ctx, blockFilter)
	if err != nil {
		return nil, err
	}
	defer blockCursor.Close(ctx)

	for blockCursor.Next(ctx) {
		var block struct {
			Blocker string `bson:"blocker_username"`
			Blocked string `bson:"blocked_username"`
		}
		if err := blockCursor.Decode(&block); err == nil {
			if block.Blocker == criteria.Username {
				blockedUsersMap[block.Blocked] = true // เราบล็อกเขา
			} else {
				blockedUsersMap[block.Blocker] = true // เขาบล็อกเรา
			}
		}
	}

	filter := bson.M{
		"preferred_game": criteria.PreferredGame,
		"mode":           criteria.Mode,
		"group_size":     criteria.GroupSize,
		"username":       bson.M{"$ne": criteria.Username},
	}
	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	type playerWithScore struct {
		Player models.MatchingCriteria
		Score  int
	}
	var candidates []playerWithScore

	for cursor.Next(ctx) {
		var player models.MatchingCriteria
		if err := cursor.Decode(&player); err != nil {
			continue
		}

		// ไม่จับคู่กับคนที่มีการบล็อกระหว่างกัน
		if blockedUsersMap[player.Username] {
			continue
		}

		// ตรวจสอบ Gender
		if criteria.PreferredGender != "" && criteria.PreferredGender != "all" && player.Gender != criteria.PreferredGender {
			continue
		}
		if player.PreferredGender != "" && player.PreferredGender != "all" && criteria.Gender != player.PreferredGender {
			continue
		}

		// นับความสนใจที่ตรงกัน
		score := countMatchingInterests(criteria.Interests, player.Interests)
		candidates = append(candidates, playerWithScore{Player: player, Score: score})
	}

	if len(candidates)+1 >= criteria.GroupSize {
		members := make([]string, 0, criteria.GroupSize)
		for i := 0; i < criteria.GroupSize-1; i++ {
			members = append(members, candidates[i].Player.Username)
		}
		members = append(members, criteria.Username)

		now := time.Now()
		groupName := fmt.Sprintf("%s-%s (%s)", criteria.PreferredGame, criteria.Mode, now.Format("02 January 2006, 15:04:05"))

		group := bson.M{
			"_id":        primitive.NewObjectID(),
			"name":       groupName,
			"members":    members,
			"created_at": now.Format(time.RFC3339),
		}

		result, err := groupCollection.InsertOne(ctx, group)
		if err != nil {
			fmt.Println("Error inserting group:", err)
			return nil, err
		}

		_, err = collection.DeleteMany(ctx, bson.M{"username": bson.M{"$in": members}})
		if err != nil {
			return nil, err
		}

		groupID := result.InsertedID.(primitive.ObjectID)
		notifyGroupMembers(members, groupID)
		return &groupID, nil
	}

	fmt.Println("Not enough candidates to form a group.")
	return nil, nil
}

// notifyGroupMembers ส่งข้อความแจ้งสมาชิกกลุ่มผ่าน websocket
func notifyGroupMembers(members []string, groupID primitive.ObjectID) {
	clientsMutex.Lock()
	defer clientsMutex.Unlock()

	for conn, user := range clientsMatch {
		if contains(members, user) {
			err := conn.WriteJSON(map[string]interface{}{
				"message":  "Match found and group created",
				"group_id": groupID.Hex(),
			})
			if err != nil {
				fmt.Println("Error notifying user", user, ":", err)
				conn.Close()
				delete(clientsMatch, conn)
			}
		}
	}
}

func cancelIfTimeout(username string) {
	time.Sleep(5 * time.Minute)

	collection := database.GetCollection("ggbuddy", "waiting_match")
	ctx := context.Background()
	_, err := collection.DeleteOne(ctx, bson.M{"username": username})
	if err != nil {
		fmt.Println("Error cancelling match:", err)
	}

	clientsMutex.Lock()
	defer clientsMutex.Unlock()

	for conn, user := range clientsMatch {
		if user == username {
			conn.WriteJSON(map[string]string{"message": "Your match request has been cancelled due to timeout"})
			conn.Close()
			delete(clientsMatch, conn)
		}
	}
}

func contains(slice []string, item string) bool {
	for _, a := range slice {
		if a == item {
			return true
		}
	}
	return false
}

func countMatchingInterests(a, b []string) int {
	set := make(map[string]bool)
	for _, v := range a {
		set[v] = true
	}
	count := 0
	for _, v := range b {
		if set[v] {
			count++
		}
	}
	return count
}
