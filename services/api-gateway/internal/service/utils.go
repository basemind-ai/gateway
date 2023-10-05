package service

import (
	"context"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/jackc/pgx/v5/pgtype"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func RetrievePromptConfig(
	ctx context.Context,
	applicationId pgtype.UUID,
	promptConfigId *string,
) (*db.PromptConfig, error) {
	if promptConfigId != nil {
		dbId := pgtype.UUID{}
		if dbIdErr := dbId.Scan(*promptConfigId); dbIdErr != nil {
			return nil, status.Errorf(
				codes.InvalidArgument,
				"invalid prompt-config id: %v",
				dbIdErr,
			)
		}

		promptConfig, err := db.GetQueries().FindPromptConfigById(ctx, dbId)
		return &promptConfig, err
	}

	promptConfig, err := db.GetQueries().FindDefaultPromptConfigByApplicationId(ctx, applicationId)
	return &promptConfig, err
}

func RetrieveRequestConfiguration(
	ctx context.Context,
	applicationId string,
	promptConfigId *string,
) func() (*datatypes.RequestConfiguration, error) {
	return func() (*datatypes.RequestConfiguration, error) {
		appId := pgtype.UUID{}
		if appIdErr := appId.Scan(applicationId); appIdErr != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid application id: %v", appIdErr)
		}

		application, applicationQueryErr := db.GetQueries().FindApplicationById(ctx, appId)
		if applicationQueryErr != nil {
			return nil, status.Errorf(
				codes.NotFound,
				"application does not exist: %v",
				applicationQueryErr,
			)
		}

		promptConfig, retrievalError := RetrievePromptConfig(ctx, appId, promptConfigId)
		if retrievalError != nil {
			return nil, status.Errorf(
				codes.NotFound,
				"the application does not have an active prompt configuration: %v",
				retrievalError,
			)
		}

		return &datatypes.RequestConfiguration{
			ApplicationID:    applicationId,
			ApplicationData:  application,
			PromptConfigData: *promptConfig,
		}, nil
	}
}
