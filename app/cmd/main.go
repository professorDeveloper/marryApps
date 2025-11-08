package main

import (
	"log"

	"gitlab.yurtal.tech/company/blitz/back/internal/app"
	"gitlab.yurtal.tech/company/blitz/back/internal/config"
)

func main() {
	log.Print("config initializing")
	cfg, err := config.New()
	if err != nil {
		log.Fatalf("Config error: %s", err)
	}

	app.Run(cfg)
}
