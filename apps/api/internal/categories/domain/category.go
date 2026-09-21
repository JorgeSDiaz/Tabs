package domain

import (
	"errors"
	"strings"
)

type Category struct {
	ID        int64
	Name      string
	Direction string // "in" or "out"; the movement it records must match
	SortOrder int
}

var (
	ErrBlankName        = errors.New("name must not be blank")
	ErrInvalidDirection = errors.New(`direction must be "in" or "out"`)
	ErrDuplicateName    = errors.New("a category with that name already exists")
)

// NewCategory is the single place a created category's name and direction
// are validated. Uniqueness is enforced once, by the unique index on write.
func NewCategory(name, direction string) (Category, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return Category{}, ErrBlankName
	}
	if direction != "in" && direction != "out" {
		return Category{}, ErrInvalidDirection
	}
	return Category{Name: name, Direction: direction}, nil
}
