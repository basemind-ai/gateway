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

	promptResult := connectors.
		GetProviderConnector(applicationConfiguration.PromptConfigData.ModelVendor).
		RequestPrompt(
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

	go connectors.
		GetProviderConnector(applicationConfiguration.PromptConfigData.ModelVendor).
		RequestStream(
			streamServer.Context(),
			applicationId,
			applicationConfiguration,
			request.TemplateVariables,
			channel,
		)

	for result := range channel {
		msg := &gateway.StreamingPromptResponse{}
		if result.Error != nil {
			reason := "error"
			msg.FinishReason = &reason
		}
		if result.RequestRecord != nil {
			if msg.FinishReason == nil {
				reason := "done"
				msg.FinishReason = &reason
			}
			requestTokens := uint32(result.RequestRecord.RequestTokens)
			responseTokens := uint32(result.RequestRecord.ResponseTokens)
			streamDuration := uint32(
				result.RequestRecord.FinishTime.Time.
					Sub(result.RequestRecord.StartTime.Time).
					Seconds(),
			)
			msg.RequestTokens = &requestTokens
			msg.ResponseTokens = &responseTokens
			msg.StreamDuration = &streamDuration
		}

		if result.Content != nil {
			msg.Content = *result.Content
		}

		if sendErr := streamServer.SendMsg(msg); sendErr != nil {
			log.Error().Err(sendErr).Msg("failed to send message")
			return sendErr
		}

		if result.Error != nil {
			log.Error().Err(result.Error).Msg("error in prompt request")
			return result.Error
		}

		if msg.FinishReason != nil {
			break
		}
	}

	return nil
}
