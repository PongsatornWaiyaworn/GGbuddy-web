package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"ggbuddy/models"

	"github.com/gorilla/mux"
)

type BlockRequest struct {
	BlockerID string `json:"blocker_id"`
	BlockedID string `json:"blocked_id"`
}

func BlockUserHandler(w http.ResponseWriter, r *http.Request) {
	var req BlockRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	block := models.Block{
		BlockerID: req.BlockerID,
		BlockedID: req.BlockedID,
		Timestamp: time.Now(),
	}

	err := block.Save(r.Context())
	if err != nil {
		http.Error(w, "Failed to block user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "User blocked successfully"})
}

func GetBlockedUsersHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	blockerID := vars["blocker_id"]

	blockedUsers, err := models.GetBlockedUsersByBlocker(r.Context(), blockerID)
	if err != nil {
		http.Error(w, "Failed to retrieve blocked users", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(blockedUsers)
}
