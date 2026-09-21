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

func (s *Service) List(ctx context.Context) ([]domain.Category, error) {
	return s.repo.List(ctx)
}

func (s *Service) Create(ctx context.Context, name, direction string) (domain.Category, error) {
	c, err := domain.NewCategory(name, direction)
	if err != nil {
		return domain.Category{}, err
	}
	return s.repo.Create(ctx, c)
}
