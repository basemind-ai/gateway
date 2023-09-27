package api

import (
	"github.com/go-chi/chi/v5"
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
	})
}
