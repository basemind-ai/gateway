package openai

import (
	"context"
	"errors"
	"fmt"
	"io"

	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/tokenutils"
	"github.com/tiktoken-go/tokenizer"

	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
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
	applicationPromptConfig *datatypes.ApplicationPromptConfig,
	templateVariables map[string]string,
) (string, error) {
	promptRequest, createPromptRequestErr := CreatePromptRequest(
		applicationId,
		applicationPromptConfig.PromptConfigData.ModelType,
		applicationPromptConfig.PromptConfigData.ModelParameters,
		applicationPromptConfig.PromptConfigData.PromptMessages,
		templateVariables,
	)
	if createPromptRequestErr != nil {
		return "", createPromptRequestErr
	}

	response, requestErr := c.client.OpenAIPrompt(ctx, promptRequest)
	if requestErr != nil {
		return "", requestErr
	}

	// Count the total number of tokens utilized for openai prompt
	promptReqTokenCount, tokenizationErr := tokenutils.GetRequestPromptTokenCount(promptRequest.Messages, tokenizer.Cl100kBase)
	if tokenizationErr != nil {
		log.Err(tokenizationErr).Msg("failed to get prompt token count")
	}

	promptResTokenCount, tokenizationErr := tokenutils.GetPromptTokenCount(response.Content, tokenizer.Cl100kBase)
	if tokenizationErr != nil {
		log.Err(tokenizationErr).Msg("failed to get prompt token count")
	}

	log.Debug().Msg(fmt.Sprintf("Total tokens utilized: Request-%d, Response-%d", promptReqTokenCount, promptResTokenCount))
	return response.Content, nil
}

func (c *Client) RequestStream(
	ctx context.Context,
	applicationId string,
	applicationPromptConfig *datatypes.ApplicationPromptConfig,
	templateVariables map[string]string,
	contentChannel chan<- string,
	errChannel chan<- error,
) {
	promptRequest, promptRequestErr := CreatePromptRequest(
		applicationId,
		applicationPromptConfig.PromptConfigData.ModelType,
		applicationPromptConfig.PromptConfigData.ModelParameters,
		applicationPromptConfig.PromptConfigData.PromptMessages,
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

	promptReqTokenCount, tokenizationErr := tokenutils.GetRequestPromptTokenCount(promptRequest.Messages, tokenizer.Cl100kBase)
	if tokenizationErr != nil {
		log.Err(tokenizationErr).Msg("failed to get prompt token count")
	}
	log.Debug().Msg(fmt.Sprintf("Total tokens utilized for request prompt - %d", promptReqTokenCount))

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
		promptResTokenCount, tokenizationErr := tokenutils.GetPromptTokenCount(msg.Content, tokenizer.Cl100kBase)
		if tokenizationErr != nil {
			log.Err(tokenizationErr).Msg("failed to get prompt token count")
		}
		log.Debug().Msg(fmt.Sprintf("Tokens utilized for streaming response-%d", promptResTokenCount))
		contentChannel <- msg.Content
	}
}
