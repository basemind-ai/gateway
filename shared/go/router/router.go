package router

import (
	"github.com/go-chi/cors"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httplog"
	"github.com/rs/zerolog/log"
)

// Options is a struct that contains options for creating a router.
type Options struct {
	Environment      string
	ServiceName      string
	RegisterHandlers func(mux *chi.Mux)
	Middlewares      []func(next http.Handler) http.Handler
}

// New creates a new chi Router.
func New(opts Options) chi.Router {
	router := chi.NewRouter()

	if opts.Environment != "test" {
		router.Use(chimiddleware.RealIP)
		router.Use(cors.Handler(cors.Options{
			AllowedOrigins: []string{"*"},
			AllowedMethods: []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
			AllowedHeaders: []string{"*"},
			MaxAge:         3600,
			Debug:          opts.Environment == "development",
		}))
		router.Use(httplog.RequestLogger(log.With().Str("service", opts.ServiceName).Logger()))
		router.Use(chimiddleware.Heartbeat("/health-check"))
	}

	for _, middleware := range opts.Middlewares {
		router.Use(middleware)
	}

	opts.RegisterHandlers(router)
	return router
}
