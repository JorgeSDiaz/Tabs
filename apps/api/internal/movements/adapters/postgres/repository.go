package postgres

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgconn"

	cyclesdomain "tabs-api/internal/cycles/domain"
	"tabs-api/internal/movements/domain"
)

const movementColumns = `id, amount_cents, direction, category_id, occurred_on, note, created_at`

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, m domain.Movement) (domain.Movement, error) {
	row := r.db.QueryRowContext(ctx,
		`INSERT INTO movement (amount_cents, direction, category_id, occurred_on, note)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING `+movementColumns,
		m.AmountCents, string(m.Direction), m.CategoryID, formatDate(m.OccurredOn), m.Note)

	out, err := scanMovement(row)
	if err != nil {
		return domain.Movement{}, categoryError(err)
	}
	return out, nil
}

// Update replaces every editable column in one statement. created_at is
// not in the SET list, so the day the movement was logged cannot move.
func (r *Repository) Update(ctx context.Context, id int64, m domain.Movement) (domain.Movement, error) {
	row := r.db.QueryRowContext(ctx,
		`UPDATE movement
		 SET amount_cents = $1, direction = $2, category_id = $3, occurred_on = $4, note = $5, updated_at = now()
		 WHERE id = $6
		 RETURNING `+movementColumns,
		m.AmountCents, string(m.Direction), m.CategoryID, formatDate(m.OccurredOn), m.Note, id)

	out, err := scanMovement(row)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.Movement{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.Movement{}, categoryError(err)
	}
	return out, nil
}

func (r *Repository) CountForCycle(ctx context.Context, c cyclesdomain.Cycle) (int, error) {
	var total int
	err := r.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM movement WHERE occurred_on >= $1 AND occurred_on < $2`,
		formatDate(c.Start), formatDate(c.End)).Scan(&total)
	return total, err
}

// ListForCycle orders by date and then by id, which makes the order total:
// consecutive offsets never repeat or skip a movement.
func (r *Repository) ListForCycle(ctx context.Context, c cyclesdomain.Cycle, limit, offset int) ([]domain.Movement, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT `+movementColumns+`
		 FROM movement
		 WHERE occurred_on >= $1 AND occurred_on < $2
		 ORDER BY occurred_on DESC, id DESC
		 LIMIT $3 OFFSET $4`,
		formatDate(c.Start), formatDate(c.End), limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	movements := []domain.Movement{}
	for rows.Next() {
		var m domain.Movement
		var direction string
		if err := rows.Scan(&m.ID, &m.AmountCents, &direction, &m.CategoryID, &m.OccurredOn, &m.Note, &m.CreatedAt); err != nil {
			return nil, err
		}
		m.Direction = domain.Direction(direction)
		movements = append(movements, m)
	}
	return movements, rows.Err()
}

func (r *Repository) Delete(ctx context.Context, id int64) (bool, error) {
	result, err := r.db.ExecContext(ctx, `DELETE FROM movement WHERE id = $1`, id)
	if err != nil {
		return false, err
	}
	n, err := result.RowsAffected()
	if err != nil {
		return false, err
	}
	return n == 1, nil
}

// CategoryTotals is the one query a cycle's sums come from: the balance is
// derived from its rows.
func (r *Repository) CategoryTotals(ctx context.Context, c cyclesdomain.Cycle) ([]cyclesdomain.CategoryTotal, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT category_id, direction, SUM(amount_cents) AS total_cents, COUNT(*)
		 FROM movement
		 WHERE occurred_on >= $1 AND occurred_on < $2
		 GROUP BY category_id, direction
		 ORDER BY direction, total_cents DESC, category_id`,
		formatDate(c.Start), formatDate(c.End))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	totals := []cyclesdomain.CategoryTotal{}
	for rows.Next() {
		var t cyclesdomain.CategoryTotal
		if err := rows.Scan(&t.CategoryID, &t.Direction, &t.TotalCents, &t.MovementCount); err != nil {
			return nil, err
		}
		totals = append(totals, t)
	}
	return totals, rows.Err()
}

// categoryError turns a write's foreign-key violation into the domain
// error for the category pairing. Any other error passes through.
func categoryError(err error) error {
	if pgErr, ok := errors.AsType[*pgconn.PgError](err); ok && pgErr.Code == "23503" {
		if pgErr.ConstraintName == "movement_category_direction_fkey" {
			return domain.ErrCategoryDirectionMismatch
		}
		return domain.ErrUnknownCategory
	}
	return err
}

func scanMovement(row *sql.Row) (domain.Movement, error) {
	var m domain.Movement
	var direction string
	if err := row.Scan(&m.ID, &m.AmountCents, &direction, &m.CategoryID, &m.OccurredOn, &m.Note, &m.CreatedAt); err != nil {
		return domain.Movement{}, err
	}
	m.Direction = domain.Direction(direction)
	return m, nil
}

func formatDate(t time.Time) string {
	return t.Format("2006-01-02")
}
