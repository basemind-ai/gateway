package router

import (
	"net/http"

	"github.com/basemind-ai/backend-services/go-shared/rediscache"
	"github.com/go-chi/chi/v5"
	chiMiddlewares "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httplog"
	"github.com/rs/zerolog/log"
)

type Options[T any] struct {
	Environment      string
	ServiceName      string
	Config           T
	RegisterHandlers func(mux *chi.Mux, config T)
	Cache            *rediscache.Client
	Middlewares      []func(next http.Handler) http.Handler
}

func New[T interface{}](opts Options[T]) chi.Router {
	router := chi.NewRouter()

	if opts.Environment != "test" {
		router.Use(chiMiddlewares.RequestID)
		router.Use(chiMiddlewares.RealIP)
		router.Use(httplog.RequestLogger(log.With().Str("service", opts.ServiceName).Logger()))
		router.Use(chiMiddlewares.Recoverer)
		router.Use(chiMiddlewares.Heartbeat("/health-check"))
	}

	for _, middleware := range opts.Middlewares {
		router.Use(middleware)
	}

	opts.RegisterHandlers(router, opts.Config)
	return router
}
