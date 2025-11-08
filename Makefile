APP_BIN=app/build/app

CURRENT_DIR=$(shell pwd)

APP_DIR=${CURRENT_DIR}/app
SQLC_DIR=${CURRENT_DIR}/sqlc

CMD_DIR=${APP_DIR}/cmd
MIGRATIONS_DIR=${APP_DIR}/migrations
DB_EXT=sql

create-migration:
	@read -p "Enter migration name: " name; \
	migrate create -ext $(DB_EXT) -dir $(MIGRATIONS_DIR) -seq $$name

run-app-watch:
	cd ./app && nodemon --watch . --ext go --signal SIGINT --exec 'go run ./cmd/main.go'

run-app:
	cd ./app && go run ./cmd

swaggen:
	cd app && swag init -g cmd/main.go -o api/docs

sqlc-gen:
	cd ${SQLC_DIR}/ && sqlc generate

local-infra-up:
	docker compose -f docker-compose.local-infra.yml up -d

local-infra-down:
	docker compose -f docker-compose.local-infra.yml down

local-infra-clear-pg:
	rm -rf /Users/oybek/Work/yurtal/artifacts/pg-data/blitz
