package domain

import "testing"

func TestBalanceOf(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name   string
		totals []CategoryTotal
		want   Balance
	}{
		{
			name:   "no totals is a zero balance",
			totals: nil,
			want:   Balance{},
		},
		{
			name: "in only",
			totals: []CategoryTotal{
				{CategoryID: 1, Direction: "in", TotalCents: 500000, MovementCount: 1},
				{CategoryID: 2, Direction: "in", TotalCents: 25000, MovementCount: 2},
			},
			want: Balance{TotalIn: 525000},
		},
		{
			name: "out only",
			totals: []CategoryTotal{
				{CategoryID: 3, Direction: "out", TotalCents: 60000, MovementCount: 3},
				{CategoryID: 4, Direction: "out", TotalCents: 1500, MovementCount: 1},
			},
			want: Balance{TotalOut: 61500},
		},
		{
			name: "a mix sums each direction on its own side",
			totals: []CategoryTotal{
				{CategoryID: 1, Direction: "in", TotalCents: 500000, MovementCount: 1},
				{CategoryID: 3, Direction: "out", TotalCents: 60000, MovementCount: 3},
				{CategoryID: 4, Direction: "out", TotalCents: 1500, MovementCount: 1},
			},
			want: Balance{TotalIn: 500000, TotalOut: 61500},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			if got := BalanceOf(test.totals); got != test.want {
				t.Errorf("BalanceOf = %+v, want %+v", got, test.want)
			}
		})
	}
}
