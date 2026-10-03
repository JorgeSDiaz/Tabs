package http

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"tabs-api/internal/movements/application"
	"tabs-api/internal/movements/domain"
)

type Handler struct {
	svc *application.Service
}

func NewHandler(svc *application.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/v1/movements", h.create)
	mux.HandleFunc("GET /api/v1/movements", h.list)
	mux.HandleFunc("PUT /api/v1/movements/{id}", h.update)
	mux.HandleFunc("DELETE /api/v1/movements/{id}", h.delete)
}

type movementJSON struct {
	ID          int64     `json:"id"`
	AmountCents int64     `json:"amount_cents"`
	Direction   string    `json:"direction"`
	CategoryID  int64     `json:"category_id"`
	OccurredOn  string    `json:"occurred_on"`
	Note        string    `json:"note"`
	CreatedAt   time.Time `json:"created_at"`
}

func toJSON(m domain.Movement) movementJSON {
	return movementJSON{
		ID:          m.ID,
		AmountCents: m.AmountCents,
		Direction:   string(m.Direction),
		CategoryID:  m.CategoryID,
		OccurredOn:  m.OccurredOn.Format("2006-01-02"),
		Note:        m.Note,
		CreatedAt:   m.CreatedAt,
	}
}

type movementRequest struct {
	AmountCents int64  `json:"amount_cents"`
	Direction   string `json:"direction"`
	CategoryID  int64  `json:"category_id"`
	OccurredOn  string `json:"occurred_on"`
	Note        string `json:"note"`
}

// decodeInput reads the body that recording and editing share. On a body
// it cannot use it writes the 400 itself and reports false.
func decodeInput(w http.ResponseWriter, r *http.Request) (application.MovementInput, bool) {
	var req movementRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return application.MovementInput{}, false
	}

	occurredOn, err := time.Parse("2006-01-02", req.OccurredOn)
	if err != nil {
		writeError(w, http.StatusBadRequest, "occurred_on must be a date in YYYY-MM-DD")
		return application.MovementInput{}, false
	}

	return application.MovementInput{
		AmountCents: req.AmountCents,
		Direction:   domain.Direction(req.Direction),
		CategoryID:  req.CategoryID,
		OccurredOn:  occurredOn,
		Note:        req.Note,
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
	m, err := h.svc.Record(r.Context(), in)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, toJSON(m))
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
	m, err := h.svc.Update(r.Context(), id, in)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, toJSON(m))
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	movements, err := h.svc.ListActive(r.Context())
	if err != nil {
		writeDomainError(w, err)
		return
	}

	out := make([]movementJSON, 0, len(movements))
	for _, m := range movements {
		out = append(out, toJSON(m))
	}
	writeJSON(w, http.StatusOK, out)
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

func writeDomainError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrInvalidAmount),
		errors.Is(err, domain.ErrInvalidDirection),
		errors.Is(err, domain.ErrUnknownCategory),
		errors.Is(err, domain.ErrCategoryDirectionMismatch):
		writeError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, domain.ErrNotFound):
		writeError(w, http.StatusNotFound, err.Error())
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
