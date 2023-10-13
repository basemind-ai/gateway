package repositories

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/firebaseutils"
)

// GetOrCreateUserAccount - return an existing user account or create a new user account.
func GetOrCreateUserAccount(ctx context.Context, firebaseID string) (*db.UserAccount, error) {
	existingUser, queryErr := db.GetQueries().RetrieveUserAccount(ctx, firebaseID)

	if queryErr == nil {
		return &existingUser, nil
	}

	firebaseAuth := firebaseutils.GetFirebaseAuth(ctx)
	userRecord, userRecordErr := firebaseAuth.GetUser(ctx, firebaseID)
	if userRecordErr != nil {
		return nil, fmt.Errorf("failed to retrieve user record: %w", userRecordErr)
	}

	createdUser, createUserErr := db.GetQueries().CreateUserAccount(ctx, db.CreateUserAccountParams{
		DisplayName: userRecord.DisplayName,
		Email:       userRecord.Email,
		FirebaseID:  firebaseID,
		PhoneNumber: userRecord.PhoneNumber,
		PhotoUrl:    userRecord.PhotoURL,
	})
	if createUserErr != nil {
		return nil, fmt.Errorf("failed to create user account: %w", createUserErr)
	}
	return &createdUser, nil
}
