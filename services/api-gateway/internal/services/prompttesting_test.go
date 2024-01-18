package services_test

import (
	"context"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/gen/go/ptesting/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/services"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/grpcutils"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/auth"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
	"testing"
)

type MockPromptTestingServerStream struct {
	grpc.ServerStream
	Ctx      context.Context
	Response *ptesting.PromptTestingStreamingPromptResponse
	Error    error
}

func (m MockPromptTestingServerStream) Context() context.Context {
	if m.Ctx != nil {
		return m.Ctx
	}
	return context.TODO()
}

func (m MockPromptTestingServerStream) Send(
	response *ptesting.PromptTestingStreamingPromptResponse,
) error {
	m.Response = response //nolint: all
	return m.Error
}

func createPromptTestingServiceClient(t *testing.T) ptesting.PromptTestingServiceClient {
	t.Helper()
	listener := testutils.CreateTestGRPCServer[ptesting.PromptTestingServiceServer](
		t,
		ptesting.RegisterPromptTestingServiceServer,
		services.PromptTestingServer{},
		// we are using the same auth middleware as we do on main.go in this test
		grpc.ChainUnaryInterceptor(
			auth.UnaryServerInterceptor(grpcutils.NewAuthHandler(JWTSecret).HandleAuth),
		),
		grpc.ChainStreamInterceptor(
			auth.StreamServerInterceptor(grpcutils.NewAuthHandler(JWTSecret).HandleAuth),
		),
	)
	return testutils.CreateTestGRPCClient[ptesting.PromptTestingServiceClient](
		t,
		listener,
		ptesting.NewPromptTestingServiceClient,
	)
}

func TestPromptTestingService(t *testing.T) {
	srv := services.PromptTestingServer{}
	modelParameters := factories.CreateOpenAIModelParameters()
	promptMessages := factories.CreateOpenAIPromptMessages("you are a bot", "{userInput}", nil)
	project, _ := factories.CreateProject(context.Background())
	application, _ := factories.CreateApplication(context.TODO(), project.ID)
	promptConfig, _ := factories.CreateOpenAIPromptConfig(context.Background(), application.ID)

	invalidUUID := "invalid-uuid"
	promptConfigID := db.UUIDToString(&promptConfig.ID)

	t.Run("TestPrompt", func(t *testing.T) {
		t.Run("should return error if project ID is not a valid UUID", func(t *testing.T) {
			mock := MockPromptTestingServerStream{Ctx: context.TODO()}
			err := srv.TestPrompt(&ptesting.PromptTestRequest{
				ProjectId:              invalidUUID,
				ApplicationId:          db.UUIDToString(&application.ID),
				ModelParameters:        *modelParameters,
				ProviderPromptMessages: *promptMessages,
				PromptConfigId:         promptConfigID,
				TemplateVariables:      nil,
				ModelVendor:            string(models.ModelVendorOPENAI),
				ModelType:              string(models.ModelTypeGpt432k),
			}, mock)
			assert.Error(t, err)
		})

		t.Run("should return error if application ID is not a valid UUID", func(t *testing.T) {
			mock := MockPromptTestingServerStream{Ctx: context.TODO()}
			err := srv.TestPrompt(&ptesting.PromptTestRequest{
				ProjectId:              db.UUIDToString(&project.ID),
				ApplicationId:          invalidUUID,
				ModelParameters:        *modelParameters,
				ProviderPromptMessages: *promptMessages,
				PromptConfigId:         promptConfigID,
				TemplateVariables:      nil,
				ModelVendor:            string(models.ModelVendorOPENAI),
				ModelType:              string(models.ModelTypeGpt432k),
			}, mock)
			assert.Error(t, err)
		})

		t.Run("should return error if promptConfigID is not a valid UUID", func(t *testing.T) {
			mock := MockPromptTestingServerStream{Ctx: context.TODO()}
			err := srv.TestPrompt(&ptesting.PromptTestRequest{
				ProjectId:              db.UUIDToString(&project.ID),
				ApplicationId:          "38c8e86d-0027-4c99-ba34-82c77e5cd145",
				ModelParameters:        *modelParameters,
				ProviderPromptMessages: *promptMessages,
				PromptConfigId:         invalidUUID,
				TemplateVariables:      nil,
				ModelVendor:            string(models.ModelVendorOPENAI),
				ModelType:              string(models.ModelTypeGpt432k),
			}, mock)
			assert.Error(t, err)
		})

		t.Run("should handle project retrieval err", func(t *testing.T) {
			mock := MockPromptTestingServerStream{Ctx: context.TODO()}

			err := srv.TestPrompt(&ptesting.PromptTestRequest{
				ProjectId:              "a4460279-c733-420e-868c-af7f204d9fff",
				ApplicationId:          db.UUIDToString(&application.ID),
				ModelParameters:        *modelParameters,
				ProviderPromptMessages: *promptMessages,
				PromptConfigId:         promptConfigID,
				TemplateVariables:      nil,
				ModelVendor:            string(models.ModelVendorOPENAI),
				ModelType:              string(models.ModelTypeGpt35Turbo),
			}, mock)
			assert.Error(t, err)
		})

		t.Run("should handle project with no credits", func(t *testing.T) {
			err := factories.CreateProviderPricingModels(context.Background())
			assert.NoError(t, err)

			newProject, err := factories.CreateProject(context.TODO())
			assert.NoError(t, err)

			err = db.GetQueries().
				UpdateProjectCredits(context.Background(), models.UpdateProjectCreditsParams{
					ID:      newProject.ID,
					Credits: *exc.MustResult(db.StringToNumeric("-1.0")),
				})
			assert.NoError(t, err)

			mock := MockPromptTestingServerStream{Ctx: context.TODO()}
			err = srv.TestPrompt(&ptesting.PromptTestRequest{
				ProjectId:              db.UUIDToString(&newProject.ID),
				ApplicationId:          db.UUIDToString(&application.ID),
				ModelParameters:        *modelParameters,
				ProviderPromptMessages: *promptMessages,
				PromptConfigId:         promptConfigID,
				TemplateVariables:      nil,
				ModelVendor:            string(models.ModelVendorOPENAI),
				ModelType:              string(models.ModelTypeGpt432k),
			}, mock)
			assert.Error(t, err)
		})

		t.Run("should handle project with negative credits", func(t *testing.T) {
			err := factories.CreateProviderPricingModels(context.Background())
			assert.NoError(t, err)

			newProject, err := factories.CreateProject(context.TODO())
			assert.NoError(t, err)

			err = db.GetQueries().
				UpdateProjectCredits(context.Background(), models.UpdateProjectCreditsParams{
					ID:      newProject.ID,
					Credits: *exc.MustResult(db.StringToNumeric("-1.1")),
				})
			assert.NoError(t, err)

			mock := MockPromptTestingServerStream{Ctx: context.TODO()}
			err = srv.TestPrompt(&ptesting.PromptTestRequest{
				ProjectId:              db.UUIDToString(&newProject.ID),
				ApplicationId:          db.UUIDToString(&application.ID),
				ModelParameters:        *modelParameters,
				ProviderPromptMessages: *promptMessages,
				PromptConfigId:         promptConfigID,
				TemplateVariables:      nil,
				ModelVendor:            string(models.ModelVendorOPENAI),
				ModelType:              string(models.ModelTypeGpt432k),
			}, mock)
			assert.Error(t, err)
		})
	})

	t.Run("CreatePromptTestingStreamMessage", func(t *testing.T) {
		t.Run("should set finishReason to error of result.Error is not nil", func(t *testing.T) {
			result := dto.PromptResultDTO{Error: assert.AnError}
			msg, isFinished := services.CreatePromptTestingStreamMessage(context.TODO(), result)

			assert.True(t, isFinished)
			assert.Equal(t, *msg.FinishReason, "error")
		})

		t.Run(
			"should set finishReason to done if result.RequestRecord is not nil",
			func(t *testing.T) {
				id := exc.MustResult(db.StringToUUID("00d7ba5c-533e-4a53-8e94-cbf35315f6e9"))
				result := dto.PromptResultDTO{RequestRecord: &models.PromptRequestRecord{
					ID: *id,
				}}
				msg, isFinished := services.CreatePromptTestingStreamMessage(context.TODO(), result)

				assert.True(t, isFinished)
				assert.Equal(t, *msg.FinishReason, "done")
				assert.Equal(t, *msg.PromptRequestRecordId, "00d7ba5c-533e-4a53-8e94-cbf35315f6e9")
			},
		)

		t.Run(
			"should not set finishReason to done if finishReason is already set to error",
			func(t *testing.T) {
				id := exc.MustResult(db.StringToUUID("00d7ba5c-533e-4a53-8e94-cbf35315f6e9"))
				result := dto.PromptResultDTO{RequestRecord: &models.PromptRequestRecord{
					ID: *id,
				}, Error: assert.AnError}
				msg, isFinished := services.CreatePromptTestingStreamMessage(context.TODO(), result)

				assert.True(t, isFinished)
				assert.Equal(t, *msg.FinishReason, "error")
				assert.Equal(t, *msg.PromptRequestRecordId, "00d7ba5c-533e-4a53-8e94-cbf35315f6e9")
			},
		)

		t.Run("should set content if result.Content is not nil", func(t *testing.T) {
			content := "content"
			result := dto.PromptResultDTO{Content: &content}
			msg, isFinished := services.CreatePromptTestingStreamMessage(context.TODO(), result)

			assert.False(t, isFinished)
			assert.Equal(t, msg.Content, "content")
		})
	})
}
