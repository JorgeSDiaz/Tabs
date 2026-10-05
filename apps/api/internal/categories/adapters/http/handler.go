package http

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

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
	mux.HandleFunc("PUT /api/v1/categories/{id}", h.update)
	mux.HandleFunc("DELETE /api/v1/categories/{id}", h.delete)
}

// categoryJSON leaves the catch-all flag out: the listing order already
// carries it, and nothing can set it.
type categoryJSON struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	Direction string `json:"direction"`
	Color     string `json:"color"`
	Icon      string `json:"icon"`
	SortOrder int    `json:"sort_order"`
}

func toJSON(c domain.Category) categoryJSON {
	return categoryJSON{
		ID:        c.ID,
		Name:      c.Name,
		Direction: c.Direction,
		Color:     c.Color,
		Icon:      c.Icon,
		SortOrder: c.SortOrder,
	}
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

type categoryRequest struct {
	Name      string `json:"name"`
	Direction string `json:"direction"`
	Color     string `json:"color"`
	Icon      string `json:"icon"`
}

// decodeInput reads the body that creating and editing share; an edit
// ignores the direction. On a body it cannot use it writes the 400 itself
// and reports false.
func decodeInput(w http.ResponseWriter, r *http.Request) (application.CategoryInput, bool) {
	var req categoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return application.CategoryInput{}, false
	}
	return application.CategoryInput{
		Name:      req.Name,
		Direction: req.Direction,
		Color:     req.Color,
		Icon:      req.Icon,
	}, true
}

// pathID reads the {id} path value, writing the 400 itself when it is not
// an integer.
func pathID(w http.ResponseWriter, r *http.Request) (int64, bool) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "id must be an integer")
		return 0, false
	}
	return id, true
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	in, ok := decodeInput(w, r)
	if !ok {
		return
	}
	c, err := h.svc.Create(r.Context(), in)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, toJSON(c))
}

func (h *Handler) update(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	in, ok := decodeInput(w, r)
	if !ok {
		return
	}
	c, err := h.svc.Update(r.Context(), id, in)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, toJSON(c))
}

func (h *Handler) delete(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	if err := h.svc.Delete(r.Context(), id); err != nil {
		writeDomainError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// The message of a refusal is what the categories screen shows, so each
// one says what is wrong in the user's terms.
func writeDomainError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrBlankName),
		errors.Is(err, domain.ErrInvalidDirection),
		errors.Is(err, domain.ErrInvalidColor),
		errors.Is(err, domain.ErrBlankIcon):
		writeError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, domain.ErrNotFound):
		writeError(w, http.StatusNotFound, err.Error())
	case errors.Is(err, domain.ErrDuplicateName),
		errors.Is(err, domain.ErrCategoryInUse),
		errors.Is(err, domain.ErrCatchAll),
		errors.Is(err, domain.ErrLastOfDirection):
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
