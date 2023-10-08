package repositories_test

import (
	"context"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/stretchr/testify/assert"
	"testing"
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
			assert.Equal(t, false, projectDto.IsUserDefaultProject)
			assert.Equal(t, "ADMIN", projectDto.Permission)
			assert.NotEmpty(t, projectDto.ID)
			assert.NotEmpty(t, projectDto.CreatedAt)
			assert.NotEmpty(t, projectDto.UpdatedAt)
			assert.Nil(t, projectDto.Applications)

			uuidID, err := db.StringToUUID(projectDto.ID)
			assert.NoError(t, err)

			retrievedProject, err := db.GetQueries().
				RetrieveProject(context.TODO(), *uuidID)
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
			application, _ := factories.CreateApplication(context.TODO(), project.ID)

			retrievedProject, err := db.GetQueries().
				RetrieveProject(context.TODO(), project.ID)
			assert.NoError(t, err)
			assert.Equal(t, project.ID, retrievedProject.ID)

			retrievedApplication, err := db.GetQueries().
				RetrieveApplication(context.TODO(), application.ID)
			assert.NoError(t, err)
			assert.Equal(t, application.ID, retrievedApplication.ID)

			err = repositories.DeleteProject(context.TODO(), project.ID)
			assert.NoError(t, err)

			_, err = db.GetQueries().RetrieveProject(context.TODO(), project.ID)
			assert.Error(t, err)

			_, err = db.GetQueries().RetrieveApplication(context.TODO(), application.ID)
			assert.Error(t, err)
		})

		t.Run("deletes a project that has no applications", func(t *testing.T) {
			project, _ := factories.CreateProject(context.TODO())

			retrievedProject, err := db.GetQueries().
				RetrieveProject(context.TODO(), project.ID)
			assert.NoError(t, err)
			assert.Equal(t, project.ID, retrievedProject.ID)

			err = repositories.DeleteProject(context.TODO(), project.ID)
			assert.NoError(t, err)

			_, err = db.GetQueries().RetrieveProject(context.TODO(), project.ID)
			assert.Error(t, err)
		})
	})

	t.Run("UpdateDefaultProject", func(t *testing.T) {
		t.Run("updates the default project for a user account", func(t *testing.T) {
			userAccount, _ := factories.CreateUserAccount(context.TODO())

			defaultProject, _ := factories.CreateProject(context.TODO())
			_, _ = db.GetQueries().
				CreateUserProject(context.TODO(), db.CreateUserProjectParams{
					UserID:               userAccount.ID,
					ProjectID:            defaultProject.ID,
					Permission:           db.AccessPermissionTypeADMIN,
					IsUserDefaultProject: true,
				})

			nonDefaultProject, _ := factories.CreateProject(context.TODO())
			_, _ = db.GetQueries().
				CreateUserProject(context.TODO(), db.CreateUserProjectParams{
					UserID:               userAccount.ID,
					ProjectID:            nonDefaultProject.ID,
					Permission:           db.AccessPermissionTypeADMIN,
					IsUserDefaultProject: false,
				})
			err := repositories.UpdateDefaultProject(
				context.TODO(),
				userAccount.FirebaseID,
				nonDefaultProject.ID,
			)
			assert.NoError(t, err)
		})
		t.Run("sets default project when no existing default project exists", func(t *testing.T) {
			userAccount, _ := factories.CreateUserAccount(context.TODO())
			project, _ := factories.CreateProject(context.TODO())
			_, _ = db.GetQueries().
				CreateUserProject(context.TODO(), db.CreateUserProjectParams{
					UserID:               userAccount.ID,
					ProjectID:            project.ID,
					Permission:           db.AccessPermissionTypeADMIN,
					IsUserDefaultProject: false,
				})

			err := repositories.UpdateDefaultProject(
				context.TODO(),
				userAccount.FirebaseID,
				project.ID,
			)
			assert.NoError(t, err)
		})
		t.Run("returns an error when the user account does not exist", func(t *testing.T) {
			project, _ := factories.CreateProject(context.TODO())

			err := repositories.UpdateDefaultProject(context.TODO(), "1234", project.ID)
			assert.Error(t, err)
		})
		t.Run("returns an error when the project does not exist", func(t *testing.T) {
			userAccount, _ := factories.CreateUserAccount(context.TODO())

			err := repositories.UpdateDefaultProject(
				context.TODO(),
				userAccount.FirebaseID,
				userAccount.ID,
			)
			assert.Error(t, err)
		})
	})
}
