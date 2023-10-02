package api_test

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"testing"

	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/middleware"
	"github.com/basemind-ai/monorepo/shared/go/db"
	dbTestUtils "github.com/basemind-ai/monorepo/shared/go/db/testutils"
	httpTestUtils "github.com/basemind-ai/monorepo/shared/go/httpclient/testutils"
	"github.com/basemind-ai/monorepo/shared/go/router"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/stretchr/testify/assert"
)

func TestAPI(t *testing.T) {
	dbTestUtils.CreateTestDB(t)

	t.Run("Project CRUD", func(t *testing.T) {
		t.Run("HandleDashboardUserPostLogin", func(t *testing.T) {
			t.Run("creates a new user and returns its default project", func(t *testing.T) {
				userId := factories.RandomString(10)
				r := router.New(router.Options{
					Environment:      "test",
					ServiceName:      "test",
					RegisterHandlers: api.RegisterHandlers,
					Middlewares: []func(next http.Handler) http.Handler{
						middleware.CreateMockFirebaseAuthMiddleware(userId),
					},
				})

				testClient := httpTestUtils.CreateTestClient(t, r)

				response, requestErr := testClient.Get(
					context.TODO(),
					fmt.Sprintf("/v1%s", api.ProjectsListEndpoint),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusOK, response.StatusCode)

				projects := make([]db.FindProjectsByUserIdRow, 0)
				deserializationErr := serialization.DeserializeJson(response.Body, &projects)
				assert.NoError(t, deserializationErr)
				assert.Len(t, projects, 1)
				assert.Equal(t, "Default Project", projects[0].Name)        //nolint:gosec
				assert.Equal(t, "Default Project", projects[0].Description) //nolint:gosec
			})

			t.Run("retrieves projects for existing user", func(t *testing.T) {
				userId := "xxx123"

				_, userCreateErr := api.GetOrCreateUser(
					context.Background(),
					db.GetQueries(),
					userId,
				)
				assert.NoError(t, userCreateErr)

				r := router.New(router.Options{
					Environment:      "test",
					ServiceName:      "test",
					RegisterHandlers: api.RegisterHandlers,
					Middlewares: []func(next http.Handler) http.Handler{
						middleware.CreateMockFirebaseAuthMiddleware(userId),
					},
				})

				testClient := httpTestUtils.CreateTestClient(t, r)

				response, requestErr := testClient.Get(
					context.TODO(),
					fmt.Sprintf("/v1%s", api.ProjectsListEndpoint),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusOK, response.StatusCode)

				projects := make([]db.FindProjectsByUserIdRow, 0)
				deserializationErr := serialization.DeserializeJson(response.Body, &projects)
				assert.NoError(t, deserializationErr)
				assert.Len(t, projects, 1)
				assert.Equal(t, "Default Project", projects[0].Name)        //nolint:gosec
				assert.Equal(t, "Default Project", projects[0].Description) //nolint:gosec
			})

			t.Run("returns error when a user exists without projects", func(t *testing.T) {
				userId := "zzz123"

				_, userCreateErr := db.GetQueries().CreateUser(context.TODO(), userId)
				assert.NoError(t, userCreateErr)

				r := router.New(router.Options{
					Environment:      "test",
					ServiceName:      "test",
					RegisterHandlers: api.RegisterHandlers,
					Middlewares: []func(next http.Handler) http.Handler{
						middleware.CreateMockFirebaseAuthMiddleware(userId),
					},
				})

				testClient := httpTestUtils.CreateTestClient(t, r)

				response, requestErr := testClient.Get(
					context.TODO(),
					fmt.Sprintf("/v1%s", api.ProjectsListEndpoint),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusInternalServerError, response.StatusCode)
			})
		})
	})

	t.Run("Application CRUD", func(t *testing.T) {
		project, createProjectErr := db.GetQueries().
			CreateProject(context.TODO(), db.CreateProjectParams{
				Name:        "test project",
				Description: "test project description",
			})
		assert.NoError(t, createProjectErr)

		projectId := db.UUIDToString(&project.ID)

		userId := factories.RandomString(10)
		r := router.New(router.Options{
			Environment:      "test",
			ServiceName:      "test",
			RegisterHandlers: api.RegisterHandlers,
			Middlewares: []func(next http.Handler) http.Handler{
				middleware.CreateMockFirebaseAuthMiddleware(userId),
			},
		})
		testClient := httpTestUtils.CreateTestClient(t, r)

		t.Run("HandleCreateApplication", func(t *testing.T) {
			t.Run("creates a new application", func(t *testing.T) {
				response, requestErr := testClient.Post(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(api.ApplicationsListEndpoint, "{projectId}", projectId),
					),
					map[string]interface{}{
						"name":        "test app",
						"description": "test app description",
					},
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusCreated, response.StatusCode)

				application := db.Application{}
				deserializationErr := serialization.DeserializeJson(response.Body, &application)
				assert.NoError(t, deserializationErr)
				assert.NotNil(t, application.ID)
				assert.Equal(t, "test app", application.Name)
				assert.Equal(t, "test app description", application.Description)
			})

			t.Run("returns an error if the project id is invalid", func(t *testing.T) {
				response, requestErr := testClient.Post(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(api.ApplicationsListEndpoint, "{projectId}", "invalid"),
					),
					map[string]interface{}{
						"name":        "test app",
						"description": "test app description",
					},
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			})

			t.Run("returns an error if the request body is invalid", func(t *testing.T) {
				response, requestErr := testClient.Post(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(api.ApplicationsListEndpoint, "{projectId}", projectId),
					),
					"invalid",
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			})
		})

		t.Run("HandleRetrieveApplication", func(t *testing.T) {
			t.Run("retrieves an existing application", func(t *testing.T) {
				application, applicationCreateErr := db.GetQueries().
					CreateApplication(context.TODO(), db.CreateApplicationParams{
						ProjectID: project.ID,
					})
				assert.NoError(t, applicationCreateErr)

				applicationId := db.UUIDToString(&application.ID)
				response, requestErr := testClient.Get(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							api.ApplicationDetailEndpoint,
							"{applicationId}",
							applicationId,
						),
					),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusOK, response.StatusCode)

				responseApplication := db.Application{}
				deserializationErr := serialization.DeserializeJson(
					response.Body,
					&responseApplication,
				)
				assert.NoError(t, deserializationErr)
				assert.Equal(t, application.ID, responseApplication.ID)
				assert.Equal(t, application.Name, responseApplication.Name)
				assert.Equal(t, application.Description, responseApplication.Description)
			})

			t.Run("returns an error if the application id is invalid", func(t *testing.T) {
				response, requestErr := testClient.Get(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							api.ApplicationDetailEndpoint,
							"{applicationId}",
							"invalid",
						),
					),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			})
		})

		t.Run("HandleUpdateApplication", func(t *testing.T) {
			t.Run("updates an existing application", func(t *testing.T) {
				application, applicationCreateErr := db.GetQueries().
					CreateApplication(context.TODO(), db.CreateApplicationParams{
						ProjectID: project.ID,
					})
				assert.NoError(t, applicationCreateErr)

				applicationId := db.UUIDToString(&application.ID)
				response, requestErr := testClient.Patch(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							api.ApplicationDetailEndpoint,
							"{applicationId}",
							applicationId,
						),
					),
					map[string]interface{}{
						"name":        "updated app",
						"description": "updated app description",
					},
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusOK, response.StatusCode)

				responseApplication := db.Application{}
				deserializationErr := serialization.DeserializeJson(
					response.Body,
					&responseApplication,
				)
				assert.NoError(t, deserializationErr)
				assert.Equal(t, application.ID, responseApplication.ID)
				assert.Equal(t, "updated app", responseApplication.Name)
				assert.Equal(t, "updated app description", responseApplication.Description)
			})

			t.Run("returns an error if the application id is invalid", func(t *testing.T) {
				response, requestErr := testClient.Patch(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							api.ApplicationDetailEndpoint,
							"{applicationId}",
							"invalid",
						),
					),
					map[string]interface{}{
						"name":        "updated app",
						"description": "updated app description",
					},
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			})

			t.Run("returns an error if the request body is invalid", func(t *testing.T) {
				application, applicationCreateErr := db.GetQueries().
					CreateApplication(context.TODO(), db.CreateApplicationParams{
						ProjectID: project.ID,
					})
				assert.NoError(t, applicationCreateErr)

				applicationId := db.UUIDToString(&application.ID)
				response, requestErr := testClient.Patch(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							api.ApplicationDetailEndpoint,
							"{applicationId}",
							applicationId,
						),
					),
					"invalid",
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			})
		})

		t.Run("HandleDeleteApplication", func(t *testing.T) {
			t.Run("deletes an existing application", func(t *testing.T) {
				application, applicationCreateErr := db.GetQueries().
					CreateApplication(context.TODO(), db.CreateApplicationParams{
						ProjectID: project.ID,
					})
				assert.NoError(t, applicationCreateErr)

				applicationId := db.UUIDToString(&application.ID)
				response, requestErr := testClient.Delete(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							api.ApplicationDetailEndpoint,
							"{applicationId}",
							applicationId,
						),
					),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusNoContent, response.StatusCode)

				_, applicationRetrieveErr := db.GetQueries().
					FindApplicationById(context.TODO(), application.ID)
				assert.Error(t, applicationRetrieveErr)
			})

			t.Run("returns an error if the application id is invalid", func(t *testing.T) {
				response, requestErr := testClient.Delete(
					context.TODO(),
					fmt.Sprintf(
						"/v1%s",
						strings.ReplaceAll(
							api.ApplicationDetailEndpoint,
							"{applicationId}",
							"invalid",
						),
					),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			})
		})
	})

	t.Run("PromptConfig CRUD", func(t *testing.T) {
		project, createProjectErr := db.GetQueries().
			CreateProject(context.TODO(), db.CreateProjectParams{
				Name:        "test project",
				Description: "test project description",
			})
		assert.NoError(t, createProjectErr)

		projectId := db.UUIDToString(&project.ID)

		userId := factories.RandomString(10)
		r := router.New(router.Options{
			Environment:      "test",
			ServiceName:      "test",
			RegisterHandlers: api.RegisterHandlers,
			Middlewares: []func(next http.Handler) http.Handler{
				middleware.CreateMockFirebaseAuthMiddleware(userId),
			},
		})
		testClient := httpTestUtils.CreateTestClient(t, r)

		systemMessages := "You are a chatbot."
		userMessage := "Please write a song about {subject}."

		promptMessages, promptMessagesErr := factories.CreateOpenAIPromptMessageDTO([]struct {
			Role    string
			Content string
		}{
			{Role: "system", Content: systemMessages}, {Role: "user", Content: userMessage},
		})
		assert.NoError(t, promptMessagesErr)

		modelParameters, modelParametersErr := factories.CreateModelParameters()
		assert.NoError(t, modelParametersErr)

		fmtListEndpoint := func(projectId string, applicationId string) string {
			return fmt.Sprintf(
				"/v1%s",
				strings.ReplaceAll(
					strings.ReplaceAll(
						api.PromptConfigListEndpoint,
						"{projectId}",
						projectId),
					"{applicationId}",
					applicationId),
			)
		}

		fmtDetailEndpoint := func(projectId string, applicationId string, promptConfigId string) string {
			return fmt.Sprintf(
				"/v1%s",
				strings.ReplaceAll(
					strings.ReplaceAll(
						strings.ReplaceAll(
							api.PromptConfigDetailEndpoint,
							"{projectId}",
							projectId),
						"{applicationId}",
						applicationId),
					"{promptConfigId}",
					promptConfigId),
			)
		}

		t.Run("HandleCreatePromptConfig", func(t *testing.T) {
			application, applicationCreateErr := db.GetQueries().
				CreateApplication(context.TODO(), db.CreateApplicationParams{
					ProjectID:   project.ID,
					Name:        "test app",
					Description: "test app description",
				})
			assert.NoError(t, applicationCreateErr)

			applicationId := db.UUIDToString(&application.ID)

			t.Run("creates a new prompt config", func(t *testing.T) {
				dto := api.PromptConfigCreateDTO{
					Name:                   "test prompt config",
					ModelParameters:        modelParameters,
					ModelType:              db.ModelTypeGpt4,
					ModelVendor:            db.ModelVendorOPENAI,
					ProviderPromptMessages: promptMessages,
				}
				response, requestErr := testClient.Post(
					context.TODO(),
					fmtListEndpoint(projectId, applicationId),
					dto,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusCreated, response.StatusCode)

				promptConfig := db.PromptConfig{}
				deserializationErr := serialization.DeserializeJson(response.Body, &promptConfig)
				assert.NoError(t, deserializationErr)

				assert.NotNil(t, promptConfig.ID)
				assert.Equal(t, dto.Name, promptConfig.Name)
				assert.Equal(t, dto.ModelParameters, promptConfig.ModelParameters)
				assert.Equal(t, dto.ModelType, promptConfig.ModelType)
				assert.Equal(t, dto.ModelVendor, promptConfig.ModelVendor)
				assert.Equal(
					t,
					dto.ProviderPromptMessages,
					json.RawMessage(promptConfig.ProviderPromptMessages),
				)
			})

			t.Run("returns bad request for validation errors", func(t *testing.T) {
				failureTestCases := []struct {
					Name string
					Dto  api.PromptConfigCreateDTO
				}{
					{
						Name: "fails validation for missing name",
						Dto: api.PromptConfigCreateDTO{
							ModelParameters:        modelParameters,
							ModelType:              db.ModelTypeGpt4,
							ModelVendor:            db.ModelVendorOPENAI,
							ProviderPromptMessages: promptMessages,
						},
					},
					{
						Name: "fails validation for missing model parameters",
						Dto: api.PromptConfigCreateDTO{
							Name:                   "test prompt config",
							ModelType:              db.ModelTypeGpt4,
							ModelVendor:            db.ModelVendorOPENAI,
							ProviderPromptMessages: promptMessages,
						},
					},
					{
						Name: "fails validation for missing model type",
						Dto: api.PromptConfigCreateDTO{
							Name:                   "test prompt config",
							ModelParameters:        modelParameters,
							ModelVendor:            db.ModelVendorOPENAI,
							ProviderPromptMessages: promptMessages,
						},
					},
					{
						Name: "fails validation for missing model vendor",
						Dto: api.PromptConfigCreateDTO{
							Name:                   "test prompt config",
							ModelType:              db.ModelTypeGpt4,
							ModelParameters:        modelParameters,
							ProviderPromptMessages: promptMessages,
						},
					},
					{
						Name: "fails validation for missing prompt messages",
						Dto: api.PromptConfigCreateDTO{
							Name:            "test prompt config",
							ModelParameters: modelParameters,
							ModelType:       db.ModelTypeGpt4,
							ModelVendor:     db.ModelVendorOPENAI,
						},
					},
					{
						Name: "fails validation for wrong model type",
						Dto: api.PromptConfigCreateDTO{
							Name:                   "test prompt config",
							ModelParameters:        modelParameters,
							ModelType:              db.ModelType("abc"),
							ModelVendor:            db.ModelVendorOPENAI,
							ProviderPromptMessages: promptMessages,
						},
					},
					{
						Name: "fails validation for wrong model vendor",
						Dto: api.PromptConfigCreateDTO{
							Name:                   "test prompt config",
							ModelParameters:        modelParameters,
							ModelType:              db.ModelTypeGpt432k,
							ModelVendor:            db.ModelVendor("abc"),
							ProviderPromptMessages: promptMessages,
						},
					},
				}

				for _, testCase := range failureTestCases {
					t.Run(testCase.Name, func(t *testing.T) {
						response, requestErr := testClient.Post(
							context.TODO(),
							fmtListEndpoint(projectId, applicationId),
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
						dto := api.PromptConfigCreateDTO{
							Name:                   fmt.Sprintf("test prompt config: %d", i),
							ModelParameters:        modelParameters,
							ModelType:              modelType,
							ModelVendor:            db.ModelVendorOPENAI,
							ProviderPromptMessages: promptMessages,
						}
						response, requestErr := testClient.Post(
							context.TODO(),
							fmtListEndpoint(projectId, applicationId),
							dto,
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
							ApplicationID:             application.ID,
							Name:                      "unique name",
							ModelVendor:               db.ModelVendorOPENAI,
							ModelType:                 db.ModelTypeGpt4,
							ModelParameters:           modelParameters,
							ProviderPromptMessages:    promptMessages,
							ExpectedTemplateVariables: []string{"userInput"},
							IsDefault:                 true,
						})
					assert.NoError(t, promptConfigCreateErr)

					dto := api.PromptConfigCreateDTO{
						Name:                   "unique name",
						ModelParameters:        modelParameters,
						ModelType:              db.ModelTypeGpt4,
						ModelVendor:            db.ModelVendorOPENAI,
						ProviderPromptMessages: promptMessages,
					}
					response, requestErr := testClient.Post(
						context.TODO(),
						fmtListEndpoint(projectId, applicationId),
						dto,
					)
					assert.NoError(t, requestErr)
					assert.Equal(t, http.StatusBadRequest, response.StatusCode)
				},
			)

			t.Run("rolls back transaction when failing to update record", func(t *testing.T) {
				defaultPromptConfig, promptConfigCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
						ApplicationID:             application.ID,
						Name:                      "default prompt config",
						ModelVendor:               db.ModelVendorOPENAI,
						ModelType:                 db.ModelTypeGpt4,
						ModelParameters:           modelParameters,
						ProviderPromptMessages:    promptMessages,
						ExpectedTemplateVariables: []string{"userInput"},
						IsDefault:                 true,
					})
				assert.NoError(t, promptConfigCreateErr)

				dto := api.PromptConfigCreateDTO{
					Name:                   "default prompt config",
					ModelParameters:        modelParameters,
					ModelType:              db.ModelTypeGpt4,
					ModelVendor:            db.ModelVendorOPENAI,
					ProviderPromptMessages: promptMessages,
				}
				response, requestErr := testClient.Post(
					context.TODO(),
					fmtListEndpoint(projectId, applicationId),
					dto,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)

				retrievedPromptConfig, retrieveErr := db.GetQueries().
					FindPromptConfigById(context.Background(), defaultPromptConfig.ID)
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
								projectId,
							),
							"{applicationId}",
							"invalid",
						),
					),
					api.PromptConfigCreateDTO{
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
					fmtListEndpoint(projectId, applicationId),
					"invalid",
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			})
		})

		t.Run("HandleRetrievePromptConfigs", func(t *testing.T) {
			application, applicationCreateErr := factories.CreateApplication(
				context.TODO(),
				project.ID,
			)
			assert.NoError(t, applicationCreateErr)
			applicationId := db.UUIDToString(&application.ID)

			t.Run("retrieves prompt configs for an application", func(t *testing.T) {
				firstPromptConfig, firstPromptConfigCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
						ApplicationID:             application.ID,
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
						ApplicationID:             application.ID,
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
					fmtListEndpoint(projectId, applicationId),
				)
				assert.NoError(t, responseErr)
				assert.Equal(t, http.StatusOK, response.StatusCode)

				promptConfigs := make([]db.PromptConfig, 0)
				deserializationErr := serialization.DeserializeJson(response.Body, &promptConfigs)
				assert.NoError(t, deserializationErr)

				assert.Len(t, promptConfigs, 2)
				assert.Equal(t, firstPromptConfig.Name, promptConfigs[0].Name)  //nolint:gosec
				assert.Equal(t, secondPromptConfig.Name, promptConfigs[1].Name) //nolint:gosec
			})

			t.Run("returns empty array when no prompt configs are found", func(t *testing.T) {
				application, applicationCreateErr := factories.CreateApplication(
					context.TODO(),
					project.ID,
				)
				assert.NoError(t, applicationCreateErr)
				applicationId := db.UUIDToString(&application.ID)

				response, responseErr := testClient.Get(
					context.TODO(),
					fmtListEndpoint(projectId, applicationId),
				)
				assert.NoError(t, responseErr)
				assert.Equal(t, http.StatusOK, response.StatusCode)

				promptConfigs := make([]db.PromptConfig, 0)
				deserializationErr := serialization.DeserializeJson(response.Body, &promptConfigs)
				assert.NoError(t, deserializationErr)

				assert.Len(t, promptConfigs, 0)
			})
		})

		t.Run("HandleUpdatePromptConfig", func(t *testing.T) {
			t.Run("updates a prompt config's name", func(t *testing.T) {
				application, applicationCreateErr := factories.CreateApplication(
					context.TODO(),
					project.ID,
				)
				assert.NoError(t, applicationCreateErr)
				applicationId := db.UUIDToString(&application.ID)

				promptConfigToRename, configCreateErr := db.GetQueries().
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

				assert.NoError(t, configCreateErr)

				promptConfigToRenameId := db.UUIDToString(&promptConfigToRename.ID)

				newName := "efg prompt config"
				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtDetailEndpoint(projectId, applicationId, promptConfigToRenameId),
					api.PromptConfigUpdateDTO{
						Name: &newName,
					})
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusOK, response.StatusCode)

				dbPromptConfig, retrivalErr := db.GetQueries().
					FindPromptConfigById(context.Background(), promptConfigToRename.ID)
				assert.NoError(t, retrivalErr)
				assert.Equal(t, newName, dbPromptConfig.Name)
			})

			t.Run(
				"returns bad request when duplicating a prompt config's name",
				func(t *testing.T) {
					application, applicationCreateErr := factories.CreateApplication(
						context.TODO(),
						project.ID,
					)
					assert.NoError(t, applicationCreateErr)
					applicationId := db.UUIDToString(&application.ID)

					firstPromptConfig, configCreateErr := db.GetQueries().
						CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
							ApplicationID:             application.ID,
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
							ApplicationID:             application.ID,
							Name:                      factories.RandomString(10),
							ModelVendor:               db.ModelVendorOPENAI,
							ModelType:                 db.ModelTypeGpt4,
							ModelParameters:           modelParameters,
							ProviderPromptMessages:    promptMessages,
							ExpectedTemplateVariables: []string{""},
							IsDefault:                 false,
						})
					assert.NoError(t, configCreateErr)

					newPromptConfigId := db.UUIDToString(&newPromptConfig.ID)

					newName := firstPromptConfig.Name
					response, requestErr := testClient.Patch(
						context.TODO(),
						fmtDetailEndpoint(projectId, applicationId, newPromptConfigId),
						api.PromptConfigUpdateDTO{
							Name: &newName,
						})
					assert.NoError(t, requestErr)
					assert.Equal(t, http.StatusBadRequest, response.StatusCode)
				},
			)

			t.Run("allows making a non-default prompt config default", func(t *testing.T) {
				application, applicationCreateErr := factories.CreateApplication(
					context.TODO(),
					project.ID,
				)
				assert.NoError(t, applicationCreateErr)
				applicationId := db.UUIDToString(&application.ID)

				defaultPromptConfig, defaultPromptConfigCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
						ApplicationID:             application.ID,
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
						ApplicationID:             application.ID,
						Name:                      factories.RandomString(10),
						ModelVendor:               db.ModelVendorOPENAI,
						ModelType:                 db.ModelTypeGpt4,
						ModelParameters:           modelParameters,
						ProviderPromptMessages:    promptMessages,
						ExpectedTemplateVariables: []string{""},
						IsDefault:                 false,
					})
				assert.NoError(t, nonDefaultPromptConfigCreateErr)

				nonDefaultPromptConfigId := db.UUIDToString(&nonDefaultPromptConfig.ID)

				isDefault := true
				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtDetailEndpoint(projectId, applicationId, nonDefaultPromptConfigId),
					api.PromptConfigUpdateDTO{
						IsDefault: &isDefault,
					})
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusOK, response.StatusCode)

				dbDefaultPromptConfig, retrivalErr := db.GetQueries().
					FindPromptConfigById(context.Background(), defaultPromptConfig.ID)
				assert.NoError(t, retrivalErr)
				assert.Equal(t, false, dbDefaultPromptConfig.IsDefault)

				dbNonDefaultPromptConfig, retrivalErr := db.GetQueries().
					FindPromptConfigById(context.Background(), nonDefaultPromptConfig.ID)
				assert.NoError(t, retrivalErr)
				assert.Equal(t, true, dbNonDefaultPromptConfig.IsDefault)
			})

			t.Run(
				"returns bad request when trying to make the default prompt config non-default",
				func(t *testing.T) {
					application, applicationCreateErr := factories.CreateApplication(
						context.TODO(),
						project.ID,
					)
					assert.NoError(t, applicationCreateErr)
					applicationId := db.UUIDToString(&application.ID)

					defaultPromptConfig, defaultPromptConfigCreateErr := db.GetQueries().
						CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
							ApplicationID:             application.ID,
							Name:                      "default prompt config",
							ModelVendor:               db.ModelVendorOPENAI,
							ModelType:                 db.ModelTypeGpt4,
							ModelParameters:           modelParameters,
							ProviderPromptMessages:    promptMessages,
							ExpectedTemplateVariables: []string{""},
							IsDefault:                 true,
						})

					assert.NoError(t, defaultPromptConfigCreateErr)

					defaultPromptConfigId := db.UUIDToString(&defaultPromptConfig.ID)

					isDefault := false
					response, requestErr := testClient.Patch(
						context.TODO(),
						fmtDetailEndpoint(projectId, applicationId, defaultPromptConfigId),
						api.PromptConfigUpdateDTO{
							IsDefault: &isDefault,
						})
					assert.NoError(t, requestErr)
					assert.Equal(t, http.StatusBadRequest, response.StatusCode)

					dbDefaultPromptConfig, retrivalErr := db.GetQueries().
						FindPromptConfigById(context.Background(), defaultPromptConfig.ID)
					assert.NoError(t, retrivalErr)
					assert.Equal(t, true, dbDefaultPromptConfig.IsDefault)
				},
			)

			t.Run("updates a prompt config's model type", func(t *testing.T) {
				application, applicationCreateErr := factories.CreateApplication(
					context.TODO(),
					project.ID,
				)
				assert.NoError(t, applicationCreateErr)
				applicationId := db.UUIDToString(&application.ID)

				promptConfigToRename, configCreateErr := db.GetQueries().
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

				assert.NoError(t, configCreateErr)

				promptConfigToRenameId := db.UUIDToString(&promptConfigToRename.ID)

				newModel := db.ModelTypeGpt35Turbo
				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtDetailEndpoint(projectId, applicationId, promptConfigToRenameId),
					api.PromptConfigUpdateDTO{
						ModelType: &newModel,
					})
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusOK, response.StatusCode)

				dbPromptConfig, retrivalErr := db.GetQueries().
					FindPromptConfigById(context.Background(), promptConfigToRename.ID)
				assert.NoError(t, retrivalErr)
				assert.Equal(t, newModel, dbPromptConfig.ModelType)
			})

			t.Run("returns bad request for invalid model type", func(t *testing.T) {
				application, applicationCreateErr := factories.CreateApplication(
					context.TODO(),
					project.ID,
				)
				assert.NoError(t, applicationCreateErr)
				applicationId := db.UUIDToString(&application.ID)

				promptConfigToRename, configCreateErr := db.GetQueries().
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

				assert.NoError(t, configCreateErr)

				promptConfigToRenameId := db.UUIDToString(&promptConfigToRename.ID)

				newModel := db.ModelType("nope")
				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtDetailEndpoint(projectId, applicationId, promptConfigToRenameId),
					api.PromptConfigUpdateDTO{
						ModelType: &newModel,
					})
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			})

			t.Run("updates a prompt config's model parameters", func(t *testing.T) {
				application, applicationCreateErr := factories.CreateApplication(
					context.TODO(),
					project.ID,
				)
				assert.NoError(t, applicationCreateErr)
				applicationId := db.UUIDToString(&application.ID)

				promptConfigToRename, configCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
						ApplicationID:             application.ID,
						Name:                      factories.RandomString(10),
						ModelVendor:               db.ModelVendorOPENAI,
						ModelType:                 db.ModelTypeGpt4,
						ModelParameters:           modelParameters,
						ProviderPromptMessages:    promptMessages,
						ExpectedTemplateVariables: []string{""},
						IsDefault:                 true,
					})

				assert.NoError(t, configCreateErr)

				promptConfigToRenameId := db.UUIDToString(&promptConfigToRename.ID)

				newModelParameters, marshalErr := json.Marshal(map[string]float32{
					"temperature":       2,
					"top_p":             2,
					"max_tokens":        2,
					"presence_penalty":  2,
					"frequency_penalty": 2,
				})
				assert.NoError(t, marshalErr)

				response, requestErr := testClient.Patch(
					context.TODO(),
					fmtDetailEndpoint(projectId, applicationId, promptConfigToRenameId),
					api.PromptConfigUpdateDTO{
						ModelParameters: &newModelParameters,
					})
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusOK, response.StatusCode)

				dbPromptConfig, retrivalErr := db.GetQueries().
					FindPromptConfigById(context.Background(), promptConfigToRename.ID)
				assert.NoError(t, retrivalErr)
				assert.Equal(t, newModelParameters, dbPromptConfig.ModelParameters)
			})
		})

		t.Run("HandleDeletePromptConfig", func(t *testing.T) {
			t.Run("deletes a prompt config if its not default", func(t *testing.T) {
				application, applicationCreateErr := factories.CreateApplication(
					context.TODO(),
					project.ID,
				)
				assert.NoError(t, applicationCreateErr)
				applicationId := db.UUIDToString(&application.ID)

				promptConfig, configCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
						ApplicationID:             application.ID,
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
					fmtDetailEndpoint(projectId, applicationId, db.UUIDToString(&promptConfig.ID)),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusNoContent, response.StatusCode)

				_, retrivalErr := db.GetQueries().
					FindPromptConfigById(context.Background(), promptConfig.ID)
				assert.Error(t, retrivalErr)
			})

			t.Run("returns bad request when deleting a default prompt config", func(t *testing.T) {
				application, applicationCreateErr := factories.CreateApplication(
					context.TODO(),
					project.ID,
				)
				assert.NoError(t, applicationCreateErr)
				applicationId := db.UUIDToString(&application.ID)

				promptConfig, configCreateErr := db.GetQueries().
					CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
						ApplicationID:             application.ID,
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
					fmtDetailEndpoint(projectId, applicationId, db.UUIDToString(&promptConfig.ID)),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)

				_, retrivalErr := db.GetQueries().
					FindPromptConfigById(context.Background(), promptConfig.ID)
				assert.NoError(t, retrivalErr)
			})
		})
	})

	t.Run("utils", func(t *testing.T) {
		t.Run("ParsePromptMessages", func(t *testing.T) {
			t.Run("parses openai messages", func(t *testing.T) {
				promptMessages := json.RawMessage(
					`[{"role": "user", "content": "Hello {name}!"}, {"role": "system", "content": "You are a helpful chatbot."}]`,
				)
				vendor := db.ModelVendorOPENAI

				expected := []string{"name"}

				result, err := api.ParsePromptMessages(promptMessages, vendor)

				assert.NoError(t, err)
				assert.Equal(t, expected, result)
			})

			t.Run("de-duplicates template variables", func(t *testing.T) {
				promptMessages := json.RawMessage(
					`[{"role": "user", "content": "Hello {name}!"}, {"role": "system", "content": "You are a helpful {name}."}]`,
				)
				vendor := db.ModelVendorOPENAI

				expected := []string{"name"}

				result, err := api.ParsePromptMessages(promptMessages, vendor)

				assert.NoError(t, err)
				assert.Equal(t, expected, result)
			})

			t.Run("returns error for invalid JSON prompt message", func(t *testing.T) {
				promptMessages := json.RawMessage(`invalid`)

				_, err := api.ParsePromptMessages(promptMessages, db.ModelVendorOPENAI)
				assert.Error(t, err)
			})

			t.Run("returns error for invalid vendor", func(t *testing.T) {
				promptMessages := json.RawMessage(
					`[{"role": "user", "content": "Hello {name}!"}, {"role": "system", "content": "You are a helpful {name}."}]`,
				)
				vendor := db.ModelVendor("abc")
				_, err := api.ParsePromptMessages(promptMessages, vendor)
				assert.Error(t, err)
			})
		})
	})
}
