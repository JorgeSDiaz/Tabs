package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
)

// Store implements the dashboard ports.SettingsStore on the single
// settings row (id = 1). The cycles slice reads other columns of the same
// row; the two never touch each other's data.
type Store struct {
	db *sql.DB
}

func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

// Load returns a nil map when dashboard_widgets is NULL: nothing has
// ever been saved.
func (s *Store) Load(ctx context.Context) (map[string]bool, error) {
	var raw []byte
	err := s.db.QueryRowContext(ctx,
		`SELECT dashboard_widgets FROM settings WHERE id = 1`).Scan(&raw)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, errors.New("settings row is missing")
	}
	if err != nil {
		return nil, err
	}
	if len(raw) == 0 {
		return nil, nil
	}
	var settings map[string]bool
	if err := json.Unmarshal(raw, &settings); err != nil {
		return nil, fmt.Errorf("decode dashboard_widgets: %w", err)
	}
	return settings, nil
}

func (s *Store) Save(ctx context.Context, settings map[string]bool) error {
	body, err := json.Marshal(settings)
	if err != nil {
		return err
	}
	_, err = s.db.ExecContext(ctx,
		`UPDATE settings SET dashboard_widgets = $1 WHERE id = 1`, body)
	return err
}
