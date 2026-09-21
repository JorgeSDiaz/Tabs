package http

import (
	"encoding/json"
	"errors"
	"net/http"

	"tabs-api/internal/categories/application"
	"tabs-api/internal/categories/domain"
)

type Handler struct {
	svc *application.Service
}

func NewHandler(svc *application.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/categories", h.list)
	mux.HandleFunc("POST /api/v1/categories", h.create)
}

type categoryJSON struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	Direction string `json:"direction"`
	SortOrder int    `json:"sort_order"`
}

func toJSON(c domain.Category) categoryJSON {
	return categoryJSON{ID: c.ID, Name: c.Name, Direction: c.Direction, SortOrder: c.SortOrder}
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	categories, err := h.svc.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	out := make([]categoryJSON, 0, len(categories))
	for _, c := range categories {
		out = append(out, toJSON(c))
	}
	writeJSON(w, http.StatusOK, out)
}

type createRequest struct {
	Name      string `json:"name"`
	Direction string `json:"direction"`
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	var req createRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	c, err := h.svc.Create(r.Context(), req.Name, req.Direction)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, toJSON(c))
}

func writeDomainError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrBlankName),
		errors.Is(err, domain.ErrInvalidDirection):
		writeError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, domain.ErrDuplicateName):
		writeError(w, http.StatusConflict, err.Error())
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
