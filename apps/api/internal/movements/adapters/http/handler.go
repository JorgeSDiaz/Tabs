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

type pageJSON struct {
	Items      []movementJSON `json:"items"`
	Page       int            `json:"page"`
	TotalPages int            `json:"total_pages"`
	Total      int            `json:"total"`
}

// pageParam reads the page query parameter, 1 when it is absent. This is
// the one place a page is checked to be a positive integer; it writes the
// 400 itself when it is not.
func pageParam(w http.ResponseWriter, r *http.Request) (int, bool) {
	query := r.URL.Query()
	if !query.Has("page") {
		return 1, true
	}
	page, err := strconv.Atoi(query.Get("page"))
	if err != nil || page < 1 {
		writeError(w, http.StatusBadRequest, "page must be a positive integer")
		return 0, false
	}
	return page, true
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	requested, ok := pageParam(w, r)
	if !ok {
		return
	}
	page, err := h.svc.ListActive(r.Context(), requested)
	if err != nil {
		writeDomainError(w, err)
		return
	}

	items := make([]movementJSON, 0, len(page.Items))
	for _, m := range page.Items {
		items = append(items, toJSON(m))
	}
	writeJSON(w, http.StatusOK, pageJSON{
		Items:      items,
		Page:       page.Page,
		TotalPages: page.TotalPages,
		Total:      page.Total,
	})
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
