package api_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/middleware"
	"github.com/basemind-ai/monorepo/shared/go/db"
	dbTestUtils "github.com/basemind-ai/monorepo/shared/go/db/testutils"
	httpTestUtils "github.com/basemind-ai/monorepo/shared/go/httpclient/testutils"
	"github.com/basemind-ai/monorepo/shared/go/router"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/stretchr/testify/assert"
	"net/http"
	"strings"
	"testing"
)

func TestAPI(t *testing.T) {
	dbTestUtils.CreateTestDB(t)

	t.Run("Project CRUD", func(t *testing.T) {
		t.Run("HandleDashboardUserPostLogin", func(t *testing.T) {
			t.Run("creates a new user and returns its default project", func(t *testing.T) {
				userId := "123abc"
				r := router.New(router.Options{
					Environment:      "test",
					ServiceName:      "test",
					RegisterHandlers: api.RegisterHandlers,
					Middlewares: []func(next http.Handler) http.Handler{
						middleware.CreateMockFirebaseAuthMiddleware(userId),
					},
				})

				testClient := httpTestUtils.CreateTestClient(t, r)

				response, requestErr := testClient.Get(context.TODO(), fmt.Sprintf("/v1%s", api.ProjectsListEndpoint))
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

				_, userCreateErr := api.GetOrCreateUser(context.Background(), db.GetQueries(), userId)
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

				response, requestErr := testClient.Get(context.TODO(), fmt.Sprintf("/v1%s", api.ProjectsListEndpoint))
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

				response, requestErr := testClient.Get(context.TODO(), fmt.Sprintf("/v1%s", api.ProjectsListEndpoint))
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusInternalServerError, response.StatusCode)
			})
		})
	})

	t.Run("Application CRUD", func(t *testing.T) {
		project, createProjectErr := db.GetQueries().CreateProject(context.TODO(), db.CreateProjectParams{
			Name:        "test project",
			Description: "test project description",
		})
		assert.NoError(t, createProjectErr)

		projectId := db.UUIDToString(&project.ID)

		userId := "123abc"
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
					fmt.Sprintf("/v1%s", strings.ReplaceAll(api.ApplicationsListEndpoint, "{projectId}", projectId)),
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
					fmt.Sprintf("/v1%s", strings.ReplaceAll(api.ApplicationsListEndpoint, "{projectId}", "invalid")),
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
					fmt.Sprintf("/v1%s", strings.ReplaceAll(api.ApplicationsListEndpoint, "{projectId}", projectId)),
					"invalid",
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			})
		})

		t.Run("HandleRetrieveApplication", func(t *testing.T) {
			t.Run("retrieves an existing application", func(t *testing.T) {
				application, applicationCreateErr := db.GetQueries().CreateApplication(context.TODO(), db.CreateApplicationParams{
					ProjectID: project.ID,
				})
				assert.NoError(t, applicationCreateErr)

				applicationId := db.UUIDToString(&application.ID)
				response, requestErr := testClient.Get(
					context.TODO(),
					fmt.Sprintf("/v1%s", strings.ReplaceAll(api.ApplicationDetailEndpoint, "{applicationId}", applicationId)),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusOK, response.StatusCode)

				responseApplication := db.Application{}
				deserializationErr := serialization.DeserializeJson(response.Body, &responseApplication)
				assert.NoError(t, deserializationErr)
				assert.Equal(t, application.ID, responseApplication.ID)
				assert.Equal(t, application.Name, responseApplication.Name)
				assert.Equal(t, application.Description, responseApplication.Description)
			})

			t.Run("returns an error if the application id is invalid", func(t *testing.T) {
				response, requestErr := testClient.Get(
					context.TODO(),
					fmt.Sprintf("/v1%s", strings.ReplaceAll(api.ApplicationDetailEndpoint, "{applicationId}", "invalid")),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			})
		})

		t.Run("HandleUpdateApplication", func(t *testing.T) {
			t.Run("updates an existing application", func(t *testing.T) {
				application, applicationCreateErr := db.GetQueries().CreateApplication(context.TODO(), db.CreateApplicationParams{
					ProjectID: project.ID,
				})
				assert.NoError(t, applicationCreateErr)

				applicationId := db.UUIDToString(&application.ID)
				response, requestErr := testClient.Patch(
					context.TODO(),
					fmt.Sprintf("/v1%s", strings.ReplaceAll(api.ApplicationDetailEndpoint, "{applicationId}", applicationId)),
					map[string]interface{}{
						"name":        "updated app",
						"description": "updated app description",
					},
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusOK, response.StatusCode)

				responseApplication := db.Application{}
				deserializationErr := serialization.DeserializeJson(response.Body, &responseApplication)
				assert.NoError(t, deserializationErr)
				assert.Equal(t, application.ID, responseApplication.ID)
				assert.Equal(t, "updated app", responseApplication.Name)
				assert.Equal(t, "updated app description", responseApplication.Description)
			})

			t.Run("returns an error if the application id is invalid", func(t *testing.T) {
				response, requestErr := testClient.Patch(
					context.TODO(),
					fmt.Sprintf("/v1%s", strings.ReplaceAll(api.ApplicationDetailEndpoint, "{applicationId}", "invalid")),
					map[string]interface{}{
						"name":        "updated app",
						"description": "updated app description",
					},
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			})

			t.Run("returns an error if the request body is invalid", func(t *testing.T) {
				application, applicationCreateErr := db.GetQueries().CreateApplication(context.TODO(), db.CreateApplicationParams{
					ProjectID: project.ID,
				})
				assert.NoError(t, applicationCreateErr)

				applicationId := db.UUIDToString(&application.ID)
				response, requestErr := testClient.Patch(
					context.TODO(),
					fmt.Sprintf("/v1%s", strings.ReplaceAll(api.ApplicationDetailEndpoint, "{applicationId}", applicationId)),
					"invalid",
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			})
		})

		t.Run("HandleDeleteApplication", func(t *testing.T) {
			t.Run("deletes an existing application", func(t *testing.T) {
				application, applicationCreateErr := db.GetQueries().CreateApplication(context.TODO(), db.CreateApplicationParams{
					ProjectID: project.ID,
				})
				assert.NoError(t, applicationCreateErr)

				applicationId := db.UUIDToString(&application.ID)
				response, requestErr := testClient.Delete(
					context.TODO(),
					fmt.Sprintf("/v1%s", strings.ReplaceAll(api.ApplicationDetailEndpoint, "{applicationId}", applicationId)),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusNoContent, response.StatusCode)

				_, applicationRetrieveErr := db.GetQueries().FindApplicationById(context.TODO(), application.ID)
				assert.Error(t, applicationRetrieveErr)
			})

			t.Run("returns an error if the application id is invalid", func(t *testing.T) {
				response, requestErr := testClient.Delete(
					context.TODO(),
					fmt.Sprintf("/v1%s", strings.ReplaceAll(api.ApplicationDetailEndpoint, "{applicationId}", "invalid")),
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			})
		})
	})

	t.Run("PromptConfig CRUD", func(t *testing.T) {
		project, createProjectErr := db.GetQueries().CreateProject(context.TODO(), db.CreateProjectParams{
			Name:        "test project",
			Description: "test project description",
		})
		assert.NoError(t, createProjectErr)

		projectId := db.UUIDToString(&project.ID)

		application, applicationCreateErr := db.GetQueries().CreateApplication(context.TODO(), db.CreateApplicationParams{
			ProjectID:   project.ID,
			Name:        "test app",
			Description: "test app description",
		})
		assert.NoError(t, applicationCreateErr)

		applicationId := db.UUIDToString(&application.ID)

		userId := "123abc"
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
		userMessage := "Please write a song about cheese."

		promptMessages, promptMessagesErr := factories.CreatePromptMessages(systemMessages, userMessage)
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

		// fmtDetailEndpoint := func(projectId string, applicationId string, promptConfigId string) string {
		//	return fmt.Sprintf(
		//		"/v1%s",
		//		strings.ReplaceAll(
		//			strings.ReplaceAll(
		//				strings.ReplaceAll(
		//					api.PromptConfigDetailEndpoint,
		//					"{projectId}",
		//					projectId),
		//				"{applicationId}",
		//				applicationId),
		//			"{promptConfigId}",
		//			promptConfigId),
		//	)
		//}

		t.Run("HandleCreatePromptConfig", func(t *testing.T) {
			t.Run("creates a new prompt config", func(t *testing.T) {
				dto := api.PromptConfigDTO{
					Name:              "test prompt config",
					ModelParameters:   modelParameters,
					ModelType:         db.ModelTypeGpt4,
					ModelVendor:       db.ModelVendorOPENAI,
					PromptMessages:    promptMessages,
					TemplateVariables: []string{"userInput"},
					IsDefault:         true,
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
				assert.Equal(t, dto.PromptMessages, promptConfig.PromptMessages)
				assert.Equal(t, dto.TemplateVariables, promptConfig.TemplateVariables)
				assert.Equal(t, dto.IsDefault, promptConfig.IsDefault)
			})

			t.Run("returns bad request for validation errors", func(t *testing.T) {
				failureTestCases := []struct {
					Name string
					Dto  api.PromptConfigDTO
				}{
					{
						Name: "fails validation for missing name",
						Dto: api.PromptConfigDTO{
							ModelParameters:   modelParameters,
							ModelType:         db.ModelTypeGpt4,
							ModelVendor:       db.ModelVendorOPENAI,
							PromptMessages:    promptMessages,
							TemplateVariables: []string{"userInput"},
							IsDefault:         true,
						},
					},
					{
						Name: "fails validation for missing model parameters",
						Dto: api.PromptConfigDTO{
							Name:              "test prompt config",
							ModelType:         db.ModelTypeGpt4,
							ModelVendor:       db.ModelVendorOPENAI,
							PromptMessages:    promptMessages,
							TemplateVariables: []string{"userInput"},
							IsDefault:         true,
						},
					},
					{
						Name: "fails validation for missing model type",
						Dto: api.PromptConfigDTO{
							Name:              "test prompt config",
							ModelParameters:   modelParameters,
							ModelVendor:       db.ModelVendorOPENAI,
							PromptMessages:    promptMessages,
							TemplateVariables: []string{"userInput"},
							IsDefault:         true,
						},
					},
					{
						Name: "fails validation for missing model vendor",
						Dto: api.PromptConfigDTO{
							Name:              "test prompt config",
							ModelType:         db.ModelTypeGpt4,
							ModelParameters:   modelParameters,
							PromptMessages:    promptMessages,
							TemplateVariables: []string{"userInput"},
							IsDefault:         true,
						},
					},
					{
						Name: "fails validation for missing prompt messages",
						Dto: api.PromptConfigDTO{
							Name:              "test prompt config",
							ModelParameters:   modelParameters,
							ModelType:         db.ModelTypeGpt4,
							ModelVendor:       db.ModelVendorOPENAI,
							TemplateVariables: []string{"userInput"},
							IsDefault:         true,
						},
					},
					{
						Name: "fails validation for missing template variables",
						Dto: api.PromptConfigDTO{
							Name:            "test prompt config",
							ModelParameters: modelParameters,
							ModelType:       db.ModelTypeGpt4,
							ModelVendor:     db.ModelVendorOPENAI,
							PromptMessages:  promptMessages,
							IsDefault:       true,
						},
					},
					{
						Name: "fails validation for missing is default",
						Dto: api.PromptConfigDTO{
							Name:              "test prompt config",
							ModelParameters:   modelParameters,
							ModelType:         db.ModelTypeGpt4,
							ModelVendor:       db.ModelVendorOPENAI,
							TemplateVariables: []string{"userInput"},
							PromptMessages:    promptMessages,
						},
					},
					{
						Name: "fails validation for wrong model type",
						Dto: api.PromptConfigDTO{
							Name:              "test prompt config",
							ModelParameters:   modelParameters,
							ModelType:         db.ModelType("abc"),
							ModelVendor:       db.ModelVendorOPENAI,
							TemplateVariables: []string{"userInput"},
							PromptMessages:    promptMessages,
							IsDefault:         true,
						},
					},
					{
						Name: "fails validation for wrong model vendor",
						Dto: api.PromptConfigDTO{
							Name:              "test prompt config",
							ModelParameters:   modelParameters,
							ModelType:         db.ModelTypeGpt432k,
							ModelVendor:       db.ModelVendor("abc"),
							TemplateVariables: []string{"userInput"},
							PromptMessages:    promptMessages,
							IsDefault:         true,
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
				t.Run(fmt.Sprintf("validates successfully model type %s", modelType), func(t *testing.T) {
					dto := api.PromptConfigDTO{
						Name:              fmt.Sprintf("test prompt config: %d", i),
						ModelParameters:   modelParameters,
						ModelType:         modelType,
						ModelVendor:       db.ModelVendorOPENAI,
						PromptMessages:    promptMessages,
						TemplateVariables: []string{"userInput"},
						IsDefault:         true,
					}
					response, requestErr := testClient.Post(
						context.TODO(),
						fmtListEndpoint(projectId, applicationId),
						dto,
					)
					assert.NoError(t, requestErr)
					assert.Equal(t, http.StatusCreated, response.StatusCode)
				})
			}

			t.Run("returns an error if the name of the prompt config is already used", func(t *testing.T) {
				_, promptConfigCreateErr := db.GetQueries().CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
					ApplicationID:     application.ID,
					Name:              "unique name",
					ModelVendor:       db.ModelVendorOPENAI,
					ModelType:         db.ModelTypeGpt4,
					ModelParameters:   modelParameters,
					PromptMessages:    promptMessages,
					TemplateVariables: []string{"userInput"},
					IsDefault:         true,
				})
				assert.NoError(t, promptConfigCreateErr)

				dto := api.PromptConfigDTO{
					Name:              "unique name",
					ModelParameters:   modelParameters,
					ModelType:         db.ModelTypeGpt4,
					ModelVendor:       db.ModelVendorOPENAI,
					PromptMessages:    promptMessages,
					TemplateVariables: []string{"userInput"},
					IsDefault:         true,
				}
				response, requestErr := testClient.Post(
					context.TODO(),
					fmtListEndpoint(projectId, applicationId),
					dto,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			})

			t.Run("rolls back transaction when failing to update record", func(t *testing.T) {
				defaultPromptConfig, promptConfigCreateErr := db.GetQueries().CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
					ApplicationID:     application.ID,
					Name:              "default prompt config",
					ModelVendor:       db.ModelVendorOPENAI,
					ModelType:         db.ModelTypeGpt4,
					ModelParameters:   modelParameters,
					PromptMessages:    promptMessages,
					TemplateVariables: []string{"userInput"},
					IsDefault:         true,
				})
				assert.NoError(t, promptConfigCreateErr)

				dto := api.PromptConfigDTO{
					Name:              "default prompt config",
					ModelParameters:   modelParameters,
					ModelType:         db.ModelTypeGpt4,
					ModelVendor:       db.ModelVendorOPENAI,
					PromptMessages:    promptMessages,
					TemplateVariables: []string{"userInput"},
					IsDefault:         true,
				}
				response, requestErr := testClient.Post(
					context.TODO(),
					fmtListEndpoint(projectId, applicationId),
					dto,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)

				retrievedPromptConfig, retrieveErr := db.GetQueries().FindPromptConfigById(context.Background(), defaultPromptConfig.ID)
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
					api.PromptConfigDTO{
						Name:              "test prompt config",
						ModelParameters:   modelParameters,
						ModelType:         db.ModelTypeGpt4,
						ModelVendor:       db.ModelVendorOPENAI,
						PromptMessages:    promptMessages,
						TemplateVariables: []string{"userInput"},
						IsDefault:         true,
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
	})
}
