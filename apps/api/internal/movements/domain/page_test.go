package domain

import "testing"

func TestPageCount(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		total int
		want  int
	}{
		{total: 0, want: 1},
		{total: 1, want: 1},
		{total: 6, want: 1},
		{total: 7, want: 2},
		{total: 45, want: 8},
	} {
		if got := PageCount(test.total); got != test.want {
			t.Errorf("PageCount(%d) = %d, want %d", test.total, got, test.want)
		}
	}
}

func TestClampPage(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name      string
		requested int
		total     int
		want      int
	}{
		{name: "page 1 of an empty list", requested: 1, total: 0, want: 1},
		{name: "beyond the only page of an empty list", requested: 2, total: 0, want: 1},
		{name: "page 1 of one movement", requested: 1, total: 1, want: 1},
		{name: "beyond a full single page", requested: 2, total: 6, want: 1},
		{name: "page 1 of two pages", requested: 1, total: 7, want: 1},
		{name: "the last of two pages", requested: 2, total: 7, want: 2},
		{name: "page 1 of eight pages", requested: 1, total: 45, want: 1},
		{name: "a middle page is kept", requested: 2, total: 45, want: 2},
		{name: "the last of eight pages", requested: 8, total: 45, want: 8},
		{name: "beyond the last of eight pages", requested: 12, total: 45, want: 8},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			if got := ClampPage(test.requested, test.total); got != test.want {
				t.Errorf("ClampPage(%d, %d) = %d, want %d", test.requested, test.total, got, test.want)
			}
		})
	}
}
