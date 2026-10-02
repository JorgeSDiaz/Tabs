package domain

import (
	"testing"
	"time"
)

var bogota = mustLoad("America/Bogota")

func mustLoad(name string) *time.Location {
	loc, err := time.LoadLocation(name)
	if err != nil {
		panic(err)
	}
	return loc
}

func at(month time.Month, day, hour, minute int) time.Time {
	return time.Date(2026, month, day, hour, minute, 0, 0, bogota)
}

func TestLevelFor(t *testing.T) {
	t.Parallel()
	tests := []struct {
		total int
		want  Level
	}{
		{0, Level{Number: 1, StartsAt: 0, NextAt: 250}},
		{249, Level{Number: 1, StartsAt: 0, NextAt: 250}},
		{250, Level{Number: 2, StartsAt: 250, NextAt: 500}},
		{1265, Level{Number: 6, StartsAt: 1250, NextAt: 1500}},
	}
	for _, tc := range tests {
		if got := LevelFor(tc.total); got != tc.want {
			t.Errorf("LevelFor(%d) = %+v, want %+v", tc.total, got, tc.want)
		}
	}
}

func TestRulesMatchAppliedValues(t *testing.T) {
	t.Parallel()
	want := map[string]int{"base": 10, "note": 5, "first_of_day": 10}
	rules := Rules()
	if len(rules) != len(want) {
		t.Fatalf("got %d rules, want %d", len(rules), len(want))
	}
	for _, r := range rules {
		if want[r.ID] != r.XP || r.Label == "" {
			t.Errorf("rule %+v does not match %v", r, want)
		}
	}
}

func TestMovementXP(t *testing.T) {
	t.Parallel()
	first := Movement{ID: 1, CreatedAt: at(time.September, 15, 9, 0), Note: "Supermarket run"}
	second := Movement{ID: 2, CreatedAt: at(time.September, 15, 12, 0), Note: ""}
	blank := Movement{ID: 3, CreatedAt: at(time.September, 15, 13, 0), Note: "   \t"}

	got := MovementXP([]Movement{second, blank, first}, bogota)
	want := map[int64]int{1: 25, 2: 10, 3: 10}
	for id, xp := range want {
		if got[id] != xp {
			t.Errorf("movement %d earned %d XP, want %d", id, got[id], xp)
		}
	}
}

func TestMovementXPIgnoresEverythingButLogging(t *testing.T) {
	t.Parallel()
	// The habit's Movement carries no amount, direction or category, so
	// movements that differ only in those are identical to it.
	a := Movement{ID: 1, CreatedAt: at(time.September, 15, 9, 0), Note: "x"}
	b := Movement{ID: 2, CreatedAt: at(time.September, 16, 9, 0), Note: "x"}
	got := MovementXP([]Movement{a, b}, bogota)
	if got[1] != got[2] {
		t.Errorf("same-shape movements earned %d and %d XP", got[1], got[2])
	}
}

func TestDeletingFirstMovementPromotesNext(t *testing.T) {
	t.Parallel()
	first := Movement{ID: 1, CreatedAt: at(time.September, 15, 9, 0)}
	second := Movement{ID: 2, CreatedAt: at(time.September, 15, 12, 0)}

	if got := MovementXP([]Movement{first, second}, bogota); got[2] != 10 {
		t.Fatalf("second earned %d before deletion, want 10", got[2])
	}
	if got := MovementXP([]Movement{second}, bogota); got[2] != 20 {
		t.Fatalf("second earned %d after deletion, want 20", got[2])
	}
}

func TestFirstOfDayTieBreaksOnID(t *testing.T) {
	t.Parallel()
	same := at(time.September, 15, 9, 0)
	got := MovementXP([]Movement{{ID: 8, CreatedAt: same}, {ID: 7, CreatedAt: same}}, bogota)
	if got[7] != 20 || got[8] != 10 {
		t.Errorf("got %v, want id 7 first of day", got)
	}
}

func TestFirstOfDayUsesLocalDay(t *testing.T) {
	t.Parallel()
	// 23:30 Sep 15 local is Sep 16 UTC; 01:00 Sep 16 local is a new day.
	late := Movement{ID: 1, CreatedAt: at(time.September, 15, 23, 30)}
	next := Movement{ID: 2, CreatedAt: at(time.September, 16, 1, 0)}
	got := MovementXP([]Movement{late, next}, bogota)
	if got[1] != 20 || got[2] != 20 {
		t.Errorf("got %v, want both first of their local day", got)
	}
}

func TestTotal(t *testing.T) {
	t.Parallel()
	if got := Total(map[int64]int{1: 25, 2: 10}); got != 35 {
		t.Errorf("Total = %d, want 35", got)
	}
	if got := Total(nil); got != 0 {
		t.Errorf("Total(nil) = %d, want 0", got)
	}
}
