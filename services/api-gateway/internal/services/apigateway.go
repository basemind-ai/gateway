package services

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/gen/go/gateway/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/connectors"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/grpcutils"
	"github.com/basemind-ai/monorepo/shared/go/rediscache"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"time"
)

const (
	ErrorApplicationIDNotInContext = "application ID not found in context"
	ErrorProjectIDNotInContext     = "project ID not found in context"
)

type APIGatewayServer struct {
	gateway.UnimplementedAPIGatewayServiceServer
}

func (APIGatewayServer) RequestPrompt(
	ctx context.Context,
	request *gateway.PromptRequest,
) (*gateway.PromptResponse, error) {
	projectID, ok := ctx.Value(grpcutils.ProjectIDContextKey).(pgtype.UUID)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, ErrorProjectIDNotInContext)
	}

	applicationID, ok := ctx.Value(grpcutils.ApplicationIDContextKey).(pgtype.UUID)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, ErrorApplicationIDNotInContext)
	}

	cacheKey := db.UUIDToString(&applicationID)
	if request.PromptConfigId != nil {
		cacheKey = fmt.Sprintf("%s:%s", db.UUIDToString(&applicationID), *request.PromptConfigId)
	}

	requestConfigurationDTO, retrievalErr := rediscache.With[dto.RequestConfigurationDTO](
		ctx,
		cacheKey,
		&dto.RequestConfigurationDTO{},
		time.Minute*30,
		RetrieveRequestConfiguration(ctx, applicationID, request.PromptConfigId),
	)
	if retrievalErr != nil {
		log.Error().Err(retrievalErr).Msg("failed to retrieve the request configuration from Redis")
		return nil, status.Error(
			codes.NotFound,
			retrievalErr.Error(),
		)
	}

	if validationError := ValidateExpectedVariables(request.TemplateVariables, requestConfigurationDTO.PromptConfigData.ExpectedTemplateVariables); validationError != nil {
		// the validation error is already a grpc status error
		return nil, validationError
	}

	providerKeyContext, providerKeyErr := CreateProviderAPIKeyContext(
		ctx,
		projectID,
		requestConfigurationDTO.PromptConfigData.ModelVendor,
	)
	if providerKeyErr != nil {
		log.Error().Err(providerKeyErr).Msg("error creating provider api key context")
		return nil, providerKeyErr
	}

	promptResult := connectors.GetProviderConnector(requestConfigurationDTO.PromptConfigData.ModelVendor).
		RequestPrompt(
			providerKeyContext,
			requestConfigurationDTO,
			request.TemplateVariables,
		)

	if promptResult.Error != nil {
		log.Error().Err(promptResult.Error).Msg("error in prompt request")
		return nil, status.Error(codes.Internal, "error communicating with AI provider")
	}

	return &gateway.PromptResponse{
		Content:        *promptResult.Content,
		RequestTokens:  uint32(promptResult.RequestRecord.RequestTokens),
		ResponseTokens: uint32(promptResult.RequestRecord.ResponseTokens),
	}, nil
}

func (APIGatewayServer) RequestStreamingPrompt(
	request *gateway.PromptRequest,
	streamServer gateway.APIGatewayService_RequestStreamingPromptServer,
) error {
	projectID, ok := streamServer.Context().Value(grpcutils.ProjectIDContextKey).(pgtype.UUID)
	if !ok {
		return status.Errorf(codes.Unauthenticated, ErrorProjectIDNotInContext)
	}

	applicationID, ok := streamServer.Context().Value(grpcutils.ApplicationIDContextKey).(pgtype.UUID)
	if !ok {
		return status.Errorf(codes.Unauthenticated, ErrorApplicationIDNotInContext)
	}

	cacheKey := db.UUIDToString(&applicationID)
	if request.PromptConfigId != nil {
		cacheKey = fmt.Sprintf("%s:%s", db.UUIDToString(&applicationID), *request.PromptConfigId)
	}

	requestConfigurationDTO, retrievalErr := rediscache.With[dto.RequestConfigurationDTO](
		streamServer.Context(),
		cacheKey,
		&dto.RequestConfigurationDTO{},
		time.Minute*30,
		RetrieveRequestConfiguration(streamServer.Context(), applicationID, request.PromptConfigId),
	)
	if retrievalErr != nil {
		log.Error().Err(retrievalErr).Msg("failed to retrieve the request configuration from Redis")
		return status.Error(
			codes.NotFound,
			retrievalErr.Error(),
		)
	}

	if validationError := ValidateExpectedVariables(request.TemplateVariables, requestConfigurationDTO.PromptConfigData.ExpectedTemplateVariables); validationError != nil {
		// the validation error is already a grpc status error
		return validationError
	}

	providerKeyContext, providerKeyErr := CreateProviderAPIKeyContext(
		streamServer.Context(),
		projectID,
		requestConfigurationDTO.PromptConfigData.ModelVendor,
	)
	if providerKeyErr != nil {
		log.Error().Err(providerKeyErr).Msg("error creating provider api key context")
		return providerKeyErr
	}

	channel := make(chan dto.PromptResultDTO)

	go connectors.GetProviderConnector(requestConfigurationDTO.PromptConfigData.ModelVendor).
		RequestStream(
			providerKeyContext,
			requestConfigurationDTO,
			request.TemplateVariables,
			channel,
		)

	return StreamFromChannel(
		streamServer.Context(),
		channel,
		streamServer,
		CreateAPIGatewayStreamMessage,
	)
}
