FROM golang:1.24-bullseye AS build

WORKDIR /app

COPY ./app/go.mod ./app/go.sum ./
RUN go mod download

COPY ./app .

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/main.go

FROM alpine:3.19

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=build /app/main .
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/internal/config/config.yml ./internal/config/

CMD ["./main"]