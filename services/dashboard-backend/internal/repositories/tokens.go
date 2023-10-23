package repositories

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/jackc/pgx/v5/pgtype"
)

// GetOrCreateApplicationInternalTokenID - gets or creates an internal token for the given application.
func GetOrCreateApplicationInternalTokenID(
	ctx context.Context,
	applicationID string,
) (*pgtype.UUID, error) {
	applicationUUID, parseErr := db.StringToUUID(applicationID)
	if parseErr != nil {
		return nil, fmt.Errorf("failed to parse application id: %w", parseErr)
	}

	if tokenID, retrievalErr := db.GetQueries().RetrieveApplicationInternalTokenID(ctx, *applicationUUID); retrievalErr == nil {
		return &tokenID, nil
	}

	createdToken, createErr := db.GetQueries().CreateToken(ctx, db.CreateTokenParams{
		ApplicationID: *applicationUUID,
		Name:          "_internal token",
		IsInternal:    true,
	})

	if createErr != nil {
		return nil, fmt.Errorf("failed to create token: %w", createErr)
	}

	return &createdToken.ID, nil
}
