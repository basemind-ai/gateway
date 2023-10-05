package api

import (
	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
)

var validate = validator.New(validator.WithRequiredStructEnabled())

func RegisterHandlers(mux *chi.Mux) {
	mux.Route("/v1", func(router chi.Router) {
		router.Route(UserAccountEndpoint, func(userAccountRouter chi.Router) {
			userAccountRouter.Get("/", HandleRetrieveUserData)
			userAccountRouter.Patch("/", HandleUpdateUserDefaultProject)
		})

		router.Post(ProjectsListEndpoint, HandleCreateProject)

		router.Route(ProjectDetailEndpoint, func(projectsRouter chi.Router) {
			projectsRouter.Patch("/", HandleUpdateProject)
			projectsRouter.Delete("/", HandleDeleteProject)
		})

		router.Route(ProjectUserDetailEndpoint, func(projectsRouter chi.Router) {
			projectsRouter.Post("/", HandleAddUserToProject)
			projectsRouter.Patch("/", HandleChangeUserProjectPermission)
			projectsRouter.Delete("/", HandleRemoveUserFromProject)
		})

		router.Post(ApplicationsListEndpoint, HandleCreateApplication)

		router.Route(ApplicationDetailEndpoint, func(applicationsRouter chi.Router) {
			applicationsRouter.Get("/", HandleRetrieveApplication)
			applicationsRouter.Patch("/", HandleUpdateApplication)
			applicationsRouter.Delete("/", HandleDeleteApplication)
		})

		router.Route(ApplicationTokensListEndpoint, func(applicationsRouter chi.Router) {
			applicationsRouter.Post("/", HandleCreateApplicationToken)
			applicationsRouter.Get("/", HandleRetrieveApplicationTokens)
			applicationsRouter.Delete("/", HandleDeleteApplicationToken)
		})

		router.Route(PromptConfigListEndpoint, func(promptConfigRouter chi.Router) {
			promptConfigRouter.Post("/", HandleCreatePromptConfig)
			promptConfigRouter.Get("/", HandleRetrievePromptConfigs)
		})

		router.Route(PromptConfigDetailEndpoint, func(promptConfigRouter chi.Router) {
			promptConfigRouter.Patch("/", HandleUpdatePromptConfig)
			promptConfigRouter.Delete("/", HandleDeletePromptConfig)
		})

		router.Patch(PromptConfigSetDefaultEndpoint, HandleSetApplicationDefaultPromptConfig)
	})
}
