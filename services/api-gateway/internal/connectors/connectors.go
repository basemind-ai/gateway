package connectors

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/connectors/openai"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/sethvargo/go-envconfig"
	"google.golang.org/grpc"
)

var (
	openaiConnectorClient *openai.Client
)

type connectorConfig struct {
	OpenAIConnectorAddress string `env:"OPENAI_CONNECTOR_ADDRESS,required"`
}

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

func Init(ctx context.Context, opts ...grpc.DialOption) error {
	config := &connectorConfig{}
	if envErr := envconfig.Process(ctx, config); envErr != nil {
		return fmt.Errorf("failed to process environment variables: %w", envErr)
	}

	openaiClient, openaiClientErr := openai.New(config.OpenAIConnectorAddress, opts...)
	if openaiClientErr != nil {
		return fmt.Errorf("failed to create openai client: %w", openaiClientErr)
	}

	openaiConnectorClient = openaiClient

	return nil
}

func GetProviderConnector(provider db.ModelVendor) ProviderConnector {
	switch provider {
	case db.ModelVendorOPENAI:
		if openaiConnectorClient == nil {
			panic("OpenAI Connector Client was not initialized")
		}
		return openaiConnectorClient
	default:
		panic("Unknown provider")
	}
}
