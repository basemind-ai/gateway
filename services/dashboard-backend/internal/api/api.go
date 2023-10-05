package api

import (
	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
)

var (
	validate = validator.New(validator.WithRequiredStructEnabled())
)

func RegisterHandlers(mux *chi.Mux) {
	mux.Route("/v1", func(router chi.Router) {
		router.Get(ProjectsListEndpoint, HandleRetrieveUserProjects)
		router.Post(ApplicationsListEndpoint, HandleCreateApplication)

		router.Route(ApplicationDetailEndpoint, func(applicationsRouter chi.Router) {
			applicationsRouter.Get("/", HandleRetrieveApplication)
			applicationsRouter.Patch("/", HandleUpdateApplication)
			applicationsRouter.Delete("/", HandleDeleteApplication)
		})

		router.Route(PromptConfigListEndpoint, func(promptConfigRouter chi.Router) {
			promptConfigRouter.Post("/", HandleCreatePromptConfig)
			promptConfigRouter.Get("/", HandleRetrievePromptConfigs)
		})

		router.Route(PromptConfigDetailEndpoint, func(promptConfigRouter chi.Router) {
			promptConfigRouter.Patch("/", HandleUpdatePromptConfig)
			promptConfigRouter.Delete("/", HandleDeletePromptConfig)
		})
	})
}
