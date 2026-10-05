package ports

import (
	"context"

	"tabs-api/internal/categories/domain"
)

type Repository interface {
	List(ctx context.Context) ([]domain.Category, error)
	Create(ctx context.Context, c domain.Category) (domain.Category, error)
	// Update reports domain.ErrNotFound for an unknown id and
	// domain.ErrDuplicateName for a name another category has.
	Update(ctx context.Context, id int64, d domain.Details) (domain.Category, error)
	// Delete reports domain.ErrNotFound for an unknown id and
	// domain.ErrCategoryInUse for a category a movement refers to.
	Delete(ctx context.Context, id int64) error
}
