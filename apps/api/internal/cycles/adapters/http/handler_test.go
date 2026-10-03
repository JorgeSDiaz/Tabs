package http

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"tabs-api/internal/cycles/application"
	"tabs-api/internal/cycles/domain"
)

type fakeSettings struct{}

func (fakeSettings) Settings(context.Context) (domain.Settings, error) {
	return domain.Settings{BoundaryDay: 30, Location: time.UTC}, nil
}

type fakeTotals struct {
	totals []domain.CategoryTotal
	err    error
}

func (f fakeTotals) CategoryTotals(context.Context, domain.Cycle) ([]domain.CategoryTotal, error) {
	return f.totals, f.err
}

func get(t *testing.T, totals fakeTotals) *httptest.ResponseRecorder {
	t.Helper()
	mux := http.NewServeMux()
	NewHandler(application.NewService(fakeSettings{}, totals)).Register(mux)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/v1/cycles/current", nil))
	return rec
}

func TestCurrentReportsCategoryTotalsAndTheBalanceTheyAddUpTo(t *testing.T) {
	t.Parallel()
	rec := get(t, fakeTotals{totals: []domain.CategoryTotal{
		{CategoryID: 9, Direction: "in", TotalCents: 500000, MovementCount: 1},
		{CategoryID: 4, Direction: "out", TotalCents: 60000, MovementCount: 3},
		{CategoryID: 2, Direction: "out", TotalCents: 1500, MovementCount: 1},
	}})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d, want 200 (body %q)", rec.Code, rec.Body)
	}

	var got currentJSON
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode %q: %v", rec.Body, err)
	}
	if got.StartsOn == "" || got.EndsOn == "" {
		t.Errorf("cycle bounds %q to %q, want both set", got.StartsOn, got.EndsOn)
	}
	if want := (balanceJSON{TotalIn: 500000, TotalOut: 61500, Net: 438500}); got.Balance != want {
		t.Errorf("balance %+v, want %+v", got.Balance, want)
	}
	want := []categoryTotalJSON{
		{CategoryID: 9, Direction: "in", TotalCents: 500000, MovementCount: 1},
		{CategoryID: 4, Direction: "out", TotalCents: 60000, MovementCount: 3},
		{CategoryID: 2, Direction: "out", TotalCents: 1500, MovementCount: 1},
	}
	if len(got.CategoryTotals) != len(want) {
		t.Fatalf("category totals %+v, want %+v", got.CategoryTotals, want)
	}
	for i := range want {
		if got.CategoryTotals[i] != want[i] {
			t.Errorf("category total %d is %+v, want %+v", i, got.CategoryTotals[i], want[i])
		}
	}

	// The field names are the contract the web client is generated from.
	for _, field := range []string{`"category_totals"`, `"category_id"`, `"direction"`, `"total_cents"`, `"movement_count"`} {
		if !strings.Contains(rec.Body.String(), field) {
			t.Errorf("body %q has no %s", rec.Body, field)
		}
	}
}

func TestCurrentEmptyCycleHasAnEmptyList(t *testing.T) {
	t.Parallel()
	rec := get(t, fakeTotals{})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d, want 200 (body %q)", rec.Code, rec.Body)
	}
	if !strings.Contains(rec.Body.String(), `"category_totals":[]`) {
		t.Errorf("body %q, want category_totals to be []", rec.Body)
	}
	var got currentJSON
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode %q: %v", rec.Body, err)
	}
	if got.Balance != (balanceJSON{}) {
		t.Errorf("balance %+v, want zero on both sides", got.Balance)
	}
}

func TestCurrentReaderFailure(t *testing.T) {
	t.Parallel()
	rec := get(t, fakeTotals{err: errors.New("db down")})
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status %d, want 500", rec.Code)
	}
	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode %q: %v", rec.Body, err)
	}
	if msg, _ := body["error"].(string); msg == "" {
		t.Errorf("body %v has no error message", body)
	}
	if _, partial := body["balance"]; partial {
		t.Errorf("body %v must carry no partial cycle", body)
	}
}
