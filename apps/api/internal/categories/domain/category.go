package domain

type Category struct {
	ID        int64
	Name      string
	Direction string // "in" or "out"; the movement it records must match
	SortOrder int
}
