package api_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/ptr"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"net/http"
	"strings"
	"testing"
	"time"
)

func TestPromptTestRecordsAPI(t *testing.T) {
	project, _ := factories.CreateProject(context.TODO())
	application, _ := factories.CreateApplication(context.TODO(), project.ID)
	userAccount, _ := factories.CreateUserAccount(context.TODO())
	_, _ = db.GetQueries().CreateUserProject(context.TODO(), models.CreateUserProjectParams{
		ProjectID:  project.ID,
		UserID:     userAccount.ID,
		Permission: models.AccessPermissionTypeADMIN,
	})

	testClient := createTestClient(t, userAccount)

	promptConfig, _ := factories.CreatePromptConfig(context.TODO(), application.ID)
	firstPromptRequestRecord, _ := factories.CreatePromptRequestRecord(
		context.TODO(),
		promptConfig.ID,
	)
	firstPromptTestRecord, _ := db.GetQueries().
		CreatePromptTestRecord(context.TODO(), models.CreatePromptTestRecordParams{
			PromptRequestRecordID: firstPromptRequestRecord.ID,
			Response:              "i am a bot and i will take over the world",
			VariableValues:        []byte(`{"userInput": "bar"}`),
		})

	// test config - this emulates a config that was not created by the user, but rather during a test

	testPromptConfig := exc.MustResult(
		db.GetQueries().CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
			Name:            "test-config-1",
			ModelParameters: []byte("{}"),
			ModelType:       models.ModelTypeCommand,
			ModelVendor:     models.ModelVendorCOHERE,
			ProviderPromptMessages: []byte(
				`{"message": "please write a poem about topic {userInput}"}`,
			),
			ExpectedTemplateVariables: []string{"userInput"},
			IsDefault:                 false,
			ApplicationID:             application.ID,
			IsTestConfig:              true,
		}),
	)
	secondPromptRequestRecord := exc.MustResult(
		db.GetQueries().
			CreatePromptRequestRecord(context.TODO(), models.CreatePromptRequestRecordParams{
				IsStreamResponse:   true,
				RequestTokens:      5,
				ResponseTokens:     20,
				RequestTokensCost:  *exc.MustResult(db.StringToNumeric("10")),
				ResponseTokensCost: *exc.MustResult(db.StringToNumeric("50")),
				StartTime: pgtype.Timestamptz{
					Time:  time.Now().Add(-10 * time.Second),
					Valid: true,
				},
				FinishTime: pgtype.Timestamptz{
					Time:  time.Now().Add(-9 * time.Second),
					Valid: true,
				},
				DurationMs:     pgtype.Int4{Int32: 1000, Valid: true},
				PromptConfigID: testPromptConfig.ID,
				ErrorLog:       pgtype.Text{String: "", Valid: true},
			}),
	)
	secondPromptTestRecord := exc.MustResult(
		db.GetQueries().CreatePromptTestRecord(context.TODO(), models.CreatePromptTestRecordParams{
			PromptRequestRecordID: secondPromptRequestRecord.ID,
			Response:              "roses are red, violets are blue, I will become a robot and so will you.",
			VariableValues:        []byte(`{"userInput": "bar"}`),
		}),
	)

	listEndpointURL := func(applicationID string) string {
		return fmt.Sprintf(
			"/v1%s",
			strings.ReplaceAll(strings.ReplaceAll(
				api.PromptTestRecordListEndpoint,
				"{projectId}",
				db.UUIDToString(&project.ID),
			), "{applicationId}", applicationID),
		)
	}

	detailEndpointURL := func(applicationID string, testRecordID string) string {
		return fmt.Sprintf(
			"/v1%s",
			strings.ReplaceAll(
				strings.ReplaceAll(strings.ReplaceAll(
					api.PromptTestRecordDetailEndpoint,
					"{projectId}",
					db.UUIDToString(&project.ID),
				), "{applicationId}", applicationID), "{promptTestRecordId}", testRecordID),
		)
	}

	t.Run(fmt.Sprintf("GET: %s", api.PromptTestRecordListEndpoint), func(t *testing.T) {
		t.Run("retrieves an applications prompt test records", func(t *testing.T) {
			response, requestErr := testClient.Get(
				context.TODO(),
				listEndpointURL(db.UUIDToString(&application.ID)),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			data := make([]*dto.PromptTestRecordDTO, 0)
			deserializationErr := serialization.DeserializeJSON(response.Body, &data)
			assert.NoError(t, deserializationErr)

			assert.Len(t, data, 2)

			recordOne := data[0]
			assert.Equal(t, recordOne.ID, db.UUIDToString(&firstPromptTestRecord.ID))
			assert.Equal(t, recordOne.PromptConfigID, ptr.To(db.UUIDToString(&promptConfig.ID)))

			recordTwo := data[1]
			assert.Equal(t, recordTwo.ID, db.UUIDToString(&secondPromptTestRecord.ID))
			assert.Empty(t, recordTwo.PromptConfigID)
		})

		t.Run("sets the totalTokensCost correctly", func(t *testing.T) {
			response, requestErr := testClient.Get(
				context.TODO(),
				listEndpointURL(db.UUIDToString(&application.ID)),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			data := make([]*dto.PromptTestRecordDTO, 0)
			deserializationErr := serialization.DeserializeJSON(response.Body, &data)
			assert.NoError(t, deserializationErr)

			assert.Len(t, data, 2)

			record := data[0]
			assert.Equal(t, record.ID, db.UUIDToString(&firstPromptTestRecord.ID))
			assert.Equal(t, record.PromptConfigID, ptr.To(db.UUIDToString(&promptConfig.ID)))
			assert.Equal(
				t,
				record.TotalTokensCost.String(),
				record.RequestTokensCost.Add(record.ResponseTokensCost).String(),
			)
		})

		t.Run("handles an empty list of prompt test records", func(t *testing.T) {
			newApplication, _ := factories.CreateApplication(context.TODO(), project.ID)

			response, requestErr := testClient.Get(
				context.TODO(),
				listEndpointURL(db.UUIDToString(&newApplication.ID)),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			data := make([]*dto.PromptTestRecordDTO, 0)
			deserializationErr := serialization.DeserializeJSON(response.Body, &data)
			assert.NoError(t, deserializationErr)

			assert.Len(t, data, 0)
		})

		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {
				newUser, _ := factories.CreateUserAccount(context.TODO())
				newTestClient := createTestClient(t, newUser)

				response, requestErr := newTestClient.Get(
					context.TODO(),
					listEndpointURL(db.UUIDToString(&application.ID)),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)
	})

	t.Run(fmt.Sprintf("GET: %s", api.PromptTestRecordDetailEndpoint), func(t *testing.T) {
		t.Run("retrieves a prompt test record", func(t *testing.T) {
			response, requestErr := testClient.Get(
				context.TODO(),
				detailEndpointURL(
					db.UUIDToString(&application.ID),
					db.UUIDToString(&firstPromptTestRecord.ID),
				),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			data := &dto.PromptTestRecordDTO{}
			deserializationErr := serialization.DeserializeJSON(response.Body, data)
			assert.NoError(t, deserializationErr)

			assert.Equal(t, data.ID, db.UUIDToString(&firstPromptTestRecord.ID))
			assert.Equal(t, data.PromptConfigID, ptr.To(db.UUIDToString(&promptConfig.ID)))
		})

		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {
				newUser, _ := factories.CreateUserAccount(context.TODO())
				newTestClient := createTestClient(t, newUser)

				response, requestErr := newTestClient.Get(
					context.TODO(),
					detailEndpointURL(
						db.UUIDToString(&application.ID),
						db.UUIDToString(&firstPromptTestRecord.ID),
					),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)
	})

	t.Run(fmt.Sprintf("DELETE: %s", api.PromptTestRecordDetailEndpoint), func(t *testing.T) {
		t.Run("deletes a prompt test record", func(t *testing.T) {
			response, requestErr := testClient.Delete(
				context.TODO(),
				detailEndpointURL(
					db.UUIDToString(&application.ID),
					db.UUIDToString(&firstPromptTestRecord.ID),
				),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusNoContent, response.StatusCode)

			_, retrievalErr := db.GetQueries().
				RetrievePromptTestRecord(context.TODO(), firstPromptTestRecord.ID)
			assert.Error(t, retrievalErr)
		})

		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {
				newUser, _ := factories.CreateUserAccount(context.TODO())
				newTestClient := createTestClient(t, newUser)

				response, requestErr := newTestClient.Delete(
					context.TODO(),
					detailEndpointURL(
						db.UUIDToString(&application.ID),
						db.UUIDToString(&firstPromptTestRecord.ID),
					),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)

		t.Run(
			"responds with status 401 UNAUTHORIZED if the user does not have admin permission",
			func(t *testing.T) {
				newUser, _ := factories.CreateUserAccount(context.TODO())
				_, _ = db.GetQueries().
					CreateUserProject(context.TODO(), models.CreateUserProjectParams{
						ProjectID:  project.ID,
						UserID:     newUser.ID,
						Permission: models.AccessPermissionTypeMEMBER,
					})
				newTestClient := createTestClient(t, newUser)

				response, requestErr := newTestClient.Delete(
					context.TODO(),
					detailEndpointURL(
						db.UUIDToString(&application.ID),
						db.UUIDToString(&firstPromptTestRecord.ID),
					),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusUnauthorized, response.StatusCode)
			},
		)
	})
}
