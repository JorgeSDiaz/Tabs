package http

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"tabs-api/internal/categories/application"
	"tabs-api/internal/categories/domain"
)

// fakeRepository holds four categories: Groceries (3) and the catch-all
// Other (4) spend, Salary (1) is the only income. Transport (5) has a
// movement, so storage refuses to delete it.
type fakeRepository struct {
	writes int
}

func (f *fakeRepository) List(context.Context) ([]domain.Category, error) {
	return []domain.Category{
		{ID: 1, Name: "Salary", Direction: "in", Color: "#3dbb76", Icon: "banknote"},
		{ID: 3, Name: "Groceries", Direction: "out", Color: "#f5c451", Icon: "cart"},
		{ID: 5, Name: "Transport", Direction: "out", Color: "#9accff", Icon: "bus"},
		{ID: 4, Name: "Other", Direction: "out", Color: "#a9ad6f", Icon: "tag", CatchAll: true},
	}, nil
}

func (f *fakeRepository) Create(_ context.Context, c domain.Category) (domain.Category, error) {
	f.writes++
	c.ID = 9
	return c, nil
}

func (f *fakeRepository) Update(_ context.Context, id int64, d domain.Details) (domain.Category, error) {
	f.writes++
	if id != 3 {
		return domain.Category{}, domain.ErrNotFound
	}
	if d.Name == "Other" {
		return domain.Category{}, domain.ErrDuplicateName
	}
	return domain.Category{ID: id, Name: d.Name, Direction: "out", Color: d.Color, Icon: d.Icon}, nil
}

func (f *fakeRepository) Delete(_ context.Context, id int64) error {
	f.writes++
	if id == 5 {
		return domain.ErrCategoryInUse
	}
	return nil
}

func serve(t *testing.T, repo *fakeRepository, method, path, body string) *httptest.ResponseRecorder {
	t.Helper()
	mux := http.NewServeMux()
	NewHandler(application.NewService(repo)).Register(mux)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest(method, path, strings.NewReader(body)))
	return rec
}

func TestListStatesColorAndIcon(t *testing.T) {
	t.Parallel()
	rec := serve(t, &fakeRepository{}, http.MethodGet, "/api/v1/categories", "")
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d, want 200 (body %q)", rec.Code, rec.Body)
	}
	var got []categoryJSON
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode %q: %v", rec.Body, err)
	}
	if len(got) != 4 || got[1].Color != "#f5c451" || got[1].Icon != "cart" {
		t.Errorf("listing %+v, want four categories with Groceries in #f5c451 and cart", got)
	}
	// The flag stays inside: the order is all the web is given.
	if strings.Contains(rec.Body.String(), "catch") {
		t.Errorf("body %q exposes the catch-all flag", rec.Body)
	}
}

func TestCreate(t *testing.T) {
	t.Parallel()
	for _, tc := range []struct {
		name string
		body string
		want int
	}{
		{"with a color and an icon", `{"name":"Pets","direction":"out","color":"#6B8CFF","icon":"paw"}`, http.StatusCreated},
		{"blank name", `{"name":" ","direction":"out","color":"#6b8cff","icon":"paw"}`, http.StatusBadRequest},
		{"bad direction", `{"name":"Pets","direction":"up","color":"#6b8cff","icon":"paw"}`, http.StatusBadRequest},
		{"no color", `{"name":"Pets","direction":"out","icon":"paw"}`, http.StatusBadRequest},
		{"a color name", `{"name":"Pets","direction":"out","color":"blue","icon":"paw"}`, http.StatusBadRequest},
		{"no icon", `{"name":"Pets","direction":"out","color":"#6b8cff"}`, http.StatusBadRequest},
		{"not JSON", `{`, http.StatusBadRequest},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			repo := &fakeRepository{}
			rec := serve(t, repo, http.MethodPost, "/api/v1/categories", tc.body)
			if rec.Code != tc.want {
				t.Fatalf("status %d, want %d (body %q)", rec.Code, tc.want, rec.Body)
			}
			if created := tc.want == http.StatusCreated; (repo.writes == 1) != created {
				t.Errorf("%d writes reached the repository", repo.writes)
			}
			if tc.want == http.StatusCreated && !strings.Contains(rec.Body.String(), `"color":"#6b8cff"`) {
				t.Errorf("body %q, want the color lowercased", rec.Body)
			}
		})
	}
}

func TestUpdate(t *testing.T) {
	t.Parallel()
	const valid = `{"name":" Food ","color":"#FF9F6B","icon":"cutlery"}`
	for _, tc := range []struct {
		name string
		id   string
		body string
		want int
	}{
		{"stored", "3", valid, http.StatusOK},
		{"blank name", "3", `{"name":"","color":"#ff9f6b","icon":"cutlery"}`, http.StatusBadRequest},
		{"five-digit color", "3", `{"name":"Food","color":"#12345","icon":"cutlery"}`, http.StatusBadRequest},
		{"blank icon", "3", `{"name":"Food","color":"#ff9f6b","icon":""}`, http.StatusBadRequest},
		{"id that is not a number", "three", valid, http.StatusBadRequest},
		{"unknown id", "8", valid, http.StatusNotFound},
		{"name another category has", "3", `{"name":"Other","color":"#ff9f6b","icon":"cutlery"}`, http.StatusConflict},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			rec := serve(t, &fakeRepository{}, http.MethodPut, "/api/v1/categories/"+tc.id, tc.body)
			if rec.Code != tc.want {
				t.Fatalf("status %d, want %d (body %q)", rec.Code, tc.want, rec.Body)
			}
			if tc.want != http.StatusOK {
				return
			}
			var got categoryJSON
			if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
				t.Fatalf("decode %q: %v", rec.Body, err)
			}
			want := categoryJSON{ID: 3, Name: "Food", Direction: "out", Color: "#ff9f6b", Icon: "cutlery"}
			if got != want {
				t.Errorf("category %+v, want %+v", got, want)
			}
		})
	}
}

// A direction in the body of an edit is not an error and not obeyed.
func TestUpdateIgnoresDirection(t *testing.T) {
	t.Parallel()
	rec := serve(t, &fakeRepository{}, http.MethodPut, "/api/v1/categories/3",
		`{"name":"Food","direction":"in","color":"#ff9f6b","icon":"cutlery"}`)
	if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), `"direction":"out"`) {
		t.Errorf("status %d, body %q; want 200 and the direction still out", rec.Code, rec.Body)
	}
}

func TestDelete(t *testing.T) {
	t.Parallel()
	for _, tc := range []struct {
		name       string
		id         string
		want       int
		wantReason string
		wantWrites int
	}{
		{"unused", "3", http.StatusNoContent, "", 1},
		{"with movements", "5", http.StatusConflict, "has movements", 1},
		// Refused before storage is asked, so the reason is the catch-all
		// even when it has movements too.
		{"the catch-all", "4", http.StatusConflict, "catch-all", 0},
		{"the last of its direction", "1", http.StatusConflict, "needs at least one category", 0},
		{"unknown id", "8", http.StatusNotFound, "not found", 0},
		{"id that is not a number", "four", http.StatusBadRequest, "integer", 0},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			repo := &fakeRepository{}
			rec := serve(t, repo, http.MethodDelete, "/api/v1/categories/"+tc.id, "")
			if rec.Code != tc.want {
				t.Fatalf("status %d, want %d (body %q)", rec.Code, tc.want, rec.Body)
			}
			if !strings.Contains(rec.Body.String(), tc.wantReason) {
				t.Errorf("body %q, want it to say %q", rec.Body, tc.wantReason)
			}
			if repo.writes != tc.wantWrites {
				t.Errorf("%d writes reached the repository, want %d", repo.writes, tc.wantWrites)
			}
		})
	}
}
