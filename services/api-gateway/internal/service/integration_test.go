package service_test

import (
	"context"
	"errors"
	"fmt"
	"github.com/basemind-ai/monorepo/gen/go/gateway/v1"
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/connectors"
	openaitestutils "github.com/basemind-ai/monorepo/services/api-gateway/internal/connectors/openai/testutils"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/service"
	"github.com/basemind-ai/monorepo/shared/go/grpcutils"
	"github.com/basemind-ai/monorepo/shared/go/jwtutils"
	"github.com/basemind-ai/monorepo/shared/go/rediscache"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
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
	t.Helper()
	mockService := &openaitestutils.MockOpenAIService{T: t}
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

func CreateGatewayServiceClient(t *testing.T) gateway.APIGatewayServiceClient {
	t.Helper()
	listener := testutils.CreateTestGRPCServer[gateway.APIGatewayServiceServer](
		t,
		gateway.RegisterAPIGatewayServiceServer,
		service.New(),
		// we are using the same auth middleware as we do on main.go in this test
		grpc.ChainUnaryInterceptor(
			auth.UnaryServerInterceptor(grpcutils.NewAuthHandler(JWTSecret).HandleAuth),
		),
		grpc.ChainStreamInterceptor(
			auth.StreamServerInterceptor(grpcutils.NewAuthHandler(JWTSecret).HandleAuth),
		),
	)
	return testutils.CreateTestGRPCClient[gateway.APIGatewayServiceClient](
		t,
		listener,
		gateway.NewAPIGatewayServiceClient,
	)
}

func CreateTestCache(
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

func TestIntegration(t *testing.T) {
	openaiService := CreateOpenAIService(t)
	requestConfigurationDTO := createRequestConfigurationDTO(t)

	jwtToken, jwtCreateErr := jwtutils.CreateJWT(
		time.Minute,
		[]byte(JWTSecret),
		requestConfigurationDTO.ApplicationIDString,
	)
	assert.NoError(t, jwtCreateErr)

	t.Run("E2E Test RequestPrompt", func(t *testing.T) {
		client := CreateGatewayServiceClient(t)
		cacheClient, mockRedis := CreateTestCache(t, requestConfigurationDTO.ApplicationIDString)

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

	t.Run("E2E Test RequestStreamingPrompt", func(t *testing.T) {
		client := CreateGatewayServiceClient(t)
		cacheClient, mockRedis := CreateTestCache(t, requestConfigurationDTO.ApplicationIDString)

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

		stream, streamErr := client.RequestStreamingPrompt(outgoingContext, &gateway.PromptRequest{
			TemplateVariables: map[string]string{"userInput": "abc"},
		})
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
}
