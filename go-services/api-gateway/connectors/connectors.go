package connectors

import (
	"context"
	"github.com/basemind-ai/monorepo/go-services/api-gateway/connectors/openai"
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

func GetOpenAIConnectorClient() *openai.Client {
	if openaiConnectorClient == nil {
		panic("OpenAI Connector Client was not initialized")
	}
	return openaiConnectorClient
}
