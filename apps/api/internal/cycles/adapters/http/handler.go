package http

import (
	"encoding/json"
	"net/http"

	"tabs-api/internal/cycles/application"
)

type Handler struct {
	svc *application.Service
}

func NewHandler(svc *application.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/cycles/current", h.current)
}

type balanceJSON struct {
	TotalIn  int64 `json:"total_in"`
	TotalOut int64 `json:"total_out"`
	Net      int64 `json:"net"`
}

type categoryTotalJSON struct {
	CategoryID    int64  `json:"category_id"`
	Direction     string `json:"direction"`
	TotalCents    int64  `json:"total_cents"`
	MovementCount int    `json:"movement_count"`
}

type currentJSON struct {
	StartsOn       string              `json:"starts_on"`
	EndsOn         string              `json:"ends_on"`
	Balance        balanceJSON         `json:"balance"`
	CategoryTotals []categoryTotalJSON `json:"category_totals"`
}

func (h *Handler) current(w http.ResponseWriter, r *http.Request) {
	current, err := h.svc.Current(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "internal server error"})
		return
	}

	// Made, not declared, so an empty cycle encodes as [] and not null.
	totals := make([]categoryTotalJSON, 0, len(current.CategoryTotals))
	for _, t := range current.CategoryTotals {
		totals = append(totals, categoryTotalJSON{
			CategoryID:    t.CategoryID,
			Direction:     t.Direction,
			TotalCents:    t.TotalCents,
			MovementCount: t.MovementCount,
		})
	}

	// EndsOn is exclusive: the cycle runs [StartsOn, EndsOn).
	out := currentJSON{
		StartsOn: current.Cycle.Start.Format("2006-01-02"),
		EndsOn:   current.Cycle.End.Format("2006-01-02"),
		Balance: balanceJSON{
			TotalIn:  current.Balance.TotalIn,
			TotalOut: current.Balance.TotalOut,
			Net:      current.Balance.Net(),
		},
		CategoryTotals: totals,
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(out)
}
