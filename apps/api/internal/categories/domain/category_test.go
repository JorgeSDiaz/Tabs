package domain

import "testing"

func TestNewCategoryRejectsInvalidInput(t *testing.T) {
	cases := []struct {
		desc string
		name string
		dir  string
	}{
		{"blank name", "", "out"},
		{"whitespace-only name", "   ", "out"},
		{"bad direction", "Food", "maybe"},
		{"empty direction", "Food", ""},
	}
	for _, tc := range cases {
		if _, err := NewCategory(tc.name, tc.dir); err == nil {
			t.Errorf("%s: expected error, got nil", tc.desc)
		}
	}
}

func TestNewCategoryTrimsAndAccepts(t *testing.T) {
	c, err := NewCategory("  Weekend trips ", "out")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if c.Name != "Weekend trips" {
		t.Errorf("name = %q, want %q", c.Name, "Weekend trips")
	}
	if c.Direction != "out" {
		t.Errorf("direction = %q, want %q", c.Direction, "out")
	}
}
