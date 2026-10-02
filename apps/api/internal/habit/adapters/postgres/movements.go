package postgres

import (
	"context"
	"database/sql"

	"tabs-api/internal/habit/domain"
)

// Reader reads the movement table directly, read-only and limited to the
// four columns the habit needs.
type Reader struct {
	db *sql.DB
}

func NewReader(db *sql.DB) *Reader {
	return &Reader{db: db}
}

func (r *Reader) LoggedMovements(ctx context.Context) ([]domain.Movement, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, created_at, occurred_on, note FROM movement ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	movements := []domain.Movement{}
	for rows.Next() {
		var m domain.Movement
		if err := rows.Scan(&m.ID, &m.CreatedAt, &m.OccurredOn, &m.Note); err != nil {
			return nil, err
		}
		movements = append(movements, m)
	}
	return movements, rows.Err()
}
