package repositories_test

import (
	"context"
	"testing"
	"time"

	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/tokenutils"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
)

func TestProjectRepository(t *testing.T) {
	t.Run("CreateProject", func(t *testing.T) {
		t.Run("creates a project and sets the creating user as ADMIN", func(t *testing.T) {
			userAccount, _ := factories.CreateUserAccount(context.TODO())
			projectDto, err := repositories.CreateProject(
				context.TODO(),
				userAccount.FirebaseID,
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
			assert.Nil(t, projectDto.Applications)

			uuidID, err := db.StringToUUID(projectDto.ID)
			assert.NoError(t, err)

			retrievedProject, err := db.
				GetQueries().
				RetrieveProject(context.TODO(), db.RetrieveProjectParams{
					ID:         *uuidID,
					FirebaseID: userAccount.FirebaseID,
				})
			assert.NoError(t, err)

			assert.Equal(t, projectDto.ID, db.UUIDToString(&retrievedProject.ID))
			assert.Equal(t, projectDto.Name, retrievedProject.Name)
			assert.Equal(t, projectDto.Description, retrievedProject.Description)
		})
		t.Run("returns an error when user does not exist", func(t *testing.T) {
			projectDto, err := repositories.CreateProject(
				context.TODO(),
				"1234",
				"Test Project",
				"Test Description",
			)
			assert.Error(t, err)
			assert.Nil(t, projectDto)
		})
	})

	t.Run("DeleteProject", func(t *testing.T) {
		t.Run("deletes a project and all of its applications", func(t *testing.T) {
			project, _ := factories.CreateProject(context.TODO())
			userAccount, _ := factories.CreateUserAccount(context.TODO())
			_, _ = db.GetQueries().CreateUserProject(context.TODO(), db.CreateUserProjectParams{
				ProjectID:  project.ID,
				UserID:     userAccount.ID,
				Permission: db.AccessPermissionTypeADMIN,
			})
			application, _ := factories.CreateApplication(context.TODO(), project.ID)

			retrievedProject, _ := db.
				GetQueries().
				RetrieveProject(context.TODO(), db.RetrieveProjectParams{
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

			_, err = db.GetQueries().RetrieveProject(context.TODO(), db.RetrieveProjectParams{
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
			_, _ = db.GetQueries().CreateUserProject(context.TODO(), db.CreateUserProjectParams{
				ProjectID:  project.ID,
				UserID:     userAccount.ID,
				Permission: db.AccessPermissionTypeADMIN,
			})
			retrievedProject, err := db.
				GetQueries().
				RetrieveProject(context.TODO(), db.RetrieveProjectParams{
					ID:         project.ID,
					FirebaseID: userAccount.FirebaseID,
				})
			assert.NoError(t, err)
			assert.Equal(t, project.ID, retrievedProject.ID)

			err = repositories.DeleteProject(context.TODO(), project.ID)
			assert.NoError(t, err)

			_, err = db.GetQueries().RetrieveProject(context.TODO(), db.RetrieveProjectParams{
				ID:         project.ID,
				FirebaseID: userAccount.FirebaseID,
			})
			assert.Error(t, err)
		})
	})

	t.Run("Project Analytics", func(t *testing.T) {
		project, _ := factories.CreateProject(context.TODO())
		application, _ := factories.CreateApplication(context.TODO(), project.ID)
		factories.CreatePromptRequestRecord(context.TODO(), application.ID)

		fromDate := time.Now().AddDate(0, 0, -1)
		toDate := fromDate.AddDate(0, 0, 2)
		totalTokensUsed := int64(20)

		t.Run("GetTotalAPICountByDateRange", func(t *testing.T) {
			t.Run("get total api count by date range", func(t *testing.T) {
				totalRequests, dbErr := repositories.GetTotalAPICountByDateRange(
					context.TODO(),
					project.ID,
					time.Now().AddDate(0, 0, -1),
					time.Now().AddDate(0, 0, 1),
				)
				assert.NoError(t, dbErr)
				assert.Equal(t, int64(1), totalRequests)
			})
			t.Run("fails to get total api count for invalid project id", func(t *testing.T) {
				invalidProjectId := pgtype.UUID{Bytes: [16]byte{}, Valid: false}
				totalRequests, _ := repositories.GetTotalAPICountByDateRange(
					context.TODO(),
					invalidProjectId,
					time.Now().AddDate(0, 0, -1),
					time.Now().AddDate(0, 0, 1),
				)
				assert.Equal(t, int64(0), totalRequests)
			})
		})

		t.Run("GetTokenConsumedByProjectByDateRange", func(t *testing.T) {
			t.Run("get total api count by date range", func(t *testing.T) {
				projectTokenCntMap, dbErr := repositories.GetTokenConsumedByProjectByDateRange(
					context.TODO(),
					project.ID,
					time.Now().AddDate(0, 0, -1),
					time.Now().AddDate(0, 0, 1),
				)
				assert.NoError(t, dbErr)
				assert.Equal(t, int64(20), projectTokenCntMap[db.ModelTypeGpt35Turbo])
			})
			t.Run("fails to get total api count for invalid project id", func(t *testing.T) {
				invalidProjectId := pgtype.UUID{Bytes: [16]byte{}, Valid: false}
				projectTokenCntMap, _ := repositories.GetTokenConsumedByProjectByDateRange(
					context.TODO(),
					invalidProjectId,
					time.Now().AddDate(0, 0, -1),
					time.Now().AddDate(0, 0, 1),
				)
				assert.Equal(t, int64(0), projectTokenCntMap[db.ModelTypeGpt35Turbo])
			})
		})

		t.Run("GetProjectAnalyticsByDateRange", func(t *testing.T) {
			t.Run("get token usage for each model types by date range", func(t *testing.T) {
				projectAnalytics, dbErr := repositories.GetProjectAnalyticsByDateRange(
					context.TODO(),
					project.ID,
					fromDate,
					toDate,
				)
				assert.NoError(t, dbErr)
				assert.Equal(t, int64(1), projectAnalytics.TotalAPICalls)
				assert.Equal(
					t,
					tokenutils.GetCostByModelType(totalTokensUsed, db.ModelTypeGpt35Turbo),
					projectAnalytics.ModelsCost,
				)
			})
		})
	})
}
