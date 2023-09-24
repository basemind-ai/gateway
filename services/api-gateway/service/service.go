package service

import (
	"context"
	"github.com/basemind-ai/monorepo/gen/go/gateway/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/connectors"
	"github.com/basemind-ai/monorepo/services/api-gateway/constants"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/rediscache"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"time"
)

const (
	ErrorApplicationIdNotInContext = "application ID not found in context"
)

type Server struct {
	gateway.UnimplementedAPIGatewayServiceServer
}

func New() gateway.APIGatewayServiceServer {
	return Server{}
}

func RetrieveApplicationPromptConfig(ctx context.Context, applicationId string) func() (*datatypes.ApplicationPromptConfig, error) {
	return func() (*datatypes.ApplicationPromptConfig, error) {
		appId := pgtype.UUID{}
		if idErr := appId.Scan(applicationId); idErr != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid application id: %v", idErr)
		}

		application, applicationQueryErr := db.GetQueries().FindApplicationById(ctx, appId)
		if applicationQueryErr != nil {
			return nil, status.Errorf(codes.NotFound, "application does not exist: %v", applicationQueryErr)
		}

		promptConfig, promptConfigQueryErr := db.GetQueries().FindActivePromptConfigByApplicationId(ctx, appId)
		if promptConfigQueryErr != nil {
			return nil, status.Errorf(codes.NotFound, "the application does not have an active prompt configuration: %v", promptConfigQueryErr)
		}

		return &datatypes.ApplicationPromptConfig{
			ApplicationID:    applicationId,
			ApplicationData:  application,
			PromptConfigData: promptConfig,
		}, nil
	}
}

func (Server) RequestPromptConfig(ctx context.Context, _ *gateway.PromptConfigRequest) (*gateway.PromptConfigResponse, error) {
	applicationId, ok := ctx.Value(constants.ApplicationIDContextKey).(string)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, ErrorApplicationIdNotInContext)
	}

	applicationPromptConfig, retrievalErr := rediscache.With[datatypes.ApplicationPromptConfig](
		ctx, applicationId, &datatypes.ApplicationPromptConfig{}, time.Minute*30, RetrieveApplicationPromptConfig(ctx, applicationId),
	)
	if retrievalErr != nil {
		return nil, retrievalErr
	}

	return &gateway.PromptConfigResponse{
		ExpectedPromptVariables: applicationPromptConfig.PromptConfigData.TemplateVariables,
	}, nil
}

func (Server) RequestPrompt(ctx context.Context, request *gateway.PromptRequest) (*gateway.PromptResponse, error) {
	applicationId, ok := ctx.Value(constants.ApplicationIDContextKey).(string)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, ErrorApplicationIdNotInContext)
	}
	log.Debug().Str("applicationId", applicationId).Msg("entered prompt request")
	applicationPromptConfig, retrievalErr := rediscache.With[datatypes.ApplicationPromptConfig](
		ctx, applicationId, &datatypes.ApplicationPromptConfig{}, time.Minute*30, RetrieveApplicationPromptConfig(ctx, applicationId),
	)
	if retrievalErr != nil {
		return nil, retrievalErr
	}
	log.Debug().Msg("retrieved application")
	client := connectors.GetOpenAIConnectorClient()
	responseContent, requestErr := client.RequestPrompt(ctx, applicationId, applicationPromptConfig, request.TemplateVariables)
	if requestErr != nil {
		return nil, retrievalErr
	}
	log.Debug().Msg("got response from openai")

	return &gateway.PromptResponse{
		Content:      responseContent,
		PromptTokens: 0,
	}, nil
}
func (Server) RequestStreamingPrompt(request *gateway.PromptRequest, streamServer gateway.APIGatewayService_RequestStreamingPromptServer) error {
	applicationId, ok := streamServer.Context().Value(constants.ApplicationIDContextKey).(string)
	if !ok {
		return status.Errorf(codes.Unauthenticated, ErrorApplicationIdNotInContext)
	}

	applicationPromptConfig, retrievalErr := rediscache.With[datatypes.ApplicationPromptConfig](
		streamServer.Context(), applicationId, &datatypes.ApplicationPromptConfig{}, time.Minute*30, RetrieveApplicationPromptConfig(streamServer.Context(), applicationId),
	)
	if retrievalErr != nil {
		return retrievalErr
	}

	contentChannel := make(chan string)
	errorChannel := make(chan error, 1)

	go connectors.GetOpenAIConnectorClient().RequestStream(streamServer.Context(), applicationId, applicationPromptConfig, request.TemplateVariables, contentChannel, errorChannel)

	for {
		select {
		case content, isOpen := <-contentChannel:
			if !isOpen {
				return nil
			}

			if sendErr := streamServer.SendMsg(&gateway.StreamingPromptResponse{
				Content: content,
			}); sendErr != nil {
				return sendErr
			}

		case err := <-errorChannel:
			return err
		}
	}
}
