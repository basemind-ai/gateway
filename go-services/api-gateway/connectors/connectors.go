package connectors

import (
	"context"
	"github.com/basemind-ai/monorepo/go-services/api-gateway/connectors/openai"
	"github.com/sethvargo/go-envconfig"
	"sync"
)

var (
	once                  sync.Once
	config                ConnectorConfig
	openaiConnectorClient *openai.Client
)

type ConnectorConfig struct {
	OpenAIConnectorAddress string
}

func Init(ctx context.Context) error {
	var err error

	once.Do(func() {
		if envErr := envconfig.Process(ctx, config); envErr != nil {
			err = envErr
			return
		}

		openaiClient, openaiClientErr := openai.New(config.OpenAIConnectorAddress)
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
