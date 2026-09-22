package domain

import (
	"errors"
	"reflect"
	"testing"
)

func TestParseRejectsUnknownID(t *testing.T) {
	_, err := Parse(map[string]bool{"net-balance": true, "total-income": true, "total-expenses": true, "widget-of-doom": false})
	if err == nil {
		t.Fatal("expected error for unknown widget id, got nil")
	}
	if !errors.Is(err, ErrUnknownWidget) {
		t.Fatalf("expected ErrUnknownWidget, got %v", err)
	}
}

func TestParseRejectsMissingID(t *testing.T) {
	_, err := Parse(map[string]bool{"net-balance": true, "total-income": true})
	if err == nil {
		t.Fatal("expected error for incomplete mapping, got nil")
	}
	if !errors.Is(err, ErrMissingWidget) {
		t.Fatalf("expected ErrMissingWidget, got %v", err)
	}
}

func TestParseAcceptsFullMapping(t *testing.T) {
	settings, err := Parse(map[string]bool{
		"net-balance":           true,
		"total-income":          false,
		"total-expenses":        true,
		"category-distribution": false,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := WidgetSettings{
		WidgetNetBalance:           true,
		WidgetTotalIncome:          false,
		WidgetTotalExpenses:        true,
		WidgetCategoryDistribution: false,
	}
	if !reflect.DeepEqual(settings, want) {
		t.Fatalf("got %#v, want %#v", settings, want)
	}
}

func TestNormalizeDropsUnknownAndDefaultsMissing(t *testing.T) {
	got := Normalize(map[string]bool{"net-balance": false, "widget-of-doom": true})
	want := WidgetSettings{
		WidgetNetBalance:           false,
		WidgetTotalIncome:          true,
		WidgetTotalExpenses:        true,
		WidgetCategoryDistribution: true,
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %#v, want %#v", got, want)
	}
}

func TestNormalizeNilYieldsDefaults(t *testing.T) {
	if !reflect.DeepEqual(Normalize(nil), Defaults()) {
		t.Fatalf("nil store should normalize to defaults, got %#v", Normalize(nil))
	}
}
