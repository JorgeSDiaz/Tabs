package ports

import (
	"context"

	cyclesdomain "tabs-api/internal/cycles/domain"
	"tabs-api/internal/movements/domain"
)

type Repository interface {
	Create(ctx context.Context, m domain.Movement) (domain.Movement, error)
	// Update returns domain.ErrNotFound when no movement has the id.
	Update(ctx context.Context, id int64, m domain.Movement) (domain.Movement, error)
	ListForCycle(ctx context.Context, c cyclesdomain.Cycle) ([]domain.Movement, error)
	Delete(ctx context.Context, id int64) (bool, error)
}
