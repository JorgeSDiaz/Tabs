package application

import (
	"context"

	"tabs-api/internal/categories/domain"
	"tabs-api/internal/categories/ports"
)

type Service struct {
	repo ports.Repository
}

func NewService(repo ports.Repository) *Service {
	return &Service{repo: repo}
}

// CategoryInput is a category as the user submits it, not yet validated.
// Direction is read only when creating.
type CategoryInput struct {
	Name      string
	Direction string
	Color     string
	Icon      string
}

func (s *Service) List(ctx context.Context) ([]domain.Category, error) {
	return s.repo.List(ctx)
}

func (s *Service) Create(ctx context.Context, in CategoryInput) (domain.Category, error) {
	d, err := domain.NewDetails(in.Name, in.Color, in.Icon)
	if err != nil {
		return domain.Category{}, err
	}
	c, err := domain.NewCategory(in.Direction, d)
	if err != nil {
		return domain.Category{}, err
	}
	return s.repo.Create(ctx, c)
}

func (s *Service) Update(ctx context.Context, id int64, in CategoryInput) (domain.Category, error) {
	d, err := domain.NewDetails(in.Name, in.Color, in.Icon)
	if err != nil {
		return domain.Category{}, err
	}
	return s.repo.Update(ctx, id, d)
}

// Delete asks the domain about the rules that need no movement, then lets
// the repository refuse a category that has any. The list is small and
// already what tells the directions apart, so it is read whole.
func (s *Service) Delete(ctx context.Context, id int64) error {
	categories, err := s.repo.List(ctx)
	if err != nil {
		return err
	}

	var target *domain.Category
	for i := range categories {
		if categories[i].ID == id {
			target = &categories[i]
		}
	}
	if target == nil {
		return domain.ErrNotFound
	}

	inDirection := 0
	for _, c := range categories {
		if c.Direction == target.Direction {
			inDirection++
		}
	}
	if err := target.CanDelete(inDirection); err != nil {
		return err
	}
	return s.repo.Delete(ctx, id)
}
