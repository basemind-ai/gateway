package connectors_test

import (
	"context"
	"github.com/basemind-ai/monorepo/go-services/api-gateway/connectors"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"testing"
)

func TestGetOpenAIConnectorClientPanicsWithoutAddress(t *testing.T) {
	t.Run("Panic without address", func(t *testing.T) {
		t.Setenv("OPENAI_CONNECTOR_ADDRESS", "localhost:50051")

		assert.Panics(t, func() { connectors.GetOpenAIConnectorClient() })
	})

	t.Run("No panic with address", func(t *testing.T) {
		t.Setenv("OPENAI_CONNECTOR_ADDRESS", "localhost:50051")

		err := connectors.Init(context.TODO(), grpc.WithTransportCredentials(insecure.NewCredentials()))
		assert.NoError(t, err)

		client1 := connectors.GetOpenAIConnectorClient()
		client2 := connectors.GetOpenAIConnectorClient()

		assert.Equal(t, client1, client2)
	})
}
