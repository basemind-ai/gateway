package router_test

import (
	"github.com/basemind-ai/monorepo/shared/go/router"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/stretchr/testify/assert"
)

func TestNew(t *testing.T) {
	t.Run("Sets middlewares when environment is not 'test'", func(t *testing.T) {
		r := router.New(router.Options{
			Environment:      "development",
			ServiceName:      "test-service",
			RegisterHandlers: func(mux *chi.Mux) {},
		})

		assert.Equal(t, len(r.Middlewares()), 5)
	})

	t.Run("Does not set middleware when environment is 'test'", func(t *testing.T) {
		r := router.New(router.Options{
			Environment:      "test",
			ServiceName:      "test-service",
			RegisterHandlers: func(mux *chi.Mux) {},
		})

		assert.Equal(t, len(r.Middlewares()), 0)
	})
}
