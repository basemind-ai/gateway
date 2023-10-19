package ptestingclient

import (
	"context"
	"errors"
	"fmt"
	"github.com/basemind-ai/monorepo/gen/go/ptesting/v1"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/rs/zerolog/log"
	"github.com/sethvargo/go-envconfig"
	"google.golang.org/grpc"
	"io"
)

var client *Client

// SetClient - sets the PromptTesting gRPC client.
func SetClient(c *Client) {
	client = c
}

// GetClient - gets the PromptTesting gRPC client.
func GetClient() *Client {
	if client == nil {
		panic("client not initialized")
	}
	return client
}

type clientConfig struct {
	APIGatewayAddress string `env:"API_GATEWAY_ADDRESS,required"`
}

// Client - a handler client for the PromptTesting gRPC service.
type Client struct {
	client ptesting.PromptTestingServiceClient
}

// New - creates a new PromptTesting gRPC client.
func New(serverAddress string, opts ...grpc.DialOption) (*Client, error) {
	conn, dialErr := grpc.Dial(serverAddress, opts...)
	if dialErr != nil {
		return nil, dialErr
	}

	client := ptesting.NewPromptTestingServiceClient(conn)
	log.Info().Msg("initialized PromptTesting client")

	return &Client{client: client}, nil
}

// Init - initializes the PromptTesting gRPC client. This function is called once.
func Init(ctx context.Context, opts ...grpc.DialOption) error {
	config := &clientConfig{}
	if envErr := envconfig.Process(ctx, config); envErr != nil {
		return fmt.Errorf("failed to parse env")
	}
	c, err := New(config.APIGatewayAddress, opts...)
	if err != nil {
		return fmt.Errorf("failed to create grpc client")
	}
	SetClient(c)
	return nil
}

// StreamPromptTest - streams a prompt test to the PromptTesting gRPC service.
func (c *Client) StreamPromptTest(
	ctx context.Context,
	applicationID string,
	data dto.PromptConfigTestDTO,
	responseChannel chan<- *ptesting.PromptTestingStreamingPromptResponse,
	errorChannel chan<- error,
) {
	stream, streamErr := c.client.TestPrompt(ctx, &ptesting.PromptTestRequest{
		ApplicationId:          applicationID,
		PromptConfigId:         data.PromptConfigID,
		ModelVendor:            string(data.ModelVendor),
		ModelType:              string(data.ModelType),
		ModelParameters:        data.ModelParameters,
		ProviderPromptMessages: data.ProviderPromptMessages,
		TemplateVariables:      data.TemplateVariables,
	})

	if streamErr != nil {
		log.Error().Err(streamErr).Msg("failed to create stream")
		errorChannel <- fmt.Errorf("failed to create stream: %w", streamErr)

		close(responseChannel)
		close(errorChannel)

		return
	}

	for {
		msg, receiveErr := stream.Recv()

		if receiveErr != nil {
			if !errors.Is(receiveErr, io.EOF) {
				log.Debug().Err(receiveErr).Msg("received stream error")
				errorChannel <- fmt.Errorf("received stream error: %w", streamErr)
			}

			close(responseChannel)
			close(errorChannel)

			break
		}

		responseChannel <- msg
	}
}