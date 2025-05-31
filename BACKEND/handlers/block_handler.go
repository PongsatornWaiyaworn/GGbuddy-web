package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"ggbuddy/models"

	"github.com/gorilla/mux"
)

type BlockRequest struct {
	BlockerUsername    string `json:"blocker_username"`
	BlockedUsername    string `json:"blocked_username"`
	BlockedDisplayName string `json:"blocked_display_name"`
}

func BlockUserHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	blockedUsername := vars["blockedUsername"]
	if blockedUsername == "" {
		http.Error(w, "Missing blocked username", http.StatusBadRequest)
		return
	}

	var req struct {
		BlockerUsername    string `json:"blocker_username"`
		BlockedDisplayName string `json:"blocked_display_name"`
	}

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.BlockerUsername == "" {
		http.Error(w, "Missing blocker username", http.StatusBadRequest)
		return
	}

	block := models.Block{
		BlockerUsername:    req.BlockerUsername,
		BlockedUsername:    blockedUsername,
		BlockedDisplayName: req.BlockedDisplayName,
		Timestamp:          time.Now(),
	}

	exists, err := models.IsBlockedOneway(r.Context(), req.BlockerUsername, blockedUsername)
	if err != nil {
		http.Error(w, "Failed to check if user is already blocked", http.StatusInternalServerError)
		return
	}
	if exists {
		http.Error(w, "User is already blocked", http.StatusConflict)
		return
	}

	err = block.Save(r.Context())
	if err != nil {
		http.Error(w, "Failed to block user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "User blocked successfully"})
}

func GetBlockedUsersHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	blockerUsername := vars["blockerUsername"]
	fmt.Printf("blockerUsername: %s\n", blockerUsername)

	blockedUsers, err := models.GetBlockedUsersByBlocker(r.Context(), blockerUsername)
	if err != nil {
		http.Error(w, "Failed to retrieve blocked users", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(blockedUsers)
}

func UnblockUserHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	blockedUsername := vars["blockedUsername"]

	var req struct {
		BlockerUsername string `json:"blocker_username"`
	}

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil || req.BlockerUsername == "" || blockedUsername == "" {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	err = models.UnblockUser(r.Context(), req.BlockerUsername, blockedUsername)
	if err != nil {
		http.Error(w, "Failed to unblock user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "User unblocked successfully"})
}
