package main

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/logging"
	"github.com/basemind-ai/monorepo/shared/go/rediscache"
	"github.com/basemind-ai/monorepo/shared/go/router"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rs/zerolog/log"
	"golang.org/x/sync/errgroup"
)

var middlewares = []func(next http.Handler) http.Handler{middleware.FirebaseAuthMiddleware}

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

	if _, cacheClientErr := rediscache.New(cfg.RedisUrl); cacheClientErr != nil {
		log.Fatal().Err(cacheClientErr).Msg("failed to init redis")
	}

	conn, connErr := db.CreateConnection(ctx, cfg.DatabaseUrl)
	if connErr != nil {
		log.Fatal().Err(connErr).Msg("failed to connect to DB")
	}

	defer conn.Close()

	mux := router.New(router.Options{
		Environment:      cfg.Environment,
		ServiceName:      "dashboard-backend",
		RegisterHandlers: api.RegisterHandlers,
		Middlewares:      middlewares,
	})
	srv := &http.Server{
		IdleTimeout:       30 * time.Second,
		ReadHeaderTimeout: 2 * time.Second,
		ReadTimeout:       3 * time.Second,
		WriteTimeout:      3 * time.Second,
		Addr:              fmt.Sprintf(":%d", cfg.Port),
		Handler:           mux,
	}

	g, gCtx := errgroup.WithContext(ctx)

	g.Go(func() error {
		log.Info().Msgf("server starting, listening on port %d", cfg.Port)
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
