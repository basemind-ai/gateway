package services_test

import (
	"context"
	"errors"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/gen/go/gateway/v1"
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/gen/go/ptesting/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/connectors"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/jwtutils"
	"github.com/basemind-ai/monorepo/shared/go/rediscache"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/go-redis/cache/v9"
	"github.com/go-redis/redismock/v9"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
	"io"
	"net"
	"testing"
	"time"
)

func TestMain(m *testing.M) {
	cleanup := testutils.CreateNamespaceTestDBModule("service-test")
	defer cleanup()
	m.Run()
}

const JWTSecret = "ABC123"

func createOpenAIService(t *testing.T) *testutils.MockOpenAIService {
	t.Helper()
	mockService := &testutils.MockOpenAIService{T: t}
	listener := testutils.CreateTestGRPCServer[openaiconnector.OpenAIServiceServer](
		t,
		openaiconnector.RegisterOpenAIServiceServer,
		mockService,
	)

	t.Setenv("OPENAI_CONNECTOR_ADDRESS", "")

	initErr := connectors.Init(context.TODO(),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithContextDialer(
			func(context.Context, string) (net.Conn, error) {
				return listener.Dial()
			},
		),
	)
	assert.NoError(t, initErr)

	return mockService
}

func createTestCache(
	t *testing.T,
	applicationIDString string,
) (*cache.Cache, redismock.ClientMock) {
	t.Helper()
	redisDB, mockRedis := redismock.NewClientMock()

	rediscache.SetClient(cache.New(&cache.Options{
		Redis: redisDB,
	}))

	cacheClient := rediscache.GetClient()

	t.Cleanup(func() {
		redisDB.Del(context.TODO(), applicationIDString)
	})

	return cacheClient, mockRedis
}

func TestIntegration(t *testing.T) { //nolint: revive
	project, _ := factories.CreateProject(context.Background())
	application, _ := factories.CreateApplication(context.TODO(), project.ID)
	promptConfig, _ := factories.CreatePromptConfig(context.Background(), application.ID)
	modelParameters, _ := factories.CreateModelParameters()
	promptMessages, _ := factories.CreateOpenAIPromptMessages("you are a bot", "{userInput}", nil)

	openaiService := createOpenAIService(t)
	requestConfigurationDTO := createRequestConfigurationDTO(t, project.ID)
	jwtToken, jwtCreateErr := jwtutils.CreateJWT(
		time.Minute,
		[]byte(JWTSecret),
		requestConfigurationDTO.ApplicationIDString,
	)
	templateVariables := map[string]string{"userInput": "I'm a rainbow"}
	expectedTemplateVariables := []string{"userInput"}

	applicationID := db.UUIDToString(&application.ID)
	promptConfigID := db.UUIDToString(&promptConfig.ID)

	assert.NoError(t, jwtCreateErr)

	t.Run("APIGatewayService", func(t *testing.T) {
		t.Run("RequestPrompt", func(t *testing.T) {
			t.Run("returns response correctly", func(t *testing.T) {
				client := createGatewayServiceClient(t)
				cacheClient, mockRedis := createTestCache(
					t,
					requestConfigurationDTO.ApplicationIDString,
				)

				expectedResponseContent := "Response content"

				openaiService.Response = &openaiconnector.OpenAIPromptResponse{
					Content: expectedResponseContent,
				}

				expectedCacheValue, marshalErr := cacheClient.Marshal(requestConfigurationDTO)
				assert.NoError(t, marshalErr)

				mockRedis.ExpectGet(requestConfigurationDTO.ApplicationIDString).RedisNil()
				mockRedis.ExpectSet(requestConfigurationDTO.ApplicationIDString, expectedCacheValue, time.Hour/2).
					SetVal("OK")

				outgoingContext := metadata.AppendToOutgoingContext(
					context.TODO(),
					"authorization",
					fmt.Sprintf("bearer %s", jwtToken),
				)

				firstResponse, firstResponseErr := client.RequestPrompt(
					outgoingContext,
					&gateway.PromptRequest{
						TemplateVariables: map[string]string{"userInput": "abc"},
					},
				)
				assert.NoError(t, firstResponseErr)
				assert.Equal(t, expectedResponseContent, firstResponse.Content)

				mockRedis.ExpectGet(requestConfigurationDTO.ApplicationIDString).
					SetVal(string(expectedCacheValue))

				secondResponse, secondResponseErr := client.RequestPrompt(
					outgoingContext,
					&gateway.PromptRequest{
						TemplateVariables: map[string]string{"userInput": "abc"},
					},
				)
				assert.NoError(t, secondResponseErr)
				assert.Equal(t, expectedResponseContent, secondResponse.Content)
			})
		})

		t.Run("RequestStreamingPrompt", func(t *testing.T) {
			t.Run("streams response correctly", func(t *testing.T) {
				client := createGatewayServiceClient(t)
				cacheClient, mockRedis := createTestCache(
					t,
					requestConfigurationDTO.ApplicationIDString,
				)

				finishReason := "done"

				openaiService.Stream = []*openaiconnector.OpenAIStreamResponse{
					{Content: "1"},
					{Content: "2"},
					{Content: "3", FinishReason: &finishReason},
				}

				expectedCacheValue, marshalErr := cacheClient.Marshal(requestConfigurationDTO)
				assert.NoError(t, marshalErr)

				mockRedis.ExpectGet(requestConfigurationDTO.ApplicationIDString).RedisNil()
				mockRedis.ExpectSet(requestConfigurationDTO.ApplicationIDString, expectedCacheValue, time.Hour/2).
					SetVal("OK")

				outgoingContext := metadata.AppendToOutgoingContext(
					context.TODO(),
					"authorization",
					fmt.Sprintf("bearer %s", jwtToken),
				)

				stream, streamErr := client.RequestStreamingPrompt(
					outgoingContext,
					&gateway.PromptRequest{
						TemplateVariables: map[string]string{"userInput": "abc"},
					},
				)
				assert.NoError(t, streamErr)

				chunks := make([]*gateway.StreamingPromptResponse, 0)

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
				assert.Equal(t, "1", chunks[0].Content)            //nolint: gosec
				assert.Equal(t, "2", chunks[1].Content)            //nolint: gosec
				assert.Equal(t, "3", chunks[2].Content)            //nolint: gosec
				assert.Equal(t, "done", *chunks[3].FinishReason)   //nolint: gosec
				assert.Equal(t, 1, int(*chunks[3].ResponseTokens)) //nolint: gosec
				assert.Equal(t, 16, int(*chunks[3].RequestTokens)) //nolint: gosec
			})
		})
	})

	t.Run("PromptTestingService", func(t *testing.T) {
		t.Run("TestPrompt", func(t *testing.T) {
			t.Run("streams response correctly", func(t *testing.T) {
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
					PromptConfigId:            promptConfigID,
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
		})
	})
}
