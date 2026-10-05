package domain

import (
	"errors"
	"testing"
)

func TestNewDetailsRejectsInvalidInput(t *testing.T) {
	cases := []struct {
		desc  string
		name  string
		color string
		icon  string
		want  error
	}{
		{"blank name", "", "#6b8cff", "tag", ErrBlankName},
		{"whitespace-only name", "   ", "#6b8cff", "tag", ErrBlankName},
		{"a color name", "Food", "blue", "tag", ErrInvalidColor},
		{"five digits", "Food", "#12345", "tag", ErrInvalidColor},
		{"a digit that is not hexadecimal", "Food", "#12345G", "tag", ErrInvalidColor},
		{"no hash", "Food", "6b8cff", "tag", ErrInvalidColor},
		{"empty color", "Food", "", "tag", ErrInvalidColor},
		{"blank icon", "Food", "#6b8cff", "  ", ErrBlankIcon},
	}
	for _, tc := range cases {
		if _, err := NewDetails(tc.name, tc.color, tc.icon); !errors.Is(err, tc.want) {
			t.Errorf("%s: error %v, want %v", tc.desc, err, tc.want)
		}
	}
}

func TestNewDetailsTrimsAndLowercases(t *testing.T) {
	d, err := NewDetails("  Weekend trips ", "#ABCDEF", " plane ")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if want := (Details{Name: "Weekend trips", Color: "#abcdef", Icon: "plane"}); d != want {
		t.Errorf("details %+v, want %+v", d, want)
	}
}

func TestNewCategoryChecksTheDirection(t *testing.T) {
	d := Details{Name: "Food", Color: "#6b8cff", Icon: "tag"}
	for _, direction := range []string{"maybe", ""} {
		if _, err := NewCategory(direction, d); !errors.Is(err, ErrInvalidDirection) {
			t.Errorf("direction %q: error %v, want %v", direction, err, ErrInvalidDirection)
		}
	}

	c, err := NewCategory("out", d)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if want := (Category{Name: "Food", Direction: "out", Color: "#6b8cff", Icon: "tag"}); c != want {
		t.Errorf("category %+v, want %+v", c, want)
	}
}

func TestCanDelete(t *testing.T) {
	cases := []struct {
		desc        string
		category    Category
		inDirection int
		want        error
	}{
		{"one of several", Category{}, 3, nil},
		{"the catch-all", Category{CatchAll: true}, 9, ErrCatchAll},
		{"the last of its direction", Category{}, 1, ErrLastOfDirection},
		// The catch-all is named first: it is the reason that never goes away.
		{"a catch-all that is also the last", Category{CatchAll: true}, 1, ErrCatchAll},
	}
	for _, tc := range cases {
		if err := tc.category.CanDelete(tc.inDirection); !errors.Is(err, tc.want) {
			t.Errorf("%s: error %v, want %v", tc.desc, err, tc.want)
		}
	}
}
