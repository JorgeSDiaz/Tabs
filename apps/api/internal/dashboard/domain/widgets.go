package domain

import (
	"errors"
	"fmt"
)

type WidgetID string

const (
	WidgetNetBalance           WidgetID = "net-balance"
	WidgetTotalIncome          WidgetID = "total-income"
	WidgetTotalExpenses        WidgetID = "total-expenses"
	WidgetCategoryDistribution WidgetID = "category-distribution"
)

// KnownWidgets is the whole catalog, in definition order. Adding or
// removing a widget means editing this list; the defaults, the parse
// contract, and the normalization all derive from it.
var KnownWidgets = []WidgetID{
	WidgetNetBalance,
	WidgetTotalIncome,
	WidgetTotalExpenses,
	WidgetCategoryDistribution,
}

var (
	ErrUnknownWidget = errors.New("widgets contains an unknown widget id")
	ErrMissingWidget = errors.New("widgets must include every known widget id")
)

type WidgetSettings map[WidgetID]bool

// Defaults is the all-enabled selection served before the user has
// chosen anything.
func Defaults() WidgetSettings {
	settings := make(WidgetSettings, len(KnownWidgets))
	for _, id := range KnownWidgets {
		settings[id] = true
	}
	return settings
}

// Parse is the single place the PUT contract lives: the keys are exactly
// the known widget ids. Values are already booleans — the JSON decode in
// the http adapter rejects anything else.
func Parse(raw map[string]bool) (WidgetSettings, error) {
	for key := range raw {
		if !known(WidgetID(key)) {
			return nil, fmt.Errorf("%w: %q", ErrUnknownWidget, key)
		}
	}
	settings := make(WidgetSettings, len(KnownWidgets))
	for _, id := range KnownWidgets {
		value, ok := raw[string(id)]
		if !ok {
			return nil, fmt.Errorf("%w: %q", ErrMissingWidget, id)
		}
		settings[id] = value
	}
	return settings, nil
}

// Normalize turns whatever was stored into a full settings without ever
// failing: unknown ids (e.g. left over from a newer version) are dropped
// and missing ids fall back to their default, so a stale stored blob can
// not make the dashboard unrenderable.
func Normalize(raw map[string]bool) WidgetSettings {
	settings := Defaults()
	for _, id := range KnownWidgets {
		if value, ok := raw[string(id)]; ok {
			settings[id] = value
		}
	}
	return settings
}

func known(id WidgetID) bool {
	for _, k := range KnownWidgets {
		if k == id {
			return true
		}
	}
	return false
}
