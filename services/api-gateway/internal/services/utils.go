package services

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/db/models"

	"github.com/basemind-ai/monorepo/gen/go/gateway/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// RetrievePromptConfig retrieves the prompt config - either using the provided ID, or the application default.
func RetrievePromptConfig(
	ctx context.Context,
	applicationID pgtype.UUID,
	promptConfigID *string,
) (*datatypes.PromptConfigDTO, error) {
	if promptConfigID != nil {
		uuid, uuidErr := db.StringToUUID(*promptConfigID)
		if uuidErr != nil {
			return nil, status.Errorf(
				codes.InvalidArgument, "invalid prompt-config id: %v", uuidErr,
			)
		}

		promptConfig, retrievalErr := db.GetQueries().RetrievePromptConfig(ctx, *uuid)
		if retrievalErr != nil {
			return nil, fmt.Errorf("failed to retrieve prompt config - %w", retrievalErr)
		}

		return &datatypes.PromptConfigDTO{
			ID:                        db.UUIDToString(&promptConfig.ID),
			Name:                      promptConfig.Name,
			ModelParameters:           promptConfig.ModelParameters,
			ModelType:                 promptConfig.ModelType,
			ModelVendor:               promptConfig.ModelVendor,
			ProviderPromptMessages:    promptConfig.ProviderPromptMessages,
			ExpectedTemplateVariables: promptConfig.ExpectedTemplateVariables,
			IsDefault:                 promptConfig.IsDefault,
			CreatedAt:                 promptConfig.CreatedAt.Time,
			UpdatedAt:                 promptConfig.UpdatedAt.Time,
		}, nil
	}

	promptConfig, retrieveDefaultErr := db.
		GetQueries().
		RetrieveDefaultPromptConfig(ctx, applicationID)

	if retrieveDefaultErr != nil {
		return nil, fmt.Errorf(
			"failed to retrieve default prompt config - %w",
			retrieveDefaultErr,
		)
	}
	return &datatypes.PromptConfigDTO{
		ID:                        db.UUIDToString(&promptConfig.ID),
		Name:                      promptConfig.Name,
		ModelParameters:           promptConfig.ModelParameters,
		ModelType:                 promptConfig.ModelType,
		ModelVendor:               promptConfig.ModelVendor,
		ProviderPromptMessages:    promptConfig.ProviderPromptMessages,
		ExpectedTemplateVariables: promptConfig.ExpectedTemplateVariables,
		IsDefault:                 promptConfig.IsDefault,
		CreatedAt:                 promptConfig.CreatedAt.Time,
		UpdatedAt:                 promptConfig.UpdatedAt.Time,
	}, nil
}

// RetrieveProviderModelPricing retrieves the pricing model for the given model type and vendor.
func RetrieveProviderModelPricing(
	ctx context.Context,
	modelType models.ModelType,
	modelVendor models.ModelVendor,
) datatypes.ProviderModelPricingDTO {
	providerModelPricing := exc.MustResult(db.GetQueries().
		RetrieveActiveProviderModelPricing(ctx, models.RetrieveActiveProviderModelPricingParams{
			ModelType:   modelType,
			ModelVendor: modelVendor,
		}))

	inputDecimalValue := exc.MustResult(db.NumericToDecimal(providerModelPricing.InputTokenPrice))
	outputDecimalValue := exc.MustResult(db.NumericToDecimal(providerModelPricing.OutputTokenPrice))

	return datatypes.ProviderModelPricingDTO{
		InputTokenPrice:  *inputDecimalValue,
		OutputTokenPrice: *outputDecimalValue,
		TokenUnitSize:    providerModelPricing.TokenUnitSize,
		ActiveFromDate:   providerModelPricing.ActiveFromDate.Time,
	}
}

// RetrieveRequestConfiguration retrieves the request configuration for the given application and prompt config ID.
func RetrieveRequestConfiguration(
	ctx context.Context,
	applicationID pgtype.UUID,
	promptConfigID *string,
) func() (*dto.RequestConfigurationDTO, error) {
	return func() (*dto.RequestConfigurationDTO, error) {
		application, applicationQueryErr := db.GetQueries().RetrieveApplication(ctx, applicationID)
		if applicationQueryErr != nil {
			return nil, status.Errorf(
				codes.NotFound,
				"application does not exist: %v",
				applicationQueryErr,
			)
		}

		promptConfig, retrievalError := RetrievePromptConfig(
			ctx,
			applicationID,
			promptConfigID,
		)
		if retrievalError != nil {
			return nil, status.Errorf(
				codes.NotFound,
				"the application does not have an active prompt configuration: %v",
				retrievalError,
			)
		}

		promptConfigUUID := exc.MustResult(db.StringToUUID(promptConfig.ID))

		return &dto.RequestConfigurationDTO{
			ApplicationID:    application.ID,
			PromptConfigID:   *promptConfigUUID,
			PromptConfigData: *promptConfig,
			ProviderModelPricing: RetrieveProviderModelPricing(
				ctx, promptConfig.ModelType, promptConfig.ModelVendor,
			),
		}, nil
	}
}

// ValidateExpectedVariables validates that the expected template variables are present in the request.
func ValidateExpectedVariables(
	templateVariables map[string]string,
	expectedVariables []string,
) error {
	var missingVariables []string

	for _, expectedVariable := range expectedVariables {
		if _, ok := templateVariables[expectedVariable]; !ok {
			missingVariables = append(missingVariables, expectedVariable)
		}
	}

	if len(missingVariables) > 0 {
		return status.Errorf(
			codes.InvalidArgument,
			"missing template variables: %v",
			missingVariables,
		)
	}

	return nil
}

// StreamFromChannel streams the prompt results from the channel to the stream server.
func StreamFromChannel[T any](
	ctx context.Context,
	channel chan dto.PromptResultDTO,
	streamServer grpc.ServerStream,
	messageFactory func(dto.PromptResultDTO) (T, bool),
) error {
	for {
		select {
		case result, isOpen := <-channel:
			msg, isFinished := messageFactory(result)

			if sendErr := streamServer.SendMsg(msg); sendErr != nil {
				log.Error().Err(sendErr).Msg("failed to send message")
				return status.Error(codes.Internal, "failed to send message")
			}

			if result.Error != nil {
				log.Error().Err(result.Error).Msg("error in prompt request")
				return status.Error(codes.Internal, "error communicating with AI provider")
			}

			if isFinished || !isOpen {
				return nil
			}
		case <-ctx.Done():
			return ctx.Err()
		}
	}
}

// CreateAPIGatewayStreamMessage creates a stream message for the API Gateway.
func CreateAPIGatewayStreamMessage(
	result dto.PromptResultDTO,
) (*gateway.StreamingPromptResponse, bool) {
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
				Milliseconds(),
		)
		msg.RequestTokens = &requestTokens
		msg.ResponseTokens = &responseTokens
		msg.StreamDuration = &streamDuration
	}

	if result.Content != nil {
		contentCopy := *result.Content
		msg.Content = contentCopy
	}
	return msg, msg.FinishReason != nil
}
