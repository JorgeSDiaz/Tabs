package domain

import (
	"errors"
	"time"
)

type Direction string

const (
	DirectionIn  Direction = "in"
	DirectionOut Direction = "out"
)

var (
	ErrInvalidAmount             = errors.New("amount must be positive")
	ErrInvalidDirection          = errors.New(`direction must be "in" or "out"`)
	ErrUnknownCategory           = errors.New("category does not exist")
	ErrCategoryDirectionMismatch = errors.New("category direction does not match movement direction")
	ErrNotFound                  = errors.New("movement not found")
)

type Movement struct {
	ID          int64
	AmountCents int64
	Direction   Direction
	CategoryID  int64
	OccurredOn  time.Time
	Note        string
	CreatedAt   time.Time
}

// NewMovement is the single place amount and direction are validated.
// The category pairing — it must exist and carry this movement's
// direction — is enforced once, by the foreign keys on write.
func NewMovement(amountCents int64, direction Direction, categoryID int64, occurredOn time.Time, note string) (Movement, error) {
	if amountCents <= 0 {
		return Movement{}, ErrInvalidAmount
	}
	if direction != DirectionIn && direction != DirectionOut {
		return Movement{}, ErrInvalidDirection
	}
	return Movement{
		AmountCents: amountCents,
		Direction:   direction,
		CategoryID:  categoryID,
		OccurredOn:  occurredOn,
		Note:        note,
	}, nil
}
