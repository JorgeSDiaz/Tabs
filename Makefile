.PHONY: install api web dev test api-test build tidy db-up db-down db-reset

install:
	pnpm install

api:
	cd apps/api && go run ./cmd/api

web:
	pnpm --filter web dev

dev:
	$(MAKE) -j2 api web

test: api-test

api-test:
	cd apps/api && go test ./...

build:
	cd apps/api && go build -o bin/api ./cmd/api
	pnpm --filter web build

tidy:
	cd apps/api && go mod tidy

db-up:
	docker compose up -d --wait

db-down:
	docker compose down

db-reset:
	docker compose down -v
	$(MAKE) db-up
