package application

import (
	"context"
	"time"

	cyclesdomain "tabs-api/internal/cycles/domain"
	cyclesports "tabs-api/internal/cycles/ports"
	"tabs-api/internal/movements/domain"
	"tabs-api/internal/movements/ports"
)

type Service struct {
	repo     ports.Repository
	settings cyclesports.SettingsReader
}

func NewService(repo ports.Repository, settings cyclesports.SettingsReader) *Service {
	return &Service{repo: repo, settings: settings}
}

type RecordInput struct {
	AmountCents int64
	Direction   domain.Direction
	CategoryID  int64
	OccurredOn  time.Time
	Note        string
}

func (s *Service) Record(ctx context.Context, in RecordInput) (domain.Movement, error) {
	m, err := domain.NewMovement(in.AmountCents, in.Direction, in.CategoryID, in.OccurredOn, in.Note)
	if err != nil {
		return domain.Movement{}, err
	}
	return s.repo.Create(ctx, m)
}

func (s *Service) ListActive(ctx context.Context) ([]domain.Movement, error) {
	cycle, err := s.activeCycle(ctx)
	if err != nil {
		return nil, err
	}
	return s.repo.ListForCycle(ctx, cycle)
}

func (s *Service) Delete(ctx context.Context, id int64) error {
	deleted, err := s.repo.Delete(ctx, id)
	if err != nil {
		return err
	}
	if !deleted {
		return domain.ErrNotFound
	}
	return nil
}

func (s *Service) activeCycle(ctx context.Context) (cyclesdomain.Cycle, error) {
	settings, err := s.settings.Settings(ctx)
	if err != nil {
		return cyclesdomain.Cycle{}, err
	}
	return cyclesdomain.ActiveAt(time.Now(), settings), nil
}
