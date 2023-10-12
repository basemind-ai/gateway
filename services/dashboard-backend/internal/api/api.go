package api

import (
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"net/http"
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
			subRouter.Post("/", HandleCreateProject)
			subRouter.Get("/", HandleRetrieveProjects)
		})

		router.Route(ProjectDetailEndpoint, func(subRouter chi.Router) {
			subRouter.Use(middleware.PathParameterMiddleware("projectId"))
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodPatch:  adminOnly,
						http.MethodDelete: adminOnly,
					},
				),
			)
			subRouter.Patch("/", HandleUpdateProject)
			subRouter.Delete("/", HandleDeleteProject)
		})

		router.Route(ProjectUserDetailEndpoint, func(subRouter chi.Router) {
			subRouter.Use(middleware.PathParameterMiddleware("projectId", "userId"))
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodPost:   adminOnly,
						http.MethodPatch:  adminOnly,
						http.MethodDelete: adminOnly,
					},
				),
			)
			subRouter.Post("/", HandleAddUserToProject)
			subRouter.Patch("/", HandleChangeUserProjectPermission)
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
						http.MethodGet:    allPermissions,
						http.MethodPatch:  adminOnly,
						http.MethodDelete: adminOnly,
					},
				),
			)
			subRouter.Get("/", HandleRetrieveApplication)
			subRouter.Patch("/", HandleUpdateApplication)
			subRouter.Delete("/", HandleDeleteApplication)
		})

		router.Route(ApplicationTokensListEndpoint, func(subRouter chi.Router) {
			subRouter.Use(
				middleware.PathParameterMiddleware("projectId", "applicationId"),
			)
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodPost: allPermissions,
						http.MethodGet:  allPermissions,
					},
				),
			)
			subRouter.Post("/", HandleCreateApplicationToken)
			subRouter.Get("/", HandleRetrieveApplicationTokens)
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
						http.MethodPost: allPermissions,
						http.MethodGet:  allPermissions,
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
						http.MethodPatch:  adminOnly,
						http.MethodDelete: adminOnly,
					},
				),
			)
			subRouter.Patch("/", HandleUpdatePromptConfig)
			subRouter.Delete("/", HandleDeletePromptConfig)
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
