package db_test

import (
	"context"
	"testing"
	"time"

	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/shared/go/db"
	dbTestUtils "github.com/basemind-ai/monorepo/shared/go/db/testutils"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/google/uuid"

	"github.com/stretchr/testify/assert"
)

func TestMain(m *testing.M) {
	cleanup := dbTestUtils.CreateNamespaceTestDBModule("db-test")
	defer cleanup()
	m.Run()
}

func TestDBQueries(t *testing.T) {
	dbQueries := db.GetQueries()

	t.Run("CheckUserAccountExists tests", func(t *testing.T) {
		testUserID := uuid.NewString()

		t.Run("returns false when user does not exist", func(t *testing.T) {
			userExists, err := dbQueries.CheckUserAccountExists(context.TODO(), testUserID)
			assert.Nil(t, err)
			assert.False(t, userExists)
		})

		t.Run("returns true when user does exist", func(t *testing.T) {
			_, err := dbQueries.CreateUserAccount(context.TODO(), testUserID)
			assert.Nil(t, err)

			userExists, err := dbQueries.CheckUserAccountExists(context.TODO(), testUserID)
			assert.Nil(t, err)
			assert.True(t, userExists)
		})
	})

	t.Run("CreateUser tests", func(t *testing.T) {
		t.Run("successfully creates a user", func(t *testing.T) {
			testUserID := uuid.NewString()
			user, err := dbQueries.CreateUserAccount(context.TODO(), testUserID)
			assert.Nil(t, err)

			assert.Equal(t, user.FirebaseID, testUserID)
			assert.NotNil(t, user.ID)
			assert.NotNil(t, user.CreatedAt)

			userExists, err := dbQueries.CheckUserAccountExists(context.TODO(), testUserID)
			assert.Nil(t, err)
			assert.True(t, userExists)
		})

		t.Run("fails when creating a user with duplicate firebase id", func(t *testing.T) {
			testUserID := uuid.NewString()
			_, err := dbQueries.CreateUserAccount(context.TODO(), testUserID)
			assert.Nil(t, err)
			_, err = dbQueries.CreateUserAccount(context.TODO(), testUserID)
			assert.NotNil(t, err)
		})
	})

	t.Run("CreateProject tests", func(t *testing.T) {
		t.Run("successfully creates a project", func(t *testing.T) {
			project, err := dbQueries.CreateProject(
				context.TODO(),
				db.CreateProjectParams{Name: "test", Description: "test"},
			)
			assert.Nil(t, err)

			assert.Equal(t, project.Name, "test")
			assert.Equal(t, project.Description, "test")
			assert.NotNil(t, project.CreatedAt)
			assert.NotNil(t, project.ID)
		})
	})

	t.Run("DeleteProject tests", func(t *testing.T) {
		t.Run("successfully deletes a project", func(t *testing.T) {
			project, err := dbQueries.CreateProject(
				context.TODO(),
				db.CreateProjectParams{Name: "test", Description: "test"},
			)
			assert.Nil(t, err)

			err = dbQueries.DeleteProject(context.TODO(), project.ID)
			assert.Nil(t, err)
		})
	})

	t.Run("CreateUserProject tests", func(t *testing.T) {
		testUserID := uuid.NewString()

		user, err := dbQueries.CreateUserAccount(context.TODO(), testUserID)
		assert.Nil(t, err)

		t.Run("successfully creates a user project", func(t *testing.T) {
			project, err := dbQueries.CreateProject(
				context.TODO(),
				db.CreateProjectParams{Name: "test", Description: "test"},
			)
			assert.Nil(t, err)

			createProjectParams := db.CreateUserProjectParams{
				UserID:               user.ID,
				ProjectID:            project.ID,
				Permission:           db.AccessPermissionTypeADMIN,
				IsUserDefaultProject: true,
			}
			userProject, err := dbQueries.CreateUserProject(context.TODO(), createProjectParams)
			assert.Nil(t, err)

			assert.Equal(t, userProject.IsUserDefaultProject, true)
			assert.Equal(t, userProject.ProjectID, project.ID)
			assert.Equal(t, userProject.UserID, user.ID)
			assert.Equal(t, userProject.Permission, db.AccessPermissionTypeADMIN)
		})

		t.Run("User default project is false by default", func(t *testing.T) {
			project, err := dbQueries.CreateProject(
				context.TODO(),
				db.CreateProjectParams{Name: "test", Description: "test"},
			)
			assert.Nil(t, err)

			createProjectParams := db.CreateUserProjectParams{
				UserID:     user.ID,
				ProjectID:  project.ID,
				Permission: db.AccessPermissionTypeADMIN,
			}
			userProject, err := dbQueries.CreateUserProject(context.TODO(), createProjectParams)
			assert.Nil(t, err)

			assert.False(t, userProject.IsUserDefaultProject)
		})

		t.Run("fails when creating a duplicate user project", func(t *testing.T) {
			project, err := dbQueries.CreateProject(
				context.TODO(),
				db.CreateProjectParams{Name: "test", Description: "test"},
			)
			assert.Nil(t, err)

			createProjectParams := db.CreateUserProjectParams{
				UserID:     user.ID,
				ProjectID:  project.ID,
				Permission: db.AccessPermissionTypeADMIN,
			}
			_, err = dbQueries.CreateUserProject(context.TODO(), createProjectParams)
			assert.Nil(t, err)

			_, err = dbQueries.CreateUserProject(context.TODO(), createProjectParams)
			assert.NotNil(t, err)
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
		promptMessages, _ := factories.CreateOpenAIPromptMessages(systemMessages, userMessage, nil)

		promptConfig, _ := db.GetQueries().
			CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
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
			promptRequestRecord, err := dbQueries.CreatePromptRequestRecord(
				context.TODO(),
				db.CreatePromptRequestRecordParams{
					IsStreamResponse:      true,
					RequestTokens:         tokenCount,
					ResponseTokens:        tokenCount,
					StartTime:             pgtype.Timestamptz{Time: promptStartTime, Valid: true},
					FinishTime:            pgtype.Timestamptz{Time: promptFinishTime, Valid: true},
					StreamResponseLatency: pgtype.Int8{Int64: 0, Valid: true},
					PromptConfigID:        promptConfig.ID,
				},
			)

			assert.Nil(t, err)
			assert.Equal(t, promptRequestRecord.RequestTokens, tokenCount)
			assert.Equal(t, promptRequestRecord.ResponseTokens, tokenCount)
			assert.Empty(t, promptRequestRecord.ErrorLog.String)
		})

		t.Run("returns error when prompt config does not exist", func(t *testing.T) {
			promptConfigID := pgtype.UUID{Bytes: uuid.New(), Valid: true}
			_, err := dbQueries.CreatePromptRequestRecord(
				context.TODO(),
				db.CreatePromptRequestRecordParams{
					IsStreamResponse:      true,
					RequestTokens:         tokenCount,
					ResponseTokens:        tokenCount,
					StartTime:             pgtype.Timestamptz{Time: promptStartTime, Valid: true},
					FinishTime:            pgtype.Timestamptz{Time: promptFinishTime, Valid: true},
					StreamResponseLatency: pgtype.Int8{Int64: 0, Valid: true},
					PromptConfigID:        promptConfigID,
				},
			)

			assert.Error(t, err)
		})

		t.Run("successfully creates a prompt request record with error logs", func(t *testing.T) {
			errString := "error log"
			promptRequestRecord, err := dbQueries.CreatePromptRequestRecord(
				context.TODO(),
				db.CreatePromptRequestRecordParams{
					IsStreamResponse:      true,
					RequestTokens:         tokenCount,
					ResponseTokens:        tokenCount,
					StartTime:             pgtype.Timestamptz{Time: promptStartTime, Valid: true},
					FinishTime:            pgtype.Timestamptz{Time: promptFinishTime, Valid: true},
					PromptConfigID:        promptConfig.ID,
					StreamResponseLatency: pgtype.Int8{Int64: 0, Valid: true},
					ErrorLog:              pgtype.Text{String: errString, Valid: true},
				},
			)

			assert.Nil(t, err)
			assert.Equal(t, promptRequestRecord.ErrorLog.String, errString)
		})
	})
}
