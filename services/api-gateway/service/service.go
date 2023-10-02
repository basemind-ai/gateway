package service

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/gen/go/gateway/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/connectors"
	"github.com/basemind-ai/monorepo/services/api-gateway/constants"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/rediscache"
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

func (Server) RequestPrompt(
	ctx context.Context,
	request *gateway.PromptRequest,
) (*gateway.PromptResponse, error) {
	applicationId, ok := ctx.Value(constants.ApplicationIDContextKey).(string)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, ErrorApplicationIdNotInContext)
	}
	log.Debug().Str("applicationId", applicationId).Msg("entered prompt request")

	cacheKey := applicationId
	if request.PromptConfigId != nil {
		cacheKey = fmt.Sprintf("%s:%s", applicationId, *request.PromptConfigId)
	}

	applicationConfiguration, retrievalErr := rediscache.With[datatypes.RequestConfiguration](
		ctx,
		cacheKey,
		&datatypes.RequestConfiguration{},
		time.Minute*30,
		RetrieveRequestConfiguration(ctx, applicationId, request.PromptConfigId),
	)
	if retrievalErr != nil {
		return nil, retrievalErr
	}
	log.Debug().Msg("retrieved application")
	client := connectors.GetProviderConnector(applicationConfiguration.PromptConfigData.ModelVendor)
	promptResult := client.RequestPrompt(
		ctx,
		applicationId,
		applicationConfiguration,
		request.TemplateVariables,
	)
	if promptResult.Error != nil {
		log.Error().Err(promptResult.Error).Msg("error in prompt request")
		return nil, promptResult.Error
	}
	if promptResult.Content == nil {
		log.Error().Msg("prompt response content is nil")
		return nil, status.Errorf(codes.Internal, "prompt response content is nil")
	}

	log.Debug().Msg("returning response from AI provider")

	return &gateway.PromptResponse{
		Content:        *promptResult.Content,
		RequestTokens:  uint32(promptResult.RequestRecord.RequestTokens),
		ResponseTokens: uint32(promptResult.RequestRecord.ResponseTokens),
	}, nil
}

func (Server) RequestStreamingPrompt(
	request *gateway.PromptRequest,
	streamServer gateway.APIGatewayService_RequestStreamingPromptServer,
) error {
	applicationId, ok := streamServer.Context().Value(constants.ApplicationIDContextKey).(string)
	if !ok {
		return status.Errorf(codes.Unauthenticated, ErrorApplicationIdNotInContext)
	}

	cacheKey := applicationId
	if request.PromptConfigId != nil {
		cacheKey = fmt.Sprintf("%s:%s", applicationId, *request.PromptConfigId)
	}
	applicationConfiguration, retrievalErr := rediscache.With[datatypes.RequestConfiguration](
		streamServer.Context(),
		cacheKey,
		&datatypes.RequestConfiguration{},
		time.Minute*30,
		RetrieveRequestConfiguration(streamServer.Context(), applicationId, request.PromptConfigId),
	)
	if retrievalErr != nil {
		return retrievalErr
	}

	channel := make(chan datatypes.PromptResult)

	go connectors.GetProviderConnector(applicationConfiguration.PromptConfigData.ModelVendor).
		RequestStream(
			streamServer.Context(),
			applicationId,
			applicationConfiguration,
			request.TemplateVariables,
			channel,
		)

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
