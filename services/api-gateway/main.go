package main

import (
	"context"
	"os"
	"os/signal"
	"strconv"
	"syscall"

	"github.com/basemind-ai/backend-services/lib/server"
	"github.com/basemind-ai/backend-services/services/api-gateway/api"

	"github.com/basemind-ai/backend-services/lib/logging"
	"github.com/basemind-ai/backend-services/services/api-gateway/config"
	"github.com/rs/zerolog/log"
	"golang.org/x/sync/errgroup"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())

	go func() {
		c := make(chan os.Signal, 1)
		signal.Notify(c, os.Interrupt, syscall.SIGTERM)

		<-c
		cancel()
	}()

	cfg, configParseErr := config.Get(ctx)

	if configParseErr != nil {
		log.Fatal().Err(configParseErr).Msg("failed to parse config, terminating")
	}

	logging.Configure(cfg.Environment != "production")

	srv := server.CreateServer(server.Options{
		Environment:      cfg.Environment,
		RegisterHandlers: api.RegisterHandlers,
	})

	g, gCtx := errgroup.WithContext(ctx)

	g.Go(func() error {
		log.Info().Msg("server starting up")
		return srv.Listen(":" + strconv.Itoa(cfg.Port))
	})

	g.Go(func() error {
		<-gCtx.Done()
		return srv.Shutdown()
	})

	if err := g.Wait(); err != nil {
		log.Info().Msg(err.Error())
	}
}
