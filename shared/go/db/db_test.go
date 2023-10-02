package db_test

import (
	"context"
	"testing"
	"time"

	"github.com/basemind-ai/monorepo/e2e/factories"
	db "github.com/basemind-ai/monorepo/shared/go/db"
	dbTestUtils "github.com/basemind-ai/monorepo/shared/go/db/testutils"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/google/uuid"

	"github.com/stretchr/testify/assert"
)

func TestDbQueries(t *testing.T) {
	dbTestUtils.CreateTestDB(t)
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

	t.Run("CreatePromptRequestRecord tests", func(t *testing.T) {
		tokenCount := int32(10)
		promptStartTime := time.Now()
		promptFinishTime := promptStartTime.Add(10 * time.Second)

		project, _ := db.GetQueries().CreateProject(context.TODO(), db.CreateProjectParams{
			Name:        "test project",
			Description: "test project description",
		})

		application, _ := factories.CreateApplication(context.TODO(), project.ID)
		modelParameters, _ := factories.CreateModelParameters()

		systemMessages := "You are a chatbot."
		userMessage := "Write a jungle story."
		promptMessages, _ := factories.CreateOpenAIPromptMessageDTO([]struct {
			Role    string
			Content string
		}{
			{Role: "system", Content: systemMessages}, {Role: "user", Content: userMessage},
		})

		promptConfig, _ := db.GetQueries().CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
			ApplicationID:             application.ID,
			Name:                      "abc prompt config",
			ModelVendor:               db.ModelVendorOPENAI,
			ModelType:                 db.ModelTypeGpt4,
			ModelParameters:           modelParameters,
			ProviderPromptMessages:    promptMessages,
			ExpectedTemplateVariables: []string{""},
			IsDefault:                 true,
		})

		t.Run("successfully creates a prompt request record", func(t *testing.T) {
			promptRequestRecord, err := dbQueries.CreatePromptRequestRecord(context.TODO(), db.CreatePromptRequestRecordParams{
				IsStreamResponse:      true,
				RequestTokens:         tokenCount,
				ResponseTokens:        tokenCount,
				StartTime:             pgtype.Timestamptz{Time: promptStartTime, Valid: true},
				FinishTime:            pgtype.Timestamptz{Time: promptFinishTime, Valid: true},
				StreamResponseLatency: pgtype.Int8{Int64: 0, Valid: true},
				PromptConfigID:        promptConfig.ID,
			})

			assert.Nil(t, err)
			assert.Equal(t, promptRequestRecord.RequestTokens, tokenCount)
			assert.Equal(t, promptRequestRecord.ResponseTokens, tokenCount)
			assert.Empty(t, promptRequestRecord.ErrorLog.String)
		})

		t.Run("returns error when prompt config does not exist", func(t *testing.T) {
			promptConfigId := pgtype.UUID{Bytes: uuid.New(), Valid: true}
			_, err := dbQueries.CreatePromptRequestRecord(context.TODO(), db.CreatePromptRequestRecordParams{
				IsStreamResponse:      true,
				RequestTokens:         tokenCount,
				ResponseTokens:        tokenCount,
				StartTime:             pgtype.Timestamptz{Time: promptStartTime, Valid: true},
				FinishTime:            pgtype.Timestamptz{Time: promptFinishTime, Valid: true},
				StreamResponseLatency: pgtype.Int8{Int64: 0, Valid: true},
				PromptConfigID:        promptConfigId,
			})

			assert.Error(t, err)
		})

		t.Run("successfully creates a prompt request record with error logs", func(t *testing.T) {
			errString := "error log"
			promptRequestRecord, err := dbQueries.CreatePromptRequestRecord(context.TODO(), db.CreatePromptRequestRecordParams{
				IsStreamResponse:      true,
				RequestTokens:         tokenCount,
				ResponseTokens:        tokenCount,
				StartTime:             pgtype.Timestamptz{Time: promptStartTime, Valid: true},
				FinishTime:            pgtype.Timestamptz{Time: promptFinishTime, Valid: true},
				PromptConfigID:        promptConfig.ID,
				StreamResponseLatency: pgtype.Int8{Int64: 0, Valid: true},
				ErrorLog:              pgtype.Text{String: errString, Valid: true},
			})

			assert.Nil(t, err)
			assert.Equal(t, promptRequestRecord.ErrorLog.String, errString)
		})
	})
}
