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

	promptConfig, retrieveDefaultErr := db.GetQueries().
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

func retrieveRequestConfiguration(
	ctx context.Context,
	applicationID string,
	promptConfigID *string,
) func() (*dto.RequestConfigurationDTO, error) {
	return func() (*dto.RequestConfigurationDTO, error) {
		appID, appIDErr := db.StringToUUID(applicationID)
		if appIDErr != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid application id: %v", appIDErr)
		}

		application, applicationQueryErr := db.GetQueries().RetrieveApplication(ctx, *appID)
		if applicationQueryErr != nil {
			return nil, status.Errorf(
				codes.NotFound,
				"application does not exist: %v",
				applicationQueryErr,
			)
		}

		promptConfig, retrievalError := retrievePromptConfig(
			ctx,
			*appID,
			promptConfigID,
		)
		if retrievalError != nil {
			return nil, status.Errorf(
				codes.NotFound,
				"the application does not have an active prompt configuration: %v",
				retrievalError,
			)
		}

		promptConfigDBID, _ := db.StringToUUID(promptConfig.ID)

		return &dto.RequestConfigurationDTO{
			ApplicationIDString: db.UUIDToString(&application.ID),
			ApplicationID:       application.ID,
			PromptConfigID:      promptConfigDBID,
			PromptConfigData:    *promptConfig,
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
