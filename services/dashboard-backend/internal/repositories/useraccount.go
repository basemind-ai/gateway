package repositories

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/db"
)

// GetOrCreateUserAccount - return an existing user account or create a new user account.
func GetOrCreateUserAccount(ctx context.Context, firebaseID string) (*db.UserAccount, error) {
	existingUser, queryErr := db.GetQueries().RetrieveUserAccount(ctx, firebaseID)

	if queryErr == nil {
		return &existingUser, nil
	}

	createdUser, createUserErr := db.GetQueries().CreateUserAccount(ctx, firebaseID)
	if createUserErr != nil {
		return nil, fmt.Errorf("failed to create user account: %w", createUserErr)
	}
	return &createdUser, nil
}
