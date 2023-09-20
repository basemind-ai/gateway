package openai

import (
	"context"
	"errors"
	"io"

	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/go-shared/db"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
)

type Client struct {
	client openaiconnector.OpenAIServiceClient
}

func New(serverAddress string, opts ...grpc.DialOption) (*Client, error) {
	conn, dialErr := grpc.Dial(serverAddress, opts...)
	if dialErr != nil {
		return nil, dialErr
	}
	client := openaiconnector.NewOpenAIServiceClient(conn)
	log.Info().Msg("initialized OpenAI connector")
	return &Client{client: client}, nil
}

func (c *Client) RequestPrompt(
	ctx context.Context,
	applicationId string,
	application db.Application,
	templateVariables map[string]string,
) (string, error) {
	promptRequest, createPromptRequestErr := CreatePromptRequest(
		applicationId,
		application.ModelType,
		application.ModelParameters,
		application.PromptMessages,
		templateVariables,
	)
	if createPromptRequestErr != nil {
		return "", createPromptRequestErr
	}

	response, requestErr := c.client.OpenAIPrompt(ctx, promptRequest)
	if requestErr != nil {
		return "", requestErr
	}
	// TODO handle token related logic here by using the response token properties.
	return response.Content, nil
}

func (c *Client) RequestStream(
	ctx context.Context,
	applicationId string,
	application db.Application,
	templateVariables map[string]string,
	contentChannel chan<- string,
	errChannel chan<- error,
) {
	promptRequest, promptRequestErr := CreatePromptRequest(
		applicationId,
		application.ModelType,
		application.ModelParameters,
		application.PromptMessages,
		templateVariables,
	)
	if promptRequestErr != nil {
		errChannel <- promptRequestErr
		return
	}

	stream, streamErr := c.client.OpenAIStream(ctx, promptRequest)
	if streamErr != nil {
		errChannel <- promptRequestErr
		return
	}

	for {
		msg, receiveErr := stream.Recv()
		if receiveErr != nil {
			if !errors.Is(receiveErr, io.EOF) {
				errChannel <- receiveErr
			}
			close(contentChannel)
			return
		}

		// TODO handle token related logic here
		contentChannel <- msg.Content
	}
}
