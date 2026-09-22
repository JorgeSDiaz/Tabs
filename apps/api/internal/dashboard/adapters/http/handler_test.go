package http

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"

	"tabs-api/internal/dashboard/application"
)

type fakeStore struct {
	saved map[string]bool
}

func (f *fakeStore) Load(ctx context.Context) (map[string]bool, error) {
	return f.saved, nil
}

func (f *fakeStore) Save(ctx context.Context, settings map[string]bool) error {
	f.saved = settings
	return nil
}

func newServer(store *fakeStore) *httptest.Server {
	mux := http.NewServeMux()
	NewHandler(application.NewService(store)).Register(mux)
	return httptest.NewServer(mux)
}

func getWidgets(t *testing.T, url string) (int, settingsJSON) {
	t.Helper()
	resp, err := http.Get(url + "/api/v1/dashboard/widgets")
	if err != nil {
		t.Fatalf("GET failed: %v", err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	var out settingsJSON
	if err := json.Unmarshal(body, &out); err != nil {
		t.Fatalf("decode response %q: %v", body, err)
	}
	return resp.StatusCode, out
}

func putWidgets(t *testing.T, url, payload string) (int, settingsJSON) {
	t.Helper()
	req, err := http.NewRequest(http.MethodPut, url+"/api/v1/dashboard/widgets", strings.NewReader(payload))
	if err != nil {
		t.Fatalf("build PUT request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("PUT failed: %v", err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	var out settingsJSON
	if len(body) > 0 {
		if err := json.Unmarshal(body, &out); err != nil {
			t.Fatalf("decode response %q: %v", body, err)
		}
	}
	return resp.StatusCode, out
}

func TestGetReturnsDefaultsBeforeAnySave(t *testing.T) {
	srv := newServer(&fakeStore{})
	defer srv.Close()

	status, got := getWidgets(t, srv.URL)
	if status != http.StatusOK {
		t.Fatalf("status %d, want 200", status)
	}
	want := map[string]bool{
		"net-balance":           true,
		"total-income":          true,
		"total-expenses":        true,
		"category-distribution": true,
	}
	if !reflect.DeepEqual(got.Widgets, want) {
		t.Fatalf("got %#v, want %#v", got.Widgets, want)
	}
}

func TestPutRoundTripsFullSelection(t *testing.T) {
	store := &fakeStore{}
	srv := newServer(store)
	defer srv.Close()

	payload := `{"widgets":{"net-balance":true,"total-income":false,"total-expenses":true,"category-distribution":false}}`
	status, respBody := putWidgets(t, srv.URL, payload)
	if status != http.StatusOK {
		t.Fatalf("status %d, want 200 (body %#v)", status, respBody)
	}
	status, got := getWidgets(t, srv.URL)
	if status != http.StatusOK {
		t.Fatalf("GET status %d, want 200", status)
	}
	if !reflect.DeepEqual(got.Widgets, respBody.Widgets) {
		t.Fatalf("GET %#v differs from PUT response %#v", got.Widgets, respBody.Widgets)
	}
	want := map[string]bool{
		"net-balance":           true,
		"total-income":          false,
		"total-expenses":        true,
		"category-distribution": false,
	}
	if !reflect.DeepEqual(got.Widgets, want) {
		t.Fatalf("got %#v, want %#v", got.Widgets, want)
	}
}

func TestPutRejectionsLeaveStoreUntouched(t *testing.T) {
	original := map[string]bool{
		"net-balance":           false,
		"total-income":          true,
		"total-expenses":        false,
		"category-distribution": true,
	}
	for _, tc := range []struct {
		name    string
		payload string
	}{
		{"unknown id", `{"widgets":{"net-balance":true,"total-income":true,"total-expenses":true,"category-distribution":true,"extra":false}}`},
		{"missing id", `{"widgets":{"net-balance":true,"total-income":true,"total-expenses":true}}`},
		{"non-boolean value", `{"widgets":{"net-balance":"yes","total-income":true,"total-expenses":true,"category-distribution":true}}`},
		{"empty object", `{}`},
		{"broken json", `{"widgets":`},
	} {
		t.Run(tc.name, func(t *testing.T) {
			store := &fakeStore{saved: original}
			srv := newServer(store)
			defer srv.Close()

			status, _ := putWidgets(t, srv.URL, tc.payload)
			if status != http.StatusBadRequest {
				t.Fatalf("status %d, want 400", status)
			}
			if !reflect.DeepEqual(store.saved, original) {
				t.Fatalf("store changed to %#v", store.saved)
			}
			_, got := getWidgets(t, srv.URL)
			if !reflect.DeepEqual(got.Widgets, original) {
				t.Fatalf("GET returned %#v, want unchanged %#v", got.Widgets, original)
			}
		})
	}
}
