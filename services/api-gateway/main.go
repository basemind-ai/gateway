package main

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/gen/go/gateway/v1"
	"github.com/basemind-ai/monorepo/gen/go/ptesting/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/connectors"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/services"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/grpcutils"
	"github.com/basemind-ai/monorepo/shared/go/logging"
	"github.com/basemind-ai/monorepo/shared/go/rediscache"
	"github.com/rs/zerolog/log"
	"golang.org/x/sync/errgroup"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
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

	cfg := config.Get(ctx)

	logging.Configure(cfg.Environment != "production")

	// FIXME: this is a temporary work-around for testing
	if connectorsInitErr := connectors.Init(ctx, grpc.WithTransportCredentials(insecure.NewCredentials())); connectorsInitErr != nil {
		log.Fatal().Err(connectorsInitErr).Msg("failed to initialize connectors")
	}

	if _, cacheClientErr := rediscache.New(cfg.RedisURL); cacheClientErr != nil {
		log.Fatal().Err(cacheClientErr).Msg("failed to init redis")
	}

	conn, connErr := db.CreateConnection(ctx, cfg.DatabaseURL)
	if connErr != nil {
		log.Fatal().Err(connErr).Msg("failed to connect to DB")
	}

	defer conn.Close()

	server := grpcutils.CreateGRPCServer(
		grpcutils.Options{
			AuthHandler: grpcutils.NewAuthHandler(cfg.JWTSecret).HandleAuth,
			Environment: cfg.Environment,
			ServiceName: "api-gateway",
			ServiceRegistrars: []grpcutils.ServiceRegistrar{
				func(s grpc.ServiceRegistrar) {
					gateway.RegisterAPIGatewayServiceServer(s, services.APIGatewayServer{})
				},
				func(s grpc.ServiceRegistrar) {
					ptesting.RegisterPromptTestingServiceServer(s, services.PromptTestingServer{})
				},
			},
		},
	)

	g, gCtx := errgroup.WithContext(ctx)

	g.Go(func() error {
		address := fmt.Sprintf("0.0.0.0:%d", cfg.Port)

		listen, listenErr := net.Listen("tcp", address)
		if listenErr != nil {
			return listenErr
		}

		log.Info().Str("service", "api-gateway").Str("address", address).Msg("server starting")
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
