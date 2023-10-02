package testutils

import (
	"context"
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/stretchr/testify/assert"
	"testing"
)

type MockOpenAIService struct {
	openaiconnector.UnimplementedOpenAIServiceServer
	Context         context.Context
	Error           error
	ExpectedRequest *openaiconnector.OpenAIPromptRequest
	Response        *openaiconnector.OpenAIPromptResponse
	Stream          []*openaiconnector.OpenAIStreamResponse
	T               *testing.T
}

func (m MockOpenAIService) OpenAIPrompt(
	_ context.Context,
	request *openaiconnector.OpenAIPromptRequest,
) (*openaiconnector.OpenAIPromptResponse, error) {
	if m.Error != nil {
		return nil, m.Error
	}

	assert.NotNil(m.T, m.Response)

	if m.ExpectedRequest != nil {
		assert.Equal(m.T, m.ExpectedRequest.Model, request.Model)
		assert.Equal(m.T, m.ExpectedRequest.ApplicationId, request.ApplicationId)

		for i, message := range m.ExpectedRequest.Messages {
			assert.Equal(m.T, message.Role, request.Messages[i].Role)
			assert.Equal(m.T, message.Content, request.Messages[i].Content)
		}

		assert.Equal(m.T, m.ExpectedRequest.Parameters, request.Parameters)
	}

	return m.Response, nil
}

func (m MockOpenAIService) OpenAIStream(
	request *openaiconnector.OpenAIPromptRequest,
	stream openaiconnector.OpenAIService_OpenAIStreamServer,
) error {
	if m.Error != nil {
		return m.Error
	}

	assert.NotNil(m.T, m.Stream)

	if m.ExpectedRequest != nil {
		assert.Equal(m.T, m.ExpectedRequest.Model, request.Model)
		assert.Equal(m.T, m.ExpectedRequest.ApplicationId, request.ApplicationId)

		for i, message := range m.ExpectedRequest.Messages {
			assert.Equal(m.T, message.Role, request.Messages[i].Role)
			assert.Equal(m.T, message.Content, request.Messages[i].Content)
		}

		assert.Equal(m.T, m.ExpectedRequest.Parameters, request.Parameters)
	}

	for _, response := range m.Stream {
		_ = stream.Send(response)
	}

	return nil
}
