package db_test

import (
	"context"
	"testing"

	"github.com/google/uuid"

	dbTestUtils "github.com/basemind-ai/monorepo/go-shared/db/testutils"

	"github.com/basemind-ai/monorepo/go-shared/db"
	"github.com/stretchr/testify/assert"
)

func TestDbQueries(t *testing.T) {
	dbTestUtils.CreateTestDB(t, "file://../../sql/migrations")
	dbQueries := db.GetQueries()

	t.Run("CheckUserExists tests", func(t *testing.T) {
		testUserId := uuid.NewString()

		t.Run("returns false when user does not exist", func(t *testing.T) {
			userExists, err := dbQueries.CheckUserExists(context.TODO(), testUserId)
			assert.Nil(t, err)
			assert.False(t, userExists)
		})

		t.Run("returns true when user does exist", func(t *testing.T) {
			_, err := dbQueries.CreateUser(context.TODO(), testUserId)
			assert.Nil(t, err)

			userExists, err := dbQueries.CheckUserExists(context.TODO(), testUserId)
			assert.Nil(t, err)
			assert.True(t, userExists)
		})
	})

	t.Run("FindUserByFirebaseId tests", func(t *testing.T) {
		t.Run("throws error when user does not exist", func(t *testing.T) {
			testUserId := uuid.NewString()
			_, err := dbQueries.FindUserByFirebaseId(context.TODO(), testUserId)
			assert.NotNil(t, err)
		})

		t.Run("successfully find a user", func(t *testing.T) {
			testUserId := uuid.NewString()

			_, err := dbQueries.CreateUser(context.TODO(), testUserId)
			assert.Nil(t, err)

			user, err := dbQueries.FindUserByFirebaseId(context.TODO(), testUserId)
			assert.Nil(t, err)
			assert.Equal(t, user.FirebaseID, testUserId)
		})
	})

	t.Run("CreateUser tests", func(t *testing.T) {
		t.Run("successfully creates a user", func(t *testing.T) {
			testUserId := uuid.NewString()
			user, err := dbQueries.CreateUser(context.TODO(), testUserId)
			assert.Nil(t, err)

			assert.Equal(t, user.FirebaseID, testUserId)
			assert.NotNil(t, user.ID)
			assert.NotNil(t, user.CreatedAt)

			userExists, err := dbQueries.CheckUserExists(context.TODO(), testUserId)
			assert.Nil(t, err)
			assert.True(t, userExists)
		})

		t.Run("fails when creating a user with duplicate firebase id", func(t *testing.T) {
			testUserId := uuid.NewString()
			_, err := dbQueries.CreateUser(context.TODO(), testUserId)
			assert.Nil(t, err)
			_, err = dbQueries.CreateUser(context.TODO(), testUserId)
			assert.NotNil(t, err)
		})
	})

	t.Run("DeleteUser tests", func(t *testing.T) {
		t.Run("successfully deletes a user", func(t *testing.T) {
			testUserId := uuid.NewString()
			_, err := dbQueries.CreateUser(context.TODO(), testUserId)
			assert.Nil(t, err)

			err = dbQueries.DeleteUser(context.TODO(), testUserId)
			assert.Nil(t, err)

			userExists, err := dbQueries.CheckUserExists(context.TODO(), testUserId)
			assert.Nil(t, err)
			assert.False(t, userExists)
		})
	})

	t.Run("CreateProject tests", func(t *testing.T) {
		t.Run("successfully creates a project", func(t *testing.T) {
			project, err := dbQueries.CreateProject(context.TODO(), db.CreateProjectParams{Name: "test", Description: "test"})
			assert.Nil(t, err)

			assert.Equal(t, project.Name, "test")
			assert.Equal(t, project.Description, "test")
			assert.NotNil(t, project.CreatedAt)
			assert.NotNil(t, project.ID)
		})
	})

	t.Run("DeleteProject tests", func(t *testing.T) {
		t.Run("successfully deletes a project", func(t *testing.T) {
			project, err := dbQueries.CreateProject(context.TODO(), db.CreateProjectParams{Name: "test", Description: "test"})
			assert.Nil(t, err)

			err = dbQueries.DeleteProject(context.TODO(), project.ID)
			assert.Nil(t, err)
		})
	})

	t.Run("CreateUserProject tests", func(t *testing.T) {
		testUserId := uuid.NewString()

		user, err := dbQueries.CreateUser(context.TODO(), testUserId)
		assert.Nil(t, err)

		t.Run("successfully creates a user project", func(t *testing.T) {
			project, err := dbQueries.CreateProject(context.TODO(), db.CreateProjectParams{Name: "test", Description: "test"})
			assert.Nil(t, err)

			createProjectParams := db.CreateUserProjectParams{UserID: user.ID, ProjectID: project.ID, Permission: db.AccessPermissionTypeADMIN, IsUserDefaultProject: true}
			userProject, err := dbQueries.CreateUserProject(context.TODO(), createProjectParams)
			assert.Nil(t, err)

			assert.Equal(t, userProject.IsUserDefaultProject, true)
			assert.Equal(t, userProject.ProjectID, project.ID)
			assert.Equal(t, userProject.UserID, user.ID)
			assert.Equal(t, userProject.Permission, db.AccessPermissionTypeADMIN)
		})

		t.Run("User default project is false by default", func(t *testing.T) {
			project, err := dbQueries.CreateProject(context.TODO(), db.CreateProjectParams{Name: "test", Description: "test"})
			assert.Nil(t, err)

			createProjectParams := db.CreateUserProjectParams{UserID: user.ID, ProjectID: project.ID, Permission: db.AccessPermissionTypeADMIN}
			userProject, err := dbQueries.CreateUserProject(context.TODO(), createProjectParams)
			assert.Nil(t, err)

			assert.False(t, userProject.IsUserDefaultProject)
		})

		t.Run("fails when creating a duplicate user project", func(t *testing.T) {
			project, err := dbQueries.CreateProject(context.TODO(), db.CreateProjectParams{Name: "test", Description: "test"})
			assert.Nil(t, err)

			createProjectParams := db.CreateUserProjectParams{UserID: user.ID, ProjectID: project.ID, Permission: db.AccessPermissionTypeADMIN}
			_, err = dbQueries.CreateUserProject(context.TODO(), createProjectParams)
			assert.Nil(t, err)

			_, err = dbQueries.CreateUserProject(context.TODO(), createProjectParams)
			assert.NotNil(t, err)
		})
	})

	t.Run("FindProjectsByUserId tests", func(t *testing.T) {
		testUserId := uuid.NewString()

		user, err := dbQueries.CreateUser(context.TODO(), testUserId)
		assert.Nil(t, err)

		t.Run("successfully delete a user project", func(t *testing.T) {
			project, err := dbQueries.CreateProject(context.TODO(), db.CreateProjectParams{Name: "test", Description: "test"})
			assert.Nil(t, err)

			createProjectParams := db.CreateUserProjectParams{UserID: user.ID, ProjectID: project.ID, Permission: db.AccessPermissionTypeADMIN}
			userProject, err := dbQueries.CreateUserProject(context.TODO(), createProjectParams)
			assert.Nil(t, err)

			err = dbQueries.DeleteUserProject(context.TODO(), userProject.ProjectID)
			assert.Nil(t, err)

			userProjects, err := dbQueries.FindProjectsByUserId(context.TODO(), user.ID)
			assert.Nil(t, err)

			assert.Equal(t, len(userProjects), 0)
		})
	})

	t.Run("DeleteUserProject tests", func(t *testing.T) {
		testUserId := uuid.NewString()

		user, err := dbQueries.CreateUser(context.TODO(), testUserId)
		assert.Nil(t, err)

		t.Run("successfully delete a user project", func(t *testing.T) {
			project, err := dbQueries.CreateProject(context.TODO(), db.CreateProjectParams{Name: "test", Description: "test"})
			assert.Nil(t, err)

			createProjectParams := db.CreateUserProjectParams{UserID: user.ID, ProjectID: project.ID, Permission: db.AccessPermissionTypeADMIN}
			userProject, err := dbQueries.CreateUserProject(context.TODO(), createProjectParams)
			assert.Nil(t, err)

			err = dbQueries.DeleteUserProject(context.TODO(), userProject.ProjectID)
			assert.Nil(t, err)

			userProjects, err := dbQueries.FindProjectsByUserId(context.TODO(), user.ID)
			assert.Nil(t, err)

			assert.Equal(t, len(userProjects), 0)
		})
	})

	t.Run("FindProjectsByUserId tests", func(t *testing.T) {
		t.Run("successfully finds projects of a user", func(t *testing.T) {
			testUserId := uuid.NewString()
			user, err := dbQueries.CreateUser(context.TODO(), testUserId)
			assert.Nil(t, err)

			project, err := dbQueries.CreateProject(context.TODO(), db.CreateProjectParams{Name: "test", Description: "test"})
			assert.Nil(t, err)

			createProjectParams := db.CreateUserProjectParams{UserID: user.ID, ProjectID: project.ID, Permission: db.AccessPermissionTypeADMIN}
			userProject, err := dbQueries.CreateUserProject(context.TODO(), createProjectParams)
			assert.Nil(t, err)

			userProjects, err := dbQueries.FindProjectsByUserId(context.TODO(), user.ID)
			assert.Nil(t, err)

			assert.Equal(t, len(userProjects), 1)
			assert.Equal(t, userProjects[0].ID, userProject.ProjectID)
			assert.Equal(t, userProjects[0].Name, project.Name)
		})

		t.Run("returns empty array when user does not have any projects", func(t *testing.T) {
			testUserId := uuid.NewString()
			user, err := dbQueries.CreateUser(context.TODO(), testUserId)
			assert.Nil(t, err)

			userProjects, err := dbQueries.FindProjectsByUserId(context.TODO(), user.ID)
			assert.Nil(t, err)

			assert.Equal(t, len(userProjects), 0)
		})
	})
}
