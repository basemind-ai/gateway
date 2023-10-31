package router_test

import (
	"github.com/basemind-ai/monorepo/shared/go/router"
	"github.com/go-chi/chi/v5/middleware"
	"net/http"
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

		assert.Equal(t, len(r.Middlewares()), 4)
	})

	t.Run("Does not set middleware when environment is 'test'", func(t *testing.T) {
		r := router.New(router.Options{
			Environment:      "test",
			ServiceName:      "test-service",
			RegisterHandlers: func(mux *chi.Mux) {},
		})

		assert.Equal(t, len(r.Middlewares()), 0)
	})

	t.Run("allows setting middlewares", func(t *testing.T) {
		r := router.New(router.Options{
			Environment:      "test",
			ServiceName:      "test-service",
			RegisterHandlers: func(mux *chi.Mux) {},
			Middlewares: []func(next http.Handler) http.Handler{
				middleware.RealIP,
			},
		})

		assert.Equal(t, len(r.Middlewares()), 1)
	})
}
