package service

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/jackc/pgx/v5/pgtype"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func RetrievePromptConfig(
	ctx context.Context,
	applicationId pgtype.UUID,
	promptConfigId *pgtype.UUID,
) (*datatypes.PromptConfigDTO, *pgtype.UUID, error) {
	if promptConfigId != nil {
		promptConfig, retrievalErr := db.GetQueries().FindPromptConfigById(ctx, *promptConfigId)
		if retrievalErr != nil {
			return nil, nil, fmt.Errorf("failed to retrieve prompt config - %w", retrievalErr)
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
		}, &promptConfig.ID, nil
	}

	promptConfig, retrieveDefaultErr := db.GetQueries().
		FindDefaultPromptConfigByApplicationId(ctx, applicationId)
	if retrieveDefaultErr != nil {
		return nil, nil, fmt.Errorf(
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
	}, &promptConfig.ID, nil
}

func RetrieveRequestConfiguration(
	ctx context.Context,
	applicationId string,
	promptConfigId *string,
) func() (*dto.RequestConfigurationDTO, error) {
	return func() (*dto.RequestConfigurationDTO, error) {
		appId, appIdErr := db.StringToUUID(applicationId)
		if appIdErr != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid application id: %v", appIdErr)
		}

		application, applicationQueryErr := db.GetQueries().FindApplicationById(ctx, *appId)
		if applicationQueryErr != nil {
			return nil, status.Errorf(
				codes.NotFound,
				"application does not exist: %v",
				applicationQueryErr,
			)
		}

		var promptConfigDBId *pgtype.UUID
		if promptConfigId != nil {
			uuid, uuidErr := db.StringToUUID(*promptConfigId)
			if uuidErr != nil {
				return nil, status.Errorf(
					codes.InvalidArgument, "invalid prompt-config id: %v", uuidErr,
				)
			}
			promptConfigDBId = uuid
		}

		promptConfig, promptConfigDBId, retrievalError := RetrievePromptConfig(
			ctx,
			*appId,
			promptConfigDBId,
		)
		if retrievalError != nil {
			return nil, status.Errorf(
				codes.NotFound,
				"the application does not have an active prompt configuration: %v",
				retrievalError,
			)
		}

		return &dto.RequestConfigurationDTO{
			ApplicationIDString: db.UUIDToString(&application.ID),
			ApplicationID:       application.ID,
			ProjectID:           application.ProjectID,
			PromptConfigID:      *promptConfigDBId,
			PromptConfigData:    *promptConfig,
		}, nil
	}
}

func ValidateExpectedVariables(
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
