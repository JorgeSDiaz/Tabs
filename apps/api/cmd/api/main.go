package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"time"

	"tabs-api/db/migrations"
	catapp "tabs-api/internal/categories/application"
	cathttp "tabs-api/internal/categories/adapters/http"
	catpostgres "tabs-api/internal/categories/adapters/postgres"
	cycapp "tabs-api/internal/cycles/application"
	cychttp "tabs-api/internal/cycles/adapters/http"
	cycpostgres "tabs-api/internal/cycles/adapters/postgres"
	cycdomain "tabs-api/internal/cycles/domain"
	dashapp "tabs-api/internal/dashboard/application"
	dashhttp "tabs-api/internal/dashboard/adapters/http"
	dashpostgres "tabs-api/internal/dashboard/adapters/postgres"
	habhttp "tabs-api/internal/habit/adapters/http"
	habpostgres "tabs-api/internal/habit/adapters/postgres"
	habapp "tabs-api/internal/habit/application"
	habports "tabs-api/internal/habit/ports"
	movapp "tabs-api/internal/movements/application"
	movhttp "tabs-api/internal/movements/adapters/http"
	movpostgres "tabs-api/internal/movements/adapters/postgres"
	"tabs-api/internal/platform/config"
	"tabs-api/internal/platform/postgres"
)

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func run() error {
	ctx := context.Background()

	cfg, err := config.Load()
	if err != nil {
		return err
	}

	db, err := postgres.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer db.Close()

	if err := postgres.Migrate(ctx, db, migrations.FS); err != nil {
		return err
	}

	movements := movpostgres.NewRepository(db)
	categories := catpostgres.NewRepository(db)
	settings := cycpostgres.NewSettingsReader(db)
	widgets := dashpostgres.NewStore(db)

	mux := http.NewServeMux()
	movhttp.NewHandler(movapp.NewService(movements, settings)).Register(mux)
	cathttp.NewHandler(catapp.NewService(categories)).Register(mux)
	cychttp.NewHandler(cycapp.NewService(settings, movements)).Register(mux)
	dashhttp.NewHandler(dashapp.NewService(widgets)).Register(mux)
	habhttp.NewHandler(habapp.NewService(habpostgres.NewReader(db), cycleClock{settings: settings})).Register(mux)

	server := &http.Server{
		Addr:              ":8080",
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}
	log.Println("listening on :8080")
	if err := server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}

// cycleClock resolves the habit's "today" from the cycles settings and
// domain, so the boundary and time zone rules stay in one place.
type cycleClock struct {
	settings *cycpostgres.SettingsReader
}

func (c cycleClock) Today(ctx context.Context) (habports.Today, error) {
	settings, err := c.settings.Settings(ctx)
	if err != nil {
		return habports.Today{}, err
	}
	now := time.Now()
	return habports.Today{
		Cycle:    cycdomain.ActiveAt(now, settings),
		Location: settings.Location,
		Now:      now,
	}, nil
}
