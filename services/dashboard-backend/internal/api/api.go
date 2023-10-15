package api

import (
	"net/http"

	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
)

var (
	validate       = validator.New(validator.WithRequiredStructEnabled())
	allPermissions = []db.AccessPermissionType{
		db.AccessPermissionTypeMEMBER,
		db.AccessPermissionTypeADMIN,
	}
	adminOnly = []db.AccessPermissionType{db.AccessPermissionTypeADMIN}
)

func RegisterHandlers(mux *chi.Mux) {
	mux.Route("/v1", func(router chi.Router) {
		router.Route(ProjectsListEndpoint, func(subRouter chi.Router) {
			subRouter.Get("/", HandleRetrieveProjects)
			subRouter.Post("/", HandleCreateProject)
		})

		router.Route(ProjectDetailEndpoint, func(subRouter chi.Router) {
			subRouter.Use(middleware.PathParameterMiddleware("projectId"))
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodDelete: adminOnly,
						http.MethodPatch:  adminOnly,
					},
				),
			)
			subRouter.Delete("/", HandleDeleteProject)
			subRouter.Patch("/", HandleUpdateProject)
		})

		router.Route(ProjectAnalyticsEndpoint, func(subRouter chi.Router) {
			subRouter.Use(middleware.PathParameterMiddleware("projectId"))
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodGet: allPermissions,
					},
				),
			)
			subRouter.Get("/", HandleRetrieveProjectAnalytics)
		})

		router.Route(ProjectUserListEndpoint, func(subRouter chi.Router) {
			subRouter.Use(middleware.PathParameterMiddleware("projectId"))
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodGet:   allPermissions,
						http.MethodPatch: adminOnly,
						http.MethodPost:  adminOnly,
					},
				),
			)
			subRouter.Get("/", HandleRetrieveProjectUserAccounts)
			subRouter.Patch("/", HandleChangeUserProjectPermission)
			subRouter.Post("/", HandleAddUserToProject)
		})

		router.Route(ProjectUserDetailEndpoint, func(subRouter chi.Router) {
			subRouter.Use(middleware.PathParameterMiddleware("projectId", "userId"))
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodDelete: adminOnly,
					},
				),
			)
			subRouter.Delete("/", HandleRemoveUserFromProject)
		})

		router.Route(ApplicationsListEndpoint, func(subRouter chi.Router) {
			subRouter.Use(middleware.PathParameterMiddleware("projectId"))
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodPost: allPermissions,
					},
				),
			)
			subRouter.Post("/", HandleCreateApplication)
		})

		router.Route(ApplicationDetailEndpoint, func(subRouter chi.Router) {
			subRouter.Use(middleware.PathParameterMiddleware("projectId", "applicationId"))
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodDelete: adminOnly,
						http.MethodGet:    allPermissions,
						http.MethodPatch:  adminOnly,
					},
				),
			)
			subRouter.Delete("/", HandleDeleteApplication)
			subRouter.Get("/", HandleRetrieveApplication)
			subRouter.Patch("/", HandleUpdateApplication)
		})

		router.Route(ApplicationAnalyticsEndpoint, func(subRouter chi.Router) {
			subRouter.Use(middleware.PathParameterMiddleware("projectId", "applicationId"))
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodGet: allPermissions,
					},
				),
			)
			subRouter.Get("/", HandleRetrieveApplicationAnalytics)
		})

		router.Route(ApplicationTokensListEndpoint, func(subRouter chi.Router) {
			subRouter.Use(
				middleware.PathParameterMiddleware("projectId", "applicationId"),
			)
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodGet:  allPermissions,
						http.MethodPost: allPermissions,
					},
				),
			)
			subRouter.Get("/", HandleRetrieveApplicationTokens)
			subRouter.Post("/", HandleCreateApplicationToken)
		})

		router.Route(ApplicationTokenDetailEndpoint, func(subRouter chi.Router) {
			subRouter.Use(
				middleware.PathParameterMiddleware("projectId", "applicationId", "tokenId"),
			)
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodDelete: adminOnly,
					},
				),
			)
			subRouter.Delete("/", HandleDeleteApplicationToken)
		})

		router.Route(PromptConfigListEndpoint, func(subRouter chi.Router) {
			subRouter.Use(middleware.PathParameterMiddleware("projectId", "applicationId"))
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodGet:  allPermissions,
						http.MethodPost: allPermissions,
					},
				),
			)
			subRouter.Get("/", HandleRetrievePromptConfigs)
			subRouter.Post("/", HandleCreatePromptConfig)
		})

		router.Route(PromptConfigDetailEndpoint, func(subRouter chi.Router) {
			subRouter.Use(
				middleware.PathParameterMiddleware("projectId", "applicationId", "promptConfigId"),
			)
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodDelete: adminOnly,
						http.MethodPatch:  adminOnly,
					},
				),
			)
			subRouter.Delete("/", HandleDeletePromptConfig)
			subRouter.Patch("/", HandleUpdatePromptConfig)
		})

		router.Route(PromptConfigSetDefaultEndpoint, func(subRouter chi.Router) {
			subRouter.Use(
				middleware.PathParameterMiddleware("projectId", "applicationId", "promptConfigId"),
			)
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodPatch: adminOnly,
					},
				),
			)
			subRouter.Patch("/", HandleSetApplicationDefaultPromptConfig)
		})
	})
}
