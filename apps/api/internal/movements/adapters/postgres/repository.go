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
		if pgErr, ok := errors.AsType[*pgconn.PgError](err); ok && pgErr.Code == "23503" {
			if pgErr.ConstraintName == "movement_category_direction_fkey" {
				return domain.Movement{}, domain.ErrCategoryDirectionMismatch
			}
			return domain.Movement{}, domain.ErrUnknownCategory
		}
		return domain.Movement{}, err
	}
	return out, nil
}

func (r *Repository) ListForCycle(ctx context.Context, c cyclesdomain.Cycle) ([]domain.Movement, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT `+movementColumns+`
		 FROM movement
		 WHERE occurred_on >= $1 AND occurred_on < $2
		 ORDER BY occurred_on DESC, id DESC`,
		formatDate(c.Start), formatDate(c.End))
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

func (r *Repository) CycleBalance(ctx context.Context, c cyclesdomain.Cycle) (cyclesdomain.Balance, error) {
	var balance cyclesdomain.Balance
	err := r.db.QueryRowContext(ctx,
		`SELECT COALESCE(SUM(amount_cents) FILTER (WHERE direction = 'in'), 0),
		        COALESCE(SUM(amount_cents) FILTER (WHERE direction = 'out'), 0)
		 FROM movement
		 WHERE occurred_on >= $1 AND occurred_on < $2`,
		formatDate(c.Start), formatDate(c.End)).Scan(&balance.TotalIn, &balance.TotalOut)
	if err != nil {
		return cyclesdomain.Balance{}, err
	}
	return balance, nil
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
