package postgres

import (
	"context"
	"os"
	"testing"

	"tabs-api/internal/platform/config"
	"tabs-api/internal/platform/postgres"
)

// Pins the habit's read-only coupling to the movement table. It needs the
// local database (make db-up) and is skipped when none is configured.
func TestLoggedMovementsReadsTheMovementTable(t *testing.T) {
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

	var categoryID, movementID int64
	if err := db.QueryRowContext(ctx,
		`SELECT id FROM category WHERE direction = 'out' ORDER BY id LIMIT 1`).Scan(&categoryID); err != nil {
		t.Fatalf("find an expense category: %v", err)
	}
	if err := db.QueryRowContext(ctx,
		`INSERT INTO movement (amount_cents, direction, category_id, occurred_on, note)
		 VALUES (100, 'out', $1, '2026-09-08', 'back-filled') RETURNING id`, categoryID).Scan(&movementID); err != nil {
		t.Fatalf("insert movement: %v", err)
	}
	t.Cleanup(func() {
		db.ExecContext(ctx, `DELETE FROM movement WHERE id = $1`, movementID)
	})

	movements, err := NewReader(db).LoggedMovements(ctx)
	if err != nil {
		t.Fatalf("LoggedMovements: %v", err)
	}
	for _, m := range movements {
		if m.ID != movementID {
			continue
		}
		if m.Note != "back-filled" || m.CreatedAt.IsZero() || m.OccurredOn.Format("2006-01-02") != "2026-09-08" {
			t.Fatalf("read back %+v", m)
		}
		return
	}
	t.Fatalf("movement %d not returned", movementID)
}
