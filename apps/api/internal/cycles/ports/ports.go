package ports

import (
	"context"

	"tabs-api/internal/cycles/domain"
)

type SettingsReader interface {
	Settings(ctx context.Context) (domain.Settings, error)
}

type BalanceReader interface {
	CycleBalance(ctx context.Context, c domain.Cycle) (domain.Balance, error)
}
