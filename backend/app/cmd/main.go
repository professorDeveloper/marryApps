package main

import (
	"log"

	"gitlab.yurtal.tech/company/maryai/back/internal/app"
	"gitlab.yurtal.tech/company/maryai/back/internal/config"
)

func main() {
	log.Print("config initializing")
	cfg, err := config.New()
	if err != nil {
		log.Fatalf("Config error: %s", err)
	}

	app.Run(cfg)
}
