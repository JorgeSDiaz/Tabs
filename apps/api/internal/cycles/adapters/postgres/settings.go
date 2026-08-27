package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"tabs-api/internal/cycles/domain"
)

type SettingsReader struct {
	db *sql.DB
}

func NewSettingsReader(db *sql.DB) *SettingsReader {
	return &SettingsReader{db: db}
}

func (r *SettingsReader) Settings(ctx context.Context) (domain.Settings, error) {
	var boundaryDay int
	var timezone string
	err := r.db.QueryRowContext(ctx,
		`SELECT boundary_day, timezone FROM settings WHERE id = 1`).Scan(&boundaryDay, &timezone)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.Settings{}, errors.New("settings row is missing")
	}
	if err != nil {
		return domain.Settings{}, err
	}

	location, err := time.LoadLocation(timezone)
	if err != nil {
		return domain.Settings{}, fmt.Errorf("load time zone %q: %w", timezone, err)
	}
	return domain.Settings{BoundaryDay: boundaryDay, Location: location}, nil
}
