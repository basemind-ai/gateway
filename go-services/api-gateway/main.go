package main

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/gen/go/gateway/v1"
	"github.com/basemind-ai/monorepo/go-services/api-gateway/service"
	"github.com/basemind-ai/monorepo/go-shared/config"
	"github.com/basemind-ai/monorepo/go-shared/db"
	"github.com/basemind-ai/monorepo/go-shared/grpcutils"
	"github.com/basemind-ai/monorepo/go-shared/logging"
	"github.com/basemind-ai/monorepo/go-shared/rediscache"
	"github.com/rs/zerolog/log"
	"golang.org/x/sync/errgroup"
	"net"
	"os"
	"os/signal"
	"syscall"
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

	server := grpcutils.CreateGRPCServer(gateway.RegisterAPIGatewayServiceServer, service.New())

	g, gCtx := errgroup.WithContext(ctx)

	g.Go(func() error {
		address := fmt.Sprintf("0.0.0.0:%d", cfg.Port)

		listen, listenErr := net.Listen("tcp", address)
		if listenErr != nil {
			return listenErr
		}

		log.Info().Str("address", address).Msg("server starting")
		return server.Serve(listen)
	})

	g.Go(func() error {
		<-gCtx.Done()
		server.Stop()
		return nil
	})

	if err := g.Wait(); err != nil {
		log.Info().Msg(err.Error())
	}
}
