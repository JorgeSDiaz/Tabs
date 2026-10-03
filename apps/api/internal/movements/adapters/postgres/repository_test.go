package postgres

import (
	"context"
	"database/sql"
	"errors"
	"os"
	"testing"
	"time"

	cyclesdomain "tabs-api/internal/cycles/domain"
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

// categoryIDs returns the ids of the first n categories of a direction.
func categoryIDs(t *testing.T, db *sql.DB, direction string, n int) []int64 {
	t.Helper()
	rows, err := db.QueryContext(context.Background(),
		`SELECT id FROM category WHERE direction = $1 ORDER BY id LIMIT $2`, direction, n)
	if err != nil {
		t.Fatalf("find %q categories: %v", direction, err)
	}
	defer rows.Close()

	var ids []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			t.Fatal(err)
		}
		ids = append(ids, id)
	}
	if err := rows.Err(); err != nil || len(ids) != n {
		t.Fatalf("found %d %q categories, want %d (error %v)", len(ids), direction, n, err)
	}
	return ids
}

// insertMovement stores a movement for the length of the test and returns
// its id.
func insertMovement(t *testing.T, db *sql.DB, categoryID int64, direction string, amountCents int64, occurredOn string) int64 {
	t.Helper()
	var id int64
	if err := db.QueryRowContext(context.Background(),
		`INSERT INTO movement (amount_cents, direction, category_id, occurred_on)
		 VALUES ($1, $2, $3, $4) RETURNING id`,
		amountCents, direction, categoryID, occurredOn).Scan(&id); err != nil {
		t.Fatalf("insert movement: %v", err)
	}
	t.Cleanup(func() {
		db.ExecContext(context.Background(), `DELETE FROM movement WHERE id = $1`, id)
	})
	return id
}

// A cycle window long before any real movement, so the rows a test inserts
// are the only ones in it.
func pastCycle(year int) cyclesdomain.Cycle {
	return cyclesdomain.Cycle{
		Start: time.Date(year, time.January, 30, 0, 0, 0, 0, time.UTC),
		End:   time.Date(year, time.February, 28, 0, 0, 0, 0, time.UTC),
	}
}

// Pins the grouped query the cycle's balance and widgets are derived from.
func TestCategoryTotals(t *testing.T) {
	ctx := context.Background()
	db := openDB(t)
	out := categoryIDs(t, db, "out", 3)
	in := categoryIDs(t, db, "in", 2)

	for _, amount := range []int64{100, 200, 300} {
		insertMovement(t, db, out[0], "out", amount, "2001-02-10")
	}
	insertMovement(t, db, out[1], "out", 600, "2001-01-30") // the first day counts
	insertMovement(t, db, out[2], "out", 900, "2001-02-27") // so does the last
	insertMovement(t, db, in[0], "in", 500, "2001-02-01")
	insertMovement(t, db, in[1], "in", 700, "2001-02-01")
	// Outside the window on both sides: the day before, and the exclusive end.
	insertMovement(t, db, out[0], "out", 9999, "2001-01-29")
	insertMovement(t, db, out[0], "out", 9999, "2001-02-28")

	got, err := NewRepository(db).CategoryTotals(ctx, pastCycle(2001))
	if err != nil {
		t.Fatalf("CategoryTotals: %v", err)
	}

	// in first, then the larger total; the two 600s fall back to category id.
	want := []cyclesdomain.CategoryTotal{
		{CategoryID: in[1], Direction: "in", TotalCents: 700, MovementCount: 1},
		{CategoryID: in[0], Direction: "in", TotalCents: 500, MovementCount: 1},
		{CategoryID: out[2], Direction: "out", TotalCents: 900, MovementCount: 1},
		{CategoryID: out[0], Direction: "out", TotalCents: 600, MovementCount: 3},
		{CategoryID: out[1], Direction: "out", TotalCents: 600, MovementCount: 1},
	}
	if len(got) != len(want) {
		t.Fatalf("got %+v, want %+v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Errorf("total %d is %+v, want %+v", i, got[i], want[i])
		}
	}
}

func TestCategoryTotalsOfAnEmptyCycle(t *testing.T) {
	db := openDB(t)

	got, err := NewRepository(db).CategoryTotals(context.Background(), pastCycle(1999))
	if err != nil {
		t.Fatalf("CategoryTotals: %v", err)
	}
	if got == nil || len(got) != 0 {
		t.Fatalf("got %#v, want an empty, non-nil list", got)
	}
}

// Pins the paged list: the count, and that limit and offset cut one total
// order, so same-day movements never repeat or go missing across pages.
func TestListForCyclePages(t *testing.T) {
	ctx := context.Background()
	db := openDB(t)
	category := categoryIDs(t, db, "out", 1)[0]

	first := insertMovement(t, db, category, "out", 100, "2002-02-10")
	second := insertMovement(t, db, category, "out", 200, "2002-02-10")
	third := insertMovement(t, db, category, "out", 300, "2002-02-10")
	insertMovement(t, db, category, "out", 9999, "2002-01-29") // the cycle before

	repo := NewRepository(db)
	cycle := pastCycle(2002)

	total, err := repo.CountForCycle(ctx, cycle)
	if err != nil {
		t.Fatalf("CountForCycle: %v", err)
	}
	if total != 3 {
		t.Fatalf("count %d, want 3", total)
	}

	ids := func(limit, offset int) []int64 {
		t.Helper()
		movements, err := repo.ListForCycle(ctx, cycle, limit, offset)
		if err != nil {
			t.Fatalf("ListForCycle(%d, %d): %v", limit, offset, err)
		}
		out := make([]int64, 0, len(movements))
		for _, m := range movements {
			out = append(out, m.ID)
		}
		return out
	}

	if got := ids(2, 0); len(got) != 2 || got[0] != third || got[1] != second {
		t.Errorf("first two are %v, want [%d %d]", got, third, second)
	}
	if got := ids(2, 2); len(got) != 1 || got[0] != first {
		t.Errorf("offset 2 is %v, want [%d]", got, first)
	}
	if got := ids(2, 4); got == nil || len(got) != 0 {
		t.Errorf("offset past the end is %#v, want an empty, non-nil list", got)
	}
}

// Pins the update statement against the real table and its foreign keys.
func TestUpdate(t *testing.T) {
	ctx := context.Background()
	db := openDB(t)

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
