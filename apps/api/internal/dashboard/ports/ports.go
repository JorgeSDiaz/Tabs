package ports

import "context"

// SettingsStore reads and writes the stored widget selection. A nil map
// from Load means the user has never chosen anything.
type SettingsStore interface {
	Load(ctx context.Context) (map[string]bool, error)
	Save(ctx context.Context, settings map[string]bool) error
}
