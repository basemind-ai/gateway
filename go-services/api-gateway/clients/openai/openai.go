package openai

import (
	"context"
	"encoding/json"
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/go-shared/db"
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
	return &Client{client: client}, nil
}

func (c *Client) RequestPrompt(
	ctx context.Context,
	applicationId string,
	application db.Application,
) (string, error) {
	promptRequest := &openaiconnector.OpenAIPromptRequest{
		Model:         GetModelType(application.ModelType),
		ApplicationId: &applicationId,
	}

	if parametersUnmarshalErr := json.Unmarshal(application.ModelParameters, promptRequest.Parameters); parametersUnmarshalErr != nil {
		return "", parametersUnmarshalErr
	}

	if messagesUnmarshalErr := json.Unmarshal(application.PromptMessages, &promptRequest.Messages); messagesUnmarshalErr != nil {
		return "", messagesUnmarshalErr
	}

	response, requestErr := c.client.OpenAIPrompt(ctx, promptRequest)
	if requestErr != nil {
		return "", requestErr
	}
	return response.Content, nil
}
