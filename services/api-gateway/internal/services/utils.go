package services

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func retrievePromptConfig(
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

func RetrieveProviderModelPricing(
	ctx context.Context,
	modelType db.ModelType,
	modelVendor db.ModelVendor,
) (*datatypes.ProviderModelPricingDTO, error) {
	providerModelPricing, queryErr := db.GetQueries().
		RetrieveActiveProviderModelPricing(ctx, db.RetrieveActiveProviderModelPricingParams{
			ModelType:   modelType,
			ModelVendor: modelVendor,
		})
	if queryErr != nil {
		return nil, fmt.Errorf("failed to retrieve provider model pricing - %w", queryErr)
	}

	inputDecimalValue, inputDecimalErr := db.NumericToDecimal(providerModelPricing.InputTokenPrice)
	if inputDecimalErr != nil {
		return nil, fmt.Errorf(
			"failed to convert input token price to decimal - %w",
			inputDecimalErr,
		)
	}
	outputDecimalValue, outputDecimalErr := db.NumericToDecimal(
		providerModelPricing.OutputTokenPrice,
	)
	if outputDecimalErr != nil {
		return nil, fmt.Errorf(
			"failed to convert output token price to decimal - %w",
			outputDecimalErr,
		)
	}

	return &datatypes.ProviderModelPricingDTO{
		InputTokenPrice:  *inputDecimalValue,
		OutputTokenPrice: *outputDecimalValue,
		TokenUnitSize:    providerModelPricing.TokenUnitSize,
		ActiveFromDate:   providerModelPricing.ActiveFromDate.Time,
	}, nil
}

func retrieveRequestConfiguration(
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

		promptConfig, retrievalError := retrievePromptConfig(
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

		promptConfigUUID, _ := db.StringToUUID(promptConfig.ID)

		providerModelPricing, pricingErr := RetrieveProviderModelPricing(
			ctx, promptConfig.ModelType, promptConfig.ModelVendor,
		)

		if pricingErr != nil {
			return nil, status.Errorf(
				codes.NotFound,
				"the application does not have an active prompt configuration: %v",
				pricingErr,
			)
		}

		return &dto.RequestConfigurationDTO{
			ApplicationID:        application.ID,
			PromptConfigID:       *promptConfigUUID,
			PromptConfigData:     *promptConfig,
			ProviderModelPricing: *providerModelPricing,
		}, nil
	}
}

func validateExpectedVariables(
	templateVariables map[string]string,
	expectedVariables []string,
) error {
	missingVariables := make([]string, 0)

	if templateVariables != nil {
		for _, expectedVariable := range expectedVariables {
			if _, ok := templateVariables[expectedVariable]; !ok {
				missingVariables = append(missingVariables, expectedVariable)
			}
		}
	} else if len(expectedVariables) > 0 {
		missingVariables = append(missingVariables, expectedVariables...)
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

func streamFromChannel[T any](
	channel chan dto.PromptResultDTO,
	streamServer grpc.ServerStream,
	messageFactory func(dto.PromptResultDTO) (T, bool),
) error {
	for result := range channel {
		msg, isFinished := messageFactory(result)

		if sendErr := streamServer.SendMsg(msg); sendErr != nil {
			log.Error().Err(sendErr).Msg("failed to send message")
			return status.Error(codes.Internal, "failed to send message")
		}

		if result.Error != nil {
			log.Error().Err(result.Error).Msg("error in prompt request")
			return status.Error(codes.Internal, "error communicating with AI provider")
		}

		if isFinished {
			break
		}
	}

	return nil
}
