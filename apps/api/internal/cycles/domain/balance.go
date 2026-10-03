package domain

// Balance reports a cycle's totals in cents.
type Balance struct {
	TotalIn  int64
	TotalOut int64
}

func (b Balance) Net() int64 {
	return b.TotalIn - b.TotalOut
}

// CategoryTotal is what one category adds up to in a cycle. Direction is
// "in" or "out", passed through from the movements it sums.
type CategoryTotal struct {
	CategoryID    int64
	Direction     string
	TotalCents    int64
	MovementCount int
}

// BalanceOf derives a cycle's balance from its category totals, so the two
// cannot disagree.
func BalanceOf(totals []CategoryTotal) Balance {
	var balance Balance
	for _, total := range totals {
		switch total.Direction {
		case "in":
			balance.TotalIn += total.TotalCents
		case "out":
			balance.TotalOut += total.TotalCents
		}
	}
	return balance
}
