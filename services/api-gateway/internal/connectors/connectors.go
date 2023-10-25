package connectors

import (
	"context"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/connectors/openai"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/sethvargo/go-envconfig"
	"google.golang.org/grpc"
	"sync"
)

var (
	once                  sync.Once
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

func Init(ctx context.Context, opts ...grpc.DialOption) {
	var err error

	once.Do(func() {
		config := &connectorConfig{}
		if envErr := envconfig.Process(ctx, config); envErr != nil {
			err = envErr

			return
		}

		openaiClient, openaiClientErr := openai.New(config.OpenAIConnectorAddress, opts...)
		if openaiClientErr != nil {
			err = openaiClientErr

			return
		}
		openaiConnectorClient = openaiClient
	})

	return err
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
