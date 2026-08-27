package application

import (
	"context"
	"time"

	"tabs-api/internal/cycles/domain"
	"tabs-api/internal/cycles/ports"
)

type Service struct {
	settings ports.SettingsReader
	balances ports.BalanceReader
}

func NewService(settings ports.SettingsReader, balances ports.BalanceReader) *Service {
	return &Service{settings: settings, balances: balances}
}

type Current struct {
	Cycle   domain.Cycle
	Balance domain.Balance
}

func (s *Service) Current(ctx context.Context) (Current, error) {
	settings, err := s.settings.Settings(ctx)
	if err != nil {
		return Current{}, err
	}
	cycle := domain.ActiveAt(time.Now(), settings)

	balance, err := s.balances.CycleBalance(ctx, cycle)
	if err != nil {
		return Current{}, err
	}
	return Current{Cycle: cycle, Balance: balance}, nil
}
