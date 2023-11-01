package connectors_test

import (
	"context"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/connectors"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"testing"
)

func TestGetOpenAIConnectorClientPanicsWithoutAddress(t *testing.T) {
	t.Run("GetProviderConnector", func(t *testing.T) {
		t.Run("panics when not initialized", func(t *testing.T) {
			testutils.UnsetTestEnv(t)

			assert.Panics(t, func() { connectors.GetProviderConnector(models.ModelVendorOPENAI) })
		})

		t.Run("panics when transport security is not set", func(t *testing.T) {
			t.Setenv("OPENAI_CONNECTOR_ADDRESS", "localhost:50051")

			assert.Panics(t, func() {
				connectors.Init(
					context.TODO(),
				)

				connectors.GetProviderConnector(models.ModelVendorOPENAI)
			})
		})

		t.Run("does not panic when initialized", func(t *testing.T) {
			t.Setenv("OPENAI_CONNECTOR_ADDRESS", "localhost:50051")

			connectors.Init(
				context.TODO(),
				grpc.WithTransportCredentials(insecure.NewCredentials()),
			)
			assert.NotPanics(
				t,
				func() { connectors.GetProviderConnector(models.ModelVendorOPENAI) },
			)
		})

		t.Run("panics for unknown provider", func(t *testing.T) {
			t.Setenv("OPENAI_CONNECTOR_ADDRESS", "localhost:50051")

			connectors.Init(
				context.TODO(),
				grpc.WithTransportCredentials(insecure.NewCredentials()),
			)

			assert.Panics(
				t,
				func() { connectors.GetProviderConnector(models.ModelVendor("unknown")) },
			)
		})
	})
}
