package cohere_test

import (
	"context"
	cohereconnector "github.com/basemind-ai/monorepo/gen/go/cohere/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/connectors/cohere"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"net"
	"testing"
)

func TestMain(m *testing.M) {
	cleanup := testutils.CreateNamespaceTestDBModule("cohere-test")
	defer cleanup()
	m.Run()
}

func CreateClientAndService(t *testing.T) (*cohere.Client, *testutils.MockCohereService) {
	t.Helper()
	mockService := &testutils.MockCohereService{T: t}
	listener := testutils.CreateTestGRPCServer[cohereconnector.CohereServiceServer](
		t,
		cohereconnector.RegisterCohereServiceServer,
		mockService,
	)
	client := cohere.New(
		"",
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithContextDialer(
			func(context.Context, string) (net.Conn, error) {
				return listener.Dial()
			},
		),
	)

	return client, mockService
}
