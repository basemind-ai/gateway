package main

import (
	"context"
	"fmt"
	"github.com/basemind-ai/backend-services/db"
	"github.com/basemind-ai/backend-services/lib/cache"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/basemind-ai/backend-services/lib/router"
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

	conn := db.CreateConnection(ctx, cfg.DatabaseUrl)

	defer func() {
		_ = conn.Close(ctx)
	}()

	mux := router.New(router.Options[config.Config]{
		Environment:      cfg.Environment,
		ServiceName:      "api-gateway",
		RegisterHandlers: api.RegisterHandlers,
		Cache:            cache.Get(),
		Config:           cfg,
	})

	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Port),
		Handler: mux,
	}

	g, gCtx := errgroup.WithContext(ctx)

	g.Go(func() error {
		log.Info().Msg("server starting up")
		return srv.ListenAndServe()
	})

	g.Go(func() error {
		<-gCtx.Done()
		return srv.Shutdown(ctx)
	})

	if err := g.Wait(); err != nil {
		log.Info().Msg(err.Error())
	}
}
