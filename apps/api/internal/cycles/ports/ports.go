package ports

import (
	"context"

	"tabs-api/internal/cycles/domain"
)

type SettingsReader interface {
	Settings(ctx context.Context) (domain.Settings, error)
}

type TotalsReader interface {
	// CategoryTotals lists every category with a movement in the cycle: in
	// before out, then by descending total, then by category id.
	CategoryTotals(ctx context.Context, c domain.Cycle) ([]domain.CategoryTotal, error)
}
