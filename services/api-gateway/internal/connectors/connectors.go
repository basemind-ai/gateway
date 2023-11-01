package connectors

import (
	"context"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/connectors/openai"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/sethvargo/go-envconfig"
	"google.golang.org/grpc"
)

var (
	openaiConnectorClient *openai.Client
)

type connectorConfig struct {
	OpenAIConnectorAddress string `env:"OPENAI_CONNECTOR_ADDRESS,required"`
}

// ProviderConnector - an interface that must be implemented by all connectors.
type ProviderConnector interface {
	RequestPrompt(
		ctx context.Context,
		requestConfiguration *dto.RequestConfigurationDTO,
		templateVariables map[string]string,
	) dto.PromptResultDTO
	RequestStream(
		ctx context.Context,
		requestConfiguration *dto.RequestConfigurationDTO,
		templateVariables map[string]string,
		channel chan<- dto.PromptResultDTO,
	)
}

// Init - initializes the connectors. This function is called once.
func Init(ctx context.Context, opts ...grpc.DialOption) {
	config := &connectorConfig{}
	exc.Must(envconfig.Process(ctx, config), "failed to process environment variables")
	openaiConnectorClient = openai.New(config.OpenAIConnectorAddress, opts...)
}

// GetProviderConnector - returns the connector for the given provider.
// Panics if the provider is not supported.
func GetProviderConnector(provider models.ModelVendor) ProviderConnector {
	switch provider {
	case models.ModelVendorOPENAI:
		return exc.ReturnNotNil(
			openaiConnectorClient,
			"OpenAI Connector Client was not initialized",
		)
	default:
		panic("Unknown provider")
	}
}
