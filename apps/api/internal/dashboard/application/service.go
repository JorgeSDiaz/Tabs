package application

import (
	"context"

	"tabs-api/internal/dashboard/domain"
	"tabs-api/internal/dashboard/ports"
)

type Service struct {
	store ports.SettingsStore
}

func NewService(store ports.SettingsStore) *Service {
	return &Service{store: store}
}

// Widgets returns the stored selection, normalized: a never-saved (nil)
// store yields the all-enabled defaults.
func (s *Service) Widgets(ctx context.Context) (domain.WidgetSettings, error) {
	raw, err := s.store.Load(ctx)
	if err != nil {
		return nil, err
	}
	return domain.Normalize(raw), nil
}

// Save validates the complete mapping and stores exactly what was
// accepted; an invalid mapping never reaches the store.
func (s *Service) Save(ctx context.Context, raw map[string]bool) (domain.WidgetSettings, error) {
	settings, err := domain.Parse(raw)
	if err != nil {
		return nil, err
	}
	if err := s.store.Save(ctx, raw); err != nil {
		return nil, err
	}
	return settings, nil
}
