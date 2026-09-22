package application

import (
	"context"
	"errors"
	"reflect"
	"testing"

	"tabs-api/internal/dashboard/domain"
)

type fakeStore struct {
	saved   map[string]bool
	loadErr error
	saves   int
}

func (f *fakeStore) Load(ctx context.Context) (map[string]bool, error) {
	return f.saved, f.loadErr
}

func (f *fakeStore) Save(ctx context.Context, settings map[string]bool) error {
	f.saved = settings
	f.saves++
	return nil
}

func TestWidgetsOnEmptyStoreYieldsDefaults(t *testing.T) {
	svc := NewService(&fakeStore{})
	got, err := svc.Widgets(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !reflect.DeepEqual(got, domain.Defaults()) {
		t.Fatalf("got %#v, want defaults", got)
	}
}

func TestWidgetsNormalizesStoredMap(t *testing.T) {
	svc := NewService(&fakeStore{saved: map[string]bool{
		"total-income":   false,
		"widget-of-doom": true,
	}})
	got, err := svc.Widgets(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := domain.Defaults()
	want[domain.WidgetTotalIncome] = false
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %#v, want %#v", got, want)
	}
}

func TestWidgetsPropagatesStoreError(t *testing.T) {
	boom := errors.New("boom")
	svc := NewService(&fakeStore{loadErr: boom})
	if _, err := svc.Widgets(context.Background()); !errors.Is(err, boom) {
		t.Fatalf("expected store error to propagate, got %v", err)
	}
}

func TestSaveStoresValidMapping(t *testing.T) {
	store := &fakeStore{}
	svc := NewService(store)
	raw := map[string]bool{
		"net-balance":           true,
		"total-income":          false,
		"total-expenses":        true,
		"category-distribution": false,
	}
	got, err := svc.Save(context.Background(), raw)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := domain.WidgetSettings{
		domain.WidgetNetBalance:           true,
		domain.WidgetTotalIncome:          false,
		domain.WidgetTotalExpenses:        true,
		domain.WidgetCategoryDistribution: false,
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %#v, want %#v", got, want)
	}
	if !reflect.DeepEqual(store.saved, raw) {
		t.Fatalf("store holds %#v, want %#v", store.saved, raw)
	}
}

func TestSaveInvalidMappingLeavesStoreUntouched(t *testing.T) {
	store := &fakeStore{saved: map[string]bool{"net-balance": true}}
	svc := NewService(store)

	_, err := svc.Save(context.Background(), map[string]bool{"nope": true})
	if !errors.Is(err, domain.ErrUnknownWidget) {
		t.Fatalf("expected ErrUnknownWidget, got %v", err)
	}
	if store.saves != 0 {
		t.Fatal("invalid mapping must not reach the store")
	}
}
