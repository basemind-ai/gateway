package openai

import (
	"context"
	"encoding/json"
	openaiconnectorgrpc "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/go-shared/db"
	"google.golang.org/grpc"
)

type Client struct {
	client openaiconnectorgrpc.OpenAIServiceClient
}

func New(serverAddress string, opts ...grpc.DialOption) (*Client, error) {
	conn, dialErr := grpc.Dial(serverAddress, opts...)
	if dialErr != nil {
		return nil, dialErr
	}
	client := openaiconnectorgrpc.NewOpenAIServiceClient(conn)
	return &Client{client: client}, nil
}

func (c *Client) RequestPrompt(ctx context.Context,
	application db.Application,
	userId string,
) (string, error) {
	promptRequest := &openaiconnectorgrpc.O{
		UserId: &userId,
	}
	if err := json.Unmarshal(application.ModelParameters, promptRequest); err != nil {
		return "", err
	}
	if err := json.Unmarshal(application.PromptMessages, &promptRequest.Messages); err != nil {
		return "", err
	}

	promptRequest.UserId = &userId
	response, err := c.client.OpenAIPrompt(ctx)
}
