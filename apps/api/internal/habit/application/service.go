package application

import (
	"context"

	"tabs-api/internal/habit/domain"
	"tabs-api/internal/habit/ports"
)

type Service struct {
	movements ports.LoggedMovements
	clock     ports.CycleClock
}

func NewService(movements ports.LoggedMovements, clock ports.CycleClock) *Service {
	return &Service{movements: movements, clock: clock}
}

type MovementXP struct {
	MovementID int64
	XP         int
}

type Habit struct {
	Streak      int
	TodayLogged bool
	Days        []domain.DayStatus
	TotalXP     int
	Level       domain.Level
	MovementXP  []MovementXP
	Rules       []domain.Rule
}

func (s *Service) Habit(ctx context.Context) (Habit, error) {
	today, err := s.clock.Today(ctx)
	if err != nil {
		return Habit{}, err
	}
	movements, err := s.movements.LoggedMovements(ctx)
	if err != nil {
		return Habit{}, err
	}

	loc := today.Location
	day := domain.DayOf(today.Now, loc)
	logged := domain.LoggedDays(movements, loc)
	xp := domain.MovementXP(movements, loc)
	total := domain.Total(xp)

	start, end := domain.CivilDay(today.Cycle.Start), domain.CivilDay(today.Cycle.End)
	return Habit{
		Streak:      domain.Streak(logged, day),
		TodayLogged: logged[day],
		Days:        domain.DayMap(start, end, logged, day),
		TotalXP:     total,
		Level:       domain.LevelFor(total),
		MovementXP:  cycleXP(movements, xp, start, end),
		Rules:       domain.Rules(),
	}, nil
}

// cycleXP lists the XP of movements dated inside [start, end), oldest id
// first, matching the movements the ledger shows for the cycle.
func cycleXP(movements []domain.Movement, xp map[int64]int, start, end domain.Day) []MovementXP {
	out := []MovementXP{}
	for _, m := range movements {
		on := domain.CivilDay(m.OccurredOn)
		if !on.Before(start) && on.Before(end) {
			out = append(out, MovementXP{MovementID: m.ID, XP: xp[m.ID]})
		}
	}
	return out
}
