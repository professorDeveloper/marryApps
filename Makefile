APP_BIN=app/build/app

CURRENT_DIR=$(shell pwd)

APP_DIR=${CURRENT_DIR}/app
INTERNAL_DIR=${APP_DIR}/internal
SQLC_DIR=${CURRENT_DIR}/sqlc
CMD_DIR=${APP_DIR}/cmd
MIGRATIONS_DIR=${APP_DIR}/migrations
# PDB_URL := postgres://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@0.0.0.0:$(POSTGRES_PORT)/$(POSTGRES_DB)?sslmode=disable

DB_EXT=sql

create-migration:
	@read -p "Enter migration name: " name; \
	migrate create -ext $(DB_EXT) -dir $(MIGRATIONS_DIR) -seq $$name

# mig-force:
# 	migrate -path $(MIGRATIONS_DIR) -database $(MIGRATIONS_DIR) -verbose force 1

run-app-watch:
	cd ${APP_DIR} && nodemon --watch . --ext go --signal SIGINT --exec 'go run ${CMD_DIR}/main.go'

run-app:
	cd ${APP_DIR} && go run ${CMD_DIR}/main.go

swaggen:
	cd ${APP_DIR} && swag init -g internal/app/app.go -o internal/api/docs

sqlc-gen:
	cd ${SQLC_DIR}/tenants && sqlc generate
	cd ${SQLC_DIR}/main && sqlc generate

local-infra-up:
	docker compose -f docker-compose.local-infra.yml up -d

local-infra-down:
	docker compose -f docker-compose.local-infra.yml down

local-infra-full-down:
	docker compose -f docker-compose.local-infra.yml down -v

local-infra-reset: local-infra-full-down local-infra-up
	@echo "Waiting for PostgreSQL to be ready..."
	@sleep 5
	@echo "Infrastructure reset complete!"

