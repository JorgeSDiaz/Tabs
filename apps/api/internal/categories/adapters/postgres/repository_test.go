package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"slices"
	"testing"
	"time"

	"tabs-api/internal/categories/domain"
	"tabs-api/internal/platform/config"
	"tabs-api/internal/platform/postgres"
)

// openDB opens the local database (make db-up) and skips the test when none
// is configured.
func openDB(t *testing.T) *sql.DB {
	t.Helper()
	if os.Getenv("DATABASE_URL") == "" {
		t.Chdir("../../../..") // apps/api, where .env lives
	}
	cfg, err := config.Load()
	if err != nil {
		t.Skipf("no database configured: %v", err)
	}
	db, err := postgres.Open(context.Background(), cfg.DatabaseURL)
	if err != nil {
		t.Skipf("database unavailable: %v", err)
	}
	t.Cleanup(func() { db.Close() })
	return db
}

// create stores a category for the length of the test. The name carries the
// clock so a run never collides with a category that is already there.
func create(t *testing.T, repo *Repository, db *sql.DB, label, direction string) domain.Category {
	t.Helper()
	c, err := repo.Create(context.Background(), domain.Category{
		Name:      fmt.Sprintf("%s %d", label, time.Now().UnixNano()),
		Direction: direction,
	})
	if err != nil {
		t.Fatalf("create %s: %v", label, err)
	}
	t.Cleanup(func() {
		db.ExecContext(context.Background(), `DELETE FROM category WHERE id = $1`, c.ID)
	})
	return c
}

// listedIDs returns the ids of one direction in listing order.
func listedIDs(t *testing.T, repo *Repository, direction string) []int64 {
	t.Helper()
	categories, err := repo.List(context.Background())
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	var ids []int64
	for _, c := range categories {
		if c.Direction == direction {
			ids = append(ids, c.ID)
		}
	}
	return ids
}

// Pins the listing order: a created category goes after every category
// already listed for its direction, and the catch-all stays behind it.
func TestCreatedCategoriesListBeforeTheCatchAll(t *testing.T) {
	db := openDB(t)
	repo := NewRepository(db)

	var catchAll int64
	if err := db.QueryRowContext(context.Background(),
		`SELECT id FROM category WHERE catch_all AND direction = 'out'`).Scan(&catchAll); err != nil {
		t.Fatalf("find the catch-all: %v", err)
	}
	outBefore := listedIDs(t, repo, "out")
	inBefore := listedIDs(t, repo, "in")
	if len(outBefore) == 0 || outBefore[len(outBefore)-1] != catchAll {
		t.Fatalf("the catch-all %d is not the last out category: %v", catchAll, outBefore)
	}

	first := create(t, repo, db, "listing test a", "out")
	second := create(t, repo, db, "listing test b", "out")
	income := create(t, repo, db, "listing test c", "in")

	// Everything that was listed keeps its place, the two new ones follow in
	// creation order, and the catch-all closes the list.
	wantOut := slices.Concat(outBefore[:len(outBefore)-1], []int64{first.ID, second.ID, catchAll})
	if got := listedIDs(t, repo, "out"); !slices.Equal(got, wantOut) {
		t.Errorf("out categories list as %v, want %v", got, wantOut)
	}

	// The in direction has no catch-all: a created category is simply last.
	wantIn := slices.Concat(inBefore, []int64{income.ID})
	if got := listedIDs(t, repo, "in"); !slices.Equal(got, wantIn) {
		t.Errorf("in categories list as %v, want %v", got, wantIn)
	}
}
