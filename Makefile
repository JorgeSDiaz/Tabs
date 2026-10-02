.PHONY: install api web dev test web-test api-test build tidy db-up db-down db-reset prod-up prod-down

install:
	pnpm install

api:
	cd apps/api && go run ./cmd/api

web:
	pnpm --filter web dev

dev:
	$(MAKE) -j2 api web

test: api-test web-test

web-test:
	pnpm --filter web test

api-test:
	cd apps/api && go test ./...

build:
	cd apps/api && go build -o bin/api ./cmd/api
	pnpm --filter web build

tidy:
	cd apps/api && go mod tidy

db-up:
	docker image inspect tabs-db >nul 2>&1 || docker build -q -t tabs-db ./db
	docker container inspect tabs-db >nul 2>&1 || docker run -d --name tabs-db -p 5432:5432 -v tabs-db-data:/var/lib/postgresql/data tabs-db
	docker start tabs-db
	powershell -NoProfile -Command "$$i=0; while ((docker container inspect -f '{{.State.Health.Status}}' tabs-db) -ne 'healthy') { Start-Sleep -Milliseconds 500; if (++$$i -gt 60) { exit 1 } }"

db-down:
	-docker rm -f tabs-db

db-reset:
	-docker rm -f tabs-db
	-docker volume rm tabs-db-data
	$(MAKE) db-up

prod-up:
	docker compose up -d --build

prod-down:
	docker compose down
