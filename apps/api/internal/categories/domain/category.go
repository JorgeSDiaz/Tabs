package domain

import (
	"errors"
	"regexp"
	"strings"
)

type Category struct {
	ID        int64
	Name      string
	Direction string // "in" or "out"; the movement it records must match
	Color     string // "#rrggbb", lowercase
	Icon      string // the name of an icon in the web's icon set
	SortOrder int
	// CatchAll marks the category that lists last in its direction. It is
	// read from storage and never set through the API.
	CatchAll bool
}

// Details are what the user chooses about a category: at creation, and
// again on every edit.
type Details struct {
	Name  string
	Color string
	Icon  string
}

var (
	ErrBlankName        = errors.New("name must not be blank")
	ErrInvalidDirection = errors.New(`direction must be "in" or "out"`)
	ErrInvalidColor     = errors.New("color must be a six-digit hexadecimal color, like #6b8cff")
	ErrBlankIcon        = errors.New("icon must not be blank")
	ErrDuplicateName    = errors.New("a category with that name already exists")
	ErrNotFound         = errors.New("category not found")
	ErrCategoryInUse    = errors.New("this category has movements, so it cannot be deleted")
	ErrCatchAll         = errors.New("this is the catch-all category, so it cannot be deleted")
	ErrLastOfDirection  = errors.New("a direction needs at least one category, and this is the last one")
)

var hexColor = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)

// NewDetails is the single place a category's name, color and icon are
// validated, for creating and for editing. Which colors and icons exist is
// the web's business; only their form is checked here. Uniqueness of the
// name is enforced once, by the unique index on write.
func NewDetails(name, color, icon string) (Details, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return Details{}, ErrBlankName
	}
	if !hexColor.MatchString(color) {
		return Details{}, ErrInvalidColor
	}
	icon = strings.TrimSpace(icon)
	if icon == "" {
		return Details{}, ErrBlankIcon
	}
	return Details{Name: name, Color: strings.ToLower(color), Icon: icon}, nil
}

// NewCategory is the single place a created category's direction is
// validated. A direction is chosen once: no edit can change it.
func NewCategory(direction string, d Details) (Category, error) {
	if direction != "in" && direction != "out" {
		return Category{}, ErrInvalidDirection
	}
	return Category{Name: d.Name, Direction: direction, Color: d.Color, Icon: d.Icon}, nil
}

// CanDelete is the single place the two deletion rules that need no
// movement are decided; inDirection counts the categories of c's direction,
// c included. A category that has movements is refused by storage instead.
func (c Category) CanDelete(inDirection int) error {
	if c.CatchAll {
		return ErrCatchAll
	}
	if inDirection <= 1 {
		return ErrLastOfDirection
	}
	return nil
}
