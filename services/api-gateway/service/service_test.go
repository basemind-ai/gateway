package service_test

import (
	"context"
	"github.com/basemind-ai/monorepo/gen/go/gateway/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/service"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
	"testing"
)

type MockServerStream struct {
	grpc.ServerStream
	Ctx      context.Context
	Response *gateway.StreamingPromptResponse
	Error    error
}

func (m MockServerStream) Context() context.Context {
	if m.Ctx != nil {
		return m.Ctx
	}
	return context.TODO()
}

func (m MockServerStream) Send(response *gateway.StreamingPromptResponse) error {
	m.Response = response //nolint: staticcheck
	return m.Error
}

func TestService(t *testing.T) {
	srv := service.New()
	ctx := context.TODO()
	t.Run("New", func(t *testing.T) {
		assert.IsType(t, service.Server{}, srv)
	})
	t.Run("RequestPromptConfig", func(t *testing.T) {
		t.Run("return err when ApplicationIDContext is not set", func(t *testing.T) {
			_, err := srv.RequestPromptConfig(ctx, nil)
			assert.Errorf(t, err, service.ErrorApplicationIdNotInContext)
		})
	})
	t.Run("RequestPrompt", func(t *testing.T) {
		t.Run("return err when ApplicationIDContext is not set", func(t *testing.T) {
			_, err := srv.RequestPrompt(ctx, nil)
			assert.Errorf(t, err, service.ErrorApplicationIdNotInContext)
		})
	})
	t.Run("RequestStreamingPrompt", func(t *testing.T) {
		t.Run("return err when ApplicationIDContext is not set", func(t *testing.T) {
			err := srv.RequestStreamingPrompt(nil, MockServerStream{})
			assert.Errorf(t, err, service.ErrorApplicationIdNotInContext)
		})
	})
}
