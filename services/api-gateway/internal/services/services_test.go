package services_test

import (
	"context"
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/connectors"
	"github.com/basemind-ai/monorepo/shared/go/rediscache"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/go-redis/cache/v9"
	"github.com/go-redis/redismock/v9"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"net"
	"testing"
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
