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

// fakeRepository holds one movement, id 7, created on September 16, for the
// writes. For the list, the active cycle holds listed movements with ids
// from listed down to 1, newest first.
type fakeRepository struct {
	updates int
	listed  int
	reads   int
}

type fakeSettings struct{}

func (fakeSettings) Settings(context.Context) (cyclesdomain.Settings, error) {
	return cyclesdomain.Settings{BoundaryDay: 30, Location: time.UTC}, nil
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

func (f *fakeRepository) CountForCycle(context.Context, cyclesdomain.Cycle) (int, error) {
	f.reads++
	return f.listed, nil
}

func (f *fakeRepository) ListForCycle(_ context.Context, _ cyclesdomain.Cycle, limit, offset int) ([]domain.Movement, error) {
	f.reads++
	movements := []domain.Movement{}
	for id := f.listed - offset; id > 0 && len(movements) < limit; id-- {
		movements = append(movements, domain.Movement{ID: int64(id)})
	}
	return movements, nil
}

func (f *fakeRepository) Delete(context.Context, int64) (bool, error) { return false, nil }

func list(t *testing.T, repo *fakeRepository, query string) *httptest.ResponseRecorder {
	t.Helper()
	mux := http.NewServeMux()
	NewHandler(application.NewService(repo, fakeSettings{})).Register(mux)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/v1/movements"+query, nil))
	return rec
}

func TestListReturnsOnePage(t *testing.T) {
	t.Parallel()
	for _, tc := range []struct {
		name      string
		query     string
		wantPage  int
		wantFirst int64
		wantLast  int64
	}{
		{"no page is the first page", "", 1, 45, 40},
		{"page 2", "?page=2", 2, 39, 34},
		{"the last page holds the rest", "?page=8", 8, 3, 1},
		{"a page beyond the last is the last", "?page=12", 8, 3, 1},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			rec := list(t, &fakeRepository{listed: 45}, tc.query)
			if rec.Code != http.StatusOK {
				t.Fatalf("status %d, want 200 (body %q)", rec.Code, rec.Body)
			}

			var got pageJSON
			if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
				t.Fatalf("decode %q: %v", rec.Body, err)
			}
			if got.Page != tc.wantPage || got.TotalPages != 8 || got.Total != 45 {
				t.Errorf("page %d of %d with %d movements, want page %d of 8 with 45",
					got.Page, got.TotalPages, got.Total, tc.wantPage)
			}
			if want := int(tc.wantFirst-tc.wantLast) + 1; len(got.Items) != want {
				t.Fatalf("%d items, want %d", len(got.Items), want)
			}
			if first, last := got.Items[0].ID, got.Items[len(got.Items)-1].ID; first != tc.wantFirst || last != tc.wantLast {
				t.Errorf("items run from id %d to %d, want %d to %d", first, last, tc.wantFirst, tc.wantLast)
			}
		})
	}
}

func TestListRejectsAPageThatIsNotAPositiveInteger(t *testing.T) {
	t.Parallel()
	for _, query := range []string{"?page=0", "?page=-1", "?page=abc", "?page=1.5", "?page="} {
		t.Run(query, func(t *testing.T) {
			t.Parallel()
			repo := &fakeRepository{listed: 45}
			rec := list(t, repo, query)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("status %d, want 400 (body %q)", rec.Code, rec.Body)
			}
			var body map[string]any
			if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
				t.Fatalf("decode %q: %v", rec.Body, err)
			}
			if msg, _ := body["error"].(string); msg == "" {
				t.Errorf("body %q has no error message", rec.Body)
			}
			if _, listed := body["items"]; listed || repo.reads != 0 {
				t.Errorf("body %q after %d repository reads, want no movements and no reads", rec.Body, repo.reads)
			}
		})
	}
}

func TestListOfAnEmptyCycle(t *testing.T) {
	t.Parallel()
	rec := list(t, &fakeRepository{}, "")
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d, want 200 (body %q)", rec.Code, rec.Body)
	}
	if !strings.Contains(rec.Body.String(), `"items":[]`) {
		t.Errorf("body %q, want items to be []", rec.Body)
	}
	var got pageJSON
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode %q: %v", rec.Body, err)
	}
	if got.Page != 1 || got.TotalPages != 1 || got.Total != 0 {
		t.Errorf("page %d of %d with %d movements, want page 1 of 1 with 0", got.Page, got.TotalPages, got.Total)
	}
}

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
