package postgres

import (
	"context"
	"database/sql"
	"errors"

	"github.com/jackc/pgx/v5/pgconn"

	"tabs-api/internal/categories/domain"
)

const categoryColumns = `id, name, direction, color, icon, sort_order, catch_all`

// SQLSTATE codes the writes translate into domain errors.
const (
	uniqueViolation     = "23505"
	foreignKeyViolation = "23503"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

type scanner interface {
	Scan(dest ...any) error
}

func scanCategory(row scanner) (domain.Category, error) {
	var c domain.Category
	err := row.Scan(&c.ID, &c.Name, &c.Direction, &c.Color, &c.Icon, &c.SortOrder, &c.CatchAll)
	return c, err
}

func violates(err error, code string) bool {
	pgErr, ok := errors.AsType[*pgconn.PgError](err)
	return ok && pgErr.Code == code
}

// List is the one place the listing order is decided: a direction's
// catch-all goes after every other category, whatever its sort_order.
func (r *Repository) List(ctx context.Context) ([]domain.Category, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT `+categoryColumns+` FROM category ORDER BY catch_all, sort_order, name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	categories := []domain.Category{}
	for rows.Next() {
		c, err := scanCategory(rows)
		if err != nil {
			return nil, err
		}
		categories = append(categories, c)
	}
	return categories, rows.Err()
}

// Create gives the new category the next sort_order, so it lists after
// every category already there except the catch-all, which List keeps last.
func (r *Repository) Create(ctx context.Context, c domain.Category) (domain.Category, error) {
	out, err := scanCategory(r.db.QueryRowContext(ctx,
		`INSERT INTO category (name, direction, color, icon, sort_order)
		 VALUES ($1, $2, $3, $4, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM category))
		 RETURNING `+categoryColumns,
		c.Name, c.Direction, c.Color, c.Icon))
	if violates(err, uniqueViolation) {
		return domain.Category{}, domain.ErrDuplicateName
	}
	if err != nil {
		return domain.Category{}, err
	}
	return out, nil
}

// Update replaces what the user chooses about a category. Direction,
// sort_order and catch_all are not in the SET list, so an edit cannot move
// a category to the other direction or to another place in the listing.
func (r *Repository) Update(ctx context.Context, id int64, d domain.Details) (domain.Category, error) {
	out, err := scanCategory(r.db.QueryRowContext(ctx,
		`UPDATE category SET name = $1, color = $2, icon = $3
		 WHERE id = $4
		 RETURNING `+categoryColumns,
		d.Name, d.Color, d.Icon, id))
	if errors.Is(err, sql.ErrNoRows) {
		return domain.Category{}, domain.ErrNotFound
	}
	if violates(err, uniqueViolation) {
		return domain.Category{}, domain.ErrDuplicateName
	}
	if err != nil {
		return domain.Category{}, err
	}
	return out, nil
}

// Delete is the one place a category with movements is refused: the
// movement table's foreign key stops the delete, in any cycle.
func (r *Repository) Delete(ctx context.Context, id int64) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM category WHERE id = $1`, id)
	if violates(err, foreignKeyViolation) {
		return domain.ErrCategoryInUse
	}
	if err != nil {
		return err
	}
	deleted, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if deleted == 0 {
		return domain.ErrNotFound
	}
	return nil
}
