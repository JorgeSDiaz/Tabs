package http

import (
	"encoding/json"
	"net/http"

	"tabs-api/internal/habit/application"
)

type Handler struct {
	svc *application.Service
}

func NewHandler(svc *application.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/habit", h.get)
}

type streakJSON struct {
	Current     int  `json:"current"`
	TodayLogged bool `json:"today_logged"`
}

type dayJSON struct {
	Date   string `json:"date"`
	Status string `json:"status"`
}

type xpJSON struct {
	Total         int `json:"total"`
	Level         int `json:"level"`
	LevelStartsAt int `json:"level_starts_at"`
	NextLevelAt   int `json:"next_level_at"`
}

type movementXPJSON struct {
	MovementID int64 `json:"movement_id"`
	XP         int   `json:"xp"`
}

type ruleJSON struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	XP    int    `json:"xp"`
}

type habitJSON struct {
	Streak     streakJSON       `json:"streak"`
	Days       []dayJSON        `json:"days"`
	XP         xpJSON           `json:"xp"`
	MovementXP []movementXPJSON `json:"movement_xp"`
	Rules      []ruleJSON       `json:"rules"`
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	habit, err := h.svc.Habit(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal server error"})
		return
	}

	out := habitJSON{
		Streak: streakJSON{Current: habit.Streak, TodayLogged: habit.TodayLogged},
		Days:   make([]dayJSON, 0, len(habit.Days)),
		XP: xpJSON{
			Total:         habit.TotalXP,
			Level:         habit.Level.Number,
			LevelStartsAt: habit.Level.StartsAt,
			NextLevelAt:   habit.Level.NextAt,
		},
		MovementXP: make([]movementXPJSON, 0, len(habit.MovementXP)),
		Rules:      make([]ruleJSON, 0, len(habit.Rules)),
	}
	for _, d := range habit.Days {
		out.Days = append(out.Days, dayJSON{Date: d.Date.Format("2006-01-02"), Status: string(d.Status)})
	}
	for _, m := range habit.MovementXP {
		out.MovementXP = append(out.MovementXP, movementXPJSON{MovementID: m.MovementID, XP: m.XP})
	}
	for _, r := range habit.Rules {
		out.Rules = append(out.Rules, ruleJSON{ID: r.ID, Label: r.Label, XP: r.XP})
	}
	writeJSON(w, http.StatusOK, out)
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(body)
}
