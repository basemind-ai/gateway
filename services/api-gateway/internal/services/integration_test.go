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
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/jwtutils"
	"github.com/basemind-ai/monorepo/shared/go/rediscache"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/go-redis/cache/v9"
	"github.com/go-redis/redismock/v9"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
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

	t.Setenv("OPENAI_CONNECTOR_ADDRESS", "")
	t.Setenv("COHERE_CONNECTOR_ADDRESS", "")

	mockService := &testutils.MockOpenAIService{T: t}
	listener := testutils.CreateTestGRPCServer[openaiconnector.OpenAIServiceServer](
		t,
		openaiconnector.RegisterOpenAIServiceServer,
		mockService,
	)

	connectors.Init(
		context.TODO(),
		grpc.WithContextDialer(
			func(context.Context, string) (net.Conn, error) {
				return listener.Dial()
			},
		),
	)

	return mockService
}

func createTestCache(
	t *testing.T,
	ids ...string,
) (*cache.Cache, redismock.ClientMock) {
	t.Helper()
	redisDB, mockRedis := redismock.NewClientMock()

	rediscache.SetClient(cache.New(&cache.Options{
		Redis: redisDB,
	}))

	cacheClient := rediscache.GetClient()

	t.Cleanup(func() {
		for _, id := range ids {
			redisDB.Del(context.TODO(), id)
		}
	})

	return cacheClient, mockRedis
}

func TestIntegration(t *testing.T) { //nolint: revive
	testutils.SetTestEnv(t)

	project, _ := factories.CreateProject(context.Background())

	modelParameters := factories.CreateOpenAIModelParameters()
	promptMessages := factories.CreateOpenAIPromptMessages("you are a bot", "{userInput}", nil)
	_ = factories.CreateProviderPricingModels(context.Background())
	requestConfigurationDTO := createRequestConfigurationDTO(t, project.ID)
	token, _ := factories.CreateApplicationInternalAPIKey(
		context.TODO(),
		requestConfigurationDTO.ApplicationID,
	)
	jwtToken, jwtCreateErr := jwtutils.CreateJWT(
		time.Minute,
		[]byte(JWTSecret),
		db.UUIDToString(&token.ID),
	)
	assert.NoError(t, jwtCreateErr)

	templateVariables := map[string]string{"userInput": "I'm a rainbow"}
	expectedTemplateVariables := []string{"userInput"}

	projectID := db.UUIDToString(&project.ID)
	applicationID := db.UUIDToString(&requestConfigurationDTO.ApplicationID)
	promptConfigID := db.UUIDToString(&requestConfigurationDTO.PromptConfigID)

	providerKey, providerKeyErr := factories.CreateProviderAPIKey(
		context.TODO(),
		project.ID,
		factories.RandomString(10),
		models.ModelVendorOPENAI,
	)
	assert.NoError(t, providerKeyErr)

	t.Run("APIGatewayService", func(t *testing.T) {
		t.Run("RequestPrompt", func(t *testing.T) {
			t.Run("returns response correctly", func(t *testing.T) {
				openaiService := createOpenAIService(t)

				client := createGatewayServiceClient(t)
				cacheClient, mockRedis := createTestCache(
					t,
					db.UUIDToString(&requestConfigurationDTO.ApplicationID),
				)

				expectedResponseContent := "Response content"

				openaiService.Response = &openaiconnector.OpenAIPromptResponse{
					Content:             expectedResponseContent,
					FinishReason:        "DONE",
					RequestTokensCount:  10,
					ResponseTokensCount: 20,
				}

				mockRedis.ExpectGet(db.UUIDToString(&requestConfigurationDTO.ApplicationID)).
					RedisNil()
				mockRedis.ExpectSet(db.UUIDToString(&requestConfigurationDTO.ApplicationID), exc.MustResult(cacheClient.Marshal(requestConfigurationDTO)), time.Hour/2).
					SetVal("OK")

				mockRedis.ExpectGet(db.UUIDToString(&project.ID)).
					RedisNil()
				mockRedis.ExpectSet(db.UUIDToString(&project.ID), exc.MustResult(cacheClient.Marshal(status.Status{})), time.Minute*5).
					SetVal("OK")

				mockRedis.ExpectSet(db.UUIDToString(&project.ID), exc.MustResult(cacheClient.Marshal(&models.RetrieveProviderKeyRow{
					ID:              providerKey.ID,
					ModelVendor:     models.ModelVendorOPENAI,
					EncryptedApiKey: providerKey.EncryptedApiKey,
				})), time.Hour/2).
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

				mockRedis.ExpectGet(db.UUIDToString(&requestConfigurationDTO.ApplicationID)).
					SetVal(string(exc.MustResult(cacheClient.Marshal(requestConfigurationDTO))))

				mockRedis.ExpectGet(db.UUIDToString(&project.ID)).
					SetVal(string(exc.MustResult(cacheClient.Marshal(status.Status{}))))

				mockRedis.ExpectGet(db.UUIDToString(&project.ID)).
					SetVal(string(exc.MustResult(cacheClient.Marshal(&models.RetrieveProviderKeyRow{
						ID:              providerKey.ID,
						ModelVendor:     models.ModelVendorOPENAI,
						EncryptedApiKey: providerKey.EncryptedApiKey,
					}))))

				secondResponse, secondResponseErr := client.RequestPrompt(
					outgoingContext,
					&gateway.PromptRequest{
						TemplateVariables: map[string]string{"userInput": "abc"},
					},
				)
				assert.NoError(t, secondResponseErr)
				assert.Equal(t, expectedResponseContent, secondResponse.Content)
			})

			t.Run("returns error when PromptResult.Error is not nil", func(t *testing.T) {
				openaiService := createOpenAIService(t)
				client := createGatewayServiceClient(t)
				cacheClient, mockRedis := createTestCache(
					t,
					db.UUIDToString(&requestConfigurationDTO.ApplicationID),
				)

				openaiService.Error = assert.AnError

				expectedCacheValue, marshalErr := cacheClient.Marshal(requestConfigurationDTO)
				assert.NoError(t, marshalErr)

				mockRedis.ExpectGet(db.UUIDToString(&requestConfigurationDTO.ApplicationID)).
					RedisNil()
				mockRedis.ExpectSet(db.UUIDToString(&requestConfigurationDTO.ApplicationID), expectedCacheValue, time.Hour/2).
					SetVal("OK")
				mockRedis.ExpectSet(db.UUIDToString(&project.ID), exc.MustResult(cacheClient.Marshal(&models.RetrieveProviderKeyRow{
					ID:              providerKey.ID,
					ModelVendor:     models.ModelVendorOPENAI,
					EncryptedApiKey: providerKey.EncryptedApiKey,
				})), time.Hour/2).
					SetVal("OK")

				outgoingContext := metadata.AppendToOutgoingContext(
					context.TODO(),
					"authorization",
					fmt.Sprintf("bearer %s", jwtToken),
				)

				_, err := client.RequestPrompt(
					outgoingContext,
					&gateway.PromptRequest{
						TemplateVariables: map[string]string{"userInput": "abc"},
					},
				)
				assert.Error(t, err)
			})
		})

		t.Run("RequestStreamingPrompt", func(t *testing.T) {
			t.Run("streams response correctly", func(t *testing.T) {
				openaiService := createOpenAIService(t)
				client := createGatewayServiceClient(t)
				cacheClient, mockRedis := createTestCache(
					t,
					db.UUIDToString(&requestConfigurationDTO.ApplicationID),
				)

				finishReason := "DONE"
				tokens := uint32(10)

				openaiService.Stream = []*openaiconnector.OpenAIStreamResponse{
					{Content: "1"},
					{Content: "2"},
					{
						Content: "3",
					},
					{
						Content:             "",
						FinishReason:        &finishReason,
						RequestTokensCount:  &tokens,
						ResponseTokensCount: &tokens,
					},
				}

				expectedCacheValue, marshalErr := cacheClient.Marshal(requestConfigurationDTO)
				assert.NoError(t, marshalErr)

				mockRedis.ExpectGet(db.UUIDToString(&requestConfigurationDTO.ApplicationID)).
					RedisNil()
				mockRedis.ExpectSet(db.UUIDToString(&requestConfigurationDTO.ApplicationID), expectedCacheValue, time.Hour/2).
					SetVal("OK")

				mockRedis.ExpectGet(db.UUIDToString(&project.ID)).
					RedisNil()
				mockRedis.ExpectSet(db.UUIDToString(&project.ID), exc.MustResult(cacheClient.Marshal(status.Status{})), time.Minute*5).
					SetVal("OK")

				mockRedis.ExpectSet(db.UUIDToString(&project.ID), exc.MustResult(cacheClient.Marshal(&models.RetrieveProviderKeyRow{
					ID:              providerKey.ID,
					ModelVendor:     models.ModelVendorOPENAI,
					EncryptedApiKey: providerKey.EncryptedApiKey,
				})), time.Hour/2).
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
				assert.Equal(t, "1", chunks[0].Content)
				assert.Equal(t, "2", chunks[1].Content)
				assert.Equal(t, "3", chunks[2].Content)
				assert.Equal(t, "DONE", *chunks[3].FinishReason)
				assert.Equal(t, 10, int(*chunks[3].ResponseTokens))
				assert.Equal(t, 10, int(*chunks[3].RequestTokens))
			})
		})
	})

	t.Run("PromptTestingService", func(t *testing.T) {
		t.Run("TestPrompt", func(t *testing.T) {
			t.Run("streams response correctly", func(t *testing.T) {
				openaiService := createOpenAIService(t)

				client := createPromptTestingServiceClient(t)

				finishReason := "DONE"
				tokens := uint32(10)

				openaiService.Stream = []*openaiconnector.OpenAIStreamResponse{
					{Content: "1"},
					{Content: "2"},
					{
						Content: "3",
					},
					{
						Content:             "",
						FinishReason:        &finishReason,
						RequestTokensCount:  &tokens,
						ResponseTokensCount: &tokens,
					},
				}

				outgoingContext := metadata.AppendToOutgoingContext(
					context.TODO(),
					"authorization",
					fmt.Sprintf("bearer %s", jwtToken),
				)

				cacheClient, mockRedis := createTestCache(
					t,
					db.UUIDToString(&requestConfigurationDTO.ApplicationID),
				)

				mockRedis.ExpectSet(db.UUIDToString(&project.ID), exc.MustResult(cacheClient.Marshal(&models.RetrieveProviderKeyRow{
					ID:              providerKey.ID,
					ModelVendor:     models.ModelVendorOPENAI,
					EncryptedApiKey: providerKey.EncryptedApiKey,
				})), time.Hour/2).
					SetVal("OK")

				stream, streamErr := client.TestPrompt(outgoingContext, &ptesting.PromptTestRequest{
					TemplateVariables:         templateVariables,
					ExpectedTemplateVariables: expectedTemplateVariables,
					ProjectId:                 projectID,
					ApplicationId:             applicationID,
					ModelParameters:           *modelParameters,
					ModelVendor:               string(models.ModelVendorOPENAI),
					ModelType:                 string(models.ModelTypeGpt432k),
					ProviderPromptMessages:    *promptMessages,
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
				assert.Equal(t, "1", chunks[0].Content)
				assert.Equal(t, "2", chunks[1].Content)
				assert.Equal(t, "3", chunks[2].Content)
				assert.Equal(t, "done", *chunks[3].FinishReason)
				assert.NotNil(t, chunks[3].PromptRequestRecordId)
			})
		})
	})
}
