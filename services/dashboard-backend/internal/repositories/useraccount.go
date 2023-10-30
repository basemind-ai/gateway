package repositories

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/firebaseutils"
)

// GetOrCreateUserAccount - return an existing user account or create a new user account.
func GetOrCreateUserAccount(ctx context.Context, firebaseID string) (*db.UserAccount, error) {
	existingUser, queryErr := db.GetQueries().RetrieveUserAccountByFirebaseID(ctx, firebaseID)

	if queryErr == nil {
		return &existingUser, nil
	}

	firebaseAuth := firebaseutils.GetFirebaseAuth(ctx)
	userRecord, userRecordErr := firebaseAuth.GetUser(ctx, firebaseID)
	if userRecordErr != nil {
		return nil, fmt.Errorf("failed to retrieve user record: %w", userRecordErr)
	}

	createdUser := exc.MustResult(db.GetQueries().CreateUserAccount(ctx, db.CreateUserAccountParams{
		DisplayName: userRecord.DisplayName,
		Email:       userRecord.Email,
		FirebaseID:  firebaseID,
		PhoneNumber: userRecord.PhoneNumber,
		PhotoUrl:    userRecord.PhotoURL,
	}))

	return &createdUser, nil
}

// DeleteUserAccount - hard deletes a user account and expunges it from firebase - conforming with GDPR.
func DeleteUserAccount(ctx context.Context, userAccount db.UserAccount) error {
	if exc.MustResult(db.GetQueries().CheckUserIsSoleAdminInAnyProject(ctx, userAccount.ID)) {
		return fmt.Errorf("user is the sole admin in a project")
	}

	exc.Must(db.GetQueries().DeleteUserAccount(ctx, userAccount.ID))

	go func() {
		exc.LogIfErr(
			firebaseutils.GetFirebaseAuth(ctx).DeleteUser(ctx, userAccount.FirebaseID),
			"failed to delete firebase user",
		)
	}()

	return nil
}
