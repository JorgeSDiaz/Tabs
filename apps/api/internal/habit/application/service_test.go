package application

import (
	"context"
	"errors"
	"testing"
	"time"

	cycles "tabs-api/internal/cycles/domain"
	"tabs-api/internal/habit/domain"
	"tabs-api/internal/habit/ports"
)

type stubMovements struct {
	movements []domain.Movement
	err       error
}

func (s stubMovements) LoggedMovements(context.Context) ([]domain.Movement, error) {
	return s.movements, s.err
}

type stubClock struct {
	today ports.Today
	err   error
}

func (s stubClock) Today(context.Context) (ports.Today, error) { return s.today, s.err }

func bogota(t *testing.T) *time.Location {
	t.Helper()
	loc, err := time.LoadLocation("America/Bogota")
	if err != nil {
		t.Fatal(err)
	}
	return loc
}

func todayAt(t *testing.T, now time.Time) ports.Today {
	t.Helper()
	loc := bogota(t)
	return ports.Today{
		Cycle:    cycles.ActiveAt(now, cycles.Settings{BoundaryDay: 30, Location: loc}),
		Location: loc,
		Now:      now,
	}
}

func TestHabitMidCycleDay(t *testing.T) {
	t.Parallel()
	loc := bogota(t)
	// Cycle Aug 30 - Sep 29; today is Sep 16 at noon, local.
	now := time.Date(2026, time.September, 16, 12, 0, 0, 0, loc)
	inCycle := time.Date(2026, time.September, 10, 0, 0, 0, 0, time.UTC)
	before := time.Date(2026, time.August, 1, 0, 0, 0, 0, time.UTC)

	movements := []domain.Movement{
		{ID: 1, CreatedAt: time.Date(2026, time.September, 14, 9, 0, 0, 0, loc), OccurredOn: inCycle, Note: "rent"},
		{ID: 2, CreatedAt: time.Date(2026, time.September, 15, 9, 0, 0, 0, loc), OccurredOn: inCycle},
		{ID: 3, CreatedAt: time.Date(2026, time.September, 16, 8, 0, 0, 0, loc), OccurredOn: before},
	}
	svc := NewService(stubMovements{movements: movements}, stubClock{today: todayAt(t, now)})

	got, err := svc.Habit(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.Streak != 3 || !got.TodayLogged {
		t.Errorf("streak %d today_logged %v, want 3 and true", got.Streak, got.TodayLogged)
	}
	if len(got.Days) != 31 {
		t.Fatalf("day map has %d days, want 31", len(got.Days))
	}
	if got.Days[17].Status != domain.StatusTodayLogged {
		t.Errorf("today is %s, want today_logged", got.Days[17].Status)
	}
	// 25 + 20 + 20: every movement is the first of its own day.
	if got.TotalXP != 65 || got.Level.Number != 1 {
		t.Errorf("total XP %d level %d, want 65 and 1", got.TotalXP, got.Level.Number)
	}
	// Movement 3 is dated before the cycle, so it is not listed.
	want := []MovementXP{{MovementID: 1, XP: 25}, {MovementID: 2, XP: 20}}
	if len(got.MovementXP) != len(want) || got.MovementXP[0] != want[0] || got.MovementXP[1] != want[1] {
		t.Errorf("movement XP %v, want %v", got.MovementXP, want)
	}
	if len(got.Rules) != 3 {
		t.Errorf("got %d rules, want 3", len(got.Rules))
	}
}

func TestHabitWithNoMovements(t *testing.T) {
	t.Parallel()
	now := time.Date(2026, time.September, 16, 12, 0, 0, 0, bogota(t))
	svc := NewService(stubMovements{}, stubClock{today: todayAt(t, now)})

	got, err := svc.Habit(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.TotalXP != 0 || got.Level.Number != 1 || got.Streak != 0 {
		t.Errorf("got xp %d level %d streak %d, want 0, 1, 0", got.TotalXP, got.Level.Number, got.Streak)
	}
	if got.MovementXP == nil {
		t.Error("movement XP must be an empty list, not nil")
	}
}

func TestHabitPropagatesErrors(t *testing.T) {
	t.Parallel()
	boom := errors.New("boom")
	now := time.Date(2026, time.September, 16, 12, 0, 0, 0, bogota(t))
	for name, svc := range map[string]*Service{
		"movements": NewService(stubMovements{err: boom}, stubClock{today: todayAt(t, now)}),
		"clock":     NewService(stubMovements{}, stubClock{err: boom}),
	} {
		if _, err := svc.Habit(context.Background()); !errors.Is(err, boom) {
			t.Errorf("%s: got %v, want the underlying error", name, err)
		}
	}
}
