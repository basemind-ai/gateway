package main

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/go-shared/config"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/basemind-ai/monorepo/go-services/dashboard-backend/middleware"

	"github.com/basemind-ai/monorepo/go-shared/db"
	"github.com/basemind-ai/monorepo/go-shared/rediscache"

	"github.com/basemind-ai/monorepo/go-services/dashboard-backend/api"
	"github.com/basemind-ai/monorepo/go-shared/router"

	"github.com/basemind-ai/monorepo/go-shared/logging"
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

	cacheClient, cacheClientErr := rediscache.New(cfg.RedisUrl)

	if cacheClientErr != nil {
		log.Fatal().Err(cacheClientErr).Msg("failed to init redis")
	}

	conn, connErr := db.CreateConnection(ctx, cfg.DatabaseUrl)
	if connErr != nil {
		log.Fatal().Err(connErr).Msg("failed to connect to DB")
	}

	defer func() {
		_ = cacheClient.Close()
		_ = conn.Close(ctx)
	}()

	mux := router.New(router.Options{
		Environment:      cfg.Environment,
		ServiceName:      "dashboard-backend",
		RegisterHandlers: api.RegisterHandlers,
		Middlewares:      middlewares,
	})
	srv := &http.Server{
		Addr:              fmt.Sprintf(":%d", cfg.Port),
		Handler:           mux,
		ReadHeaderTimeout: 10,
	}

	g, gCtx := errgroup.WithContext(ctx)

	g.Go(func() error {
		log.Info().Msg("server starting")
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
