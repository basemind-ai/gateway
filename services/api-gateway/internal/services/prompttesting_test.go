package services_test

import (
	"context"
	"errors"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/gen/go/ptesting/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/services"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/grpcutils"
	"github.com/basemind-ai/monorepo/shared/go/jwtutils"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/auth"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
	"io"
	"testing"
	"time"
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
	invalidUUID := "invalid-uuid"
	project, _ := factories.CreateProject(context.Background())
	application, _ := factories.CreateApplication(context.TODO(), project.ID)
	applicationID := db.UUIDToString(&application.ID)

	jwtToken, jwtCreateErr := jwtutils.CreateJWT(
		time.Minute,
		[]byte(JWTSecret),
		applicationID,
	)
	assert.NoError(t, jwtCreateErr)

	templateVariables := map[string]string{"userInput": "I'm a rainbow"}
	expectedTemplateVariables := []string{"userInput"}

	t.Run("TestPrompt", func(t *testing.T) {
		t.Run("streams response correctly", func(t *testing.T) {
			openaiService := createOpenAIService(t)
			client := createPromptTestingServiceClient(t)

			finishReason := "done"

			openaiService.Stream = []*openaiconnector.OpenAIStreamResponse{
				{Content: "1"},
				{Content: "2"},
				{Content: "3", FinishReason: &finishReason},
			}

			outgoingContext := metadata.AppendToOutgoingContext(
				context.TODO(),
				"authorization",
				fmt.Sprintf("bearer %s", jwtToken),
			)

			stream, streamErr := client.TestPrompt(outgoingContext, &ptesting.PromptTestRequest{
				TemplateVariables:         templateVariables,
				ExpectedTemplateVariables: expectedTemplateVariables,
				ApplicationId:             applicationID,
				ModelParameters:           modelParameters,
				ModelVendor:               string(db.ModelVendorOPENAI),
				ModelType:                 string(db.ModelTypeGpt432k),
				ProviderPromptMessages:    promptMessages,
				PromptConfigId:            nil,
			})
			assert.NoError(t, streamErr)

			chunks := make([]*ptesting.PromptTestingStreamingPromptResponse, 0)

			for {
				chunk, receiveErr := stream.Recv()
				if receiveErr != nil {
					if !errors.Is(receiveErr, io.EOF) {
						assert.Failf(t, "Received unexpected error:", "%v", receiveErr)
					}

					break
				}
				chunks = append(chunks, chunk)
			}

			assert.Len(t, chunks, 4)
			assert.Equal(t, "1", chunks[0].Content)           //nolint: gosec
			assert.Equal(t, "2", chunks[1].Content)           //nolint: gosec
			assert.Equal(t, "3", chunks[2].Content)           //nolint: gosec
			assert.Equal(t, "done", *chunks[3].FinishReason)  //nolint: gosec
			assert.NotNil(t, chunks[3].PromptRequestRecordId) //nolint: gosec
		})
		t.Run("should return error if application ID is not a valid UUID", func(t *testing.T) {
			mock := MockPromptTestingServerStream{Ctx: context.TODO()}
			err := srv.TestPrompt(&ptesting.PromptTestRequest{
				ApplicationId:          invalidUUID,
				ModelParameters:        modelParameters,
				ProviderPromptMessages: promptMessages,
				PromptConfigId:         nil,
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
				PromptConfigId:         &invalidUUID,
				TemplateVariables:      nil,
				ModelVendor:            string(db.ModelVendorOPENAI),
				ModelType:              string(db.ModelTypeGpt432k),
			}, mock)
			assert.Error(t, err)
		})
	})
}
