package repositories_test

import (
	"context"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestUserAccountRepository(t *testing.T) { //nolint: revive
	t.Run("GetUserAccountData", func(t *testing.T) {
		t.Run("should return a user account data", func(t *testing.T) {
			userAccount, _ := factories.CreateUserAccount(context.TODO())

			for i := 1; i <= 2; i++ {
				project, _ := factories.CreateProject(context.TODO())
				permission := db.AccessPermissionTypeADMIN
				isUserDefaultProject := true
				if i == 2 {
					permission = db.AccessPermissionTypeMEMBER
					isUserDefaultProject = false
				}

				_, _ = db.GetQueries().CreateUserProject(context.TODO(), db.CreateUserProjectParams{
					UserID:               userAccount.ID,
					ProjectID:            project.ID,
					IsUserDefaultProject: isUserDefaultProject,
					Permission:           permission,
				})

				for i := 1; i <= 3; i++ {
					_, _ = factories.CreateApplication(context.TODO(), project.ID)
				}
			}

			userAccountData, err := repositories.GetUserAccountData(
				context.TODO(),
				userAccount.FirebaseID,
			)
			assert.NoError(t, err)

			assert.Equal(t, db.UUIDToString(&userAccount.ID), userAccountData.ID)
			assert.Equal(t, userAccount.FirebaseID, userAccountData.FirebaseID)
			assert.Len(t, userAccountData.Projects, 2)

			project1 := userAccountData.Projects[0]
			assert.NotEmpty(t, project1.ID)
			assert.NotEmpty(t, project1.Name)
			assert.NotEmpty(t, project1.Description)
			assert.NotEmpty(t, project1.CreatedAt)
			assert.NotEmpty(t, project1.UpdatedAt)
			assert.True(t, project1.IsUserDefaultProject)
			assert.Equal(t, string(db.AccessPermissionTypeADMIN), project1.Permission)
			assert.Len(t, project1.Applications, 3)

			for _, application := range project1.Applications {
				assert.NotEmpty(t, application.ID)
				assert.NotEmpty(t, application.Name)
				assert.NotEmpty(t, application.Description)
				assert.NotEmpty(t, application.CreatedAt)
				assert.NotEmpty(t, application.UpdatedAt)
			}

			project2 := userAccountData.Projects[1]
			assert.NotEmpty(t, project2.ID)
			assert.NotEmpty(t, project2.Name)
			assert.NotEmpty(t, project2.Description)
			assert.NotEmpty(t, project2.CreatedAt)
			assert.NotEmpty(t, project2.UpdatedAt)
			assert.False(t, project2.IsUserDefaultProject)
			assert.Equal(t, string(db.AccessPermissionTypeMEMBER), project2.Permission)
			assert.Len(t, project2.Applications, 3)

			for _, application := range project2.Applications {
				assert.NotEmpty(t, application.ID)
				assert.NotEmpty(t, application.Name)
				assert.NotEmpty(t, application.Description)
				assert.NotEmpty(t, application.CreatedAt)
				assert.NotEmpty(t, application.UpdatedAt)
			}
		})
		t.Run(
			"should return an error if the user account data cannot be found",
			func(t *testing.T) {
				_, err := repositories.GetUserAccountData(
					context.TODO(),
					"non-existent-firebase-id",
				)
				assert.Error(t, err)
			},
		)
	})

	t.Run("CreateDefaultUserAccountData", func(t *testing.T) {
		t.Run("should create a default user account data", func(t *testing.T) {
			userAccountData, err := repositories.CreateDefaultUserAccountData(
				context.TODO(),
				"firebase-id",
			)
			assert.NoError(t, err)

			assert.NotEmpty(t, userAccountData.ID)
			assert.Equal(t, "firebase-id", userAccountData.FirebaseID)
			assert.Len(t, userAccountData.Projects, 1)

			project := userAccountData.Projects[0]
			assert.NotEmpty(t, project.ID)
			assert.NotEmpty(t, project.Name)
			assert.NotEmpty(t, project.Description)
			assert.NotEmpty(t, project.CreatedAt)
			assert.NotEmpty(t, project.UpdatedAt)
			assert.True(t, project.IsUserDefaultProject)
			assert.Equal(t, string(db.AccessPermissionTypeADMIN), project.Permission)
			assert.Len(t, project.Applications, 0)
		})
	})

	t.Run("GetOrCreateUserAccount", func(t *testing.T) {
		t.Run("should return a user account data if it exists", func(t *testing.T) {
			userAccount, _ := factories.CreateUserAccount(context.TODO())
			project, _ := factories.CreateProject(context.TODO())
			_, _ = db.GetQueries().CreateUserProject(context.TODO(), db.CreateUserProjectParams{
				UserID:               userAccount.ID,
				ProjectID:            project.ID,
				IsUserDefaultProject: true,
				Permission:           db.AccessPermissionTypeADMIN,
			})
			_, _ = factories.CreateApplication(context.TODO(), project.ID)

			userAccountData, err := repositories.GetOrCreateUserAccount(
				context.TODO(),
				userAccount.FirebaseID,
			)
			assert.NoError(t, err)

			assert.Equal(t, db.UUIDToString(&userAccount.ID), userAccountData.ID)
			assert.Equal(t, userAccount.FirebaseID, userAccountData.FirebaseID)
			assert.Len(t, userAccountData.Projects, 1)
			assert.Len(t, userAccountData.Projects[0].Applications, 1)
		})
		t.Run("should create a user account data if it does not exist", func(t *testing.T) {
			userData, err := repositories.GetOrCreateUserAccount(context.TODO(), "firebase-id")
			assert.NoError(t, err)

			assert.NotEmpty(t, userData.ID)
			assert.Equal(t, "firebase-id", userData.FirebaseID)
			assert.Len(t, userData.Projects, 1)
			assert.NotEmpty(t, userData.Projects[0].ID)
			assert.Equal(t, string(db.AccessPermissionTypeADMIN), userData.Projects[0].Permission)
		})
	})
}
