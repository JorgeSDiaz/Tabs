package domain

import (
	"testing"
	"time"
)

func civil(month time.Month, day int) Day {
	return time.Date(2026, month, day, 0, 0, 0, 0, time.UTC)
}

// loggedRun marks n consecutive days ending on last as logged.
func loggedRun(last Day, n int) map[Day]bool {
	logged := map[Day]bool{}
	for i := range n {
		logged[last.AddDate(0, 0, -i)] = true
	}
	return logged
}

func TestLoggedDaysUsesCreationNotOccurrence(t *testing.T) {
	t.Parallel()
	backfill := Movement{
		ID:         1,
		CreatedAt:  at(time.September, 16, 10, 0),
		OccurredOn: civil(time.September, 8),
	}
	logged := LoggedDays([]Movement{backfill}, bogota)
	if !logged[civil(time.September, 16)] {
		t.Error("September 16 should be logged")
	}
	if logged[civil(time.September, 8)] {
		t.Error("September 8 must not become logged by a back-fill")
	}
}

func TestLoggedDaysFollowsTimeZoneAtMidnight(t *testing.T) {
	t.Parallel()
	m := Movement{ID: 1, CreatedAt: at(time.September, 15, 23, 30)}
	logged := LoggedDays([]Movement{m}, bogota)
	if !logged[civil(time.September, 15)] || logged[civil(time.September, 16)] {
		t.Errorf("got %v, want only September 15", logged)
	}
}

func TestLoggedDaysDropsDayWhenItsOnlyMovementIsGone(t *testing.T) {
	t.Parallel()
	m := Movement{ID: 1, CreatedAt: at(time.September, 15, 9, 0)}
	if !LoggedDays([]Movement{m}, bogota)[civil(time.September, 15)] {
		t.Fatal("day should be logged while the movement exists")
	}
	if LoggedDays(nil, bogota)[civil(time.September, 15)] {
		t.Error("day should stop counting once the movement is deleted")
	}
}

func TestStreak(t *testing.T) {
	t.Parallel()
	today := civil(time.September, 18)
	yesterday := civil(time.September, 17)
	tests := []struct {
		name   string
		today  Day
		logged map[Day]bool
		want   int
	}{
		{"today pending keeps the streak alive", today, loggedRun(yesterday, 7), 7},
		{"logging today extends it", today, loggedRun(today, 8), 8},
		{"missed yesterday and today breaks it", today, loggedRun(civil(time.September, 15), 5), 0},
		{"no movements", today, map[Day]bool{}, 0},
		{"gap ends the run", today, map[Day]bool{today: true, yesterday: true, civil(time.September, 15): true}, 2},
		// Cycle boundary at day 30: Sep 26-29 close one cycle, Sep 30 - Oct 2
		// open the next. The walk ignores the boundary.
		{"spans a cycle boundary", civil(time.October, 2), loggedRun(civil(time.October, 2), 7), 7},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			if got := Streak(tc.logged, tc.today); got != tc.want {
				t.Errorf("Streak = %d, want %d", got, tc.want)
			}
		})
	}
}

func TestDayMapMidCycle(t *testing.T) {
	t.Parallel()
	// 31-day cycle Aug 30 - Sep 29; today is day 18 (Sep 16).
	start, end := civil(time.August, 30), civil(time.September, 30)
	today := civil(time.September, 16)

	logged := map[Day]bool{}
	for d := start; d.Before(today); d = d.AddDate(0, 0, 1) {
		logged[d] = true
	}
	delete(logged, start.AddDate(0, 0, 4)) // day 5
	delete(logged, start.AddDate(0, 0, 9)) // day 10

	days := DayMap(start, end, logged, today)
	if len(days) != 31 {
		t.Fatalf("day map has %d days, want 31", len(days))
	}
	counts := map[Status]int{}
	for _, d := range days {
		counts[d.Status]++
	}
	want := map[Status]int{StatusLogged: 15, StatusMissed: 2, StatusTodayPending: 1, StatusAhead: 13}
	for s, n := range want {
		if counts[s] != n {
			t.Errorf("%s = %d, want %d (all: %v)", s, counts[s], n, counts)
		}
	}

	logged[today] = true
	if got := DayMap(start, end, logged, today)[17].Status; got != StatusTodayLogged {
		t.Errorf("today = %s, want today_logged", got)
	}
}

func TestDayMapCoversShortMonthCycle(t *testing.T) {
	t.Parallel()
	// Boundary 30 clamped to Feb 28: the cycle runs Jan 30 through Feb 27.
	days := DayMap(civil(time.January, 30), civil(time.February, 28), nil, civil(time.February, 1))
	if len(days) != 29 {
		t.Fatalf("got %d days, want 29", len(days))
	}
	if last := days[len(days)-1].Date; !last.Equal(civil(time.February, 27)) {
		t.Errorf("last day %v, want Feb 27", last)
	}
}
