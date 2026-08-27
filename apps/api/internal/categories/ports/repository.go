package ports

import (
	"context"

	"tabs-api/internal/categories/domain"
)

type Repository interface {
	List(ctx context.Context) ([]domain.Category, error)
}
