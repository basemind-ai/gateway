package service_test

import (
	"context"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/gen/go/gateway/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/service"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	dbTestUtils "github.com/basemind-ai/monorepo/shared/go/db/testutils"
	"github.com/basemind-ai/monorepo/shared/go/grpcutils"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
	"testing"
)

func TestMain(m *testing.M) {
	cleanup := dbTestUtils.CreateNamespaceTestDBModule("service-test")
	defer cleanup()
	m.Run()
}

func createRequestConfigurationDTO(t *testing.T) dto.RequestConfigurationDTO {
	t.Helper()
	project, projectCreateErr := factories.CreateProject(context.TODO())
	assert.NoError(t, projectCreateErr)

	application, applicationCreateErr := factories.CreateApplication(context.TODO(), project.ID)
	assert.NoError(t, applicationCreateErr)

	promptConfig, promptConfigCreateErr := factories.CreatePromptConfig(
		context.TODO(),
		application.ID,
	)
	assert.NoError(t, promptConfigCreateErr)

	return dto.RequestConfigurationDTO{
		ApplicationIDString: db.UUIDToString(&application.ID),
		ApplicationID:       application.ID,
		ProjectID:           project.ID,
		PromptConfigID:      promptConfig.ID,
		PromptConfigData: datatypes.PromptConfigDTO{
			ID:                        db.UUIDToString(&promptConfig.ID),
			Name:                      promptConfig.Name,
			ModelType:                 promptConfig.ModelType,
			ModelVendor:               promptConfig.ModelVendor,
			ModelParameters:           promptConfig.ModelParameters,
			ProviderPromptMessages:    promptConfig.ProviderPromptMessages,
			ExpectedTemplateVariables: promptConfig.ExpectedTemplateVariables,
			IsDefault:                 promptConfig.IsDefault,
			CreatedAt:                 promptConfig.CreatedAt.Time,
			UpdatedAt:                 promptConfig.UpdatedAt.Time,
		},
	}
}

type MockServerStream struct {
	grpc.ServerStream
	Ctx      context.Context
	Response *gateway.StreamingPromptResponse
	Error    error
}

func (m MockServerStream) Context() context.Context {
	if m.Ctx != nil {
		return m.Ctx
	}
	return context.TODO()
}

func (m MockServerStream) Send(response *gateway.StreamingPromptResponse) error {
	m.Response = response //nolint: all
	return m.Error
}

func TestService(t *testing.T) {
	srv := service.New()

	configuration := createRequestConfigurationDTO(t)
	_, _ = CreateTestCache(t, "")

	t.Run("New", func(t *testing.T) {
		assert.IsType(t, service.Server{}, srv)
	})
	t.Run("RequestPrompt", func(t *testing.T) {
		t.Run("return error when ApplicationIDContext is not set", func(t *testing.T) {
			_, err := srv.RequestPrompt(context.TODO(), nil)
			assert.Errorf(t, err, service.ErrorApplicationIDNotInContext)
		})

		t.Run("returns error when a default prompt config is not found", func(t *testing.T) {
			application, _ := factories.CreateApplication(context.TODO(), configuration.ProjectID)
			applicationIDContext := context.WithValue(
				context.Background(),
				grpcutils.ApplicationIDContextKey,
				db.UUIDToString(&application.ID),
			)
			_, err := srv.RequestPrompt(applicationIDContext, &gateway.PromptRequest{})

			assert.Errorf(t, err, "the application does not have an active prompt configuration")
		})

		t.Run(
			"returns error when a prompt config with a provided ID is not found",
			func(t *testing.T) {
				application, _ := factories.CreateApplication(
					context.TODO(),
					configuration.ProjectID,
				)
				applicationIDContext := context.WithValue(
					context.Background(),
					grpcutils.ApplicationIDContextKey,
					db.UUIDToString(&application.ID),
				)
				_, err := srv.RequestPrompt(
					applicationIDContext,
					&gateway.PromptRequest{PromptConfigId: &configuration.PromptConfigData.ID},
				)

				assert.Errorf(
					t,
					err,
					"the application does not have an active prompt configuration",
				)
			},
		)

		t.Run("returns error when template variables are not valid", func(t *testing.T) {
			applicationIDContext := context.WithValue(
				context.Background(),
				grpcutils.ApplicationIDContextKey,
				configuration.ApplicationIDString,
			)
			_, err := srv.RequestPrompt(applicationIDContext, &gateway.PromptRequest{
				TemplateVariables: map[string]string{"name": "John"},
			})

			assert.Errorf(t, err, "missing template variable {userInput}")
		})
	})
	t.Run("RequestStreamingPrompt", func(t *testing.T) {
		t.Run("return error when ApplicationIDContext is not set", func(t *testing.T) {
			err := srv.RequestStreamingPrompt(nil, MockServerStream{})
			assert.Errorf(t, err, service.ErrorApplicationIDNotInContext)
		})

		t.Run("returns error when prompt config is not found", func(t *testing.T) {
			application, _ := factories.CreateApplication(context.TODO(), configuration.ProjectID)
			applicationIDContext := context.WithValue(
				context.Background(),
				grpcutils.ApplicationIDContextKey,
				db.UUIDToString(&application.ID),
			)
			err := srv.RequestStreamingPrompt(
				&gateway.PromptRequest{},
				MockServerStream{Ctx: applicationIDContext},
			)
			assert.Errorf(t, err, "the application does not have an active prompt configuration")
		})

		t.Run(
			"returns error when a prompt config with a provided ID is not found",
			func(t *testing.T) {
				application, _ := factories.CreateApplication(
					context.TODO(),
					configuration.ProjectID,
				)
				applicationIDContext := context.WithValue(
					context.Background(),
					grpcutils.ApplicationIDContextKey,
					db.UUIDToString(&application.ID),
				)
				err := srv.RequestStreamingPrompt(
					&gateway.PromptRequest{PromptConfigId: &configuration.PromptConfigData.ID},
					MockServerStream{Ctx: applicationIDContext},
				)

				assert.Errorf(
					t,
					err,
					"the application does not have an active prompt configuration",
				)
			},
		)

		t.Run("returns error when template variables are not valid", func(t *testing.T) {
			applicationIDContext := context.WithValue(
				context.Background(),
				grpcutils.ApplicationIDContextKey,
				configuration.ApplicationIDString,
			)
			err := srv.RequestStreamingPrompt(&gateway.PromptRequest{
				TemplateVariables: map[string]string{"name": "John"},
			}, MockServerStream{Ctx: applicationIDContext})

			assert.Errorf(t, err, "missing template variable {userInput}")
		})
	})
}
