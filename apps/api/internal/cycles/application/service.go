package application

import (
	"context"
	"time"

	"tabs-api/internal/cycles/domain"
	"tabs-api/internal/cycles/ports"
)

type Service struct {
	settings ports.SettingsReader
	totals   ports.TotalsReader
}

func NewService(settings ports.SettingsReader, totals ports.TotalsReader) *Service {
	return &Service{settings: settings, totals: totals}
}

type Current struct {
	Cycle          domain.Cycle
	Balance        domain.Balance
	CategoryTotals []domain.CategoryTotal
}

func (s *Service) Current(ctx context.Context) (Current, error) {
	settings, err := s.settings.Settings(ctx)
	if err != nil {
		return Current{}, err
	}
	cycle := domain.ActiveAt(time.Now(), settings)

	totals, err := s.totals.CategoryTotals(ctx, cycle)
	if err != nil {
		return Current{}, err
	}
	return Current{Cycle: cycle, Balance: domain.BalanceOf(totals), CategoryTotals: totals}, nil
}
