package ws

import (
	"context"
	"errors"
	"fmt"
	prompttesting "github.com/basemind-ai/monorepo/gen/go/prompt_testing/v1"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
	"io"
)

// Client - a handler client for the PromptTesting gRPC service.
type Client struct {
	client prompttesting.PromptTestingServiceClient
}

// New - creates a new PromptTesting gRPC client.
func New(serverAddress string, opts ...grpc.DialOption) (*Client, error) {
	conn, dialErr := grpc.Dial(serverAddress, opts...)
	if dialErr != nil {
		return nil, dialErr
	}

	client := prompttesting.NewPromptTestingServiceClient(conn)
	log.Info().Msg("initialized PromptTesting client")

	return &Client{client: client}, nil
}

// StreamPromptTest - streams a prompt test to the PromptTesting gRPC service.
func (c *Client) StreamPromptTest(
	ctx context.Context,
	applicationID string,
	data dto.PromptConfigTestDTO,
	channel chan<- prompttesting.PromptTestingStreamingPromptResponse,
) error {
	stream, streamErr := c.client.TestPrompt(ctx, &prompttesting.PromptTestRequest{
		ApplicationId:          applicationID,
		PromptConfigId:         data.PromptConfigID,
		ModelVendor:            string(data.ModelVendor),
		ModelType:              string(data.ModelType),
		ModelParameters:        data.ModelParameters,
		ProviderPromptMessages: data.ProviderPromptMessages,
		TemplateVariables:      data.TemplateVariables,
	})
	if streamErr != nil {
		close(channel)
		log.Error().Err(streamErr).Msg("failed to create stream")
		return fmt.Errorf("failed to create stream: %w", streamErr)
	}

	for {
		msg, receiveErr := stream.Recv()

		if receiveErr != nil {
			if !errors.Is(receiveErr, io.EOF) {
				log.Debug().Err(receiveErr).Msg("received stream error")
			}

			break
		}

		channel <- *msg
	}

	return nil
}
