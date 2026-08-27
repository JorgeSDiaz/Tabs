package domain

import "time"

// Cycle is a financial cycle: [Start, End). Start falls on the boundary
// day (clamped to the month's last day in short months); End is the next
// boundary, exclusive.
type Cycle struct {
	Start time.Time
	End   time.Time
}

// Settings is the seeded cycle configuration, read-only in this change.
type Settings struct {
	BoundaryDay int
	Location    *time.Location
}

// ActiveAt resolves the cycle active at now, converted to the configured
// time zone before any boundary arithmetic.
func ActiveAt(now time.Time, s Settings) Cycle {
	return ForDate(now.In(s.Location), s.BoundaryDay)
}

// ForDate returns the cycle that contains on. A date on or after the
// boundary day belongs to the cycle starting on that boundary; a date
// before it belongs to the cycle that started on the previous boundary.
// When the boundary day does not exist in a calendar month, it clamps to
// that month's last day.
func ForDate(on time.Time, boundaryDay int) Cycle {
	start := boundary(on.Year(), on.Month(), boundaryDay, on.Location())
	if on.Day() < start.Day() {
		prev := time.Date(on.Year(), on.Month()-1, 1, 0, 0, 0, 0, on.Location())
		start = boundary(prev.Year(), prev.Month(), boundaryDay, on.Location())
	}
	end := nextBoundary(start, boundaryDay)
	return Cycle{Start: start, End: end}
}

func boundary(year int, month time.Month, boundaryDay int, loc *time.Location) time.Time {
	day := min(boundaryDay, daysInMonth(year, month))
	return time.Date(year, month, day, 0, 0, 0, 0, loc)
}

func nextBoundary(start time.Time, boundaryDay int) time.Time {
	next := time.Date(start.Year(), start.Month()+1, 1, 0, 0, 0, 0, start.Location())
	return boundary(next.Year(), next.Month(), boundaryDay, start.Location())
}

func daysInMonth(year int, month time.Month) int {
	return time.Date(year, month+1, 0, 0, 0, 0, 0, time.UTC).Day()
}
