package ports

import (
	"context"
	"time"

	cycles "tabs-api/internal/cycles/domain"
	"tabs-api/internal/habit/domain"
)

// LoggedMovements returns every existing movement, across all cycles.
type LoggedMovements interface {
	LoggedMovements(ctx context.Context) ([]domain.Movement, error)
}

// Today is the active cycle, the configured time zone and the current
// instant, resolved together so they always agree.
type Today struct {
	Cycle    cycles.Cycle
	Location *time.Location
	Now      time.Time
}

type CycleClock interface {
	Today(ctx context.Context) (Today, error)
}
