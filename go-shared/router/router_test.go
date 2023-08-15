package router_test

import (
	"testing"

	"github.com/basemind-ai/monorepo/go-shared/router"
	"github.com/go-chi/chi/v5"
	"github.com/stretchr/testify/assert"
)

func TestNew(t *testing.T) {
	t.Run("Sets middlewares when environment is not 'test'", func(t *testing.T) {
		r := router.New(router.Options[any]{
			Environment:      "development",
			ServiceName:      "test-service",
			Config:           nil,
			RegisterHandlers: func(mux *chi.Mux, config any) {},
			Cache:            nil,
		})

		assert.Equal(t, len(r.Middlewares()), 5)
	})

	t.Run("Does not set middleware when environment is 'test'", func(t *testing.T) {
		r := router.New(router.Options[any]{
			Environment:      "test",
			ServiceName:      "test-service",
			Config:           nil,
			RegisterHandlers: func(mux *chi.Mux, config any) {},
			Cache:            nil,
		})

		assert.Equal(t, len(r.Middlewares()), 0)
	})
}
