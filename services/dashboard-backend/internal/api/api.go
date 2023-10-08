package api

import (
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
)

var validate = validator.New(validator.WithRequiredStructEnabled())

func RegisterHandlers(mux *chi.Mux) {
	mux.Route("/v1", func(router chi.Router) {
		router.Route(UserAccountEndpoint, func(userAccountRouter chi.Router) {
			userAccountRouter.Get("/", HandleRetrieveUserData)
		})

		router.Route(ProjectsListEndpoint, func(projectsRouter chi.Router) {
			router.Post("/", HandleCreateProject)
			router.Get("/", HandleRetrieveProjects)
		})

		router.Route(ProjectDetailEndpoint, func(projectsRouter chi.Router) {
			projectsRouter.Use(middleware.PathParameterMiddleware("projectId"))
			projectsRouter.Patch("/", HandleUpdateProject)
			projectsRouter.Delete("/", HandleDeleteProject)
		})

		router.Route(ProjectSetDefaultEndpoint, func(projectsRouter chi.Router) {
			projectsRouter.Use(middleware.PathParameterMiddleware("projectId"))
			projectsRouter.Patch("/", HandleSetDefaultProject)
		})

		router.Route(ProjectUserDetailEndpoint, func(projectsUserRouter chi.Router) {
			projectsUserRouter.Use(middleware.PathParameterMiddleware("projectId", "userId"))
			projectsUserRouter.Post("/", HandleAddUserToProject)
			projectsUserRouter.Patch("/", HandleChangeUserProjectPermission)
			projectsUserRouter.Delete("/", HandleRemoveUserFromProject)
		})

		router.Route(ApplicationsListEndpoint, func(applicationsRouter chi.Router) {
			applicationsRouter.Use(middleware.PathParameterMiddleware("projectId"))
			applicationsRouter.Post("/", HandleCreateApplication)
		})

		router.Route(ApplicationDetailEndpoint, func(applicationsRouter chi.Router) {
			applicationsRouter.Use(middleware.PathParameterMiddleware("projectId", "applicationId"))
			applicationsRouter.Get("/", HandleRetrieveApplication)
			applicationsRouter.Patch("/", HandleUpdateApplication)
			applicationsRouter.Delete("/", HandleDeleteApplication)
		})

		router.Route(ApplicationTokensListEndpoint, func(applicationTokensRouter chi.Router) {
			applicationTokensRouter.Use(
				middleware.PathParameterMiddleware("projectId", "applicationId"),
			)
			applicationTokensRouter.Post("/", HandleCreateApplicationToken)
			applicationTokensRouter.Get("/", HandleRetrieveApplicationTokens)
		})

		router.Route(ApplicationTokenDetailEndpoint, func(applicationTokensRouter chi.Router) {
			applicationTokensRouter.Use(
				middleware.PathParameterMiddleware("projectId", "applicationId", "tokenId"),
			)
			applicationTokensRouter.Delete("/", HandleDeleteApplicationToken)
		})

		router.Route(PromptConfigListEndpoint, func(promptConfigRouter chi.Router) {
			promptConfigRouter.Use(middleware.PathParameterMiddleware("projectId", "applicationId"))
			promptConfigRouter.Post("/", HandleCreatePromptConfig)
			promptConfigRouter.Get("/", HandleRetrievePromptConfigs)
		})

		router.Route(PromptConfigDetailEndpoint, func(promptConfigRouter chi.Router) {
			promptConfigRouter.Use(
				middleware.PathParameterMiddleware("projectId", "applicationId", "promptConfigId"),
			)
			promptConfigRouter.Patch("/", HandleUpdatePromptConfig)
			promptConfigRouter.Delete("/", HandleDeletePromptConfig)
		})

		router.Route(PromptConfigSetDefaultEndpoint, func(promptConfigRouter chi.Router) {
			promptConfigRouter.Use(
				middleware.PathParameterMiddleware("projectId", "applicationId", "promptConfigId"),
			)
			promptConfigRouter.Patch("/", HandleSetApplicationDefaultPromptConfig)
		})
	})
}
