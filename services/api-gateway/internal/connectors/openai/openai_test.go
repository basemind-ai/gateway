package openai_test

import (
	"context"
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/connectors/openai"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"google.golang.org/grpc"
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
	client := openai.New(
		"",
		grpc.WithContextDialer(
			func(context.Context, string) (net.Conn, error) {
				return listener.Dial()
			},
		),
	)

	return client, mockService
}
