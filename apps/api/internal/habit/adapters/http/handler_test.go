package http

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	cycles "tabs-api/internal/cycles/domain"
	"tabs-api/internal/habit/application"
	"tabs-api/internal/habit/domain"
	"tabs-api/internal/habit/ports"
)

type fakeMovements struct {
	movements []domain.Movement
	err       error
}

func (f fakeMovements) LoggedMovements(context.Context) ([]domain.Movement, error) {
	return f.movements, f.err
}

type fakeClock struct{ now time.Time }

func (f fakeClock) Today(context.Context) (ports.Today, error) {
	loc := time.UTC
	return ports.Today{
		Cycle:    cycles.ActiveAt(f.now, cycles.Settings{BoundaryDay: 30, Location: loc}),
		Location: loc,
		Now:      f.now,
	}, nil
}

func get(t *testing.T, movements fakeMovements) *httptest.ResponseRecorder {
	t.Helper()
	mux := http.NewServeMux()
	now := time.Date(2026, time.September, 16, 12, 0, 0, 0, time.UTC)
	NewHandler(application.NewService(movements, fakeClock{now: now})).Register(mux)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/v1/habit", nil))
	return rec
}

func TestGetHabit(t *testing.T) {
	t.Parallel()
	rec := get(t, fakeMovements{movements: []domain.Movement{{
		ID:         7,
		CreatedAt:  time.Date(2026, time.September, 16, 9, 0, 0, 0, time.UTC),
		OccurredOn: time.Date(2026, time.September, 16, 0, 0, 0, 0, time.UTC),
		Note:       "Supermarket run",
	}}})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d, want 200", rec.Code)
	}

	var got habitJSON
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode %q: %v", rec.Body, err)
	}
	if got.Streak.Current != 1 || !got.Streak.TodayLogged {
		t.Errorf("streak %+v, want 1 and logged today", got.Streak)
	}
	if len(got.Days) != 31 || got.Days[0].Date != "2026-08-30" {
		t.Fatalf("day map has %d days, want 31 starting 2026-08-30", len(got.Days))
	}
	if got.Days[17].Status != "today_logged" {
		t.Errorf("today is %q, want today_logged", got.Days[17].Status)
	}
	if got.XP.Total != 25 || got.XP.Level != 1 || got.XP.LevelStartsAt != 0 || got.XP.NextLevelAt != 250 {
		t.Errorf("xp %+v, want 25 total at level 1 spanning 0 to 250", got.XP)
	}
	if len(got.MovementXP) != 1 || got.MovementXP[0] != (movementXPJSON{MovementID: 7, XP: 25}) {
		t.Errorf("movement xp %+v, want id 7 with 25", got.MovementXP)
	}
	if len(got.Rules) != 3 {
		t.Errorf("got %d rules, want 3", len(got.Rules))
	}
}

func TestGetHabitStorageFailure(t *testing.T) {
	t.Parallel()
	rec := get(t, fakeMovements{err: errors.New("db down")})
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
	if _, partial := body["streak"]; partial {
		t.Errorf("body %v must carry no partial habit", body)
	}
}
