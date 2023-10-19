package apigateway

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
			ProjectID:           application.ProjectID,
			PromptConfigID:      *promptConfigDBID,
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
