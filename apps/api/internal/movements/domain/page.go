package domain

// PageSize is how many movements one page of the list holds. It is the only
// place the size is stated: clients are told the page count, never the size.
const PageSize = 6

// PageCount is how many pages a list of total movements has. An empty list
// still has one page.
func PageCount(total int) int {
	if total <= 0 {
		return 1
	}
	return (total + PageSize - 1) / PageSize
}

// ClampPage answers a requested page, counted from 1, with the last page
// when the list has fewer pages than that.
func ClampPage(requested, total int) int {
	return min(requested, PageCount(total))
}
