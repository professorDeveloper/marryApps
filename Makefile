APP_BIN=app/build/app

CURRENT_DIR=$(shell pwd)

APP_DIR=${CURRENT_DIR}/app
INTERNAL_DIR=${APP_DIR}/internal
SQLC_DIR=${CURRENT_DIR}/sqlc
CMD_DIR=${APP_DIR}/cmd
MIGRATIONS_DIR=${APP_DIR}/migrations

DB_EXT=sql

create-migration:
	@read -p "Enter migration name: " name; \
	migrate create -ext $(DB_EXT) -dir $(MIGRATIONS_DIR) -seq $$name

run-app-watch:
	cd ${APP_DIR} && nodemon --watch . --ext go --signal SIGINT --exec 'go run ${CMD_DIR}/main.go'

run-app:
	cd ${APP_DIR} && go run ${CMD_DIR}/main.go

swaggen:
	cd ${APP_DIR} && swag init -g internal/app/app.go -o internal/api/docs

sqlc-gen:
	cd ${SQLC_DIR}/ && sqlc generate

local-infra-up:
	docker compose -f docker-compose.local-infra.yml up -d

local-infra-down:
	docker compose -f docker-compose.local-infra.yml down