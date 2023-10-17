package openai_test

import (
	"context"
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/connectors/openai"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"net"
	"testing"
)

func TestMain(m *testing.M) {
	cleanup := testutils.CreateNamespaceTestDBModule("openai-test")
	defer cleanup()
	m.Run()
}

func CreateClientAndService(t *testing.T) (*openai.Client, *testutils.MockOpenAIService) {
	t.Helper()
	mockService := &testutils.MockOpenAIService{T: t}
	listener := testutils.CreateTestGRPCServer[openaiconnector.OpenAIServiceServer](
		t,
		openaiconnector.RegisterOpenAIServiceServer,
		mockService,
	)
	client, clientErr := openai.New(
		"",
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithContextDialer(
			func(context.Context, string) (net.Conn, error) {
				return listener.Dial()
			},
		),
	)

	assert.NoError(t, clientErr)
	return client, mockService
}
