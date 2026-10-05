package postgres

import (
	"context"
	"database/sql"
	"errors"
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
		Color:     "#6b8cff",
		Icon:      "tag",
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

// position returns where a category sits among the ids of its direction.
func position(t *testing.T, repo *Repository, c domain.Category) int {
	t.Helper()
	return slices.Index(listedIDs(t, repo, c.Direction), c.ID)
}

// An edit replaces the name, the color and the icon, and nothing else.
func TestUpdateKeepsIdentityAndPlace(t *testing.T) {
	ctx := context.Background()
	db := openDB(t)
	repo := NewRepository(db)

	first := create(t, repo, db, "update test a", "out")
	second := create(t, repo, db, "update test b", "out")
	before := position(t, repo, first)

	renamed := domain.Details{Name: first.Name + " renamed", Color: "#123abc", Icon: "plane"}
	got, err := repo.Update(ctx, first.ID, renamed)
	if err != nil {
		t.Fatalf("Update: %v", err)
	}
	want := first
	want.Name, want.Color, want.Icon = renamed.Name, renamed.Color, renamed.Icon
	if got != want {
		t.Errorf("updated category %+v, want %+v", got, want)
	}
	if after := position(t, repo, first); after != before {
		t.Errorf("the category moved from place %d to %d", before, after)
	}

	// Its own name is not a duplicate; another category's is.
	if _, err := repo.Update(ctx, first.ID, renamed); err != nil {
		t.Errorf("saving the same name again: %v", err)
	}
	renamed.Name = second.Name
	if _, err := repo.Update(ctx, first.ID, renamed); !errors.Is(err, domain.ErrDuplicateName) {
		t.Errorf("taking another category's name: error %v, want %v", err, domain.ErrDuplicateName)
	}
	if _, err := repo.Update(ctx, -1, renamed); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("unknown id: error %v, want %v", err, domain.ErrNotFound)
	}
}

// The catch-all is a flag, not a name: renamed, it still closes the list.
func TestRenamedCatchAllStaysLast(t *testing.T) {
	ctx := context.Background()
	db := openDB(t)
	repo := NewRepository(db)

	var catchAll domain.Category
	categories, err := repo.List(ctx)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	for _, c := range categories {
		if c.CatchAll && c.Direction == "out" {
			catchAll = c
		}
	}
	if catchAll.ID == 0 {
		t.Fatal("no out catch-all to rename")
	}
	t.Cleanup(func() {
		repo.Update(ctx, catchAll.ID, domain.Details{Name: catchAll.Name, Color: catchAll.Color, Icon: catchAll.Icon})
	})

	renamed, err := repo.Update(ctx, catchAll.ID, domain.Details{
		Name:  fmt.Sprintf("renamed catch-all %d", time.Now().UnixNano()),
		Color: catchAll.Color,
		Icon:  catchAll.Icon,
	})
	if err != nil {
		t.Fatalf("Update: %v", err)
	}
	if !renamed.CatchAll {
		t.Error("the rename cleared the catch-all flag")
	}

	created := create(t, repo, db, "after the rename", "out")
	ids := listedIDs(t, repo, "out")
	if last := ids[len(ids)-1]; last != catchAll.ID {
		t.Errorf("the last out category is %d, want the renamed catch-all %d", last, catchAll.ID)
	}
	if ids[len(ids)-2] != created.ID {
		t.Errorf("out categories end %v, want the new one right before the catch-all", ids[len(ids)-2:])
	}
}

func TestDelete(t *testing.T) {
	ctx := context.Background()
	db := openDB(t)
	repo := NewRepository(db)

	unused := create(t, repo, db, "delete test unused", "out")
	if err := repo.Delete(ctx, unused.ID); err != nil {
		t.Fatalf("Delete: %v", err)
	}
	if position(t, repo, unused) != -1 {
		t.Error("the deleted category is still listed")
	}
	if err := repo.Delete(ctx, unused.ID); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("deleting it again: error %v, want %v", err, domain.ErrNotFound)
	}

	// A movement of any date holds its category: this one is decades old.
	used := create(t, repo, db, "delete test used", "out")
	var movementID int64
	if err := db.QueryRowContext(ctx,
		`INSERT INTO movement (amount_cents, direction, category_id, occurred_on)
		 VALUES (100, 'out', $1, '2001-02-10') RETURNING id`, used.ID).Scan(&movementID); err != nil {
		t.Fatalf("insert movement: %v", err)
	}
	// Registered after create's cleanup, so it runs first and frees the category.
	t.Cleanup(func() {
		db.ExecContext(ctx, `DELETE FROM movement WHERE id = $1`, movementID)
	})

	if err := repo.Delete(ctx, used.ID); !errors.Is(err, domain.ErrCategoryInUse) {
		t.Errorf("deleting a category with a movement: error %v, want %v", err, domain.ErrCategoryInUse)
	}
	if position(t, repo, used) == -1 {
		t.Error("the category with a movement was deleted")
	}
	var movements int
	if err := db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM movement WHERE id = $1`, movementID).Scan(&movements); err != nil || movements != 1 {
		t.Errorf("the movement is gone (count %d, error %v)", movements, err)
	}
}
