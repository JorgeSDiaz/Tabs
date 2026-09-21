package postgres

import (
	"context"
	"database/sql"
	"errors"

	"github.com/jackc/pgx/v5/pgconn"

	"tabs-api/internal/categories/domain"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) List(ctx context.Context) ([]domain.Category, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, name, direction, sort_order FROM category ORDER BY sort_order, name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	categories := []domain.Category{}
	for rows.Next() {
		var c domain.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Direction, &c.SortOrder); err != nil {
			return nil, err
		}
		categories = append(categories, c)
	}
	return categories, rows.Err()
}

// Create sorts the new category after every existing one, so seeded
// entries keep their order and created ones append to their direction.
func (r *Repository) Create(ctx context.Context, c domain.Category) (domain.Category, error) {
	var out domain.Category
	err := r.db.QueryRowContext(ctx,
		`INSERT INTO category (name, direction, sort_order)
		 VALUES ($1, $2, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM category))
		 RETURNING id, name, direction, sort_order`,
		c.Name, c.Direction).Scan(&out.ID, &out.Name, &out.Direction, &out.SortOrder)
	if err != nil {
		if pgErr, ok := errors.AsType[*pgconn.PgError](err); ok && pgErr.Code == "23505" {
			return domain.Category{}, domain.ErrDuplicateName
		}
		return domain.Category{}, err
	}
	return out, nil
}
