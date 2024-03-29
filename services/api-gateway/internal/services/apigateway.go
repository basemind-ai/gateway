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
	ErrorInsufficientCredits       = "insufficient credits"
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

	if insufficientCreditsErr, retrievalErr := rediscache.With[status.Status](
		ctx,
		db.UUIDToString(&projectID),
		&status.Status{},
		time.Minute*5,
		CheckProjectCredits(ctx, projectID),
	); retrievalErr != nil {
		return nil, retrievalErr
	} else if insufficientCreditsErr.Code() == codes.ResourceExhausted {
		return nil, insufficientCreditsErr.Err()
	}

	if validationError := ValidateExpectedVariables(request.TemplateVariables, requestConfigurationDTO.PromptConfigData.ExpectedTemplateVariables); validationError != nil {
		// the validation error is already a grpc status error
		return nil, validationError
	}

	providerKeyContext := CreateProviderAPIKeyContext(
		ctx,
		projectID,
		requestConfigurationDTO.PromptConfigData.ModelVendor,
	)

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

	go DeductCredit(ctx, promptResult.RequestRecord)

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

	if insufficientCreditsErr, retrievalErr := rediscache.With[status.Status](
		streamServer.Context(),
		db.UUIDToString(&projectID),
		&status.Status{},
		time.Minute*5,
		CheckProjectCredits(streamServer.Context(), projectID),
	); retrievalErr != nil {
		return retrievalErr
	} else if insufficientCreditsErr.Code() == codes.ResourceExhausted {
		return insufficientCreditsErr.Err()
	}

	if validationError := ValidateExpectedVariables(request.TemplateVariables, requestConfigurationDTO.PromptConfigData.ExpectedTemplateVariables); validationError != nil {
		// the validation error is already a grpc status error
		return validationError
	}

	providerKeyContext := CreateProviderAPIKeyContext(
		streamServer.Context(),
		projectID,
		requestConfigurationDTO.PromptConfigData.ModelVendor,
	)

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
