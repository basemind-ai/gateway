package repositories

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/firebaseutils"
)

// GetOrCreateUserAccount - return an existing user account or create a new user account.
func GetOrCreateUserAccount(ctx context.Context, firebaseID string) *models.UserAccount {
	existingUser, queryErr := db.GetQueries().RetrieveUserAccountByFirebaseID(ctx, firebaseID)
	if queryErr == nil {
		return &existingUser
	}

	userRecord := exc.MustResult(firebaseutils.GetFirebaseAuth(ctx).GetUser(ctx, firebaseID))

	// we created a user account in advance based on an invitation, but the user does not have all the firebase data set.
	preCreatedUser, retrievalErr := db.GetQueries().
		RetrieveUserAccountByEmail(ctx, userRecord.Email)

	if retrievalErr == nil {
		updatedUser := exc.MustResult(
			db.GetQueries().UpdateUserAccount(ctx, models.UpdateUserAccountParams{
				DisplayName: userRecord.DisplayName,
				Email:       userRecord.Email,
				FirebaseID:  userRecord.UID,
				ID:          preCreatedUser.ID,
				PhoneNumber: userRecord.PhoneNumber,
				PhotoUrl:    userRecord.PhotoURL,
			}),
		)

		return &updatedUser
	}

	// no pre-created user account, hence we create a new user account from the firebase user record.
	createdUser := exc.MustResult(
		db.GetQueries().CreateUserAccount(ctx, models.CreateUserAccountParams{
			DisplayName: userRecord.DisplayName,
			Email:       userRecord.Email,
			FirebaseID:  firebaseID,
			PhoneNumber: userRecord.PhoneNumber,
			PhotoUrl:    userRecord.PhotoURL,
		}),
	)
	return &createdUser
}

// DeleteUserAccount - hard deletes a user account and expunges it from firebase - conforming with GDPR.
func DeleteUserAccount(ctx context.Context, userAccount models.UserAccount) error {
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
