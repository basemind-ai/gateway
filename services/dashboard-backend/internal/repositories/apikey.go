package repositories

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/jackc/pgx/v5/pgtype"
)

// GetOrCreateApplicationInternalAPIKeyID - gets or creates an internal token for the given application.
func GetOrCreateApplicationInternalAPIKeyID(
	ctx context.Context,
	applicationID string,
) (*pgtype.UUID, error) {
	applicationUUID, parseErr := db.StringToUUID(applicationID)
	if parseErr != nil {
		return nil, fmt.Errorf("failed to parse application id: %w", parseErr)
	}

	if apiKeyID, retrievalErr := db.GetQueries().RetrieveApplicationInternalAPIKeyID(ctx, *applicationUUID); retrievalErr == nil {
		return &apiKeyID, nil
	}

	createdToken, createErr := db.GetQueries().CreateAPIKey(ctx, models.CreateAPIKeyParams{
		ApplicationID: *applicationUUID,
		Name:          "_internal token",
		IsInternal:    true,
	})

	if createErr != nil {
		return nil, fmt.Errorf("failed to create token: %w", createErr)
	}

	return &createdToken.ID, nil
}
