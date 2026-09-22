package http

import (
	"encoding/json"
	"errors"
	"net/http"

	"tabs-api/internal/dashboard/application"
	"tabs-api/internal/dashboard/domain"
)

type Handler struct {
	svc *application.Service
}

func NewHandler(svc *application.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/dashboard/widgets", h.get)
	mux.HandleFunc("PUT /api/v1/dashboard/widgets", h.put)
}

type settingsJSON struct {
	Widgets map[string]bool `json:"widgets"`
}

func fromDomain(s domain.WidgetSettings) map[string]bool {
	out := make(map[string]bool, len(s))
	for id, enabled := range s {
		out[string(id)] = enabled
	}
	return out
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	settings, err := h.svc.Widgets(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	writeJSON(w, http.StatusOK, settingsJSON{Widgets: fromDomain(settings)})
}

func (h *Handler) put(w http.ResponseWriter, r *http.Request) {
	// Decoding into map[string]bool is the single place a non-boolean
	// value is rejected: the JSON decoder fails before the domain sees
	// anything. The unknown/missing-id rule lives in the domain.
	var req settingsJSON
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	settings, err := h.svc.Save(r.Context(), req.Widgets)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, settingsJSON{Widgets: fromDomain(settings)})
}

func writeDomainError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrUnknownWidget),
		errors.Is(err, domain.ErrMissingWidget):
		writeError(w, http.StatusBadRequest, err.Error())
	default:
		writeError(w, http.StatusInternalServerError, "internal server error")
	}
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
