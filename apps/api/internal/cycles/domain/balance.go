package domain

// Balance reports a cycle's totals in cents.
type Balance struct {
	TotalIn  int64
	TotalOut int64
}

func (b Balance) Net() int64 {
	return b.TotalIn - b.TotalOut
}
