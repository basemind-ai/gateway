package service_test

import (
	"context"
	"testing"

	"github.com/basemind-ai/monorepo/go-services/api-gateway/service"
	"github.com/stretchr/testify/assert"
)

func TestService(t *testing.T) {
	t.Run("New", func(t *testing.T) {
		assert.IsTypef(t, service.Server{}, service.New(), "New() should return a pointer to a Server")
	})
	t.Run("RequestPromptConfig", func(t *testing.T) {
		s := service.New()
		_, err := s.RequestPromptConfig(context.TODO(), nil)
		assert.Error(t, err)
	})
	t.Run("RequestPrompt", func(t *testing.T) {
		s := service.New()
		_, err := s.RequestPrompt(context.TODO(), nil)
		assert.Error(t, err)
	})
	t.Run("RequestStreamingPrompt", func(t *testing.T) {
		s := service.New()
		err := s.RequestStreamingPrompt(nil, nil)
		assert.Error(t, err)
	})
}
