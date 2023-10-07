package api_test

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/stretchr/testify/assert"
	"net/http"
	"strings"
	"testing"
)

func TestPromptConfigAPI(t *testing.T) { //nolint: revive
	projectID := createProject(t)
	firebaseID := factories.RandomString(10)
	testClient := createTestClient(t, firebaseID)
	systemMessages := "You are a chatbot."
	userMessage := "Please write a song about {subject}."
	templateVariables := []string{"subject"}

	promptMessages, promptMessagesErr := factories.CreateOpenAIPromptMessages(
		systemMessages,
		userMessage,
		&templateVariables,
	)
	assert.NoError(t, promptMessagesErr)

	modelParameters, modelParametersErr := factories.CreateModelParameters()
	assert.NoError(t, modelParametersErr)

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

	t.Run(fmt.Sprintf("POST: %s", api.PromptConfigListEndpoint), func(t *testing.T) {
		applicationID := createApplication(t, projectID)
		uuidID, _ := db.StringToUUID(applicationID)

		t.Run("creates a new prompt config", func(t *testing.T) {
			createDto := dto.PromptConfigCreateDTO{
				Name:                   "test prompt config",
				ModelParameters:        modelParameters,
				ModelType:              db.ModelTypeGpt4,
				ModelVendor:            db.ModelVendorOPENAI,
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

		t.Run("returns bad request for validation errors", func(t *testing.T) {
			failureTestCases := []struct {
				Name string
				Dto  dto.PromptConfigCreateDTO
			}{
				{
					Name: "fails validation for missing name",
					Dto: dto.PromptConfigCreateDTO{
						ModelParameters:        modelParameters,
						ModelType:              db.ModelTypeGpt4,
						ModelVendor:            db.ModelVendorOPENAI,
						ProviderPromptMessages: promptMessages,
					},
				},
				{
					Name: "fails validation for missing model parameters",
					Dto: dto.PromptConfigCreateDTO{
						Name:                   "test prompt config",
						ModelType:              db.ModelTypeGpt4,
						ModelVendor:            db.ModelVendorOPENAI,
						ProviderPromptMessages: promptMessages,
					},
				},
				{
					Name: "fails validation for missing model type",
					Dto: dto.PromptConfigCreateDTO{
						Name:                   "test prompt config",
						ModelParameters:        modelParameters,
						ModelVendor:            db.ModelVendorOPENAI,
						ProviderPromptMessages: promptMessages,
					},
				},
				{
					Name: "fails validation for missing model vendor",
					Dto: dto.PromptConfigCreateDTO{
						Name:                   "test prompt config",
						ModelType:              db.ModelTypeGpt4,
						ModelParameters:        modelParameters,
						ProviderPromptMessages: promptMessages,
					},
				},
				{
					Name: "fails validation for missing prompt messages",
					Dto: dto.PromptConfigCreateDTO{
						Name:            "test prompt config",
						ModelParameters: modelParameters,
						ModelType:       db.ModelTypeGpt4,
						ModelVendor:     db.ModelVendorOPENAI,
					},
				},
				{
					Name: "fails validation for wrong model type",
					Dto: dto.PromptConfigCreateDTO{
						Name:                   "test prompt config",
						ModelParameters:        modelParameters,
						ModelType:              "abc",
						ModelVendor:            db.ModelVendorOPENAI,
						ProviderPromptMessages: promptMessages,
					},
				},
				{
					Name: "fails validation for wrong model vendor",
					Dto: dto.PromptConfigCreateDTO{
						Name:                   "test prompt config",
						ModelParameters:        modelParameters,
						ModelType:              db.ModelTypeGpt432k,
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

		for i, modelType := range []db.ModelType{db.ModelTypeGpt35Turbo, db.ModelTypeGpt35Turbo16k, db.ModelTypeGpt4, db.ModelTypeGpt432k} {
			t.Run(
				fmt.Sprintf("validates successfully model type %s", modelType),
				func(t *testing.T) {
					createDto := dto.PromptConfigCreateDTO{
						Name:                   fmt.Sprintf("test prompt config: %d", i),
						ModelParameters:        modelParameters,
						ModelType:              modelType,
						ModelVendor:            db.ModelVendorOPENAI,
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
					CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
						ApplicationID:             *uuidID,
						Name:                      "unique name",
						ModelVendor:               db.ModelVendorOPENAI,
						ModelType:                 db.ModelTypeGpt4,
						ModelParameters:           modelParameters,
						ProviderPromptMessages:    promptMessages,
						ExpectedTemplateVariables: []string{"userInput"},
						IsDefault:                 true,
					})
				assert.NoError(t, promptConfigCreateErr)

				createDto := dto.PromptConfigCreateDTO{
					Name:                   "unique name",
					ModelParameters:        modelParameters,
					ModelType:              db.ModelTypeGpt4,
					ModelVendor:            db.ModelVendorOPENAI,
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
				CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      "default prompt config",
					ModelVendor:               db.ModelVendorOPENAI,
					ModelType:                 db.ModelTypeGpt4,
					ModelParameters:           modelParameters,
					ProviderPromptMessages:    promptMessages,
					ExpectedTemplateVariables: []string{"userInput"},
					IsDefault:                 true,
				})
			assert.NoError(t, promptConfigCreateErr)

			createDto := dto.PromptConfigCreateDTO{
				Name:                   "default prompt config",
				ModelParameters:        modelParameters,
				ModelType:              db.ModelTypeGpt4,
				ModelVendor:            db.ModelVendorOPENAI,
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
				FindPromptConfigByID(context.Background(), defaultPromptConfig.ID)
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
					ModelType:              db.ModelTypeGpt4,
					ModelVendor:            db.ModelVendorOPENAI,
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
					ModelType:              db.ModelTypeGpt4,
					ModelVendor:            db.ModelVendorOPENAI,
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
						ModelType:              db.ModelTypeGpt4,
						ModelVendor:            db.ModelVendorOPENAI,
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
				CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      "a",
					ModelVendor:               db.ModelVendorOPENAI,
					ModelType:                 db.ModelTypeGpt4,
					ModelParameters:           modelParameters,
					ProviderPromptMessages:    promptMessages,
					ExpectedTemplateVariables: []string{"name"},
					IsDefault:                 true,
				})
			assert.NoError(t, firstPromptConfigCreateErr)
			secondPromptConfig, secondPromptConfigCreateErr := db.GetQueries().
				CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      "b",
					ModelVendor:               db.ModelVendorOPENAI,
					ModelType:                 db.ModelTypeGpt4,
					ModelParameters:           modelParameters,
					ProviderPromptMessages:    promptMessages,
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

			promptConfigs := make([]db.PromptConfig, 0)
			deserializationErr := serialization.DeserializeJSON(response.Body, &promptConfigs)
			assert.NoError(t, deserializationErr)

			assert.Len(t, promptConfigs, 2)
			assert.Equal(t, firstPromptConfig.Name, promptConfigs[0].Name)  //nolint:gosec
			assert.Equal(t, secondPromptConfig.Name, promptConfigs[1].Name) //nolint:gosec
		})

		t.Run("returns empty array when no prompt configs are found", func(t *testing.T) {
			appID := createApplication(t, projectID)

			response, responseErr := testClient.Get(
				context.TODO(),
				fmtListEndpoint(projectID, appID),
			)
			assert.NoError(t, responseErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			promptConfigs := make([]db.PromptConfig, 0)
			deserializationErr := serialization.DeserializeJSON(response.Body, &promptConfigs)
			assert.NoError(t, deserializationErr)

			assert.Len(t, promptConfigs, 0)
		})

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
				CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      factories.RandomString(10),
					ModelVendor:               db.ModelVendorOPENAI,
					ModelType:                 db.ModelTypeGpt4,
					ModelParameters:           modelParameters,
					ProviderPromptMessages:    promptMessages,
					ExpectedTemplateVariables: []string{""},
					IsDefault:                 true,
				})
			assert.NoError(t, defaultPromptConfigCreateErr)

			nonDefaultPromptConfig, nonDefaultPromptConfigCreateErr := db.GetQueries().
				CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      factories.RandomString(10),
					ModelVendor:               db.ModelVendorOPENAI,
					ModelType:                 db.ModelTypeGpt4,
					ModelParameters:           modelParameters,
					ProviderPromptMessages:    promptMessages,
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
				FindPromptConfigByID(context.Background(), defaultPromptConfig.ID)

			assert.NoError(t, retrivalErr)
			assert.Equal(t, false, dbDefaultPromptConfig.IsDefault)

			dbNonDefaultPromptConfig, retrivalErr := db.
				GetQueries().
				FindPromptConfigByID(context.Background(), nonDefaultPromptConfig.ID)

			assert.NoError(t, retrivalErr)
			assert.Equal(t, true, dbNonDefaultPromptConfig.IsDefault)
		})

		t.Run(
			"returns bad request when trying to set the default prompt config as default",
			func(t *testing.T) {
				applicationID := createApplication(t, projectID)
				uuidID, _ := db.StringToUUID(applicationID)

				defaultPromptConfig, defaultPromptConfigCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
						ApplicationID:             *uuidID,
						Name:                      "default prompt config",
						ModelVendor:               db.ModelVendorOPENAI,
						ModelType:                 db.ModelTypeGpt4,
						ModelParameters:           modelParameters,
						ProviderPromptMessages:    promptMessages,
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
					FindPromptConfigByID(context.Background(), defaultPromptConfig.ID)

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
				CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      "abc prompt config",
					ModelVendor:               db.ModelVendorOPENAI,
					ModelType:                 db.ModelTypeGpt4,
					ModelParameters:           modelParameters,
					ProviderPromptMessages:    promptMessages,
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
				FindPromptConfigByID(context.Background(), promptConfigToRename.ID)
			assert.NoError(t, retrivalErr)
			assert.Equal(t, newName, dbPromptConfig.Name)
		})

		t.Run(
			"returns bad request when duplicating a prompt config's name",
			func(t *testing.T) {
				applicationID := createApplication(t, projectID)
				uuidID, _ := db.StringToUUID(applicationID)

				firstPromptConfig, configCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
						ApplicationID:             *uuidID,
						Name:                      factories.RandomString(10),
						ModelVendor:               db.ModelVendorOPENAI,
						ModelType:                 db.ModelTypeGpt4,
						ModelParameters:           modelParameters,
						ProviderPromptMessages:    promptMessages,
						ExpectedTemplateVariables: []string{""},
						IsDefault:                 true,
					})
				assert.NoError(t, configCreateErr)

				newPromptConfig, configCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
						ApplicationID:             *uuidID,
						Name:                      factories.RandomString(10),
						ModelVendor:               db.ModelVendorOPENAI,
						ModelType:                 db.ModelTypeGpt4,
						ModelParameters:           modelParameters,
						ProviderPromptMessages:    promptMessages,
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
				CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      "abc prompt config",
					ModelVendor:               db.ModelVendorOPENAI,
					ModelType:                 db.ModelTypeGpt4,
					ModelParameters:           modelParameters,
					ProviderPromptMessages:    promptMessages,
					ExpectedTemplateVariables: []string{""},
					IsDefault:                 true,
				})

			assert.NoError(t, configCreateErr)

			promptConfigToRenameID := db.UUIDToString(&promptConfigToRename.ID)

			newModel := db.ModelTypeGpt35Turbo
			response, requestErr := testClient.Patch(
				context.TODO(),
				fmtDetailEndpoint(projectID, applicationID, promptConfigToRenameID),
				dto.PromptConfigUpdateDTO{
					ModelType: &newModel,
				})
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			dbPromptConfig, retrivalErr := db.GetQueries().
				FindPromptConfigByID(context.Background(), promptConfigToRename.ID)
			assert.NoError(t, retrivalErr)
			assert.Equal(t, newModel, dbPromptConfig.ModelType)
		})

		t.Run("returns bad request for invalid model type", func(t *testing.T) {
			applicationID := createApplication(t, projectID)
			uuidID, _ := db.StringToUUID(applicationID)

			promptConfigToRename, configCreateErr := db.GetQueries().
				CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      "abc prompt config",
					ModelVendor:               db.ModelVendorOPENAI,
					ModelType:                 db.ModelTypeGpt4,
					ModelParameters:           modelParameters,
					ProviderPromptMessages:    promptMessages,
					ExpectedTemplateVariables: []string{""},
					IsDefault:                 true,
				})

			assert.NoError(t, configCreateErr)

			promptConfigToRenameID := db.UUIDToString(&promptConfigToRename.ID)

			newModel := db.ModelType("nope")
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
				CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      factories.RandomString(10),
					ModelVendor:               db.ModelVendorOPENAI,
					ModelType:                 db.ModelTypeGpt4,
					ModelParameters:           modelParameters,
					ProviderPromptMessages:    promptMessages,
					ExpectedTemplateVariables: []string{""},
					IsDefault:                 true,
				})

			assert.NoError(t, configCreateErr)

			promptConfigToRenameID := db.UUIDToString(&promptConfigToRename.ID)

			newModelParameters, marshalErr := json.Marshal(map[string]float32{
				"temperature":       2,
				"top_p":             2,
				"max_tokens":        2,
				"presence_penalty":  2,
				"frequency_penalty": 2,
			})
			assert.NoError(t, marshalErr)

			jsonMessage := json.RawMessage(newModelParameters)

			response, requestErr := testClient.Patch(
				context.TODO(),
				fmtDetailEndpoint(projectID, applicationID, promptConfigToRenameID),
				dto.PromptConfigUpdateDTO{
					ModelParameters: &jsonMessage,
				})
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			dbPromptConfig, retrivalErr := db.GetQueries().
				FindPromptConfigByID(context.Background(), promptConfigToRename.ID)
			assert.NoError(t, retrivalErr)
			assert.Equal(t, newModelParameters, dbPromptConfig.ModelParameters)
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
				CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      factories.RandomString(10),
					ModelVendor:               db.ModelVendorOPENAI,
					ModelType:                 db.ModelTypeGpt4,
					ModelParameters:           modelParameters,
					ProviderPromptMessages:    promptMessages,
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
				FindPromptConfigByID(context.Background(), promptConfig.ID)
			assert.Error(t, retrivalErr)
		})

		t.Run("returns bad request when deleting a default prompt config", func(t *testing.T) {
			applicationID := createApplication(t, projectID)
			uuidID, _ := db.StringToUUID(applicationID)

			promptConfig, configCreateErr := db.GetQueries().
				CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
					ApplicationID:             *uuidID,
					Name:                      factories.RandomString(10),
					ModelVendor:               db.ModelVendorOPENAI,
					ModelType:                 db.ModelTypeGpt4,
					ModelParameters:           modelParameters,
					ProviderPromptMessages:    promptMessages,
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
				FindPromptConfigByID(context.Background(), promptConfig.ID)
			assert.NoError(t, retrivalErr)
		})

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
	})
}
