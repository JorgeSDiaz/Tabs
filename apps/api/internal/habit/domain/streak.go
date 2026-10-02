package domain

import "time"

// Day is a calendar day, as UTC midnight of its civil date. Using one
// representation for every day keeps map lookups and arithmetic safe from
// time zone and DST effects.
type Day = time.Time

type Status string

const (
	StatusLogged       Status = "logged"
	StatusMissed       Status = "missed"
	StatusTodayLogged  Status = "today_logged"
	StatusTodayPending Status = "today_pending"
	StatusAhead        Status = "ahead"
)

type DayStatus struct {
	Date   Day
	Status Status
}

// DayOf is the civil date of t in loc.
func DayOf(t time.Time, loc *time.Location) Day {
	y, m, d := t.In(loc).Date()
	return time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
}

// CivilDay is the civil date t already carries, ignoring its location
// offset. Used for date-only values such as a cycle's start.
func CivilDay(t time.Time) Day {
	y, m, d := t.Date()
	return time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
}

// LoggedDays is the set of local days on which a movement was created.
// A movement's own date never counts: back-filling logs today.
func LoggedDays(movements []Movement, loc *time.Location) map[Day]bool {
	logged := make(map[Day]bool, len(movements))
	for _, m := range movements {
		logged[DayOf(m.CreatedAt, loc)] = true
	}
	return logged
}

// Streak counts consecutive logged days ending today, or ending yesterday
// when today is not yet logged. It ignores cycle boundaries.
func Streak(logged map[Day]bool, today Day) int {
	day := today
	if !logged[day] {
		day = day.AddDate(0, 0, -1)
	}
	n := 0
	for logged[day] {
		n++
		day = day.AddDate(0, 0, -1)
	}
	return n
}

// DayMap classifies every day of the cycle [Start, End).
func DayMap(startsOn, endsOn Day, logged map[Day]bool, today Day) []DayStatus {
	var days []DayStatus
	for d := startsOn; d.Before(endsOn); d = d.AddDate(0, 0, 1) {
		days = append(days, DayStatus{Date: d, Status: classify(d, logged, today)})
	}
	return days
}

func classify(d Day, logged map[Day]bool, today Day) Status {
	switch {
	case d.Equal(today) && logged[d]:
		return StatusTodayLogged
	case d.Equal(today):
		return StatusTodayPending
	case d.After(today):
		return StatusAhead
	case logged[d]:
		return StatusLogged
	default:
		return StatusMissed
	}
}
