package services_test

import (
	"context"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/gen/go/ptesting/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/services"
	"github.com/basemind-ai/monorepo/shared/go/db"
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
	modelParameters, _ := factories.CreateModelParameters()
	promptMessages, _ := factories.CreateOpenAIPromptMessages("you are a bot", "{userInput}", nil)
	project, _ := factories.CreateProject(context.Background())
	application, _ := factories.CreateApplication(context.TODO(), project.ID)
	promptConfig, _ := factories.CreatePromptConfig(context.Background(), application.ID)

	invalidUUID := "invalid-uuid"
	promptConfigID := db.UUIDToString(&promptConfig.ID)

	t.Run("TestPrompt", func(t *testing.T) {
		t.Run("should return error if application ID is not a valid UUID", func(t *testing.T) {
			mock := MockPromptTestingServerStream{Ctx: context.TODO()}
			err := srv.TestPrompt(&ptesting.PromptTestRequest{
				ApplicationId:          invalidUUID,
				ModelParameters:        modelParameters,
				ProviderPromptMessages: promptMessages,
				PromptConfigId:         promptConfigID,
				TemplateVariables:      nil,
				ModelVendor:            string(db.ModelVendorOPENAI),
				ModelType:              string(db.ModelTypeGpt432k),
			}, mock)
			assert.Error(t, err)
		})
		t.Run("should return error if promptConfigID is not a valid UUID", func(t *testing.T) {
			mock := MockPromptTestingServerStream{Ctx: context.TODO()}
			err := srv.TestPrompt(&ptesting.PromptTestRequest{
				ApplicationId:          "38c8e86d-0027-4c99-ba34-82c77e5cd145",
				ModelParameters:        modelParameters,
				ProviderPromptMessages: promptMessages,
				PromptConfigId:         invalidUUID,
				TemplateVariables:      nil,
				ModelVendor:            string(db.ModelVendorOPENAI),
				ModelType:              string(db.ModelTypeGpt432k),
			}, mock)
			assert.Error(t, err)
		})
	})
}