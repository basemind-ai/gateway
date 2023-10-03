package connectors

import (
	"context"
	"github.com/basemind-ai/monorepo/services/api-gateway/connectors/openai"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/sethvargo/go-envconfig"
	"google.golang.org/grpc"
	"sync"
)

var (
	once                  sync.Once
	openaiConnectorClient *openai.Client
)

type ConnectorConfig struct {
	OpenAIConnectorAddress string `env:"OPENAI_CONNECTOR_ADDRESS,required"`
}

type ProviderConnector interface {
	RequestPrompt(
		ctx context.Context,
		applicationId string,
		requestConfiguration *datatypes.RequestConfiguration,
		templateVariables map[string]string,
	) datatypes.PromptResult
	RequestStream(
		ctx context.Context,
		applicationId string,
		requestConfiguration *datatypes.RequestConfiguration,
		templateVariables map[string]string,
		channel chan<- datatypes.PromptResult,
	)
}

func Init(ctx context.Context, opts ...grpc.DialOption) error {
	var err error

	once.Do(func() {
		config := &ConnectorConfig{}
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
