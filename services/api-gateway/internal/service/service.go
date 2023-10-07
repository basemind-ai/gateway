package service

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/gen/go/gateway/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/connectors"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/grpcutils"
	"github.com/basemind-ai/monorepo/shared/go/rediscache"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"time"
)

const (
	ErrorApplicationIDNotInContext = "application ID not found in context"
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
	applicationID, ok := ctx.Value(grpcutils.ApplicationIDContextKey).(string)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, ErrorApplicationIDNotInContext)
	}

	cacheKey := applicationID
	if request.PromptConfigId != nil {
		cacheKey = fmt.Sprintf("%s:%s", applicationID, *request.PromptConfigId)
	}

	requestConfigurationDTO, retrievalErr := rediscache.With[dto.RequestConfigurationDTO](
		ctx,
		cacheKey,
		&dto.RequestConfigurationDTO{},
		time.Minute*30,
		RetrieveRequestConfiguration(ctx, applicationID, request.PromptConfigId),
	)
	if retrievalErr != nil {
		return nil, status.Error(
			codes.NotFound,
			"the application does not have an active prompt configuration",
		)
	}

	if validationError := ValidateExpectedVariables(request.TemplateVariables, requestConfigurationDTO.PromptConfigData.ExpectedTemplateVariables); validationError != nil {
		// the validation error is already a grpc status error
		return nil, validationError
	}

	promptResult := connectors.GetProviderConnector(requestConfigurationDTO.PromptConfigData.ModelVendor).
		RequestPrompt(
			ctx,
			requestConfigurationDTO,
			request.TemplateVariables,
		)

	if promptResult.Error != nil {
		log.Error().Err(promptResult.Error).Msg("error in prompt request")
		return nil, status.Error(codes.Internal, "error communicating with AI provider")
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

func createStreamMessage(result dto.PromptResultDTO) *gateway.StreamingPromptResponse {
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
	return msg
}

func streamFromChannel(
	channel chan dto.PromptResultDTO,
	streamServer gateway.APIGatewayService_RequestStreamingPromptServer,
) error {
	for result := range channel {
		msg := createStreamMessage(result)

		if sendErr := streamServer.SendMsg(msg); sendErr != nil {
			log.Error().Err(sendErr).Msg("failed to send message")
			return status.Error(codes.Internal, "failed to send message")
		}

		if result.Error != nil {
			log.Error().Err(result.Error).Msg("error in prompt request")
			return status.Error(codes.Internal, "error communicating with AI provider")
		}

		if msg.FinishReason != nil {
			break
		}
	}

	return nil
}

func (Server) RequestStreamingPrompt(
	request *gateway.PromptRequest,
	streamServer gateway.APIGatewayService_RequestStreamingPromptServer,
) error {
	applicationID, ok := streamServer.Context().Value(grpcutils.ApplicationIDContextKey).(string)
	if !ok {
		return status.Errorf(codes.Unauthenticated, ErrorApplicationIDNotInContext)
	}

	cacheKey := applicationID
	if request.PromptConfigId != nil {
		cacheKey = fmt.Sprintf("%s:%s", applicationID, *request.PromptConfigId)
	}

	requestConfigurationDTO, retrievalErr := rediscache.With[dto.RequestConfigurationDTO](
		streamServer.Context(),
		cacheKey,
		&dto.RequestConfigurationDTO{},
		time.Minute*30,
		RetrieveRequestConfiguration(streamServer.Context(), applicationID, request.PromptConfigId),
	)
	if retrievalErr != nil {
		return status.Error(
			codes.NotFound,
			"the application does not have an active prompt configuration",
		)
	}

	if validationError := ValidateExpectedVariables(request.TemplateVariables, requestConfigurationDTO.PromptConfigData.ExpectedTemplateVariables); validationError != nil {
		// the validation error is already a grpc status error
		return validationError
	}

	channel := make(chan dto.PromptResultDTO)

	go connectors.GetProviderConnector(requestConfigurationDTO.PromptConfigData.ModelVendor).
		RequestStream(
			streamServer.Context(),
			requestConfigurationDTO,
			request.TemplateVariables,
			channel,
		)

	return streamFromChannel(channel, streamServer)
}
