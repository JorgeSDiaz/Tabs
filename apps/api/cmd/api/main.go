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

	mux := http.NewServeMux()
	movhttp.NewHandler(movapp.NewService(movements, settings)).Register(mux)
	cathttp.NewHandler(catapp.NewService(categories)).Register(mux)
	cychttp.NewHandler(cycapp.NewService(settings, movements)).Register(mux)

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
