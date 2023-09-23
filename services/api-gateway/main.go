package main

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/gen/go/gateway/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/connectors"
	"github.com/basemind-ai/monorepo/services/api-gateway/service"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"github.com/basemind-ai/monorepo/shared/go/db"
	grpcutils2 "github.com/basemind-ai/monorepo/shared/go/grpcutils"
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

// code used for testing only -- currently held here, but we will move it to E2E testing later

// func Seed(cfg config.Config) {
//	project, _ := db.GetQueries().CreateProject(context.TODO(), db.CreateProjectParams{
//		Name:        "test",
//		Description: "test",
//	})
//
//	systemMessage := "You are a helpful chat bot."
//	userMessage := "This is what the user asked for: {userInput}"
//
//	modelParameters, _ := json.Marshal(map[string]float32{
//		"temperature":       1,
//		"top_p":             1,
//		"max_tokens":        1,
//		"presence_penalty":  1,
//		"frequency_penalty": 1,
//	})
//
//	s, _ := datatypes.CreatePromptTemplateMessage(make([]string, 0), map[string]interface{}{
//		"content": systemMessage,
//		"role":    openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_SYSTEM,
//	})
//	u, _ := datatypes.CreatePromptTemplateMessage([]string{"userInput"}, map[string]interface{}{
//		"content": userMessage,
//		"role":    openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_USER,
//	})
//
//	promptMessages, _ := json.Marshal([]datatypes.PromptTemplateMessage{
//		*s, *u,
//	})
//
//	application, _ := db.GetQueries().CreateApplication(context.TODO(), db.CreateApplicationParams{
//		ProjectID:                 project.ID,
//		Name:                      "test",
//		Description:               "test",
//		ModelType:                 db.ModelTypeGpt35Turbo,
//		ModelVendor:               db.ModelVendorOPENAI,
//		ModelParameters:           modelParameters,
//		PromptMessages:            promptMessages,
//		ExpectedTemplateVariables: []string{"userInput"},
//	})
//
//	applicationId := fmt.Sprintf("%x-%x-%x-%x-%x", application.ID.Bytes[0:4], application.ID.Bytes[4:6], application.ID.Bytes[6:8], application.ID.Bytes[8:10], application.ID.Bytes[10:16])
//
//	log.Info().Str("applicationId", applicationId).Msg("created application")
//
//	jwt, _ := jwtutils.CreateJWT(time.Hour, []byte(cfg.JWTSecret), applicationId)
//	log.Info().Str("jwt", jwt).Msg("created jwt")
//}

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

	// FIXME: this is a temporary work-around for testing
	if connectorsInitErr := connectors.Init(ctx, grpc.WithTransportCredentials(insecure.NewCredentials())); connectorsInitErr != nil {
		log.Fatal().Err(connectorsInitErr).Msg("failed to initialize connectors")
	}

	if _, cacheClientErr := rediscache.New(cfg.RedisUrl); cacheClientErr != nil {
		log.Fatal().Err(cacheClientErr).Msg("failed to init redis")
	}

	conn, connErr := db.CreateConnection(ctx, cfg.DatabaseUrl)
	if connErr != nil {
		log.Fatal().Err(connErr).Msg("failed to connect to DB")
	}

	defer func() {
		_ = conn.Close(ctx)
	}()

	server := grpcutils2.CreateGRPCServer[gateway.APIGatewayServiceServer](grpcutils2.Options[gateway.APIGatewayServiceServer]{
		AuthHandler:   grpcutils2.NewAuthHandler(cfg.JWTSecret).HandleAuth,
		Environment:   cfg.Environment,
		GrpcRegistrar: gateway.RegisterAPIGatewayServiceServer,
		Service:       service.New(),
		ServiceName:   "api-gateway",
	})

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
