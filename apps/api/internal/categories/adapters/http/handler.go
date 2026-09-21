package http

import (
	"encoding/json"
	"net/http"

	"tabs-api/internal/categories/application"
)

type Handler struct {
	svc *application.Service
}

func NewHandler(svc *application.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/categories", h.list)
}

type categoryJSON struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	Direction string `json:"direction"`
	SortOrder int    `json:"sort_order"`
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	categories, err := h.svc.List(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "internal server error"})
		return
	}

	out := make([]categoryJSON, 0, len(categories))
	for _, c := range categories {
		out = append(out, categoryJSON{ID: c.ID, Name: c.Name, Direction: c.Direction, SortOrder: c.SortOrder})
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(out)
}
