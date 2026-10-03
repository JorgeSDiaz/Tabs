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

type MovementInput struct {
	AmountCents int64
	Direction   domain.Direction
	CategoryID  int64
	OccurredOn  time.Time
	Note        string
}

func (s *Service) Record(ctx context.Context, in MovementInput) (domain.Movement, error) {
	m, err := domain.NewMovement(in.AmountCents, in.Direction, in.CategoryID, in.OccurredOn, in.Note)
	if err != nil {
		return domain.Movement{}, err
	}
	return s.repo.Create(ctx, m)
}

// Update replaces every editable field of the movement with the given id.
// It validates through the same constructor as Record.
func (s *Service) Update(ctx context.Context, id int64, in MovementInput) (domain.Movement, error) {
	m, err := domain.NewMovement(in.AmountCents, in.Direction, in.CategoryID, in.OccurredOn, in.Note)
	if err != nil {
		return domain.Movement{}, err
	}
	return s.repo.Update(ctx, id, m)
}

// Page is one page of the active cycle's movements, with what the client
// needs to reach the others.
type Page struct {
	Items      []domain.Movement
	Page       int
	TotalPages int
	Total      int
}

// ListActive returns the requested page of the active cycle, counted from
// 1, or the last page when the cycle has fewer. It counts before it lists,
// so a page that no longer exists is answered in one call.
func (s *Service) ListActive(ctx context.Context, page int) (Page, error) {
	cycle, err := s.activeCycle(ctx)
	if err != nil {
		return Page{}, err
	}
	total, err := s.repo.CountForCycle(ctx, cycle)
	if err != nil {
		return Page{}, err
	}
	page = domain.ClampPage(page, total)
	items, err := s.repo.ListForCycle(ctx, cycle, domain.PageSize, (page-1)*domain.PageSize)
	if err != nil {
		return Page{}, err
	}
	return Page{
		Items:      items,
		Page:       page,
		TotalPages: domain.PageCount(total),
		Total:      total,
	}, nil
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
