package api_test

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/ptr"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/stretchr/testify/assert"
)

func TestPromptConfigAPI(t *testing.T) { //nolint: revive
	userAccount, _ := factories.CreateUserAccount(context.TODO())
	projectID := createProject(t)
	createUserProject(t, userAccount.FirebaseID, projectID, models.AccessPermissionTypeADMIN)

	testClient := createTestClient(t, userAccount)

	systemMessages := "You are a chatbot."
	userMessage := "Please write a song about {subject}."
	templateVariables := []string{"subject"}

	promptMessages := factories.CreateOpenAIPromptMessages(
		systemMessages,
		userMessage,
		&templateVariables,
	)

	modelParameters := factories.CreateModelParameters()

	fmtListEndpoint := func(projectID string, applicationID string) string {
		return fmt.Sprintf(
			"/v1%s",
			strings.ReplaceAll(
				strings.ReplaceAll(
					api.PromptConfigListEndpoint,
					"{projectId}",
					projectID),
				"{applicationId}",
				applicationID),
		)
	}

	fmtDetailEndpoint := func(projectID string, applicationID string, promptConfigID string) string {
		return fmt.Sprintf(
			"/v1%s",
			strings.ReplaceAll(
				strings.ReplaceAll(
					strings.ReplaceAll(
						api.PromptConfigDetailEndpoint,
						"{projectId}",
						projectID),
					"{applicationId}",
					applicationID),
				"{promptConfigId}",
				promptConfigID),
		)
	}

	redisDB, redisMock := testutils.CreateMockRedisClient(t)

	t.Run(fmt.Sprintf("POST: %s", api.PromptConfigListEndpoint), func(t *testing.T) {
		applicationID := createApplication(t, projectID)
		uuidID, _ := db.StringToUUID(applicationID)

		t.Run("creates a new prompt config", func(t *testing.T) {
			createDto := dto.PromptConfigCreateDTO{
				Name:                   "test prompt config",
				ModelParameters:        modelParameters,
				ModelType:              models.ModelTypeGpt4,
				ModelVendor:            models.ModelVendorOPENAI,
				ProviderPromptMessages: promptMessages,
			}
			response, requestErr := testClient.Post(
				context.TODO(),
				fmtListEndpoint(projectID, applicationID),
				createDto,
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusCreated, response.StatusCode)

			promptConfigDto := datatypes.PromptConfigDTO{}
			deserializationErr := serialization.DeserializeJSON(response.Body, &promptConfigDto)
			assert.NoError(t, deserializationErr)

			assert.NotNil(t, promptConfigDto.ID)
			assert.Equal(t, createDto.Name, promptConfigDto.Name)
			assert.Equal(t, createDto.ModelParameters, promptConfigDto.ModelParameters)
			assert.Equal(t, createDto.ModelType, promptConfigDto.ModelType)
			assert.Equal(t, createDto.ModelVendor, promptConfigDto.ModelVendor)
			assert.Equal(
				t,
				createDto.ProviderPromptMessages,
				promptConfigDto.ProviderPromptMessages,
			)
		})

		for _, permission := range []models.AccessPermissionType{
			models.AccessPermissionTypeMEMBER, models.AccessPermissionTypeADMIN,
		} {
			t.Run(
				fmt.Sprintf(
					"responds with status 201 CREATED if the user has %s permission",
					permission,
				),
				func(t *testing.T) {
					newUserAccount, _ := factories.CreateUserAccount(context.TODO())
					newProjectID := createProject(t)
					newApplicationID := createApplication(t, newProjectID)
					createUserProject(
						t,
						newUserAccount.FirebaseID,
						newProjectID,
						models.AccessPermissionTypeADMIN,
					)

					client := createTestClient(t, newUserAccount)

					createDto := dto.PromptConfigCreateDTO{
						Name:                   "test prompt config",
						ModelParameters:        modelParameters,
						ModelType:              models.ModelTypeGpt4,
						ModelVendor:            models.ModelVendorOPENAI,
						ProviderPromptMessages: promptMessages,
					}
					response, requestErr := client.Post(
						context.TODO(),
						fmtListEndpoint(newProjectID, newApplicationID),
						createDto,
					)
					assert.NoError(t, requestErr)
					assert.Equal(t, http.StatusCreated, response.StatusCode)
				},
			)
		}

		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {
				newUserAccount, _ := factories.CreateUserAccount(context.TODO())
				newProjectID := createProject(t)
				newApplicationID := createApplication(t, newProjectID)

				client := createTestClient(t, newUserAccount)

				createDto := dto.PromptConfigCreateDTO{
					Name:                   "test prompt config",
					ModelParameters:        modelParameters,
					ModelType:              models.ModelTypeGpt4,
					ModelVendor:            models.ModelVendorOPENAI,
					ProviderPromptMessages: promptMessages,
				}
				response, requestErr := client.Post(
					context.TODO(),
					fmtListEndpoint(newProjectID, newApplicationID),
					createDto,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)

		t.Run("responds with 400 BAD REQUEST for validation errors", func(t *testing.T) {
			failureTestCases := []struct {
				Name string
				Dto  dto.PromptConfigCreateDTO
			}{
				{
					Name: "fails validation for missing name",
					Dto: dto.PromptConfigCreateDTO{
						ModelParameters:        modelParameters,
						ModelType:              models.ModelTypeGpt4,
						ModelVendor:            models.ModelVendorOPENAI,
						ProviderPromptMessages: promptMessages,
					},
				},
				{
					Name: "fails validation for missing model parameters",
					Dto: dto.PromptConfigCreateDTO{
						Name:                   "test prompt config",
						ModelType:              models.ModelTypeGpt4,
						ModelVendor:            models.ModelVendorOPENAI,
						ProviderPromptMessages: promptMessages,
					},
				},
				{
					Name: "fails validation for missing model type",
					Dto: dto.PromptConfigCreateDTO{
						Name:                   "test prompt config",
						ModelParameters:        modelParameters,
						ModelVendor:            models.ModelVendorOPENAI,
						ProviderPromptMessages: promptMessages,
					},
				},
				{
					Name: "fails validation for missing model vendor",
					Dto: dto.PromptConfigCreateDTO{
						Name:                   "test prompt config",
						ModelType:              models.ModelTypeGpt4,
						ModelParameters:        modelParameters,
						ProviderPromptMessages: promptMessages,
					},
				},
				{
					Name: "fails validation for missing prompt messages",
					Dto: dto.PromptConfigCreateDTO{
						Name:            "test prompt config",
						ModelParameters: modelParameters,
						ModelType:       models.ModelTypeGpt4,
						ModelVendor:     models.ModelVendorOPENAI,
					},
				},
				{
					Name: "fails validation for wrong model type",
					Dto: dto.PromptConfigCreateDTO{
						Name:                   "test prompt config",
						ModelParameters:        modelParameters,
						ModelType:              "abc",
						ModelVendor:            models.ModelVendorOPENAI,
						ProviderPromptMessages: promptMessages,
					},
				},
				{
					Name: "fails validation for wrong model vendor",
					Dto: dto.PromptConfigCreateDTO{
						Name:                   "test prompt config",
						ModelParameters:        modelParameters,
						ModelType:              models.ModelTypeGpt432k,
						ModelVendor:            "abc",
						ProviderPromptMessages: promptMessages,
					},
				},
			}

			for _, testCase := range failureTestCases {
				t.Run(testCase.Name, func(t *testing.T) {
					response, requestErr := testClient.Post(
						context.TODO(),
						fmtListEndpoint(projectID, applicationID),
						testCase.Dto,
					)
					assert.NoError(t, requestErr)
					assert.Equal(t, http.StatusBadRequest, response.StatusCode)
				})
			}
		})

		for i, modelType := range []models.ModelType{models.ModelTypeGpt35Turbo, models.ModelTypeGpt35Turbo16k, models.ModelTypeGpt4, models.ModelTypeGpt432k} {
			t.Run(
				fmt.Sprintf("validates successfully model type %s", modelType),
				func(t *testing.T) {
					createDto := dto.PromptConfigCreateDTO{
						Name:                   fmt.Sprintf("test prompt config: %d", i),
						ModelParameters:        modelParameters,
						ModelType:              modelType,
						ModelVendor:            models.ModelVendorOPENAI,
						ProviderPromptMessages: promptMessages,
					}
					response, requestErr := testClient.Post(
						context.TODO(),
						fmtListEndpoint(projectID, applicationID),
						createDto,
					)
					assert.NoError(t, requestErr)
					assert.Equal(t, http.StatusCreated, response.StatusCode)
				},
			)
		}

		t.Run(
			"returns an error if the name of the prompt config is already used",
			func(t *testing.T) {
				_, promptConfigCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
						ApplicationID:             *uuidID,
						Name:                      "unique name",
						ModelVendor:               models.ModelVendorOPENAI,
						ModelType:                 models.ModelTypeGpt4,
						ModelParameters:           *modelParameters,
						ProviderPromptMessages:    *promptMessages,
						ExpectedTemplateVariables: []string{"userInput"},
						IsDefault:                 true,
					})
				assert.NoError(t, promptConfigCreateErr)

				createDto := dto.PromptConfigCreateDTO{
					Name:                   "unique name",
					ModelParameters:        modelParameters,
					ModelType:              models.ModelTypeGpt4,
					ModelVendor:            models.ModelVendorOPENAI,
					ProviderPromptMessages: promptMessages,
				}
				response, requestErr := testClient.Post(
					context.TODO(),
					fmtListEndpoint(projectID, applicationID),
					createDto,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)

		t.Run("rolls back transaction when failing to update record", func(t *testing.T) {
			defaultPromptConfig, promptConfigCreateErr := db.GetQueries().
				CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      "default prompt config",
					ModelVendor:               models.ModelVendorOPENAI,
					ModelType:                 models.ModelTypeGpt4,
					ModelParameters:           *modelParameters,
					ProviderPromptMessages:    *promptMessages,
					ExpectedTemplateVariables: []string{"userInput"},
					IsDefault:                 true,
				})
			assert.NoError(t, promptConfigCreateErr)

			createDto := dto.PromptConfigCreateDTO{
				Name:                   "default prompt config",
				ModelParameters:        modelParameters,
				ModelType:              models.ModelTypeGpt4,
				ModelVendor:            models.ModelVendorOPENAI,
				ProviderPromptMessages: promptMessages,
			}
			response, requestErr := testClient.Post(
				context.TODO(),
				fmtListEndpoint(projectID, applicationID),
				createDto,
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)

			retrievedPromptConfig, retrieveErr := db.GetQueries().
				RetrievePromptConfig(context.TODO(), defaultPromptConfig.ID)
			assert.NoError(t, retrieveErr)
			assert.True(t, retrievedPromptConfig.IsDefault)
		})

		t.Run("returns an error if the application id is invalid", func(t *testing.T) {
			response, requestErr := testClient.Post(
				context.TODO(),
				fmt.Sprintf("/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(
							api.PromptConfigListEndpoint,
							"{projectId}",
							projectID,
						),
						"{applicationId}",
						"invalid",
					),
				),
				dto.PromptConfigCreateDTO{
					Name:                   "test prompt config",
					ModelParameters:        modelParameters,
					ModelType:              models.ModelTypeGpt4,
					ModelVendor:            models.ModelVendorOPENAI,
					ProviderPromptMessages: promptMessages,
				},
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run("returns error if the request body is invalid", func(t *testing.T) {
			response, requestErr := testClient.Post(
				context.TODO(),
				fmtListEndpoint(projectID, applicationID),
				"invalid",
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run("responds with status 400 BAD REQUEST if projectID is invalid", func(t *testing.T) {
			response, requestErr := testClient.Post(
				context.TODO(),
				fmtListEndpoint("invalid", applicationID),
				dto.PromptConfigCreateDTO{
					Name:                   "test prompt config",
					ModelParameters:        modelParameters,
					ModelType:              models.ModelTypeGpt4,
					ModelVendor:            models.ModelVendorOPENAI,
					ProviderPromptMessages: promptMessages,
				},
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})
		t.Run(
			"responds with status 400 BAD REQUEST if applicationID is invalid",
			func(t *testing.T) {
				response, requestErr := testClient.Post(
					context.TODO(),
					fmtListEndpoint(projectID, "invalid"),
					dto.PromptConfigCreateDTO{
						Name:                   "test prompt config",
						ModelParameters:        modelParameters,
						ModelType:              models.ModelTypeGpt4,
						ModelVendor:            models.ModelVendorOPENAI,
						ProviderPromptMessages: promptMessages,
					},
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
	})

	t.Run(fmt.Sprintf("GET: %s", api.PromptConfigListEndpoint), func(t *testing.T) {
		applicationID := createApplication(t, projectID)
		uuidID, _ := db.StringToUUID(applicationID)

		t.Run("retrieves prompt configs for an application", func(t *testing.T) {
			firstPromptConfig, firstPromptConfigCreateErr := db.GetQueries().
				CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      "a",
					ModelVendor:               models.ModelVendorOPENAI,
					ModelType:                 models.ModelTypeGpt4,
					ModelParameters:           *modelParameters,
					ProviderPromptMessages:    *promptMessages,
					ExpectedTemplateVariables: []string{"name"},
					IsDefault:                 true,
				})
			assert.NoError(t, firstPromptConfigCreateErr)
			secondPromptConfig, secondPromptConfigCreateErr := db.GetQueries().
				CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      "b",
					ModelVendor:               models.ModelVendorOPENAI,
					ModelType:                 models.ModelTypeGpt4,
					ModelParameters:           *modelParameters,
					ProviderPromptMessages:    *promptMessages,
					ExpectedTemplateVariables: []string{"values"},
					IsDefault:                 true,
				})
			assert.NoError(t, secondPromptConfigCreateErr)

			response, responseErr := testClient.Get(
				context.TODO(),
				fmtListEndpoint(projectID, applicationID),
			)
			assert.NoError(t, responseErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			promptConfigs := make([]*datatypes.PromptConfigDTO, 0)
			deserializationErr := serialization.DeserializeJSON(response.Body, &promptConfigs)
			assert.NoError(t, deserializationErr)

			assert.Len(t, promptConfigs, 2)
			assert.Equal(t, firstPromptConfig.Name, promptConfigs[0].Name)
			assert.Equal(t, secondPromptConfig.Name, promptConfigs[1].Name)
		})

		t.Run("returns empty array when no prompt configs are found", func(t *testing.T) {
			appID := createApplication(t, projectID)

			response, responseErr := testClient.Get(
				context.TODO(),
				fmtListEndpoint(projectID, appID),
			)
			assert.NoError(t, responseErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			promptConfigs := make([]models.PromptConfig, 0)
			deserializationErr := serialization.DeserializeJSON(response.Body, &promptConfigs)
			assert.NoError(t, deserializationErr)

			assert.Len(t, promptConfigs, 0)
		})

		for _, permission := range []models.AccessPermissionType{
			models.AccessPermissionTypeMEMBER, models.AccessPermissionTypeADMIN,
		} {
			t.Run(
				fmt.Sprintf(
					"responds with status 200 OK if the user has %s permission",
					permission,
				),
				func(t *testing.T) {
					newUserAccount, _ := factories.CreateUserAccount(context.TODO())
					newProjectID := createProject(t)
					newApplicationID := createApplication(t, newProjectID)
					createUserProject(
						t,
						newUserAccount.FirebaseID,
						newProjectID,
						models.AccessPermissionTypeADMIN,
					)

					client := createTestClient(t, newUserAccount)

					response, requestErr := client.Get(
						context.TODO(),
						fmtListEndpoint(newProjectID, newApplicationID),
					)
					assert.NoError(t, requestErr)
					assert.Equal(t, http.StatusOK, response.StatusCode)
				},
			)
		}

		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {
				newUserAccount, _ := factories.CreateUserAccount(context.TODO())
				newProjectID := createProject(t)
				newApplicationID := createApplication(t, newProjectID)

				client := createTestClient(t, newUserAccount)

				response, requestErr := client.Get(
					context.TODO(),
					fmtListEndpoint(newProjectID, newApplicationID),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)

		t.Run("responds with status 400 BAD REQUEST if projectID is invalid", func(t *testing.T) {
			response, requestErr := testClient.Get(
				context.TODO(),
				fmtListEndpoint("invalid", applicationID),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run(
			"responds with status 400 BAD REQUEST if applicationID is invalid",
			func(t *testing.T) {
				response, requestErr := testClient.Get(
					context.TODO(),
					fmtListEndpoint(projectID, "invalid"),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
	})

	t.Run(fmt.Sprintf("PATCH: %s", api.PromptConfigSetDefaultEndpoint), func(t *testing.T) {
		fmtSetDefaultEndpoint := func(projectID string, applicationID string, promptConfigID string) string {
			return fmt.Sprintf(
				"/v1%s",
				strings.ReplaceAll(
					strings.ReplaceAll(
						strings.ReplaceAll(
							api.PromptConfigSetDefaultEndpoint,
							"{projectId}",
							projectID),
						"{applicationId}",
						applicationID),
					"{promptConfigId}",
					promptConfigID),
			)
		}
		t.Run("allows making a non-default prompt config default", func(t *testing.T) {
			applicationID := createApplication(t, projectID)
			uuidID, _ := db.StringToUUID(applicationID)

			defaultPromptConfig, defaultPromptConfigCreateErr := db.GetQueries().
				CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      factories.RandomString(10),
					ModelVendor:               models.ModelVendorOPENAI,
					ModelType:                 models.ModelTypeGpt4,
					ModelParameters:           *modelParameters,
					ProviderPromptMessages:    *promptMessages,
					ExpectedTemplateVariables: []string{""},
					IsDefault:                 true,
				})
			assert.NoError(t, defaultPromptConfigCreateErr)

			nonDefaultPromptConfig, nonDefaultPromptConfigCreateErr := db.GetQueries().
				CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      factories.RandomString(10),
					ModelVendor:               models.ModelVendorOPENAI,
					ModelType:                 models.ModelTypeGpt4,
					ModelParameters:           *modelParameters,
					ProviderPromptMessages:    *promptMessages,
					ExpectedTemplateVariables: []string{""},
					IsDefault:                 false,
				})
			assert.NoError(t, nonDefaultPromptConfigCreateErr)

			nonDefaultPromptConfigID := db.UUIDToString(&nonDefaultPromptConfig.ID)

			response, requestErr := testClient.Patch(
				context.TODO(),
				fmtSetDefaultEndpoint(projectID, applicationID, nonDefaultPromptConfigID),
				nil,
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			dbDefaultPromptConfig, retrivalErr := db.
				GetQueries().
				RetrievePromptConfig(context.TODO(), defaultPromptConfig.ID)

			assert.NoError(t, retrivalErr)
			assert.Equal(t, false, dbDefaultPromptConfig.IsDefault)

			dbNonDefaultPromptConfig, retrivalErr := db.
				GetQueries().
				RetrievePromptConfig(context.TODO(), nonDefaultPromptConfig.ID)

			assert.NoError(t, retrivalErr)
			assert.Equal(t, true, dbNonDefaultPromptConfig.IsDefault)
		})

		t.Run("invalidates prompt-config caches", func(t *testing.T) {
			applicationID := createApplication(t, projectID)
			uuidID, _ := db.StringToUUID(applicationID)

			defaultPromptConfig, defaultPromptConfigCreateErr := db.GetQueries().
				CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      factories.RandomString(10),
					ModelVendor:               models.ModelVendorOPENAI,
					ModelType:                 models.ModelTypeGpt4,
					ModelParameters:           *modelParameters,
					ProviderPromptMessages:    *promptMessages,
					ExpectedTemplateVariables: []string{""},
					IsDefault:                 true,
				})
			assert.NoError(t, defaultPromptConfigCreateErr)

			nonDefaultPromptConfig, nonDefaultPromptConfigCreateErr := db.GetQueries().
				CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      factories.RandomString(10),
					ModelVendor:               models.ModelVendorOPENAI,
					ModelType:                 models.ModelTypeGpt4,
					ModelParameters:           *modelParameters,
					ProviderPromptMessages:    *promptMessages,
					ExpectedTemplateVariables: []string{""},
					IsDefault:                 false,
				})
			assert.NoError(t, nonDefaultPromptConfigCreateErr)

			nonDefaultPromptConfigID := db.UUIDToString(&nonDefaultPromptConfig.ID)

			cacheKeys := []string{
				fmt.Sprintf("%s:%s", applicationID, db.UUIDToString(&defaultPromptConfig.ID)),
				fmt.Sprintf("%s:%s", applicationID, nonDefaultPromptConfigID),
				applicationID,
			}

			for _, cacheKey := range cacheKeys {
				redisDB.Set(context.TODO(), cacheKey, "test", 0)
				redisMock.ExpectDel(cacheKey).SetVal(1)
			}

			response, requestErr := testClient.Patch(
				context.TODO(),
				fmtSetDefaultEndpoint(projectID, applicationID, nonDefaultPromptConfigID),
				nil,
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			time.Sleep(testutils.GetSleepTimeout())

			assert.NoError(t, redisMock.ExpectationsWereMet())
		})

		t.Run(
			"responds with status 401 UNAUTHORIZED if the user does not have ADMIN permission",
			func(t *testing.T) {
				applicationID := createApplication(t, projectID)
				uuidID, _ := db.StringToUUID(applicationID)

				_, defaultPromptConfigCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
						ApplicationID:             *uuidID,
						Name:                      factories.RandomString(10),
						ModelVendor:               models.ModelVendorOPENAI,
						ModelType:                 models.ModelTypeGpt4,
						ModelParameters:           *modelParameters,
						ProviderPromptMessages:    *promptMessages,
						ExpectedTemplateVariables: []string{""},
						IsDefault:                 true,
					})
				assert.NoError(t, defaultPromptConfigCreateErr)

				nonDefaultPromptConfig, nonDefaultPromptConfigCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
						ApplicationID:             *uuidID,
						Name:                      factories.RandomString(10),
						ModelVendor:               models.ModelVendorOPENAI,
						ModelType:                 models.ModelTypeGpt4,
						ModelParameters:           *modelParameters,
						ProviderPromptMessages:    *promptMessages,
						ExpectedTemplateVariables: []string{""},
						IsDefault:                 false,
					})
				assert.NoError(t, nonDefaultPromptConfigCreateErr)

				nonDefaultPromptConfigID := db.UUIDToString(&nonDefaultPromptConfig.ID)

				newUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					newUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeMEMBER,
				)

				client := createTestClient(t, newUserAccount)

				response, requestErr := client.Patch(
					context.TODO(),
					fmtSetDefaultEndpoint(projectID, applicationID, nonDefaultPromptConfigID),
					nil,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusUnauthorized, response.StatusCode)
			},
		)

		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {
				newProjectID := createProject(t)
				applicationID := createApplication(t, newProjectID)
				uuidID, _ := db.StringToUUID(applicationID)

				_, defaultPromptConfigCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
						ApplicationID:             *uuidID,
						Name:                      factories.RandomString(10),
						ModelVendor:               models.ModelVendorOPENAI,
						ModelType:                 models.ModelTypeGpt4,
						ModelParameters:           *modelParameters,
						ProviderPromptMessages:    *promptMessages,
						ExpectedTemplateVariables: []string{""},
						IsDefault:                 true,
					})
				assert.NoError(t, defaultPromptConfigCreateErr)

				nonDefaultPromptConfig, nonDefaultPromptConfigCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
						ApplicationID:             *uuidID,
						Name:                      factories.RandomString(10),
						ModelVendor:               models.ModelVendorOPENAI,
						ModelType:                 models.ModelTypeGpt4,
						ModelParameters:           *modelParameters,
						ProviderPromptMessages:    *promptMessages,
						ExpectedTemplateVariables: []string{""},
						IsDefault:                 false,
					})
				assert.NoError(t, nonDefaultPromptConfigCreateErr)

				nonDefaultPromptConfigID := db.UUIDToString(&nonDefaultPromptConfig.ID)

				newUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					newUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeMEMBER,
				)

				client := createTestClient(t, newUserAccount)

				response, requestErr := client.Patch(
					context.TODO(),
					fmtSetDefaultEndpoint(newProjectID, applicationID, nonDefaultPromptConfigID),
					nil,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)

		t.Run(
			"responds with 400 BAD REQUEST when trying to set the default prompt config as default",
			func(t *testing.T) {
				applicationID := createApplication(t, projectID)
				uuidID, _ := db.StringToUUID(applicationID)

				defaultPromptConfig, defaultPromptConfigCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
						ApplicationID:             *uuidID,
						Name:                      "default prompt config",
						ModelVendor:               models.ModelVendorOPENAI,
						ModelType:                 models.ModelTypeGpt4,
						ModelParameters:           *modelParameters,
						ProviderPromptMessages:    *promptMessages,
						ExpectedTemplateVariables: []string{""},
						IsDefault:                 true,
					})

				assert.NoError(t, defaultPromptConfigCreateErr)

				defaultPromptConfigID := db.UUIDToString(&defaultPromptConfig.ID)

				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtSetDefaultEndpoint(projectID, applicationID, defaultPromptConfigID),
					nil,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)

				dbDefaultPromptConfig, retrivalErr := db.
					GetQueries().
					RetrievePromptConfig(context.TODO(), defaultPromptConfig.ID)

				assert.NoError(t, retrivalErr)
				assert.Equal(t, true, dbDefaultPromptConfig.IsDefault)
			},
		)

		t.Run("responds with status 400 BAD REQUEST if projectID is invalid", func(t *testing.T) {
			applicationID := createApplication(t, projectID)

			uuidID, _ := db.StringToUUID(applicationID)
			promptConfig, _ := factories.CreatePromptConfig(context.TODO(), *uuidID)
			promptConfigID := db.UUIDToString(&promptConfig.ID)

			response, requestErr := testClient.Patch(
				context.TODO(),
				fmtSetDefaultEndpoint("invalid", applicationID, promptConfigID),
				nil,
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run(
			"responds with status 400 BAD REQUEST if applicationID is invalid",
			func(t *testing.T) {
				applicationID := createApplication(t, projectID)

				uuidID, _ := db.StringToUUID(applicationID)
				promptConfig, _ := factories.CreatePromptConfig(context.TODO(), *uuidID)
				promptConfigID := db.UUIDToString(&promptConfig.ID)

				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtSetDefaultEndpoint(projectID, "invalid", promptConfigID),
					nil,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)

		t.Run(
			"responds with status 400 BAD REQUEST if promptConfigID is invalid",
			func(t *testing.T) {
				applicationID := createApplication(t, projectID)

				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtSetDefaultEndpoint(projectID, applicationID, "invalid"),
					nil,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
	})

	t.Run(fmt.Sprintf("PATCH: %s", api.PromptConfigDetailEndpoint), func(t *testing.T) {
		t.Run("updates a prompt config's name", func(t *testing.T) {
			applicationID := createApplication(t, projectID)
			uuidID, _ := db.StringToUUID(applicationID)

			promptConfigToRename, configCreateErr := db.GetQueries().
				CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      "abc prompt config",
					ModelVendor:               models.ModelVendorOPENAI,
					ModelType:                 models.ModelTypeGpt4,
					ModelParameters:           *modelParameters,
					ProviderPromptMessages:    *promptMessages,
					ExpectedTemplateVariables: []string{""},
					IsDefault:                 true,
				})

			assert.NoError(t, configCreateErr)

			promptConfigToRenameID := db.UUIDToString(&promptConfigToRename.ID)

			newName := "efg prompt config"
			response, requestErr := testClient.Patch(
				context.TODO(),
				fmtDetailEndpoint(projectID, applicationID, promptConfigToRenameID),
				dto.PromptConfigUpdateDTO{
					Name: &newName,
				})
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			dbPromptConfig, retrivalErr := db.GetQueries().
				RetrievePromptConfig(context.TODO(), promptConfigToRename.ID)
			assert.NoError(t, retrivalErr)
			assert.Equal(t, newName, dbPromptConfig.Name)
		})

		t.Run(
			"responds with status 401 UNAUTHORIZED if the user does not have ADMIN permission",
			func(t *testing.T) {
				applicationID := createApplication(t, projectID)
				uuidID, _ := db.StringToUUID(applicationID)

				promptConfigToRename, configCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
						ApplicationID:             *uuidID,
						Name:                      "abc prompt config",
						ModelVendor:               models.ModelVendorOPENAI,
						ModelType:                 models.ModelTypeGpt4,
						ModelParameters:           *modelParameters,
						ProviderPromptMessages:    *promptMessages,
						ExpectedTemplateVariables: []string{""},
						IsDefault:                 true,
					})

				assert.NoError(t, configCreateErr)

				promptConfigToRenameID := db.UUIDToString(&promptConfigToRename.ID)

				newName := "efg prompt config"
				newUserAccount, _ := factories.CreateUserAccount(context.TODO())
				createUserProject(
					t,
					newUserAccount.FirebaseID,
					projectID,
					models.AccessPermissionTypeMEMBER,
				)

				client := createTestClient(t, newUserAccount)

				response, requestErr := client.Patch(
					context.TODO(),
					fmtDetailEndpoint(projectID, applicationID, promptConfigToRenameID),
					dto.PromptConfigUpdateDTO{
						Name: &newName,
					})
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusUnauthorized, response.StatusCode)
			},
		)

		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {
				newProjectID := createProject(t)
				applicationID := createApplication(t, newProjectID)
				uuidID, _ := db.StringToUUID(applicationID)

				promptConfigToRename, configCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
						ApplicationID:             *uuidID,
						Name:                      "abc prompt config",
						ModelVendor:               models.ModelVendorOPENAI,
						ModelType:                 models.ModelTypeGpt4,
						ModelParameters:           *modelParameters,
						ProviderPromptMessages:    *promptMessages,
						ExpectedTemplateVariables: []string{""},
						IsDefault:                 true,
					})

				assert.NoError(t, configCreateErr)

				promptConfigToRenameID := db.UUIDToString(&promptConfigToRename.ID)

				newName := "efg prompt config"

				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtDetailEndpoint(newProjectID, applicationID, promptConfigToRenameID),
					dto.PromptConfigUpdateDTO{
						Name: &newName,
					})
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)

		t.Run(
			"responds with 400 BAD REQUEST when the request body is invalid",
			func(t *testing.T) {
				applicationID := createApplication(t, projectID)
				uuidID, _ := db.StringToUUID(applicationID)

				promptConfig, configCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
						ApplicationID:             *uuidID,
						Name:                      factories.RandomString(10),
						ModelVendor:               models.ModelVendorOPENAI,
						ModelType:                 models.ModelTypeGpt4,
						ModelParameters:           *modelParameters,
						ProviderPromptMessages:    *promptMessages,
						ExpectedTemplateVariables: []string{""},
						IsDefault:                 true,
					})
				assert.NoError(t, configCreateErr)

				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtDetailEndpoint(projectID, applicationID, db.UUIDToString(&promptConfig.ID)),
					"invalid",
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)

		t.Run(
			"responds with 400 BAD REQUEST when duplicating a prompt config's name",
			func(t *testing.T) {
				applicationID := createApplication(t, projectID)
				uuidID, _ := db.StringToUUID(applicationID)

				firstPromptConfig, configCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
						ApplicationID:             *uuidID,
						Name:                      factories.RandomString(10),
						ModelVendor:               models.ModelVendorOPENAI,
						ModelType:                 models.ModelTypeGpt4,
						ModelParameters:           *modelParameters,
						ProviderPromptMessages:    *promptMessages,
						ExpectedTemplateVariables: []string{""},
						IsDefault:                 true,
					})
				assert.NoError(t, configCreateErr)

				newPromptConfig, configCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
						ApplicationID:             *uuidID,
						Name:                      factories.RandomString(10),
						ModelVendor:               models.ModelVendorOPENAI,
						ModelType:                 models.ModelTypeGpt4,
						ModelParameters:           *modelParameters,
						ProviderPromptMessages:    *promptMessages,
						ExpectedTemplateVariables: []string{""},
						IsDefault:                 false,
					})
				assert.NoError(t, configCreateErr)

				newPromptConfigID := db.UUIDToString(&newPromptConfig.ID)

				newName := firstPromptConfig.Name
				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtDetailEndpoint(projectID, applicationID, newPromptConfigID),
					dto.PromptConfigUpdateDTO{
						Name: &newName,
					})
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)

		t.Run("updates a prompt config's model type", func(t *testing.T) {
			applicationID := createApplication(t, projectID)
			uuidID, _ := db.StringToUUID(applicationID)

			promptConfigToRename, configCreateErr := db.GetQueries().
				CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      "abc prompt config",
					ModelVendor:               models.ModelVendorOPENAI,
					ModelType:                 models.ModelTypeGpt4,
					ModelParameters:           *modelParameters,
					ProviderPromptMessages:    *promptMessages,
					ExpectedTemplateVariables: []string{""},
					IsDefault:                 true,
				})

			assert.NoError(t, configCreateErr)

			promptConfigToRenameID := db.UUIDToString(&promptConfigToRename.ID)

			newModel := models.ModelTypeGpt35Turbo
			response, requestErr := testClient.Patch(
				context.TODO(),
				fmtDetailEndpoint(projectID, applicationID, promptConfigToRenameID),
				dto.PromptConfigUpdateDTO{
					ModelType: &newModel,
				})
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			dbPromptConfig, retrivalErr := db.GetQueries().
				RetrievePromptConfig(context.TODO(), promptConfigToRename.ID)
			assert.NoError(t, retrivalErr)
			assert.Equal(t, newModel, dbPromptConfig.ModelType)
		})

		t.Run("responds with 400 BAD REQUEST for invalid model type", func(t *testing.T) {
			applicationID := createApplication(t, projectID)
			uuidID, _ := db.StringToUUID(applicationID)

			promptConfigToRename, configCreateErr := db.GetQueries().
				CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      "abc prompt config",
					ModelVendor:               models.ModelVendorOPENAI,
					ModelType:                 models.ModelTypeGpt4,
					ModelParameters:           *modelParameters,
					ProviderPromptMessages:    *promptMessages,
					ExpectedTemplateVariables: []string{""},
					IsDefault:                 true,
				})

			assert.NoError(t, configCreateErr)

			promptConfigToRenameID := db.UUIDToString(&promptConfigToRename.ID)

			newModel := models.ModelType("nope")
			response, requestErr := testClient.Patch(
				context.TODO(),
				fmtDetailEndpoint(projectID, applicationID, promptConfigToRenameID),
				dto.PromptConfigUpdateDTO{
					ModelType: &newModel,
				})
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run("updates a prompt config's model parameters", func(t *testing.T) {
			applicationID := createApplication(t, projectID)
			uuidID, _ := db.StringToUUID(applicationID)

			promptConfigToRename, configCreateErr := db.GetQueries().
				CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      factories.RandomString(10),
					ModelVendor:               models.ModelVendorOPENAI,
					ModelType:                 models.ModelTypeGpt4,
					ModelParameters:           *modelParameters,
					ProviderPromptMessages:    *promptMessages,
					ExpectedTemplateVariables: []string{""},
					IsDefault:                 true,
				})

			assert.NoError(t, configCreateErr)

			promptConfigToRenameID := db.UUIDToString(&promptConfigToRename.ID)

			newModelParameters := ptr.To(
				json.RawMessage(serialization.SerializeJSON(map[string]float32{
					"temperature":       2,
					"top_p":             2,
					"max_tokens":        2,
					"presence_penalty":  2,
					"frequency_penalty": 2,
				})),
			)

			response, requestErr := testClient.Patch(
				context.TODO(),
				fmtDetailEndpoint(projectID, applicationID, promptConfigToRenameID),
				dto.PromptConfigUpdateDTO{
					ModelParameters: newModelParameters,
				})
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			dbPromptConfig, retrivalErr := db.GetQueries().
				RetrievePromptConfig(context.TODO(), promptConfigToRename.ID)
			assert.NoError(t, retrivalErr)
			assert.Equal(t, []byte(*newModelParameters), dbPromptConfig.ModelParameters)
		})

		t.Run("invalidates prompt-config cache", func(t *testing.T) {
			applicationID := createApplication(t, projectID)
			uuidID, _ := db.StringToUUID(applicationID)

			promptConfig, configCreateErr := db.GetQueries().
				CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      factories.RandomString(10),
					ModelVendor:               models.ModelVendorOPENAI,
					ModelType:                 models.ModelTypeGpt4,
					ModelParameters:           *modelParameters,
					ProviderPromptMessages:    *promptMessages,
					ExpectedTemplateVariables: []string{""},
					IsDefault:                 true,
				})

			assert.NoError(t, configCreateErr)
			cacheKey := fmt.Sprintf("%s:%s", applicationID, db.UUIDToString(&promptConfig.ID))
			redisDB.Set(context.TODO(), cacheKey, "test", 0)
			redisMock.ExpectDel(cacheKey).SetVal(1)

			response, requestErr := testClient.Patch(
				context.TODO(),
				fmtDetailEndpoint(projectID, applicationID, db.UUIDToString(&promptConfig.ID)),
				dto.PromptConfigUpdateDTO{})
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			time.Sleep(testutils.GetSleepTimeout())

			assert.NoError(t, redisMock.ExpectationsWereMet())
		})

		t.Run("responds with status 400 BAD REQUEST if projectID is invalid", func(t *testing.T) {
			applicationID := createApplication(t, projectID)

			uuidID, _ := db.StringToUUID(applicationID)
			promptConfig, _ := factories.CreatePromptConfig(context.TODO(), *uuidID)
			promptConfigID := db.UUIDToString(&promptConfig.ID)

			name := "new name"
			response, requestErr := testClient.Patch(
				context.TODO(),
				fmtDetailEndpoint("invalid", applicationID, promptConfigID),
				dto.PromptConfigUpdateDTO{
					Name: &name,
				})
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run(
			"responds with status 400 BAD REQUEST if applicationID is invalid",
			func(t *testing.T) {
				applicationID := createApplication(t, projectID)

				uuidID, _ := db.StringToUUID(applicationID)
				promptConfig, _ := factories.CreatePromptConfig(context.TODO(), *uuidID)
				promptConfigID := db.UUIDToString(&promptConfig.ID)

				name := "new name"
				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtDetailEndpoint(projectID, "invalid", promptConfigID),
					dto.PromptConfigUpdateDTO{
						Name: &name,
					})
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)

		t.Run(
			"responds with status 400 BAD REQUEST if promptConfigID is invalid",
			func(t *testing.T) {
				applicationID := createApplication(t, projectID)

				name := "new name"
				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtDetailEndpoint(projectID, applicationID, "invalid"),
					dto.PromptConfigUpdateDTO{
						Name: &name,
					})
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
	})

	t.Run(fmt.Sprintf("DELETE: %s", api.PromptConfigDetailEndpoint), func(t *testing.T) {
		t.Run("deletes a prompt config if its not default", func(t *testing.T) {
			applicationID := createApplication(t, projectID)
			uuidID, _ := db.StringToUUID(applicationID)

			promptConfig, configCreateErr := db.GetQueries().
				CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      factories.RandomString(10),
					ModelVendor:               models.ModelVendorOPENAI,
					ModelType:                 models.ModelTypeGpt4,
					ModelParameters:           *modelParameters,
					ProviderPromptMessages:    *promptMessages,
					ExpectedTemplateVariables: []string{""},
					IsDefault:                 false,
				})
			assert.NoError(t, configCreateErr)

			response, requestErr := testClient.Delete(
				context.TODO(),
				fmtDetailEndpoint(projectID, applicationID, db.UUIDToString(&promptConfig.ID)),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusNoContent, response.StatusCode)

			_, retrivalErr := db.GetQueries().
				RetrievePromptConfig(context.TODO(), promptConfig.ID)
			assert.Error(t, retrivalErr)
		})

		t.Run("invalidates prompt-config cache", func(t *testing.T) {
			applicationID := createApplication(t, projectID)
			uuidID, _ := db.StringToUUID(applicationID)

			promptConfig, configCreateErr := db.GetQueries().
				CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      factories.RandomString(10),
					ModelVendor:               models.ModelVendorOPENAI,
					ModelType:                 models.ModelTypeGpt4,
					ModelParameters:           *modelParameters,
					ProviderPromptMessages:    *promptMessages,
					ExpectedTemplateVariables: []string{""},
					IsDefault:                 false,
				})
			assert.NoError(t, configCreateErr)

			cacheKey := fmt.Sprintf("%s:%s", applicationID, db.UUIDToString(&promptConfig.ID))
			redisDB.Set(context.TODO(), cacheKey, "test", 0)
			redisMock.ExpectDel(cacheKey).SetVal(1)

			response, requestErr := testClient.Delete(
				context.TODO(),
				fmtDetailEndpoint(projectID, applicationID, db.UUIDToString(&promptConfig.ID)),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusNoContent, response.StatusCode)

			time.Sleep(testutils.GetSleepTimeout())

			assert.NoError(t, redisMock.ExpectationsWereMet())
		})

		t.Run(
			"responds with status 401 UNAUTHORIZED if the user does not have ADMIN permission",
			func(t *testing.T) {
				applicationID := createApplication(t, projectID)
				uuidID, _ := db.StringToUUID(applicationID)

				promptConfig, configCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
						ApplicationID:             *uuidID,
						Name:                      factories.RandomString(10),
						ModelVendor:               models.ModelVendorOPENAI,
						ModelType:                 models.ModelTypeGpt4,
						ModelParameters:           *modelParameters,
						ProviderPromptMessages:    *promptMessages,
						ExpectedTemplateVariables: []string{""},
						IsDefault:                 false,
					})
				assert.NoError(t, configCreateErr)

				response, requestErr := testClient.Delete(
					context.TODO(),
					fmtDetailEndpoint(projectID, applicationID, db.UUIDToString(&promptConfig.ID)),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusNoContent, response.StatusCode)

				_, retrivalErr := db.GetQueries().
					RetrievePromptConfig(context.TODO(), promptConfig.ID)
				assert.Error(t, retrivalErr)
			},
		)

		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {
				newProjectID := createProject(t)
				applicationID := createApplication(t, newProjectID)
				uuidID, _ := db.StringToUUID(applicationID)

				promptConfig, configCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
						ApplicationID:             *uuidID,
						Name:                      factories.RandomString(10),
						ModelVendor:               models.ModelVendorOPENAI,
						ModelType:                 models.ModelTypeGpt4,
						ModelParameters:           *modelParameters,
						ProviderPromptMessages:    *promptMessages,
						ExpectedTemplateVariables: []string{""},
						IsDefault:                 false,
					})
				assert.NoError(t, configCreateErr)

				response, requestErr := testClient.Delete(
					context.TODO(),
					fmtDetailEndpoint(
						newProjectID,
						applicationID,
						db.UUIDToString(&promptConfig.ID),
					),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)

				_, retrivalErr := db.GetQueries().
					RetrievePromptConfig(context.TODO(), promptConfig.ID)
				assert.NoError(t, retrivalErr)
			},
		)

		t.Run(
			"responds with 400 BAD REQUEST when deleting a default prompt config",
			func(t *testing.T) {
				applicationID := createApplication(t, projectID)
				uuidID, _ := db.StringToUUID(applicationID)

				promptConfig, configCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), models.CreatePromptConfigParams{
						ApplicationID:             *uuidID,
						Name:                      factories.RandomString(10),
						ModelVendor:               models.ModelVendorOPENAI,
						ModelType:                 models.ModelTypeGpt4,
						ModelParameters:           *modelParameters,
						ProviderPromptMessages:    *promptMessages,
						ExpectedTemplateVariables: []string{""},
						IsDefault:                 true,
					})
				assert.NoError(t, configCreateErr)

				response, requestErr := testClient.Delete(
					context.TODO(),
					fmtDetailEndpoint(projectID, applicationID, db.UUIDToString(&promptConfig.ID)),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)

				_, retrivalErr := db.GetQueries().
					RetrievePromptConfig(context.TODO(), promptConfig.ID)
				assert.NoError(t, retrivalErr)
			},
		)

		t.Run("responds with status 400 BAD REQUEST if projectID is invalid", func(t *testing.T) {
			applicationID := createApplication(t, projectID)

			uuidID, _ := db.StringToUUID(applicationID)
			promptConfig, _ := factories.CreatePromptConfig(context.TODO(), *uuidID)
			promptConfigID := db.UUIDToString(&promptConfig.ID)

			response, requestErr := testClient.Delete(
				context.TODO(),
				fmtDetailEndpoint("invalid", applicationID, promptConfigID),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run(
			"responds with status 400 BAD REQUEST if applicationID is invalid",
			func(t *testing.T) {
				applicationID := createApplication(t, projectID)

				uuidID, _ := db.StringToUUID(applicationID)
				promptConfig, _ := factories.CreatePromptConfig(context.TODO(), *uuidID)
				promptConfigID := db.UUIDToString(&promptConfig.ID)

				response, requestErr := testClient.Delete(
					context.TODO(),
					fmtDetailEndpoint(projectID, "invalid", promptConfigID),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)

		t.Run(
			"responds with status 400 BAD REQUEST if promptConfigID is invalid",
			func(t *testing.T) {
				applicationID := createApplication(t, projectID)

				response, requestErr := testClient.Delete(
					context.TODO(),
					fmtDetailEndpoint(projectID, applicationID, "invalid"),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)

		t.Run(
			"responds with status 400 BAD REQUEST if prompt config does not exist",
			func(t *testing.T) {
				applicationID := createApplication(t, projectID)

				response, requestErr := testClient.Delete(
					context.TODO(),
					fmtDetailEndpoint(
						projectID,
						applicationID,
						"00000000-0000-0000-0000-000000000000",
					),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
	})

	t.Run(fmt.Sprintf("GET: %s", api.PromptConfigAnalyticsEndpoint), func(t *testing.T) {
		invalidUUID := "invalid"
		projectID := createProject(t)
		createUserProject(t, userAccount.FirebaseID, projectID, models.AccessPermissionTypeADMIN)

		applicationID := createApplication(t, projectID)
		promptConfigID := createPromptConfig(t, applicationID)
		createPromptRequestRecord(t, promptConfigID)

		fromDate := time.Now().AddDate(0, 0, -1)
		toDate := fromDate.AddDate(0, 0, 2)

		t.Run("retrieves prompt config analytics", func(t *testing.T) {
			response, requestErr := testClient.Get(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(
							strings.ReplaceAll(
								api.PromptConfigAnalyticsEndpoint,
								"{projectId}",
								projectID,
							),
							"{applicationId}",
							applicationID,
						),
						"{promptConfigId}",
						promptConfigID,
					),
				),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			promptConfigUUID, _ := db.StringToUUID(promptConfigID)
			promptReqAnalytics := repositories.GetPromptConfigAnalyticsByDateRange(
				context.TODO(),
				*promptConfigUUID,
				fromDate,
				toDate,
			)

			responseAnalytics := dto.AnalyticsDTO{}
			deserializationErr := serialization.DeserializeJSON(
				response.Body,
				&responseAnalytics,
			)

			assert.NoError(t, deserializationErr)
			assert.Equal(
				t,
				promptReqAnalytics.TotalAPICalls,
				responseAnalytics.TotalAPICalls,
			)
			assert.Equal(t, promptReqAnalytics.TokenCost, responseAnalytics.TokenCost)
		})

		for _, permission := range []models.AccessPermissionType{
			models.AccessPermissionTypeMEMBER, models.AccessPermissionTypeADMIN,
		} {
			t.Run(
				fmt.Sprintf(
					"responds with status 200 OK if the user has %s permission",
					permission,
				),
				func(t *testing.T) {
					newUserAccount, _ := factories.CreateUserAccount(context.TODO())
					newProjectID := createProject(t)
					createUserProject(t, newUserAccount.FirebaseID, newProjectID, permission)

					newTestClient := createTestClient(t, newUserAccount)

					response, requestErr := newTestClient.Get(
						context.TODO(),
						fmt.Sprintf(
							"/v1%s",
							strings.ReplaceAll(
								strings.ReplaceAll(
									strings.ReplaceAll(
										api.PromptConfigAnalyticsEndpoint,
										"{projectId}",
										newProjectID,
									),
									"{applicationId}",
									applicationID,
								),
								"{promptConfigId}",
								promptConfigID,
							),
						),
					)
					assert.NoError(t, requestErr)
					assert.Equal(t, http.StatusOK, response.StatusCode)
				},
			)
		}

		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {
				newProjectID := createProject(t)

				response, requestErr := testClient.Get(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							strings.ReplaceAll(
								strings.ReplaceAll(
									api.PromptConfigAnalyticsEndpoint,
									"{projectId}",
									newProjectID,
								),
								"{applicationId}",
								applicationID,
							),
							"{promptConfigId}",
							promptConfigID,
						),
					),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)

		t.Run("responds with status 400 BAD REQUEST if projectID is invalid", func(t *testing.T) {
			response, requestErr := testClient.Get(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						strings.ReplaceAll(
							strings.ReplaceAll(
								api.PromptConfigAnalyticsEndpoint,
								"{projectId}",
								invalidUUID,
							),
							"{applicationId}",
							applicationID,
						),
						"{promptConfigId}",
						promptConfigID,
					),
				),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run(
			"responds with status 400 BAD REQUEST if applicationID is invalid",
			func(t *testing.T) {
				response, requestErr := testClient.Get(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							strings.ReplaceAll(
								strings.ReplaceAll(
									api.PromptConfigAnalyticsEndpoint,
									"{projectId}",
									projectID,
								),
								"{applicationId}",
								invalidUUID,
							),
							"{promptConfigId}",
							promptConfigID,
						),
					),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)

		t.Run(
			"responds with status 400 BAD REQUEST if promptConfigID is invalid",
			func(t *testing.T) {
				response, requestErr := testClient.Get(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							strings.ReplaceAll(
								strings.ReplaceAll(
									api.PromptConfigAnalyticsEndpoint,
									"{projectId}",
									projectID,
								),
								"{applicationId}",
								applicationID,
							),
							"{promptConfigId}",
							invalidUUID,
						),
					),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)
	})
}
