package application

import (
	"context"
	"errors"
	"testing"
	"time"

	cyclesdomain "tabs-api/internal/cycles/domain"
	"tabs-api/internal/movements/domain"
)

// fakeRepository records what Update was asked to write.
type fakeRepository struct {
	updates   int
	updatedID int64
	updated   domain.Movement
}

func (f *fakeRepository) Create(_ context.Context, m domain.Movement) (domain.Movement, error) {
	return m, nil
}

func (f *fakeRepository) Update(_ context.Context, id int64, m domain.Movement) (domain.Movement, error) {
	f.updates++
	f.updatedID = id
	f.updated = m
	m.ID = id
	return m, nil
}

func (f *fakeRepository) ListForCycle(context.Context, cyclesdomain.Cycle) ([]domain.Movement, error) {
	return nil, nil
}

func (f *fakeRepository) Delete(context.Context, int64) (bool, error) { return false, nil }

func validInput() MovementInput {
	return MovementInput{
		AmountCents: 14830000,
		Direction:   domain.DirectionOut,
		CategoryID:  4,
		OccurredOn:  time.Date(2026, time.September, 28, 0, 0, 0, 0, time.UTC),
		Note:        "Supermarket run",
	}
}

func TestUpdateRejectsInvalidInputBeforeTheRepository(t *testing.T) {
	t.Parallel()
	for _, tc := range []struct {
		name   string
		change func(*MovementInput)
		want   error
	}{
		{"zero amount", func(in *MovementInput) { in.AmountCents = 0 }, domain.ErrInvalidAmount},
		{"invalid direction", func(in *MovementInput) { in.Direction = "sideways" }, domain.ErrInvalidDirection},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			repo := &fakeRepository{}
			in := validInput()
			tc.change(&in)

			_, err := NewService(repo, nil).Update(context.Background(), 7, in)
			if !errors.Is(err, tc.want) {
				t.Fatalf("error %v, want %v", err, tc.want)
			}
			if repo.updates != 0 {
				t.Fatalf("repository reached %d times, want 0", repo.updates)
			}
		})
	}
}

func TestUpdatePassesTheIDAndFieldsToTheRepository(t *testing.T) {
	t.Parallel()
	repo := &fakeRepository{}
	in := validInput()

	got, err := NewService(repo, nil).Update(context.Background(), 7, in)
	if err != nil {
		t.Fatalf("Update: %v", err)
	}
	if repo.updates != 1 || repo.updatedID != 7 {
		t.Fatalf("repository reached %d times with id %d, want once with id 7", repo.updates, repo.updatedID)
	}
	want := domain.Movement{
		AmountCents: in.AmountCents,
		Direction:   in.Direction,
		CategoryID:  in.CategoryID,
		OccurredOn:  in.OccurredOn,
		Note:        in.Note,
	}
	if repo.updated != want {
		t.Fatalf("repository got %+v, want %+v", repo.updated, want)
	}
	if got.ID != 7 {
		t.Fatalf("returned id %d, want 7", got.ID)
	}
}
