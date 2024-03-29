package repositories_test

import (
	"context"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/shopspring/decimal"
	"testing"
	"time"

	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/stretchr/testify/assert"
)

func TestProjectRepository(t *testing.T) {
	t.Run("CreateProject", func(t *testing.T) {
		t.Run("creates a project and sets the creating user as ADMIN", func(t *testing.T) {
			userAccount, _ := factories.CreateUserAccount(context.TODO())
			projectDto, err := repositories.CreateProject(
				context.TODO(),
				userAccount,
				"Test Project",
				"Test Description",
			)

			assert.NoError(t, err)
			assert.Equal(t, "Test Project", projectDto.Name)
			assert.Equal(t, "Test Description", projectDto.Description)
			assert.Equal(t, "ADMIN", projectDto.Permission)
			assert.NotEmpty(t, projectDto.ID)
			assert.NotEmpty(t, projectDto.CreatedAt)
			assert.NotEmpty(t, projectDto.UpdatedAt)
			assert.Equal(t, "1", projectDto.Credits.String())
			assert.Nil(t, projectDto.Applications)

			uuidID, err := db.StringToUUID(projectDto.ID)
			assert.NoError(t, err)

			retrievedProject, err := db.
				GetQueries().
				RetrieveProjectForUser(context.TODO(), models.RetrieveProjectForUserParams{
					ID:         *uuidID,
					FirebaseID: userAccount.FirebaseID,
				})
			assert.NoError(t, err)

			assert.Equal(t, projectDto.ID, db.UUIDToString(&retrievedProject.ID))
			assert.Equal(t, projectDto.Name, retrievedProject.Name)
			assert.Equal(t, projectDto.Description, retrievedProject.Description)
		})
	})

	t.Run("DeleteProject", func(t *testing.T) {
		t.Run("deletes a project and all of its applications", func(t *testing.T) {
			project, _ := factories.CreateProject(context.TODO())
			userAccount, _ := factories.CreateUserAccount(context.TODO())
			_, _ = db.GetQueries().CreateUserProject(context.TODO(), models.CreateUserProjectParams{
				ProjectID:  project.ID,
				UserID:     userAccount.ID,
				Permission: models.AccessPermissionTypeADMIN,
			})
			application, _ := factories.CreateApplication(context.TODO(), project.ID)

			retrievedProject, _ := db.
				GetQueries().
				RetrieveProjectForUser(context.TODO(), models.RetrieveProjectForUserParams{
					ID:         project.ID,
					FirebaseID: userAccount.FirebaseID,
				})
			assert.Equal(t, project.ID, retrievedProject.ID)

			retrievedApplication, err := db.
				GetQueries().
				RetrieveApplication(context.TODO(), application.ID)
			assert.NoError(t, err)
			assert.Equal(t, application.ID, retrievedApplication.ID)

			err = repositories.DeleteProject(context.TODO(), project.ID)
			assert.NoError(t, err)

			_, err = db.GetQueries().
				RetrieveProjectForUser(context.TODO(), models.RetrieveProjectForUserParams{
					ID:         project.ID,
					FirebaseID: userAccount.FirebaseID,
				})
			assert.Error(t, err)

			_, err = db.GetQueries().RetrieveApplication(context.TODO(), application.ID)
			assert.Error(t, err)
		})

		t.Run("deletes a project that has no applications", func(t *testing.T) {
			project, _ := factories.CreateProject(context.TODO())
			userAccount, _ := factories.CreateUserAccount(context.TODO())
			_, _ = db.GetQueries().CreateUserProject(context.TODO(), models.CreateUserProjectParams{
				ProjectID:  project.ID,
				UserID:     userAccount.ID,
				Permission: models.AccessPermissionTypeADMIN,
			})
			retrievedProject, err := db.
				GetQueries().
				RetrieveProjectForUser(context.TODO(), models.RetrieveProjectForUserParams{
					ID:         project.ID,
					FirebaseID: userAccount.FirebaseID,
				})
			assert.NoError(t, err)
			assert.Equal(t, project.ID, retrievedProject.ID)

			err = repositories.DeleteProject(context.TODO(), project.ID)
			assert.NoError(t, err)

			_, err = db.GetQueries().
				RetrieveProjectForUser(context.TODO(), models.RetrieveProjectForUserParams{
					ID:         project.ID,
					FirebaseID: userAccount.FirebaseID,
				})
			assert.Error(t, err)
		})
	})

	t.Run("Project Analytics", func(t *testing.T) {
		project, _ := factories.CreateProject(context.TODO())
		application, _ := factories.CreateApplication(context.TODO(), project.ID)
		promptConfig, _ := factories.CreateOpenAIPromptConfig(context.TODO(), application.ID)
		_, _ = factories.CreatePromptRequestRecord(context.TODO(), promptConfig.ID)

		fromDate := time.Now().AddDate(0, 0, -1)
		toDate := fromDate.AddDate(0, 0, 2)

		t.Run("GetProjectAPIRequestByDateRange", func(t *testing.T) {
			t.Run("get total api count by date range", func(t *testing.T) {
				totalRequests := repositories.GetProjectAPIRequestByDateRange(
					context.TODO(),
					project.ID,
					time.Now().AddDate(0, 0, -1),
					time.Now().AddDate(0, 0, 1),
				)
				assert.Equal(t, int64(1), totalRequests)
			})
		})

		t.Run("GetProjectAnalyticsByDateRange", func(t *testing.T) {
			t.Run("get token usage for each model types by date range", func(t *testing.T) {
				projectAnalytics := repositories.GetProjectAnalyticsByDateRange(
					context.TODO(),
					project.ID,
					fromDate,
					toDate,
				)
				assert.Equal(t, int64(1), projectAnalytics.TotalAPICalls)
				assert.Equal(
					t,
					decimal.RequireFromString("0.0000465").String(),
					projectAnalytics.TokenCost.String(),
				)
			})
		})
	})
}
