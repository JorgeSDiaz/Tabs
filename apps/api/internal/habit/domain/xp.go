package domain

import (
	"strings"
	"time"
)

// XP values and the level size. Rules and the functions below read these
// constants, so the endpoint can never describe values the server does not
// apply.
const (
	xpBase       = 10
	xpNote       = 5
	xpFirstOfDay = 10
	xpPerLevel   = 250
)

// Movement is the slice of a recorded movement the habit depends on.
// Amount, direction and category are deliberately absent: they never earn
// or cost XP.
type Movement struct {
	ID         int64
	CreatedAt  time.Time
	OccurredOn time.Time
	Note       string
}

type Rule struct {
	ID    string
	Label string
	XP    int
}

// Rules is the single table of XP values.
func Rules() []Rule {
	return []Rule{
		{ID: "base", Label: "Every movement", XP: xpBase},
		{ID: "note", Label: "Movement with a note", XP: xpNote},
		{ID: "first_of_day", Label: "First movement of the day", XP: xpFirstOfDay},
	}
}

type Level struct {
	Number   int
	StartsAt int
	NextAt   int
}

// LevelFor reports the level for total XP: one level per 250 XP, from 1.
func LevelFor(total int) Level {
	n := total / xpPerLevel
	return Level{Number: n + 1, StartsAt: n * xpPerLevel, NextAt: (n + 1) * xpPerLevel}
}

// MovementXP returns the XP of every movement, keyed by id. The first
// movement of a local day is the one with the smallest (CreatedAt, ID) on
// that day, so deleting it promotes the next one on the next recompute.
func MovementXP(movements []Movement, loc *time.Location) map[int64]int {
	first := make(map[Day]Movement)
	for _, m := range movements {
		d := DayOf(m.CreatedAt, loc)
		if cur, ok := first[d]; !ok || earlier(m, cur) {
			first[d] = m
		}
	}

	xp := make(map[int64]int, len(movements))
	for _, m := range movements {
		points := xpBase
		if strings.TrimSpace(m.Note) != "" {
			points += xpNote
		}
		if first[DayOf(m.CreatedAt, loc)].ID == m.ID {
			points += xpFirstOfDay
		}
		xp[m.ID] = points
	}
	return xp
}

func earlier(a, b Movement) bool {
	if !a.CreatedAt.Equal(b.CreatedAt) {
		return a.CreatedAt.Before(b.CreatedAt)
	}
	return a.ID < b.ID
}

func Total(xp map[int64]int) int {
	sum := 0
	for _, points := range xp {
		sum += points
	}
	return sum
}
