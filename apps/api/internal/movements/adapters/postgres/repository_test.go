package postgres

import (
	"context"
	"database/sql"
	"errors"
	"os"
	"testing"
	"time"

	"tabs-api/internal/movements/domain"
	"tabs-api/internal/platform/config"
	"tabs-api/internal/platform/postgres"
)

// stored is a movement row as the table holds it, including the column the
// API does not expose.
type stored struct {
	movement  domain.Movement
	updatedAt time.Time
}

func readStored(t *testing.T, db *sql.DB, id int64) stored {
	t.Helper()
	var s stored
	var direction string
	err := db.QueryRowContext(context.Background(),
		`SELECT `+movementColumns+`, updated_at FROM movement WHERE id = $1`, id).Scan(
		&s.movement.ID, &s.movement.AmountCents, &direction, &s.movement.CategoryID,
		&s.movement.OccurredOn, &s.movement.Note, &s.movement.CreatedAt, &s.updatedAt)
	if err != nil {
		t.Fatalf("read movement %d: %v", id, err)
	}
	s.movement.Direction = domain.Direction(direction)
	return s
}

func sameStored(a, b stored) bool {
	return a.movement.ID == b.movement.ID &&
		a.movement.AmountCents == b.movement.AmountCents &&
		a.movement.Direction == b.movement.Direction &&
		a.movement.CategoryID == b.movement.CategoryID &&
		a.movement.OccurredOn.Equal(b.movement.OccurredOn) &&
		a.movement.Note == b.movement.Note &&
		a.movement.CreatedAt.Equal(b.movement.CreatedAt) &&
		a.updatedAt.Equal(b.updatedAt)
}

// Pins the update statement against the real table and its foreign keys. It
// needs the local database (make db-up) and is skipped when none is
// configured.
func TestUpdate(t *testing.T) {
	ctx := context.Background()
	if os.Getenv("DATABASE_URL") == "" {
		if err := os.Chdir("../../../.."); err != nil { // apps/api, where .env lives
			t.Fatal(err)
		}
	}
	cfg, err := config.Load()
	if err != nil {
		t.Skipf("no database configured: %v", err)
	}
	db, err := postgres.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		t.Skipf("database unavailable: %v", err)
	}
	defer db.Close()

	var expenseCategory, otherExpenseCategory, incomeCategory int64
	if err := db.QueryRowContext(ctx,
		`SELECT id FROM category WHERE direction = 'out' ORDER BY id LIMIT 1`).Scan(&expenseCategory); err != nil {
		t.Fatalf("find an expense category: %v", err)
	}
	if err := db.QueryRowContext(ctx,
		`SELECT id FROM category WHERE direction = 'out' ORDER BY id LIMIT 1 OFFSET 1`).Scan(&otherExpenseCategory); err != nil {
		t.Fatalf("find a second expense category: %v", err)
	}
	if err := db.QueryRowContext(ctx,
		`SELECT id FROM category WHERE direction = 'in' ORDER BY id LIMIT 1`).Scan(&incomeCategory); err != nil {
		t.Fatalf("find an income category: %v", err)
	}

	// A movement created on September 16, so an edit made now is clearly a
	// later moment.
	createdAt := time.Date(2026, time.September, 16, 9, 0, 0, 0, time.UTC)
	insert := func(t *testing.T) int64 {
		t.Helper()
		var id int64
		if err := db.QueryRowContext(ctx,
			`INSERT INTO movement (amount_cents, direction, category_id, occurred_on, note, created_at, updated_at)
			 VALUES (18430000, 'out', $1, '2026-09-28', 'Supermarket run', $2, $2) RETURNING id`,
			expenseCategory, createdAt).Scan(&id); err != nil {
			t.Fatalf("insert movement: %v", err)
		}
		t.Cleanup(func() {
			db.ExecContext(ctx, `DELETE FROM movement WHERE id = $1`, id)
		})
		return id
	}
	repo := NewRepository(db)

	t.Run("replaces the fields and keeps id and created_at", func(t *testing.T) {
		id := insert(t)
		edit := domain.Movement{
			AmountCents: 250000,
			Direction:   domain.DirectionIn,
			CategoryID:  incomeCategory,
			OccurredOn:  time.Date(2026, time.September, 10, 0, 0, 0, 0, time.UTC),
			Note:        "",
		}

		got, err := repo.Update(ctx, id, edit)
		if err != nil {
			t.Fatalf("Update: %v", err)
		}
		if got.ID != id || !got.CreatedAt.Equal(createdAt) {
			t.Errorf("returned id %d created at %v, want id %d created at %v", got.ID, got.CreatedAt, id, createdAt)
		}
		if got.AmountCents != edit.AmountCents || got.Direction != edit.Direction ||
			got.CategoryID != edit.CategoryID || got.OccurredOn.Format("2006-01-02") != "2026-09-10" || got.Note != "" {
			t.Errorf("returned %+v, want the edited fields %+v", got, edit)
		}

		after := readStored(t, db, id)
		if after.movement.AmountCents != edit.AmountCents || after.movement.Direction != edit.Direction ||
			after.movement.CategoryID != edit.CategoryID ||
			after.movement.OccurredOn.Format("2006-01-02") != "2026-09-10" || after.movement.Note != "" {
			t.Errorf("stored %+v, want the edited fields %+v", after.movement, edit)
		}
		if !after.movement.CreatedAt.Equal(createdAt) {
			t.Errorf("stored created_at %v, want %v", after.movement.CreatedAt, createdAt)
		}
		if !after.updatedAt.After(createdAt) {
			t.Errorf("stored updated_at %v, want later than %v", after.updatedAt, createdAt)
		}
	})

	t.Run("unknown id is not found and creates nothing", func(t *testing.T) {
		var before, after int
		if err := db.QueryRowContext(ctx, `SELECT count(*) FROM movement`).Scan(&before); err != nil {
			t.Fatal(err)
		}
		_, err := repo.Update(ctx, -1, domain.Movement{
			AmountCents: 100,
			Direction:   domain.DirectionOut,
			CategoryID:  expenseCategory,
			OccurredOn:  createdAt,
		})
		if !errors.Is(err, domain.ErrNotFound) {
			t.Fatalf("error %v, want %v", err, domain.ErrNotFound)
		}
		if err := db.QueryRowContext(ctx, `SELECT count(*) FROM movement`).Scan(&after); err != nil {
			t.Fatal(err)
		}
		if after != before {
			t.Fatalf("movement count went from %d to %d", before, after)
		}
	})

	t.Run("unknown category leaves the row unchanged", func(t *testing.T) {
		id := insert(t)
		before := readStored(t, db, id)

		_, err := repo.Update(ctx, id, domain.Movement{
			AmountCents: 100,
			Direction:   domain.DirectionOut,
			CategoryID:  -1,
			OccurredOn:  createdAt,
		})
		if !errors.Is(err, domain.ErrUnknownCategory) {
			t.Fatalf("error %v, want %v", err, domain.ErrUnknownCategory)
		}
		if after := readStored(t, db, id); !sameStored(before, after) {
			t.Fatalf("row changed from %+v to %+v", before, after)
		}
	})

	t.Run("category of the other direction leaves the row unchanged", func(t *testing.T) {
		id := insert(t)
		before := readStored(t, db, id)

		_, err := repo.Update(ctx, id, domain.Movement{
			AmountCents: 100,
			Direction:   domain.DirectionIn,
			CategoryID:  otherExpenseCategory,
			OccurredOn:  createdAt,
		})
		if !errors.Is(err, domain.ErrCategoryDirectionMismatch) {
			t.Fatalf("error %v, want %v", err, domain.ErrCategoryDirectionMismatch)
		}
		if after := readStored(t, db, id); !sameStored(before, after) {
			t.Fatalf("row changed from %+v to %+v", before, after)
		}
	})
}
