package service_test

import (
	"context"
	"errors"
	"fmt"
	"github.com/basemind-ai/monorepo/gen/go/gateway/v1"
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/connectors"
	openaitestutils "github.com/basemind-ai/monorepo/services/api-gateway/connectors/openai/testutils"
	"github.com/basemind-ai/monorepo/services/api-gateway/service"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	dbTestUtils "github.com/basemind-ai/monorepo/shared/go/db/testutils"
	"github.com/basemind-ai/monorepo/shared/go/grpcutils"
	"github.com/basemind-ai/monorepo/shared/go/grpcutils/testutils"
	"github.com/basemind-ai/monorepo/shared/go/jwtutils"
	"github.com/basemind-ai/monorepo/shared/go/rediscache"
	"github.com/go-redis/cache/v9"
	"github.com/go-redis/redismock/v9"
	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/auth"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
	"io"
	"net"
	"testing"
	"time"
)

const JWTSecret = "ABC123"

func CreateOpenAIService(t *testing.T) *openaitestutils.MockOpenAIService {
	mockService := &openaitestutils.MockOpenAIService{T: t}
	listener := testutils.CreateTestServer[openaiconnector.OpenAIServiceServer](t, openaiconnector.RegisterOpenAIServiceServer, mockService)

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

func CreateGatewayServiceClient(t *testing.T) gateway.APIGatewayServiceClient {
	listener := testutils.CreateTestServer[gateway.APIGatewayServiceServer](t, gateway.RegisterAPIGatewayServiceServer, service.New(),
		// we are using the same auth middleware as we do on main.go in this test
		grpc.ChainUnaryInterceptor(
			auth.UnaryServerInterceptor(grpcutils.NewAuthHandler(JWTSecret).HandleAuth),
		),
		grpc.ChainStreamInterceptor(
			auth.StreamServerInterceptor(grpcutils.NewAuthHandler(JWTSecret).HandleAuth),
		),
	)
	return testutils.CreateTestClient[gateway.APIGatewayServiceClient](t, listener, gateway.NewAPIGatewayServiceClient)
}

func CreateTestCache(t *testing.T, applicationId string) (*cache.Cache, redismock.ClientMock) {
	redisDb, mockRedis := redismock.NewClientMock()

	rediscache.SetClient(cache.New(&cache.Options{
		Redis: redisDb,
	}))

	cacheClient := rediscache.GetClient()

	t.Cleanup(func() {
		redisDb.Del(context.TODO(), applicationId)
	})

	return cacheClient, mockRedis
}

func CreateApplicationPromptConfig(t *testing.T) (*datatypes.ApplicationPromptConfig, string) {
	dbTestUtils.CreateTestDB(t)

	project, projectCreateErr := db.GetQueries().CreateProject(context.TODO(), db.CreateProjectParams{
		Name:        "test",
		Description: "test",
	})

	assert.NoError(t, projectCreateErr)

	systemMessage := "You are a helpful chat bot."
	userMessage := "This is what the user asked for: {userInput}"

	application, applicationCreateErr := db.GetQueries().CreateApplication(context.TODO(), db.CreateApplicationParams{
		ProjectID:   project.ID,
		Name:        "test",
		Description: "test",
	})

	assert.NoError(t, applicationCreateErr)

	promptConfig, promptConfigCreateErr := db.GetQueries().CreatePromptConfig(context.TODO(), db.CreatePromptConfigParams{
		ModelType:         db.ModelTypeGpt35Turbo,
		ModelVendor:       db.ModelVendorOPENAI,
		ModelParameters:   openaitestutils.CreateModelParameters(t),
		PromptMessages:    openaitestutils.CreatePromptMessages(t, systemMessage, userMessage),
		TemplateVariables: []string{"userInput"},
		IsActive:          true,
		ApplicationID:     application.ID,
	})

	assert.NoError(t, promptConfigCreateErr)

	return &datatypes.ApplicationPromptConfig{
		ApplicationID:    fmt.Sprintf("%x-%x-%x-%x-%x", application.ID.Bytes[0:4], application.ID.Bytes[4:6], application.ID.Bytes[6:8], application.ID.Bytes[8:10], application.ID.Bytes[10:16]),
		ApplicationData:  application,
		PromptConfigData: promptConfig,
	}, fmt.Sprintf("%x-%x-%x-%x-%x", application.ID.Bytes[0:4], application.ID.Bytes[4:6], application.ID.Bytes[6:8], application.ID.Bytes[8:10], application.ID.Bytes[10:16])
}

func TestIntegration(t *testing.T) {
	openaiService := CreateOpenAIService(t)
	applicationPromptConfig, applicationId := CreateApplicationPromptConfig(t)

	jwtToken, jwtCreateErr := jwtutils.CreateJWT(time.Minute, []byte(JWTSecret), applicationId)
	assert.NoError(t, jwtCreateErr)

	t.Run("E2E Test RequestPromptConfig", func(t *testing.T) {
		client := CreateGatewayServiceClient(t)
		cacheClient, mockRedis := CreateTestCache(t, applicationId)

		expectedResponseContent := []string{"userInput"}

		expectedCacheValue, marshalErr := cacheClient.Marshal(applicationPromptConfig)
		assert.NoError(t, marshalErr)

		mockRedis.ExpectGet(applicationId).RedisNil()
		mockRedis.ExpectSet(applicationId, expectedCacheValue, time.Hour/2).SetVal("OK")

		outgoingContext := metadata.AppendToOutgoingContext(context.TODO(), "authorization", fmt.Sprintf("bearer %s", jwtToken))

		firstResponse, firstResponseErr := client.RequestPromptConfig(outgoingContext, &gateway.PromptConfigRequest{})
		assert.NoError(t, firstResponseErr)
		assert.Equal(t, expectedResponseContent, firstResponse.ExpectedPromptVariables)

		mockRedis.ExpectGet(applicationId).SetVal(string(expectedCacheValue))

		secondResponse, secondResponseErr := client.RequestPromptConfig(outgoingContext, &gateway.PromptConfigRequest{})
		assert.NoError(t, secondResponseErr)
		assert.Equal(t, expectedResponseContent, secondResponse.ExpectedPromptVariables)
	})

	t.Run("E2E Test RequestPrompt", func(t *testing.T) {
		client := CreateGatewayServiceClient(t)
		cacheClient, mockRedis := CreateTestCache(t, applicationId)

		expectedResponseContent := "Response content"

		openaiService.Response = &openaiconnector.OpenAIPromptResponse{
			Content:          expectedResponseContent,
			CompletionTokens: 2,
			TotalTokens:      2,
			PromptTokens:     2,
		}

		expectedCacheValue, marshalErr := cacheClient.Marshal(applicationPromptConfig)
		assert.NoError(t, marshalErr)

		mockRedis.ExpectGet(applicationId).RedisNil()
		mockRedis.ExpectSet(applicationId, expectedCacheValue, time.Hour/2).SetVal("OK")

		outgoingContext := metadata.AppendToOutgoingContext(context.TODO(), "authorization", fmt.Sprintf("bearer %s", jwtToken))

		firstResponse, firstResponseErr := client.RequestPrompt(outgoingContext, &gateway.PromptRequest{
			TemplateVariables: map[string]string{"userInput": "abc"},
		})
		assert.NoError(t, firstResponseErr)
		assert.Equal(t, expectedResponseContent, firstResponse.Content)

		mockRedis.ExpectGet(applicationId).SetVal(string(expectedCacheValue))

		secondResponse, secondResponseErr := client.RequestPrompt(outgoingContext, &gateway.PromptRequest{
			TemplateVariables: map[string]string{"userInput": "abc"},
		})
		assert.NoError(t, secondResponseErr)
		assert.Equal(t, expectedResponseContent, secondResponse.Content)
	})

	t.Run("E2E Test RequestStreamingPrompt", func(t *testing.T) {
		client := CreateGatewayServiceClient(t)
		cacheClient, mockRedis := CreateTestCache(t, applicationId)

		finishReason := "done"

		openaiService.Stream = []*openaiconnector.OpenAIStreamResponse{
			{Content: "1"},
			{Content: "2"},
			{Content: "3", FinishReason: &finishReason},
		}

		expectedCacheValue, marshalErr := cacheClient.Marshal(applicationPromptConfig)
		assert.NoError(t, marshalErr)

		mockRedis.ExpectGet(applicationId).RedisNil()
		mockRedis.ExpectSet(applicationId, expectedCacheValue, time.Hour/2).SetVal("OK")

		outgoingContext := metadata.AppendToOutgoingContext(context.TODO(), "authorization", fmt.Sprintf("bearer %s", jwtToken))

		stream, streamErr := client.RequestStreamingPrompt(outgoingContext, &gateway.PromptRequest{
			TemplateVariables: map[string]string{"userInput": "abc"},
		})
		assert.NoError(t, streamErr)

		chunks := make([]string, 0)

		for {
			chunk, receiveErr := stream.Recv()
			if receiveErr != nil {
				if !errors.Is(receiveErr, io.EOF) {
					assert.Failf(t, "Received unexpected error:", "%v", receiveErr)
				}
				break
			}
			chunks = append(chunks, chunk.Content)
		}

		assert.Equal(t, []string{"1", "2", "3"}, chunks)
	})
}
