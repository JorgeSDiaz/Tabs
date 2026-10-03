package http

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	cyclesdomain "tabs-api/internal/cycles/domain"
	"tabs-api/internal/movements/application"
	"tabs-api/internal/movements/domain"
)

var storedCreatedAt = time.Date(2026, time.September, 16, 9, 0, 0, 0, time.UTC)

// fakeRepository holds one movement, id 7, created on September 16.
type fakeRepository struct {
	updates int
}

func (f *fakeRepository) Create(_ context.Context, m domain.Movement) (domain.Movement, error) {
	return m, nil
}

func (f *fakeRepository) Update(_ context.Context, id int64, m domain.Movement) (domain.Movement, error) {
	f.updates++
	if id != 7 {
		return domain.Movement{}, domain.ErrNotFound
	}
	m.ID = id
	m.CreatedAt = storedCreatedAt
	return m, nil
}

func (f *fakeRepository) ListForCycle(context.Context, cyclesdomain.Cycle) ([]domain.Movement, error) {
	return nil, nil
}

func (f *fakeRepository) Delete(context.Context, int64) (bool, error) { return false, nil }

func put(t *testing.T, repo *fakeRepository, id, body string) *httptest.ResponseRecorder {
	t.Helper()
	mux := http.NewServeMux()
	NewHandler(application.NewService(repo, nil)).Register(mux)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest(http.MethodPut, "/api/v1/movements/"+id, strings.NewReader(body)))
	return rec
}

const validBody = `{"amount_cents":14830000,"direction":"out","category_id":4,"occurred_on":"2026-09-28","note":"Supermarket run"}`

func TestUpdateReturnsTheUpdatedMovement(t *testing.T) {
	t.Parallel()
	repo := &fakeRepository{}
	rec := put(t, repo, "7", validBody)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d, want 200 (body %q)", rec.Code, rec.Body)
	}

	var got movementJSON
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode %q: %v", rec.Body, err)
	}
	want := movementJSON{
		ID:          7,
		AmountCents: 14830000,
		Direction:   "out",
		CategoryID:  4,
		OccurredOn:  "2026-09-28",
		Note:        "Supermarket run",
		CreatedAt:   storedCreatedAt,
	}
	if got != want {
		t.Fatalf("got %+v, want %+v", got, want)
	}
}

func TestUpdateRejections(t *testing.T) {
	t.Parallel()
	for _, tc := range []struct {
		name string
		id   string
		body string
	}{
		{"invalid JSON", "7", `{"amount_cents":`},
		{"bad date", "7", `{"amount_cents":100,"direction":"out","category_id":4,"occurred_on":"28/09/2026"}`},
		{"zero amount", "7", `{"amount_cents":0,"direction":"out","category_id":4,"occurred_on":"2026-09-28"}`},
		{"non-integer id", "seven", validBody},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			repo := &fakeRepository{}
			rec := put(t, repo, tc.id, tc.body)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("status %d, want 400 (body %q)", rec.Code, rec.Body)
			}
			var body map[string]string
			if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil || body["error"] == "" {
				t.Errorf("body %q has no error message", rec.Body)
			}
			if repo.updates != 0 {
				t.Errorf("repository reached %d times, want 0", repo.updates)
			}
		})
	}
}

func TestUpdateUnknownMovement(t *testing.T) {
	t.Parallel()
	rec := put(t, &fakeRepository{}, "8", validBody)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status %d, want 404 (body %q)", rec.Code, rec.Body)
	}
}
